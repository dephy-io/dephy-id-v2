#![allow(unexpected_cfgs)]

pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("D1DdkvuK3V8kzxD5CSsx7JorEo3hMLw4L7Bvujv3pTD6");

#[program]
pub mod dephy_id {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        handle_initialize(ctx)
    }

    pub fn create_product(ctx: Context<CreateProduct>, args: CreateProductArgs) -> Result<()> {
        handle_create_product(ctx, args)
    }

    pub fn create_device(ctx: Context<CreateDevice>, args: CreateDeviceArgs) -> Result<()> {
        handle_create_device(ctx, args)
    }

    pub fn update_mint_authority(ctx: Context<UpdateMintAuthority>) -> Result<()> {
        handle_update_mint_authority(ctx)
    }
}
