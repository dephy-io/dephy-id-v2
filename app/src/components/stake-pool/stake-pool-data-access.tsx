import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as dephyIdStakePool from "dephy-id-stake-pool-client"
import { useWalletUi, useWalletUiCluster } from "@wallet-ui/react"
import { useSendAndConfirmIxs } from "~/lib/utils"
import { useTransactionToast } from "../use-transaction-toast"
import {
  generateKeyPairSigner, getBase58Decoder, getBase64Encoder,
  type Account, type Address, type Base58EncodedBytes
} from "gill";
import * as splToken from 'gill/programs/token'
import { fetchMint } from 'gill/programs/token'
import { useProgramIds } from "~/lib/program-ids";

export function useAdminAccount() {
  const { client } = useWalletUi()
  const { cluster } = useWalletUiCluster()
  const { dephyIdStakePoolProgramId } = useProgramIds()

  return useQuery({
    queryKey: ['stake-pool', 'admin-account', { cluster }],
    queryFn: async () => {
      const [address] = await dephyIdStakePool.findAdminAccountPda({ programAddress: dephyIdStakePoolProgramId })
      return dephyIdStakePool.fetchAdminAccount(client.rpc, address)
    },
  })
}

export function useAnnouncedConfig({ stakePool }: { stakePool: Account<dephyIdStakePool.StakePoolAccount> }) {
  const { client } = useWalletUi()
  const { cluster } = useWalletUiCluster()
  const { dephyIdStakePoolProgramId } = useProgramIds()

  return useQuery({
    queryKey: ['stake-pool', 'announced-config', { cluster, stakePoolAddress: stakePool.address }],
    queryFn: async () => {
      const [announcedConfigPda] = await dephyIdStakePool.findAnnouncedConfigPda({ stakePool: stakePool.address }, { programAddress: dephyIdStakePoolProgramId })
      return dephyIdStakePool.fetchMaybeAnnouncedConfigAccount(client.rpc, announcedConfigPda)
    },
  })
}

export function useAnnounceUpdateConfig({ stakePool }: { stakePool: Account<dephyIdStakePool.StakePoolAccount> }) {
  const { client } = useWalletUi()
  const { cluster } = useWalletUiCluster()
  const { feePayer, sendAndConfirmIxs } = useSendAndConfirmIxs()
  const toastTransaction = useTransactionToast()
  const queryClient = useQueryClient()
  const { dephyIdStakePoolProgramId } = useProgramIds()

  return useMutation({
    mutationFn: async ({ maxStakeAmountUi, configReviewTime }: { maxStakeAmountUi: number, configReviewTime: number }) => {
      const mint = await fetchMint(client.rpc, stakePool.data.config.stakeTokenMint)
      const maxStakeAmount = splToken.tokenUiAmountToAmount(maxStakeAmountUi, mint.data.decimals)

      return sendAndConfirmIxs([
        await dephyIdStakePool.getAnnounceUpdateConfigInstructionAsync({
          stakePool: stakePool.address,
          authority: feePayer,
          payer: feePayer,
          args: { configReviewTime, maxStakeAmount },
        }, {
          programAddress: dephyIdStakePoolProgramId
        })
      ])
    },
    onSuccess: async (signature) => {
      toastTransaction(signature)
      queryClient.invalidateQueries({ queryKey: ['stake-pool', 'stake-pool', { cluster, stakePoolAddress: stakePool.address }] })
      queryClient.invalidateQueries({ queryKey: ['stake-pool', 'announced-config', { cluster, stakePoolAddress: stakePool.address }] })
    },
  })
}

export function useConfirmUpdateConfig({ stakePool }: { stakePool: Account<dephyIdStakePool.StakePoolAccount> }) {
  const { cluster } = useWalletUiCluster()
  const { feePayer, sendAndConfirmIxs } = useSendAndConfirmIxs()
  const toastTransaction = useTransactionToast()
  const queryClient = useQueryClient()
  const { dephyIdStakePoolProgramId } = useProgramIds()

  return useMutation({
    mutationFn: async () => {
      return sendAndConfirmIxs([
        await dephyIdStakePool.getConfirmUpdateConfigInstructionAsync({
          stakePool: stakePool.address,
          authority: feePayer,
          payer: feePayer,
        }, {
          programAddress: dephyIdStakePoolProgramId
        })
      ])
    },
    onSuccess: async (signature) => {
      toastTransaction(signature)
      queryClient.invalidateQueries({ queryKey: ['stake-pool', 'stake-pool', { cluster, stakePoolAddress: stakePool.address }] })
      queryClient.invalidateQueries({ queryKey: ['stake-pool', 'announced-config', { cluster, stakePoolAddress: stakePool.address }] })
    },
  })
}

