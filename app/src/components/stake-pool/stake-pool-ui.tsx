import { address, assertIsAddress, type Account, type Address } from "gill"
import { Button } from "../ui/button"
import { useInitialize, useAdminAccount, useCreateStakePool, useStakePools, useStakePool, useStakeDephyId, useNftStakes, useNftStake, useUserStakes, useDeposit, useWithdraw, useUnstakeDephyId, useCloseNftStake, useAnnounceUpdateConfig, useConfirmUpdateConfig, useCancelUpdateConfig, useAnnouncedConfig } from "./stake-pool-data-access"
import { Link, useParams } from "react-router"
import * as dephyIdStakePool from "dephy-id-stake-pool-client"
import * as splToken from "gill/programs/token"
import { ellipsify, useWalletUi } from "@wallet-ui/react"
import { useTokenAccounts, useMint } from "../account/account-data-access"
import { CommonCard as Card, InputWithLabel } from "../common-ui"
import { Select, SelectContent, SelectItem, SelectValue } from "../ui/select"
import { SelectTrigger } from "@radix-ui/react-select"

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
    <Card title="Initialize">
      {adminAccount.data ?
        <div>Authority: {adminAccount.data.data.authority}</div> :
        <Button onClick={handleSubmit}>Initialize</Button>
      }
    </Card>
  )
}

export function ManageStakePoolConfig({ stakePool }: { stakePool: Account<dephyIdStakePool.StakePoolAccount> }) {
  const announce = useAnnounceUpdateConfig({ stakePool })
  const confirm = useConfirmUpdateConfig({ stakePool })
  const cancel = useCancelUpdateConfig({ stakePool })
  const announced = useAnnouncedConfig({ stakePool })
  const mintQuery = useMint({ mintAddress: stakePool.data.config.stakeTokenMint })

  const handleAnnounce = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const maxStakeAmountUi = Number(form.get('maxStakeAmountUi') as string)
    const configReviewTime = Number(form.get('configReviewTime') as string)
    await announce.mutateAsync({ maxStakeAmountUi, configReviewTime })
  }

  return (
    <Card title="Manage Stake Pool Config">
      <div className="space-y-2">
        <div className="text-sm text-gray-700">
          Current Max Stake Amount:
          {" "}
          {mintQuery.data
            ? `${splToken.tokenAmountToUiAmount(stakePool.data.config.maxStakeAmount, mintQuery.data.data.decimals)} (raw: ${stakePool.data.config.maxStakeAmount.toString()})`
            : `${stakePool.data.config.maxStakeAmount.toString()} (loading mint...)`}
        </div>
        <div className="text-sm text-gray-700">Current Review Time (seconds): {stakePool.data.config.configReviewTime.toString()}</div>
      </div>

      <div className="mt-3">
        <div className="font-medium">Announced Config</div>
        {!announced.isFetched ? (
          <div className="text-sm text-gray-500">Loading announced config...</div>
        ) : announced.data && announced.data.exists ? (
          <div className="mt-1 space-y-1 text-sm">
            <div>Authority: {announced.data.data.authority}</div>
            <div title={announced.data.data.timestamp.toString()}>
              Timestamp: {new Date(Number(announced.data.data.timestamp) * 1000).toLocaleString()}
            </div>
            <div>
              Proposed Max Stake Amount:
              {" "}
              {mintQuery.data
                ? `${splToken.tokenAmountToUiAmount(
                  typeof announced.data.data.config.maxStakeAmount === 'bigint'
                    ? announced.data.data.config.maxStakeAmount
                    : BigInt(announced.data.data.config.maxStakeAmount),
                  mintQuery.data.data.decimals
                )} (raw: ${announced.data.data.config.maxStakeAmount.toString()})`
                : `${announced.data.data.config.maxStakeAmount.toString()} (loading mint...)`}
            </div>
            <div>Proposed Review Time (seconds): {announced.data.data.config.configReviewTime.toString()}</div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">No announced config.</div>
        )}
      </div>

      <form onSubmit={handleAnnounce} className="mt-3 space-y-2">
        <InputWithLabel id="maxStakeAmountUi" name="maxStakeAmountUi" type="number" label="New Max Stake Amount (UI)" />
        <InputWithLabel id="configReviewTime" name="configReviewTime" type="number" label="New Config Review Time (seconds)" />
        <div className="flex gap-2">
          <Button type="submit" disabled={announce.isPending || announced.data?.exists}>AnnounceUpdateConfig</Button>
          <Button type="button" onClick={() => confirm.mutateAsync()} disabled={confirm.isPending || !announced.data || !announced.data.exists}>ConfirmUpdateConfig</Button>
          <Button type="button" onClick={() => cancel.mutateAsync()} disabled={cancel.isPending || !announced.data || !announced.data.exists}>CancelUpdateConfig</Button>
        </div>
      </form>
    </Card>
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
    const configReviewTime = Number(formData.get('configReviewTime') as string)

    console.log(stakePoolAuthority, collection, stakeTokenMint, maxStakeAmount)
    createStakePool.mutateAsync({
      stakePoolAuthority,
      collection,
      stakeTokenMint,
      maxStakeAmount,
      configReviewTime,
    })
  }

  if (createStakePool.isPending) {
    return <div>Loading...</div>
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card title="Create Stake Pool">
        <InputWithLabel type="text" name="stakePoolAuthority" label="Stake Pool Authority" />
        <InputWithLabel type="text" name="collection" label="Collection" />
        <InputWithLabel type="text" name="stakeTokenMint" label="Stake Token Mint" />
        <InputWithLabel type="number" name="maxStakeAmount" label="Max Stake Amount (UI)" />
        <InputWithLabel type="number" name="configReviewTime" label="Config Review Time (seconds)" />
        <Button type="submit">Create</Button>
      </Card>
    </form>
  )
}

