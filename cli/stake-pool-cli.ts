
import { Command } from "@commander-js/extra-typings"
import assert from 'assert'
import { address, generateKeyPairSigner } from "gill"
import { loadKeypairSignerFromFile } from "gill/node"
import * as splToken from 'gill/programs/token'

import * as dephyIdStakePool from '../clients/dephy-id-stake-pool/js/src/index.js'
import * as mplCore from '../deps/mpl-core/js/src/index.js'
import { createSolanaContext } from "./common.js"

let ctx: Awaited<ReturnType<typeof createSolanaContext>>

const cli = new Command()
  .name('dephy-id-stake-pool-cli')
  .version('0.1.0')
  .description('CLI for dephy-id-stake-pool')
  .requiredOption('-k, --keypair <path>', 'Path to the fee payer keypair', '~/.config/solana/id.json')
  .option('-u --url <urlOrMoniker>', 'RPC endpoint url or moniker', 'http://127.0.0.1:8899')
  .hook('preAction', async (cmd) => {
    const { keypair, url: urlOrMoniker } = cmd.opts()

    ctx = await createSolanaContext({
      keypair,
      urlOrMoniker,
    })
  })


cli
  .command('initialize')
  .description('Initialize DePHY stake pool program')
  .option('-a, --authority <path>', 'Path to authority keypair file')
  .action(async (options) => {
    const authority = options.authority ? await loadKeypairSignerFromFile(options.authority) : ctx.feePayer;

    const signature = await ctx.sendAndConfirmIxs([
      await dephyIdStakePool.getInitializeInstructionAsync({
        authority,
        payer: ctx.feePayer,
      }),
    ]);

    console.log(`Stake pool program initialized with authority ${authority.address}`);
    console.log(`Transaction: ${signature}`);
  });

cli
  .command('create-stake-pool')
  .description('Create a new stake pool')
  .option('-a, --authority <path>', 'Path to authority keypair file (defaults to fee payer)')
  .option('-s, --stake-pool-authority <address>', 'Address of the stake pool authority, defaults to authority')
  .requiredOption('--stake-token-mint <address>', 'Address of the stake token mint')
  .requiredOption('--collection <address>', 'Address of the collection')
  .option('--withdraw-pending <seconds>', 'Withdrawal pending period in seconds', '1814400')
  .option('--max-stake-amount <amount>', 'Maximum stake amount (ui amount)', '20000')
  .action(async (options) => {
    const authority = options.authority ? await loadKeypairSignerFromFile(options.authority) : ctx.feePayer;
    const stakePoolAuthority = options.stakePoolAuthority ? address(options.stakePoolAuthority) : authority.address
    const collection = address(options.collection)
    const stakeTokenMint = address(options.stakeTokenMint)
    const withdrawPending = BigInt(options.withdrawPending)
    const maxStakeAmount = Number(options.maxStakeAmount)
    const stakePoolSigner = await generateKeyPairSigner()

    const adminAddress = (await dephyIdStakePool.findAdminAccountPda())[0]
    const adminAccount = await dephyIdStakePool.fetchAdminAccount(ctx.rpc, adminAddress)
    assert.equal(adminAccount.data.authority, authority.address)

    const stakeTokenMintAccount = await splToken.fetchMint(ctx.rpc, stakeTokenMint)
    splToken.assertIsSupportedTokenProgram(stakeTokenMintAccount.programAddress)
    const maxStakeAmountInSmallestUnits = splToken.tokenUiAmountToAmount(maxStakeAmount, stakeTokenMintAccount.data.decimals)

    const collectionAccount = await mplCore.fetchCollectionAccount(ctx.rpc, collection)

    const signature = await ctx.sendAndConfirmIxs([
      await dephyIdStakePool.getCreateStakePoolInstructionAsync({
        stakePool: stakePoolSigner,
        authority,
        stakePoolAuthority,
        collection,
        stakeTokenMint,
        payer: ctx.feePayer,
        maxStakeAmount: maxStakeAmountInSmallestUnits,
        withdrawPending,
        stakeTokenProgram: stakeTokenMintAccount.programAddress,
      }),
    ])

    console.log(`Stake pool created at ${stakePoolSigner.address}`)
    console.log(`Authority: ${authority.address}`)
    console.log(`Collection: ${collectionAccount.address}`)
    console.log(`Stake Token Mint: ${stakeTokenMint}`)
    console.log(`Withdraw Pending: ${withdrawPending} seconds`)
    console.log(`Max Stake Amount: ${maxStakeAmountInSmallestUnits}`)
    console.log(`Transaction: ${signature}`)
  });


