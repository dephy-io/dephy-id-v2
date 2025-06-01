use crate::{
    constants::POOL_WALLET_SEED,
    error::ErrorCode,
    state::{NftStakeAccount, StakePoolAccount},
};
use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

#[derive(Accounts)]
pub struct CloseNftStake<'info> {
    pub stake_pool: Account<'info, StakePoolAccount>,
    #[account(mut, close = payer, has_one = stake_pool)]
    pub nft_stake: Account<'info, NftStakeAccount>,
    pub stake_authority: Signer<'info>,
    /// CHECK:
    #[account(mut, address = stake_pool.config.collection @ ErrorCode::InvalidCollection)]
    pub mpl_core_collection: UncheckedAccount<'info>,
    /// CHECK:
    #[account(mut)]
    pub mpl_core_asset: UncheckedAccount<'info>,
    #[account(address = stake_pool.config.stake_token_mint @ ErrorCode::InvalidStakeToken)]
    pub stake_token_mint: InterfaceAccount<'info, Mint>,
    #[account(address = stake_pool.stake_token_account @ ErrorCode::InvalidStakeToken)]
    pub stake_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(seeds = [stake_pool.key().as_ref(), POOL_WALLET_SEED], bump)]
    pub pool_wallet: SystemAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    /// CHECK:
    #[account(address = mpl_core::ID @ ErrorCode::InvalidMplCoreProgram)]
    pub mpl_core_program: UncheckedAccount<'info>,
}

pub fn process_close_nft_stake(ctx: Context<CloseNftStake>) -> Result<()> {
    msg!("close nft stake with mpl core");

    let nft_stake = &ctx.accounts.nft_stake;
    if nft_stake.amount > 0 {
        return Err(ErrorCode::StakeNonEmpty.into());
    }
    if nft_stake.stake_authority != ctx.accounts.stake_authority.key() {
        return Err(ErrorCode::InvalidAuthority.into());
    }

    mpl_core::instructions::UpdatePluginV1Cpi::new(
        &ctx.accounts.mpl_core_program.to_account_info(),
        mpl_core::instructions::UpdatePluginV1CpiAccounts {
            asset: &ctx.accounts.mpl_core_asset.to_account_info(),
            collection: Some(&ctx.accounts.mpl_core_collection.to_account_info()),
            authority: Some(&ctx.accounts.pool_wallet.to_account_info()),
            system_program: &ctx.accounts.system_program.to_account_info(),
            payer: &ctx.accounts.payer.to_account_info(),
            log_wrapper: None,
        },
        mpl_core::instructions::UpdatePluginV1InstructionArgs {
            plugin: mpl_core::types::Plugin::FreezeDelegate(mpl_core::types::FreezeDelegate {
                frozen: false,
            }),
        },
    )
    .invoke_signed(&[&[
        ctx.accounts.stake_pool.key().as_ref(),
        POOL_WALLET_SEED,
        &[ctx.bumps.pool_wallet],
    ]])?;

    mpl_core::instructions::RemovePluginV1Cpi::new(
        &ctx.accounts.mpl_core_program.to_account_info(),
        mpl_core::instructions::RemovePluginV1CpiAccounts {
            asset: &ctx.accounts.mpl_core_asset.to_account_info(),
            collection: Some(&ctx.accounts.mpl_core_collection.to_account_info()),
            payer: &ctx.accounts.payer.to_account_info(),
            authority: Some(&ctx.accounts.stake_authority.to_account_info()),
            system_program: &ctx.accounts.system_program.to_account_info(),
            log_wrapper: None,
        },
        mpl_core::instructions::RemovePluginV1InstructionArgs {
            plugin_type: mpl_core::types::PluginType::FreezeDelegate,
        },
    )
    .invoke_signed(&[&[
        ctx.accounts.stake_pool.key().as_ref(),
        POOL_WALLET_SEED,
        &[ctx.bumps.pool_wallet],
    ]])?;

    Ok(())
}
