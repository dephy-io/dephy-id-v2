import { useWalletUiCluster } from "@wallet-ui/react";
import { address } from "gill";

export function useProgramIds() {
  const { cluster } = useWalletUiCluster()

  switch (cluster.cluster) {
    case 'mainnet':
      return {
        dephyIdProgramId: address('PHy1dzzd8sso1R5t31WHX6JvAsZF9fvNgzxHbgnKHX4'),
        dephyIdStakePoolProgramId: address('PHYSJkZ4KNpK4Lp5pg89xfab5mSer9NxRfr6YzuRdNQ'),
      }

    default:
      return {
        dephyIdProgramId: address('D1DdkvuK3V8kzxD5CSsx7JorEo3hMLw4L7Bvujv3pTD6'),
        dephyIdStakePoolProgramId: address('DSTKMXnJXgvViSkr6hciBaYsTpcduxZuF334WLrvEZmW'),
      }
  }
}
