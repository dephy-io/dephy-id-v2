import * as dephyId from '../clients/js/src/index.js'
import * as mplCore from '../deps/mpl-core/js/src/index.js'
import * as solana from '@solana/kit'
// TODO: wait @solana-program/system update
import * as system from '@solana-program/system/clients/js/src'
import assert from "assert";

const payer = await solana.generateKeyPairSigner()

describe("dephy-id", () => {
  const rpc = solana.createSolanaRpc(solana.devnet('http://127.0.0.1:8899'))
  const rpcSubscriptions = solana.createSolanaRpcSubscriptions('ws://127.0.0.1:8900')
  const airdrop = solana.airdropFactory({ rpc, rpcSubscriptions })
  const sendAndConfirm = solana.sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })

  const sendAndConfirmIxs = async (ixs: solana.IInstruction[]) => {
    const recentBlockhash = (await rpc.getLatestBlockhash().send()).value

    const signedTx = await solana.pipe(
      solana.createTransactionMessage({ version: 0 }),
      tx => solana.appendTransactionMessageInstructions(ixs, tx),
      tx => solana.setTransactionMessageFeePayerSigner(payer, tx),
      tx => solana.setTransactionMessageLifetimeUsingBlockhash(recentBlockhash, tx),
      tx => solana.signTransactionMessageWithSigners(tx)
    );

    try {
      await sendAndConfirm(signedTx, { commitment: 'confirmed' })
    } catch (error) {
      if (solana.isSolanaError(error)) {
        console.error(error.context)
      }

      throw error
    }
    return solana.getSignatureFromTransaction(signedTx)
  }

  before('prepare payer', async () => {
    await airdrop({
      commitment: "confirmed",
      lamports: solana.lamports(1_000_000_000n),
      recipientAddress: payer.address,
    })

    console.info('NOTE: The first tx may take >10s to confirm')
  })

  let authority: solana.KeyPairSigner
  it("initialize", async () => {
    authority = await solana.generateKeyPairSigner()

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


  let vendor: solana.KeyPairSigner
  let productAsset: solana.Address
  it("create product", async () => {
    vendor = await solana.generateKeyPairSigner()
    const productName = "Demo Product 1"
    const productAssetPda = await dephyId.findProductAssetPda({ vendor: vendor.address, productName })
    productAsset = productAssetPda[0]

    await sendAndConfirmIxs([
      dephyId.getCreateProductInstruction({
        vendor,
        payer,
        productAsset,
        name: productName,
        uri: "https://example.com/product-1"
      }),
    ])

    const maybeProduct = await mplCore.fetchMaybeCollectionV1(rpc, productAsset)
    assert.ok(maybeProduct.exists)
    assert.equal(maybeProduct.programAddress, mplCore.MPL_CORE_PROGRAM_ADDRESS)

    const product = maybeProduct.data
    assert.equal(product.name, productName)
    assert.equal(product.uri, "https://example.com/product-1")
  });


  let deviceKey: CryptoKeyPair
  let deviceSeed: solana.Address
  // the asset address
  let deviceAsset: solana.Address
  let user: solana.KeyPairSigner
  it("create device", async () => {
    deviceKey = await solana.generateKeyPair()
    deviceSeed = await solana.getAddressFromPublicKey(deviceKey.publicKey)
    const encodedSeed = solana.getAddressEncoder().encode(deviceSeed)
    user = await solana.generateKeyPairSigner()

    const deviceAssetPda = await dephyId.findDeviceAssetPda({
      productAsset,
      deviceSeed: encodedSeed
    })
    deviceAsset = deviceAssetPda[0]

    await sendAndConfirmIxs([
      await dephyId.getCreateDeviceInstructionAsync({
        vendor,
        productAsset,
        owner: user.address,
        payer,
        seed: encodedSeed,
        name: "Test Device 1",
        uri: "https://example.com/product-1/device-1",
      }),
    ])

    const maybeAsset = await mplCore.fetchMaybeAssetV1(rpc, deviceAssetPda[0])
    assert.ok(maybeAsset.exists)
    assert.equal(maybeAsset.programAddress, mplCore.MPL_CORE_PROGRAM_ADDRESS)

    const asset = maybeAsset.data
    assert.equal(asset.owner, user.address)
    assert.equal(asset.name, "Test Device 1")
    assert.equal(asset.uri, "https://example.com/product-1/device-1")

    const encodedAccount = await solana.fetchEncodedAccount(rpc, deviceAsset)
    assert.ok(encodedAccount.exists)

    const decodedAsset = mplCore.getAssetAccountDecoder().decode(encodedAccount.data)
    const attr0 = decodedAsset.plugins.attributes.attributeList[0]
    assert.equal(attr0.key, "Seed")
    assert.equal(attr0.value, solana.getAddressDecoder().decode(encodedSeed))
    assert.deepEqual(decodedAsset.plugins.dataSections[0].data, encodedSeed)
  });


  it("act as wallet", async () => {
    const assetSigner = (await mplCore.findAssetSignerPda({ asset: deviceAsset }))[0]

    await airdrop({
      commitment: "confirmed",
      lamports: solana.lamports(1_000_000_000n),
      recipientAddress: assetSigner,
    })

    assert.equal((await rpc.getBalance(assetSigner).send()).value, 1_000_000_000n)
    assert.equal((await rpc.getBalance(user.address).send()).value, 0n)

    await sendAndConfirmIxs([
      await mplCore.createExecuteIx({
        collection: productAsset,
        asset: deviceAsset,
        payer: payer,
        authority: user,
        instruction: system.getTransferSolInstruction({
          source: solana.createNoopSigner(assetSigner),
          destination: user.address,
          amount: solana.lamports(200_000_000n),
        }),
      }),
    ])

    assert.equal((await rpc.getBalance(assetSigner).send()).value, 800_000_000n)
    assert.equal((await rpc.getBalance(user.address).send()).value, 200_000_000n)
  })
});