export function useCancelUpdateConfig({ stakePool }: { stakePool: Account<dephyIdStakePool.StakePoolAccount> }) {
  const { cluster } = useWalletUiCluster()
  const { feePayer, sendAndConfirmIxs } = useSendAndConfirmIxs()
  const toastTransaction = useTransactionToast()
  const queryClient = useQueryClient()
  const { dephyIdStakePoolProgramId } = useProgramIds()

  return useMutation({
    mutationFn: async () => {
      return sendAndConfirmIxs([
        await dephyIdStakePool.getCancelUpdateConfigInstructionAsync({
          stakePool: stakePool.address,
          authority: feePayer,
          payer: feePayer,
        }, {
          programAddress: dephyIdStakePoolProgramId
        })
      ])
    },
    onSuccess: async (signature) => {
      toastTransaction(signature)
      queryClient.invalidateQueries({ queryKey: ['stake-pool', 'stake-pool', { cluster, stakePoolAddress: stakePool.address }] })
      queryClient.invalidateQueries({ queryKey: ['stake-pool', 'announced-config', { cluster, stakePoolAddress: stakePool.address }] })
    },
  })
}
export function useUserNftStakesForPool({ stakePoolAddress, userAddress }: { stakePoolAddress: Address, userAddress: Address }) {
  const { client } = useWalletUi()
  const { cluster } = useWalletUiCluster()
  const { dephyIdStakePoolProgramId } = useProgramIds()

  return useQuery({
    queryKey: ['stake-pool', 'user-nft-stakes', { cluster, stakePoolAddress, userAddress }],
    queryFn: async () => {
      const discriminator = getBase58Decoder().decode(dephyIdStakePool.NFT_STAKE_ACCOUNT_DISCRIMINATOR)
      const rawAccounts = await client.rpc.getProgramAccounts(
        dephyIdStakePoolProgramId,
        {
          encoding: 'base64',
          filters: [
            {
              memcmp: {
                encoding: 'base58',
                offset: 0n,
                bytes: discriminator as unknown as Base58EncodedBytes,
              }
            },
            {
              memcmp: {
                encoding: 'base58',
                offset: 8n,
                bytes: stakePoolAddress as unknown as Base58EncodedBytes,
              }
            },
            {
              memcmp: {
                encoding: 'base58',
                // depositAuthority starts after discriminator(8) + stakePool(32) + stakeAuthority(32)
                offset: 8n + 32n + 32n,
                bytes: userAddress as unknown as Base58EncodedBytes,
              }
            }
          ]
        }
      ).send()

      return rawAccounts.map((account) => {
        const data = getBase64Encoder().encode(account.account.data[0])
        return {
          pubkey: account.pubkey,
          account: dephyIdStakePool.getNftStakeAccountDecoder().decode(data),
        }
      })
    },
    enabled: !!stakePoolAddress && !!userAddress,
  })
}

export function useInitialize() {
  const { feePayer, sendAndConfirmIxs } = useSendAndConfirmIxs()
  const toastTransaction = useTransactionToast()
  const queryClient = useQueryClient()
  const { dephyIdStakePoolProgramId } = useProgramIds()

  return useMutation({
    mutationFn: async () => {
      return sendAndConfirmIxs([
        await dephyIdStakePool.getInitializeInstructionAsync({
          authority: feePayer,
          payer: feePayer,
        }, {
          programAddress: dephyIdStakePoolProgramId
        })
      ])
    },
    onSuccess: async (signature) => {
      toastTransaction(signature)
      queryClient.invalidateQueries({ queryKey: ['stake-pool', 'admin-account'] })
    },
  })
}

