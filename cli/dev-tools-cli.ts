import fs from 'node:fs'

import { Command } from "@commander-js/extra-typings"
import { dasApi } from '@metaplex-foundation/digital-asset-standard-api'
import { das } from '@metaplex-foundation/mpl-core-das';
import { AssetResult } from '@metaplex-foundation/mpl-core-das/dist/src/types.js'
import { publicKey } from '@metaplex-foundation/umi'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import {
  Address, address, generateKeyPairSigner, getAddressCodec,
  getBase16Encoder, getBase58Decoder, getBase64Encoder,
  type Base58EncodedBytes, IInstruction, ReadonlyUint8Array
} from "gill"
import { loadKeypairSignerFromFile } from 'gill/node'
import * as splToken from 'gill/programs/token'

import * as dephyId from '../clients/dephy-id/js/src/index.js';
import * as dephyIdStakePool from '../clients/dephy-id-stake-pool/js/src/index.js';
import * as mplCore from '../deps/mpl-core/js/src/index.js'
import { createSolanaContext, getProgramIds } from "./common.js"


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
  .option('--only-online', 'only output online devices', false)
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

      const lines = ['DeviceSeed,OwnerPubkey']

      for (const device of allDevices) {
        if (options.onlyOnline && device.status !== 2) {
          continue
        }

        const deviceSeed = addressCodec.decode(b16Encoder.encode(device.pubkey))
        const owner = JSON.parse(device.owner) as DeviceOwner
        lines.push(`${deviceSeed},${owner.solana_address}`)
      }

      const csv = lines.join('\n')
      fs.writeFileSync(options.outfile, csv)
      console.log(`Successfully wrote ${allDevices.length} devices to ${options.outfile}.`)

    } catch (error) {
      console.error('An error occurred during the device dumping process:', error)
    }
  })


cli.command('dump-devices-das')
  .description('Dump devices from DAS, output format: DeviceAddress,DeviceSeed,OwnerPubkey')
  .requiredOption('-u --url <urlOrMoniker>', 'RPC endpoint url or moniker', 'localnet')
  .requiredOption('-p, --product <product>', 'Product asset address')
  .requiredOption('--owner <owner>', 'Owner address')
  .requiredOption('--outfile <outfile>', 'Output file')
  .option('--only-unfrozen', 'Only output unfrozen devices', false)
  .action(async (options) => {
    const { url: urlOrMoniker } = options
    const umi = createUmi(urlOrMoniker).use(dasApi())

    const collection = publicKey(options.product)
    const owner = publicKey(options.owner)

    const devices: AssetResult[] = []

    let cursor: string | undefined = undefined
    let keepFetching = true

    while (keepFetching) {
      const result = await das.searchAssets(umi, {
        owner,
        grouping: ['collection', collection],
        before: cursor,
      })

      for (const asset of result) {
        devices.push(asset)

        cursor = asset.publicKey
      }

      if (result.length === 0) {
        keepFetching = false
      }
    }

    const lines = ['DeviceAddress,DeviceSeed,OwnerPubkey']

    for (const device of devices) {
      const seed = device.attributes.attributeList.find(({ key }) => key === 'Seed')?.value
      if (options.onlyUnfrozen) {
        if (device.permanentFreezeDelegate?.frozen) {
          console.log('frozen', device.publicKey)
          continue
        }
      }
      lines.push(`${device.publicKey},${seed},${owner}`)
    }

    const csv = lines.join('\n')
    fs.writeFileSync(options.outfile, csv)
    console.log(`Successfully wrote ${lines.length - 1} devices to ${options.outfile}.`)
  })


