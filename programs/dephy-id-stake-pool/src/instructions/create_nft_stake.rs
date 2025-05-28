use crate::{
    constants::POOL_WALLET_SEED,
    error::ErrorCode,
    state::{NftStakeAccount, StakePoolAccount},
};
use anchor_lang::prelude::*;
use anchor_spl::token_interface::TokenAccount;

#[derive(Accounts)]
pub struct CreateNftStake<'info> {
    #[account(mut)]
    pub stake_pool: Box<Account<'info, StakePoolAccount>>,
    #[account(init, payer = payer, space = 8 + NftStakeAccount::INIT_SPACE)]
    pub nft_stake: Box<Account<'info, NftStakeAccount>>,
    pub stake_authority: Signer<'info>,
    /// CHECK:
    #[account(mut)]
    pub mpl_core_asset: UncheckedAccount<'info>,
    /// CHECK:
    #[account(mut)]
    pub mpl_core_collection: UncheckedAccount<'info>,
    /// CHECK:
    #[account(address = stake_pool.config.stake_token_mint @ ErrorCode::InvalidStakeToken)]
    pub stake_token_mint: UncheckedAccount<'info>,
    /// CHECK: PDA
    #[account(seeds = [stake_pool.key().as_ref(), POOL_WALLET_SEED], bump)]
    pub pool_wallet: UncheckedAccount<'info>,
    #[account(mut, address = stake_pool.stake_token_account @ ErrorCode::InvalidStakeToken)]
    pub stake_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    /// CHECK:
    #[account(address = mpl_core::ID)]
    pub mpl_core_program: UncheckedAccount<'info>,
}

pub fn process_create_nft_stake(ctx: Context<CreateNftStake>) -> Result<()> {
    msg!("create nft stake");

    let stake_pool = &mut ctx.accounts.stake_pool;

    if stake_pool.config.collection != ctx.accounts.mpl_core_collection.key() {
        return Err(ErrorCode::CollectionNotMatch.into());
    }

    mpl_core::instructions::AddPluginV1Cpi::new(
        &ctx.accounts.mpl_core_program.to_account_info(),
        mpl_core::instructions::AddPluginV1CpiAccounts {
            asset: &ctx.accounts.mpl_core_asset.to_account_info(),
            collection: Some(&ctx.accounts.mpl_core_collection.to_account_info()),
            payer: &ctx.accounts.payer.to_account_info(),
            authority: Some(&ctx.accounts.stake_authority.to_account_info()),
            system_program: &ctx.accounts.system_program.to_account_info(),
            log_wrapper: None,
        },
        mpl_core::instructions::AddPluginV1InstructionArgs {
            plugin: mpl_core::types::Plugin::FreezeDelegate(mpl_core::types::FreezeDelegate {
                frozen: true,
            }),
            init_authority: Some(mpl_core::types::PluginAuthority::Address {
                address: ctx.accounts.pool_wallet.key(),
            }),
        },
    )
    .invoke()?;

    let nft_stake = &mut ctx.accounts.nft_stake;
    nft_stake.stake_authority = ctx.accounts.stake_authority.key();
    nft_stake.nft_token_account = ctx.accounts.mpl_core_asset.key();
    nft_stake.stake_pool = stake_pool.key();
    nft_stake.token_amount = 0;

    Ok(())
}
