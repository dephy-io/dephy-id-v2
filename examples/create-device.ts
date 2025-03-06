import {
  address,
  appendTransactionMessageInstructions,
  createNoopSigner,
  createSolanaClient,
  createTransaction,
  createTransactionMessage,
  generateKeyPairSigner,
  getAddressEncoder,
  getCompiledTransactionMessageDecoder,
  getSignatureFromTransaction,
  IInstruction,
  isSolanaError,
  partiallySignTransactionMessageWithSigners,
  pipe,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransaction,
  signTransactionMessageWithSigners,
  transactionFromBase64,
  transactionToBase64,
} from "gill";
import { loadKeypairSignerFromFile } from "gill/node";

import * as dephyId from '../clients/js/src/index.js';

// common stuff to send txs
const feePayer = await loadKeypairSignerFromFile();  // default to ~/.config/solana/id.json
const client = createSolanaClient({
  urlOrMoniker: 'localnet',
});

const createTransactionWithIxs = async (instructions: IInstruction[]) => {
  const latestBlockhash = (await client.rpc.getLatestBlockhash().send()).value
  const transaction = createTransaction({
    feePayer,
    instructions,
    latestBlockhash,
    version: 0
  })

  return transaction
}

const sendAndConfirmIxs = async (instructions: IInstruction[]) => {
  const transaction = await createTransactionWithIxs(instructions)

  return await sendAndConfirmTx(transaction)
}

const sendAndConfirmTx = async (transaction: ReturnType<typeof createTransaction>) => {
  try {
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


{
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
      payer: createNoopSigner(feePayer.address),  // user wallet address
      productAsset,
      owner,
      vendor,
    })
  ))

  // example for partial sign tx by server and user

  // the user wallet
  const user = feePayer
  // server has vendor keypair

  // 1. Server generate the tx
  const latestBlockhash = (await client.rpc.getLatestBlockhash().send()).value
  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    tx => setTransactionMessageFeePayer(user.address, tx),  // here we only set the address
    tx => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    tx => appendTransactionMessageInstructions(ixs, tx),
  )

  // 2. Server sign the tx
  const partiallySignedTransactionMessage = await partiallySignTransactionMessageWithSigners(transactionMessage)

  // 3. Server encode the tx and send it to user
  const base64EncodedTransaction = transactionToBase64(partiallySignedTransactionMessage)

  // 4. Client decode the received tx
  const decodedTransaction = transactionFromBase64(base64EncodedTransaction)

  // 5. Client can then verify the tx instructions
  const compiledTransactionMessage = getCompiledTransactionMessageDecoder().decode(decodedTransaction.messageBytes)
  compiledTransactionMessage.instructions.forEach((ix) => {
    if (compiledTransactionMessage.staticAccounts[ix.programAddressIndex] !== dephyId.DEPHY_ID_PROGRAM_ADDRESS) {
      throw new Error('Ix is not sending to dephy id program')
    }

    const createDeviceIx = dephyId.getCreateDeviceInstructionDataDecoder().decode(ix.data)
    console.log(createDeviceIx.name, createDeviceIx.uri)
  })

  // 6. Client sign the tx
  const fullySignedTx = await signTransaction([user.keyPair], decodedTransaction)

  // 7. Client send the tx
  // sendAndConfirmTransaction need a lifetime constraint to send the tx
  const fullySignedTxWithLifetime = {
    ...fullySignedTx,
    lifetimeConstraint: latestBlockhash
  }
  await client.sendAndConfirmTransaction(fullySignedTxWithLifetime, { commitment: 'confirmed' })
}
