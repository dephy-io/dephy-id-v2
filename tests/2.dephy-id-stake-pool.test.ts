import assert from 'assert';
import {
  Address,
  airdropFactory,
  assertAccountExists,
  createSolanaClient, createTransaction, devnet,
  generateKeyPairSigner,
  getSignatureFromTransaction, IInstruction, isSolanaError, KeyPairSigner, lamports,
  signTransactionMessageWithSigners,
} from 'gill'
import * as splToken from 'gill/programs/token'

// import * as solanaPrograms from 'gill/programs'
import * as dephyId from '../clients/dephy-id/js/src/index.js'
import * as dephyIdStakePool from '../clients/dephy-id-stake-pool/js/src/index.js'
// import * as mplCore from '../deps/mpl-core/js/src/index.js'

const payer = await generateKeyPairSigner()

describe("dephy-id-stake-pool", () => {
  const { rpc, rpcSubscriptions, sendAndConfirmTransaction } = createSolanaClient({
    urlOrMoniker: devnet('localnet')
  })

  const airdrop = airdropFactory({ rpc, rpcSubscriptions })

  const sendAndConfirmIxs = async (instructions: IInstruction[], config = { showError: true }) => {
    const latestBlockhash = (await rpc.getLatestBlockhash().send()).value

    const transaction = createTransaction({
      feePayer: payer,
      instructions,
      latestBlockhash,
      version: 0
    })

    try {
      const signedTx = await signTransactionMessageWithSigners(transaction)
      await sendAndConfirmTransaction(signedTx, { commitment: 'confirmed' })

      return getSignatureFromTransaction(signedTx)
    } catch (error) {
      if (isSolanaError(error) && config.showError) {
        console.error(error.context)
      }

      throw error
    }
  }

  let authority: KeyPairSigner
  let vendor: KeyPairSigner
  let productAssetAddress: Address
  let adminAddress: Address
  let stDephyTokenAddress: Address
  let stakePoolAddress: Address
  let didOwner1: KeyPairSigner
  let did1Address: Address
  let tokenOwner1: KeyPairSigner
  let userTokenAddress1: Address
  const startingAmount = 10000_000_000n


  before('prepare', async () => {
    await airdrop({
      commitment: "confirmed",
      lamports: lamports(1_000_000_000n),
      recipientAddress: payer.address,
    })

    vendor = await generateKeyPairSigner()
    const productName = "Test DePHY ID"
    productAssetAddress = (await dephyId.findProductAssetPda({ productName, vendor: vendor.address }))[0]

    await sendAndConfirmIxs([
      dephyId.getCreateProductInstruction({
        vendor,
        payer,
        name: productName,
        productAsset: productAssetAddress,
        uri: "https://example.com/DePHY-ID",
      }),
    ])

    const stDephyTokenKeypair = await generateKeyPairSigner()
    stDephyTokenAddress = stDephyTokenKeypair.address

    didOwner1 = await generateKeyPairSigner()
    const seed = new Uint8Array(32);
    crypto.getRandomValues(seed);
    did1Address = (await dephyId.findDeviceAssetPda({ deviceSeed: seed, productAsset: productAssetAddress }))[0]

    await sendAndConfirmIxs([
      await dephyId.getCreateDeviceInstructionAsync({
        vendor,
        payer,
        productAsset: productAssetAddress,
        owner: didOwner1.address,
        seed,
        name: 'Test Device',
        uri: '',
      })
    ])

    await sendAndConfirmIxs(
      splToken.getCreateTokenInstructions({
        feePayer: payer,
        mint: stDephyTokenKeypair,
        mintAuthority: vendor,
        decimals: 6,
        metadata: {
          name: 'DePHY Staking Token',
          symbol: 'stPHY',
          uri: '',
          isMutable: false
        },
        metadataAddress: stDephyTokenAddress,
        tokenProgram: splToken.TOKEN_2022_PROGRAM_ADDRESS,
      })
    )

    tokenOwner1 = await generateKeyPairSigner()
    userTokenAddress1 = await splToken.getAssociatedTokenAccountAddress(stDephyTokenAddress, tokenOwner1.address, splToken.TOKEN_2022_PROGRAM_ADDRESS)
    await sendAndConfirmIxs([
      ...splToken.getMintTokensInstructions({
        feePayer: payer,
        mint: stDephyTokenAddress,
        mintAuthority: vendor,
        destination: tokenOwner1.address,
        ata: userTokenAddress1,
        amount: startingAmount,
        tokenProgram: splToken.TOKEN_2022_PROGRAM_ADDRESS,
      })
    ])
  })


  it('initialize', async () => {
    authority = await generateKeyPairSigner()

    await sendAndConfirmIxs([
      await dephyIdStakePool.getInitializeInstructionAsync({
        authority,
        payer,
      }),
    ]);

    const adminPda = await dephyIdStakePool.findAdminAccountPda()
    adminAddress = adminPda[0]
    const adminAccount = await dephyIdStakePool.fetchAdminAccount(rpc, adminAddress)
    assert.equal(adminAccount.data.authority, authority.address)
  })


  let stakeTokenAddress: Address
  const withdrawPending = 1n
  it('create stake pool', async () => {
    const stakePoolKeypair = await generateKeyPairSigner()
    stakePoolAddress = stakePoolKeypair.address

    await sendAndConfirmIxs([
      await dephyIdStakePool.getCreateStakePoolInstructionAsync({
        stakePool: stakePoolKeypair,
        authority,
        stakeTokenMint: stDephyTokenAddress,
        payer,
        stakeTokenProgram: splToken.TOKEN_2022_PROGRAM_ADDRESS,
        collection: productAssetAddress,
        maxStakeAmount: 20000_000_000n,
        admin: adminAddress,
        withdrawPending,
      })
    ])

    const stakeTokenPda = await dephyIdStakePool.findStakeTokenAccountPda({ stakePool: stakePoolAddress })
    stakeTokenAddress = stakeTokenPda[0]

    const stakePoolAccount = await dephyIdStakePool.fetchStakePoolAccount(rpc, stakePoolAddress)
    assert.equal(stakePoolAccount.data.authority, authority.address, 'authority')
    assert.equal(stakePoolAccount.data.config.collection, productAssetAddress, 'collection')
    assert.equal(stakePoolAccount.data.config.stakeTokenMint, stDephyTokenAddress, 'stakeTokenMint')
    assert.equal(stakePoolAccount.data.config.maxStakeAmount, 20000_000_000n, 'maxStakeAmount')
    assert.equal(stakePoolAccount.data.config.withdrawPending, withdrawPending, 'withdrawPending')
    assert.equal(stakePoolAccount.data.stakeTokenAccount, stakeTokenAddress, 'stakeTokenAccount')
    assert.equal(stakePoolAccount.data.totalAmount, 0n, 'totalAmount')
    assert.equal(stakePoolAccount.data.requestedWithdrawal, 0n, 'requestedWithdrawal')
  })


  let nftStake: KeyPairSigner
  it('stake dephy id', async () => {
    nftStake = await generateKeyPairSigner()

    await sendAndConfirmIxs([
      await dephyIdStakePool.getCreateNftStakeInstructionAsync({
        stakePool: stakePoolAddress,
        payer,
        nftStake,
        stakeAuthority: didOwner1,
        depositAuthority: tokenOwner1.address,
        mplCoreAsset: did1Address,
        mplCoreCollection: productAssetAddress,
      })
    ])

    const nftStakeAccount = await dephyIdStakePool.fetchNftStakeAccount(rpc, nftStake.address)
    assert.equal(nftStakeAccount.data.stakePool, stakePoolAddress, 'stakePool')
    assert.equal(nftStakeAccount.data.stakeAuthority, didOwner1.address, 'stakeAuthority')
    assert.equal(nftStakeAccount.data.depositAuthority, tokenOwner1.address, 'depositAuthority')
    assert.equal(nftStakeAccount.data.nftTokenAccount, did1Address, 'nftTokenAccount')
    assert.equal(nftStakeAccount.data.amount, 0n, 'amount')
    assert.equal(nftStakeAccount.data.requestedWithdrawal, 0n, 'requestedWithdrawal')
  })

  // TODO: deposit from other than depositAuthority
  // TODO: deposit amount out of range

  let userStakeAddress: Address
  const depositAmount = 1000_000_000n
  it('deposit', async () => {

    const userStakeAccountPda = await dephyIdStakePool.findUserStakeAccountPda({
      nftStake: nftStake.address,
      user: tokenOwner1.address,
    })
    userStakeAddress = userStakeAccountPda[0]

    await sendAndConfirmIxs([
      await dephyIdStakePool.getDepositTokenInstructionAsync({
        stakePool: stakePoolAddress,
        nftStake: nftStake.address,
        user: tokenOwner1,
        stakeTokenMint: stDephyTokenAddress,
        stakeTokenAccount: stakeTokenAddress,
        userStakeTokenAccount: userTokenAddress1,
        payer,
        amount: depositAmount,
        tokenProgram: splToken.TOKEN_2022_PROGRAM_ADDRESS,
      })
    ])

    const stakePoolAccount = await dephyIdStakePool.fetchStakePoolAccount(rpc, stakePoolAddress)
    assert.equal(stakePoolAccount.data.totalAmount, depositAmount, 'totalAmount')

    const userStakeAccount = await dephyIdStakePool.fetchUserStakeAccount(rpc, userStakeAddress)
    assert.equal(userStakeAccount.data.stakePool, stakePoolAddress, 'stakePool')
    assert.equal(userStakeAccount.data.nftStake, nftStake.address, 'nftStake')
    assert.equal(userStakeAccount.data.user, tokenOwner1.address, 'user')
    assert.equal(userStakeAccount.data.amount, depositAmount, 'amount')

    const stakeTokenAccount = await splToken.fetchToken(rpc, stakeTokenAddress)
    assert.equal(stakeTokenAccount.data.amount, depositAmount)

    const userTokenAccount = await splToken.fetchToken(rpc, userTokenAddress1)
    assert.equal(userTokenAccount.data.amount, startingAmount - depositAmount)
  })


  it('close an active nft stake will fail', async () => {
    await assert.rejects(async () => {
      await sendAndConfirmIxs([
        await dephyIdStakePool.getCloseNftStakeInstructionAsync({
          stakePool: stakePoolAddress,
          nftStake: nftStake.address,
          stakeAuthority: didOwner1,
          payer,
        })
      ], { showError: false })
    })
  })


  let withdrawRequestKeypair1: KeyPairSigner
  const withdrawAmount1 = 500_000_000n
  it('request withdraw', async () => {
    withdrawRequestKeypair1 = await generateKeyPairSigner()

    await sendAndConfirmIxs([
      await dephyIdStakePool.getRequestWithdrawTokenInstructionAsync({
        stakePool: stakePoolAddress,
        nftStake: nftStake.address,
        user: tokenOwner1,
        withdrawRequest: withdrawRequestKeypair1,
        payer,
        amount: withdrawAmount1,
      })
    ])

    const withdrawRequestAccount = await dephyIdStakePool.fetchWithdrawRequestAccount(rpc, withdrawRequestKeypair1.address)
    assert.equal(withdrawRequestAccount.data.stakePool, stakePoolAddress, 'stakePool')
    assert.equal(withdrawRequestAccount.data.user, tokenOwner1.address, 'user')
    assert.equal(withdrawRequestAccount.data.amount, withdrawAmount1, 'amount')

    const userStakeAccount = await dephyIdStakePool.fetchUserStakeAccount(rpc, userStakeAddress)
    assert.equal(userStakeAccount.data.requestedWithdrawal, withdrawAmount1, 'userStake requestedWithdrawal')
    assert.equal(userStakeAccount.data.amount, depositAmount - withdrawAmount1, 'userStake amount')

    const nftStakeAccount = await dephyIdStakePool.fetchNftStakeAccount(rpc, nftStake.address)
    assert.equal(nftStakeAccount.data.requestedWithdrawal, withdrawAmount1, 'nftStake requestedWithdrawal')
    assert.equal(nftStakeAccount.data.amount, depositAmount - withdrawAmount1, 'nftStake amount')

    const stakePoolAccount = await dephyIdStakePool.fetchStakePoolAccount(rpc, stakePoolAddress)
    assert.equal(stakePoolAccount.data.requestedWithdrawal, withdrawAmount1, 'stakePool requestedWithdrawal')
    assert.equal(stakePoolAccount.data.totalAmount, depositAmount - withdrawAmount1, 'stakePool totalAmount')
  })

  it('redeem withdraw before pending', async () => {
    const stakePoolAccount = await dephyIdStakePool.fetchStakePoolAccount(rpc, stakePoolAddress)

    await assert.rejects(async () => {
      await sendAndConfirmIxs([
        await dephyIdStakePool.getRedeemWithdrawTokenInstructionAsync({
          stakePool: stakePoolAddress,
          nftStake: nftStake.address,
          user: tokenOwner1,
          stakeTokenAccount: stakePoolAccount.data.stakeTokenAccount,
          withdrawRequest: withdrawRequestKeypair1.address,
          stakeTokenMint: stDephyTokenAddress,
          userStakeTokenAccount: userTokenAddress1,
          payer,
          tokenProgram: splToken.TOKEN_2022_PROGRAM_ADDRESS,
        })
      ], { showError: false })
    })
  })


  it('unstake nft', async () => {
    await sendAndConfirmIxs([
      await dephyIdStakePool.getUnstakeNftInstructionAsync({
        stakePool: stakePoolAddress,
        nftStake: nftStake.address,
        stakeAuthority: didOwner1,
        mplCoreCollection: productAssetAddress,
        mplCoreAsset: did1Address,
        payer,
      })
    ])

    const nftStakeAccount = await dephyIdStakePool.fetchNftStakeAccount(rpc, nftStake.address)
    assert.equal(nftStakeAccount.data.active, false)
  })


  let withdrawRequestKeypair2: KeyPairSigner
  let withdrawAmount2: bigint
  it('withdraw after unstake', async () => {
    withdrawRequestKeypair2 = await generateKeyPairSigner()
    withdrawAmount2 = depositAmount - withdrawAmount1

    await sendAndConfirmIxs([
      await dephyIdStakePool.getRequestWithdrawTokenInstructionAsync({
        stakePool: stakePoolAddress,
        nftStake: nftStake.address,
        user: tokenOwner1,
        withdrawRequest: withdrawRequestKeypair2,
        payer,
        amount: withdrawAmount2,
      })
    ])

    const withdrawRequestAccount = await dephyIdStakePool.fetchWithdrawRequestAccount(rpc, withdrawRequestKeypair2.address)
    assert.equal(withdrawRequestAccount.data.stakePool, stakePoolAddress, 'stakePool')
    assert.equal(withdrawRequestAccount.data.user, tokenOwner1.address, 'user')
    assert.equal(withdrawRequestAccount.data.amount, withdrawAmount2, 'amount')

    const userStakeAccount = await dephyIdStakePool.fetchUserStakeAccount(rpc, userStakeAddress)
    assert.equal(userStakeAccount.data.requestedWithdrawal, withdrawAmount1 + withdrawAmount2, 'userStake requestedWithdrawal')
    assert.equal(userStakeAccount.data.amount, 0n, 'userStake amount')

    const nftStakeAccount = await dephyIdStakePool.fetchNftStakeAccount(rpc, nftStake.address)
    assert.equal(nftStakeAccount.data.requestedWithdrawal, withdrawAmount1 + withdrawAmount2, 'nftStake requestedWithdrawal')
    assert.equal(nftStakeAccount.data.amount, 0n, 'nftStake amount')

    const stakePoolAccount = await dephyIdStakePool.fetchStakePoolAccount(rpc, stakePoolAddress)
    assert.equal(stakePoolAccount.data.requestedWithdrawal, withdrawAmount1 + withdrawAmount2, 'stakePool requestedWithdrawal')
    assert.equal(stakePoolAccount.data.totalAmount, 0n, 'stakePool totalAmount')
  })


  it('redeem withdraw after pending', async () => {
    let stakePoolAccount = await dephyIdStakePool.fetchStakePoolAccount(rpc, stakePoolAddress)

    await Bun.sleep(1300)

    await sendAndConfirmIxs([
      await dephyIdStakePool.getRedeemWithdrawTokenInstructionAsync({
        stakePool: stakePoolAddress,
        nftStake: nftStake.address,
        user: tokenOwner1,
        stakeTokenAccount: stakePoolAccount.data.stakeTokenAccount,
        withdrawRequest: withdrawRequestKeypair1.address,
        stakeTokenMint: stDephyTokenAddress,
        userStakeTokenAccount: userTokenAddress1,
        payer,
        tokenProgram: splToken.TOKEN_2022_PROGRAM_ADDRESS,
      })
    ])

    const withdrawRequestAccount = await dephyIdStakePool.fetchMaybeWithdrawRequestAccount(rpc, withdrawRequestKeypair1.address)
    assert.equal(withdrawRequestAccount.exists, false)

    const userTokenAccount = await splToken.fetchToken(rpc, userTokenAddress1)
    assert.equal(userTokenAccount.data.amount, startingAmount - depositAmount + withdrawAmount1)

    const stakeTokenAccount = await splToken.fetchToken(rpc, stakeTokenAddress)
    assert.equal(stakeTokenAccount.data.amount, depositAmount - withdrawAmount1)

    const nftStakeAccount = await dephyIdStakePool.fetchNftStakeAccount(rpc, nftStake.address)
    assert.equal(nftStakeAccount.data.requestedWithdrawal, withdrawAmount2)

    const userStakeAccount = await dephyIdStakePool.fetchUserStakeAccount(rpc, userStakeAddress)
    assert.equal(userStakeAccount.data.requestedWithdrawal, withdrawAmount2)

    stakePoolAccount = await dephyIdStakePool.fetchStakePoolAccount(rpc, stakePoolAddress)
    assert.equal(stakePoolAccount.data.requestedWithdrawal, withdrawAmount2)
  })


  it('redeem remaining', async () => {
    let stakePoolAccount = await dephyIdStakePool.fetchStakePoolAccount(rpc, stakePoolAddress)

    await sendAndConfirmIxs([
      await dephyIdStakePool.getRedeemWithdrawTokenInstructionAsync({
        stakePool: stakePoolAddress,
        nftStake: nftStake.address,
        user: tokenOwner1,
        stakeTokenAccount: stakePoolAccount.data.stakeTokenAccount,
        withdrawRequest: withdrawRequestKeypair2.address,
        stakeTokenMint: stDephyTokenAddress,
        userStakeTokenAccount: userTokenAddress1,
        payer,
        tokenProgram: splToken.TOKEN_2022_PROGRAM_ADDRESS,
      })
    ])

    const withdrawRequestAccount = await dephyIdStakePool.fetchMaybeWithdrawRequestAccount(rpc, withdrawRequestKeypair2.address)
    assert.equal(withdrawRequestAccount.exists, false)

    const userTokenAccount = await splToken.fetchToken(rpc, userTokenAddress1)
    assert.equal(userTokenAccount.data.amount, startingAmount)

    const stakeTokenAccount = await splToken.fetchToken(rpc, stakeTokenAddress)
    assert.equal(stakeTokenAccount.data.amount, 0n)

    const nftStakeAccount = await dephyIdStakePool.fetchNftStakeAccount(rpc, nftStake.address)
    assert.equal(nftStakeAccount.data.requestedWithdrawal, 0n)

    const userStakeAccount = await dephyIdStakePool.fetchUserStakeAccount(rpc, userStakeAddress)
    assert.equal(userStakeAccount.data.requestedWithdrawal, 0n)

    stakePoolAccount = await dephyIdStakePool.fetchStakePoolAccount(rpc, stakePoolAddress)
    assert.equal(stakePoolAccount.data.requestedWithdrawal, 0n)
  })


  it('close empty nft stake', async () => {
    let nftStakeAccount = await dephyIdStakePool.fetchMaybeNftStakeAccount(rpc, nftStake.address)
    assertAccountExists(nftStakeAccount)
    assert.equal(nftStakeAccount.data.amount, 0n)
    assert.equal(nftStakeAccount.data.requestedWithdrawal, 0n)

    await sendAndConfirmIxs([
      await dephyIdStakePool.getCloseNftStakeInstructionAsync({
        stakePool: stakePoolAddress,
        nftStake: nftStake.address,
        stakeAuthority: didOwner1,
        payer,
      })
    ])

    nftStakeAccount = await dephyIdStakePool.fetchMaybeNftStakeAccount(rpc, nftStake.address)
    assert.equal(nftStakeAccount.exists, false)
  })
})