cli.command('create-dev-devices')
  .description('Create devices from CSV file, format: DeviceSeed[,OwnerPubkey]')
  .requiredOption('-k, --keypair <path>', 'Path to the fee payer keypair', '~/.config/solana/id.json')
  .requiredOption('-u --url <urlOrMoniker>', 'RPC endpoint url or moniker', 'localnet')
  .requiredOption('--csv <csvFile>', 'CSV file for all devices and owners')
  .requiredOption('-p, --product <product>', 'Product asset address')
  .option('-v, --vendor <vendor>', 'Path to vendor keypair file')
  .option('--owner <owner>', 'override owner address')
  .option('--interval <interval>', 'interval between transactions', '1000')
  .option('--batch <batch>', 'batch size', '4')
  .option('--skip <skip>', 'skip lines', '0')
  .action(async (options) => {
    const { keypair, url: urlOrMoniker } = options
    const interval = Number(options.interval)
    const batch = Number(options.batch)
    const skip = Number(options.skip)

    const ctx = await createSolanaContext({
      keypair,
      urlOrMoniker,
    })

    const vendor = options.vendor ? await loadKeypairSignerFromFile(options.vendor) : ctx.feePayer
    const productAsset = address(options.product)
    const ownerOverrided = options.owner ? address(options.owner) : undefined

    const csvFile = fs.readFileSync(options.csv, { encoding: 'utf8' })
    const devicesAndOwners: { deviceAddress: Address, base58deviceAddress: string, deviceSeed: ReadonlyUint8Array, owner: Address }[] = []

    for (const line of csvFile.trim().split('\n').slice(1)) {
      const [deviceSeedStr, owner] = line.split(',')
      const deviceSeed = addressCodec.encode(address(deviceSeedStr))

      const deviceAssetPda = await dephyId.findDeviceAssetPda({
        productAsset,
        deviceSeed,
      })

      devicesAndOwners.push({
        deviceAddress: deviceAssetPda[0],
        base58deviceAddress: deviceSeedStr,
        deviceSeed,
        owner: ownerOverrided || address(owner)
      })
    }

    let ixs: IInstruction[] = []
    console.log('skip', skip)
    for (let i = skip; i < devicesAndOwners.length; i++) {
      const { deviceAddress, base58deviceAddress, deviceSeed, owner } = devicesAndOwners[i]
      const deviceAsset = await ctx.rpc.getAccountInfo(deviceAddress, { encoding: 'base64' }).send()

      if (deviceAsset.value) {
        console.log('skip', deviceAddress)
      } else {
        // const name = deviceAddress.substring(0, 4) + '...' + deviceAddress.substring(deviceAddress.length - 4)
        const name = `${base58deviceAddress.slice(0, 8)}`
        ixs.push(
          await dephyId.getCreateDeviceInstructionAsync({
            payer: ctx.feePayer,
            mintAuthority: vendor,
            owner,
            productAsset,
            seed: deviceSeed,
            name,
            uri: `https://workers.dephy.id/${base58deviceAddress}`,
          })
        )
        console.log('create', deviceAddress)
      }

      if (ixs.length >= batch) {
        console.log('send', ixs.length)
        const signature = await ctx.sendAndConfirmIxs(ixs)
        console.log('Transaction signature:', signature, i)
        ixs = []

        await Bun.sleep(interval)
      }
    }

    if (ixs.length > 0) {
      const signature = await ctx.sendAndConfirmIxs(ixs)
      console.log('Transaction signature:', signature)
    }
  })


