import { useWalletUi, useWalletUiCluster, useWalletAccountTransactionSendingSigner } from "@wallet-ui/react"
import { clsx, type ClassValue } from "clsx"
import { type IInstruction, createTransaction, signAndSendTransactionMessageWithSigners, getBase58Decoder, isSolanaError } from "gill"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function useSendAndConfirmIxs() {
  const { client, account } = useWalletUi()
  const { cluster } = useWalletUiCluster()

  const feePayer = useWalletAccountTransactionSendingSigner(account!, cluster.id)

  const sendAndConfirmIxs = async (instructions: IInstruction[], config = { showError: true }) => {
    const latestBlockhash = (await client.rpc.getLatestBlockhash().send()).value

    const transaction = createTransaction({
      feePayer,
      instructions,
      latestBlockhash,
      version: 0
    })

    try {
      const signatureBytes = await signAndSendTransactionMessageWithSigners(transaction)
      return getBase58Decoder().decode(signatureBytes)
    } catch (error) {
      if (isSolanaError(error) && config.showError) {
        console.error(error.context)
      }

      throw error
    }
  }

  return {
    feePayer,
    sendAndConfirmIxs,
  }
}
