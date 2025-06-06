import { useParams } from "react-router"
import { assertIsAddress } from "gill"
import { useUserStake } from "~/components/stake-pool/stake-pool-data-access";
import { ShowUserStake, Withdraw } from "~/components/stake-pool/stake-pool-ui";

export default function UserStakeDetail() {
  const params = useParams() as { address: string }
  assertIsAddress(params.address)
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
    <ShowUserStake userStake={userStake.data} />
    <Withdraw userStake={userStake.data} />
  </div>)
}
