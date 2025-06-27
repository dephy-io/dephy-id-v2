use anchor_lang::prelude::*;

use crate::{DephyAccount, DEPHY_ACCOUNT_SEED};

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = payer,
        space = DephyAccount::DISCRIMINATOR.len() + DephyAccount::INIT_SPACE,
        seeds = [DEPHY_ACCOUNT_SEED], bump
    )]
    pub dephy: Account<'info, DephyAccount>,
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handle_initialize(ctx: Context<Initialize>) -> Result<()> {
    let dephy = &mut ctx.accounts.dephy;
    dephy.authority = ctx.accounts.authority.key();

    Ok(())
}
