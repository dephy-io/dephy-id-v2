use anchor_lang::prelude::Result;

/// x * y / z
pub fn mul_div(x: u64, y: u64, z: u64) -> Result<u64> {
    let result = x as u128 * y as u128 / z as u128;
    if result > u64::MAX as u128 {
        Err(anchor_lang::solana_program::program_error::ProgramError::ArithmeticOverflow.into())
    } else {
        Ok(result as u64)
    }
}
