use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("The provided authority is invalid")]
    InvalidAuthority,
    #[msg("The config is invalid")]
    InvalidConfig,
    #[msg("There is no token staking")]
    NoTokenStaking,
    #[msg("Locktime is invalid")]
    InvalidLocktime,
    #[msg("The tokens are locked")]
    StakeLocked,
    #[msg("The stake token is invalid")]
    InvalidStakeToken,
    #[msg("The reward token is invalid")]
    InvalidRewardToken,
    #[msg("Invalid account")]
    InvalidAccount,
    #[msg("Collection not match")]
    CollectionNotMatch,
    #[msg("Rewards not claimed")]
    RewardsNotClaimed,
    #[msg("Stake not empty")]
    StakeNonEmpty,
    #[msg("Not enough token")]
    NotEnoughToken,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Not ready yet")]
    NotReadyYet,
    #[msg("Should withdraw from reserve")]
    ReserveAvailable,
}