cli
  .command('stake-nft')
  .description('Stake a DePHY ID NFT into a stake pool')
  .requiredOption('--stake-pool <address>', 'Address of the stake pool')
  .requiredOption('--stake-authority <path>', 'Path to the NFT owner\'s keypair file (stake authority), defaults to fee payer')
  .option('--deposit-authority <address>', 'Address of the deposit authority, defaults to stake authority')
  .requiredOption('--nft-asset <address>', 'Address of the DePHY ID NFT to stake (mpl_core_asset)')
  .action(async (options) => {
    const stakePool = address(options.stakePool);
    const stakeAuthority = options.stakeAuthority ? await loadKeypairSignerFromFile(options.stakeAuthority) : ctx.feePayer;
    const depositAuthority = options.depositAuthority ? address(options.depositAuthority) : stakeAuthority.address
    const nftAsset = address(options.nftAsset);
    const nftStakeSigner = await generateKeyPairSigner();

    const stakePoolAccount = await dephyIdStakePool.fetchStakePoolAccount(ctx.rpc, stakePool)
    const collectionAccount = await mplCore.fetchCollectionAccount(ctx.rpc, stakePoolAccount.data.config.collection)
    const assetAccount = await mplCore.fetchAssetAccount(ctx.rpc, nftAsset)

    assert.equal(assetAccount.data.base.updateAuthority.type, 'Collection', 'not a collection asset')
    assert.equal(assetAccount.data.base.updateAuthority.address, collectionAccount.address, `asset ${nftAsset} is not in collection ${collectionAccount.address}`)

    const signature = await ctx.sendAndConfirmIxs([
      await dephyIdStakePool.getCreateNftStakeInstructionAsync({
        stakePool,
        stakeAuthority,
        mplCoreAsset: nftAsset,
        mplCoreCollection: collectionAccount.address,
        nftStake: nftStakeSigner,
        payer: ctx.feePayer,
        depositAuthority,
      }),
    ]);

    console.log(`NFT ${nftAsset} staked into pool ${stakePool}`)
    console.log(`NFT Stake account: ${nftStakeSigner.address}`)
    console.log(`Stake Authority: ${stakeAuthority.address}`)
    console.log(`Deposit Authority: ${depositAuthority}`)
    console.log(`Transaction: ${signature}`)
  });


cli
  .command('deposit')
  .description('Deposit tokens into an NFT stake')
  .requiredOption('--nft-stake <address>', 'Address of the NFT stake account')
  .requiredOption('--amount <number>', 'Amount of tokens to deposit (ui amount)')
  .option('--user <path>', 'Path to the token owner\'s keypair file, defaults to fee payer')
  .option('--user-token-account <address>', 'Address of the user\'s token account for the stake token')
  .action(async (options) => {
    const nftStake = address(options.nftStake)
    const user = options.user ? await loadKeypairSignerFromFile(options.user) : ctx.feePayer
    const amount = Number(options.amount)

    const nftStakeAccount = await dephyIdStakePool.fetchNftStakeAccount(ctx.rpc, nftStake)
    const stakePoolAddress = nftStakeAccount.data.stakePool
    const stakePoolAccount = await dephyIdStakePool.fetchStakePoolAccount(ctx.rpc, stakePoolAddress)
    assert.equal(nftStakeAccount.data.depositAuthority, user.address, 'depositAuthority')

    const stakeTokenMint = address(stakePoolAccount.data.config.stakeTokenMint)
    const stakeTokenMintAccount = await splToken.fetchMint(ctx.rpc, stakeTokenMint)

    splToken.assertIsSupportedTokenProgram(stakeTokenMintAccount.programAddress)
    const userStakeTokenAccount = options.userTokenAccount ? address(options.userTokenAccount) : (await splToken.findAssociatedTokenPda({
      mint: stakeTokenMint,
      owner: user.address,
      tokenProgram: stakeTokenMintAccount.programAddress,
    }))[0];

    const amountInSmallestUnits = splToken.tokenUiAmountToAmount(amount, stakeTokenMintAccount.data.decimals)

    const signature = await ctx.sendAndConfirmIxs([
      await dephyIdStakePool.getDepositTokenInstructionAsync({
        stakePool: stakePoolAddress,
        nftStake,
        user,
        stakeTokenAccount: stakePoolAccount.data.stakeTokenAccount,
        stakeTokenMint,
        userStakeTokenAccount,
        amount: amountInSmallestUnits,
        payer: ctx.feePayer,
        tokenProgram: stakeTokenMintAccount.programAddress,
      }),
    ])

    console.log(`Deposited ${amount} tokens into NFT stake ${nftStake} by user ${user.address}`)
    console.log(`Transaction: ${signature}`)
  })