export function useCreateStakePool() {
  const { feePayer, sendAndConfirmIxs } = useSendAndConfirmIxs()
  const { client } = useWalletUi()
  const toastTransaction = useTransactionToast()
  const queryClient = useQueryClient()
  const { dephyIdStakePoolProgramId } = useProgramIds()

  return useMutation({
    mutationFn: async ({
      stakePoolAuthority,
      collection,
      stakeTokenMint: stakeTokenMintAddress,
      maxStakeAmount,
      configReviewTime,
    }: {
      stakePoolAuthority: Address
      collection: Address
      stakeTokenMint: Address
      maxStakeAmount: number
      configReviewTime: number
    }) => {
      const stakePool = await generateKeyPairSigner()
      const stakeTokenMint = await fetchMint(client.rpc, stakeTokenMintAddress)
      const stakeTokenProgram = stakeTokenMint.programAddress
      splToken.assertIsSupportedTokenProgram(stakeTokenProgram)
      const maxStakeAmountInSmallestUnits = splToken.tokenUiAmountToAmount(maxStakeAmount, stakeTokenMint.data.decimals)

      return sendAndConfirmIxs([
        await dephyIdStakePool.getCreateStakePoolInstructionAsync({
          stakePool,
          authority: feePayer,
          stakePoolAuthority,
          collection,
          stakeTokenMint: stakeTokenMintAddress,
          payer: feePayer,
          stakeTokenProgram,
          args: {
            maxStakeAmount: maxStakeAmountInSmallestUnits,
            configReviewTime,
          }
        }, {
          programAddress: dephyIdStakePoolProgramId
        })
      ])
    },
    onSuccess: async (signature) => {
      toastTransaction(signature)
      queryClient.invalidateQueries({ queryKey: ['stake-pool', 'stake-pools'] })
    },
  })
}

export function useStakePools() {
  const { client } = useWalletUi()
  const { cluster } = useWalletUiCluster()
  const base64Encoder = getBase64Encoder()
  const stakePoolDecoder = dephyIdStakePool.getStakePoolAccountDecoder()
  const { dephyIdStakePoolProgramId } = useProgramIds()

  return useQuery({
    queryKey: ['stake-pool', 'stake-pools', { cluster }],
    queryFn: async () => {
      const discriminator = getBase58Decoder().decode(dephyIdStakePool.STAKE_POOL_ACCOUNT_DISCRIMINATOR)
      const rawAccounts = await client.rpc.getProgramAccounts(
        dephyIdStakePoolProgramId,
        {
          encoding: 'base64',
          filters: [{
            memcmp: {
              encoding: 'base58',
              offset: 0n,
              bytes: discriminator as unknown as Base58EncodedBytes,
            }
          }]
        }
      ).send()

      return rawAccounts.map((account) => {
        const data = base64Encoder.encode(account.account.data[0])
        return {
          pubkey: account.pubkey,
          account: stakePoolDecoder.decode(data),
        }
      })
    },
  })
}

export function useStakePool({ stakePoolAddress }: { stakePoolAddress?: Address }) {
  const { client } = useWalletUi()
  const { cluster } = useWalletUiCluster()

  return useQuery({
    queryKey: ['stake-pool', 'stake-pool', { cluster, stakePoolAddress }],
    queryFn: async () => {
      return dephyIdStakePool.fetchStakePoolAccount(client.rpc, stakePoolAddress!)
    },
    enabled: !!stakePoolAddress,
  })
}


export function useStakeDephyId() {
  const { client } = useWalletUi()
  const { feePayer, sendAndConfirmIxs } = useSendAndConfirmIxs()
  const toastTransaction = useTransactionToast()
  const { cluster } = useWalletUiCluster()
  const queryClient = useQueryClient()
  const { dephyIdStakePoolProgramId } = useProgramIds()

  return useMutation({
    mutationFn: async ({ stakePoolAddress, mplCoreAsset, depositAuthority }: { stakePoolAddress: Address, mplCoreAsset: Address, depositAuthority: Address }) => {
      const stakePool = await dephyIdStakePool.fetchStakePoolAccount(client.rpc, stakePoolAddress)
      const mplCoreCollection = stakePool.data.config.collection

      const nftStake = await generateKeyPairSigner()

      return sendAndConfirmIxs([
        await dephyIdStakePool.getCreateNftStakeInstructionAsync({
          stakePool: stakePoolAddress,
          nftStake,
          stakeAuthority: feePayer,
          depositAuthority,
          mplCoreAsset,
          mplCoreCollection,
          payer: feePayer,
        }, {
          programAddress: dephyIdStakePoolProgramId
        })
      ])
    },
    onSuccess: async (signature) => {
      toastTransaction(signature)
      queryClient.invalidateQueries({ queryKey: ['stake-pool', 'nft-stakes', { cluster }] })
    },
  })
}

