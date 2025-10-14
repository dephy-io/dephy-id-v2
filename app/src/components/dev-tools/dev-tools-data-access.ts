import { QueryClient, useMutation, useQuery } from "@tanstack/react-query"
import { useWalletUi, useWalletUiAccount } from "@wallet-ui/react"
import * as dephyId from "dephy-id-client"
import * as dephyIdStakePool from "dephy-id-stake-pool-client"
import { type Address, address, generateKeyPairSigner, getAddressCodec, type IInstruction, type Rpc } from "gill"
import * as splToken from 'gill/programs/token'
import * as mplCore from "mpl-core";

import type { DasApi } from "~/lib/das"
import { useSendAndConfirmIxs } from "~/lib/utils"

import { useStakePool } from "../stake-pool/stake-pool-data-access"

interface DeviceEntry {
  device: string
  amount: string
}


export function useCreateNftStakesOnly() {
  const { feePayer, sendAndConfirmIxs } = useSendAndConfirmIxs()
  const { client } = useWalletUi()

  return useMutation({
    mutationFn: async ({ stakePoolAddress, assets }: { stakePoolAddress: string, assets: string[] }) => {
      const results: Array<{ device: string; status: 'success' | 'error'; error?: string }> = []

      const stakePoolAddr = address(stakePoolAddress)
      const stakePool = await dephyIdStakePool.fetchStakePoolAccount(client.rpc, stakePoolAddr)
      const productAsset = stakePool.data.config.collection

      let ixs: IInstruction[] = []

      for (let i = 0; i < assets.length; i++) {
        const deviceAddress = assets[i]
        try {
          const deviceAsset = await mplCore.fetchAssetAccount(client.rpc, address(deviceAddress))

          if (deviceAsset.data.base.owner.toString() !== feePayer.address.toString()) {
            throw new Error(`Device ${deviceAddress} is not owned by the connected wallet.`)
          }

          if (deviceAsset.data.plugins?.freezeDelegate?.frozen) {
            throw new Error(`Device ${deviceAddress} is already staked (frozen).`)
          }

          const nftStakeSigner = await generateKeyPairSigner()

          ixs.push(
            await dephyIdStakePool.getCreateNftStakeInstructionAsync({
              stakePool: stakePoolAddr,
              nftStake: nftStakeSigner,
              stakeAuthority: feePayer,
              depositAuthority: feePayer.address,
              mplCoreAsset: deviceAsset.address,
              mplCoreCollection: productAsset,
              payer: feePayer,
            })
          )

          if (ixs.length >= 6) {
            const signature = await sendAndConfirmIxs(ixs)
            console.log('Transaction signature:', signature, i)
            ixs = []
          }

          results.push({ device: deviceAddress, status: 'success' })
        } catch (error) {
          console.error(`Error staking device ${deviceAddress}:`, error)
          results.push({ device: deviceAddress, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' })
        }
      }

      if (ixs.length > 0) {
        const signature = await sendAndConfirmIxs(ixs)
        console.log('Final transaction signature:', signature)
      }

      return { results, processedCount: results.length }
    },
  })
}
interface StakeNftsParams {
  stakePoolAddress: string
  queryClient: QueryClient
  csvData: DeviceEntry[]
  userAddress: string
}

export function useStakeNfts() {
  const { feePayer, sendAndConfirmIxs } = useSendAndConfirmIxs()
  const { client } = useWalletUi()

  return useMutation({
    mutationFn: async ({ stakePoolAddress, csvData }: StakeNftsParams) => {
      const results = []

      // Fetch stake pool data
      const stakePoolAddr = address(stakePoolAddress)
      const stakePool = await dephyIdStakePool.fetchStakePoolAccount(client.rpc, stakePoolAddr)
      const productAsset = stakePool.data.config.collection

      // Fetch stake token mint
      const stakeTokenMint = await splToken.fetchMint(client.rpc, stakePool.data.config.stakeTokenMint)

      // Find user's stake token account
      const userStakeTokenAccount = (await splToken.findAssociatedTokenPda({
        mint: stakeTokenMint.address,
        owner: feePayer.address,
        tokenProgram: stakeTokenMint.programAddress,
      }))[0]

      const addressCodec = getAddressCodec()
      let ixs: IInstruction[] = []

      for (let i = 0; i < csvData.length; i++) {
        const entry = csvData[i]
        try {
          console.log(`Processing device ${i + 1}/${csvData.length}:`, entry.device)

          const deviceAsset = await mplCore.fetchAssetAccount(client.rpc, address(entry.device));

          if (deviceAsset.data.base.owner.toString() !== feePayer.address.toString()) {
            throw new Error(`Device ${entry.device} is not owned by the connected wallet.`);
          }

          if (deviceAsset.data.plugins?.freezeDelegate?.frozen) {
            throw new Error(`Device ${entry.device} is already staked (frozen).`);
          }

          const seedAttribute = deviceAsset.data.plugins?.attributes?.attributeList?.find(
            (attr: { key: string; value: string }) => attr.key === "Seed"
          );

          if (!seedAttribute) {
            throw new Error(`Seed not found for device ${entry.device}`);
          }

          const deviceSeed = addressCodec.encode(address(seedAttribute.value));

          const deviceAssetPda = await dephyId.findDeviceAssetPda({
            productAsset,
            deviceSeed,
          });

          if (deviceAssetPda[0].toString() !== entry.device) {
            throw new Error(`PDA mismatch for device ${entry.device}`);
          }

          // Generate NFT stake signer
          const nftStakeSigner = await generateKeyPairSigner()

          // Create NFT stake instruction
          ixs.push(
            await dephyIdStakePool.getCreateNftStakeInstructionAsync({
              stakePool: stakePoolAddr,
              nftStake: nftStakeSigner,
              stakeAuthority: feePayer,
              depositAuthority: feePayer.address,
              mplCoreAsset: deviceAsset.address,
              mplCoreCollection: productAsset,
              payer: feePayer,
            })
          )

          // Add deposit instruction if amount is specified
          const uiAmount = Number(entry.amount)
          if (uiAmount > 0n) {
            const amount = splToken.tokenUiAmountToAmount(uiAmount, stakeTokenMint.data.decimals)
            ixs.push(
              await dephyIdStakePool.getDepositTokenInstructionAsync({
                nftStake: nftStakeSigner.address,
                stakePool: stakePoolAddr,
                user: feePayer,
                stakeTokenMint: stakeTokenMint.address,
                stakeTokenAccount: stakePool.data.stakeTokenAccount,
                userStakeTokenAccount: userStakeTokenAccount,
                payer: feePayer,
                amount,
              })
            )
          }

          // Send transaction when we have 6 instructions or at the end
          if (ixs.length >= 6) {
            const signature = await sendAndConfirmIxs(ixs)
            console.log('Transaction signature:', signature, i)
            ixs = []
          }

          results.push({
            device: entry.device,
            amount: entry.amount,
            status: 'success'
          })
        } catch (error) {
          console.error(`Error processing device ${entry.device}:`, error)
          results.push({
            device: entry.device,
            amount: entry.amount,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      // Send remaining instructions
      if (ixs.length > 0) {
        const signature = await sendAndConfirmIxs(ixs)
        console.log('Final transaction signature:', signature)
      }

      return { results, processedCount: results.length }
    },
  })
}


export type UserAsset = {
  address: string
  name: string
  collection: string
  owner: string
  metadata: any
  seed?: string
  frozen?: boolean
}

export function useUserAssetsForStakePool({
  stakePoolAddress,
  dasRpc,
  page = 1,
  limit = 1000,
  staked = false,
}: {
  stakePoolAddress?: Address
  dasRpc?: Rpc<DasApi>
  page?: number
  limit?: number
  staked?: boolean
}) {
  const { account } = useWalletUiAccount()

  const stakePool = useStakePool({ stakePoolAddress })

  return useQuery<UserAsset[]>({
    queryKey: ['user-assets', 'stake-pool-collection', { stakePoolAddress, userAddress: account?.address, page, limit, staked }],
    queryFn: async () => {
      if (!account?.address || !stakePool.data?.data.config.collection || !dasRpc) {
        return []
      }

      try {
        // Build search args and omit 'frozen' when undefined (All)
        const searchArgs: any = {
          ownerAddress: address(account.address),
          grouping: ["collection", stakePool.data.data.config.collection],
          page,
          limit,
          displayOptions: {
            showCollectionMetadata: false,
          }
        }
        // Map staked => frozen for DAS
        searchArgs.frozen = staked

        // Use DAS RPC to search for assets owned by user in the specific collection
        const response = await dasRpc.searchAssets(searchArgs).send()

        console.log("assets", response)

        // Transform DAS response to our expected format
        const assets = response.items.map((asset) => ({
          address: asset.id,
          name: asset.content?.metadata?.name,
          collection: stakePool.data!.data.config.collection,
          owner: account.address,
          metadata: asset.content?.metadata,
          seed: asset.plugins?.attributes?.data?.attribute_list?.find((attr: { key: string; value: string }) => attr.key === "Seed")?.value,
          frozen: asset.plugins?.freeze_delegate?.data.frozen,
        }))

        console.log('fetched', assets.length, 'assets', '(staked filter =', staked, ')')

        return assets
      } catch (error) {
        console.error('Error fetching user assets:', error)
        return []
      }
    },
    enabled: !!account?.address && !!stakePoolAddress && !!stakePool.data && !!dasRpc,
  })
}
