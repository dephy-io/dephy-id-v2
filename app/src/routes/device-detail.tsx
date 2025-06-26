import { useWalletUi } from "@wallet-ui/react";
import { CreateDevice, CreateProduct, Initialize, ListProducts } from "~/components/dephy-id/dephy-id-ui";

export default function DephyIdIndex() {
  const { account } = useWalletUi()

  if (!account) {
    return (
      <div>
        <h1>Connect an account to start</h1>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h1>DePHY ID</h1>
      <Initialize />
      <CreateProduct />
      <ListProducts />
      <CreateDevice />
    </div>
  )
}
