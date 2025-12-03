use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("The provided authority is invalid")]
    InvalidAuthority,
    #[msg("The config is invalid")]
    InvalidConfig,
    #[msg("The stake token is invalid")]
    InvalidStakeToken,
    #[msg("Invalid account")]
    InvalidAccount,
    #[msg("The collection is invalid")]
    InvalidCollection,
    #[msg("Invalid mpl core program")]
    InvalidMplCoreProgram,
    #[msg("Stake not empty")]
    StakeNonEmpty,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Not ready yet")]
    NotReadyYet,
    #[msg("Nft stake is not active")]
    NftStakeNotActive,
    #[msg("Nft stake is active")]
    NftStakeIsActive,
    #[msg("Invalid commision rate")]
    InvalidCommisionRate,
}
