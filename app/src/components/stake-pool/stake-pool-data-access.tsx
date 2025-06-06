import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as dephyIdStakePool from "dephy-id-stake-pool-client"
import { useWalletUi, useWalletUiCluster } from "@wallet-ui/react"
import { useSendAndConfirmIxs } from "~/lib/utils"
import { useTransactionToast } from "../use-transaction-toast"
import { assertAccountExists, generateKeyPairSigner, getBase58Decoder, getBase64Encoder, type Account, type Address, type Base58EncodedBytes, type TransactionSigner } from "gill";
import * as splToken from 'gill/programs/token'
import { fetchMint } from 'gill/programs/token'

export function useAdminAccount() {
  const { client } = useWalletUi()
  const { cluster } = useWalletUiCluster()

  return useQuery({
    queryKey: ['stake-pool', 'admin-account', { cluster }],
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

export function useCreateStakePool() {
  const { feePayer, sendAndConfirmIxs } = useSendAndConfirmIxs()
  const { client } = useWalletUi()
  const toastTransaction = useTransactionToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      stakePoolAuthority,
      collection,
      stakeTokenMint: stakeTokenMintAddress,
      maxStakeAmount,
    }: {
      stakePoolAuthority: Address
      collection: Address
      stakeTokenMint: Address
      maxStakeAmount: number
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
          maxStakeAmount: maxStakeAmountInSmallestUnits,
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

  return useQuery({
    queryKey: ['stake-pool', 'stake-pools', { cluster }],
    queryFn: async () => {
      const discriminator = getBase58Decoder().decode(dephyIdStakePool.STAKE_POOL_ACCOUNT_DISCRIMINATOR)
      const rawAccounts = await client.rpc.getProgramAccounts(
        dephyIdStakePool.DEPHY_ID_STAKE_POOL_PROGRAM_ADDRESS,
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

export function useStakePool({ stakePoolAddress }: { stakePoolAddress: Address }) {
  const { client } = useWalletUi()
  const { cluster } = useWalletUiCluster()

  return useQuery({
    queryKey: ['stake-pool', 'stake-pool', { cluster, stakePoolAddress }],
    queryFn: async () => {
      return dephyIdStakePool.fetchStakePoolAccount(client.rpc, stakePoolAddress)
    },
  })
}


export function useStakeDephyId() {
  const { client } = useWalletUi()
  const { feePayer, sendAndConfirmIxs } = useSendAndConfirmIxs()
  const toastTransaction = useTransactionToast()
  const { cluster } = useWalletUiCluster()
  const queryClient = useQueryClient()

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
        })
      ])
    },
    onSuccess: async (signature) => {
      toastTransaction(signature)
      queryClient.invalidateQueries({ queryKey: ['stake-pool', 'nft-stakes', { cluster }] })
    },
  })
}


export function useNftStakes({ stakePoolAddress }: { stakePoolAddress: Address }) {
  const { client } = useWalletUi()
  const { cluster } = useWalletUiCluster()

  return useQuery({
    queryKey: ['stake-pool', 'nft-stakes', { cluster }],
    queryFn: async () => {
      const discriminator = getBase58Decoder().decode(dephyIdStakePool.NFT_STAKE_ACCOUNT_DISCRIMINATOR)
      const rawAccounts = await client.rpc.getProgramAccounts(
        dephyIdStakePool.DEPHY_ID_STAKE_POOL_PROGRAM_ADDRESS,
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

  return useQuery({
    queryKey: ['stake-pool', 'user-stakes', { cluster, nftStakeAddress }],
    queryFn: async () => {
      const discriminator = getBase58Decoder().decode(dephyIdStakePool.USER_STAKE_ACCOUNT_DISCRIMINATOR)
      const rawAccounts = await client.rpc.getProgramAccounts(
        dephyIdStakePool.DEPHY_ID_STAKE_POOL_PROGRAM_ADDRESS,
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
          account: dephyIdStakePool.getUserStakeAccountDecoder().decode(data),
        }
      })
    },
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

  return useMutation({
    mutationFn: async ({ userStakeTokenAccount, amount }: { userStakeTokenAccount: Address, amount: number }) => {
      const stakePool = await dephyIdStakePool.fetchStakePoolAccount(client.rpc, userStake.data!.stakePool)
      return sendAndConfirmIxs([
        await dephyIdStakePool.getWithdrawInstructionAsync({
          stakePool: userStake.data.stakePool,
          nftStake: userStake.address,
          user: feePayer,
          stakeTokenMint: stakePool.data.config.stakeTokenMint,
          stakeTokenAccount: stakePool.data.stakeTokenAccount,
          userStakeTokenAccount,
          payer: feePayer,
          amount,
        })
      ])
    },
    onSuccess: async (signature) => {
      toastTransaction(signature)
      queryClient.invalidateQueries({ queryKey: ['stake-pool', 'nft-stakes', { cluster }] })
    },
  })
}
