import { useMutation, useQuery, QueryClient } from "@tanstack/react-query"
import { useStakeDephyId, useStakePool } from "../stake-pool/stake-pool-data-access"
import { useWalletUi, useWalletUiAccount } from "@wallet-ui/react"
import { address, type Address, type Rpc, generateKeyPairSigner, getAddressCodec, type IInstruction } from "gill"
import * as splToken from 'gill/programs/token'
import * as dephyId from "dephy-id-client"
import * as dephyIdStakePool from "dephy-id-stake-pool-client"
import { useSendAndConfirmIxs } from "~/lib/utils"
import * as mplCore from "mpl-core";
import type { DasApi } from "~/lib/das"

interface DeviceEntry {
  device: string
  amount: string
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
          const amount = BigInt(entry.amount)
          if (amount > 0n) {
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
  dasRpc
}: {
  stakePoolAddress?: Address
  dasRpc?: Rpc<DasApi> // DAS RPC instance
}) {
  const { account } = useWalletUiAccount()

  const stakePool = useStakePool({ stakePoolAddress })

  return useQuery<UserAsset[]>({
    queryKey: ['user-assets', 'stake-pool-collection', { stakePoolAddress, userAddress: account?.address }],
    queryFn: async () => {
      if (!account?.address || !stakePool.data?.data.config.collection || !dasRpc) {
        return []
      }

      try {
        // Use DAS RPC to search for assets owned by user in the specific collection
        const response = await dasRpc.searchAssets({
          ownerAddress: address(account.address),
          grouping: ["collection", stakePool.data.data.config.collection],
          page: 1,
          limit: 1000,
          displayOptions: {
            showCollectionMetadata: false,
          }
        }).send()

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

        return assets
      } catch (error) {
        console.error('Error fetching user assets:', error)
        return []
      }
    },
    enabled: !!account?.address && !!stakePoolAddress && !!stakePool.data && !!dasRpc,
  })
}
