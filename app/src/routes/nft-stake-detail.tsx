import { ShowNftStake, ListUserStakes, Deposit, UnstakeDephyId, CloseNftStake } from "~/components/stake-pool/stake-pool-ui";
import { useWalletUiAccount } from "@wallet-ui/react"
import { useParams } from "react-router"
import { assertIsAddress } from "gill"
import { useNftStake, useStakePool } from "~/components/stake-pool/stake-pool-data-access";
import { useMint } from "~/components/account/account-data-access";

export default function NftStakeDetail() {
  const params = useParams() as { address: string }
  assertIsAddress(params.address)
  const { account } = useWalletUiAccount()
  const nftStake = useNftStake({ nftStakeAddress: params.address })
  const stakePool = useStakePool({ stakePoolAddress: nftStake.data?.data.stakePool })
  const mint = useMint({ mintAddress: stakePool.data?.data.config.stakeTokenMint })

  if (!nftStake.isFetched || !stakePool.isFetched || !mint.isFetched) {
    return <div>Loading...</div>
  }

  if (!nftStake.data) {
    return <div>Nft Stake not found</div>
  }

  return (
    <div className="flex flex-col gap-4">
      <h1>Nft Stake Detail</h1>

      <ShowNftStake nftStake={nftStake.data} mint={mint.data!} />
      {account && <Deposit nftStake={nftStake.data} />}
      {nftStake.data.data.active && account?.address === nftStake.data?.data.stakeAuthority && <UnstakeDephyId nftStake={nftStake.data} />}
      {!nftStake.data.data.active && account?.address === nftStake.data?.data.stakeAuthority && nftStake.data.data.amount == 0n && <CloseNftStake nftStake={nftStake.data} />}
      <ListUserStakes nftStakeAddress={params.address} mint={mint.data!} />
    </div>
  )
}
