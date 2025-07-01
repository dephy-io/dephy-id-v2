import { Command, Option } from '@commander-js/extra-typings';
import { dasApi } from "@metaplex-foundation/digital-asset-standard-api"
import * as mplCore from '@metaplex-foundation/mpl-core';
import { das } from '@metaplex-foundation/mpl-core-das';
import { publicKey } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  address, Base58EncodedBytes, getAddressEncoder,
  getBase16Decoder, getBase58Decoder, getBase64Encoder, ReadonlyUint8Array
} from "gill";
import { loadKeypairSignerFromFile } from "gill/node";

import * as dephyId from '../clients/dephy-id/js/src/index.js';
import {
  getAssetAccountDecoder,
  MPL_CORE_PROGRAM_ADDRESS
} from '../deps/mpl-core/js/src/index.js';
import { createSolanaContext } from './common.js';


let ctx: Awaited<ReturnType<typeof createSolanaContext>>

const b16Decoder = getBase16Decoder()

function formatter(key: string, value: unknown): unknown {
  if (typeof value === 'bigint') {
    return value.toString()
  }
  if (value instanceof Uint8Array) {
    return b16Decoder.decode(value)
  }
  return value
}

function logWithFormat(obj: unknown, format: 'js' | 'json' = 'js') {
  switch (format) {
    case 'json':
      console.log(JSON.stringify(obj, formatter, 2))
      break
    default:
      console.dir(obj, { depth: null })
      break
  }
}

const cli = new Command()
  .name('dephy-id-cli')
  .version('0.1.0')
  .description('CLI for dephy-id')
  .requiredOption('-k, --keypair <path>', 'Path to the fee payer keypair', '~/.config/solana/id.json')
  .option('-u --url <urlOrMoniker>', 'RPC endpoint url or moniker', 'http://127.0.0.1:8899')
  .hook('preAction', async (cmd) => {
    const { keypair, url: urlOrMoniker } = cmd.opts();

    ctx = await createSolanaContext({
      keypair,
      urlOrMoniker,
    })
  });


cli
  .command('initialize')
  .description('Initialize DePHY program')
  .option('-a, --authority <path>', 'Path to authority keypair file')
  .action(async (options) => {
    const authority = options.authority ? await loadKeypairSignerFromFile(options.authority) : ctx.feePayer;

    const signature = await ctx.sendAndConfirmIxs([
      await dephyId.getInitializeInstructionAsync({ authority, payer: ctx.feePayer })
    ]);

    console.log(`Program initialized with authority ${authority.address}`);
    console.log(`Transaction: ${signature}`);
  });


cli
  .command('create-product <name> <uri>')
  .description('Create a new product asset')
  .option('-v, --vendor <path>', 'Path to vendor keypair file')
  .option('--mint-authority <path>', 'Public key of the mint authority')
  .action(async (name, uri, options) => {
    const vendor = options.vendor ? await loadKeypairSignerFromFile(options.vendor) : ctx.feePayer;
    const mintAuthority = options.mintAuthority ? address(options.mintAuthority) : vendor.address;
    const [productAssetAddress] = await dephyId.findProductAssetPda({
      productName: name,
      vendor: vendor.address
    });

    const signature = await ctx.sendAndConfirmIxs([
      await dephyId.getCreateProductInstructionAsync({
        name,
        payer: ctx.feePayer,
        uri,
        vendor,
        mintAuthority,
        plugins: null,
      })
    ]);

    console.log(`Product ${name} created at ${productAssetAddress}`);
    console.log(`Transaction: ${signature}`);
  });


cli
  .command('create-device <name> <uri>')
  .description('Register a device under a product')
  .option('-v, --vendor <vendor>', 'Path to vendor keypair file')
  .requiredOption('-p, --product <product>', 'Product asset address')
  .requiredOption('-s, --seed <seed>', 'Device seed')
  .addOption(new Option('-t, --seed-type <seedType>', 'Device seed type').choices(['base58']).default('base58'))
  .action(async (name, uri, options) => {
    const vendor = options.vendor ? await loadKeypairSignerFromFile(options.vendor) : ctx.feePayer;
    const productAsset = address(options.product);

    let deviceSeed: ReadonlyUint8Array
    switch (options.seedType) {
      case 'base58':
        deviceSeed = getAddressEncoder().encode(address(options.seed));
        break;

      default:
        throw new Error('Invalid seed type');
    }

    const deviceAssetPda = await dephyId.findDeviceAssetPda({
      deviceSeed,
      productAsset
    });

    const signature = await ctx.sendAndConfirmIxs([
      await dephyId.getCreateDeviceInstructionAsync({
        name,
        owner: vendor.address,
        payer: ctx.feePayer,
        productAsset,
        seed: deviceSeed,
        uri,
        mintAuthority: vendor,
      })
    ]);

    console.log(`Device ${name} created at ${deviceAssetPda[0]}`);
    console.log(`Transaction: ${signature}`);
  });



