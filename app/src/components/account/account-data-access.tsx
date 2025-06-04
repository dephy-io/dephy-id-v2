import { useWalletUi, useWalletUiCluster } from "@wallet-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { airdropFactory, lamports, type Address } from "gill";
import { useTransactionToast } from "../use-transaction-toast";

export function useGetBalance({ address }: { address: Address }) {
  const { cluster } = useWalletUiCluster()
  const { client } = useWalletUi()

  return useQuery({
    queryKey: ['get-balance', { cluster, address }],
    queryFn: () =>
      client.rpc
        .getBalance(address)
        .send()
        .then((res) => res.value),
  })
}

export function useRequestAirdrop({ address }: { address: Address }) {
  const { cluster } = useWalletUiCluster()
  const { client } = useWalletUi()
  const queryClient = useQueryClient()
  const toastTransaction = useTransactionToast()
  const airdrop = airdropFactory(client)

  return useMutation({
    mutationKey: ['airdrop', { cluster, address }],
    mutationFn: async (amount: number = 1) =>
      airdrop({
        commitment: 'confirmed',
        recipientAddress: address,
        lamports: lamports(BigInt(Math.round(amount * 1_000_000_000))),
      }),
    onSuccess: async (signature) => {
      toastTransaction(signature)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['get-balance', { cluster, address }] }),
        queryClient.invalidateQueries({ queryKey: ['get-signatures', { cluster, address }] }),
      ]);
    },
  })
}


export function useGetSignatures({ address }: { address: Address }) {
  const { cluster } = useWalletUiCluster()
  const { client } = useWalletUi()

  return useQuery({
    queryKey: ['get-signatures', { cluster, address }],
    queryFn: () => client.rpc.getSignaturesForAddress(address).send(),
  })
}
