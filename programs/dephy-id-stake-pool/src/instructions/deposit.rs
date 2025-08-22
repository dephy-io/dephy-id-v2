use crate::{
    constants::{POOL_WALLET_SEED, USER_STAKE_SEED},
    error::ErrorCode,
    state::{NftStakeAccount, StakePoolAccount, UserStakeAccount},
};
use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    spl_pod::option::Nullable, transfer_checked, Mint, TokenAccount, TokenInterface,
    TransferChecked,
};

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub nft_stake: Account<'info, NftStakeAccount>,
    #[account(mut, address = nft_stake.stake_pool @ ErrorCode::InvalidAccount)]
    pub stake_pool: Account<'info, StakePoolAccount>,
    #[account()]
    pub user: Signer<'info>,
    #[account(
        init_if_needed, payer = payer,
        space = UserStakeAccount::DISCRIMINATOR.len() + UserStakeAccount::INIT_SPACE,
        seeds = [nft_stake.key().as_ref(), USER_STAKE_SEED, user.key.as_ref()], bump
    )]
    pub user_stake_account: Account<'info, UserStakeAccount>,
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
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

pub fn process_deposit(ctx: Context<Deposit>, maybe_amount: Option<u64>) -> Result<()> {
    let amount = match maybe_amount {
        Some(amount) => amount,
        None => ctx.accounts.user_stake_token_account.amount,
    };

    msg!("deposit {}", amount);

    let stake_pool = &mut ctx.accounts.stake_pool;
    let config = &stake_pool.config;
    let nft_stake = &mut ctx.accounts.nft_stake;
    let user_stake = &mut ctx.accounts.user_stake_account;

    if nft_stake.deposit_authority.is_some() {
        if ctx.accounts.user.key() != nft_stake.deposit_authority
            && ctx.accounts.user.key() != nft_stake.stake_authority
        {
            return Err(ErrorCode::InvalidAuthority.into());
        }
    }

    require_gt!(amount, 0, ErrorCode::InvalidAmount);
    require_gte!(
        config.max_stake_amount,
        nft_stake.amount + amount,
        ErrorCode::InvalidAmount
    );

    let clock = Clock::get()?;
    let now = clock.unix_timestamp as u64;

    user_stake.stake_pool = stake_pool.key();
    user_stake.nft_stake = nft_stake.key();
    user_stake.user = ctx.accounts.user.key();

    user_stake.amount += amount;
    user_stake.last_deposit_timestamp = now;

    nft_stake.amount += amount;

    stake_pool.total_amount += amount;

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

    Ok(())
}
