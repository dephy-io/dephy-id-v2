import { useParams } from "react-router"
import { assertIsAddress } from "gill"
import { UserStakesForUser } from "~/components/stake-pool/stake-pool-ui"

export default function UserStakesForUserPage() {
  const params = useParams() as { address: string }
  assertIsAddress(params.address)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">User Stakes for User {params.address}</h1>
      <UserStakesForUser userAddress={params.address} />
    </div>
  )
}
