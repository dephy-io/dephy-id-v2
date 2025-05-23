use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
use crate::state::{StakePoolAccount, UserStakeAccount};
use crate::error::ErrorCode;

#[derive(Accounts)]
pub struct Claim<'info> {
    pub stake_pool: Box<Account<'info, StakePoolAccount>>,
    /// CHECK: PDA
    #[account(seeds = [stake_pool.key().as_ref(), b"POOL_WALLET"], bump)]
    pub pool_wallet: UncheckedAccount<'info>,
    pub user: Signer<'info>,
    #[account(mut, seeds = [stake_pool.key().as_ref(), b"USER_STAKE", user.key.as_ref()], bump)]
    pub user_stake_account: Box<Account<'info, UserStakeAccount>>,
    #[account(address = stake_pool.config.reward_token_mint @ ErrorCode::InvalidRewardToken)]
    pub reward_token_mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        mut,
        token::mint = reward_token_mint,
        token::authority = pool_wallet,
        token::token_program = token_program,
        seeds = [stake_pool.key().as_ref(), b"REWARD_TOKEN"],
        bump,
    )]
    pub reward_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        init_if_needed, payer = payer,
        associated_token::mint = reward_token_mint,
        associated_token::authority = user,
        associated_token::token_program = token_program,
    )]
    pub user_reward_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, anchor_spl::associated_token::AssociatedToken>,
}

pub fn process_claim(ctx: Context<Claim>) -> Result<()> {
    // Handler implementation here
    Ok(())
}
