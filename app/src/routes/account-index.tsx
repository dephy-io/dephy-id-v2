import { useNavigate } from "react-router";
import { useWalletUi } from "@wallet-ui/react";
import { useEffect } from "react";


export default function AccountIndex() {
  const { account } = useWalletUi()
  const navigator = useNavigate()

  useEffect(() => {
    if (account) {
      navigator(`/account/${account.address}`)
    }
  }, [account, navigator])

  if (account) {
    return null
  }

  return (
    <div>
      <h1>Connect an account to start</h1>
    </div>
  )
}
