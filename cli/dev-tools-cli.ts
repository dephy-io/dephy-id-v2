import fs from 'node:fs'

import { Command } from "@commander-js/extra-typings"
import { Address, address, generateKeyPairSigner, getAddressCodec, getBase16Encoder, IInstruction } from "gill"
import { loadKeypairSignerFromFile } from 'gill/node'
import * as splToken from 'gill/programs/token'

import * as dephyId from '../clients/dephy-id/js/src/index.js';
import * as dephyIdStakePool from '../clients/dephy-id-stake-pool/js/src/index.js';
import { createSolanaContext } from "./common.js"


type Device = {
  created_at: number,
  owner: string,
  pubkey: string,
  status: number,
  updated_at: number,
  uptime: number,
}

type DeviceOwner = {
  solana_address: Address,
  testnet1_worker_address?: Address,
}

const b16Encoder = getBase16Encoder()
const addressCodec = getAddressCodec()

const cli = new Command()
  .name('dev-tools-cli')
  .version('0.1.0')
  .description('devtools')


cli.command('dump-devices')
  .requiredOption('-e, --endpoint <endpoint>', 'dephy workers endpoint')
  .requiredOption('-o, --outfile <outfile>', 'output file')
  .option('--limit <limit>', 'fetch batch size', '1000')
  .action(async (options) => {
    try {
      const batchLimit = Number(options.limit)
      let offset = 0
      let allDevices: Device[] = []
      let keepFetching = true

      console.log(`Fetching devices in batches of ${batchLimit}...`)

      while (keepFetching) {
        const url = new URL(options.endpoint)
        url.searchParams.set('limit', String(batchLimit))
        url.searchParams.set('offset', String(offset))

        console.log(`Fetching page with offset ${offset}...`)

        const response = await Bun.fetch(url.toString())

        const pageData = await response.json() as { devices?: Device[] }
        const fetchedDevices = pageData.devices || []

        if (fetchedDevices.length > 0) {
          allDevices = allDevices.concat(fetchedDevices)
        }

        if (fetchedDevices.length < batchLimit) {
          keepFetching = false
        } else {
          offset += batchLimit
        }
      }

      console.log(`Fetched a total of ${allDevices.length} devices.`)

      const lines = ['DevicePubkey,OwnerPubkey']

      for (const device of allDevices) {
        const devicePubkey = addressCodec.decode(b16Encoder.encode(device.pubkey))
        const owner = JSON.parse(device.owner) as DeviceOwner
        lines.push(`${devicePubkey},${owner.solana_address}`)
      }

      const csv = lines.join('\n')
      fs.writeFileSync(options.outfile, csv)
      console.log(`Successfully wrote ${allDevices.length} devices to ${options.outfile}.`)

    } catch (error) {
      console.error('An error occurred during the device dumping process:', error)
    }
  })



cli.command('create-dev-devices')
  .requiredOption('-k, --keypair <path>', 'Path to the fee payer keypair', '~/.config/solana/id.json')
  .requiredOption('-u --url <urlOrMoniker>', 'RPC endpoint url or moniker', 'localnet')
  .requiredOption('--csv <csvFile>', 'CSV file for all devices and owners')
  .requiredOption('-p, --product <product>', 'Product asset address')
  .option('-v, --vendor <vendor>', 'Path to vendor keypair file')
  .option('--owner <owner>', 'override owner address')
  .action(async (options) => {
    const { keypair, url: urlOrMoniker } = options

    const ctx = await createSolanaContext({
      keypair,
      urlOrMoniker,
    })

    const vendor = options.vendor ? await loadKeypairSignerFromFile(options.vendor) : ctx.feePayer
    const productAsset = address(options.product)
    const ownerOverrided = options.owner ? address(options.owner) : undefined

    const csvFile = fs.readFileSync(options.csv, { encoding: 'utf8' })
    const devicesAndOwners = csvFile.trim().split('\n').slice(1).map((line) => {
      const [device, owner] = line.split(',')

      return {
        deviceSeed: addressCodec.encode(address(device)),
        owner: ownerOverrided || address(owner)
      } as { deviceSeed: Uint8Array, owner: Address }
    })

    let ixs: IInstruction[] = []
    for (let i = 0; i < devicesAndOwners.length; i++) {
      const { deviceSeed, owner } = devicesAndOwners[i]
      const deviceAssetPda = await dephyId.findDeviceAssetPda({
        productAsset,
        deviceSeed,
      })
      const deviceAsset = await ctx.rpc.getAccountInfo(deviceAssetPda[0], { encoding: 'base64' }).send()

      if (deviceAsset.value) {
        console.log('skip', deviceAssetPda[0])
        i++
      } else {
        const pubkey = deviceAssetPda[0]
        const name = pubkey.substring(0, 4) + '...' + pubkey.substring(pubkey.length - 4)
        ixs.push(
          await dephyId.getCreateDeviceInstructionAsync({
            payer: ctx.feePayer,
            mintAuthority: vendor,
            owner,
            productAsset,
            seed: deviceSeed,
            name,
            uri: `https://workers.dephy.id/${pubkey}`,
          })
        )
      }

      if (ixs.length >= 4) {
        const signature = await ctx.sendAndConfirmIxs(ixs)
        console.log('Transaction signature:', signature)
        ixs = []
      }
    }

    if (ixs.length > 0) {
      const signature = await ctx.sendAndConfirmIxs(ixs)
      console.log('Transaction signature:', signature)
    }
  })


