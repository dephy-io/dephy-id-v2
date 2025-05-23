use crate::state::AdminAccount;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = payer, space = 8 + AdminAccount::INIT_SPACE, seeds = [b"ADMIN"], bump)]
    pub admin: Account<'info, AdminAccount>,
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn process_initialize(ctx: Context<Initialize>) -> Result<()> {
    let admin = &mut ctx.accounts.admin;
    admin.authority = ctx.accounts.authority.key();

    Ok(())
}
