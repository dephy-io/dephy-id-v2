use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct AdminAccount {
    pub authority: Pubkey,
}

#[account]
#[derive(InitSpace)]
pub struct NftStakeAccount {
    pub id: u64,
    pub stake_pool: Pubkey,
    pub stake_authority: Pubkey,
    pub nft_token_account: Pubkey,
    pub token_amount: u64,
}

#[account]
#[derive(InitSpace)]
pub struct StakePoolAccount {
    pub nonce: u64,
    pub authority: Pubkey,
    pub announced_config: Option<Pubkey>,
    pub config: StakePoolConfig,
    pub stake_token_account: Pubkey,
    pub reward_token_account: Pubkey,
    pub commission_token_account: Pubkey,
    pub total_amount: u64,
    pub total_share: u64,
    pub unallocated_staking: u64,
    pub requested_withdrawal: u64,
    pub reserved: u64,
    pub last_reward_timestamp: u64,
    pub acc_token_per_share: u64,
}

// TODO:
// add withdraw penalty?
#[derive(Debug, Clone, InitSpace, AnchorSerialize, AnchorDeserialize)]
pub struct StakePoolConfig {
    pub nft_collection: NftCollection,
    pub stake_token_mint: Pubkey,
    pub reward_token_mint: Pubkey,
    pub min_stake_amount: u64,
    pub max_stake_amount: u64,
    pub min_locktime: u64,
    pub max_locktime: u64,
    pub commission: u64, // 0.01%
}

#[derive(Debug, Clone, InitSpace, AnchorSerialize, AnchorDeserialize)]
pub struct StakePoolInitConfig {
    pub nft_collection: NftCollection,
    pub min_stake_amount: u64,
    pub max_stake_amount: u64,
    pub min_locktime: u64,
    pub max_locktime: u64,
    pub commission: u64, // 0.01%
}

// TODO: use option?
#[derive(Debug, Clone, InitSpace, AnchorSerialize, AnchorDeserialize)]
pub struct StakePoolUpdatableConfig {
    pub min_stake_amount: u64,
    pub max_stake_amount: u64,
    pub min_locktime: u64,
    pub max_locktime: u64,
    pub commission: u64, // 0.01%
}

#[account]
#[derive(InitSpace)]
pub struct AnnouncedConfigAccount {
    pub stake_pool: Pubkey,
    pub authority: Pubkey,
    pub timestamp: u64,
    pub config: StakePoolUpdatableConfig,
}

#[derive(Debug, Clone, InitSpace, AnchorSerialize, AnchorDeserialize)]
pub enum NftCollection {
    MplCore(Pubkey),
    // MplTokenMetadata(Pubkey),
    // SplTokenMetadata(Pubkey)
}

#[account]
#[derive(Debug, InitSpace)]
pub struct UserStakeAccount {
    pub stake_pool: Pubkey,
    pub user: Pubkey,
    pub amount: u64,
    pub share: u64,
    pub locktime: u64,
    pub last_deposit_timestamp: u64,
    pub reward_debt: u64,
    pub acc_reward: u64,
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
