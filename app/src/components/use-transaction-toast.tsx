import { toast } from 'sonner'
import { ExplorerLink } from './cluster/cluster-ui'
import { useWalletUiCluster } from '@wallet-ui/react'

export function useTransactionToast() {
  const { cluster } = useWalletUiCluster()
  return (signature: string) => {
    toast('Transaction sent', {
      description: <ExplorerLink cluster={cluster.cluster} transaction={signature} label="View Transaction" />,
    })
  }
}
