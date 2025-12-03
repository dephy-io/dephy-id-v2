import { useWalletAccountTransactionSendingSigner, useWalletUi, useWalletUiCluster } from "@wallet-ui/react"
import { useWalletUiGill } from "@wallet-ui/react-gill"
import { type ClassValue, clsx } from "clsx"
import { createTransaction, getBase58Decoder, type Instruction, isSolanaError, signAndSendTransactionMessageWithSigners } from "gill"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function useSendAndConfirmIxs() {
  const { account } = useWalletUi()
  const client = useWalletUiGill()
  const { cluster } = useWalletUiCluster()

  const feePayer = useWalletAccountTransactionSendingSigner(account!, cluster.id)

  const sendAndConfirmIxs = async (instructions: Instruction[], config = { showError: true }) => {
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

export function toJSON(obj: object) {
  return JSON.stringify(obj, (_key, value) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  }, 2);
}
