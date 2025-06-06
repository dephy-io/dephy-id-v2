import { ShowNftStake, ListUserStakes, Deposit } from "~/components/stake-pool/stake-pool-ui";
import { useWalletUiAccount } from "@wallet-ui/react"
import { useParams } from "react-router"
import { assertIsAddress } from "gill"
import { useNftStake } from "~/components/stake-pool/stake-pool-data-access";

export default function NftStakeDetail() {
  const params = useParams() as { address: string }
  assertIsAddress(params.address)
  const { account } = useWalletUiAccount()
  const nftStake = useNftStake({ nftStakeAddress: params.address })

  if (!nftStake.isFetched) {
    return <div>Loading...</div>
  }

  if (!nftStake.data) {
    return <div>Nft Stake not found</div>
  }

  return (<div>
    <h1>Nft Stake Detail</h1>

    <ShowNftStake nftStake={nftStake.data} />
    {account && <Deposit nftStake={nftStake.data} />}
    <ListUserStakes />
  </div>)
}