export function ListStakePools() {
  const stakePools = useStakePools()

  if (!stakePools.isFetched) {
    return <div>Loading...</div>
  }

  return (
    <Card title="Stake Pools">
      <ul>
        {stakePools.data?.map((stakePool) => (
          <li key={stakePool.pubkey.toString()}>
            <Link to={`/stake-pool/${stakePool.pubkey}`}>{stakePool.pubkey}</Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export function ShowStakePool({ stakePool, mint }: {
  stakePool: Account<dephyIdStakePool.StakePoolAccount>,
  mint: Account<splToken.Mint>
}) {
  const params = useParams() as { address: string }
  assertIsAddress(params.address)

  return (
    <Card title="Stake Pool">
      <p>{params.address}</p>
      {stakePool.data ? (
        <div>
          <p>Authority: {stakePool.data.authority}</p>
          <p>Collection: {stakePool.data.config.collection}</p>
          <p>Stake Token Mint: {stakePool.data.config.stakeTokenMint}</p>
          <p>Max Stake Amount: {splToken.tokenAmountToUiAmount(stakePool.data.config.maxStakeAmount, mint.data!.decimals)}</p>
          <p>Config Review Time: {stakePool.data.config.configReviewTime}</p>
        </div>
      ) : (
        <div>Stake Pool not found</div>
      )}
    </Card>
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
    <form onSubmit={handleSubmit}>
      <Card title="Stake Dephy ID">
        <InputWithLabel type="text" id="mplCoreAsset" name="mplCoreAsset" label="MPL Core Asset" />
        <InputWithLabel type="text" id="depositAuthority" name="depositAuthority" label="Deposit Authority" />
        <Button type="submit">Stake Dephy ID</Button>
      </Card>
    </form>
  )
}

export function UnstakeDephyId({ nftStake }: { nftStake: Account<dephyIdStakePool.NftStakeAccount> }) {
  const unstake = useUnstakeDephyId({ nftStake })

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    unstake.mutateAsync()
  }

  return (
    <Card title="Unstake">
      <form onSubmit={handleSubmit}>
        <Button type="submit">Unstake</Button>
      </form>
    </Card>
  )
}

export function ListNftStakes({ stakePool, mint }: { stakePool: Account<dephyIdStakePool.StakePoolAccount>, mint: Account<splToken.Mint> }) {
  const nftStakes = useNftStakes({ stakePoolAddress: stakePool.address })

  if (!nftStakes.isFetched) {
    return <div>Loading...</div>
  }

  return (
    <Card title="Nft Stakes">
      <div className="border rounded-md overflow-hidden max-h-96 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium">NFT Stake</th>
              <th className="px-3 py-2 text-left font-medium">Stake Authority</th>
              <th className="px-3 py-2 text-left font-medium">NFT Token Account</th>
              <th className="px-3 py-2 text-left font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {nftStakes.data?.map((nftStake, index: number) => (
              <tr key={nftStake.pubkey.toString()} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-3 py-2">
                  <Link to={`/nft-stake/${nftStake.pubkey}`} className="text-blue-600 hover:text-blue-800">
                    {ellipsify(nftStake.pubkey)}
                  </Link>
                </td>
                <td className="px-3 py-2 font-mono">
                  {ellipsify(nftStake.account.stakeAuthority)}
                </td>
                <td className="px-3 py-2 font-mono">
                  <Link to={`/dephy-id/${stakePool.data.config.collection}/${nftStake.account.nftTokenAccount}`} className="text-blue-600 hover:text-blue-800">
                    {ellipsify(nftStake.account.nftTokenAccount)}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  {splToken.tokenAmountToUiAmount(nftStake.account.amount, mint.data.decimals)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}


export function ShowNftStake({ nftStake, mint }: {
  nftStake: Account<dephyIdStakePool.NftStakeAccount>,
  mint: Account<splToken.Mint>
}) {
  const params = useParams() as { address: string }
  assertIsAddress(params.address)

  return (
    <Card title="Nft Stake">
      <p>{params.address}</p>
      {nftStake.data ? (
        <div>
          <p>Stake Pool: {nftStake.data.stakePool}</p>
          <p>Nft Token Account: {nftStake.data.nftTokenAccount}</p>
          <p>Stake Authority: {nftStake.data.stakeAuthority}</p>
          <p>Deposit Authority: {nftStake.data.depositAuthority}</p>
          <p>Stake Amount: {splToken.tokenAmountToUiAmount(nftStake.data.amount, mint.data.decimals)}</p>
          <p>Active: {nftStake.data.active.toString()}</p>
        </div>
      ) : (
        <div>Nft Stake not found</div>
      )}
    </Card>
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
    <form onSubmit={handleSubmit}>
      <Card title="Deposit">
        <Select name="userStakeTokenAccount">
          <SelectTrigger>
            <SelectValue placeholder="Select a token account" />
          </SelectTrigger>
          <SelectContent>
            {tokenAccounts.data?.value.map((tokenAccount) => (
              <SelectItem key={tokenAccount.pubkey} value={tokenAccount.pubkey}>
                {tokenAccount.pubkey}: {tokenAccount.account.data.parsed.info.tokenAmount.uiAmountString}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <InputWithLabel id="amount" type="number" name="amount" label="Amount" />
        <Button type="submit">Deposit</Button>
      </Card>
    </form>
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
    <form onSubmit={handleSubmit}>
      <Card title="Withdraw">
        <select name="userStakeTokenAccount">
          {tokenAccounts.data?.value.map((tokenAccount) => (
            <option key={tokenAccount.pubkey} value={tokenAccount.pubkey}>
              {tokenAccount.pubkey}: {tokenAccount.account.data.parsed.info.tokenAmount.uiAmountString}
            </option>
          ))}
        </select>
        <InputWithLabel label="Amount" id="amount" type="number" name="amount" />
        <Button type="submit">Withdraw</Button>
      </Card>
    </form>
  )
}

export function ListUserStakes({ nftStakeAddress, mint }: { nftStakeAddress: Address, mint: Account<splToken.Mint> }) {
  const userStakes = useUserStakes({ nftStakeAddress })

  if (!userStakes.isFetched) {
    return <div>Loading...</div>
  }

  return (
    <Card title="User Stakes">
      <ul>
        {userStakes.data?.map((userStake) => (
          <li key={userStake.pubkey.toString()}>
            <Link to={`/user-stake/${userStake.pubkey}`}>{userStake.pubkey}</Link>
            <span> {userStake.account.user}: {splToken.tokenAmountToUiAmount(userStake.account.amount, mint.data.decimals)}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export function ShowUserStake({ userStake, mint }: {
  userStake: Account<dephyIdStakePool.UserStakeAccount>, mint: Account<splToken.Mint>
}) {
  const params = useParams() as { address: string }
  assertIsAddress(params.address)

  return (
    <Card title="User Stake">
      <p>{params.address}</p>
      {userStake.data ? (
        <div>
          <p>User: {userStake.data.user}</p>
          <p>Amount: {splToken.tokenAmountToUiAmount(userStake.data.amount, mint.data.decimals)}</p>
        </div>
      ) : (
        <div>User Stake not found</div>
      )}
    </Card>
  )
}

export function CloseNftStake({ nftStake }: { nftStake: Account<dephyIdStakePool.NftStakeAccount> }) {
  const closeNftStake = useCloseNftStake({ nftStakeAddress: nftStake.address })

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    closeNftStake.mutateAsync()
  }

  return (
    <Card title="Close Nft Stake">
      <form onSubmit={handleSubmit}>
        <Button type="submit">Close Nft Stake</Button>
      </form>
    </Card>
  )
}
