use crate::{
    accounts::{BaseAssetV1, PluginHeaderV1},
    registry_records_to_external_plugin_adapter_list, registry_records_to_plugin_list, Asset,
    ExternalPluginAdaptersList, PluginRegistryV1Safe, PluginsList,
};

impl Asset {
    pub fn deserialize(data: &[u8]) -> Result<Box<Self>, std::io::Error> {
        let base = BaseAssetV1::from_bytes(data)?;
        let base_data = borsh::to_vec(&base)?;

        if base_data.len() != data.len() {
            return Self::deserialize_with_plugins(data, base, base_data);
        }

        Ok(Box::new(Self {
            base,
            plugin_list: PluginsList::default(),
            external_plugin_adapter_list: ExternalPluginAdaptersList::default(),
            plugin_header: None,
        }))
    }

    fn deserialize_with_plugins(
        data: &[u8],
        base: BaseAssetV1,
        base_data: Vec<u8>,
    ) -> Result<Box<Self>, std::io::Error> {
        let plugin_header = PluginHeaderV1::from_bytes(&data[base_data.len()..])?;
        let plugin_registry = PluginRegistryV1Safe::from_bytes(
            &data[plugin_header.plugin_registry_offset as usize..],
        )?;

        let plugin_list = registry_records_to_plugin_list(&plugin_registry.registry, data)?;
        let external_plugin_adapter_list = registry_records_to_external_plugin_adapter_list(
            &plugin_registry.external_registry,
            data,
        )?;

        Ok(Box::new(Self {
            base,
            plugin_list,
            external_plugin_adapter_list,
            plugin_header: Some(plugin_header),
        }))
    }

    #[inline(always)]
    pub fn from_bytes(data: &[u8]) -> Result<Box<Self>, std::io::Error> {
        Self::deserialize(data)
    }
}

impl<'a> TryFrom<&solana_program::account_info::AccountInfo<'a>> for Box<Asset> {
    type Error = std::io::Error;

    fn try_from(
        account_info: &solana_program::account_info::AccountInfo<'a>,
    ) -> Result<Self, Self::Error> {
        let data: &[u8] = &(*account_info.data).borrow();
        Asset::deserialize(data)
    }
}
