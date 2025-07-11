use crate::{
    constants::{ADMIN_SEED, POOL_WALLET_SEED, STAKE_TOKEN_SEED},
    error::ErrorCode,
    state::{AdminAccount, StakePoolAccount, StakePoolConfig, StakePoolConfigArgs},
};
use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

#[derive(Accounts)]
pub struct CreateStakePool<'info> {
    #[account(seeds = [ADMIN_SEED], bump)]
    pub admin: Account<'info, AdminAccount>,
    #[account(init, payer = payer, space = StakePoolAccount::DISCRIMINATOR.len() + StakePoolAccount::INIT_SPACE)]
    pub stake_pool: Account<'info, StakePoolAccount>,
    #[account(address = admin.authority @ ErrorCode::InvalidAuthority)]
    pub authority: Signer<'info>,
    /// CHECK:
    pub stake_pool_authority: UncheckedAccount<'info>,
    /// CHECK:
    pub collection: UncheckedAccount<'info>,
    #[account(mint::token_program = stake_token_program)]
    pub stake_token_mint: InterfaceAccount<'info, Mint>,
    #[account(seeds = [stake_pool.key().as_ref(), POOL_WALLET_SEED], bump)]
    pub pool_wallet: SystemAccount<'info>,
    #[account(
        init, payer = payer,
        token::mint = stake_token_mint,
        token::authority = pool_wallet,
        token::token_program = stake_token_program,
        seeds = [stake_pool.key().as_ref(), STAKE_TOKEN_SEED],
        bump,
    )]
    pub stake_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub stake_token_program: Interface<'info, TokenInterface>,
}

pub fn process_create_stake_pool(
    ctx: Context<CreateStakePool>,
    args: StakePoolConfigArgs,
) -> Result<()> {
    msg!("create stake pool");

    require_gt!(args.config_review_time, 0, ErrorCode::InvalidConfig);
    require_gt!(args.max_stake_amount, 0, ErrorCode::InvalidConfig);

    let stake_pool = &mut ctx.accounts.stake_pool;
    stake_pool.authority = ctx.accounts.stake_pool_authority.key();
    stake_pool.stake_token_account = ctx.accounts.stake_token_account.key();
    stake_pool.total_amount = 0;
    stake_pool.announced_config = None;
    stake_pool.config = StakePoolConfig {
        collection: ctx.accounts.collection.key(),
        stake_token_mint: ctx.accounts.stake_token_mint.key(),
        max_stake_amount: args.max_stake_amount,
        config_review_time: args.config_review_time,
    };

    Ok(())
}
