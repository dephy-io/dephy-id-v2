import { useParams } from "react-router"
import { assertIsAddress } from "gill"
import { useStakePool, useUserStake } from "~/components/stake-pool/stake-pool-data-access";
import { ShowUserStake, Withdraw } from "~/components/stake-pool/stake-pool-ui";
import { useMint } from "~/components/account/account-data-access";


export default function UserStakeDetail() {
  const params = useParams() as { address: string }
  assertIsAddress(params.address)
  const userStake = useUserStake({ userStakeAddress: params.address })
  const stakePool = useStakePool({ stakePoolAddress: userStake.data?.data.stakePool })
  const mint = useMint({ mintAddress: stakePool.data?.data.config.stakeTokenMint })

  if (!userStake.isFetched || !stakePool.isFetched || !mint.isFetched) {
    return <div>Loading...</div>
  }

  if (!userStake.data) {
    return <div>User Stake not found</div>
  }

  return (<div>
    <h1>User Stake Detail</h1>
    <p>{params.address}</p>
    <ShowUserStake userStake={userStake.data} mint={mint.data!} />
    <Withdraw userStake={userStake.data} />
  </div>)
}
