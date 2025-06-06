import { ShowStakePool, StakeDephyId, ListNftStakes } from "~/components/stake-pool/stake-pool-ui";
import { useParams } from "react-router"
import { assertIsAddress } from "gill"
import { useWalletUiAccount } from "@wallet-ui/react"
import { useStakePool } from "~/components/stake-pool/stake-pool-data-access";
import { useMint } from "~/components/account/account-data-access";

export default function StakePoolDetail() {
  const params = useParams() as { address: string }
  assertIsAddress(params.address)
  const { account } = useWalletUiAccount()
  const stakePool = useStakePool({ stakePoolAddress: params.address })
  const mint = useMint({ mintAddress: stakePool.data?.data.config.stakeTokenMint })

  if (!stakePool.isFetched || !mint.isFetched) {
    return <div>Loading...</div>
  }

  return (<div>
    <h1>Stake Pool Detail</h1>

    <ShowStakePool stakePool={stakePool.data!} mint={mint.data!} />
    {account && <StakeDephyId stakePoolAddress={params.address} />}
    <ListNftStakes />
  </div>)
}
