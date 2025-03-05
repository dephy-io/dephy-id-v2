import {
  address,
  createSolanaClient, createTransaction,
  generateKeyPairSigner,
  getAddressEncoder,
  getSignatureFromTransaction, IInstruction, isSolanaError,
  signTransactionMessageWithSigners,
} from "gill";
import { loadKeypairSignerFromFile } from "gill/node";

import * as dephyId from '../clients/js/src/index.js';

// common stuff to send txs
const feePayer = await loadKeypairSignerFromFile();  // default to ~/.config/solana/id.json
const client = createSolanaClient({
  urlOrMoniker: 'localnet',
});

const sendAndConfirmIxs = async (instructions: IInstruction[]) => {
  try {
    const latestBlockhash = (await client.rpc.getLatestBlockhash().send()).value
    const transaction = createTransaction({
      feePayer,
      instructions,
      latestBlockhash,
      version: 0
    })

    const signedTx = await signTransactionMessageWithSigners(transaction)
    await client.sendAndConfirmTransaction(signedTx, { commitment: 'confirmed' })

    return getSignatureFromTransaction(signedTx)
  } catch (error) {
    if (isSolanaError(error)) {
      console.error(error.context)
    }

    throw error
  }
}

// fill in vendor and product
const vendor = await loadKeypairSignerFromFile('<VENDOR_KEYPAIR_PATH>');
const productAsset = address('<PRODUCT_ASSET_ADDRESS>');

// convert a base58 address to bytes, or just any 32-bytes Uint8Array
const deviceSeed = getAddressEncoder().encode(address('<BASE58_ADDRESS>'));

// calc device asset PDA, needed if using sync api to create ix
const [deviceAsset, _deviceAssetBump] = await dephyId.findDeviceAssetPda({
  deviceSeed,
  productAsset
});

const createDeviceIx = await dephyId.getCreateDeviceInstructionAsync({
  name: 'Example Asset',
  uri: 'https://example.com',
  owner: vendor.address,
  payer: feePayer,
  productAsset,
  seed: deviceSeed,
  vendor,
})

// the tx to create asset
const signature = await sendAndConfirmIxs([createDeviceIx]);

console.log(`Device asset created at: ${deviceAsset} with ${signature}`)

// mint multiple assets at once
// max ~5 assets once, depending on name and uri size
const seeds = await Array.fromAsync({ length: 5 }, async () => {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  const owner = await generateKeyPairSigner()
  return {
    seed: randomBytes,
    owner: owner.address
  };
});

const ixs = await Promise.all(seeds.map(({ seed, owner }, i) =>
  dephyId.getCreateDeviceInstructionAsync({
    name: `Test Device ${i}`,
    uri: `https://example.com/product-1/device-${i}`,
    seed,
    payer: feePayer,
    productAsset,
    owner,
    vendor,
  })
))

await sendAndConfirmIxs(ixs)
