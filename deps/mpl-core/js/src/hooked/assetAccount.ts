import {
  Account, Address, assertAccountExists, createDecoder, decodeAccount, Decoder,
  EncodedAccount, FetchAccountConfig, fetchEncodedAccount, MaybeAccount, MaybeEncodedAccount
} from "@solana/kit";

import {
  AssetV1, BaseUpdateAuthority, getAssetV1Decoder,
  getPluginHeaderV1Decoder, getPluginRegistryV1Decoder, PluginRegistryV1
} from "../generated";
import {
  AssetPluginsList, ExternalPluginAdaptersList,
  externalRegistryRecordsToExternalPluginAdapterList, registryRecordsToPluginsList
} from "./plugins";

export type UpdateAuthorityType = BaseUpdateAuthority['__kind'];

export type UpdateAuthority = {
  address?: Address;
  type: UpdateAuthorityType;
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
      let pluginRegistry: PluginRegistryV1
      let externalPlugins: ExternalPluginAdaptersList = {};

      if (bytes.length !== assetOffset) {
        const pluginHeader = getPluginHeaderV1Decoder().decode(bytes, assetOffset);
        [pluginRegistry, finalOffset] = getPluginRegistryV1Decoder().read(bytes, Number(pluginHeader.pluginRegistryOffset));

        plugins = registryRecordsToPluginsList(pluginRegistry.registry, bytes);

        externalPlugins = externalRegistryRecordsToExternalPluginAdapterList(pluginRegistry.externalRegistry, bytes);
      }

      const updateAuthority = {
        address:
          base.updateAuthority.__kind === 'None'
            ? undefined
            : base.updateAuthority.fields[0],
        type: base.updateAuthority.__kind,
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

export function decodeAssetAccount<TAddress extends string = string>(
  encodedAccount: EncodedAccount<TAddress>
): Account<AssetAccount, TAddress>;
export function decodeAssetAccount<TAddress extends string = string>(
  encodedAccount: MaybeEncodedAccount<TAddress>
): MaybeAccount<AssetAccount, TAddress>;
export function decodeAssetAccount<TAddress extends string = string>(
  encodedAccount: EncodedAccount<TAddress> | MaybeEncodedAccount<TAddress>
): Account<AssetAccount, TAddress> | MaybeAccount<AssetAccount, TAddress> {
  return decodeAccount(
    encodedAccount as MaybeEncodedAccount<TAddress>,
    getAssetAccountDecoder()
  );
}

export async function fetchAssetAccount<TAddress extends string = string>(
  rpc: Parameters<typeof fetchEncodedAccount>[0],
  address: Address<TAddress>,
  config?: FetchAccountConfig
): Promise<Account<AssetAccount, TAddress>> {
  const maybeAccount = await fetchMaybeAssetAccount(rpc, address, config);
  assertAccountExists(maybeAccount);
  return maybeAccount;
}

export async function fetchMaybeAssetAccount<TAddress extends string = string>(
  rpc: Parameters<typeof fetchEncodedAccount>[0],
  address: Address<TAddress>,
  config?: FetchAccountConfig
): Promise<MaybeAccount<AssetAccount, TAddress>> {
  const maybeAccount = await fetchEncodedAccount(rpc, address, config);
  return decodeAssetAccount(maybeAccount);
}
