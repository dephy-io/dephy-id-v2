import {
  Account, Address, assertAccountExists, createDecoder, decodeAccount, Decoder,
  EncodedAccount, FetchAccountConfig, fetchEncodedAccount, MaybeAccount, MaybeEncodedAccount
} from "@solana/kit"

import {
  CollectionV1, getCollectionV1Decoder,
  getPluginHeaderV1Decoder, getPluginRegistryV1Decoder, PluginRegistryV1,
} from "../generated"
import {
  CollectionPluginsList, ExternalPluginAdaptersList,
  externalRegistryRecordsToExternalPluginAdapterList, registryRecordsToPluginsList,
} from "./plugins"


export type CollectionAccount = {
  base: CollectionV1,
  plugins: CollectionPluginsList & ExternalPluginAdaptersList
}

export function getCollectionAccountDecoder(): Decoder<CollectionAccount> {
  return createDecoder({
    read: (bytes: Uint8Array, offset: number) => {
      const [base, assetOffset] = getCollectionV1Decoder().read(bytes, offset)
      let finalOffset = assetOffset
      let plugins: CollectionPluginsList = {};
      let pluginRegistry: PluginRegistryV1
      let externalPlugins: ExternalPluginAdaptersList = {};

      if (bytes.length !== assetOffset) {
        const pluginHeader = getPluginHeaderV1Decoder().decode(bytes, assetOffset);
        [pluginRegistry, finalOffset] = getPluginRegistryV1Decoder().read(bytes, Number(pluginHeader.pluginRegistryOffset));

        plugins = registryRecordsToPluginsList(pluginRegistry.registry, bytes);

        externalPlugins = externalRegistryRecordsToExternalPluginAdapterList(pluginRegistry.externalRegistry, bytes);
      }

      const account = {
        base,
        plugins: {
          ...plugins,
          ...externalPlugins
        }
      }

      return [account, finalOffset]
    }
  })
}

export function decodeCollectionAccount<TAddress extends string = string>(
  encodedAccount: EncodedAccount<TAddress>
): Account<CollectionAccount, TAddress>;
export function decodeCollectionAccount<TAddress extends string = string>(
  encodedAccount: MaybeEncodedAccount<TAddress>
): MaybeAccount<CollectionAccount, TAddress>;
export function decodeCollectionAccount<TAddress extends string = string>(
  encodedAccount: EncodedAccount<TAddress> | MaybeEncodedAccount<TAddress>
): Account<CollectionAccount, TAddress> | MaybeAccount<CollectionAccount, TAddress> {
  return decodeAccount(
    encodedAccount as MaybeEncodedAccount<TAddress>,
    getCollectionAccountDecoder()
  );
}

export async function fetchCollectionAccount<TAddress extends string = string>(
  rpc: Parameters<typeof fetchEncodedAccount>[0],
  address: Address<TAddress>,
  config?: FetchAccountConfig
): Promise<Account<CollectionAccount, TAddress>> {
  const maybeAccount = await fetchMaybeCollectionAccount(rpc, address, config);
  assertAccountExists(maybeAccount);
  return maybeAccount;
}

export async function fetchMaybeCollectionAccount<TAddress extends string = string>(
  rpc: Parameters<typeof fetchEncodedAccount>[0],
  address: Address<TAddress>,
  config?: FetchAccountConfig
): Promise<MaybeAccount<CollectionAccount, TAddress>> {
  const maybeAccount = await fetchEncodedAccount(rpc, address, config);
  return decodeCollectionAccount(maybeAccount);
}
