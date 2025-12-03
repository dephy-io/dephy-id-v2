import { useWalletUiCluster, useWalletUiAccount } from "@wallet-ui/react"
import { useWalletUiGill } from "@wallet-ui/react-gill"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { address, getBase58Decoder, getBase64Encoder, type Address, type Base58EncodedBytes, type GetProgramAccountsMemcmpFilter, type ReadonlyUint8Array, type Rpc } from "gill"
import * as dephyId from "dephy-id-client"
import * as mplCore from "mpl-core"
import { createDasRpc, type DasApi } from "~/lib/das"
import { useTransactionToast } from '../use-transaction-toast'
import { useSendAndConfirmIxs } from '~/lib/utils'
import { useProgramIds } from "~/lib/program-ids"
import { useMemo } from "react"

export function useDasRpc(): Rpc<DasApi> {
  const { cluster } = useWalletUiAccount()

  return useMemo(() => {
    switch (cluster.id) {
      case 'solana:mainnet':
        return createDasRpc(import.meta.env.VITE_HELIUS_MAINNET_RPC_URL)
      case 'solana:devnet':
        return createDasRpc(import.meta.env.VITE_HELIUS_DEVNET_RPC_URL)
      default:
        throw new Error(`Unsupported cluster: ${cluster.id}`)
    }
  }, [cluster.id])
}

export function useDephyAccount() {
  const client = useWalletUiGill()
  const { dephyIdProgramId } = useProgramIds()

  return useQuery({
    queryKey: ['dephy-id', 'dephy-account'],
    queryFn: async () => {
      const [address] = await dephyId.findDephyAccountPda({ programAddress: dephyIdProgramId })
      return dephyId.fetchDephyAccount(client.rpc, address)
    },
  })
}

