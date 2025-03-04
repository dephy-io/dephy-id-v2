import {
  address,
  createSolanaClient, createTransaction,
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

// the tx to create asset
const signature = await sendAndConfirmIxs([
  await dephyId.getCreateDeviceInstructionAsync({
    name: 'Example Asset',
    uri: 'https://example.com',
    owner: vendor.address,
    payer: feePayer,
    productAsset,
    seed: deviceSeed,
    vendor,
  })
]);

console.log(`Device asset created at: ${deviceAsset} with ${signature}`)
