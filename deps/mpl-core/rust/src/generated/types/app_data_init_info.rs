//! This code was AUTOGENERATED using the codama library.
//! Please DO NOT EDIT THIS FILE, instead use visitors
//! to add features, then rerun codama to update it.
//!
//! <https://github.com/codama-idl/codama>
//!

use crate::generated::types::ExternalPluginAdapterSchema;
use crate::generated::types::PluginAuthority;
use borsh::BorshDeserialize;
use borsh::BorshSerialize;

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, Eq, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct AppDataInitInfo {
    pub data_authority: PluginAuthority,
    pub init_plugin_authority: Option<PluginAuthority>,
    pub schema: Option<ExternalPluginAdapterSchema>,
}
