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

  const sendAndConfirmIxs = async (instructions: IInstruction[]) => {
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
      if (isSolanaError(error)) {
        console.error(error.context)
      }

      throw error
    }
  }

  let authority: KeyPairSigner
  let vendor: KeyPairSigner
  let productAsset: Address
  let admin: Address
  let stDephyToken: Address
  let stakePool: Address
  let didOwner1: KeyPairSigner
  let did1: Address
  let tokenOwner1: KeyPairSigner
  let tokenAccount1: Address


  before('prepare', async () => {
    await airdrop({
      commitment: "confirmed",
      lamports: lamports(1_000_000_000n),
      recipientAddress: payer.address,
    })

    vendor = await generateKeyPairSigner()
    const productName = "Test DePHY ID"
    productAsset = (await dephyId.findProductAssetPda({ productName, vendor: vendor.address }))[0]

    await sendAndConfirmIxs([
      dephyId.getCreateProductInstruction({
        vendor,
        payer,
        name: productName,
        productAsset,
        uri: "https://example.com/DePHY-ID",
      }),
    ])

    const stDephyTokenKeypair = await generateKeyPairSigner()
    stDephyToken = stDephyTokenKeypair.address

    didOwner1 = await generateKeyPairSigner()
    const seed = new Uint8Array(32);
    crypto.getRandomValues(seed);
    did1 = (await dephyId.findDeviceAssetPda({ deviceSeed: seed, productAsset }))[0]

    await sendAndConfirmIxs([
      await dephyId.getCreateDeviceInstructionAsync({
        vendor,
        payer,
        productAsset,
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
        metadataAddress: stDephyToken,
        tokenProgram: splToken.TOKEN_2022_PROGRAM_ADDRESS,
      })
    )

    tokenOwner1 = await generateKeyPairSigner()
    tokenAccount1 = await splToken.getAssociatedTokenAccountAddress(stDephyToken, tokenOwner1.address, splToken.TOKEN_2022_PROGRAM_ADDRESS)
    await sendAndConfirmIxs([
      ...splToken.getMintTokensInstructions({
        feePayer: payer,
        mint: stDephyToken,
        mintAuthority: vendor,
        destination: tokenOwner1.address,
        ata: tokenAccount1,
        amount: 1_000_000,
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
    admin = adminPda[0]
    const adminAccount = await dephyIdStakePool.fetchAdminAccount(rpc, admin)
    assert.equal(adminAccount.data.authority, authority.address)
  })


  let stakeTokenAddress: Address
  it('create stake pool', async () => {
    const stakePoolKeypair = await generateKeyPairSigner()
    stakePool = stakePoolKeypair.address

    await sendAndConfirmIxs([
      await dephyIdStakePool.getCreateStakePoolInstructionAsync({
        stakePool: stakePoolKeypair,
        authority,
        stakeTokenMint: stDephyToken,
        payer,
        stakeTokenProgram: splToken.TOKEN_2022_PROGRAM_ADDRESS,
        collection: productAsset,
        minStakeAmount: 1000_000_000n,
        maxStakeAmount: 20000_000_000n,
        minLocktime: 0,
        maxLocktime: 0,
        admin,
      })
    ])

    const stakeTokenPda = await dephyIdStakePool.findStakeTokenAccountPda({ stakePool })
    stakeTokenAddress = stakeTokenPda[0]

    const stakePoolAccount = await dephyIdStakePool.fetchStakePoolAccount(rpc, stakePool)
    assert.equal(stakePoolAccount.data.authority, authority.address, 'authority')
    assert.equal(stakePoolAccount.data.config.collection, productAsset, 'collection')
    assert.equal(stakePoolAccount.data.config.stakeTokenMint, stDephyToken, 'stakeTokenMint')
    assert.equal(stakePoolAccount.data.config.minStakeAmount, 1000_000_000n, 'minStakeAmount')
    assert.equal(stakePoolAccount.data.config.maxStakeAmount, 20000_000_000n, 'maxStakeAmount')
    assert.equal(stakePoolAccount.data.config.minLocktime, 0, 'minLocktime')
    assert.equal(stakePoolAccount.data.config.maxLocktime, 0, 'maxLocktime')
    assert.equal(stakePoolAccount.data.stakeTokenAccount, stakeTokenAddress, 'stakeTokenAccount')
    assert.equal(stakePoolAccount.data.totalStaking, 0, 'totalStaking')
    assert.equal(stakePoolAccount.data.requestedWithdrawal, 0, 'requestedWithdrawal')
    assert.equal(stakePoolAccount.data.reserved, 0, 'reserved')
  })


  let nftStake: KeyPairSigner
  it('stake dephy id', async () => {
    nftStake = await generateKeyPairSigner()

    await sendAndConfirmIxs([
      await dephyIdStakePool.getCreateNftStakeInstructionAsync({
        stakePool,
        stakeTokenAccount: stakeTokenAddress,
        payer,
        stakeTokenMint: stDephyToken,
        nftStake,
        stakeAuthority: didOwner1,
        mplCoreAsset: did1,
        mplCoreCollection: productAsset,
      })
    ])

    const nftStakeAccount = await dephyIdStakePool.fetchNftStakeAccount(rpc, nftStake.address)
    assert.equal(nftStakeAccount.data.stakePool, stakePool, 'stakePool')
    assert.equal(nftStakeAccount.data.stakeAuthority, didOwner1.address, 'stakeAuthority')
    assert.equal(nftStakeAccount.data.nftTokenAccount, did1, 'nftTokenAccount')
    assert.equal(nftStakeAccount.data.tokenAmount, 0, 'tokenAmount')
  })

  it('deposit', async () => {
    const depositAmount = 1_000_000n
    const locktime = 0n

    const userStakeAccountPda = await dephyIdStakePool.findUserStakeAccountPda({
      nftStake: nftStake.address,
      user: tokenOwner1.address,
    })
    const userStakeAddress = userStakeAccountPda[0]

    await sendAndConfirmIxs([
      await dephyIdStakePool.getDepositTokenInstructionAsync({
        stakePool,
        nftStake: nftStake.address,
        user: tokenOwner1,
        stakeTokenMint: stDephyToken,
        stakeTokenAccount: stakeTokenAddress,
        userStakeTokenAccount: tokenAccount1,
        payer,
        amount: depositAmount,
        locktime,
        tokenProgram: splToken.TOKEN_2022_PROGRAM_ADDRESS,
      })
    ])

    const stakePoolAccount = await dephyIdStakePool.fetchStakePoolAccount(rpc, stakePool)
    assert.equal(stakePoolAccount.data.totalStaking, depositAmount, 'totalStaking')

    const userStakeAccount = await dephyIdStakePool.fetchUserStakeAccount(rpc, userStakeAddress)
    assert.equal(userStakeAccount.data.stakePool, stakePool, 'stakePool')
    assert.equal(userStakeAccount.data.nftStake, nftStake.address, 'nftStake')
    assert.equal(userStakeAccount.data.user, tokenOwner1.address, 'user')
    assert.equal(userStakeAccount.data.amount, depositAmount, 'amount')
    assert.equal(userStakeAccount.data.locktime, locktime, 'locktime')
  })
})
