use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct AdminAccount {
    pub authority: Pubkey,
}

#[account]
#[derive(InitSpace)]
pub struct NftStakeAccount {
    pub stake_pool: Pubkey,
    pub stake_authority: Pubkey,
    pub nft_token_account: Pubkey,
    pub token_amount: u64,
}

#[account]
#[derive(InitSpace)]
pub struct StakePoolAccount {
    pub authority: Pubkey,
    pub announced_config: Option<Pubkey>,
    pub config: StakePoolConfig,
    pub stake_token_account: Pubkey,
    pub total_staking: u64,
    pub requested_withdrawal: u64,
    pub reserved: u64,
}

#[derive(Debug, Clone, InitSpace, AnchorSerialize, AnchorDeserialize)]
pub struct StakePoolConfig {
    pub collection: Pubkey,
    pub stake_token_mint: Pubkey,
    pub min_stake_amount: u64,
    pub max_stake_amount: u64,
    pub min_locktime: u64,
    pub max_locktime: u64,
}

#[derive(Debug, Clone, InitSpace, AnchorSerialize, AnchorDeserialize)]
pub struct StakePoolInitConfig {
    pub collection: Pubkey,
    pub min_stake_amount: u64,
    pub max_stake_amount: u64,
    pub min_locktime: u64,
    pub max_locktime: u64,
}

// TODO: use option?
#[derive(Debug, Clone, InitSpace, AnchorSerialize, AnchorDeserialize)]
pub struct StakePoolUpdatableConfig {
    pub min_stake_amount: u64,
    pub max_stake_amount: u64,
    pub min_locktime: u64,
    pub max_locktime: u64,
}

#[account]
#[derive(InitSpace)]
pub struct AnnouncedConfigAccount {
    pub stake_pool: Pubkey,
    pub authority: Pubkey,
    pub timestamp: u64,
    pub config: StakePoolUpdatableConfig,
}

#[account]
#[derive(Debug, InitSpace)]
pub struct UserStakeAccount {
    pub stake_pool: Pubkey,
    pub nft_stake: Pubkey,
    pub user: Pubkey,
    pub amount: u64,
    pub locktime: u64,
    pub last_deposit_timestamp: u64,
}

#[account]
#[derive(Debug, InitSpace)]
pub struct WithdrawRequestAccount {
    pub stake_pool: Pubkey,
    pub user: Pubkey,
    pub amount: u64,
    pub timestamp: u64,
    pub approved: bool,
}
