import { useState } from "react"
import { Button } from "../ui/button"
import { CommonCard as Card, InputWithLabel } from "../common-ui"
import { useWalletUiAccount } from "@wallet-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { address } from "gill"
import { useStakeNfts, useUserAssetsForStakePool, type UserAsset } from "./dev-tools-data-access"
import { useStakePools } from "../stake-pool/stake-pool-data-access"
import { createDasRpc } from "../../lib/das"
import { Link } from "react-router"

interface DeviceEntry {
  device: string
  amount: string
}

export function StakeNftsForm() {
  const { account } = useWalletUiAccount()
  const queryClient = useQueryClient()
  const stakePools = useStakePools()
  const [stakePoolAddress, setStakePoolAddress] = useState("")
  const [rpcUrl, setRpcUrl] = useState("")
  const [csvData, setCsvData] = useState<DeviceEntry[]>([])
  const [textareaValue, setTextareaValue] = useState("")
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set())
  const [defaultAmount, setDefaultAmount] = useState("1")

  const stakeNfts = useStakeNfts()

  // Create DAS RPC instance
  const dasRpc = rpcUrl ? createDasRpc(rpcUrl) : undefined

  const userAssets = useUserAssetsForStakePool({
    stakePoolAddress: stakePoolAddress ? address(stakePoolAddress) : undefined,
    dasRpc: dasRpc
  })

  const handleTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value
    setTextareaValue(text)

    if (text.trim()) {
      const lines = text.trim().split('\n')

      // Parse each line as CSV format: device,amount
      const data = lines.map(line => {
        const [device, amount] = line.split(',')
        return { device: device?.trim(), amount: amount?.trim() }
      }).filter(entry => entry.device && entry.amount)

      setCsvData(data)
    } else {
      setCsvData([])
    }
  }

  const handleAssetSelection = (asset: UserAsset, isChecked: boolean) => {
    const newSelectedAssets = new Set(selectedAssets)

    if (isChecked) {
      newSelectedAssets.add(asset.address)
    } else {
      newSelectedAssets.delete(asset.address)
    }

    setSelectedAssets(newSelectedAssets)

    // Create a map of existing amounts from current CSV data
    const existingAmounts = new Map<string, string>()
    csvData.forEach(entry => {
      existingAmounts.set(entry.device, entry.amount)
    })

    // Update textarea with selected assets, preserving existing amounts
    const assetLines = Array.from(newSelectedAssets).map(address => {
      const existingAmount = existingAmounts.get(address)
      const amount = existingAmount || defaultAmount // Use existing amount if available, otherwise use default
      return `${address},${amount}`
    })
    const newTextareaValue = assetLines.join('\n')
    setTextareaValue(newTextareaValue)

    // Update CSV data
    const newCsvData = assetLines.map(line => {
      const [device, amount] = line.split(',')
      return { device: device.trim(), amount: amount.trim() }
    })
    setCsvData(newCsvData)
  }

  const handleSelectAll = (isChecked: boolean) => {
    if (!userAssets.data) return

    let newSelectedAssets: Set<string>
    if (isChecked) {
      // Select all assets
      newSelectedAssets = new Set(userAssets.data.filter(asset => !asset.frozen).map(asset => asset.address))
    } else {
      // Deselect all assets
      newSelectedAssets = new Set()
    }

    setSelectedAssets(newSelectedAssets)

    // Create a map of existing amounts from current CSV data
    const existingAmounts = new Map<string, string>()
    csvData.forEach(entry => {
      existingAmounts.set(entry.device, entry.amount)
    })

    // Update textarea with selected assets, preserving existing amounts
    const assetLines = Array.from(newSelectedAssets).map(address => {
      const existingAmount = existingAmounts.get(address)
      const amount = existingAmount || defaultAmount // Use existing amount if available, otherwise use default
      return `${address},${amount}`
    })
    const newTextareaValue = assetLines.join('\n')
    setTextareaValue(newTextareaValue)

    // Update CSV data
    const newCsvData = assetLines.map(line => {
      const [device, amount] = line.split(',')
      return { device: device.trim(), amount: amount.trim() }
    })
    setCsvData(newCsvData)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!account || !stakePoolAddress || csvData.length === 0) {
      alert("Please fill in all required fields and upload a CSV file")
      return
    }

    try {
      await stakeNfts.mutateAsync({
        stakePoolAddress,
        queryClient,
        csvData,
        userAddress: account.address
      })
    } catch (error) {
      console.error("Error staking NFTs:", error)
      alert("Error staking NFTs. Check console for details.")
    }
  }

  return (
    <Card title="Stake NFTs">
      <form onSubmit={handleSubmit} className="space-y-4">

        <InputWithLabel
          label="DAS RPC URL"
          name="rpcUrl"
          value={rpcUrl}
          onChange={(e) => setRpcUrl(e.target.value)}
          placeholder="https://mainnet.helius-rpc.com/?api-key=<your-api-key>"
          required
        />

        <div className="space-y-2">
          <label className="text-sm font-medium">Stake Pool</label>
          <select
            value={stakePoolAddress}
            onChange={(e) => setStakePoolAddress(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select a stake pool</option>
            {stakePools.data?.map((pool) => (
              <option key={pool.pubkey} value={pool.pubkey}>
                {pool.pubkey} ({pool.account.config.collection})
              </option>
            ))}
          </select>
          {stakePools.isLoading && (
            <p className="text-sm text-gray-500">Loading stake pools...</p>
          )}
        </div>

        <InputWithLabel
          label="Default Amount"
          name="defaultAmount"
          value={defaultAmount}
          onChange={(e) => setDefaultAmount(e.target.value)}
          placeholder="1"
          type="number"
          min="1"
          step="1"
          required
        />

        {stakePools.error && (
          <p className="text-sm text-red-500">Error loading stake pools: {stakePools.error.message}</p>
        )}

        {stakePoolAddress && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Assets for Selected Collection</label>
            {userAssets.isLoading && (
              <p className="text-sm text-gray-500">Loading your assets...</p>
            )}
            {userAssets.error && (
              <p className="text-sm text-red-500">Error loading assets: {userAssets.error.message}</p>
            )}
            {userAssets.data && userAssets.data.length > 0 ? (
              <div className="border rounded-md overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleSelectAll(true)}>All</Button>
                          <Button size="sm" variant="outline" onClick={() => handleSelectAll(false)}>None</Button>
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left font-medium">Asset Address</th>
                      <th className="px-3 py-2 text-left font-medium">Seed</th>
                      <th className="px-3 py-2 text-left font-medium">Frozen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userAssets.data.map((asset, index: number) => (
                      <tr key={asset.address} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedAssets.has(asset.address)}
                            onChange={(e) => handleAssetSelection(asset, e.target.checked)}
                            className="rounded"
                            disabled={asset.frozen}
                          />
                        </td>
                        <td className="px-3 py-2" title={asset.address}>
                          <Link to={`/dephy-id/${asset.collection}/${asset.address}`}>{asset.address}</Link>
                        </td>
                        <td className="px-3 py-2">
                          {asset.seed}
                        </td>
                        <td className="px-3 py-2">
                          {asset.frozen ? 'Yes' : 'No'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : userAssets.data && userAssets.data.length === 0 ? (
              <p className="text-sm text-gray-500">No assets found for this collection.</p>
            ) : null}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Device Data</label>
          <textarea
            value={textareaValue}
            onChange={handleTextareaChange}
            placeholder="device_address,amount"
            className="w-full min-h-32 p-3 border rounded-md resize-vertical font-mono text-sm"
            required
          />
          <p className="text-xs text-muted-foreground">
            Format: device_address,amount (one per line, no header)
          </p>
        </div>



        <Button
          type="submit"
          disabled={stakeNfts.isPending || !account || !stakePoolAddress || csvData.length === 0}
          className="w-full"
        >
          {stakeNfts.isPending ? "Staking NFTs..." : "Stake NFTs"}
        </Button>

        {stakeNfts.error && (
          <div className="text-red-600 text-sm">
            Error: {stakeNfts.error.message}
          </div>
        )}

        {stakeNfts.isSuccess && (
          <div className="text-green-600 text-sm">
            NFTs staked successfully!
          </div>
        )}
      </form>
    </Card>
  )
}
