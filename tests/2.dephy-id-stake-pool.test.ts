import assert from 'assert';
import {
  Address,
  airdropFactory,
  createSolanaClient, createTransaction, devnet,
  generateKeyPairSigner,
  getSignatureFromTransaction, IInstruction, isSolanaError, KeyPairSigner, lamports,
  signTransactionMessageWithSigners,
} from 'gill'
import * as splToken from 'gill/programs/token'

import * as dephyId from '../clients/dephy-id/js/src/index.js'
import * as dephyIdStakePool from '../clients/dephy-id-stake-pool/js/src/index.js'
import * as mplCore from '../deps/mpl-core/js/src/index.js'

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
  let stakePoolAuthority: KeyPairSigner
  let vendor: KeyPairSigner
  let productAssetAddress: Address
  let adminAddress: Address
  let stPhyMintAddress: Address
  let stakePoolAddress: Address
  let didOwner1: KeyPairSigner
  let did1Address: Address
  let tokenOwner1: KeyPairSigner
  let userTokenAddress1: Address
  const startingAmount = 2000_000_000n


  before(async () => {
    await airdrop({
      commitment: "confirmed",
      lamports: lamports(1_000_000_000n),
      recipientAddress: payer.address,
    })

    vendor = await generateKeyPairSigner()
    const productName = "Test DePHY ID"
    productAssetAddress = (await dephyId.findProductAssetPda({ productName, vendor: vendor.address }))[0]

    await sendAndConfirmIxs([
      await dephyId.getCreateProductInstructionAsync({
        vendor,
        payer,
        name: productName,
        productAsset: productAssetAddress,
        uri: "https://example.com/DePHY-ID",
      }),
    ])

    const stPhyMintKeypair = await generateKeyPairSigner()
    stPhyMintAddress = stPhyMintKeypair.address

    didOwner1 = await generateKeyPairSigner()
    const seed = new Uint8Array(32);
    crypto.getRandomValues(seed);
    did1Address = (await dephyId.findDeviceAssetPda({ deviceSeed: seed, productAsset: productAssetAddress }))[0]

    await sendAndConfirmIxs([
      await dephyId.getCreateDeviceInstructionAsync({
        mintAuthority: vendor,
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
        mint: stPhyMintKeypair,
        mintAuthority: vendor,
        decimals: 6,
        metadata: {
          name: 'DePHY Staking Token',
          symbol: 'stPHY',
          uri: '',
          isMutable: false
        },
        metadataAddress: stPhyMintAddress,
        tokenProgram: splToken.TOKEN_2022_PROGRAM_ADDRESS,
      })
    )

    tokenOwner1 = await generateKeyPairSigner()
    userTokenAddress1 = await splToken.getAssociatedTokenAccountAddress(stPhyMintAddress, tokenOwner1.address, splToken.TOKEN_2022_PROGRAM_ADDRESS)
    await sendAndConfirmIxs([
      ...splToken.getMintTokensInstructions({
        feePayer: payer,
        mint: stPhyMintAddress,
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
  it('create stake pool', async () => {
    stakePoolAuthority = await generateKeyPairSigner()
    const stakePoolKeypair = await generateKeyPairSigner()
    stakePoolAddress = stakePoolKeypair.address

    await sendAndConfirmIxs([
      await dephyIdStakePool.getCreateStakePoolInstructionAsync({
        stakePool: stakePoolKeypair,
        authority,
        stakePoolAuthority: stakePoolAuthority.address,
        stakeTokenMint: stPhyMintAddress,
        payer,
        stakeTokenProgram: splToken.TOKEN_2022_PROGRAM_ADDRESS,
        collection: productAssetAddress,
        maxStakeAmount: 20000_000_000n,
      })
    ])

    const stakeTokenPda = await dephyIdStakePool.findStakeTokenAccountPda({ stakePool: stakePoolAddress })
    stakeTokenAddress = stakeTokenPda[0]

    const stakePoolAccount = await dephyIdStakePool.fetchStakePoolAccount(rpc, stakePoolAddress)
    assert.equal(stakePoolAccount.data.authority, stakePoolAuthority.address, 'stakePoolAuthority')
    assert.equal(stakePoolAccount.data.config.collection, productAssetAddress, 'collection')
    assert.equal(stakePoolAccount.data.config.stakeTokenMint, stPhyMintAddress, 'stakeTokenMint')
    assert.equal(stakePoolAccount.data.config.maxStakeAmount, 20000_000_000n, 'maxStakeAmount')
    assert.equal(stakePoolAccount.data.stakeTokenAccount, stakeTokenAddress, 'stakeTokenAccount')
    assert.equal(stakePoolAccount.data.totalAmount, 0n, 'totalAmount')
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

    const assetAccount = await mplCore.fetchAssetAccount(rpc, did1Address)
    assert(assetAccount.data.plugins.freezeDelegate?.frozen)
  })

  it('should fail on transfer frozen asset', async () => {
    await assert.rejects(async () => {
      await sendAndConfirmIxs([
        mplCore.getTransferV1Instruction({
          asset: did1Address,
          payer: didOwner1,
          newOwner: tokenOwner1.address,
        })
      ], { showError: false })
    })
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
        stakeTokenMint: stPhyMintAddress,
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


  const withdrawAmount1 = 500_000_000n
  it('withdraw', async () => {
    let stakePoolAccount = await dephyIdStakePool.fetchStakePoolAccount(rpc, stakePoolAddress)

    await sendAndConfirmIxs([
      await dephyIdStakePool.getWithdrawInstructionAsync({
        stakePool: stakePoolAddress,
        nftStake: nftStake.address,
        user: tokenOwner1,
        payer,
        amount: withdrawAmount1,
        stakeTokenMint: stakePoolAccount.data.config.stakeTokenMint,
        stakeTokenAccount: stakePoolAccount.data.stakeTokenAccount,
        userStakeTokenAccount: userTokenAddress1,
        tokenProgram: splToken.TOKEN_2022_PROGRAM_ADDRESS,
      })
    ])

    const userStakeAccount = await dephyIdStakePool.fetchUserStakeAccount(rpc, userStakeAddress)
    assert.equal(userStakeAccount.data.amount, depositAmount - withdrawAmount1, 'userStake amount')

    const nftStakeAccount = await dephyIdStakePool.fetchNftStakeAccount(rpc, nftStake.address)
    assert.equal(nftStakeAccount.data.amount, depositAmount - withdrawAmount1, 'nftStake amount')

    stakePoolAccount = await dephyIdStakePool.fetchStakePoolAccount(rpc, stakePoolAddress)
    assert.equal(stakePoolAccount.data.totalAmount, depositAmount - withdrawAmount1, 'stakePool totalAmount')
  })


  it('deposit all', async () => {
    await sendAndConfirmIxs([
      await dephyIdStakePool.getDepositTokenInstructionAsync({
        stakePool: stakePoolAddress,
        nftStake: nftStake.address,
        user: tokenOwner1,
        payer,
        amount: null,
        stakeTokenMint: stPhyMintAddress,
        stakeTokenAccount: stakeTokenAddress,
        userStakeTokenAccount: userTokenAddress1,
        tokenProgram: splToken.TOKEN_2022_PROGRAM_ADDRESS,
      })
    ])

    const stakePoolAccount = await dephyIdStakePool.fetchStakePoolAccount(rpc, stakePoolAddress)
    assert.equal(stakePoolAccount.data.totalAmount, startingAmount, 'totalAmount')

    const userStakeAccount = await dephyIdStakePool.fetchUserStakeAccount(rpc, userStakeAddress)
    assert.equal(userStakeAccount.data.stakePool, stakePoolAddress, 'stakePool')
    assert.equal(userStakeAccount.data.nftStake, nftStake.address, 'nftStake')
    assert.equal(userStakeAccount.data.user, tokenOwner1.address, 'user')
    assert.equal(userStakeAccount.data.amount, startingAmount, 'amount')

    const stakeTokenAccount = await splToken.fetchToken(rpc, stakeTokenAddress)
    assert.equal(stakeTokenAccount.data.amount, startingAmount)

    const userTokenAccount = await splToken.fetchToken(rpc, userTokenAddress1)
    assert.equal(userTokenAccount.data.amount, 0n)
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

    const nftStakeAccount = await dephyIdStakePool.fetchMaybeNftStakeAccount(rpc, nftStake.address)
    assert.equal(nftStakeAccount.exists, false)

    const assetAccount = await mplCore.fetchAssetAccount(rpc, did1Address)
    assert.equal(assetAccount.data.plugins.freezeDelegate, null)
  })


  it('withdraw all after unstake', async () => {
    let stakePoolAccount = await dephyIdStakePool.fetchStakePoolAccount(rpc, stakePoolAddress)

    await sendAndConfirmIxs([
      await dephyIdStakePool.getWithdrawInstructionAsync({
        stakePool: stakePoolAddress,
        nftStake: nftStake.address,
        user: tokenOwner1,
        payer,
        amount: null,
        stakeTokenMint: stakePoolAccount.data.config.stakeTokenMint,
        stakeTokenAccount: stakePoolAccount.data.stakeTokenAccount,
        userStakeTokenAccount: userTokenAddress1,
        tokenProgram: splToken.TOKEN_2022_PROGRAM_ADDRESS,
      })
    ])

    const userStakeAccount = await dephyIdStakePool.fetchMaybeUserStakeAccount(rpc, userStakeAddress)
    assert.equal(userStakeAccount.exists, false)

    stakePoolAccount = await dephyIdStakePool.fetchStakePoolAccount(rpc, stakePoolAddress)
    assert.equal(stakePoolAccount.data.totalAmount, 0n, 'stakePool totalAmount')
  })

})
