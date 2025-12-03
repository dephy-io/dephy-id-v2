import {
  createSolanaClient, createTransaction, getSignatureFromTransaction,
  Instruction, isSolanaError, signTransactionMessageWithSigners
} from "gill";
import { address } from "gill";
import { loadKeypairSignerFromFile } from "gill/node";


export function getProgramIds(mainnet: boolean) {
  if (mainnet) {
    return {
      dephyIdProgramId: address('PHy1dzzd8sso1R5t31WHX6JvAsZF9fvNgzxHbgnKHX4'),
      dephyIdStakePoolProgramId: address('PHYSJkZ4KNpK4Lp5pg89xfab5mSer9NxRfr6YzuRdNQ'),
    }
  } else {
    return {
      dephyIdProgramId: address('D1DdkvuK3V8kzxD5CSsx7JorEo3hMLw4L7Bvujv3pTD6'),
      dephyIdStakePoolProgramId: address('DSTKMXnJXgvViSkr6hciBaYsTpcduxZuF334WLrvEZmW'),
    }
  }
}

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


  const sendAndConfirmIxs = async (instructions: Instruction[]) => {
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
