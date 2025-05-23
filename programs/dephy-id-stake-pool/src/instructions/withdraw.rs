use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
use crate::state::{StakePoolAccount, UserStakeAccount};
use crate::error::ErrorCode;

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub stake_pool: Box<Account<'info, StakePoolAccount>>,
    /// CHECK: PDA
    #[account(seeds = [stake_pool.key().as_ref(), b"POOL_WALLET"], bump)]
    pub pool_wallet: UncheckedAccount<'info>,
    #[account(mut, seeds = [stake_pool.key().as_ref(), b"USER_STAKE", user.key.as_ref()], bump)]
    pub user_stake_account: Box<Account<'info, UserStakeAccount>>,
    #[account(address = stake_pool.config.stake_token_mint @ ErrorCode::InvalidStakeToken)]
    pub stake_token_mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(mut, address = stake_pool.stake_token_account @ ErrorCode::InvalidStakeToken)]
    pub stake_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    pub user: Signer<'info>,
    #[account(
        init_if_needed, payer = payer,
        associated_token::mint = stake_token_mint,
        associated_token::authority = user,
        associated_token::token_program = token_program,
    )]
    pub user_stake_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, anchor_spl::associated_token::AssociatedToken>,
}

pub fn process_withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    msg!("withdraw {}", amount);

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

    if amount > stake_pool.unallocated_staking - stake_pool.reserved {
        return Err(ErrorCode::NotEnoughToken.into());
    }

    // TODO: accumulate_reward(user_stake, stake_pool)?;

    user_stake.amount -= amount;
    stake_pool.total_amount -= amount;
    stake_pool.unallocated_staking -= amount;

    // Transfer tokens logic should be here
    // ...

    Ok(())
}