cli.command('stake-nfts')
  .requiredOption('-k, --keypair <path>', 'Path to the fee payer keypair', '~/.config/solana/id.json')
  .requiredOption('-u --url <urlOrMoniker>', 'RPC endpoint url or moniker', 'http://127.0.0.1:8899')
  .requiredOption('--stake-pool <address>', 'Address of the stake pool')
  .requiredOption('--csv <csvFile>', 'CSV file for all devices and owners')
  .option('--amount <amount>', 'Amount of tokens for each deposit (ui amount)')
  .action(async (options) => {
    const { keypair, url: urlOrMoniker } = options

    const ctx = await createSolanaContext({
      keypair,
      urlOrMoniker,
    })

    const stakePoolAddress = address(options.stakePool)
    const stakePool = await dephyIdStakePool.fetchStakePoolAccount(ctx.rpc, stakePoolAddress)
    const productAsset = stakePool.data.config.collection

    const stakeTokenMint = await splToken.fetchMint(ctx.rpc, stakePool.data.config.stakeTokenMint)
    const amount = options.amount ?
      splToken.tokenUiAmountToAmount(Number(options.amount), stakeTokenMint.data.decimals) :
      undefined;

    const userStakeTokenAccount = (await splToken.findAssociatedTokenPda({
      mint: stakeTokenMint.address,
      owner: ctx.feePayer.address,
      tokenProgram: stakeTokenMint.programAddress,
    }))[0]

    const csvFile = fs.readFileSync(options.csv, { encoding: 'utf8' })
    const devicesAndOwners = csvFile.trim().split('\n').slice(1).map((line) => {
      const [device, owner] = line.split(',')

      return {
        deviceSeed: addressCodec.encode(address(device)),
        owner: address(owner)
      } as { deviceSeed: Uint8Array, owner: Address }
    })

    let ixs: IInstruction[] = []
    for (let i = 0; i < devicesAndOwners.length; i++) {
      const { deviceSeed, owner } = devicesAndOwners[i]
      const deviceAssetPda = await dephyId.findDeviceAssetPda({
        productAsset,
        deviceSeed,
      })

      if (owner != ctx.feePayer.address) {
        console.log('skip', deviceAssetPda[0])
        i++
      } else {
        const nftStakeSigner = await generateKeyPairSigner()

        ixs.push(
          await dephyIdStakePool.getCreateNftStakeInstructionAsync({
            stakePool: stakePoolAddress,
            nftStake: nftStakeSigner,
            stakeAuthority: ctx.feePayer,
            depositAuthority: ctx.feePayer.address,
            mplCoreAsset: deviceAssetPda[0],
            mplCoreCollection: productAsset,
            payer: ctx.feePayer,
          })
        )

        if (amount) {
          ixs.push(
            await dephyIdStakePool.getDepositTokenInstructionAsync({
              nftStake: nftStakeSigner.address,
              stakePool: stakePoolAddress,
              user: ctx.feePayer,
              stakeTokenMint: stakeTokenMint.address,
              stakeTokenAccount: stakePool.data.stakeTokenAccount,
              userStakeTokenAccount: userStakeTokenAccount,
              payer: ctx.feePayer,
              amount,
            })
          )
        }
      }

      if (ixs.length >= 6) {
        const signature = await ctx.sendAndConfirmIxs(ixs)
        console.log('Transaction signature:', signature)
        ixs = []
      }
    }

    if (ixs.length > 0) {
      const signature = await ctx.sendAndConfirmIxs(ixs)
      console.log('Transaction signature:', signature)
    }
  })


await cli.parseAsync()
