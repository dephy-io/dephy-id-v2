use crate::{
    constants::USER_STAKE_SEED,
    error::ErrorCode,
    state::{NftStakeAccount, StakePoolAccount, UserStakeAccount, WithdrawRequestAccount},
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct RequestWithdraw<'info> {
    #[account(mut, address = user_stake_account.stake_pool @ ErrorCode::InvalidAccount)]
    pub stake_pool: Account<'info, StakePoolAccount>,
    #[account(mut, address = user_stake_account.nft_stake @ ErrorCode::InvalidAccount)]
    pub nft_stake: Account<'info, NftStakeAccount>,
    #[account(address = user_stake_account.user @ ErrorCode::InvalidAuthority)]
    pub user: Signer<'info>,
    #[account(mut, seeds = [nft_stake.key().as_ref(), USER_STAKE_SEED, user.key.as_ref()], bump)]
    pub user_stake_account: Account<'info, UserStakeAccount>,
    #[account(init, payer = payer, space = 8 + WithdrawRequestAccount::INIT_SPACE)]
    pub withdraw_request: Account<'info, WithdrawRequestAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn process_request_withdraw(ctx: Context<RequestWithdraw>, amount: u64) -> Result<()> {
    msg!("request withdraw {}", amount);

    let stake_pool = &mut ctx.accounts.stake_pool;
    let nft_stake = &mut ctx.accounts.nft_stake;
    let user_stake = &mut ctx.accounts.user_stake_account;

    let clock = Clock::get()?;
    let now = clock.unix_timestamp as u64;

    require_gt!(amount, 0, ErrorCode::InvalidAmount);
    require_gte!(user_stake.amount, amount, ErrorCode::InvalidAmount);
    require_gte!(nft_stake.amount, amount, ErrorCode::InvalidAmount);
    require_gte!(stake_pool.total_amount, amount, ErrorCode::InvalidAmount);

    let withdraw_request = &mut ctx.accounts.withdraw_request;
    withdraw_request.stake_pool = stake_pool.key();
    withdraw_request.user = ctx.accounts.user.key();
    withdraw_request.amount = amount;
    withdraw_request.timestamp = now;

    stake_pool.total_amount -= amount;
    stake_pool.requested_withdrawal += amount;
    nft_stake.amount -= amount;
    user_stake.amount -= amount;
    user_stake.requested_withdrawal += amount;

    Ok(())
}
