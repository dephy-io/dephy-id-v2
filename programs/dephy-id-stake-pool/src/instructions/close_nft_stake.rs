use crate::{
    constants::POOL_WALLET_SEED,
    error::ErrorCode,
    state::{NftStakeAccount, StakePoolAccount},
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CloseNftStake<'info> {
    #[account(mut, close = payer)]
    pub nft_stake: Account<'info, NftStakeAccount>,
    #[account(address = nft_stake.stake_pool @ ErrorCode::InvalidAccount)]
    pub stake_pool: Account<'info, StakePoolAccount>,
    #[account(address = nft_stake.stake_authority @ ErrorCode::InvalidAuthority)]
    pub stake_authority: Signer<'info>,
    #[account(seeds = [stake_pool.key().as_ref(), POOL_WALLET_SEED], bump)]
    pub pool_wallet: SystemAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn process_close_nft_stake(ctx: Context<CloseNftStake>) -> Result<()> {
    msg!("close nft stake account");

    let nft_stake = &ctx.accounts.nft_stake;

    require!(!nft_stake.active, ErrorCode::NftStakeIsActive);
    require_eq!(nft_stake.amount, 0, ErrorCode::StakeNonEmpty);

    Ok(())
}