export function useUnstakeDephyId({ nftStake }: { nftStake: Account<dephyIdStakePool.NftStakeAccount> }) {
  const { client } = useWalletUi()
  const { feePayer, sendAndConfirmIxs } = useSendAndConfirmIxs()
  const toastTransaction = useTransactionToast()
  const { cluster } = useWalletUiCluster()
  const queryClient = useQueryClient()
  const { dephyIdStakePoolProgramId } = useProgramIds()

  return useMutation({
    mutationFn: async () => {
      const stakePool = await dephyIdStakePool.fetchStakePoolAccount(client.rpc, nftStake.data.stakePool)
      const mplCoreAsset = nftStake.data.nftTokenAccount
      const mplCoreCollection = stakePool.data.config.collection

      return sendAndConfirmIxs([
        await dephyIdStakePool.getUnstakeNftInstructionAsync({
          nftStake: nftStake.address,
          stakePool: stakePool.address,
          stakeAuthority: feePayer,
          mplCoreCollection: mplCoreCollection,
          mplCoreAsset: mplCoreAsset,
          payer: feePayer
        }, {
          programAddress: dephyIdStakePoolProgramId
        })
      ])
    },
    onSuccess: async (signature) => {
      toastTransaction(signature)
      queryClient.invalidateQueries({ queryKey: ['stake-pool', 'nft-stakes', { cluster }] })
    },
  })
}

export function useNftStakes({ stakePoolAddress }: { stakePoolAddress?: Address }) {
  const { client } = useWalletUi()
  const { cluster } = useWalletUiCluster()
  const { dephyIdStakePoolProgramId } = useProgramIds()

  return useQuery({
    queryKey: ['stake-pool', 'nft-stakes', stakePoolAddress, { cluster }],
    queryFn: async () => {
      const discriminator = getBase58Decoder().decode(dephyIdStakePool.NFT_STAKE_ACCOUNT_DISCRIMINATOR)
      const rawAccounts = await client.rpc.getProgramAccounts(
        dephyIdStakePoolProgramId,
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
              bytes: stakePoolAddress as unknown as Base58EncodedBytes,
            }
          }]
        }
      ).send()

      return rawAccounts.map((account) => {
        const data = getBase64Encoder().encode(account.account.data[0])
        return {
          pubkey: account.pubkey,
          account: dephyIdStakePool.getNftStakeAccountDecoder().decode(data),
        }
      })
    },
    enabled: !!stakePoolAddress,
  })
}

export function useNftStakesForUser({ userAddress }: { userAddress: Address }) {
  const { client } = useWalletUi()
  const { cluster } = useWalletUiCluster()
  const { dephyIdStakePoolProgramId } = useProgramIds()
  const nftStakeAccountDecoder = dephyIdStakePool.getNftStakeAccountDecoder()

  return useQuery({
    queryKey: ['stake-pool', 'nft-stakes-for-user', { cluster, userAddress }],
    queryFn: async () => {
      const discriminator = getBase58Decoder().decode(dephyIdStakePool.NFT_STAKE_ACCOUNT_DISCRIMINATOR)
      const rawAccounts = await client.rpc.getProgramAccounts(
        dephyIdStakePoolProgramId,
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
              offset: 8n + 32n + 32n,
              bytes: userAddress as unknown as Base58EncodedBytes,
            }
          }]
        }
      ).send()

      return rawAccounts.map((account) => {
        const data = getBase64Encoder().encode(account.account.data[0])
        return {
          pubkey: account.pubkey,
          account: nftStakeAccountDecoder.decode(data),
        }
      })
    },
  })
}

export function useNftStake({ nftStakeAddress }: { nftStakeAddress: Address }) {
  const { client } = useWalletUi()
  const { cluster } = useWalletUiCluster()

  return useQuery({
    queryKey: ['stake-pool', 'nft-stake', { cluster, nftStakeAddress }],
    queryFn: async () => {
      return dephyIdStakePool.fetchNftStakeAccount(client.rpc, nftStakeAddress)
    },
  })
}


