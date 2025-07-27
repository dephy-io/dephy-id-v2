use anchor_lang::prelude::*;

use crate::error::ErrorCode;
use crate::ProductAccount;

#[derive(Accounts)]
pub struct UpdateMintAuthority<'info> {
    #[account(mut)]
    pub product_account: Account<'info, ProductAccount>,

    #[account(address = product_account.vendor @ ErrorCode::InvalidAuthority)]
    pub vendor: Signer<'info>,

    /// CHECK: new mint authority of the product
    pub mint_authority: UncheckedAccount<'info>,
}

pub fn handle_update_mint_authority(ctx: Context<UpdateMintAuthority>) -> Result<()> {
    let product_account = &mut ctx.accounts.product_account;
    product_account.mint_authority = ctx.accounts.mint_authority.key();

    Ok(())
}