cli.command('stake-nfts')
  .description('Stake NFTs from CSV file, format: DeviceAddress,OwnerPubkey,Amount')
  .requiredOption('-k, --keypair <path>', 'Path to the fee payer keypair', '~/.config/solana/id.json')
  .requiredOption('-u --url <urlOrMoniker>', 'RPC endpoint url or moniker', 'http://127.0.0.1:8899')
  .requiredOption('--stake-pool <address>', 'Address of the stake pool')
  .requiredOption('--csv <csvFile>', 'CSV file for all devices and owners')
  .option('--amount <amount>', 'Override amount of tokens for each deposit (ui amount)')
  .option('--check', 'Check the owner and if the devices are already staked', false)
  .option('--skip <skip>', 'skip lines', '0')
  .action(async (options) => {
    const { keypair, url: urlOrMoniker } = options
    const skip = Number(options.skip)

    const ctx = await createSolanaContext({
      keypair,
      urlOrMoniker,
    })

    const stakePoolAddress = address(options.stakePool)
    const stakePool = await dephyIdStakePool.fetchStakePoolAccount(ctx.rpc, stakePoolAddress)
    const productAsset = stakePool.data.config.collection

    const stakeTokenMint = await splToken.fetchMint(ctx.rpc, stakePool.data.config.stakeTokenMint)
    const overrideAmount = options.amount ?
      splToken.tokenUiAmountToAmount(Number(options.amount), stakeTokenMint.data.decimals) :
      undefined;

    const [userStakeTokenAccount] = (await splToken.findAssociatedTokenPda({
      mint: stakeTokenMint.address,
      owner: ctx.feePayer.address,
      tokenProgram: stakeTokenMint.programAddress,
    }))

    const csvFile = fs.readFileSync(options.csv, { encoding: 'utf8' })
    const devicesAndOwners: { deviceAddress: Address, owner: Address, amount: bigint | undefined }[] = []

    for (const line of csvFile.trim().split('\n').slice(1)) {
      const [deviceAddress, owner, uiAmount] = line.split(',')
      const amount = uiAmount ? splToken.tokenUiAmountToAmount(Number(uiAmount), stakeTokenMint.data.decimals) : undefined;

      devicesAndOwners.push({
        deviceAddress: address(deviceAddress),
        owner: address(owner),
        amount: overrideAmount || amount,
      })
    }

    let ixs: IInstruction[] = []
    for (let i = skip; i < devicesAndOwners.length; i++) {
      const { deviceAddress, owner, amount } = devicesAndOwners[i]

      if (options.check) {
        const asset = await mplCore.fetchAssetAccount(ctx.rpc, deviceAddress)

        if (asset.data.base.owner != ctx.feePayer.address) {
          console.log('skip not owner', deviceAddress, asset.data.base.owner)
          continue
        }

        if (asset.data.plugins.freezeDelegate?.frozen) {
          console.log('skip frozen', deviceAddress)
          continue
        }
      } else {
        if (owner != ctx.feePayer.address) {
          console.log('skip', deviceAddress)
          continue
        }
      }

      const nftStakeSigner = await generateKeyPairSigner()

      ixs.push(
        await dephyIdStakePool.getCreateNftStakeInstructionAsync({
          stakePool: stakePoolAddress,
          nftStake: nftStakeSigner,
          stakeAuthority: ctx.feePayer,
          depositAuthority: ctx.feePayer.address,
          mplCoreAsset: deviceAddress,
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

      if (ixs.length >= 6) {
        const signature = await ctx.sendAndConfirmIxs(ixs)
        console.log('Transaction signature:', signature, i)
        ixs = []
      }
    }

    if (ixs.length > 0) {
      const signature = await ctx.sendAndConfirmIxs(ixs)
      console.log('Transaction signature:', signature)
    }
  })


cli.command('batch-transfer')
  .description('Transfer NFTs from CSV file, format: DeviceAddress,DestinationAddress')
  .requiredOption('-k, --keypair <path>', 'Path to the fee payer keypair', '~/.config/solana/id.json')
  .requiredOption('-u --url <urlOrMoniker>', 'RPC endpoint url or moniker', 'http://127.0.0.1:8899')
  .requiredOption('--csv <csvFile>', 'CSV file for all devices and dest')
  .requiredOption('-p, --product <product>', 'Product asset address')
  .option('--dest <dest>', 'override dest address')
  .option('--skip <skip>', 'skip lines', '0')
  .option('--batch <batch>', 'batch size', '22')
  .action(async (options) => {
    const { keypair, url: urlOrMoniker } = options
    const batch = Number(options.batch)
    const skip = Number(options.skip)

    const ctx = await createSolanaContext({
      keypair,
      urlOrMoniker,
    })

    const productAsset = address(options.product)
    const destOverrided = options.dest ? address(options.dest) : undefined

    const csvFile = fs.readFileSync(options.csv, { encoding: 'utf8' })
    const devicesAndDest = csvFile.trim().split('\n').slice(1).map((line) => {
      const [deviceAddress, dest] = line.split(',')

      return {
        deviceAddress: address(deviceAddress),
        dest: destOverrided || address(dest)
      } as { deviceAddress: Address, dest: Address }
    })

    const productAccount = await mplCore.fetchCollectionAccount(ctx.rpc, productAsset)
    const hasPermanentTransferAuthority = productAccount.data.plugins.permanentTransferDelegate?.authority?.address == ctx.feePayer.address
    console.log('hasPermanentTransferAuthority', hasPermanentTransferAuthority, devicesAndDest.length)
    console.log('skip', skip)

    let ixs: IInstruction[] = []
    let last = 0
    for (let i = skip; i < devicesAndDest.length; i++) {
      const { deviceAddress, dest } = devicesAndDest[i]
      const deviceAsset = await mplCore.fetchAssetAccount(ctx.rpc, deviceAddress)

      if (deviceAsset.data.base.owner == dest || (!hasPermanentTransferAuthority && deviceAsset.data.base.owner != ctx.feePayer.address)) {
        console.log('skip', deviceAddress)
      } else {
        console.log('transfer', deviceAddress)
        ixs.push(
          mplCore.getTransferV1Instruction({
            asset: deviceAddress,
            collection: productAsset,
            payer: ctx.feePayer,
            newOwner: dest,
            authority: ctx.feePayer,
          })
        )
        last = i
      }

      if (ixs.length >= batch || (i - last > 50 && ixs.length > 0)) {
        const signature = await ctx.sendAndConfirmIxs(ixs)
        console.log('Transaction signature:', signature, i)
        ixs = []
      }
    }

    if (ixs.length > 0) {
      const signature = await ctx.sendAndConfirmIxs(ixs)
      console.log('Transaction signature:', signature)
    }
  })


cli.command('batch-adjust')
  .description('Adjust deposits in batch')
  .requiredOption('-k, --keypair <path>', 'Path to the fee payer keypair', '~/.config/solana/id.json')
  .requiredOption('-u --url <urlOrMoniker>', 'RPC endpoint url or moniker', 'http://127.0.0.1:8899')
  .requiredOption('--stake-pool <address>', 'Address of the stake pool')
  .requiredOption('--csv <csvFile>', 'CSV file for all devices and owners, format: NftStakeAddress,Amount')
  .option('--mainnet', 'Use mainnet program IDs', false)
  .option('--amount <amount>', 'Override amount of tokens for each deposit (ui amount)')
  .option('--batch <batch>', 'batch size', '6')
  .option('--dry-run', 'Do not send transactions; only print planned actions', false)
  .action(async (options) => {
    const { keypair, url: urlOrMoniker, mainnet, dryRun } = options
    const batch = Number(options.batch)
    const { dephyIdStakePoolProgramId } = getProgramIds(!!mainnet)

    const ctx = await createSolanaContext({
      keypair,
      urlOrMoniker,
    })

    const stakePoolAddress = address(options.stakePool)
    const stakePool = await dephyIdStakePool.fetchStakePoolAccount(ctx.rpc, stakePoolAddress)

    const stakeTokenMint = await splToken.fetchMint(ctx.rpc, stakePool.data.config.stakeTokenMint)
    const overrideAmount = options.amount ?
      splToken.tokenUiAmountToAmount(Number(options.amount), stakeTokenMint.data.decimals) :
      undefined;

    const [userStakeTokenAccount] = (await splToken.findAssociatedTokenPda({
      mint: stakeTokenMint.address,
      owner: ctx.feePayer.address,
      tokenProgram: stakeTokenMint.programAddress,
    }))

    const csvFile = fs.readFileSync(options.csv, { encoding: 'utf8' })
    const devicesAndOwners: { nftStakeAddress: Address, amount: bigint | undefined }[] = []

    for (const line of csvFile.trim().split('\n').slice(1)) {
      const [nftStakeAddress, uiAmount] = line.split(',')
      const amount = overrideAmount || (uiAmount ? splToken.tokenUiAmountToAmount(Number(uiAmount), stakeTokenMint.data.decimals) : undefined);

      devicesAndOwners.push({
        nftStakeAddress: address(nftStakeAddress),
        amount,
      })
    }

    console.log('devicesAndOwners', devicesAndOwners.length)

    let ixs: IInstruction[] = []
    for (let i = 0; i < devicesAndOwners.length; i++) {
      const { nftStakeAddress, amount: targetAmount } = devicesAndOwners[i]

      const [userStakeAddress] = await dephyIdStakePool.findUserStakeAccountPda({
        nftStake: nftStakeAddress,
        user: ctx.feePayer.address,
      }, { programAddress: dephyIdStakePoolProgramId })

      const userStakeAccount = await dephyIdStakePool.fetchMaybeUserStakeAccount(ctx.rpc, userStakeAddress)
      let amount = targetAmount

      if (userStakeAccount.exists) {
        if (targetAmount > userStakeAccount.data.amount) {
          amount = targetAmount - userStakeAccount.data.amount
          if (dryRun) {
            console.log('deposit', nftStakeAddress, amount)
          }
          ixs.push(
            await dephyIdStakePool.getDepositTokenInstructionAsync({
              stakePool: stakePoolAddress,
              nftStake: nftStakeAddress,
              user: ctx.feePayer,
              stakeTokenMint: stakeTokenMint.address,
              stakeTokenAccount: stakePool.data.stakeTokenAccount,
              userStakeTokenAccount: userStakeTokenAccount,
              payer: ctx.feePayer,
              amount,
            }, {
              programAddress: dephyIdStakePoolProgramId
            })
          )
        } else if (targetAmount < userStakeAccount.data.amount) {
          amount = userStakeAccount.data.amount - targetAmount
          if (dryRun) {
            console.log('withdraw', nftStakeAddress, amount)
          }
          ixs.push(
            await dephyIdStakePool.getWithdrawInstructionAsync({
              stakePool: stakePoolAddress,
              nftStake: nftStakeAddress,
              user: ctx.feePayer,
              stakeTokenMint: stakeTokenMint.address,
              stakeTokenAccount: stakePool.data.stakeTokenAccount,
              userStakeTokenAccount: userStakeTokenAccount,
              payer: ctx.feePayer,
              amount,
            }, {
              programAddress: dephyIdStakePoolProgramId
            })
          )
        } else {
          console.log('same amount, skip', nftStakeAddress)
        }
      } else {
        if (amount > 0n) {
          if (dryRun) {
            console.log('new deposit', nftStakeAddress, amount)
          }
          ixs.push(
            await dephyIdStakePool.getDepositTokenInstructionAsync({
              stakePool: stakePoolAddress,
              nftStake: nftStakeAddress,
              user: ctx.feePayer,
              stakeTokenMint: stakeTokenMint.address,
              stakeTokenAccount: stakePool.data.stakeTokenAccount,
              userStakeTokenAccount: userStakeTokenAccount,
              payer: ctx.feePayer,
              amount,
            }, {
              programAddress: dephyIdStakePoolProgramId
            })
          )
        } else {
          console.log('skip zero', nftStakeAddress)
        }
      }

      if (ixs.length >= batch) {
        if (dryRun) {
          console.log('DRY RUN send batch', ixs.length)
        } else {
          const signature = await ctx.sendAndConfirmIxs(ixs)
          console.log('Transaction signature:', signature, i)
        }
        ixs = []
      }
    }

    if (ixs.length > 0) {
      if (dryRun) {
        console.log('DRY RUN send final batch', ixs.length)
      } else {
        const signature = await ctx.sendAndConfirmIxs(ixs)
        console.log('Transaction signature:', signature)
      }
    }
  })


cli.command('calc-dodp')
  .description('Calculate DODP adjustment plan')
  .requiredOption('-k, --keypair <path>', 'Path to the fee payer keypair', '~/.config/solana/id.json')
  .requiredOption('-u --url <urlOrMoniker>', 'RPC endpoint url or moniker', 'http://127.0.0.1:8899')
  .requiredOption('--stake-pool <address>', 'Address of the stake pool')
  .option('--mainnet', 'Use mainnet program IDs', false)
  .option('--top-x <topX>', 'Compute top X nftStake addresses by score', '100')
  .option('--below-y <belowY>', 'Consider all entries ranked below rank Y by score', '1000')
  .requiredOption('--total-tokens <amount>', 'Total tokens (UI) to distribute among selected users')
  .option('--user <address>', 'User address to evaluate existing deposits (defaults to fee payer)')
  .action(async (options) => {
    const { mainnet } = options
    const { dephyIdProgramId, dephyIdStakePoolProgramId } = getProgramIds(mainnet)

    // fetch all scores
    const DEPHY_API_URL = 'https://mainnet-tokenomic.dephy.dev'

    const batch = 500
    const allScores: {
      worker_pubkey: string
      uptime_120h: number
      uptime_720h: number
      self_staking_avg_7d: number
      total_staking_avg_7d: number
      score: number
      date: string
      created_at: string
      updated_at: string
      deviceSeed?: Uint8Array
    }[] = []

    let offset = 0
    while (true) {
      const url = new URL(`/api/v1/scores/weekly`, DEPHY_API_URL)
      url.searchParams.set('offset', String(offset))
      url.searchParams.set('limit', String(batch))

      const res = await Bun.fetch(url.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
      })

      const json = await res.json()
      const page = (json.data as { scores?: any[]; total?: number }) ?? { scores: [], total: 0 }

      const transformed = (page.scores ?? []).map((s) => {
        const deviceSeedRO = b16Encoder.encode(s.worker_pubkey)
        const deviceSeed = new Uint8Array(deviceSeedRO as any)
        const workerBase58 = addressCodec.decode(deviceSeed)
        return { ...s, worker_pubkey: workerBase58, deviceSeed }
      })

      allScores.push(...transformed)

      if (transformed.length < batch) break
      offset += batch
    }

    console.error(`Fetched ${allScores.length} device scores for the latest day`)

    const { keypair, url: urlOrMoniker } = options
    const ctx = await createSolanaContext({ keypair, urlOrMoniker })

    const stakePoolAddress = address(options.stakePool)
    const stakePool = await dephyIdStakePool.fetchStakePoolAccount(ctx.rpc, stakePoolAddress)
    const collection = stakePool.data.config.collection

    // NFT Stakes for pool
    const discriminatorNftStake = getBase58Decoder().decode(dephyIdStakePool.NFT_STAKE_ACCOUNT_DISCRIMINATOR)
    const rawNftStakeAccounts = await ctx.rpc.getProgramAccounts(
      dephyIdStakePoolProgramId,
      {
        encoding: 'base64',
        filters: [
          {
            memcmp: {
              encoding: 'base58',
              offset: 0n,
              bytes: discriminatorNftStake as unknown as Base58EncodedBytes,
            }
          },
          {
            memcmp: {
              encoding: 'base58',
              offset: 8n,
              bytes: stakePoolAddress as unknown as Base58EncodedBytes,
            }
          }
        ]
      }
    ).send()

    const nftStakes = rawNftStakeAccounts.map((account) => {
      const data = getBase64Encoder().encode(account.account.data[0])
      return {
        pubkey: account.pubkey,
        account: dephyIdStakePool.getNftStakeAccountDecoder().decode(data),
      }
    })

    console.error(`Fetched ${nftStakes.length} NFT stake accounts for pool ${stakePoolAddress}`)

    const deviceToAssetEntries = await Promise.all(
      allScores.map(async (s) => {
        const [assetAddress] = await dephyId.findDeviceAssetPda({
          productAsset: collection,
          deviceSeed: s.deviceSeed,
        }, {
          programAddress: dephyIdProgramId,
        })
        return [s.worker_pubkey, assetAddress] as const
      })
    )
    const deviceToAsset = Object.fromEntries(
      deviceToAssetEntries.filter(([, a]) => !!a) as [string, Address][]
    ) as Record<string, Address>

    const assetToNftStake: Record<string, { pubkey: Address, account: any }> = {}
    for (const ns of nftStakes) {
      assetToNftStake[String(ns.account.nftTokenAccount)] = ns
    }

    type RankedStake = {
      seed: string
      nftStakeAddress?: Address
      assetAddress?: Address
      score: number
    }

    const rankedStakes: RankedStake[] = []
    for (const s of allScores) {
      const asset = deviceToAsset[s.worker_pubkey]
      const nftStake = asset ? assetToNftStake[String(asset)] : undefined
      rankedStakes.push({
        seed: s.worker_pubkey,
        nftStakeAddress: nftStake?.pubkey,
        assetAddress: asset,
        score: s.score,
      })
    }

    const nftStakeAddressesInScores = new Set<Address>()
    for (const r of rankedStakes) {
      if (r.nftStakeAddress) nftStakeAddressesInScores.add(r.nftStakeAddress)
    }

    const sortedAll = rankedStakes.slice().sort((a, b) => b.score - a.score)
    const allLines = ['rank,score,seed,assetAddress,nftStakeAddress']
    for (let i = 0; i < sortedAll.length; i++) {
      const r = sortedAll[i]
      allLines.push(
        [i + 1, r.score, r.seed, r.assetAddress ?? '', r.nftStakeAddress ?? ''].join(',')
      )
    }
    const allCsv = allLines.join('\n')
    const outAll = 'dodp-all.csv'
    fs.writeFileSync(outAll, allCsv)

    const topX = Number(options.topX)
    const belowY = Number(options.belowY)
    if (Number.isNaN(topX) || Number.isNaN(belowY)) {
      console.error('Invalid top-x or below-y: must be numbers')
      process.exit(1)
    }
    if (belowY < topX) {
      console.error(`Invalid range: below-y (${belowY}) must be >= top-x (${topX})`)
      process.exit(1)
    }
    const present = rankedStakes.filter(j => !!j.nftStakeAddress)
    const sortedDesc = present.sort((a, b) => b.score - a.score)

    const top = sortedDesc.slice(0, topX)
    const bottom = sortedDesc.slice(belowY)

    console.error(`Wrote full ranked ${sortedAll.length} rows to ${outAll}`)
    console.error(`Computed top ${top.length} and bottom ${bottom.length} groups`)

    const targetUser: Address = options.user ? address(options.user) : ctx.feePayer.address

    const discriminatorUserStake = getBase58Decoder().decode(dephyIdStakePool.USER_STAKE_ACCOUNT_DISCRIMINATOR)
    const userStakeAccounts = await ctx.rpc.getProgramAccounts(
      dephyIdStakePoolProgramId,
      {
        encoding: 'base64',
        filters: [
          {
            memcmp: {
              encoding: 'base58',
              offset: 0n,
              bytes: discriminatorUserStake as unknown as Base58EncodedBytes,
            }
          },
          {
            memcmp: {
              encoding: 'base58',
              offset: 8n + 32n + 32n,
              bytes: targetUser as unknown as Base58EncodedBytes,
            }
          }
        ]
      }
    ).send()

    const userStakeAccountDecoder = dephyIdStakePool.getUserStakeAccountDecoder()
    const userNftStakesWithDeposit = new Set<Address>()
    for (const acc of userStakeAccounts) {
      const data = getBase64Encoder().encode(acc.account.data[0])
      const ua = userStakeAccountDecoder.decode(data)
      if (ua.amount > 0n) {
        userNftStakesWithDeposit.add(ua.nftStake)
      }
    }

    const between = sortedDesc.slice(topX, belowY)
    const betweenWithDeposit: typeof between = []
    for (const r of between) {
      if (r.nftStakeAddress && userNftStakesWithDeposit.has(r.nftStakeAddress)) {
        betweenWithDeposit.push(r)
      }
    }

    const counted = [...top, ...betweenWithDeposit]
    const totalTokensUi = Number(options.totalTokens)
    const avgUi = counted.length > 0 ? Math.trunc(totalTokensUi / counted.length) : 0

    const planMap = new Map<Address, number>()

    const betweenWithoutDeposit = between.filter(r => !betweenWithDeposit.includes(r))
    for (const r of bottom) {
      if (r.nftStakeAddress) {
        const key = r.nftStakeAddress
        if (planMap.has(key)) {
          console.warn('dup', key, planMap.get(key), 0)
        }
        console.log('below y', key)
        planMap.set(key, 0)
      }
    }

    for (const r of betweenWithoutDeposit) {
      if (r.nftStakeAddress) {
        const key = r.nftStakeAddress
        if (planMap.has(key)) {
          console.warn('dup', key, planMap.get(key), avgUi)
        }
        console.log('between xy and no prev deposit', key)
        planMap.set(key, avgUi)
      }
    }

    for (const key of userNftStakesWithDeposit) {
      if (!nftStakeAddressesInScores.has(key)) {
        if (planMap.has(key)) {
          console.warn('dup', key, planMap.get(key), 0)
        }
        console.log('prev deposit but has no score', key)
        planMap.set(key, 0)
      }
    }

    for (const r of counted) {
      if (r.nftStakeAddress) {
        if (planMap.has(r.nftStakeAddress)) {
          console.warn('dup', r.nftStakeAddress, planMap.get(r.nftStakeAddress), avgUi)
        }
        planMap.set(r.nftStakeAddress, avgUi)
      }
    }

    const planLines = ['NftStakeAddress,Amount']
    const sortedEntries = Array.from(planMap.entries()).sort((a, b) => a[1] - b[1])
    for (const [addr, amount] of sortedEntries) {
      planLines.push(`${addr},${amount}`)
    }

    const planCsv = planLines.join('\n')
    const outPlan = 'dodp-plan.csv'
    fs.writeFileSync(outPlan, planCsv)
    console.error(`Wrote plan (${counted.length} counted, avg=${avgUi}) to ${outPlan}`)
  })


await cli.parseAsync()
