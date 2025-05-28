use anchor_lang::prelude::constant;

#[constant]
pub const WITHDRAW_REQUEST_PREPARE_TIME: u64 = 60 * 60 * 24 * 21; // 21 days

#[constant]
pub const CONFIG_REVIEW_TIME: u64 = 60 * 60 * 24 * 3; // 3 days

#[constant]
pub const POOL_WALLET_SEED: &[u8] = b"POOL_WALLET";

#[constant]
pub const STAKE_TOKEN_SEED: &[u8] = b"STAKE_TOKEN";

#[constant]
pub const USER_STAKE_SEED: &[u8] = b"USER_STAKE";
