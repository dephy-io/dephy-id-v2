use crate::{
    constants::ANNOUNCED_CONFIG_SEED,
    error::ErrorCode,
    state::{AnnouncedConfigAccount, StakePoolAccount},
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ConfirmUpdateConfig<'info> {
    #[account(mut, address = announced_config.stake_pool @ ErrorCode::InvalidAccount)]
    pub stake_pool: Account<'info, StakePoolAccount>,
    #[account(address = stake_pool.authority @ ErrorCode::InvalidAuthority)]
    pub authority: Signer<'info>,
    #[account(mut, close = payer, seeds = [stake_pool.key().as_ref(), ANNOUNCED_CONFIG_SEED], bump)]
    pub announced_config: Account<'info, AnnouncedConfigAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
}

pub fn process_confirm_update_config(ctx: Context<ConfirmUpdateConfig>) -> Result<()> {
    msg!("confirm update config");

    let stake_pool = &mut ctx.accounts.stake_pool;
    let announced_config = &ctx.accounts.announced_config;

    if stake_pool.authority != announced_config.authority {
        return Err(ErrorCode::InvalidAuthority.into());
    }

    match stake_pool.announced_config {
        None => {
            return Err(ErrorCode::InvalidAccount.into());
        }
        Some(config_pubkey) => {
            if config_pubkey != announced_config.key() {
                return Err(ErrorCode::InvalidAccount.into());
            }
        }
    }

    let clock = Clock::get()?;
    let now = clock.unix_timestamp as u64;
    if now - announced_config.timestamp < stake_pool.config.config_review_time {
        return Err(ErrorCode::NotReadyYet.into());
    }

    stake_pool.announced_config = None;

    let config = &mut stake_pool.config;
    let new_config = &announced_config.config;

    config.max_stake_amount = new_config.max_stake_amount;
    config.config_review_time = new_config.config_review_time;

    Ok(())
}
