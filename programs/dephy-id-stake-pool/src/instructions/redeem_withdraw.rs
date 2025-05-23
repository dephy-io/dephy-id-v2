use crate::{
    constants::WITHDRAW_REQUEST_PREPARE_TIME,
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
    pub stake_pool: Box<Account<'info, StakePoolAccount>>,
    #[account(address = user_stake_account.user @ ErrorCode::InvalidAuthority)]
    pub user: Signer<'info>,
    #[account(mut, seeds = [stake_pool.key().as_ref(), b"USER_STAKE", user.key.as_ref()], bump)]
    pub user_stake_account: Box<Account<'info, UserStakeAccount>>,
    #[account(mut)]
    pub withdraw_request: Box<Account<'info, WithdrawRequestAccount>>,
    #[account(address = stake_pool.config.stake_token_mint @ ErrorCode::InvalidStakeToken)]
    pub stake_token_mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(mut, address = stake_pool.stake_token_account @ ErrorCode::InvalidStakeToken)]
    pub stake_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        mut,
        token::mint = stake_token_mint,
        token::authority = user,
        token::token_program = token_program
    )]
    pub user_stake_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut)]
    pub nft_stake: Option<Account<'info, NftStakeAccount>>,
    /// CHECK: PDA
    #[account(seeds = [stake_pool.key().as_ref(), b"POOL_WALLET"], bump)]
    pub pool_wallet: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
}

pub fn process_redeem_withdraw(ctx: Context<RedeemWithdraw>, amount: u64) -> Result<()> {
    msg!("redeem withdraw {}", amount);

    let stake_pool = &mut ctx.accounts.stake_pool;
    let user_stake = &mut ctx.accounts.user_stake_account;
    let withdraw_request = &mut ctx.accounts.withdraw_request;

    if withdraw_request.stake_pool != stake_pool.key() {
        return Err(ErrorCode::InvalidAccount.into());
    }

    if withdraw_request.user != ctx.accounts.user.key() {
        return Err(ErrorCode::InvalidAccount.into());
    }

    let clock = Clock::get()?;
    let now = clock.unix_timestamp as u64;

    if withdraw_request.timestamp + WITHDRAW_REQUEST_PREPARE_TIME > now {
        return Err(ErrorCode::NotReadyYet.into());
    }

    if amount > withdraw_request.amount {
        return Err(ErrorCode::NotEnoughToken.into());
    }

    if amount <= 0 {
        return Err(ErrorCode::InvalidAmount.into());
    }

    // TODO
    // crate::accumulate_reward(user_stake, stake_pool)?;

    if withdraw_request.approved && amount >= stake_pool.reserved {
        // force withdraw
        if let Some(nft_stake) = &mut ctx.accounts.nft_stake {
            if nft_stake.token_amount < amount {
                return Err(ErrorCode::NotEnoughToken.into());
            }
            nft_stake.token_amount -= amount;
        } else {
            return Err(ErrorCode::InvalidAccount.into());
        }
    } else {
        stake_pool.reserved -= amount;
    }

    withdraw_request.amount -= amount;
    stake_pool.requested_withdrawal -= amount;
    user_stake.amount -= amount;

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
                b"POOL_WALLET",
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
