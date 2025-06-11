import fs from 'node:fs'

import { Command } from "@commander-js/extra-typings"
import { Address, address, getAddressCodec, getBase16Encoder, IInstruction, KeyPairSigner } from "gill"
import { loadKeypairSignerFromFile } from 'gill/node'

import * as dephyId from '../clients/dephy-id/js/src/index.js';
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


function getCreateDevice({
  payer, vendor, productAsset, seed, owner, name, uri
}: {
  payer: KeyPairSigner,
  vendor: KeyPairSigner,
  productAsset: Address,
  seed: Uint8Array,
  owner: Address,
  name: string,
  uri: string,
}) {
  return dephyId.getCreateDeviceInstructionAsync({
    name,
    owner,
    payer,
    productAsset,
    seed,
    uri,
    mintAuthority: vendor,
  })
}


cli.command('create-dev-devices')
  .requiredOption('-k, --keypair <path>', 'Path to the fee payer keypair', '~/.config/solana/id.json')
  .requiredOption('-u --url <urlOrMoniker>', 'RPC endpoint url or moniker', 'localnet')
  .requiredOption('--csv <csvFile>', 'CSV file for all devices and owners')
  .requiredOption('-p, --product <product>', 'Product asset address')
  .option('-v, --vendor <vendor>', 'Path to vendor keypair file')
  .action(async (options) => {
    const { keypair, url: urlOrMoniker } = options

    const ctx = await createSolanaContext({
      keypair,
      urlOrMoniker,
    })

    const vendor = options.vendor ? await loadKeypairSignerFromFile(options.vendor) : ctx.feePayer
    const productAsset = address(options.product)

    const csvFile = fs.readFileSync(options.csv, { encoding: 'utf8' })
    const devicesAndOwners = csvFile.split('\n').slice(1).map((line) => {
      const [device, owner] = line.split(',')

      return { deviceSeed: addressCodec.encode(address(device)), owner: address(owner) } as { deviceSeed: Uint8Array, owner: Address }
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
        ixs.push(
          await getCreateDevice({
            payer: ctx.feePayer,
            vendor,
            productAsset,
            seed: deviceSeed,
            owner,
            name: 'Device',  // TODO: naming
            uri: '',
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

await cli.parseAsync()