export function useInitialize() {
  const { cluster } = useWalletUiCluster()
  const toastTransaction = useTransactionToast()
  const { feePayer, sendAndConfirmIxs } = useSendAndConfirmIxs()
  const queryClient = useQueryClient()
  const { dephyIdProgramId } = useProgramIds()

  return useMutation({
    mutationKey: ['dephy-id', 'initialize', { cluster }],
    mutationFn: async () => {
      return sendAndConfirmIxs([
        await dephyId.getInitializeInstructionAsync({
          payer: feePayer,
          authority: feePayer,
        }, {
          programAddress: dephyIdProgramId
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
  const { dephyIdProgramId } = useProgramIds()

  return useMutation({
    mutationKey: ['dephy-id', 'create-product', { cluster }],
    mutationFn: async ({ name, uri }: { name: string, uri: string }) => {
      return sendAndConfirmIxs([
        await dephyId.getCreateProductInstructionAsync({
          name,
          uri,
          vendor: feePayer,
          payer: feePayer,
          plugins: [],
        }, {
          programAddress: dephyIdProgramId
        }),
      ])
    },
    onSuccess: async (signature) => {
      toastTransaction(signature)
      queryClient.invalidateQueries({ queryKey: ['dephy-id', 'list-products', { cluster, vendor: feePayer.address }] })
    },
  })
}

export function useListProducts({ vendor }: { vendor?: Address }) {
  const { cluster } = useWalletUiCluster()
  const client = useWalletUiGill()
  const base64Encoder = getBase64Encoder()
  const productDecoder = dephyId.getProductAccountDecoder()
  const discriminator = getBase58Decoder().decode(dephyId.PRODUCT_ACCOUNT_DISCRIMINATOR)
  const { dephyIdProgramId } = useProgramIds()

  const filters: GetProgramAccountsMemcmpFilter[] = [{
    memcmp: {
      encoding: 'base58',
      offset: 0n,
      bytes: discriminator as unknown as Base58EncodedBytes,
    }
  }]

  if (vendor) {
    filters.push({
      memcmp: {
        encoding: 'base58',
        offset: 8n,
        bytes: vendor as unknown as Base58EncodedBytes,
      }
    })
  }

  return useQuery({
    queryKey: ['dephy-id', 'list-products', { cluster, vendor }],
    queryFn: async () => {
      const rawAccounts = await client.rpc.getProgramAccounts(
        dephyIdProgramId,
        {
          encoding: 'base64',
          filters,
        }
      ).send()

      return rawAccounts.map((account) => ({
        pubkey: account.pubkey,
        account: productDecoder.decode(base64Encoder.encode(account.account.data[0])),
      }))
    }
  })
}


export function useProduct({ productAsset }: { productAsset: Address }) {
  const client = useWalletUiGill()
  const { dephyIdProgramId } = useProgramIds()

  return useQuery({
    queryKey: ['dephy-id', 'product', { productAsset }],
    queryFn: async () => {
      const [productAddress] = await dephyId.findProductAccountPda({ productAsset }, { programAddress: dephyIdProgramId })
      return dephyId.fetchProductAccount(client.rpc, productAddress)
    },
  })
}


export function useDevice({ deviceAsset }: { deviceAsset: Address }) {
  const client = useWalletUiGill()

  return useQuery({
    queryKey: ['mpl-core', 'device', { deviceAsset }],
    queryFn: async () => {
      return mplCore.fetchAssetAccount(client.rpc, deviceAsset)
    },
  })
}

export function useDevicesByCollection({
  collectionAsset,
  owner,
  dasRpcUrl
}: {
  collectionAsset?: Address
  owner?: Address
  dasRpcUrl?: string
}) {
  const { cluster } = useWalletUiCluster()

  return useQuery<Array<{ address: Address, account: mplCore.AssetAccount }>>({
    queryKey: ['mpl-core', 'devices-by-collection', { collectionAsset, cluster, dasRpcUrl }],
    queryFn: async () => {
      if (!collectionAsset || !dasRpcUrl) return []

      try {
        const dasRpc = createDasRpc(dasRpcUrl)

        const response = await dasRpc.searchAssets({
          ownerAddress: owner,
          grouping: ["collection", collectionAsset],
          page: 1,
          limit: 1000,
          displayOptions: {
            showCollectionMetadata: false,
          }
        }).send()

        // Transform DAS API response to expected format
        const devices = response.items.map((asset) => ({
          address: address(asset.id),
          account: {
            base: {
              name: asset.content?.metadata?.name || 'Unknown Device',
              uri: asset.content?.metadata?.uri || '',
              owner: address(asset.ownership?.owner || asset.id),
              updateAuthority: address(asset.authorities?.[0]?.address || asset.id),
              key: 1, // Asset key
              seq: 0, // Sequence number
            },
            plugins: {
              attributes: {
                attributeList: asset.content?.metadata?.attributes || []
              },
              freezeDelegate: asset.plugins?.freeze ? {
                frozen: asset.plugins.freeze.frozen || false
              } : undefined
            }
          } as unknown as mplCore.AssetAccount
        }))

        return devices
      } catch (error) {
        console.error('Error fetching devices by collection:', error)
        return []
      }
    },
    enabled: !!collectionAsset && !!dasRpcUrl,
  })
}

export function useMplCoreCollection({ collectionAsset }: { collectionAsset?: Address }) {
  const client = useWalletUiGill()

  return useQuery({
    queryKey: ['mpl-core', 'collection', { collectionAsset }],
    queryFn: async () => {
      return mplCore.fetchCollectionAccount(client.rpc, collectionAsset!)
    },
    enabled: !!collectionAsset,
  })
}


export function useCreateDevice() {
  const { cluster } = useWalletUiCluster()
  const toastTransaction = useTransactionToast()
  const { feePayer, sendAndConfirmIxs } = useSendAndConfirmIxs()
  const { dephyIdProgramId } = useProgramIds()

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
        }, {
          programAddress: dephyIdProgramId
        }),
      ])
    },
    onSuccess: async (signature) => {
      toastTransaction(signature)
    },
  })
}
