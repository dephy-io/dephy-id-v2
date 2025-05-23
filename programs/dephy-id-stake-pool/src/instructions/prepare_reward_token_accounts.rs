use crate::{error::ErrorCode, state::StakePoolAccount};
use anchor_lang::prelude::*;
use anchor_spl::token_interface::{TokenAccount, TokenInterface};

#[derive(Accounts)]
pub struct PrepareRewardTokenAccounts<'info> {
    pub stake_pool: Box<Account<'info, StakePoolAccount>>,
    /// CHECK: PDA
    #[account(seeds = [stake_pool.key().as_ref(), b"POOL_WALLET"], bump)]
    pub pool_wallet: UncheckedAccount<'info>,
    /// CHECK:
    #[account(address = stake_pool.config.reward_token_mint @ ErrorCode::InvalidRewardToken)]
    pub reward_token_mint: UncheckedAccount<'info>,
    #[account(
        init, payer = payer,
        token::mint = reward_token_mint,
        token::authority = pool_wallet,
        token::token_program = reward_token_program,
        seeds = [stake_pool.key().as_ref(), b"REWARD_TOKEN"],
        bump,
    )]
    pub reward_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        init, payer = payer,
        token::mint = reward_token_mint,
        token::authority = pool_wallet,
        token::token_program = reward_token_program,
        seeds = [stake_pool.key().as_ref(), b"COMMISSION"],
        bump,
    )]
    pub commission_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub reward_token_program: Interface<'info, TokenInterface>,
}

pub fn process_prepare_reward_token_accounts(
    _ctx: Context<PrepareRewardTokenAccounts>,
) -> Result<()> {
    Ok(())
}
