import { useWalletUi } from "@wallet-ui/react"
import { Button } from "../ui/button"
import { useCreateDevice, useCreateProduct, useDephyAccount, useInitialize, useListProducts } from "./dephy-id-data-access"
import { address, assertIsAddress, getAddressDecoder, getAddressEncoder, type Account, type Address } from "gill"
import React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { CommonCard as Card, InputWithLabel } from "../common-ui"
import * as dephyId from "dephy-id-client"
import * as mplCore from "mpl-core"
import { Link } from "react-router"

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
  const { account } = useWalletUi()
  assertIsAddress(account!.address)
  const listProducts = useListProducts({ vendor: account!.address })

  if (!listProducts.isFetched) {
    return <div>Loading...</div>
  }

  return (
    <Card title="Products">
      <ul>
        {listProducts.data?.map((product) => (
          <li key={product.pubkey.toString()}>
            <Link to={`/dephy-id/${product.account.collection}`}>{product.account.collection}</Link>
          </li>
        ))}
      </ul>
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
