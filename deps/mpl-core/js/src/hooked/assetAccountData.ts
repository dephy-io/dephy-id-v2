import { Address, createDecoder, Decoder } from "@solana/kit";
import { AssetV1, BaseUpdateAuthority, getAssetV1Decoder, getPluginHeaderV1Decoder, getPluginRegistryV1Decoder } from "../generated";
import {
  AssetPluginsList, ExternalPluginAdaptersList,
  externalRegistryRecordsToExternalPluginAdapterList, registryRecordsToPluginsList
} from "./plugins";

export type UpdateAuthorityType = BaseUpdateAuthority['__kind'];

export type UpdateAuthority = {
  type: UpdateAuthorityType;
  address?: Address;
};

export type AssetAccountData = Omit<AssetV1, 'updateAuthority'> & {
  updateAuthority: UpdateAuthority;
};

export type AssetAccount = {
  base: AssetAccountData,
  plugins: AssetPluginsList & ExternalPluginAdaptersList,
};

export function getAssetAccountDecoder(): Decoder<AssetAccount> {
  return createDecoder({
    read: (bytes: Uint8Array, offset: number) => {
      const [base, assetOffset] = getAssetV1Decoder().read(bytes, offset)
      let finalOffset = assetOffset
      let plugins: AssetPluginsList = {};
      let externalPlugins: ExternalPluginAdaptersList = {};

      if (bytes.length !== assetOffset) {
        const pluginHeader = getPluginHeaderV1Decoder().decode(bytes, assetOffset)
        const [pluginRegistry, finalOffset] = getPluginRegistryV1Decoder().read(bytes, Number(pluginHeader.pluginRegistryOffset))

        plugins = registryRecordsToPluginsList(pluginRegistry.registry, bytes);

        externalPlugins = externalRegistryRecordsToExternalPluginAdapterList(pluginRegistry.externalRegistry, bytes);
      }

      const updateAuthority = {
        type: base.updateAuthority.__kind,
        address:
          base.updateAuthority.__kind === 'None'
            ? undefined
            : base.updateAuthority.fields[0],
      };

      const account = {
        base: {
          ...base,
          updateAuthority,
        },
        plugins: {
          ...plugins,
          ...externalPlugins
        },
      }

      return [account, finalOffset]
    }
  })
}
