use anchor_lang::prelude::*;

#[account()]
#[derive(InitSpace)]
pub struct DephyAccount {
    pub authority: Pubkey,
}
