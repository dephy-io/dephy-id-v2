import { CommonCard as Card } from "~/components/common-ui"
import { useWalletUiAccount } from "@wallet-ui/react"
import { BatchStakeNFTs, BatchAdjustTokens, BatchUnstakeNFTs } from "~/components/dev-tools/dev-tools-ui"

export default function NftStakeManager() {
  const { account } = useWalletUiAccount()

  if (!account) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">NFT Stake Manager</h1>
        <Card title="Connect Wallet">
          <p>Please connect your wallet to use the nft stake manager functionality.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">NFT Stake Manager</h1>

      <BatchStakeNFTs />
      <BatchAdjustTokens />
      <BatchUnstakeNFTs />
    </div>
  )
}
