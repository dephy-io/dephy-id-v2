//! This code was AUTOGENERATED using the codama library.
//! Please DO NOT EDIT THIS FILE, instead use visitors
//! to add features, then rerun codama to update it.
//!
//! <https://github.com/codama-idl/codama>
//!

use crate::generated::types::ExternalCheckResult;
use crate::generated::types::ExtraAccount;
use crate::generated::types::HookableLifecycleEvent;
use crate::generated::types::PluginAuthority;
use crate::generated::types::ValidationResultsOffset;
use anchor_lang::prelude::AnchorDeserialize;
use anchor_lang::prelude::AnchorSerialize;
use solana_pubkey::Pubkey;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, Eq, PartialEq)]
pub struct OracleInitInfo {
    #[cfg_attr(
        feature = "serde",
        serde(with = "serde_with::As::<serde_with::DisplayFromStr>")
    )]
    pub base_address: Pubkey,
    pub init_plugin_authority: Option<PluginAuthority>,
    pub lifecycle_checks: Vec<(HookableLifecycleEvent, ExternalCheckResult)>,
    pub base_address_config: Option<ExtraAccount>,
    pub results_offset: Option<ValidationResultsOffset>,
}
