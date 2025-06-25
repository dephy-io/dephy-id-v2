use crate::{
    constants::{POOL_WALLET_SEED, USER_STAKE_SEED},
    error::ErrorCode,
    state::{NftStakeAccount, StakePoolAccount, UserStakeAccount},
};
use anchor_lang::{prelude::*, solana_program::system_program};
use anchor_spl::token_interface::{
    transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut, address = user_stake_account.stake_pool @ ErrorCode::InvalidAccount)]
    pub stake_pool: Account<'info, StakePoolAccount>,
    /// CHECK: nft_stake could be unstaked already
    #[account(mut, address = user_stake_account.nft_stake @ ErrorCode::InvalidAccount)]
    pub nft_stake: UncheckedAccount<'info>,
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

pub fn process_withdraw(ctx: Context<Withdraw>, maybe_amount: Option<u64>) -> Result<()> {
    let user_stake = &mut ctx.accounts.user_stake_account;

    let amount = match maybe_amount {
        Some(amount) => amount,
        None => user_stake.amount,
    };

    msg!("withdraw {}", amount);

    let stake_pool = &mut ctx.accounts.stake_pool;

    require_gt!(amount, 0, ErrorCode::InvalidAmount);
    require_gte!(user_stake.amount, amount, ErrorCode::InvalidAmount);
    require_gte!(stake_pool.total_amount, amount, ErrorCode::InvalidAmount);

    let nft_stake_account = &mut ctx.accounts.nft_stake;
    if nft_stake_account.owner.ne(&system_program::id()) {
        if nft_stake_account.owner.eq(ctx.program_id) {
            let mut nft_stake_account_data = nft_stake_account.data.borrow_mut();
            let mut nft_stake =
                NftStakeAccount::try_deserialize(&mut nft_stake_account_data.as_ref())?;

            require_gte!(nft_stake.amount, amount, ErrorCode::InvalidAmount);
            nft_stake.amount -= amount;

            nft_stake.try_serialize(&mut nft_stake_account_data.as_mut())?;
        } else {
            return Err(ErrorCode::InvalidAccount.into());
        }
    }

    stake_pool.total_amount -= amount;
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

    // if remaining amount is zero, close user stake account
    if user_stake.amount == 0 {
        ctx.accounts
            .user_stake_account
            .close(ctx.accounts.payer.to_account_info())?;
    }

    Ok(())
}
