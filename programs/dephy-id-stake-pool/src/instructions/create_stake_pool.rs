use anchor_lang::prelude::*;
use anchor_spl::token_interface::{TokenAccount, TokenInterface};
use crate::state::{StakePoolAccount, StakePoolConfig, StakePoolInitConfig};
use crate::error::ErrorCode;


#[derive(Accounts)]
pub struct CreateStakePool<'info> {
    #[account(init, payer = payer, space = 8 + StakePoolAccount::INIT_SPACE)]
    pub stake_pool: Box<Account<'info, StakePoolAccount>>,
    pub authority: Signer<'info>,
    /// CHECK:
    #[account(owner = stake_token_program.key() @ ErrorCode::InvalidStakeToken)]
    pub stake_token_mint: UncheckedAccount<'info>,
    /// CHECK:
    #[account(owner = reward_token_program.key() @ ErrorCode::InvalidRewardToken)]
    pub reward_token_mint: UncheckedAccount<'info>,
    /// CHECK: PDA
    #[account(seeds = [stake_pool.key().as_ref(), b"POOL_WALLET"], bump)]
    pub pool_wallet: UncheckedAccount<'info>,
    #[account(
        init, payer = payer,
        token::mint = stake_token_mint,
        token::authority = pool_wallet,
        token::token_program = stake_token_program,
        seeds = [stake_pool.key().as_ref(), b"STAKE_TOKEN"],
        bump,
    )]
    pub stake_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    /// CHECK:
    #[account(seeds = [stake_pool.key().as_ref(), b"REWARD_TOKEN"], bump)]
    pub reward_token_account: UncheckedAccount<'info>,
    /// CHECK:
    #[account(seeds = [stake_pool.key().as_ref(), b"COMMISSION"], bump)]
    pub commission_token_account: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub stake_token_program: Interface<'info, TokenInterface>,
    pub reward_token_program: Interface<'info, TokenInterface>,
}

pub fn process_create_stake_pool(
    ctx: Context<CreateStakePool>,
    config: StakePoolInitConfig,
) -> Result<()> {
    msg!("create stake pool");

    if config.min_stake_amount > config.max_stake_amount {
        return Err(ErrorCode::InvalidConfig.into());
    }

    if config.min_locktime > config.max_locktime {
        return Err(ErrorCode::InvalidConfig.into());
    }

    if config.commission > 5000 {
        return Err(ErrorCode::InvalidConfig.into());
    }

    let stake_pool = &mut ctx.accounts.stake_pool;
    stake_pool.authority = ctx.accounts.authority.key();
    stake_pool.nonce = 0;
    stake_pool.stake_token_account = ctx.accounts.stake_token_account.key();
    stake_pool.reward_token_account = ctx.accounts.reward_token_account.key();
    stake_pool.commission_token_account = ctx.accounts.commission_token_account.key();
    stake_pool.total_amount = 0;
    stake_pool.total_share = 0;
    stake_pool.unallocated_staking = 0;
    stake_pool.reserved = 0;
    stake_pool.last_reward_timestamp = 0;
    stake_pool.acc_token_per_share = 0;
    stake_pool.config = StakePoolConfig {
        nft_collection: config.nft_collection,
        stake_token_mint: ctx.accounts.stake_token_mint.key(),
        reward_token_mint: ctx.accounts.reward_token_mint.key(),
        min_stake_amount: config.min_stake_amount,
        max_stake_amount: config.max_stake_amount,
        min_locktime: config.min_locktime,
        max_locktime: config.max_locktime,
        commission: config.commission,
    };

    Ok(())
}
