use anchor_lang::prelude::constant;

#[constant]
pub const PRECISION_FACTOR: u64 = 1_000_000_000;

#[constant]
pub const WITHDRAW_REQUEST_PREPARE_TIME: u64 = 60 * 60 * 24 * 21; // 21 days

#[constant]
pub const CONFIG_REVIEW_TIME: u64 = 60 * 60 * 24 * 3; // 3 days
