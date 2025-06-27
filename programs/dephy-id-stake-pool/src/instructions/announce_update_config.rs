use crate::{
    constants::ANNOUNCED_CONFIG_SEED,
    error::ErrorCode,
    state::{AnnouncedConfigAccount, StakePoolAccount, StakePoolConfigArgs},
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct AnnounceUpdateConfig<'info> {
    #[account(mut)]
    pub stake_pool: Account<'info, StakePoolAccount>,
    #[account(address = stake_pool.authority @ ErrorCode::InvalidAuthority)]
    pub authority: Signer<'info>,
    #[account(init, payer = payer,
        space = AnnouncedConfigAccount::DISCRIMINATOR.len() + AnnouncedConfigAccount::INIT_SPACE,
        seeds = [stake_pool.key().as_ref(), ANNOUNCED_CONFIG_SEED], bump,
    )]
    pub announced_config: Account<'info, AnnouncedConfigAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn process_announce_update_config(
    ctx: Context<AnnounceUpdateConfig>,
    args: StakePoolConfigArgs,
) -> Result<()> {
    msg!("announce update config");

    require_gt!(args.config_review_time, 0, ErrorCode::InvalidConfig);
    require_gt!(args.max_stake_amount, 0, ErrorCode::InvalidConfig);

    let stake_pool = &mut ctx.accounts.stake_pool;
    stake_pool.announced_config = Some(ctx.accounts.announced_config.key());

    let clock = Clock::get()?;
    let now = clock.unix_timestamp as u64;

    let announced_config = &mut ctx.accounts.announced_config;
    announced_config.stake_pool = stake_pool.key();
    announced_config.authority = ctx.accounts.authority.key();
    announced_config.config = args;
    announced_config.timestamp = now;

    Ok(())
}
