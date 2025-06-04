import assert from 'assert';
import {
  Address, airdropFactory, appendTransactionMessageInstruction, createNoopSigner,
  createSolanaClient, createTransaction, createTransactionMessage, devnet,
  fetchEncodedAccount, generateKeyPair, generateKeyPairSigner,
  getAddressDecoder, getAddressEncoder, getAddressFromPublicKey, getCompiledTransactionMessageDecoder,
  getSignatureFromTransaction, IInstruction, isSolanaError, KeyPairSigner, lamports,
  partiallySignTransactionMessageWithSigners, pipe, setTransactionMessageFeePayer, setTransactionMessageLifetimeUsingBlockhash,
  signTransaction, signTransactionMessageWithSigners, transactionFromBase64, transactionToBase64,
} from 'gill'
import * as solanaPrograms from 'gill/programs'

import * as dephyId from '../clients/dephy-id/js/src/index.js'
import * as mplCore from '../deps/mpl-core/js/src/index.js'

const payer = await generateKeyPairSigner()

describe("dephy-id", () => {
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

  before(async () => {
    console.info('NOTE: wait for slot 0, may take >10s')

    await airdrop({
      commitment: "confirmed",
      lamports: lamports(1_000_000_000n),
      recipientAddress: payer.address,
    })

    let ready = false
    while (!ready) {
      const slot = await rpc.getSlot({ commitment: 'finalized' }).send()
      ready = slot > 0n
      if (!ready) {
        await Bun.sleep(400)
      }
    }
  })


  let authority: KeyPairSigner
  it("initialize", async () => {
    authority = await generateKeyPairSigner()

    await sendAndConfirmIxs([
      await dephyId.getInitializeInstructionAsync({
        authority,
        payer,
      }),
    ]);

    const dephyPda = await dephyId.findDephyAccountPda()
    const dephyAccount = await dephyId.fetchDephyAccount(rpc, dephyPda[0])
    assert.equal(dephyAccount.data.authority, authority.address)
  });


  let vendor: KeyPairSigner
  let productAsset: Address
  it("create product", async () => {
    vendor = await generateKeyPairSigner()
    const productName = "Demo Product 1"
    const productAssetPda = await dephyId.findProductAssetPda({ productName, vendor: vendor.address })
    productAsset = productAssetPda[0]

    await sendAndConfirmIxs([
      dephyId.getCreateProductInstruction({
        name: productName,
        payer,
        productAsset,
        uri: "https://example.com/product-1",
        vendor
      }),
    ])

    const encodedProduct = await fetchEncodedAccount(rpc, productAsset)
    assert.ok(encodedProduct.exists)
    assert.equal(encodedProduct.programAddress, mplCore.MPL_CORE_PROGRAM_ADDRESS)

    const decodedProduct = mplCore.getCollectionAccountDecoder().decode(encodedProduct.data)

    const product = decodedProduct.base
    assert.equal(product.name, productName)
    assert.equal(product.uri, "https://example.com/product-1")

    assert.deepEqual(getAddressEncoder().encode(vendor.address), decodedProduct.plugins.appDatas[0].data)
  });


  let deviceKey: CryptoKeyPair
  let deviceSeed: Address
  // the asset address
  let deviceAsset: Address
  let user: KeyPairSigner
  it("create device", async () => {
    deviceKey = await generateKeyPair()
    deviceSeed = await getAddressFromPublicKey(deviceKey.publicKey)
    const encodedSeed = getAddressEncoder().encode(deviceSeed)
    user = await generateKeyPairSigner()

    const deviceAssetPda = await dephyId.findDeviceAssetPda({
      deviceSeed: encodedSeed,
      productAsset
    })
    deviceAsset = deviceAssetPda[0]

    await sendAndConfirmIxs([
      await dephyId.getCreateDeviceInstructionAsync({
        name: "Test Device 1",
        owner: user.address,
        payer,
        productAsset,
        seed: encodedSeed,
        uri: "https://example.com/product-1/device-1",
        vendor,
      }),
    ])

    const encodedAsset = await fetchEncodedAccount(rpc, deviceAsset)
    assert.ok(encodedAsset.exists)
    assert.equal(encodedAsset.programAddress, mplCore.MPL_CORE_PROGRAM_ADDRESS)

    const decodedAsset = mplCore.getAssetAccountDecoder().decode(encodedAsset.data)

    const baseAsset = decodedAsset.base
    assert.equal(baseAsset.owner, user.address)
    assert.equal(baseAsset.name, "Test Device 1")
    assert.equal(baseAsset.uri, "https://example.com/product-1/device-1")

    const attr0 = decodedAsset.plugins.attributes.attributeList[0]
    assert.equal(attr0.key, "Seed")
    assert.equal(attr0.value, getAddressDecoder().decode(encodedSeed))
    assert.deepEqual(decodedAsset.plugins.dataSections[0].data, encodedSeed)
  });


  it("mint multiple assets in one tx", async () => {
    const seeds = await Array.fromAsync({ length: 5 }, async () => {
      const randomBytes = new Uint8Array(32);
      crypto.getRandomValues(randomBytes);
      const owner = await generateKeyPairSigner()
      return {
        seed: randomBytes,
        owner: owner.address
      };
    });

    const ixs = await Promise.all(seeds.map(({ seed, owner }, i) =>
      dephyId.getCreateDeviceInstructionAsync({
        name: `Test Device ${i}`,
        uri: `https://example.com/product-1/device-${i}`,
        seed,
        payer,
        productAsset,
        owner,
        vendor,
      })
    ))

    await sendAndConfirmIxs(ixs)

    await Promise.all(seeds.map(async ({ seed, owner }, i) => {
      const [deviceAsset, _deviceAssetBump] = await dephyId.findDeviceAssetPda({
        deviceSeed: seed,
        productAsset
      })

      const assetAccount = await mplCore.fetchAssetAccount(rpc, deviceAsset)
      assert.equal(assetAccount.data.base.name, `Test Device ${i}`)
      assert.equal(assetAccount.data.base.owner, owner)
    }))
  })


  it("co-sign create-device", async () => {
    // 1. Server create the tx
    const seed = new Uint8Array(32);
    crypto.getRandomValues(seed);

    const ix = await dephyId.getCreateDeviceInstructionAsync({
      name: `Test Device X`,
      uri: `https://example.com/product-1/device-X`,
      seed,
      payer,
      productAsset,
      owner: payer.address,
      vendor,
      expiry: Math.trunc(Date.now() / 1000) + 300
    })

    const latestBlockhash = (await rpc.getLatestBlockhash().send()).value
    const transactionMessage = pipe(
      createTransactionMessage({ version: 0 }),
      tx => setTransactionMessageFeePayer(payer.address, tx),
      tx => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
      tx => appendTransactionMessageInstruction(ix, tx),
    )

    // 2. Server sign the tx
    const partiallySignedTransactionMessage = await partiallySignTransactionMessageWithSigners(transactionMessage)

    // 3. Server encode the tx and send it to user
    const base64EncodedTransaction = transactionToBase64(partiallySignedTransactionMessage)

    // 4. User decode the received tx
    const decodedTransaction = transactionFromBase64(base64EncodedTransaction)

    // 5. User can then verify the tx message
    const compiledTransactionMessage = getCompiledTransactionMessageDecoder().decode(decodedTransaction.messageBytes);
    const compiledInstruction = compiledTransactionMessage.instructions[0]
    assert.equal(compiledTransactionMessage.staticAccounts[compiledInstruction.programAddressIndex], dephyId.DEPHY_ID_PROGRAM_ADDRESS)

    const createDeviceIx = dephyId.getCreateDeviceInstructionDataDecoder().decode(compiledInstruction.data)
    assert.equal(createDeviceIx.name, `Test Device X`)
    assert.equal(createDeviceIx.uri, `https://example.com/product-1/device-X`)
    assert.deepEqual(createDeviceIx.seed, seed)

    // 6. User sign the tx
    const fullySignedTx = await signTransaction([payer.keyPair], decodedTransaction)
    const fullySignedTxWithLifetime = {
      ...fullySignedTx,
      lifetimeConstraint: latestBlockhash
    }

    await sendAndConfirmTransaction(fullySignedTxWithLifetime, { commitment: 'confirmed' })

    const [deviceAsset, _deviceAssetBump] = await dephyId.findDeviceAssetPda({
      deviceSeed: seed,
      productAsset
    })

    const assetAccount = await mplCore.fetchAssetAccount(rpc, deviceAsset)
    assert.equal(assetAccount.data.base.name, `Test Device X`)
    assert.equal(assetAccount.data.base.owner, payer.address)
  })


  it("act as wallet", async () => {
    const assetSigner = (await mplCore.findAssetSignerPda({ asset: deviceAsset }))[0]

    await airdrop({
      commitment: "confirmed",
      lamports: lamports(1_000_000_000n),
      recipientAddress: assetSigner,
    })

    assert.equal((await rpc.getBalance(assetSigner).send()).value, 1_000_000_000n)
    assert.equal((await rpc.getBalance(user.address).send()).value, 0n)

    await sendAndConfirmIxs([
      await mplCore.createExecuteIx({
        asset: deviceAsset,
        authority: user,
        collection: productAsset,
        instruction: solanaPrograms.getTransferSolInstruction({
          amount: lamports(200_000_000n),
          destination: user.address,
          source: createNoopSigner(assetSigner),
        }),
        payer,
      }),
    ])

    assert.equal((await rpc.getBalance(assetSigner).send()).value, 800_000_000n)
    assert.equal((await rpc.getBalance(user.address).send()).value, 200_000_000n)
  })
});
