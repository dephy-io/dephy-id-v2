import { ShowNftStake, ListUserStakes, Deposit } from "~/components/stake-pool/stake-pool-ui";
import { useWalletUiAccount } from "@wallet-ui/react"
import { useParams } from "react-router"
import { assertIsAddress } from "gill"
import { useUserStake } from "~/components/stake-pool/stake-pool-data-access";

export default function UserStakeDetail() {
  const params = useParams() as { address: string }
  assertIsAddress(params.address)
  const { account } = useWalletUiAccount()
  const userStake = useUserStake({ userStakeAddress: params.address })

  if (!userStake.isFetched) {
    return <div>Loading...</div>
  }

  if (!userStake.data) {
    return <div>User Stake not found</div>
  }

  return (<div>
    <h1>User Stake Detail</h1>
    <p>{params.address}</p>
  </div>)
}
