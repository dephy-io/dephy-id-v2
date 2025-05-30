use crate::{
    constants::{POOL_WALLET_SEED, USER_STAKE_SEED},
    error::ErrorCode,
    state::{NftStakeAccount, StakePoolAccount, UserStakeAccount, WithdrawRequestAccount},
};
use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};

#[derive(Accounts)]
pub struct RedeemWithdraw<'info> {
    #[account(mut, address = user_stake_account.stake_pool @ ErrorCode::InvalidAccount)]
    pub stake_pool: Account<'info, StakePoolAccount>,
    #[account(mut)]
    pub nft_stake: Account<'info, NftStakeAccount>,
    #[account(address = user_stake_account.user @ ErrorCode::InvalidAuthority)]
    pub user: Signer<'info>,
    #[account(mut, seeds = [stake_pool.key().as_ref(), USER_STAKE_SEED, user.key.as_ref()], bump)]
    pub user_stake_account: Account<'info, UserStakeAccount>,
    #[account(mut, close = payer)]
    pub withdraw_request: Account<'info, WithdrawRequestAccount>,
    #[account(address = stake_pool.config.stake_token_mint @ ErrorCode::InvalidStakeToken)]
    pub stake_token_mint: InterfaceAccount<'info, Mint>,
    #[account(mut, address = stake_pool.stake_token_account @ ErrorCode::InvalidStakeToken)]
    pub stake_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        token::mint = stake_token_mint,
        token::authority = user,
        token::token_program = token_program
    )]
    pub user_stake_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(seeds = [stake_pool.key().as_ref(), POOL_WALLET_SEED], bump)]
    pub pool_wallet: SystemAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
}

pub fn process_redeem_withdraw(ctx: Context<RedeemWithdraw>) -> Result<()> {
    msg!("redeem withdraw");

    let stake_pool = &mut ctx.accounts.stake_pool;
    let user_stake = &mut ctx.accounts.user_stake_account;
    let withdraw_request = &mut ctx.accounts.withdraw_request;

    require_keys_eq!(
        withdraw_request.stake_pool,
        stake_pool.key(),
        ErrorCode::InvalidAccount
    );

    require_keys_eq!(
        withdraw_request.user,
        ctx.accounts.user.key(),
        ErrorCode::InvalidAuthority
    );

    let clock = Clock::get()?;
    let now = clock.unix_timestamp as u64;

    require_gt!(
        now,
        withdraw_request.timestamp + stake_pool.config.withdraw_pending,
        ErrorCode::NotReadyYet
    );

    let amount = withdraw_request.amount;

    require_gte!(
        ctx.accounts.nft_stake.token_amount,
        amount,
        ErrorCode::InvalidAmount
    );

    ctx.accounts.nft_stake.token_amount -= amount;
    withdraw_request.amount -= amount;
    stake_pool.requested_withdrawal -= amount;
    user_stake.requested_withdrawal -= amount;

    // transfer tokens
    transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.stake_token_account.to_account_info(),
                mint: ctx.accounts.stake_token_mint.to_account_info(),
                to: ctx.accounts.user_stake_token_account.to_account_info(),
                authority: ctx.accounts.pool_wallet.to_account_info(),
            },
            &[&[
                stake_pool.key().as_ref(),
                POOL_WALLET_SEED,
                &[ctx.bumps.pool_wallet],
            ]],
        ),
        amount,
        ctx.accounts.stake_token_mint.decimals,
    )?;

    if withdraw_request.amount == 0 {
        withdraw_request.close(ctx.accounts.payer.to_account_info())?;
    }

    Ok(())
}
