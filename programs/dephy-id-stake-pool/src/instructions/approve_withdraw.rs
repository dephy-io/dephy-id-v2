use crate::{
    error::ErrorCode,
    state::{StakePoolAccount, UserStakeAccount, WithdrawRequestAccount},
};
use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

#[derive(Accounts)]
pub struct ApproveWithdraw<'info> {
    #[account(mut)]
    pub user_stake_account: Box<Account<'info, UserStakeAccount>>,
    #[account(mut, address = user_stake_account.stake_pool @ ErrorCode::InvalidAccount)]
    pub stake_pool: Box<Account<'info, StakePoolAccount>>,
    #[account(address = stake_pool.authority @ ErrorCode::InvalidAuthority)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub withdraw_request: Box<Account<'info, WithdrawRequestAccount>>,
    #[account(address = stake_pool.config.stake_token_mint @ ErrorCode::InvalidStakeToken)]
    pub stake_token_mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(mut, address = stake_pool.stake_token_account @ ErrorCode::InvalidStakeToken)]
    pub stake_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    /// CHECK: PDA
    #[account(seeds = [stake_pool.key().as_ref(), b"POOL_WALLET"], bump)]
    pub pool_wallet: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

pub fn process_approve_withdraw(ctx: Context<ApproveWithdraw>) -> Result<()> {
    msg!("approve withdraw");

    let stake_pool = &mut ctx.accounts.stake_pool;
    let user_stake = &mut ctx.accounts.user_stake_account;
    let withdraw_request = &mut ctx.accounts.withdraw_request;

    if withdraw_request.stake_pool != stake_pool.key() {
        return Err(ErrorCode::InvalidAccount.into());
    }

    if withdraw_request.user != user_stake.user {
        return Err(ErrorCode::InvalidAccount.into());
    }

    if user_stake.amount < withdraw_request.amount {
        return Err(ErrorCode::NotEnoughToken.into());
    }

    if withdraw_request.amount <= 0 {
        return Err(ErrorCode::InvalidAmount.into());
    }

    if withdraw_request.approved {
        return Err(ErrorCode::InvalidAccount.into());
    }

    withdraw_request.approved = true;
    stake_pool.reserved += withdraw_request.amount;

    Ok(())
}
