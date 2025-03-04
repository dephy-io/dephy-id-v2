import assert from 'assert';
import {
  Address, airdropFactory, createNoopSigner, createSolanaClient, createTransaction, devnet,
  fetchEncodedAccount, generateKeyPair, generateKeyPairSigner, getAddressDecoder, getAddressEncoder, getAddressFromPublicKey,
  getSignatureFromTransaction, IInstruction, isSolanaError, KeyPairSigner, lamports, signTransactionMessageWithSigners
} from 'gill'
import * as solanaPrograms from 'gill/programs'

import * as dephyId from '../clients/js/src/index.js'
import * as mplCore from '../deps/mpl-core/js/src/index.js'

const feePayer = await generateKeyPairSigner()

describe("dephy-id", () => {
  const { rpc, rpcSubscriptions, sendAndConfirmTransaction } = createSolanaClient({
    urlOrMoniker: devnet('localnet')
  })

  const airdrop = airdropFactory({ rpc, rpcSubscriptions })

  const sendAndConfirmIxs = async (instructions: IInstruction[]) => {
    const latestBlockhash = (await rpc.getLatestBlockhash().send()).value

    const transaction = createTransaction({
      feePayer,
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

  before('prepare payer', async () => {
    await airdrop({
      commitment: "confirmed",
      lamports: lamports(1_000_000_000n),
      recipientAddress: feePayer.address,
    })

    console.info('NOTE: The first tx may take >10s to confirm')
  })

  let authority: KeyPairSigner
  it("initialize", async () => {
    authority = await generateKeyPairSigner()

    await sendAndConfirmIxs([
      await dephyId.getInitializeInstructionAsync({
        authority,
        payer: feePayer,
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
        payer: feePayer,
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
        payer: feePayer,
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
        payer: feePayer,
      }),
    ])

    assert.equal((await rpc.getBalance(assetSigner).send()).value, 800_000_000n)
    assert.equal((await rpc.getBalance(user.address).send()).value, 200_000_000n)
  })
});
