import { Button } from "../ui/button"
import { useInitialize, useAdminAccount } from "./stake-pool-data-access"

export function Initialize() {
  const initialize = useInitialize()
  const adminAccount = useAdminAccount()

  const handleSubmit = () => {
    initialize.mutate()
  }

  if (initialize.isPending) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h2>Initialize</h2>
      {adminAccount.data ?
        <div>Already initialized</div> :
        <Button onClick={handleSubmit}>Initialize</Button>
      }
    </div>
  )
}
