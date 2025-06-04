use crate::{
    constants::{POOL_WALLET_SEED, USER_STAKE_SEED},
    error::ErrorCode,
    state::{NftStakeAccount, StakePoolAccount, UserStakeAccount},
};
use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut, address = user_stake_account.stake_pool @ ErrorCode::InvalidAccount)]
    pub stake_pool: Account<'info, StakePoolAccount>,
    #[account(mut, address = user_stake_account.nft_stake @ ErrorCode::InvalidAccount)]
    pub nft_stake: Account<'info, NftStakeAccount>,
    #[account(address = user_stake_account.user @ ErrorCode::InvalidAuthority)]
    pub user: Signer<'info>,
    #[account(mut, seeds = [nft_stake.key().as_ref(), USER_STAKE_SEED, user.key.as_ref()], bump)]
    pub user_stake_account: Account<'info, UserStakeAccount>,
    #[account(
        address = stake_pool.config.stake_token_mint @ ErrorCode::InvalidStakeToken,
        mint::token_program = token_program
    )]
    pub stake_token_mint: InterfaceAccount<'info, Mint>,
    #[account(mut,
        address = stake_pool.stake_token_account @ ErrorCode::InvalidStakeToken,
        token::mint = stake_token_mint,
        token::authority = pool_wallet,
        token::token_program = token_program
    )]
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

pub fn process_withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    msg!("withdraw {}", amount);

    let stake_pool = &mut ctx.accounts.stake_pool;
    let nft_stake = &mut ctx.accounts.nft_stake;
    let user_stake = &mut ctx.accounts.user_stake_account;

    require_gt!(amount, 0, ErrorCode::InvalidAmount);
    require_gte!(user_stake.amount, amount, ErrorCode::InvalidAmount);
    require_gte!(nft_stake.amount, amount, ErrorCode::InvalidAmount);
    require_gte!(stake_pool.total_amount, amount, ErrorCode::InvalidAmount);

    stake_pool.total_amount -= amount;
    nft_stake.amount -= amount;
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
                POOL_WALLET_SEED,
                &[ctx.bumps.pool_wallet],
            ]],
        ),
        amount,
        ctx.accounts.stake_token_mint.decimals,
    )?;

    Ok(())
}
