//! This code was AUTOGENERATED using the codama library.
//! Please DO NOT EDIT THIS FILE, instead use visitors
//! to add features, then rerun codama to update it.
//!
//! <https://github.com/codama-idl/codama>
//!

use anchor_lang::prelude::AnchorDeserialize;
use anchor_lang::prelude::AnchorSerialize;
use solana_pubkey::Pubkey;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, Eq, PartialEq)]
pub enum PluginAuthority {
    None,
    Owner,
    UpdateAuthority,
    Address {
        #[cfg_attr(
            feature = "serde",
            serde(with = "serde_with::As::<serde_with::DisplayFromStr>")
        )]
        address: Pubkey,
    },
}