cli
  .command('request-withdraw')
  .description('Request withdrawal of tokens from an NFT stake')
  .requiredOption('--nft-stake <address>', 'Address of the NFT stake account')
  .requiredOption('--amount <number>', 'Amount of tokens to request for withdrawal (ui amount)')
  .option('--user <path>', 'Path to the token owner\'s keypair file, defaults to fee payer')
  .action(async (options) => {
    const nftStake = address(options.nftStake)
    const nftStakeAccount = await dephyIdStakePool.fetchNftStakeAccount(ctx.rpc, nftStake)
    const stakePoolAddress = nftStakeAccount.data.stakePool
    const user = options.user ? await loadKeypairSignerFromFile(options.user) : ctx.feePayer
    const amount = BigInt(options.amount)
    const withdrawRequestSigner = await generateKeyPairSigner()

    const signature = await ctx.sendAndConfirmIxs([
      await dephyIdStakePool.getRequestWithdrawTokenInstructionAsync({
        stakePool: stakePoolAddress,
        nftStake,
        user,
        withdrawRequest: withdrawRequestSigner,
        amount,
        payer: ctx.feePayer,
      }),
    ])

    console.log(`Withdrawal request for ${amount} tokens created at ${withdrawRequestSigner.address}`)
    console.log(`From NFT stake ${nftStake} by user ${user.address}`)
    console.log(`Transaction: ${signature}`)
  })


cli
  .command('redeem-withdraw')
  .description('Redeem withdrawn tokens after the pending period')
  .requiredOption('--nft-stake <address>', 'Address of the NFT stake account')
  .requiredOption('--withdraw-request <address>', 'Address of the withdraw request account')
  .option('--user <path>', 'Path to the token owner\'s keypair file, defaults to fee payer')
  .option('--user-token-account <address>', 'Address of the user\'s token account to receive redeemed tokens')
  .action(async (options) => {
    const nftStake = address(options.nftStake);
    const user = options.user ? await loadKeypairSignerFromFile(options.user) : ctx.feePayer;
    const withdrawRequest = address(options.withdrawRequest);
    const nftStakeAccount = await dephyIdStakePool.fetchNftStakeAccount(ctx.rpc, nftStake);
    const stakePoolAccount = await dephyIdStakePool.fetchStakePoolAccount(ctx.rpc, nftStakeAccount.data.stakePool);
    const stakeTokenMint = address(stakePoolAccount.data.config.stakeTokenMint);
    const stakeTokenMintAccount = await splToken.fetchMint(ctx.rpc, stakeTokenMint);
    splToken.assertIsSupportedTokenProgram(stakeTokenMintAccount.programAddress)
    const userStakeTokenAccount = options.userTokenAccount ? address(options.userTokenAccount) : (await splToken.findAssociatedTokenPda({
      mint: stakeTokenMint,
      owner: user.address,
      tokenProgram: stakeTokenMintAccount.programAddress,
    }))[0];

    const signature = await ctx.sendAndConfirmIxs([
      await dephyIdStakePool.getRedeemWithdrawTokenInstructionAsync({
        stakePool: stakePoolAccount.address,
        nftStake,
        user,
        stakeTokenAccount: stakePoolAccount.data.stakeTokenAccount,
        withdrawRequest,
        stakeTokenMint,
        userStakeTokenAccount,
        payer: ctx.feePayer,
        tokenProgram: stakeTokenMintAccount.programAddress,
      }),
    ]);

    console.log(`Tokens redeemed from withdraw request ${withdrawRequest} to user token account ${userStakeTokenAccount}`);
    console.log(`Transaction: ${signature}`);
  })


cli
  .command('close-nft-stake')
  .description('Close an empty NFT stake account')
  .requiredOption('--nft-stake <address>', 'Address of the NFT stake account to close')
  .option('--stake-authority <path>', 'Path to the NFT owner\'s keypair file (stake authority), defaults to fee payer')
  .action(async (options) => {
    const nftStake = address(options.nftStake);
    const nftStakeAccount = await dephyIdStakePool.fetchNftStakeAccount(ctx.rpc, nftStake)
    const stakePoolAddress = nftStakeAccount.data.stakePool
    const stakeAuthority = options.stakeAuthority ? await loadKeypairSignerFromFile(options.stakeAuthority) : ctx.feePayer;

    const signature = await ctx.sendAndConfirmIxs([
      await dephyIdStakePool.getCloseNftStakeInstructionAsync({
        stakePool: stakePoolAddress,
        nftStake,
        stakeAuthority,
        payer: ctx.feePayer,
      }),
    ]);

    console.log(`NFT stake account ${nftStake} closed`);
    console.log(`Transaction: ${signature}`);
  })

await cli.parseAsync()
