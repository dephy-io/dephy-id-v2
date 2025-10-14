import { CommonCard as Card } from "~/components/common-ui"
import { useWalletUiAccount } from "@wallet-ui/react"
import { BatchTransferForm, StakeNftsForm } from "~/components/dev-tools/dev-tools-ui"

export default function DevTools() {
  const { account } = useWalletUiAccount()

  if (!account) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Dev Tools</h1>
        <Card title="Connect Wallet">
          <p>Please connect your wallet to use the dev tools functionality.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Dev Tools</h1>

      <StakeNftsForm />
      <BatchTransferForm />
    </div>
  )
}
