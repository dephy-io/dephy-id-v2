import { useWalletUi } from "@wallet-ui/react";
import { CreateDevice, CreateProduct, Initialize, ListProducts } from "~/components/dephy-id/dephy-id-ui";

export default function DephyIdIndex() {
  const { account } = useWalletUi()

  if (!account) {
    return <div>Connect an account to start</div>
  }

  return (
    <div>
      <h1>DePHY ID</h1>
      <Initialize />
      <CreateProduct />
      <ListProducts />
      <CreateDevice />
    </div>
  )
}
