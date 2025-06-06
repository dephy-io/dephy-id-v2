import { address, assertIsAddress, type Account, type Address } from "gill"
import { Button } from "../ui/button"
import { useInitialize, useAdminAccount, useCreateStakePool, useStakePools, useStakePool, useStakeDephyId, useNftStakes, useNftStake, useUserStakes, useDeposit, useWithdraw } from "./stake-pool-data-access"
import { Link, useParams } from "react-router"
import * as dephyIdStakePool from "dephy-id-stake-pool-client"
import * as splToken from "gill/programs/token"
import { useWalletUi } from "@wallet-ui/react"
import { useTokenAccounts } from "../account/account-data-access"

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
        <div>Authority: {adminAccount.data.data.authority}</div> :
        <Button onClick={handleSubmit}>Initialize</Button>
      }
    </div>
  )
}

export function CreateStakePool() {
  const createStakePool = useCreateStakePool()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const stakePoolAuthority = address(formData.get('stakePoolAuthority') as string)
    const collection = address(formData.get('collection') as string)
    const stakeTokenMint = address(formData.get('stakeTokenMint') as string)
    const maxStakeAmount = Number(formData.get('maxStakeAmount') as string)

    console.log(stakePoolAuthority, collection, stakeTokenMint, maxStakeAmount)
    createStakePool.mutateAsync({
      stakePoolAuthority,
      collection,
      stakeTokenMint,
      maxStakeAmount
    })
  }

  if (createStakePool.isPending) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h2>Create Stake Pool</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="stakePoolAuthority" placeholder="Stake Pool Authority" />
        <input type="text" name="collection" placeholder="Collection" />
        <input type="text" name="stakeTokenMint" placeholder="Stake Token Mint" />
        <input type="number" name="maxStakeAmount" placeholder="Max Stake Amount" />
        <Button type="submit">Create</Button>
      </form>
    </div>
  )
}

