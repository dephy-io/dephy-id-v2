use crate::{
    constants::{POOL_WALLET_SEED, USER_STAKE_SEED},
    error::ErrorCode,
    state::{StakePoolAccount, UserStakeAccount, WithdrawRequestAccount},
};
use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

#[derive(Accounts)]
pub struct RequestWithdraw<'info> {
    #[account(mut, address = user_stake_account.stake_pool @ ErrorCode::InvalidAccount)]
    pub stake_pool: Box<Account<'info, StakePoolAccount>>,
    #[account(address = user_stake_account.user @ ErrorCode::InvalidAuthority)]
    pub user: Signer<'info>,
    #[account(mut, seeds = [stake_pool.key().as_ref(), USER_STAKE_SEED, user.key.as_ref()], bump)]
    pub user_stake_account: Account<'info, UserStakeAccount>,
    #[account(init, payer = payer, space = 8 + WithdrawRequestAccount::INIT_SPACE)]
    pub withdraw_request: Account<'info, WithdrawRequestAccount>,
    #[account(address = stake_pool.config.stake_token_mint @ ErrorCode::InvalidStakeToken)]
    pub stake_token_mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(mut, address = stake_pool.stake_token_account @ ErrorCode::InvalidStakeToken)]
    pub stake_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    /// CHECK: PDA
    #[account(seeds = [stake_pool.key().as_ref(), POOL_WALLET_SEED], bump)]
    pub pool_wallet: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

pub fn process_request_withdraw(ctx: Context<RequestWithdraw>, amount: u64) -> Result<()> {
    msg!("request withdraw {}", amount);

    let stake_pool = &mut ctx.accounts.stake_pool;
    let user_stake = &mut ctx.accounts.user_stake_account;

    let clock = Clock::get()?;
    let now = clock.unix_timestamp as u64;

    if user_stake.last_deposit_timestamp + user_stake.locktime > now {
        return Err(ErrorCode::StakeLocked.into());
    }

    if amount <= 0 {
        return Err(ErrorCode::InvalidAmount.into());
    }

    if amount > user_stake.amount {
        return Err(ErrorCode::InvalidAmount.into());
    }

    let withdraw_request = &mut ctx.accounts.withdraw_request;
    withdraw_request.stake_pool = stake_pool.key();
    withdraw_request.user = ctx.accounts.user.key();
    withdraw_request.amount = amount;
    withdraw_request.timestamp = now;
    withdraw_request.approved = false;

    stake_pool.requested_withdrawal += amount;
    user_stake.amount -= amount;

    Ok(())
}
