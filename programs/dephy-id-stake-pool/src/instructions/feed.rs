use crate::{error::ErrorCode, state::StakePoolAccount};
use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

#[derive(Accounts)]
pub struct Feed<'info> {
    #[account(mut)]
    pub stake_pool: Box<Account<'info, StakePoolAccount>>,
    #[account(
        mint::token_program = token_program,
        address = stake_pool.config.reward_token_mint @ ErrorCode::InvalidRewardToken,
    )]
    pub reward_token_mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(address = stake_pool.authority @ ErrorCode::InvalidAuthority)]
    pub feeder: Signer<'info>,
    #[account(
        mut,
        token::mint = reward_token_mint,
        token::authority = pool_wallet,
        token::token_program = token_program,
        address = stake_pool.reward_token_account @ ErrorCode::InvalidRewardToken,
    )]
    pub reward_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        mut,
        token::mint = reward_token_mint,
        token::authority = feeder,
        token::token_program = token_program,
    )]
    pub feeder_reward_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        mut,
        token::mint = reward_token_mint,
        token::authority = pool_wallet,
        token::token_program = token_program,
        address = stake_pool.commission_token_account @ ErrorCode::InvalidRewardToken,
    )]
    pub commission_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    /// CHECK: PDA
    #[account(seeds = [stake_pool.key().as_ref(), b"POOL_WALLET"], bump)]
    pub pool_wallet: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
}

pub fn process_feed(ctx: Context<Feed>, reward_amount: u64) -> Result<()> {
    // Handler implementation here
    Ok(())
}
