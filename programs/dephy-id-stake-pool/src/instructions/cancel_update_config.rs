use crate::error::ErrorCode;
use crate::state::{AnnouncedConfigAccount, StakePoolAccount};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CancelUpdateConfig<'info> {
    #[account(mut, address = announced_config.stake_pool @ ErrorCode::InvalidAccount)]
    pub stake_pool: Account<'info, StakePoolAccount>,
    #[account(address = stake_pool.authority @ ErrorCode::InvalidAuthority)]
    pub authority: Signer<'info>,
    #[account(mut, close = payer)]
    pub announced_config: Account<'info, AnnouncedConfigAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
}

pub fn process_cancel_update_config(ctx: Context<CancelUpdateConfig>) -> Result<()> {
    msg!("cancel update config");

    let stake_pool = &mut ctx.accounts.stake_pool;
    let announced_config = &ctx.accounts.announced_config;

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

    if stake_pool.authority != announced_config.authority {
        return Err(ErrorCode::InvalidAuthority.into());
    }

    stake_pool.announced_config = None;

    Ok(())
}
