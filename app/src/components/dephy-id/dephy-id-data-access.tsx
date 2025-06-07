import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useWalletUiCluster, useWalletUi, useWalletAccountTransactionSendingSigner } from '@wallet-ui/react'
import {
  isSolanaError, createTransaction,
  type IInstruction,
  signAndSendTransactionMessageWithSigners,
  getBase58Decoder,
  type Address,
  type Base58EncodedBytes,
  getBase58Encoder,
  type ReadonlyUint8Array,
  createNoopSigner,
  getBase64Encoder,
} from 'gill'
import * as dephyId from 'dephy-id-client'
import { useTransactionToast } from '../use-transaction-toast'
import { useSendAndConfirmIxs } from '~/lib/utils'


export function useDephyAccount() {
  const { client } = useWalletUi()

  return useQuery({
    queryKey: ['dephy-id', 'dephy-account'],
    queryFn: async () => {
      const [address] = await dephyId.findDephyAccountPda()
      return dephyId.fetchDephyAccount(client.rpc, address)
    },
  })
}

export function useInitialize() {
  const { cluster } = useWalletUiCluster()
  const toastTransaction = useTransactionToast()
  const { feePayer, sendAndConfirmIxs } = useSendAndConfirmIxs()
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['dephy-id', 'initialize', { cluster }],
    mutationFn: async () => {
      return sendAndConfirmIxs([
        await dephyId.getInitializeInstructionAsync({
          payer: feePayer,
          authority: feePayer,
        }),
      ])
    },
    onSuccess: async (signature) => {
      toastTransaction(signature)
      queryClient.invalidateQueries({ queryKey: ['dephy-id', 'dephy-account'] })
    },
  })
}

export function useCreateProduct() {
  const { cluster } = useWalletUiCluster()
  const toastTransaction = useTransactionToast()
  const { feePayer, sendAndConfirmIxs } = useSendAndConfirmIxs()
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['dephy-id', 'create-product', { cluster }],
    mutationFn: async ({ name, uri }: { name: string, uri: string }) => {
      return sendAndConfirmIxs([
        await dephyId.getCreateProductInstructionAsync({
          name,
          uri,
          vendor: feePayer,
          payer: feePayer,
        }),
      ])
    },
    onSuccess: async (signature) => {
      toastTransaction(signature)
      queryClient.invalidateQueries({ queryKey: ['dephy-id', 'list-products', { cluster, vendor: feePayer.address }] })
    },
  })
}

export function useListProducts({ vendor }: { vendor: Address }) {
  const { cluster } = useWalletUiCluster()
  const { client } = useWalletUi()
  const base64Encoder = getBase64Encoder()
  const productDecoder = dephyId.getProductAccountDecoder()
  const discriminator = getBase58Decoder().decode(dephyId.PRODUCT_ACCOUNT_DISCRIMINATOR)

  return useQuery({
    queryKey: ['dephy-id', 'list-products', { cluster, vendor }],
    queryFn: async () => {
      const rawAccounts = await client.rpc.getProgramAccounts(
        dephyId.DEPHY_ID_PROGRAM_ADDRESS,
        {
          encoding: 'base64',
          filters: [{
            memcmp: {
              encoding: 'base58',
              offset: 0n,
              bytes: discriminator as unknown as Base58EncodedBytes,
            }
          }, {
            memcmp: {
              encoding: 'base58',
              offset: 8n,
              bytes: vendor as unknown as Base58EncodedBytes,
            }
          }]
        }
      ).send()

      return rawAccounts.map((account) => ({
        pubkey: account.pubkey,
        account: productDecoder.decode(base64Encoder.encode(account.account.data[0])),
      }))
    }
  })
}

export function useCreateDevice() {
  const { cluster } = useWalletUiCluster()
  const toastTransaction = useTransactionToast()
  const { feePayer, sendAndConfirmIxs } = useSendAndConfirmIxs()

  return useMutation({
    mutationKey: ['dephy-id', 'create-device', { cluster }],
    mutationFn: async ({ name, uri, productAsset, owner, seed }: { name: string, uri: string, productAsset: Address, owner: Address, seed: ReadonlyUint8Array }) => {
      return sendAndConfirmIxs([
        await dephyId.getCreateDeviceInstructionAsync({
          name,
          uri,
          productAsset,
          owner,
          seed,
          mintAuthority: feePayer,
          payer: feePayer,
        }),
      ])
    },
    onSuccess: async (signature) => {
      toastTransaction(signature)
    },
  })
}
