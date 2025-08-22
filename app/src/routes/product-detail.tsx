import { ShowProduct, ListDevices } from "~/components/dephy-id/dephy-id-ui";
import { useParams } from "react-router"
import { assertIsAddress, address } from "gill";
import { useMplCoreCollection, useProduct } from "~/components/dephy-id/dephy-id-data-access";
import { useWalletUiAccount } from "@wallet-ui/react";
import { InputWithLabel } from "~/components/common-ui";
import React from "react";

export default function ProductDetail() {
  const params = useParams() as { product: string }
  assertIsAddress(params.product)
  const { account } = useWalletUiAccount()
  const [dasRpcUrl, setDasRpcUrl] = React.useState(""); // Replace with your key
  const product = useProduct({ productAsset: params.product })
  const collection = useMplCoreCollection({ collectionAsset: product.data?.data.collection })

  if (!product.isFetched || !collection.isFetched) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex flex-col gap-4">
      <ShowProduct product={product.data!} collection={collection.data!} />
      <div className="p-4 border rounded-lg">
        <InputWithLabel
          label="DAS RPC URL"
          value={dasRpcUrl}
          onChange={(e) => setDasRpcUrl(e.target.value)}
          placeholder="https://mainnet.helius-rpc.com/?api-key=<YOUR_API_KEY>"
        />
      </div>
      <ListDevices
        collectionAsset={product.data!.data.collection}
        owner={account?.address ? address(account.address) : undefined}
        dasRpcUrl={dasRpcUrl}
      />
    </div>
  )
}
