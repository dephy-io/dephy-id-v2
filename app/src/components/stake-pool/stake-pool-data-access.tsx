import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as dephyIdStakePool from "dephy-id-stake-pool-client"
import { useWalletUi } from "@wallet-ui/react"
import { useSendAndConfirmIxs } from "~/lib/utils"
import { useTransactionToast } from "../use-transaction-toast"

export function useAdminAccount() {
  const { client } = useWalletUi()

  return useQuery({
    queryKey: ['stake-pool', 'admin-account'],
    queryFn: async () => {
      const [address] = await dephyIdStakePool.findAdminAccountPda()
      return dephyIdStakePool.fetchAdminAccount(client.rpc, address)
    },
  })
}

export function useInitialize() {
  const { feePayer, sendAndConfirmIxs } = useSendAndConfirmIxs()
  const toastTransaction = useTransactionToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      return sendAndConfirmIxs([
        await dephyIdStakePool.getInitializeInstructionAsync({
          authority: feePayer,
          payer: feePayer,
        })
      ])
    },
    onSuccess: async (signature) => {
      toastTransaction(signature)
      queryClient.invalidateQueries({ queryKey: ['stake-pool', 'admin-account'] })
    },
  })
}
