use crate::{
    constants::{POOL_WALLET_SEED, STAKE_TOKEN_SEED},
    error::ErrorCode,
    state::{AdminAccount, StakePoolAccount, StakePoolConfig, StakePoolInitConfig},
};
use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

#[derive(Accounts)]
pub struct CreateStakePool<'info> {
    pub admin: Account<'info, AdminAccount>,
    #[account(init, payer = payer, space = 8 + StakePoolAccount::INIT_SPACE)]
    pub stake_pool: Box<Account<'info, StakePoolAccount>>,
    #[account(address = admin.authority @ ErrorCode::InvalidAuthority)]
    pub authority: Signer<'info>,
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
    config: StakePoolInitConfig,
) -> Result<()> {
    msg!("create stake pool");

    if config.min_stake_amount > config.max_stake_amount {
        return Err(ErrorCode::InvalidConfig.into());
    }

    if config.min_locktime > config.max_locktime {
        return Err(ErrorCode::InvalidConfig.into());
    }

    let stake_pool = &mut ctx.accounts.stake_pool;
    stake_pool.authority = ctx.accounts.authority.key();
    stake_pool.stake_token_account = ctx.accounts.stake_token_account.key();
    stake_pool.total_staking = 0;
    stake_pool.reserved = 0;
    stake_pool.config = StakePoolConfig {
        collection: config.collection,
        stake_token_mint: ctx.accounts.stake_token_mint.key(),
        min_stake_amount: config.min_stake_amount,
        max_stake_amount: config.max_stake_amount,
        min_locktime: config.min_locktime,
        max_locktime: config.max_locktime,
    };

    Ok(())
}
