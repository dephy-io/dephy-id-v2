import { toast } from 'sonner'
import { ExplorerLink } from './cluster/cluster-ui'
import { useWalletUiCluster } from '@wallet-ui/react'

export function clusterIdToMoniker(clusterId: string) {
  switch (clusterId) {
    case 'solana:mainnet':
      return 'mainnet'
    case 'solana:devnet':
      return 'devnet'
    case 'solana:testnet':
      return 'testnet'
    default:
      return 'localnet'
  }
}

export function useTransactionToast() {
  const { cluster } = useWalletUiCluster()
  return (signature: string) => {
    toast('Transaction sent', {
      description: <ExplorerLink cluster={clusterIdToMoniker(cluster.id)} transaction={signature} label="View Transaction" />,
    })
  }
}
