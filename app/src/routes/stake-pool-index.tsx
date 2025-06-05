import { useWalletUi } from "@wallet-ui/react";
import { Initialize } from "~/components/stake-pool/stake-pool-ui";

export default function StakePoolIndex() {
  const { account } = useWalletUi()

  if (!account) {
    return <div>Connect an account to start</div>
  }

  return (
    <div>
      <h1>Stake Pool</h1>
      <Initialize />
    </div>
  )
}
