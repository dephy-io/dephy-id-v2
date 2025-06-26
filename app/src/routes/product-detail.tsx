import { ShowProduct } from "~/components/dephy-id/dephy-id-ui";
import { useParams } from "react-router"
import { assertIsAddress } from "gill";
import { useMplCoreCollection, useProduct } from "~/components/dephy-id/dephy-id-data-access";

export default function ProductDetail() {
  const params = useParams() as { product: string }
  assertIsAddress(params.product)
  const product = useProduct({ productAsset: params.product })
  const collection = useMplCoreCollection({ collectionAsset: product.data?.data.collection })

  if (!product.isFetched || !collection.isFetched) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex flex-col gap-4">
      <ShowProduct product={product.data!} collection={collection.data!} />
    </div>
  )
}
