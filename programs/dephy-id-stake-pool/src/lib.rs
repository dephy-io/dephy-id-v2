#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;

declare_id!("DSTKMXnJXgvViSkr6hciBaYsTpcduxZuF334WLrvEZmW");

mod constants;
mod error;
mod instructions;
mod state;

use instructions::*;
use state::*;

#[program]
pub mod dephy_id_stake_pool {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        process_initialize(ctx)
    }

    pub fn create_stake_pool(
        ctx: Context<CreateStakePool>,
        args: StakePoolConfigArgs,
    ) -> Result<()> {
        process_create_stake_pool(ctx, args)
    }

    pub fn announce_update_config(
        ctx: Context<AnnounceUpdateConfig>,
        args: StakePoolConfigArgs,
    ) -> Result<()> {
        process_announce_update_config(ctx, args)
    }

    pub fn cancel_update_config(ctx: Context<CancelUpdateConfig>) -> Result<()> {
        process_cancel_update_config(ctx)
    }

    pub fn confirm_update_config(ctx: Context<ConfirmUpdateConfig>) -> Result<()> {
        process_confirm_update_config(ctx)
    }

    // Will only support MplCore
    pub fn create_nft_stake(ctx: Context<CreateNftStake>) -> Result<()> {
        process_create_nft_stake(ctx)
    }

    pub fn unstake_nft(ctx: Context<UnstakeNft>) -> Result<()> {
        process_unstake_nft(ctx)
    }

    pub fn close_nft_stake(ctx: Context<CloseNftStake>) -> Result<()> {
        process_close_nft_stake(ctx)
    }

    pub fn deposit_token(ctx: Context<Deposit>, amount: Option<u64>) -> Result<()> {
        process_deposit(ctx, amount)
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: Option<u64>) -> Result<()> {
        process_withdraw(ctx, amount)
    }
}
