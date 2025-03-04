import { Command, Option } from '@commander-js/extra-typings';
import {
  address, createSolanaClient, createTransaction,
  getAddressEncoder, getSignatureFromTransaction, IInstruction, isSolanaError, KeyPairSigner,
  ReadonlyUint8Array, signTransactionMessageWithSigners,
} from "gill";
import { loadKeypairSignerFromFile } from "gill/node";

import * as dephyId from '../clients/js/src/index.js';

let feePayer: KeyPairSigner;
let rpc: ReturnType<typeof createSolanaClient>['rpc'];
let sendAndConfirmTransaction: ReturnType<typeof createSolanaClient>['sendAndConfirmTransaction'];

const sendAndConfirmIxs = async (instructions: IInstruction[]) => {
  const latestBlockhash = (await rpc.getLatestBlockhash().send()).value

  const transaction = createTransaction({
    feePayer,
    instructions,
    latestBlockhash,
    version: 0
  })

  try {
    const signedTx = await signTransactionMessageWithSigners(transaction)
    await sendAndConfirmTransaction(signedTx, { commitment: 'confirmed' })

    return getSignatureFromTransaction(signedTx)
  } catch (error) {
    if (isSolanaError(error)) {
      console.error(error.context)
    }

    throw error
  }
}

const cli = new Command()
  .name('dephy-id')
  .version('0.1.0')
  .description('CLI for dephy-id');

cli
  .requiredOption('-k, --keypair <path>', 'Path to the fee payer keypair')
  .option('-u --url <urlOrMoniker>', 'RPC endpoint url or moniker', 'http://127.0.0.1:8899')
  .hook('preAction', async (cmd) => {
    const { keypair, url: urlOrMoniker } = cmd.opts();

    const client = createSolanaClient({
      urlOrMoniker,
    });

    rpc = client.rpc;
    sendAndConfirmTransaction = client.sendAndConfirmTransaction;

    feePayer = await loadKeypairSignerFromFile(keypair);
  });


cli
  .command('initialize')
  .description('Initialize DePHY program')
  .option('-a, --authority <path>', 'Path to authority keypair file')
  .action(async (options) => {
    const authority = await loadKeypairSignerFromFile(options.authority);

    const signature = await sendAndConfirmIxs([
      await dephyId.getInitializeInstructionAsync({ authority, payer: feePayer })
    ]);

    console.log(`Program initialized with authority ${authority.address}`);
    console.log(`Transaction: ${signature}`);
  });

cli
  .command('create-product <name> <uri>')
  .description('Create a new product asset')
  .requiredOption('-v, --vendor <path>', 'Path to vendor keypair file')
  .action(async (name, uri, options) => {
    const vendor = await loadKeypairSignerFromFile(options.vendor);
    const productAssetPda = await dephyId.findProductAssetPda({
      productName: name,
      vendor: vendor.address
    });

    const signature = await sendAndConfirmIxs([
      dephyId.getCreateProductInstruction({
        name,
        payer: feePayer,
        productAsset: productAssetPda[0],
        uri,
        vendor
      })
    ]);

    console.log(`Product ${name} created at ${productAssetPda[0]}`);
    console.log(`Transaction: ${signature}`);
  });

cli
  .command('create-device <name> <uri>')
  .description('Register a device under a product')
  .requiredOption('-v, --vendor <vendor>', 'Path to vendor keypair file')
  .requiredOption('-p, --product <product>', 'Product asset address')
  .requiredOption('-s, --seed <seed>', 'Device seed')
  .addOption(new Option('-t, --seed-type <seedType>', 'Device seed type').choices(['base58']).default('base58'))
  .action(async (name, uri, options) => {
    const vendor = await loadKeypairSignerFromFile(options.vendor);
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

    const signature = await sendAndConfirmIxs([
      await dephyId.getCreateDeviceInstructionAsync({
        name,
        owner: vendor.address,
        payer: feePayer,
        productAsset,
        seed: deviceSeed,
        uri,
        vendor
      })
    ]);

    console.log(`Device ${name} registered at ${deviceAssetPda[0]}`);
    console.log(`Transaction: ${signature}`);
  });

await cli.parseAsync();
