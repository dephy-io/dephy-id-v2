use crate::{
    constants::PRECISION_FACTOR,
    error::ErrorCode,
    state::{StakePoolAccount, UserStakeAccount},
    utils::mul_div,
};
use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub stake_pool: Box<Account<'info, StakePoolAccount>>,
    pub user: Signer<'info>,
    #[account(
        init_if_needed, payer = payer,
        space = 8 + UserStakeAccount::INIT_SPACE,
        seeds = [stake_pool.key().as_ref(), b"USER_STAKE", user.key.as_ref()], bump
    )]
    pub user_stake_account: Box<Account<'info, UserStakeAccount>>,
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
    /// CHECK: PDA
    #[account(seeds = [stake_pool.key().as_ref(), b"POOL_WALLET"], bump)]
    pub pool_wallet: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

pub fn process_deposit(ctx: Context<Deposit>, amount: u64, locktime: u64) -> Result<()> {
    msg!("deposit {}", amount);
    // TODO: check

    let stake_pool = &mut ctx.accounts.stake_pool;
    let config = &stake_pool.config;
    let user_stake = &mut ctx.accounts.user_stake_account;

    let clock = Clock::get()?;
    let now = clock.unix_timestamp as u64;

    if locktime < config.min_locktime || locktime > config.max_locktime {
        return Err(ErrorCode::InvalidLocktime.into());
    }

    if user_stake.last_deposit_timestamp + user_stake.locktime > now + locktime {
        return Err(ErrorCode::InvalidLocktime.into());
    }

    // TODO
    // crate::accumulate_reward(user_stake, stake_pool)?;

    user_stake.amount += amount;
    user_stake.share += amount;
    user_stake.last_deposit_timestamp = now;
    user_stake.locktime = locktime;

    stake_pool.total_amount += amount;
    stake_pool.unallocated_staking += amount;
    stake_pool.total_share += amount;

    if amount > 0 {
        // enter reserve first
        if stake_pool.requested_withdrawal > stake_pool.reserved {
            let pending_withdrawal = stake_pool.requested_withdrawal - stake_pool.reserved;

            if pending_withdrawal > amount {
                stake_pool.reserved += amount;
            } else {
                stake_pool.reserved += pending_withdrawal;
            }
        }

        // Transfer tokens
        transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.user_stake_token_account.to_account_info(),
                    mint: ctx.accounts.stake_token_mint.to_account_info(),
                    to: ctx.accounts.stake_token_account.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount,
            ctx.accounts.stake_token_mint.decimals,
        )?;
    }

    user_stake.reward_debt = mul_div(
        user_stake.share,
        stake_pool.acc_token_per_share,
        PRECISION_FACTOR,
    )?;

    user_stake.stake_pool = stake_pool.key();
    user_stake.user = ctx.accounts.user.key();

    Ok(())
}
