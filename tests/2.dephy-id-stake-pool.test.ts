import assert from 'assert';
import {
  airdropFactory,
  createSolanaClient, createTransaction, devnet,
  generateKeyPairSigner,
  getSignatureFromTransaction, IInstruction, isSolanaError, KeyPairSigner, lamports,
  signTransactionMessageWithSigners,
} from 'gill'

// import * as solanaPrograms from 'gill/programs'
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

  before('prepare payer', async () => {
    await airdrop({
      commitment: "confirmed",
      lamports: lamports(1_000_000_000n),
      recipientAddress: payer.address,
    })
  })

  let authority: KeyPairSigner
  it("initialize", async () => {
    authority = await generateKeyPairSigner()

    await sendAndConfirmIxs([
      await dephyIdStakePool.getInitializeInstructionAsync({
        authority,
        payer,
      }),
    ]);

    const adminPda = await dephyIdStakePool.findAdminAccountPda()
    const adminAccount = await dephyIdStakePool.fetchAdminAccount(rpc, adminPda[0])
    assert.equal(adminAccount.data.authority, authority.address)
  });

})
