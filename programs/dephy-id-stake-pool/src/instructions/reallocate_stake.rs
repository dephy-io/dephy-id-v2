use crate::{
    error::ErrorCode,
    state::{NftStakeAccount, StakePoolAccount},
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ReallocateStake<'info> {
    #[account(mut)]
    pub stake_pool: Box<Account<'info, StakePoolAccount>>,
    #[account(address = stake_pool.authority @ ErrorCode::InvalidAuthority)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub from_stake: Option<Account<'info, NftStakeAccount>>,
    #[account(mut)]
    pub to_stake: Option<Account<'info, NftStakeAccount>>,
}

pub fn process_reallocate_stake(ctx: Context<ReallocateStake>, amount: u64) -> Result<()> {
    msg!("reallocate stake {}", amount);

    let stake_pool = &mut ctx.accounts.stake_pool;

    match (&mut ctx.accounts.from_stake, &mut ctx.accounts.to_stake) {
        (None, None) => {
            return Err(ErrorCode::InvalidAccount.into());
        }
        (None, Some(to_stake)) => {
            // unallocated to stake
            if amount > stake_pool.unallocated_staking {
                return Err(ErrorCode::NotEnoughToken.into());
            }

            if stake_pool.unallocated_staking - amount < stake_pool.reserved {
                return Err(ErrorCode::NotEnoughToken.into());
            }

            stake_pool.unallocated_staking -= amount;
            to_stake.token_amount += amount;
        }
        (Some(from_stake), None) => {
            // stake to unallocated
            if amount > from_stake.token_amount {
                return Err(ErrorCode::NotEnoughToken.into());
            }

            from_stake.token_amount -= amount;
            stake_pool.unallocated_staking += amount;
        }
        (Some(from_stake), Some(to_stake)) => {
            if from_stake.key() == to_stake.key() {
                return Err(ErrorCode::InvalidAccount.into());
            }

            // stake to stake
            if amount > from_stake.token_amount {
                return Err(ErrorCode::NotEnoughToken.into());
            }

            from_stake.token_amount -= amount;
            to_stake.token_amount += amount;
        }
    }

    Ok(())
}
