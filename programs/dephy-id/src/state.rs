use anchor_lang::prelude::*;

#[account()]
#[derive(InitSpace)]
pub struct DephyAccount {
    pub authority: Pubkey,
}

#[account()]
#[derive(InitSpace)]
pub struct ProductAccount {
    pub vendor: Pubkey,
    pub collection: Pubkey,
    pub mint_authority: Pubkey,
}
