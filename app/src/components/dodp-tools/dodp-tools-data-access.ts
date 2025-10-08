import { useQuery } from "@tanstack/react-query"
import { findDeviceAssetPda } from "dephy-id-client"
import { type Address, getAddressDecoder, getBase16Encoder } from "gill"

import { useProgramIds } from "~/lib/program-ids"

const DEPHY_API_URL = 'https://mainnet-tokenomic.dephy.dev'

// Device scores
// /api/v1/scores/daily?offset=0&limit=50
// Response:
// {
//   "scores": [
//     {
//       "worker_pubkey": string,
//       "uptime_120h": uint64,
//       "uptime_720h": uint64,
//       "self_staking_avg_7d": uint64,
//       "total_staking_avg_7d": uint64,
//       "score": float64,
//       "date": string, // YYYY-MM-DD format
//       "created_at": string // ISO 8601 format
//       "updated_at": string // ISO 8601 format
//     }, ...
//   ],
//   "total": int64 // Total number of records for the most recent date
// }

export type DeviceScore = {
  worker_pubkey: string
  uptime_120h: number
  uptime_720h: number
  self_staking_avg_7d: number
  total_staking_avg_7d: number
  score: number
  date: string
  created_at: string
  updated_at: string
  deviceSeed?: Uint8Array
}

export type DeviceScoresResponse = {
  scores: DeviceScore[]
  total: number
}

export function useDeviceScores({ batch }: { batch: number } = { batch: 50 }) {
  return useQuery<DeviceScoresResponse>({
    queryKey: ["dodp", "device-scores", { batch }],
    queryFn: async () => {
      const b16 = getBase16Encoder()
      const addrB58 = getAddressDecoder()

      const allScores: DeviceScore[] = []
      let offset = 0
      while (true) {
        const url = new URL(`/api/v1/scores/daily`, DEPHY_API_URL)
        url.searchParams.set("offset", String(offset))
        url.searchParams.set("limit", String(batch))

        const res = await fetch(url.toString(), {
          method: "GET",
          headers: { Accept: "application/json" },
        })
        const json = await res.json()
        const page = (json.data as DeviceScoresResponse) ?? { scores: [], total: 0 }

        const transformed = (page.scores ?? []).map((s) => {
          const deviceSeedRO = b16.encode(s.worker_pubkey)
          const deviceSeed = new Uint8Array(deviceSeedRO as any)
          const workerBase58 = addrB58.decode(deviceSeed)
          return { ...s, worker_pubkey: workerBase58, deviceSeed }
        })

        allScores.push(...transformed)

        if (transformed.length < batch) break
        offset += batch
      }

      return { scores: allScores, total: allScores.length }
    },
  })
}

export type DeviceAssetMapping = {
  deviceToAsset: Record<string, Address>
  assetToDevice: Record<string, string>
}

export function useDeviceAssetMapping({
  collection,
  scores,
}: {
  collection?: Address
  scores?: Pick<DeviceScore, "worker_pubkey" | "deviceSeed">[]
}) {
  const { dephyIdProgramId } = useProgramIds()
  const seeds = (scores ?? [])
    .map((s) => (s.deviceSeed ? new Uint8Array(s.deviceSeed as any) : undefined))
    .filter(Boolean) as Uint8Array[]

  return useQuery<DeviceAssetMapping>({
    queryKey: ["dodp", "device-asset-mapping", collection],
    enabled: Boolean(collection && seeds.length > 0),
    queryFn: async () => {
      const entries = await Promise.all(
        (scores ?? []).map(async (s) => {
          const [assetAddress] = await findDeviceAssetPda({
            productAsset: collection as Address,
            deviceSeed: new Uint8Array(s.deviceSeed as any),
          }, {
            programAddress: dephyIdProgramId,
          })
          return [s.worker_pubkey, assetAddress] as const
        })
      )
      const deviceToAsset = Object.fromEntries(entries) as Record<string, Address>
      const assetToDevice: Record<string, string> = {}
      for (const [device, asset] of entries) {
        assetToDevice[asset] = device
      }
      return { deviceToAsset, assetToDevice }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}
