import { useState, useMemo } from "react"
import { CommonCard as Card } from "~/components/common-ui"
import { useDeviceScores, useDeviceAssetMapping, type DeviceScoresResponse, type DeviceScore } from "~/components/dodp-tools/dodp-tools-data-access"
import { useNftStakes, useStakePool, useStakePools, useUserStakesForPool } from "~/components/stake-pool/stake-pool-data-access"
import { address, type Address } from "gill"
import * as splToken from "gill/programs/token"
import { useMint } from "../account/account-data-access"
import { ellipsify } from "@wallet-ui/react"
import { Button } from "../ui/button"
import type { UserStakeAccount } from "dephy-id-stake-pool-client"
import { useWalletUi } from "@wallet-ui/react"
import { useSendAndConfirmIxs } from "~/lib/utils"
import * as dephyIdStakePool from "dephy-id-stake-pool-client"


export function PositionManager() {
  const [stakePoolAddress, setStakePoolAddress] = useState<Address | undefined>(undefined)
  const [amountInput, setAmountInput] = useState<string>("1000")
  const [NInput, setNInput] = useState<string>("5000")
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const stakePools = useStakePools()
  const deviceScores = useDeviceScores({ batch: 500 })
  const stakePool = useStakePool({ stakePoolAddress })
  const nftStakesQuery = useNftStakes({ stakePoolAddress })
  const mintQuery = useMint({ mintAddress: stakePool.data?.data.config.stakeTokenMint })
  const userStakesQuery = useUserStakesForPool({ stakePoolAddress })
  const decimals = mintQuery.data?.data.decimals ?? 0
  const { client } = useWalletUi()
  const { feePayer, sendAndConfirmIxs } = useSendAndConfirmIxs()

  const deviceAssetMapping = useDeviceAssetMapping({
    collection: stakePool.data?.data.config.collection,
    scores: deviceScores.data?.scores,
  })

  const assetToDevice = deviceAssetMapping.data?.assetToDevice || {}

  const deviceToScore = useMemo(() => {
    const m: Record<string, DeviceScore> = {}
    for (const s of deviceScores.data?.scores ?? []) {
      m[s.worker_pubkey] = s
    }
    return m
  }, [deviceScores.data?.scores])

  const sortedStakes = useMemo(() => {
    const items = (nftStakesQuery.data ?? [])
      .filter((it) => Boolean(assetToDevice[it.account.nftTokenAccount]))
      .map((it) => {
        const device = assetToDevice[it.account.nftTokenAccount]
        const scoreObj = deviceToScore[device]
        const uiAmount = splToken.tokenAmountToUiAmount(it.account.amount, decimals)
        return { it, device, scoreObj, uiAmount }
      })
    items.sort((a, b) => (b.scoreObj?.score ?? -Infinity) - (a.scoreObj?.score ?? -Infinity))
    return items
  }, [nftStakesQuery.data, assetToDevice, deviceToScore, decimals])

  const userStakesByNftStake = useMemo(() => {
    const m: Record<string, UserStakeAccount> = {}
    for (const s of userStakesQuery.data ?? []) {
      m[s.account.nftStake] = s.account
    }
    return m
  }, [userStakesQuery.data])

  const selectedCount = useMemo(() => Object.values(selected).filter(Boolean).length, [selected])
  const amountValid = useMemo(() => {
    const v = Number(amountInput)
    return Number.isFinite(v) && v >= 0
  }, [amountInput])

  async function handleAdjustSelected() {
    const BATCH_SIZE = 6
    try {
      setIsProcessing(true)
      if (!stakePoolAddress || !stakePool.data || !client) return
      const ui = Number(amountInput)
      if (!isFinite(ui) || ui < 0) return
      const target = splToken.tokenUiAmountToAmount(ui, decimals)

      const stakeTokenMint = stakePool.data.data.config.stakeTokenMint
      const mintAcc = await splToken.fetchMint(client.rpc, stakeTokenMint)
      const ata = (await splToken.findAssociatedTokenPda({
        mint: stakeTokenMint,
        owner: feePayer.address,
        tokenProgram: mintAcc.programAddress,
      }))[0]

      let ixs: any[] = []
      for (const { it } of sortedStakes) {
        if (!selected[it.pubkey]) continue
        const userStake = userStakesByNftStake[it.pubkey]
        const current = (userStake?.amount as bigint | undefined) ?? 0n
        const delta = target - current
        if (delta === 0n) continue

        if (delta > 0n) {
          ixs.push(await dephyIdStakePool.getDepositTokenInstructionAsync({
            nftStake: address(it.pubkey),
            stakePool: stakePoolAddress,
            user: feePayer,
            stakeTokenMint,
            stakeTokenAccount: stakePool.data.data.stakeTokenAccount,
            userStakeTokenAccount: ata,
            payer: feePayer,
            amount: delta,
          }))
        } else {
          const withdrawAmount = -delta
          ixs.push(await dephyIdStakePool.getWithdrawInstructionAsync({
            nftStake: address(it.pubkey),
            stakePool: stakePoolAddress,
            user: feePayer,
            stakeTokenMint,
            stakeTokenAccount: stakePool.data.data.stakeTokenAccount,
            userStakeTokenAccount: ata,
            payer: feePayer,
            amount: withdrawAmount,
          }))
        }

        if (ixs.length >= BATCH_SIZE) {
          await sendAndConfirmIxs(ixs)
          ixs = []
        }
      }

      if (ixs.length) {
        await sendAndConfirmIxs(ixs)
      }

      await Promise.allSettled([
        nftStakesQuery.refetch?.(),
        userStakesQuery.refetch?.(),
        mintQuery.refetch?.(),
      ])
      setSelected({})
    } catch (e) {
      console.error('Adjust selected failed:', e)
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleWithdrawSelected() {
    const BATCH_SIZE = 6
    try {
      setIsProcessing(true)
      if (!stakePoolAddress || !stakePool.data || !client) return
      const stakeTokenMint = stakePool.data.data.config.stakeTokenMint
      const mintAcc = await splToken.fetchMint(client.rpc, stakeTokenMint)
      const ata = (await splToken.findAssociatedTokenPda({
        mint: stakeTokenMint,
        owner: feePayer.address,
        tokenProgram: mintAcc.programAddress,
      }))[0]

      let ixs: any[] = []
      for (const { it } of sortedStakes) {
        if (!selected[it.pubkey]) continue
        const userStake = userStakesByNftStake[it.pubkey]
        const amt = (userStake?.amount as bigint | undefined) ?? 0n
        if (amt === 0n) continue

        ixs.push(await dephyIdStakePool.getWithdrawInstructionAsync({
          nftStake: address(it.pubkey),
          stakePool: stakePoolAddress,
          user: feePayer,
          stakeTokenMint,
          stakeTokenAccount: stakePool.data.data.stakeTokenAccount,
          userStakeTokenAccount: ata,
          payer: feePayer,
          amount: amt,
        }))

        if (ixs.length >= BATCH_SIZE) {
          await sendAndConfirmIxs(ixs)
          ixs = []
        }
      }

      if (ixs.length) {
        await sendAndConfirmIxs(ixs)
      }

      await Promise.allSettled([
        nftStakesQuery.refetch?.(),
        userStakesQuery.refetch?.(),
        mintQuery.refetch?.(),
      ])
      setSelected({})
    } catch (e) {
      console.error('Withdraw selected failed:', e)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card title="Position Manager">
      <div className="grid gap-3">

        <div className="space-y-2">
          <div className="text-sm font-medium">Device Scores, {deviceScores.data?.total} total</div>
          <DeviceScoreList
            data={deviceScores.data}
            isLoading={deviceScores.isLoading}
            error={deviceScores.error}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Stake Pool</label>
          <select
            value={String(stakePoolAddress ?? "")}
            onChange={(e) => {
              const v = e.target.value
              setStakePoolAddress(v ? address(v) : undefined)
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a stake pool</option>
            {stakePools.data?.map((pool) => (
              <option key={pool.pubkey} value={pool.pubkey}>
                {pool.pubkey}
              </option>
            ))}
          </select>
        </div>

        {!stakePoolAddress && (
          <div className="text-sm text-neutral-500">Select a stake pool to load NFT stakes.</div>
        )}

        {stakePoolAddress && nftStakesQuery && (
          <div className="text-sm space-y-2">
            {nftStakesQuery.isLoading && <div>Loading stakes…</div>}
            {nftStakesQuery.error && <div className="text-red-500">Failed to load stakes.</div>}
            {nftStakesQuery.data && (
              <>
                <div className="text-gray-600">Found {nftStakesQuery.data.length} NFT stakes, only showing stakes with a score</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500">Selected: {Object.values(selected).filter(Boolean).length}</span>
                </div>
                <div className="border rounded-md overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-gray-50 text-left">
                      <tr>
                        <th className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={sortedStakes.length > 0 && sortedStakes.every(({ it }) => selected[it.pubkey])}
                            onChange={(e) => {
                              const all: Record<string, boolean> = { ...selected }
                              if (e.target.checked) {
                                for (const { it } of sortedStakes) all[it.pubkey] = true
                              } else {
                                for (const { it } of sortedStakes) delete all[it.pubkey]
                              }
                              setSelected(all)
                            }}
                            disabled={isProcessing}
                          />
                        </th>
                        <th className="px-3 py-2">Rank</th>
                        <th className="px-3 py-2">NFT Stake</th>
                        <th className="px-3 py-2">Asset</th>
                        <th className="px-3 py-2">Device</th>
                        <th className="px-3 py-2">Score</th>
                        <th className="px-3 py-2">Amount</th>
                        <th className="px-3 py-2">User Stake Amount</th>
                        <th className="px-3 py-2">Active</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono text-xs">
                      {sortedStakes.map(({ it, device, scoreObj, uiAmount }, index: number) => (
                        <tr key={it.pubkey} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={!!selected[it.pubkey]}
                              onChange={(e) => setSelected((prev) => ({ ...prev, [it.pubkey]: e.target.checked }))}
                              disabled={isProcessing}
                            />
                          </td>
                          <td className="px-3 py-2">{index + 1}</td>
                          <td className="px-3 py-2">{ellipsify(it.pubkey)}</td>
                          <td className="px-3 py-2">{ellipsify(it.account.nftTokenAccount)}</td>
                          <td className="px-3 py-2">{ellipsify(device)}</td>
                          <td className="px-3 py-2">{scoreObj?.score.toFixed(8)}</td>
                          <td className="px-3 py-2">{uiAmount}</td>
                          <td className="px-3 py-2">{userStakesByNftStake[it.pubkey]?.amount ? splToken.tokenAmountToUiAmount(userStakesByNftStake[it.pubkey]?.amount, decimals) : '-'}</td>
                          <td className="px-3 py-2">{it.account.active ? 'Yes' : 'No'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {nftStakesQuery.data.length === 0 && (
                  <p className="px-3 py-2 text-sm text-gray-500">No NFT stakes found for this pool.</p>
                )}
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="N"
                    min={0}
                    step={1}
                    value={NInput}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setNInput(e.target.value)}
                    className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Button type="button" disabled={isProcessing} onClick={() => {
                    const topN = Math.min(Number(NInput), sortedStakes.length)
                    const toSelect: Record<string, boolean> = {}
                    for (let i = 0; i < topN; i++) {
                      toSelect[sortedStakes[i].it.pubkey] = true
                    }
                    setSelected(toSelect)
                  }}>Select top {NInput}</Button>
                  <Button type="button" disabled={isProcessing} onClick={() => {
                    const topN = Math.min(Number(NInput), sortedStakes.length)
                    const toSelect: Record<string, boolean> = {}
                    for (let i = topN; i < sortedStakes.length; i++) {
                      toSelect[sortedStakes[i].it.pubkey] = true
                    }
                    setSelected(toSelect)
                  }}>
                    Select below {NInput}
                  </Button>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={amountInput}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setAmountInput(e.target.value)}
                    className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Button
                    type="button"
                    onClick={handleAdjustSelected}
                    disabled={isProcessing || !stakePoolAddress || selectedCount === 0 || !amountValid}
                  >
                    {isProcessing ? 'Processing…' : `Adjust selected to ${amountInput}`}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleWithdrawSelected}
                    disabled={isProcessing || !stakePoolAddress || selectedCount === 0}
                  >
                    {isProcessing ? 'Processing…' : 'Withdraw from selected'}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

export function DeviceScoreList({
  batch = 50,
  data: overrideData,
  isLoading: overrideLoading,
  error: overrideError,
}: {
  batch?: number
  data?: DeviceScoresResponse
  isLoading?: boolean
  error?: unknown
}) {
  const fetched = useDeviceScores({ batch })
  const data = overrideData ?? fetched.data
  const isLoading = overrideLoading ?? fetched.isLoading
  const error = overrideError ?? fetched.error

  return (
    <>
      {isLoading && <div>Loading…</div>}
      {error && <div className="text-red-500 text-sm">Failed to load device scores.</div>}
      {!isLoading && !error && (
        <div className="border rounded-md overflow-hidden max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-2">Device</th>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">Uptime 120h</th>
                <th className="px-3 py-2">Uptime 720h</th>
                <th className="px-3 py-2">Self Stake Avg 7d</th>
                <th className="px-3 py-2">Total Stake Avg 7d</th>
                <th className="px-3 py-2">Date</th>
              </tr>
            </thead>
            <tbody className="font-mono text-xs">
              {data?.scores?.map((s, index) => (
                <tr key={`${s.worker_pubkey}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-2 px-3">{s.worker_pubkey}</td>
                  <td className="py-2 px-3">{s.score.toFixed(6)}</td>
                  <td className="py-2 px-3">{s.uptime_120h}</td>
                  <td className="py-2 px-3">{s.uptime_720h}</td>
                  <td className="py-2 px-3">{s.self_staking_avg_7d}</td>
                  <td className="py-2 px-3">{s.total_staking_avg_7d}</td>
                  <td className="py-2 px-3">{s.date}</td>
                </tr>
              ))}
              {(!data || data.scores.length === 0) && (
                <tr>
                  <td className="py-4 text-neutral-500" colSpan={7}>No scores found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