cli
  .command('get-product <product>')
  .description('Get product details')
  .action(async (product, _options, cmd) => {
    const { url } = cmd.optsWithGlobals()
    const umi = createUmi(url)
    const collection = await mplCore.fetchCollection(umi, publicKey(product))
    console.dir(collection, { depth: null })
  })


cli
  .command('get-device <device>')
  .description('Get device details')
  .action(async (device, _options, cmd) => {
    const { url } = cmd.optsWithGlobals()
    const umi = createUmi(url)
    const asset = await mplCore.fetchAsset(umi, publicKey(device))
    console.dir(asset, { depth: null })
  })


cli
  .command('list-products')
  .description('Get all products')
  .option('--vendor <vendor>', 'Vendor address')
  .addOption(new Option('-f, --format <format>', 'output format, "js" | "json", default to "js"').choices(['js', 'json']).default('js'))
  .action(async (options) => {
    const discriminator = getBase58Decoder().decode(dephyId.PRODUCT_ACCOUNT_DISCRIMINATOR)

    const filters: Parameters<typeof ctx.rpc.getProgramAccounts>[1]['filters'] = [{
      memcmp: {
        offset: 0n,
        encoding: 'base58',
        bytes: discriminator as unknown as Base58EncodedBytes
      }
    }]

    if (options.vendor) {
      filters.push({
        memcmp: {
          offset: 8n,
          encoding: 'base58',
          bytes: address(options.vendor) as unknown as Base58EncodedBytes
        }
      })
    }

    const rawAccounts = await ctx.rpc
      .getProgramAccounts(
        dephyId.DEPHY_ID_PROGRAM_ADDRESS, {
        encoding: 'base64',
        filters,
      })
      .send()

    const products = rawAccounts.map(({ account, pubkey }) => {
      const data = getBase64Encoder().encode(account.data[0])
      const decodedAccount = dephyId.getProductAccountDecoder().decode(data)
      return { address: pubkey, ...decodedAccount }
    })

    logWithFormat(products, options.format)
  })

const listDevicesNative = async (product: string) => {
  const rawAccounts = await ctx.rpc
    .getProgramAccounts(
      MPL_CORE_PROGRAM_ADDRESS, {
      encoding: 'base64',
      filters: [{
        memcmp: {
          offset: 34n,
          encoding: 'base58',
          bytes: address(product) as unknown as Base58EncodedBytes
        }
      }]
    })
    .send()

  return rawAccounts.map(({ account, pubkey }) => {
    const base64Data = account.data[0]
    const data = Buffer.from(base64Data, 'base64')
    const decodedAccount = getAssetAccountDecoder().decode(data)
    return { address: pubkey, ...decodedAccount }
  })
}

cli
  .command('list-devices <product>')
  .description('List all devices of the product')
  .addOption(new Option('-f, --format <format>', 'output format, "js" | "json", default to "js"').choices(['js', 'json']).default('js'))
  .action(async (product, options) => {
    const accounts = await listDevicesNative(product)
    logWithFormat(accounts, options.format)
  })


cli
  .command('list-devices-das <product>')
  .description('List all devices of the product, requires a endpoint with DAS support like helius.dev')
  .addOption(new Option('-f, --format <format>', 'output format, "js" | "json", default to "js"').choices(['js', 'json']).default('js'))
  .action(async (product, options, cmd) => {
    const { url } = cmd.optsWithGlobals()
    const umi = createUmi(url).use(dasApi())

    const collection = publicKey(product)

    const devices = await das.getAssetsByCollection(umi, { collection })
    logWithFormat(devices, options.format)
  })


cli
  .command('search-assets-das')
  .description('Search assets using DAS')
  .option('--owner <owner>', 'owner address')
  .option('--collection <collection>', 'collection address')
  .addOption(new Option('--frozen <frozen>', 'frozen status').choices(['true', 'false']))
  .addOption(new Option('-f, --format <format>', 'output format, "js" | "json", default to "js"').choices(['js', 'json']).default('js'))
  .action(async (options, cmd) => {
    const { url } = cmd.optsWithGlobals()
    const umi = createUmi(url).use(dasApi())

    const owner = options.owner ? publicKey(options.owner) : undefined
    const grouping = options.collection ? ['collection', publicKey(options.collection)] as [string, string] : undefined
    const frozen = options.frozen === 'true' ? true : options.frozen === 'false' ? false : undefined

    const assets = await das.searchAssets(umi, {
      owner,
      grouping,
      frozen,
    })
    logWithFormat(assets, options.format)
  })

await cli.parseAsync();
