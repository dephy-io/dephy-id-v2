use crate::{
    constants::POOL_WALLET_SEED,
    error::ErrorCode,
    state::{NftStakeAccount, StakePoolAccount},
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CloseNftStake<'info> {
    pub stake_pool: Account<'info, StakePoolAccount>,
    #[account(mut, close = payer, has_one = stake_pool)]
    pub nft_stake: Account<'info, NftStakeAccount>,
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

    require_keys_eq!(
        nft_stake.stake_authority,
        ctx.accounts.stake_authority.key(),
        ErrorCode::InvalidAuthority
    );

    require!(!nft_stake.active, ErrorCode::NftStakeIsActive);
    require_eq!(nft_stake.amount, 0, ErrorCode::StakeNonEmpty);
    require_eq!(nft_stake.requested_withdrawal, 0, ErrorCode::StakeNonEmpty);

    Ok(())
}
