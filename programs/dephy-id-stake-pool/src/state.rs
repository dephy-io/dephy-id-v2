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
    pub deposit_authority: Pubkey,
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
}

#[derive(Debug, Clone, InitSpace, AnchorSerialize, AnchorDeserialize)]
pub struct StakePoolConfig {
    pub collection: Pubkey,
    pub stake_token_mint: Pubkey,
    pub max_stake_amount: u64,
    pub withdraw_pending: u64,
}

#[derive(Debug, Clone, InitSpace, AnchorSerialize, AnchorDeserialize)]
pub struct StakePoolConfigArgs {
    pub max_stake_amount: u64,
    pub withdraw_pending: u64,
}

#[account]
#[derive(InitSpace)]
pub struct AnnouncedConfigAccount {
    pub stake_pool: Pubkey,
    pub authority: Pubkey,
    pub timestamp: u64,
    pub config: StakePoolConfigArgs,
}

#[account]
#[derive(Debug, InitSpace)]
pub struct UserStakeAccount {
    pub stake_pool: Pubkey,
    pub nft_stake: Pubkey,
    pub user: Pubkey,
    pub amount: u64,
    pub last_deposit_timestamp: u64,
    pub requested_withdrawal: u64,
}

#[account]
#[derive(Debug, InitSpace)]
pub struct WithdrawRequestAccount {
    pub stake_pool: Pubkey,
    pub nft_stake: Pubkey,
    pub user: Pubkey,
    pub amount: u64,
    pub timestamp: u64,
}
