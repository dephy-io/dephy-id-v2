#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;

declare_id!("DeSTKZaWUDGLAx4FFVzMtJPSDTgWi3sccj4MACs9vj6Y");

mod constants;
mod error;
mod instructions;
mod state;


#[program]
pub mod stake_pool {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::process_initialize(ctx)
    }

    pub fn create_stake_pool(
        ctx: Context<CreateStakePool>,
        config: StakePoolInitConfig,
    ) -> Result<()> {
        instructions::process_create_stake_pool(ctx, config)
    }

    pub fn prepare_reward_token_accounts(ctx: Context<PrepareRewardTokenAccounts>) -> Result<()> {
        instructions::process_prepare_reward_token_accounts(ctx)
    }

    pub fn announce_update_config(
        ctx: Context<AnnounceUpdateConfig>,
        config: StakePoolUpdatableConfig,
    ) -> Result<()> {
        instructions::process_announce_update_config(ctx, config)
    }

    pub fn cancel_update_config(ctx: Context<CancelUpdateConfig>) -> Result<()> {
        instructions::process_cancel_update_config(ctx)
    }

    pub fn confirm_update_config(ctx: Context<ConfirmUpdateConfig>) -> Result<()> {
        instructions::process_confirm_update_config(ctx)
    }

    pub fn reallocate_stake(ctx: Context<ReallocateStake>, amount: u64) -> Result<()> {
        instructions::process_reallocate_stake(ctx, amount)
    }

    pub fn create_nft_stake_with_mpl_core(ctx: Context<CreateNftStakeWithMplCore>) -> Result<()> {
        instructions::process_create_nft_stake_with_mpl_core(ctx)
    }

    pub fn close_nft_stake_with_mpl_core(ctx: Context<CloseNftStakeWithMplCore>) -> Result<()> {
        instructions::process_close_nft_stake_with_mpl_core(ctx)
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64, locktime: u64) -> Result<()> {
        instructions::process_deposit(ctx, amount, locktime)
    }

    pub fn request_withdraw(ctx: Context<RequestWithdraw>, amount: u64) -> Result<()> {
        instructions::process_request_withdraw(ctx, amount)
    }

    pub fn approve_withdraw(ctx: Context<ApproveWithdraw>) -> Result<()> {
        instructions::process_approve_withdraw(ctx)
    }

    pub fn redeem_withdraw(ctx: Context<RedeemWithdraw>, amount: u64) -> Result<()> {
        instructions::process_redeem_withdraw(ctx, amount)
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        instructions::process_withdraw(ctx, amount)
    }

    pub fn feed(ctx: Context<Feed>, reward_amount: u64) -> Result<()> {
        instructions::process_feed(ctx, reward_amount)
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        instructions::process_claim(ctx)
    }
    
    pub fn get_claimable(ctx: Context<GetClaimable>) -> Result<u64> {
        instructions::process_get_claimable(ctx)
    }
}
