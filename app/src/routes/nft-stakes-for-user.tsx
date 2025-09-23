import { Link, useParams } from "react-router"
import { assertIsAddress } from "gill"
import { CommonCard as Card } from "~/components/common-ui"
import { useNftStakesForUser } from "~/components/stake-pool/stake-pool-data-access"
import { ellipsify } from "@wallet-ui/react"
import { useStakePool } from "~/components/stake-pool/stake-pool-data-access"

export default function NftStakesForUserPage() {
  const params = useParams() as { address: string }
  assertIsAddress(params.address)

  const nftStakesQuery = useNftStakesForUser({ userAddress: params.address })

  if (!nftStakesQuery.isFetched) {
    return <div>Loading...</div>
  }

  const nftStakes = nftStakesQuery.data ?? []

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">NFT Stakes for User {params.address}</h1>
      <Card title="NFT Stakes">
        {nftStakes.length === 0 ? (
          <div className="text-sm text-gray-500">No NFT stakes found for this user.</div>
        ) : (
          <div className="border rounded-md overflow-hidden max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">NFT Stake</th>
                  <th className="px-3 py-2 text-left font-medium">Stake Pool</th>
                  <th className="px-3 py-2 text-left font-medium">NFT Token Account</th>
                </tr>
              </thead>
              <tbody>
                {nftStakes.map((nft: any, index: number) => (
                  <NftStakeRow key={nft.pubkey} nft={nft} zebra={index % 2 === 0} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

function NftStakeRow({ nft, zebra }: { nft: any, zebra: boolean }) {
  // Fetch stake pool to get the collection address for the Dephy ID link
  const stakePool = useStakePool({ stakePoolAddress: nft.account.stakePool })

  return (
    <tr className={zebra ? 'bg-white' : 'bg-gray-50'}>
      <td className="px-3 py-2">
        <Link to={`/nft-stake/${nft.pubkey}`} className="text-blue-600 hover:text-blue-800">
          {ellipsify(nft.pubkey)}
        </Link>
      </td>
      <td className="px-3 py-2 font-mono">
        <Link to={`/stake-pool/${nft.account.stakePool}`} className="text-blue-600 hover:text-blue-800">
          {ellipsify(nft.account.stakePool)}
        </Link>
      </td>
      <td className="px-3 py-2 font-mono">
        {stakePool.data ? (
          <Link
            to={`/dephy-id/${stakePool.data.data.config.collection}/${nft.account.nftTokenAccount}`}
            className="text-blue-600 hover:text-blue-800"
          >
            {ellipsify(nft.account.nftTokenAccount)}
          </Link>
        ) : (
          <span>{ellipsify(nft.account.nftTokenAccount)}</span>
        )}
      </td>
    </tr>
  )
}
