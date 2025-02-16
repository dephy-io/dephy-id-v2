#![allow(unexpected_cfgs)]

pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("6RuNPDwj63gfBFEx7DFfoQPbxfkDHQt4ccf8d4eWAZDX");

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
}
