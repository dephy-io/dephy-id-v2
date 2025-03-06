use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid mpl-core program")]
    InvalidMplCoreProgram,
    #[msg("Product account is not a valid mpl-core collection")]
    InvalidProductAccount,
    #[msg("Product address not match")]
    ProductAddressMismatch,
    #[msg("Transaction expired")]
    TransactionExpired,
}
