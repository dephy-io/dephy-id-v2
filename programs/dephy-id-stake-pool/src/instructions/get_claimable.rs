use crate::state::StakePoolAccount;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct GetClaimable<'info> {
    pub stake_pool: Box<Account<'info, StakePoolAccount>>,
}

pub fn process_get_claimable(ctx: Context<GetClaimable>) -> Result<u64> {
    // Handler implementation here
    Ok(0)
}
