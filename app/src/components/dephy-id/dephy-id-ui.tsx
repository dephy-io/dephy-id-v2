import { useWalletUi } from "@wallet-ui/react"
import { Button } from "../ui/button"
import { useCreateDevice, useCreateProduct, useDephyAccount, useInitialize, useListProducts } from "./dephy-id-data-access"
import { address, assertIsAddress, getAddressEncoder, getBase58Encoder } from "gill"
import React from "react"

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
    <div>
      <h2>Initialize</h2>
      {dephyAccount.data ?
        <div>Already initialized</div> :
        <Button onClick={handleSubmit}>Initialize</Button>
      }
    </div>
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
    <div>
      <h2>Create Product</h2>

      <form onSubmit={handleSubmit}>
        <input type="text" name="name" placeholder="Name" />
        <input type="text" name="uri" placeholder="URI" />
        <Button type="submit">Create</Button>
      </form>
    </div>
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
    <div>
      <h2>Products</h2>
      <ul>
        {listProducts.data?.map((product) => (
          <li key={product.pubkey.toString()}>{product.account.collection.toString()}</li>
        ))}
      </ul>
    </div>
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
    <div>
      <h2>Create Device</h2>

      <form onSubmit={handleSubmit}>
        <select name="productAsset">
          {listProducts.data?.map((product) => (
            <option key={product.account.collection.toString()} value={product.account.collection.toString()}>
              {product.account.collection.toString()}
            </option>
          ))}
        </select>
        <input type="text" name="name" placeholder="Name" />
        <input type="text" name="uri" placeholder="URI" />
        <input type="text" name="owner" placeholder="Owner" />
        <input type="text" name="seed" placeholder="Seed" />
        <Button type="submit">Create</Button>
      </form>
    </div>
  )
}
