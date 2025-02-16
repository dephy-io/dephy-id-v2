import * as dephyId from '../clients/js/src/index.js'
import * as solana from '@solana/web3.js'
import assert from "assert";

const payer = await solana.generateKeyPairSigner()

describe("dephy-id", () => {
  const rpc = solana.createSolanaRpc(solana.devnet('http://127.0.0.1:8899'))
  const rpcSubscriptions = solana.createSolanaRpcSubscriptions('ws://127.0.0.1:8900')
  const airdrop = solana.airdropFactory({ rpc, rpcSubscriptions })
  const sendAndConfirm = solana.sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })

  const sendAndConfirmTransaction = async ({ ixs, signers = [] }: { ixs: solana.IInstruction[], signers?: CryptoKeyPair[] }) => {
    const recentBlockhash = (await rpc.getLatestBlockhash().send()).value

    const signedTx = await solana.pipe(
      solana.createTransactionMessage({ version: 0 }),
      tx => solana.appendTransactionMessageInstructions(ixs, tx),
      tx => solana.setTransactionMessageFeePayerSigner(payer, tx),
      tx => solana.setTransactionMessageLifetimeUsingBlockhash(recentBlockhash, tx),
      tx => solana.signTransactionMessageWithSigners(tx)
    );

    const signature = solana.getSignatureFromTransaction(signedTx)

    try {
      await sendAndConfirm(signedTx, { commitment: 'confirmed' })
    } catch (error) {
      if (solana.isSolanaError(error)) {
        console.error(error.context)
      }

      throw error
    }
    return signature
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

    await sendAndConfirmTransaction({
      ixs: [
        await dephyId.getInitializeInstructionAsync({
          authority,
          payer,
        }),
      ],
      signers: [authority.keyPair],
    });

    const dephyPda = await dephyId.findDephyAccountPda()
    const dephyAccount = await dephyId.fetchDephyAccount(rpc, dephyPda[0])
    assert.equal(dephyAccount.data.authority, authority.address)
  });


  let vendor: solana.KeyPairSigner
  let productAssetPda: solana.ProgramDerivedAddress
  it("create product", async () => {
    vendor = await solana.generateKeyPairSigner()
    const productName = "Demo Product 1"
    productAssetPda = await dephyId.findProductAssetPda({ vendor: vendor.address, productName })

    await sendAndConfirmTransaction({
      ixs: [
        dephyId.getCreateProductInstruction({
          vendor,
          payer,
          productAsset: productAssetPda[0],
          name: productName,
          uri: "https://example.com/product-1"
        }),
      ],
      signers: [vendor.keyPair],
    })

    const productAsset = await rpc.getAccountInfo(productAssetPda[0]).send()
    assert.equal(productAsset.value.owner, 'CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d')
  });


  let deviceKey: CryptoKeyPair
  it("create device", async () => {
    deviceKey = await solana.generateKeyPair()
    const devicePubkey = await solana.getAddressFromPublicKey(deviceKey.publicKey)
    const deviceSeed = solana.getAddressEncoder().encode(devicePubkey)

    const deviceAssetPda = await dephyId.findDeviceAssetPda({
      productAsset: productAssetPda[0],
      devicePubkey
    })

    await sendAndConfirmTransaction({
      ixs: [
        dephyId.getCreateDeviceInstruction({
          vendor,
          productAsset: productAssetPda[0],
          deviceAsset: deviceAssetPda[0],
          owner: vendor.address,
          payer,
          seed: deviceSeed,
          name: "Test Device 1",
          uri: "https://example.com/product-1/device-1",
        }),
      ],
    })

    const deviceAsset = await rpc.getAccountInfo(deviceAssetPda[0], { encoding: 'jsonParsed' }).send()
    assert.equal(deviceAsset.value.owner, 'CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d')
  });
});
