use crate::{
    error::ErrorCode,
    state::{AnnouncedConfigAccount, StakePoolAccount, StakePoolUpdatableConfig},
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct AnnounceUpdateConfig<'info> {
    #[account(mut)]
    pub stake_pool: Box<Account<'info, StakePoolAccount>>,
    #[account(address = stake_pool.authority @ ErrorCode::InvalidAuthority)]
    pub authority: Signer<'info>,
    #[account(init, payer = payer, space = 8 + AnnouncedConfigAccount::INIT_SPACE, seeds = [stake_pool.key().as_ref(), b"ANNOUNCED_CONFIG"], bump)]
    pub announced_config: Account<'info, AnnouncedConfigAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn process_announce_update_config(
    ctx: Context<AnnounceUpdateConfig>,
    config: StakePoolUpdatableConfig,
) -> Result<()> {
    msg!("announce update config");

    if config.min_stake_amount > config.max_stake_amount {
        return Err(ErrorCode::InvalidConfig.into());
    }

    if config.min_locktime > config.max_locktime {
        return Err(ErrorCode::InvalidConfig.into());
    }

    let stake_pool = &mut ctx.accounts.stake_pool;
    stake_pool.announced_config = Some(ctx.accounts.announced_config.key());

    let clock = Clock::get()?;
    let now = clock.unix_timestamp as u64;

    let announced_config = &mut ctx.accounts.announced_config;
    announced_config.stake_pool = stake_pool.key();
    announced_config.authority = ctx.accounts.authority.key();
    announced_config.config = config;
    announced_config.timestamp = now;

    Ok(())
}
