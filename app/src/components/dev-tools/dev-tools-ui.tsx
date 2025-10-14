import { useState } from "react"
import { useEffect } from "react"
import { Button } from "../ui/button"
import { CommonCard as Card, InputWithLabel } from "../common-ui"
import { useWalletUiAccount } from "@wallet-ui/react"
import { useQueryClient, useQuery } from "@tanstack/react-query"
import { address, type Instruction } from "gill"
import { useStakeNfts, useUserAssetsForStakePool, useCreateNftStakesOnly, type UserAsset } from "./dev-tools-data-access"
import { useStakePools, useUserNftStakesForPool, useStakePool } from "../stake-pool/stake-pool-data-access"
import { useListProducts, useDasRpc } from "../dephy-id/dephy-id-data-access"
import { Link } from "react-router"
import { useMemo } from "react"
import { ellipsify, useWalletUi } from "@wallet-ui/react"
import * as splToken from 'gill/programs/token'
import { useSendAndConfirmIxs } from "~/lib/utils"
import * as dephyIdStakePool from "dephy-id-stake-pool-client"
import * as mplCore from "mpl-core"

interface DeviceEntry {
  device: string
  amount: string
}

export function StakeNftsForm() {
  const { account } = useWalletUiAccount()
  const queryClient = useQueryClient()
  const stakePools = useStakePools()
  const [stakePoolAddress, setStakePoolAddress] = useState("")
  const [csvData, setCsvData] = useState<DeviceEntry[]>([])
  const [textareaValue, setTextareaValue] = useState("")
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set())
  const [defaultAmount, setDefaultAmount] = useState("1")
  const [page, setPage] = useState(1)
  const [stakedFilter, setStakedFilter] = useState<boolean>(false)

  const stakeNfts = useStakeNfts()
  const dasRpc = useDasRpc()

  const userAssets = useUserAssetsForStakePool({
    stakePoolAddress: stakePoolAddress ? address(stakePoolAddress) : undefined,
    dasRpc,
    page,
    staked: stakedFilter,
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
            {userAssets.isFetched && (
              <div className="flex justify-center items-center gap-4 mt-4">
                <Button type="button" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>Previous</Button>
                <span>Page {page}</span>
                <Button type="button" onClick={() => setPage(p => p + 1)} disabled={!userAssets.data || userAssets.data.length < 100}>Next</Button>
              </div>
            )}
            {userAssets.data && userAssets.data.length > 0 ? (
              <div className="border rounded-md overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">
                        <div className="flex items-center gap-2">
                          <Button type="button" size="sm" variant="outline" onClick={() => handleSelectAll(true)}>All</Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => handleSelectAll(false)}>None</Button>
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left font-medium">Asset Address</th>
                      <th className="px-3 py-2 text-left font-medium">Seed</th>
                      <th className="px-3 py-2 text-left font-medium">Staked</th>
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
            Format: device_address,amount (one per line, no header, amounts are in UI decimals)
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

export function BatchStakeNFTs() {
  const stakePools = useStakePools()

  const [stakePoolAddress, setStakePoolAddress] = useState("")
  const [page, setPage] = useState(1)
  const [allAssets, setAllAssets] = useState<UserAsset[]>([])
  const [isAutoLoading, setIsAutoLoading] = useState(false)
  const [selectedBatchAssets, setSelectedBatchAssets] = useState<Set<string>>(new Set())
  const createNftStakesOnly = useCreateNftStakesOnly()

  // Page size for auto-pagination
  const PAGE_LIMIT = 200

  const dasRpc = useDasRpc()

  const pageAssets = useUserAssetsForStakePool({
    stakePoolAddress: stakePoolAddress ? address(stakePoolAddress) : undefined,
    dasRpc,
    page,
    limit: PAGE_LIMIT,
    staked: false,
  })

  // Reset when inputs change
  useEffect(() => {
    setAllAssets([])
    setPage(1)
    setIsAutoLoading(!!stakePoolAddress)
    setSelectedBatchAssets(new Set())
  }, [stakePoolAddress])

  // Auto-advance pages and accumulate until a page returns fewer than PAGE_LIMIT
  useEffect(() => {
    if (!isAutoLoading) return
    if (!pageAssets.isFetched) return

    const items = pageAssets.data ?? []
    setAllAssets(prev => {
      const map = new Map(prev.map(a => [a.address, a] as const))
      items.forEach(a => map.set(a.address, a))
      return Array.from(map.values())
    })

    if (items.length === PAGE_LIMIT) {
      setPage(p => p + 1)
    } else {
      setIsAutoLoading(false)
    }
  }, [isAutoLoading, pageAssets.isFetched, pageAssets.data])

  const startLoadingAll = () => {
    if (!stakePoolAddress) return
    setAllAssets([])
    setPage(1)
    setIsAutoLoading(true)
    setSelectedBatchAssets(new Set())
  }

  const currentAssets = useMemo<UserAsset[]>(
    () => (allAssets.length > 0 ? allAssets : (pageAssets.data ?? [])) as UserAsset[],
    [allAssets, pageAssets.data]
  )
  const knownByAddress = useMemo<Map<string, UserAsset>>(
    () => new Map(currentAssets.map((a: UserAsset) => [a.address, a] as const)),
    [currentAssets]
  )
  const selectableAssets = useMemo<UserAsset[]>(
    () => currentAssets.filter((a: UserAsset) => !a.frozen),
    [currentAssets]
  )
  const selectedUnstakedCount = useMemo(() => {
    let count = 0
    for (const addr of selectedBatchAssets) {
      const a = knownByAddress.get(addr)
      if (a && !a.frozen) count++
    }
    return count
  }, [selectedBatchAssets, knownByAddress])
  const isAllSelected = selectableAssets.length > 0 && selectableAssets.every(a => selectedBatchAssets.has(a.address))

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedBatchAssets(new Set(selectableAssets.map(a => a.address)))
    } else {
      setSelectedBatchAssets(new Set())
    }
  }

  const handleToggleOne = (asset: UserAsset, checked: boolean) => {
    setSelectedBatchAssets(prev => {
      const next = new Set(prev)
      if (checked) next.add(asset.address)
      else next.delete(asset.address)
      return next
    })
  }

  const handleStakeSelected = async () => {
    if (!stakePoolAddress) return
    const targets = Array.from(selectedBatchAssets)
      .map(addr => knownByAddress.get(addr))
      .filter((a): a is UserAsset => !!a && !a.frozen)
      .map(a => a.address)
    if (targets.length === 0) return
    try {
      const { results } = await createNftStakesOnly.mutateAsync({ stakePoolAddress, assets: targets })
      const success = results.filter(r => r.status === 'success').length
      const error = results.length - success
      alert(`Stake Selected finished. Success: ${success}, Errors: ${error}`)
    } catch (e) {
      console.error(e)
      alert('Stake Selected failed. See console for details.')
    } finally {
      // Reload all pages after mutate and clear selection
      startLoadingAll()
      setSelectedBatchAssets(new Set())
    }
  }

  return (
    <Card title="Batch Stake NFTs">
      <div className="space-y-4">
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
          {stakePools.error && (
            <p className="text-sm text-red-500">Error loading stake pools: {stakePools.error.message}</p>
          )}
        </div>

        {stakePoolAddress && (
          <div className="flex items-center gap-3">
            <Button type="button" onClick={startLoadingAll} disabled={!stakePoolAddress || isAutoLoading}>
              {isAutoLoading ? 'Loading assets…' : 'Load All Unstaked Assets'}
            </Button>
            <Button
              type="button"
              onClick={handleStakeSelected}
              disabled={!stakePoolAddress || createNftStakesOnly.isPending || selectedUnstakedCount === 0}
            >
              {createNftStakesOnly.isPending ? 'Staking…' : `Stake Selected (${selectedUnstakedCount})`}
            </Button>
            <span className="text-sm">Loaded: {allAssets.length}</span>
          </div>
        )}

        {(currentAssets.length > 0) && (
          <div className="border rounded-md overflow-hidden max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={isAllSelected}
                      onChange={(e) => handleToggleAll(e.target.checked)}
                      aria-label="Select all unstaked"
                    />
                  </th>
                  <th className="px-3 py-2 text-left font-medium">Asset Address</th>
                  <th className="px-3 py-2 text-left font-medium">Seed</th>
                </tr>
              </thead>
              <tbody>
                {currentAssets.map((asset: UserAsset, index: number) => (
                  <tr key={asset.address} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedBatchAssets.has(asset.address)}
                        onChange={(e) => handleToggleOne(asset, e.target.checked)}
                        disabled={asset.frozen}
                      />
                    </td>
                    <td className="px-3 py-2 font-mono text-xs" title={asset.address}>
                      <Link to={`/dephy-id/${asset.collection}/${asset.address}`} className="text-blue-600 hover:text-blue-800">{asset.address}</Link>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{asset.seed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isAutoLoading && stakePoolAddress && pageAssets.isFetched && allAssets.length === 0 && (pageAssets.data?.length ?? 0) === 0 && (
          <p className="text-sm text-gray-500">No assets found for this collection.</p>
        )}
      </div>
    </Card>
  )
}


export function BatchAdjustTokens() {
  const { account } = useWalletUiAccount()
  const stakePools = useStakePools()
  const [stakePoolAddress, setStakePoolAddress] = useState("")
  const [selectedNftStakes, setSelectedNftStakes] = useState<Set<string>>(new Set())
  const [stakeTokenDecimals, setStakeTokenDecimals] = useState<number | undefined>(undefined)
  const { client } = useWalletUi()
  const { feePayer, sendAndConfirmIxs } = useSendAndConfirmIxs()
  const queryClient = useQueryClient()
  const [targetUiAmount, setTargetUiAmount] = useState<string>("")
  const [isAdjusting, setIsAdjusting] = useState(false)

  const userNftStakes = useUserNftStakesForPool({
    stakePoolAddress: stakePoolAddress ? address(stakePoolAddress) : ("" as any),
    userAddress: account?.address ? address(account.address) : ("" as any),
  })

  const stakePool = useStakePool({ stakePoolAddress: stakePoolAddress ? address(stakePoolAddress) : undefined })

  useEffect(() => {
    setSelectedNftStakes(new Set())
    setStakeTokenDecimals(undefined)
  }, [stakePoolAddress])

  useEffect(() => {
    const loadMint = async () => {
      try {
        if (!client || !stakePool.data) return
        const mint = await splToken.fetchMint(client.rpc, stakePool.data.data.config.stakeTokenMint)
        setStakeTokenDecimals(mint.data.decimals)
      } catch (e) {
        console.error('Failed to fetch stake token mint:', e)
      }
    }
    loadMint()
  }, [client, stakePool.data])

  const items = userNftStakes.data ?? []
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const av = a.account.amount as bigint
      const bv = b.account.amount as bigint
      if (av !== bv) return bv > av ? 1 : -1
      return a.account.nftTokenAccount.localeCompare(b.account.nftTokenAccount)
    })
  }, [items])
  const isAllSelected = items.length > 0 && items.every(it => selectedNftStakes.has(it.pubkey))

  const toggleAll = (checked: boolean) => {
    if (checked) setSelectedNftStakes(new Set(items.map(it => it.pubkey)))
    else setSelectedNftStakes(new Set())
  }

  const toggleOne = (pubkey: string, checked: boolean) => {
    setSelectedNftStakes(prev => {
      const next = new Set(prev)
      if (checked) next.add(pubkey)
      else next.delete(pubkey)
      return next
    })
  }

  const totalNetDelta = useMemo(() => {
    try {
      if (!stakeTokenDecimals) return 0n
      const ui = Number(targetUiAmount)
      if (!isFinite(ui) || ui < 0) return 0n
      const target = splToken.tokenUiAmountToAmount(ui, stakeTokenDecimals)
      let net = 0n
      for (const it of items) {
        if (!selectedNftStakes.has(it.pubkey)) continue
        const current = it.account.amount as bigint
        net += target - current
      }
      return net
    } catch {
      return 0n
    }
  }, [items, stakeTokenDecimals, targetUiAmount, Array.from(selectedNftStakes).join('|')])

  const handleAdjustAllSelected = async () => {
    try {
      if (!stakePoolAddress || !stakePool.data || stakeTokenDecimals === undefined) return
      const ui = Number(targetUiAmount)
      if (!isFinite(ui) || ui < 0) return
      const target = splToken.tokenUiAmountToAmount(ui, stakeTokenDecimals)

      // Resolve user's stake token account (ATA)
      const stakeTokenMint = stakePool.data.data.config.stakeTokenMint
      const mintAcc = await splToken.fetchMint(client.rpc, stakeTokenMint)
      const ata = (await splToken.findAssociatedTokenPda({
        mint: stakeTokenMint,
        owner: feePayer.address,
        tokenProgram: mintAcc.programAddress,
      }))[0]

      let ixs: any[] = []
      const selectedSet = selectedNftStakes
      setIsAdjusting(true)

      for (const it of items) {
        if (!selectedSet.has(it.pubkey)) continue
        const current = it.account.amount as bigint
        const delta = target - current
        if (delta === 0n) continue

        if (delta > 0n) {
          // Need to deposit (increase to target)
          ixs.push(await dephyIdStakePool.getDepositTokenInstructionAsync({
            nftStake: address(it.pubkey),
            stakePool: address(stakePoolAddress),
            user: feePayer,
            stakeTokenMint,
            stakeTokenAccount: stakePool.data.data.stakeTokenAccount,
            userStakeTokenAccount: ata,
            payer: feePayer,
            amount: delta,
          }))
        } else {
          // Need to withdraw (decrease to target)
          const withdrawAmount = -delta
          ixs.push(await dephyIdStakePool.getWithdrawInstructionAsync({
            nftStake: address(it.pubkey),
            stakePool: address(stakePoolAddress),
            user: feePayer,
            stakeTokenMint,
            stakeTokenAccount: stakePool.data.data.stakeTokenAccount,
            userStakeTokenAccount: ata,
            payer: feePayer,
            amount: withdrawAmount,
          }))
        }

        if (ixs.length >= 6) {
          await sendAndConfirmIxs(ixs)
          ixs = []
        }
      }

      if (ixs.length) {
        await sendAndConfirmIxs(ixs)
      }

      queryClient.invalidateQueries({ queryKey: ['stake-pool', 'user-nft-stakes'] })
    } catch (e) {
      console.error('Adjust selected deposit failed:', e)
    } finally {
      try { await userNftStakes.refetch() } catch { }
      setSelectedNftStakes(new Set())
      setIsAdjusting(false)
    }
  }

  return (
    <Card title="Batch Adjust Tokens">
      <div className="space-y-4">
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
          {stakePools.error && (
            <p className="text-sm text-red-500">Error loading stake pools: {stakePools.error.message}</p>
          )}
        </div>

        {stakePoolAddress && (
          <>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">
                Loaded: <span className="font-medium">{items.length}</span> · Selected: <span className="font-medium">{selectedNftStakes.size}</span>
              </div>
              <div className="text-sm text-gray-600">
                Planned total:{' '}
                {stakeTokenDecimals !== undefined && totalNetDelta !== 0n
                  ? `${totalNetDelta > 0n ? '-' : '+'}${splToken.tokenAmountToUiAmount(totalNetDelta > 0n ? totalNetDelta : -totalNetDelta, stakeTokenDecimals)}`
                  : ''}
              </div>
              <input
                type="number"
                min={0}
                step={stakeTokenDecimals !== undefined ? Math.pow(10, -stakeTokenDecimals) : 0.000001}
                value={targetUiAmount}
                onChange={(e) => setTargetUiAmount(e.target.value)}
                placeholder="Target UI amount"
                className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Button
                type="button"
                onClick={handleAdjustAllSelected}
                disabled={!stakePoolAddress || selectedNftStakes.size === 0 || !targetUiAmount || isAdjusting || stakeTokenDecimals === undefined}
              >
                {isAdjusting ? 'Adjusting…' : 'Adjust Selected'}
              </Button>
            </div>

            <div className="border rounded-md overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={isAllSelected}
                        onChange={(e) => toggleAll(e.target.checked)}
                        aria-label="Select all"
                      />
                    </th>
                    <th className="px-3 py-2 text-left font-medium">Asset</th>
                    <th className="px-3 py-2 text-left font-medium">NFT Stake</th>
                    <th className="px-3 py-2 text-left font-medium">Amount (UI)</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((it, index: number) => (
                    <tr key={it.pubkey} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={selectedNftStakes.has(it.pubkey)}
                          onChange={(e) => toggleOne(it.pubkey, e.target.checked)}
                        />
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {stakePool.data && (
                          <Link
                            to={`/dephy-id/${stakePool.data.data.config.collection}/${it.account.nftTokenAccount}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {it.account.nftTokenAccount}
                          </Link>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">
                        <Link to={`/nft-stake/${it.pubkey}`} className="text-blue-600 hover:text-blue-800">
                          {ellipsify(it.pubkey)}
                        </Link>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {stakeTokenDecimals !== undefined
                          ? splToken.tokenAmountToUiAmount(it.account.amount, stakeTokenDecimals)
                          : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {userNftStakes.isLoading && (
              <p className="px-3 py-2 text-sm text-gray-500">Loading your stakes…</p>
            )}
            {userNftStakes.error && (
              <p className="px-3 py-2 text-sm text-red-500">Error loading your stakes: {userNftStakes.error.message}</p>
            )}
            {!userNftStakes.isLoading && items.length === 0 && (
              <p className="px-3 py-2 text-sm text-gray-500">No NFT stakes found for you in this pool.</p>
            )}
          </>
        )}
      </div>
    </Card>
  )
}


export function BatchTransferForm() {
  const { account } = useWalletUiAccount()
  const { client } = useWalletUi()
  const { feePayer, sendAndConfirmIxs } = useSendAndConfirmIxs()
  const products = useListProducts({})
  const [productAddress, setProductAddress] = useState("")
  const [destAddress, setDestAddress] = useState("")
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set())
  const [isTransferring, setIsTransferring] = useState(false)
  const [page, setPage] = useState(1)

  const dasRpc = useDasRpc()

  // Fetch user assets
  const userAssets = useQuery<UserAsset[]>({
    queryKey: ['user-assets', 'product-collection', { productAddress, userAddress: account?.address, page }],
    queryFn: async () => {
      if (!account?.address || !productAddress || !dasRpc) {
        return []
      }

      try {
        const searchArgs: any = {
          ownerAddress: address(account.address),
          grouping: ["collection", productAddress],
          page,
          limit: 100,
          displayOptions: {
            showCollectionMetadata: false,
          }
        }

        const response = await dasRpc.searchAssets(searchArgs).send()

        const assets = response.items.map((asset) => ({
          address: asset.id,
          name: asset.content?.metadata?.name,
          collection: productAddress,
          owner: account.address,
          metadata: asset.content?.metadata,
          seed: asset.plugins?.attributes?.data?.attribute_list?.find((attr: { key: string; value: string }) => attr.key === "Seed")?.value,
          frozen: asset.plugins?.freeze_delegate?.data.frozen,
        }))

        return assets
      } catch (error) {
        console.error('Error fetching user assets:', error)
        return []
      }
    },
    enabled: !!account?.address && !!productAddress && !!dasRpc,
  })

  useEffect(() => {
    setSelectedAssets(new Set())
    setPage(1)
  }, [productAddress])

  const handleAssetSelection = (assetAddress: string, isChecked: boolean) => {
    const newSelectedAssets = new Set(selectedAssets)
    if (isChecked) {
      newSelectedAssets.add(assetAddress)
    } else {
      newSelectedAssets.delete(assetAddress)
    }
    setSelectedAssets(newSelectedAssets)
  }

  const handleSelectAll = (isChecked: boolean) => {
    if (!userAssets.data) return
    if (isChecked) {
      const unfrozenAssets = userAssets.data.filter((asset: UserAsset) => !asset.frozen)
      setSelectedAssets(new Set(unfrozenAssets.map((asset: UserAsset) => asset.address)))
    } else {
      setSelectedAssets(new Set())
    }
  }

  const unfrozenAssets = useMemo(() => {
    return userAssets.data?.filter((asset: UserAsset) => !asset.frozen) ?? []
  }, [userAssets.data])

  const isAllSelected = unfrozenAssets.length > 0 && unfrozenAssets.every((asset: UserAsset) => selectedAssets.has(asset.address))

  const handleTransfer = async () => {
    if (!productAddress || !destAddress || selectedAssets.size === 0 || !client) return

    try {
      setIsTransferring(true)
      const productAsset = address(productAddress)
      const dest = address(destAddress)

      let ixs: Instruction[] = []
      let processed = 0

      for (const deviceAddress of Array.from(selectedAssets)) {
        try {
          const deviceAsset = await mplCore.fetchAssetAccount(client.rpc, address(deviceAddress))

          // Skip if already owned by destination or not owned by current user
          if (deviceAsset.data.base.owner == dest || deviceAsset.data.base.owner != feePayer.address) {
            console.log('skip', deviceAddress)
            continue
          }

          console.log('transfer', deviceAddress)
          ixs.push(
            mplCore.getTransferV1Instruction({
              asset: address(deviceAddress),
              collection: productAsset,
              payer: feePayer,
              newOwner: dest,
              authority: feePayer,
            })
          )

          if (ixs.length >= 22) {
            const signature = await sendAndConfirmIxs(ixs)
            console.log('Transaction signature:', signature, processed)
            ixs = []
          }
          processed++
        } catch (error) {
          console.error(`Error transferring ${deviceAddress}:`, error)
        }
      }

      if (ixs.length > 0) {
        const signature = await sendAndConfirmIxs(ixs)
        console.log('Final transaction signature:', signature)
      }

      alert(`Transfer completed! Processed ${processed} assets.`)

      await userAssets.refetch()
      setSelectedAssets(new Set())
    } catch (error) {
      console.error('Transfer failed:', error)
      alert('Transfer failed. Check console for details.')
    } finally {
      setIsTransferring(false)
    }
  }

  return (
    <Card title="Batch Transfer NFTs">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Product (Collection)</label>
          <select
            value={productAddress}
            onChange={(e) => setProductAddress(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select a product</option>
            {products.data?.map((product) => (
              <option key={product.pubkey} value={product.account.collection}>
                {product.account.collection}
              </option>
            ))}
          </select>
          {products.isLoading && (
            <p className="text-sm text-gray-500">Loading products...</p>
          )}
          {products.error && (
            <p className="text-sm text-red-500">Error loading products: {products.error.message}</p>
          )}
        </div>

        <InputWithLabel
          label="Destination Address"
          name="destAddress"
          value={destAddress}
          onChange={(e) => setDestAddress(e.target.value)}
          placeholder="Enter destination wallet address"
          required
        />

        {productAddress && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Assets for Selected Collection</label>
            {userAssets.isLoading && (
              <p className="text-sm text-gray-500">Loading your assets...</p>
            )}
            {userAssets.error && (
              <p className="text-sm text-red-500">Error loading assets: {userAssets.error.message}</p>
            )}
            {userAssets.isFetched && (
              <div className="flex justify-center items-center gap-4 mt-4">
                <Button type="button" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>Previous</Button>
                <span>Page {page}</span>
                <Button type="button" onClick={() => setPage(p => p + 1)} disabled={!userAssets.data || userAssets.data.length < 100}>Next</Button>
              </div>
            )}
            {userAssets.data && userAssets.data.length > 0 ? (
              <div className="border rounded-md overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">
                        <div className="flex items-center gap-2">
                          <Button type="button" size="sm" variant="outline" onClick={() => handleSelectAll(true)}>All</Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => handleSelectAll(false)}>None</Button>
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left font-medium">Asset Address</th>
                      <th className="px-3 py-2 text-left font-medium">Seed</th>
                      <th className="px-3 py-2 text-left font-medium">Frozen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userAssets.data.map((asset: UserAsset, index: number) => (
                      <tr key={asset.address} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedAssets.has(asset.address)}
                            onChange={(e) => handleAssetSelection(asset.address, e.target.checked)}
                            className="rounded"
                            disabled={asset.frozen}
                          />
                        </td>
                        <td className="px-3 py-2 font-mono text-xs" title={asset.address}>
                          <Link to={`/dephy-id/${asset.collection}/${asset.address}`} className="text-blue-600 hover:text-blue-800">
                            {asset.address}
                          </Link>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">
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

        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={handleTransfer}
            disabled={!productAddress || !destAddress || selectedAssets.size === 0 || isTransferring}
            className="w-full"
          >
            {isTransferring ? 'Transferring...' : `Transfer Selected (${selectedAssets.size})`}
          </Button>
        </div>
      </div>
    </Card>
  )
}

export function BatchUnstakeNFTs() {
  const { account } = useWalletUiAccount()
  const { client } = useWalletUi()
  const { feePayer, sendAndConfirmIxs } = useSendAndConfirmIxs()
  const stakePools = useStakePools()
  const [stakePoolAddress, setStakePoolAddress] = useState("")
  const [onlyZero, setOnlyZero] = useState(true)
  const [selectedNftStakes, setSelectedNftStakes] = useState<Set<string>>(new Set())
  const [isUnstaking, setIsUnstaking] = useState(false)

  const userNftStakes = useUserNftStakesForPool({
    stakePoolAddress: (stakePoolAddress ? (address(stakePoolAddress) as any) : (undefined as any)),
    userAddress: (account?.address as any),
  })

  const items = userNftStakes.data ?? []
  const filtered = useMemo(() => {
    if (!onlyZero) return items
    return items.filter(it => (it.account.amount as bigint) === 0n)
  }, [items, onlyZero])
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a.account.amount as bigint
      const bv = b.account.amount as bigint
      if (av !== bv) return bv > av ? 1 : -1
      return a.account.nftTokenAccount.localeCompare(b.account.nftTokenAccount)
    })
  }, [filtered])

  const currentCollection = useMemo(() => {
    return stakePools.data?.find(p => p.pubkey === stakePoolAddress)?.account.config.collection
  }, [stakePools.data, stakePoolAddress])

  // Fetch stake token mint decimals for UI amount formatting
  const [stakeTokenDecimals, setStakeTokenDecimals] = useState<number | undefined>(undefined)
  useEffect(() => {
    let cancelled = false
    async function loadMint() {
      try {
        if (!client || !stakePoolAddress) return
        const sp = await dephyIdStakePool.fetchStakePoolAccount(client.rpc, address(stakePoolAddress))
        const mint = await splToken.fetchMint(client.rpc, sp.data.config.stakeTokenMint)
        if (!cancelled) setStakeTokenDecimals(mint.data.decimals)
      } catch (e) {
        console.error('Failed to fetch stake token mint for BatchUnstakeNFTs:', e)
      }
    }
    loadMint()
    return () => { cancelled = true }
  }, [client, stakePoolAddress])

  const isAllSelected = sorted.length > 0 && sorted.every(it => selectedNftStakes.has(it.pubkey))
  const toggleAll = (checked: boolean) => {
    if (checked) setSelectedNftStakes(new Set(sorted.map(it => it.pubkey)))
    else setSelectedNftStakes(new Set())
  }
  const toggleOne = (pubkey: string, checked: boolean) => {
    setSelectedNftStakes(prev => {
      const next = new Set(prev)
      if (checked) next.add(pubkey)
      else next.delete(pubkey)
      return next
    })
  }

  const handleUnstakeSelected = async (): Promise<void> => {
    try {
      if (!stakePoolAddress || !account?.address) return
      setIsUnstaking(true)
      const stakePoolAcc = await dephyIdStakePool.fetchStakePoolAccount(client.rpc, address(stakePoolAddress))
      const mplCoreCollection = stakePoolAcc.data.config.collection

      const selected = sorted.filter((it: any) => selectedNftStakes.has(it.pubkey))
      const BATCH = 6
      for (let i = 0; i < selected.length; i += BATCH) {
        const slice = selected.slice(i, i + BATCH)
        const ixs = await Promise.all(
          slice.map(async (it: any) => {
            return dephyIdStakePool.getUnstakeNftInstructionAsync({
              nftStake: address(it.pubkey),
              stakePool: address(stakePoolAddress),
              stakeAuthority: feePayer,
              mplCoreCollection,
              mplCoreAsset: it.account.nftTokenAccount,
              payer: feePayer,
            })
          })
        )
        await sendAndConfirmIxs(ixs)
      }
    } catch (e) {
      console.error('Unstake failed', e)
    } finally {
      // Reload data and clear selection
      try { await userNftStakes.refetch() } catch { }
      setSelectedNftStakes(new Set())
      setIsUnstaking(false)
    }
  }

  return (
    <Card title="Batch Unstake NFTs">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Stake Pool</label>
          <select
            value={stakePoolAddress}
            onChange={(e) => {
              setStakePoolAddress(e.target.value)
              setSelectedNftStakes(new Set())
            }}
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
          {stakePools.error && (
            <p className="text-sm text-red-500">Error loading stake pools: {stakePools.error.message}</p>
          )}
        </div>

        {stakePoolAddress && (
          <>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">
                Loaded: <span className="font-medium">{items.length}</span> · Showing: <span className="font-medium">{sorted.length}</span> · Selected: <span className="font-medium">{selectedNftStakes.size}</span>
              </div>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={onlyZero}
                  onChange={(e) => setOnlyZero(e.target.checked)}
                />
                Only show amount = 0
              </label>
              <Button
                type="button"
                onClick={handleUnstakeSelected}
                disabled={!stakePoolAddress || selectedNftStakes.size === 0 || isUnstaking}
              >
                {isUnstaking ? 'Unstaking…' : `Unstake Selected (${selectedNftStakes.size})`}
              </Button>
            </div>

            <div className="border rounded-md overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={isAllSelected}
                        onChange={(e) => toggleAll(e.target.checked)}
                        aria-label="Select all"
                      />
                    </th>
                    <th className="px-3 py-2 text-left font-medium">Asset</th>
                    <th className="px-3 py-2 text-left font-medium">NFT Stake</th>
                    <th className="px-3 py-2 text-left font-medium">Amount (UI)</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((it, index) => (
                    <tr key={it.pubkey} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={selectedNftStakes.has(it.pubkey)}
                          onChange={(e) => toggleOne(it.pubkey, e.target.checked)}
                        />
                      </td>
                      <td className="px-3 py-2 font-mono text-xs" title={it.account.nftTokenAccount}>
                        {currentCollection ? (
                          <Link to={`/dephy-id/${currentCollection}/${it.account.nftTokenAccount}`} className="text-blue-600 hover:text-blue-800">
                            {it.account.nftTokenAccount}
                          </Link>
                        ) : (
                          <span>{ellipsify(it.account.nftTokenAccount)}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">
                        <Link to={`/nft-stake/${it.pubkey}`} className="text-blue-600 hover:text-blue-800">
                          {ellipsify(it.pubkey)}
                        </Link>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {stakeTokenDecimals !== undefined
                          ? splToken.tokenAmountToUiAmount(it.account.amount, stakeTokenDecimals)
                          : it.account.amount.toString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {userNftStakes.isLoading && (
              <p className="px-3 py-2 text-sm text-gray-500">Loading your stakes…</p>
            )}
            {userNftStakes.error && (
              <p className="px-3 py-2 text-sm text-red-500">Error loading your stakes: {userNftStakes.error.message}</p>
            )}
            {!userNftStakes.isLoading && sorted.length === 0 && (
              <p className="px-3 py-2 text-sm text-gray-500">No NFT stakes found matching the filter.</p>
            )}
          </>
        )}
      </div>
    </Card>
  )
}
