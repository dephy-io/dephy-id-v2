import {
  createSolanaClient, createTransaction, getSignatureFromTransaction,
  IInstruction, isSolanaError, signTransactionMessageWithSigners
} from "gill";
import { loadKeypairSignerFromFile } from "gill/node";



export async function createSolanaContext({
  keypair,
  urlOrMoniker,
}: {
  keypair: string;
  urlOrMoniker: string;
}) {
  const client = createSolanaClient({
    urlOrMoniker,
  });

  const feePayer = await loadKeypairSignerFromFile(keypair)
  const rpc = client.rpc;
  const sendAndConfirmTransaction = client.sendAndConfirmTransaction;


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

  return {
    rpc,
    sendAndConfirmIxs,
    feePayer,
  }
}