export function ListStakePools() {
  const stakePools = useStakePools()

  if (!stakePools.isFetched) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h2>Stake Pools</h2>
      <ul>
        {stakePools.data?.map((stakePool) => (
          <li key={stakePool.pubkey.toString()}>
            <Link to={`/stake-pool/${stakePool.pubkey}`}>{stakePool.pubkey}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ShowStakePool() {
  const params = useParams() as { address: string }
  assertIsAddress(params.address)
  const stakePool = useStakePool({ stakePoolAddress: params.address })

  if (!stakePool.isFetched) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h2>Stake Pool</h2>
      <p>{params.address}</p>
      {stakePool.data ? (
        <div>
          <p>Authority: {stakePool.data.data.authority}</p>
          <p>Collection: {stakePool.data.data.config.collection}</p>
          <p>Stake Token Mint: {stakePool.data.data.config.stakeTokenMint}</p>
          <p>Max Stake Amount: {stakePool.data.data.config.maxStakeAmount}</p>
        </div>
      ) : (
        <div>Stake Pool not found</div>
      )}
    </div>
  )
}


export function StakeDephyId({ stakePoolAddress }: { stakePoolAddress: Address }) {
  const stakeDephyId = useStakeDephyId()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const mplCoreAsset = address(formData.get('mplCoreAsset') as string)
    const depositAuthority = address(formData.get('depositAuthority') as string)

    stakeDephyId.mutateAsync({ stakePoolAddress, mplCoreAsset, depositAuthority })
  }

  return (
    <div>
      <h2>Stake Dephy ID</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="mplCoreAsset" placeholder="MPL Core Asset" />
        <input type="text" name="depositAuthority" placeholder="Deposit Authority" />
        <Button type="submit">Stake Dephy ID</Button>
      </form>
    </div>
  )
}

export function ListNftStakes() {
  const params = useParams() as { address: string }
  assertIsAddress(params.address)
  const nftStakes = useNftStakes({ stakePoolAddress: params.address })

  if (!nftStakes.isFetched) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h2>Nft Stakes</h2>
      <ul>
        {nftStakes.data?.map((nftStake) => (
          <li key={nftStake.pubkey.toString()}>
            <Link to={`/nft-stake/${nftStake.pubkey}`}>{nftStake.pubkey}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}


export function ShowNftStake({ nftStake }: { nftStake: Account<dephyIdStakePool.NftStakeAccount> }) {
  const params = useParams() as { address: string }
  assertIsAddress(params.address)

  return (
    <div>
      <h2>Nft Stake</h2>
      <p>{params.address}</p>
      {nftStake.data ? (
        <div>
          <p>Stake Pool: {nftStake.data.stakePool}</p>
          <p>Nft Token Account: {nftStake.data.nftTokenAccount}</p>
          <p>Stake Authority: {nftStake.data.stakeAuthority}</p>
          <p>Deposit Authority: {nftStake.data.depositAuthority}</p>
          <p>Stake Amount: {nftStake.data.amount}</p>
          <p>Active: {nftStake.data.active.toString()}</p>
        </div>
      ) : (
        <div>Nft Stake not found</div>
      )}
    </div>
  )
}


export function Deposit({ nftStake }: { nftStake: Account<dephyIdStakePool.NftStakeAccount> }) {
  const deposit = useDeposit({ nftStake })
  const { account } = useWalletUi()
  const stakePool = useStakePool({ stakePoolAddress: nftStake.data.stakePool })
  const mint = stakePool.data!.data.config.stakeTokenMint
  const owner = address(account!.address)
  const tokenAccounts = useTokenAccounts({ mint, owner })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const userStakeTokenAccount = address(formData.get('userStakeTokenAccount') as string)
    const amount = Number(formData.get('amount') as string)

    deposit.mutateAsync({ userStakeTokenAccount, amount })
  }

  if (!tokenAccounts.isFetched) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h2>Deposit</h2>
      <form onSubmit={handleSubmit}>
        <select name="userStakeTokenAccount">
          {tokenAccounts.data?.value.map((tokenAccount) => (
            <option key={tokenAccount.pubkey} value={tokenAccount.pubkey}>
              {tokenAccount.pubkey}: {tokenAccount.account.data.parsed.info.tokenAmount.uiAmountString}
            </option>
          ))}
        </select>
        <input type="number" name="amount" placeholder="Amount" />
        <Button type="submit">Deposit</Button>
      </form>
    </div>
  )
}

export function Withdraw({ userStake }: { userStake: Account<dephyIdStakePool.UserStakeAccount> }) {
  const withdraw = useWithdraw({ userStake })
  const stakePool = useStakePool({ stakePoolAddress: userStake.data.stakePool })
  const mint = stakePool.data!.data.config.stakeTokenMint
  const owner = address(userStake.data.user)
  const tokenAccounts = useTokenAccounts({ mint, owner })

  if (!tokenAccounts.isFetched) {
    return <div>Loading...</div>
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const userStakeTokenAccount = address(formData.get('userStakeTokenAccount') as string)
    const amount = Number(formData.get('amount') as string)

    withdraw.mutateAsync({ userStakeTokenAccount, amount })
  }

  return (
    <div>
      <h2>Withdraw</h2>
      <form onSubmit={handleSubmit}>
        <select name="userStakeTokenAccount">
          {tokenAccounts.data?.value.map((tokenAccount) => (
            <option key={tokenAccount.pubkey} value={tokenAccount.pubkey}>
              {tokenAccount.pubkey}: {tokenAccount.account.data.parsed.info.tokenAmount.uiAmountString}
            </option>
          ))}
        </select>
        <input type="number" name="amount" placeholder="Amount" />
        <Button type="submit">Withdraw</Button>
      </form>
    </div>
  )
}

export function ListUserStakes() {
  const params = useParams() as { address: string }
  assertIsAddress(params.address)
  const userStakes = useUserStakes({ nftStakeAddress: params.address })

  if (!userStakes.isFetched) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h2>User Stakes</h2>
      <ul>
        {userStakes.data?.map((userStake) => (
          <li key={userStake.pubkey.toString()}>
            <Link to={`/user-stake/${userStake.pubkey}`}>{userStake.pubkey}</Link>
            <span> {userStake.account.user}: {userStake.account.amount}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ShowUserStake({ userStake }: { userStake: Account<dephyIdStakePool.UserStakeAccount> }) {
  const params = useParams() as { address: string }
  assertIsAddress(params.address)

  return (
    <div>
      <h2>User Stake</h2>
      <p>{params.address}</p>
      {userStake.data ? (
        <div>
          <p>User: {userStake.data.user}</p>
          <p>Amount: {userStake.data.amount}</p>
        </div>
      ) : (
        <div>User Stake not found</div>
      )}
    </div>
  )
}
