import { useWalletUi } from "@wallet-ui/react";
import { Initialize, CreateStakePool, ListStakePools } from "~/components/stake-pool/stake-pool-ui";

export default function StakePoolIndex() {
  const { account } = useWalletUi()

  if (!account) {
    return (
      <div>
        <h1>Connect an account to start</h1>
      </div>
    )
  }

  return (
    <div>
      <h1>Stake Pool</h1>
      <Initialize />
      <CreateStakePool />
      <ListStakePools />
    </div>
  )
}