export function useUserStakes({ nftStakeAddress }: { nftStakeAddress: Address }) {
  const { client } = useWalletUi()
  const { cluster } = useWalletUiCluster()
  const { dephyIdStakePoolProgramId } = useProgramIds()
  const userStakeAccountDecoder = dephyIdStakePool.getUserStakeAccountDecoder()

  return useQuery({
    queryKey: ['stake-pool', 'user-stakes', { cluster, nftStakeAddress }],
    queryFn: async () => {
      const discriminator = getBase58Decoder().decode(dephyIdStakePool.USER_STAKE_ACCOUNT_DISCRIMINATOR)
      const rawAccounts = await client.rpc.getProgramAccounts(
        dephyIdStakePoolProgramId,
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
              offset: 8n + 32n,
              bytes: nftStakeAddress as unknown as Base58EncodedBytes,
            }
          }]
        }
      ).send()

      return rawAccounts.map((account) => {
        const data = getBase64Encoder().encode(account.account.data[0])
        return {
          pubkey: account.pubkey,
          account: userStakeAccountDecoder.decode(data),
        }
      })
    },
  })
}

export function useUserStakesForPool({ stakePoolAddress }: { stakePoolAddress?: Address }) {
  const { client, account } = useWalletUi()
  const { cluster } = useWalletUiCluster()
  const { dephyIdStakePoolProgramId } = useProgramIds()
  const userAddress = account?.address
  const userStakeAccountDecoder = dephyIdStakePool.getUserStakeAccountDecoder()

  return useQuery({
    enabled: !!stakePoolAddress,
    queryKey: ['stake-pool', 'user-stakes-for-pool', { cluster, stakePoolAddress }],
    queryFn: async () => {
      const discriminator = getBase58Decoder().decode(dephyIdStakePool.USER_STAKE_ACCOUNT_DISCRIMINATOR)
      const rawAccounts = await client.rpc.getProgramAccounts(
        dephyIdStakePoolProgramId,
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
              bytes: stakePoolAddress as unknown as Base58EncodedBytes,
            }
          }, {
            memcmp: {
              encoding: 'base58',
              offset: 8n + 32n + 32n,
              bytes: userAddress as unknown as Base58EncodedBytes,
            }
          }]
        }
      ).send()

      return rawAccounts.map((account) => {
        const data = getBase64Encoder().encode(account.account.data[0])
        return {
          pubkey: account.pubkey,
          account: userStakeAccountDecoder.decode(data),
        }
      })
    },
  })
}

export function useUserStakesForUser({ userAddress }: { userAddress: Address }) {
  const { client } = useWalletUi()
  const { cluster } = useWalletUiCluster()
  const { dephyIdStakePoolProgramId } = useProgramIds()
  const userStakeAccountDecoder = dephyIdStakePool.getUserStakeAccountDecoder()

  return useQuery({
    queryKey: ['stake-pool', 'user-stakes-for-user', { cluster, userAddress }],
    queryFn: async () => {
      const discriminator = getBase58Decoder().decode(dephyIdStakePool.USER_STAKE_ACCOUNT_DISCRIMINATOR)
      const rawAccounts = await client.rpc.getProgramAccounts(
        dephyIdStakePoolProgramId,
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
              offset: 8n + 32n + 32n,
              bytes: userAddress as unknown as Base58EncodedBytes,
            }
          }]
        }
      ).send()

      const userStakes = rawAccounts.map((account) => {
        const data = getBase64Encoder().encode(account.account.data[0])
        return {
          pubkey: account.pubkey,
          account: userStakeAccountDecoder.decode(data),
        }
      })

      // Fetch related NFT stakes in chunks to avoid exceeding RPC payload limits.
      const nftStakeAddresses = userStakes.map((userStake) => userStake.account.nftStake)
      const chunkSize = 100
      const addressChunks: typeof nftStakeAddresses[] = []
      for (let i = 0; i < nftStakeAddresses.length; i += chunkSize) {
        addressChunks.push(nftStakeAddresses.slice(i, i + chunkSize))
      }

      const chunkResults = await Promise.all(
        addressChunks.map((chunk) => dephyIdStakePool.fetchAllMaybeNftStakeAccount(client.rpc, chunk))
      )
      const nftStakes = chunkResults.flat()
      const nftStakeMap = new Map(nftStakes.map((nftStake) => [nftStake.address, nftStake]))

      return userStakes.map((userStake) => {
        return {
          ...userStake,
          nftStake: nftStakeMap.get(userStake.account.nftStake),
        }
      })
    },
    enabled: !!userAddress,
  })
}

