import { useParams } from "react-router";
import { useMemo } from "react";
import { assertIsAddress } from "gill";
import { AccountBalance, AccountTransactions } from "src/components/account/account-ui";
import { ExplorerLink } from "src/components/cluster/cluster-ui";
import { ellipsify } from "@wallet-ui/react";


export default function AccountDetail() {
  const params = useParams() as { address: string }
  const address = useMemo(() => {
    if (!params.address || typeof params.address !== 'string') {
      return
    }
    assertIsAddress(params.address)
    return params.address
  }, [params])

  if (!address) {
    return <div>Error loading account</div>
  }

  return (
    <div>
      <AccountBalance address={address} />
      <ExplorerLink address={address.toString()} label={ellipsify(address.toString())} />
      <div className="space-y-8">
        {/* <AccountTokens address={address} /> */}
        <AccountTransactions address={address} />
      </div>
    </div>
  );
}
