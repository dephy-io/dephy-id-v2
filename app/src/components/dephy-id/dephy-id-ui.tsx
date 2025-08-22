import { useWalletUi } from "@wallet-ui/react"
import { Button } from "../ui/button"
import { useCreateDevice, useCreateProduct, useDephyAccount, useDevice, useDevicesByCollection, useInitialize, useListProducts } from "./dephy-id-data-access"
import { address, assertIsAddress, getAddressDecoder, getAddressEncoder, type Account, type Address } from "gill"
import React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { CommonCard as Card, InputWithLabel } from "../common-ui"
import * as dephyId from "dephy-id-client"
import * as mplCore from "mpl-core"
import { Link } from "react-router"
import { toJSON } from "~/lib/utils"

export function Initialize() {
  const initialize = useInitialize()
  const dephyAccount = useDephyAccount()

  const handleSubmit = () => {
    initialize.mutate()
  }

  if (initialize.isPending) {
    return <div>Loading...</div>
  }

  return (
    <Card title="Initialize">
      {dephyAccount.data ?
        <div>Already initialized</div> :
        <Button onClick={handleSubmit}>Initialize</Button>
      }
    </Card>
  )
}

export function CreateProduct() {
  const createProduct = useCreateProduct()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = formData.get('name') as string
    const uri = formData.get('uri') as string
    console.log(name, uri)
    createProduct.mutateAsync({ name, uri })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card title="Create Product">
        <InputWithLabel id="name" name="name" label="Name" />
        <InputWithLabel id="uri" name="uri" label="URI" />
        <Button type="submit">Create</Button>
      </Card>
    </form>
  )
}

export function ListProducts() {
  const listProducts = useListProducts({})

  if (!listProducts.isFetched) {
    return <div>Loading...</div>
  }

  return (
    <Card title="Products">
      <div className="border rounded-md overflow-hidden max-h-96 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Collection</th>
              <th className="px-3 py-2 text-left font-medium">Vendor</th>
            </tr>
          </thead>
          <tbody>
            {listProducts.data?.map((product) => (
              <tr key={product.pubkey}>
                <td className="px-3 py-2">
                  <Link className="link" to={`/dephy-id/${product.account.collection}`}>
                    {product.account.collection}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  {product.account.vendor}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export function ShowProduct({ product, collection }: { product: Account<dephyId.ProductAccount>, collection: Account<mplCore.CollectionAccount> }) {
  let vendor: Address | undefined
  if (collection.data.plugins?.appDatas?.[0].dataAuthority.type === 'UpdateAuthority') {
    vendor = getAddressDecoder().decode(collection.data.plugins?.appDatas?.[0].data)
  }

  return (
    <Card title="Product">
      <p>Product Account: {product.address}</p>
      <p>Collection: {product.data.collection}</p>
      <p>Vendor: {product.data.vendor}</p>
      <p>Mint Authority: {product.data.mintAuthority}</p>
      <p>Name: {collection.data.base.name}</p>
      <p>URI: {collection.data.base.uri}</p>
      <p>Update Authority: {collection.data.base.updateAuthority}</p>
      <p>Num Minted: {collection.data.base.numMinted}</p>
      <p>Current Size: {collection.data.base.currentSize}</p>
      <p>AppDatas 0: {vendor}</p>
    </Card>
  )
}

export function ShowDevice({ device }: { device: Account<mplCore.AssetAccount> }) {
  // Extract seed from device attributes
  const seedAttribute = device.data.plugins?.attributes?.attributeList?.find(
    (attr: { key: string; value: string }) => attr.key === "Seed"
  )

  return (
    <Card title="Device">
      <p>Device Asset: {device.address}</p>
      <p>Name: {device.data.base.name}</p>
      <p>URI: {device.data.base.uri}</p>
      <p>Owner: {device.data.base.owner}</p>
      <p>Update Authority: {device.data.base.updateAuthority?.type} {device.data.base.updateAuthority?.address}</p>
      {seedAttribute && (
        <p>Seed: {seedAttribute.value}</p>
      )}
      {device.data.plugins?.freezeDelegate && (
        <p>Frozen: {device.data.plugins.freezeDelegate.frozen ? 'Yes' : 'No'}</p>
      )}
      {device.data.plugins && (
        <div className="mt-4">
          <div>Plugins:</div>
          {Object.entries(device.data.plugins).map(([key, value]) => (
            <p key={key} className="font-mono">{key}: {toJSON(value)}</p>
          ))}
        </div>
      )}
    </Card>
  )
}

export function ListDevices({
  collectionAsset,
  owner,
  dasRpcUrl
}: {
  collectionAsset: Address,
  owner?: Address,
  dasRpcUrl?: string
}) {
  const devices = useDevicesByCollection({ collectionAsset, owner, dasRpcUrl })

  return (
    <Card title="Devices">
      {devices.isLoading && (
        <p className="text-sm text-gray-500">Loading devices...</p>
      )}
      {devices.error && (
        <p className="text-sm text-red-500">Error loading devices: {devices.error.message}</p>
      )}
      {devices.data && devices.data.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">{devices.data.length} device(s) found</p>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {devices.data.map((device) => (
              <div>
                <Link
                  to={`/dephy-id/${collectionAsset}/${device.address}`}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  {device.address}
                </Link>
              </div>
            ))}
          </div>
        </div>
      ) : devices.data && devices.data.length === 0 ? (
        <p className="text-sm text-gray-500">No devices found for this product.</p>
      ) : null}
    </Card>
  )
}

export function CreateDevice() {
  const createDevice = useCreateDevice()
  const { account } = useWalletUi()
  assertIsAddress(account!.address)
  const listProducts = useListProducts({ vendor: account!.address })

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = formData.get('name') as string
    const uri = formData.get('uri') as string
    const productAsset = address(formData.get('productAsset') as string)
    const owner = address(formData.get('owner') as string)
    const seed = formData.get('seed') as string
    assertIsAddress(seed)
    const seedBytes = getAddressEncoder().encode(seed)
    console.log(name, uri, productAsset, owner, seed)
    createDevice.mutateAsync({ name, uri, productAsset, owner, seed: seedBytes })
  }

  if (!listProducts.isFetched) {
    return <div>Loading...</div>
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card title="Create Device">
        <Select name="productAsset">
          <SelectTrigger>
            <SelectValue placeholder="Select a product asset" />
          </SelectTrigger>
          <SelectContent className="font-mono">
            {listProducts.data?.map((product) => (
              <SelectItem key={product.account.collection.toString()} value={product.account.collection.toString()}>
                {product.account.collection.toString()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <InputWithLabel id="name" name="name" label="Name" />
        <InputWithLabel id="uri" name="uri" label="URI" />
        <InputWithLabel id="owner" name="owner" label="Owner" />
        <InputWithLabel id="seed" name="seed" label="Seed" />
        <Button type="submit">Create</Button>
      </Card>
    </form>
  )
}