export function useUserStake({ userStakeAddress }: { userStakeAddress: Address }) {
  const { client } = useWalletUi()
  const { cluster } = useWalletUiCluster()

  return useQuery({
    queryKey: ['stake-pool', 'user-stake', { cluster, userStakeAddress }],
    queryFn: async () => {
      return dephyIdStakePool.fetchUserStakeAccount(client.rpc, userStakeAddress)
    },
  })
}


export function useDeposit({ nftStake }: { nftStake: Account<dephyIdStakePool.NftStakeAccount> }) {
  const { client } = useWalletUi()
  const { cluster } = useWalletUiCluster()
  const { feePayer, sendAndConfirmIxs } = useSendAndConfirmIxs()
  const toastTransaction = useTransactionToast()
  const queryClient = useQueryClient()
  const { dephyIdStakePoolProgramId } = useProgramIds()

  return useMutation({
    mutationFn: async ({ userStakeTokenAccount, amount }: { userStakeTokenAccount: Address, amount: number }) => {
      const stakePool = await dephyIdStakePool.fetchStakePoolAccount(client.rpc, nftStake.data!.stakePool)
      return sendAndConfirmIxs([
        await dephyIdStakePool.getDepositTokenInstructionAsync({
          stakePool: nftStake.data.stakePool,
          nftStake: nftStake.address,
          user: feePayer,
          stakeTokenMint: stakePool.data.config.stakeTokenMint,
          stakeTokenAccount: stakePool.data.stakeTokenAccount,
          userStakeTokenAccount,
          payer: feePayer,
          amount,
        }, {
          programAddress: dephyIdStakePoolProgramId
        })
      ])
    },
    onSuccess: async (signature) => {
      toastTransaction(signature)
      queryClient.invalidateQueries({ queryKey: ['stake-pool', 'nft-stakes', { cluster }] })
    },
  })
}

export function useWithdraw({ userStake }: { userStake: Account<dephyIdStakePool.UserStakeAccount> }) {
  const { client } = useWalletUi()
  const { cluster } = useWalletUiCluster()
  const { feePayer, sendAndConfirmIxs } = useSendAndConfirmIxs()
  const toastTransaction = useTransactionToast()
  const queryClient = useQueryClient()
  const { dephyIdStakePoolProgramId } = useProgramIds()

  return useMutation({
    mutationFn: async ({ userStakeTokenAccount, amount }: { userStakeTokenAccount: Address, amount: number }) => {
      const stakePool = await dephyIdStakePool.fetchStakePoolAccount(client.rpc, userStake.data!.stakePool)
      return sendAndConfirmIxs([
        await dephyIdStakePool.getWithdrawInstructionAsync({
          stakePool: userStake.data.stakePool,
          nftStake: userStake.data.nftStake,
          user: feePayer,
          stakeTokenMint: stakePool.data.config.stakeTokenMint,
          stakeTokenAccount: stakePool.data.stakeTokenAccount,
          userStakeTokenAccount,
          payer: feePayer,
          amount,
        }, {
          programAddress: dephyIdStakePoolProgramId
        })
      ])
    },
    onSuccess: async (signature) => {
      toastTransaction(signature)
      queryClient.invalidateQueries({ queryKey: ['stake-pool', 'nft-stake', { cluster, nftStakeAddress: userStake.data.nftStake }] })
      queryClient.invalidateQueries({ queryKey: ['stake-pool', 'user-stake', { cluster, userStakeAddress: userStake.address }] })
    },
  })
}

export function useCloseNftStake({ nftStakeAddress }: { nftStakeAddress: Address }) {
  const { cluster } = useWalletUiCluster()
  const { feePayer, sendAndConfirmIxs } = useSendAndConfirmIxs()
  const nftStake = useNftStake({ nftStakeAddress })
  const toastTransaction = useTransactionToast()
  const queryClient = useQueryClient()
  const { dephyIdStakePoolProgramId } = useProgramIds()

  return useMutation({
    mutationFn: async () => {
      return sendAndConfirmIxs([
        await dephyIdStakePool.getCloseNftStakeInstructionAsync({
          stakePool: nftStake.data!.data.stakePool,
          nftStake: nftStakeAddress,
          stakeAuthority: feePayer,
          payer: feePayer,
        }, {
          programAddress: dephyIdStakePoolProgramId
        })
      ])
    },
    onSuccess: async (signature) => {
      toastTransaction(signature)
      queryClient.invalidateQueries({ queryKey: ['stake-pool', 'nft-stakes', { cluster }] })
    },
  })
}
