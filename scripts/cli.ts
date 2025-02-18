import * as dephyId from '../clients/js/src/index.js';
import * as solana from '@solana/web3.js';
import { Command, Option } from 'commander';
import * as fs from 'fs';

let rpc: ReturnType<typeof solana.createSolanaRpc>;
let rpcSubscriptions: ReturnType<typeof solana.createSolanaRpcSubscriptions>;
let sendAndConfirm: ReturnType<typeof solana.sendAndConfirmTransactionFactory>;
let payer: solana.KeyPairSigner;

async function sendAndConfirmIxs(ixs: solana.IInstruction[]) {
  const recentBlockhash = (await rpc.getLatestBlockhash().send()).value;

  const tx = await solana.pipe(
    solana.createTransactionMessage({ version: 0 }),
    tx => solana.appendTransactionMessageInstructions(ixs, tx),
    tx => solana.setTransactionMessageFeePayerSigner(payer, tx),
    tx => solana.setTransactionMessageLifetimeUsingBlockhash(recentBlockhash, tx),
    tx => solana.signTransactionMessageWithSigners(tx)
  );

  await sendAndConfirm(tx, { commitment: 'confirmed' });
  return solana.getSignatureFromTransaction(tx);
}

const loadKeyPair = async (path: string) => {
  const keypair = Uint8Array.from(JSON.parse(fs.readFileSync(path, {encoding: 'utf-8'})))
  return await solana.createKeyPairSignerFromBytes(keypair);
}

const cli = new Command();

cli
  .requiredOption('-k, --keypair <path>', 'Path to payer keypair')
  .addOption(new Option('--network <network>', 'Network').choices(['devnet', 'mainnet', 'testnet']).default('devnet'))
  .option('--rpc <url>', 'RPC endpoint', 'http://127.0.0.1:8899')
  .option('--ws <url>', 'WebSocket endpoint', 'ws://127.0.0.1:8900')
  .hook('preAction', async (cmd) => {
    const { keypair: keypairPath, rpc: rpcUrl, ws: wsUrl } = cmd.opts();
    
    rpc = solana.createSolanaRpc(solana.devnet(rpcUrl));
    rpcSubscriptions = solana.createSolanaRpcSubscriptions(solana.devnet(wsUrl));
    
    sendAndConfirm = solana.sendAndConfirmTransactionFactory({
      rpc,
      rpcSubscriptions,
    });

    payer = await loadKeyPair(keypairPath);
  });


cli
  .command('initialize')
  .description('Initialize DePHY program')
  .action(async () => {
    const authority = await solana.generateKeyPairSigner();

    const signature = await sendAndConfirmIxs([
      await dephyId.getInitializeInstructionAsync({ authority, payer })
    ]);

    console.log(`Program initialized with authority ${authority.address}`);
    console.log(`Transaction: ${signature}`);
  });

cli
  .command('create-product <name> <uri>')
  .description('Create a new product asset')
  .requiredOption('-v, --vendor <path>', 'Path to vendor keypair file')
  .action(async (name, uri, options) => {
    const vendor = await loadKeyPair(options.vendor);
    const productAssetPda = await dephyId.findProductAssetPda({
      vendor: vendor.address,
      productName: name
    });

    const signature = await sendAndConfirmIxs([
      dephyId.getCreateProductInstruction({
        vendor,
        payer,
        productAsset: productAssetPda[0],
        name,
        uri
      })
    ]);

    console.log(`Product ${name} created at ${productAssetPda[0]}`);
    console.log(`Transaction: ${signature}`);
  });

cli
  .command('create-device <name> <uri>')
  .description('Register a device under a product')
  .requiredOption('-v, --vendor <path>', 'Path to vendor keypair file')
  .requiredOption('-p, --product <product>', 'Product asset address')
  .requiredOption('-s, --seed <seed>', 'Device seed')
  .addOption(new Option('-t, --seed-type <seedType>', 'Device seed type').choices(['base58']).default('base58'))
  .action(async (name, uri, options) => {
    const vendor = await loadKeyPair(options.vendor);
    const productAsset = solana.address(options.product);
    
    let deviceSeed: solana.ReadonlyUint8Array
    switch (options.seedType) {
      case 'base58':
        const devicePubkey = solana.address(options.seed);
        deviceSeed = solana.getAddressEncoder().encode(devicePubkey);
        break;
    
      default:
        throw new Error('Invalid seed type');
    }

    const deviceAssetPda = await dephyId.findDeviceAssetPda({
      productAsset,
      deviceSeed
    });

    const signature = await sendAndConfirmIxs([
      await dephyId.getCreateDeviceInstructionAsync({
        vendor,
        productAsset,
        owner: vendor.address,
        payer,
        seed: deviceSeed,
        name,
        uri
      })
    ]);

    console.log(`Device ${name} registered at ${deviceAssetPda[0]}`);
    console.log(`Transaction: ${signature}`);
  });

cli.parseAsync();
