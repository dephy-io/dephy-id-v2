import { ShowStakePool, StakeDephyId, ListNftStakes } from "~/components/stake-pool/stake-pool-ui";
import { useParams } from "react-router"
import { assertIsAddress } from "gill"
import { useWalletUiAccount } from "@wallet-ui/react"

export default function StakePoolDetail() {
  const params = useParams() as { address: string }
  assertIsAddress(params.address)
  const { account } = useWalletUiAccount()

  return (<div>
    <h1>Stake Pool Detail</h1>

    <ShowStakePool />
    {account && <StakeDephyId stakePoolAddress={params.address} />}
    <ListNftStakes />
  </div>)
}
