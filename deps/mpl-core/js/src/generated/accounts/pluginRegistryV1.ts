/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama-idl/codama
 */

import {
  assertAccountExists,
  assertAccountsExist,
  combineCodec,
  decodeAccount,
  fetchEncodedAccount,
  fetchEncodedAccounts,
  getArrayDecoder,
  getArrayEncoder,
  getStructDecoder,
  getStructEncoder,
  type Account,
  type Address,
  type Codec,
  type Decoder,
  type EncodedAccount,
  type Encoder,
  type FetchAccountConfig,
  type FetchAccountsConfig,
  type MaybeAccount,
  type MaybeEncodedAccount,
} from '@solana/kit';
import {
  getExternalRegistryRecordDecoder,
  getExternalRegistryRecordEncoder,
  getKeyDecoder,
  getKeyEncoder,
  getRegistryRecordDecoder,
  getRegistryRecordEncoder,
  type ExternalRegistryRecord,
  type ExternalRegistryRecordArgs,
  type Key,
  type KeyArgs,
  type RegistryRecord,
  type RegistryRecordArgs,
} from '../types';

export type PluginRegistryV1 = {
  key: Key;
  registry: Array<RegistryRecord>;
  externalRegistry: Array<ExternalRegistryRecord>;
};

export type PluginRegistryV1Args = {
  key: KeyArgs;
  registry: Array<RegistryRecordArgs>;
  externalRegistry: Array<ExternalRegistryRecordArgs>;
};

export function getPluginRegistryV1Encoder(): Encoder<PluginRegistryV1Args> {
  return getStructEncoder([
    ['key', getKeyEncoder()],
    ['registry', getArrayEncoder(getRegistryRecordEncoder())],
    ['externalRegistry', getArrayEncoder(getExternalRegistryRecordEncoder())],
  ]);
}

export function getPluginRegistryV1Decoder(): Decoder<PluginRegistryV1> {
  return getStructDecoder([
    ['key', getKeyDecoder()],
    ['registry', getArrayDecoder(getRegistryRecordDecoder())],
    ['externalRegistry', getArrayDecoder(getExternalRegistryRecordDecoder())],
  ]);
}

export function getPluginRegistryV1Codec(): Codec<
  PluginRegistryV1Args,
  PluginRegistryV1
> {
  return combineCodec(
    getPluginRegistryV1Encoder(),
    getPluginRegistryV1Decoder()
  );
}

export function decodePluginRegistryV1<TAddress extends string = string>(
  encodedAccount: EncodedAccount<TAddress>
): Account<PluginRegistryV1, TAddress>;
export function decodePluginRegistryV1<TAddress extends string = string>(
  encodedAccount: MaybeEncodedAccount<TAddress>
): MaybeAccount<PluginRegistryV1, TAddress>;
export function decodePluginRegistryV1<TAddress extends string = string>(
  encodedAccount: EncodedAccount<TAddress> | MaybeEncodedAccount<TAddress>
):
  | Account<PluginRegistryV1, TAddress>
  | MaybeAccount<PluginRegistryV1, TAddress> {
  return decodeAccount(
    encodedAccount as MaybeEncodedAccount<TAddress>,
    getPluginRegistryV1Decoder()
  );
}

export async function fetchPluginRegistryV1<TAddress extends string = string>(
  rpc: Parameters<typeof fetchEncodedAccount>[0],
  address: Address<TAddress>,
  config?: FetchAccountConfig
): Promise<Account<PluginRegistryV1, TAddress>> {
  const maybeAccount = await fetchMaybePluginRegistryV1(rpc, address, config);
  assertAccountExists(maybeAccount);
  return maybeAccount;
}

export async function fetchMaybePluginRegistryV1<
  TAddress extends string = string,
>(
  rpc: Parameters<typeof fetchEncodedAccount>[0],
  address: Address<TAddress>,
  config?: FetchAccountConfig
): Promise<MaybeAccount<PluginRegistryV1, TAddress>> {
  const maybeAccount = await fetchEncodedAccount(rpc, address, config);
  return decodePluginRegistryV1(maybeAccount);
}

export async function fetchAllPluginRegistryV1(
  rpc: Parameters<typeof fetchEncodedAccounts>[0],
  addresses: Array<Address>,
  config?: FetchAccountsConfig
): Promise<Account<PluginRegistryV1>[]> {
  const maybeAccounts = await fetchAllMaybePluginRegistryV1(
    rpc,
    addresses,
    config
  );
  assertAccountsExist(maybeAccounts);
  return maybeAccounts;
}

export async function fetchAllMaybePluginRegistryV1(
  rpc: Parameters<typeof fetchEncodedAccounts>[0],
  addresses: Array<Address>,
  config?: FetchAccountsConfig
): Promise<MaybeAccount<PluginRegistryV1>[]> {
  const maybeAccounts = await fetchEncodedAccounts(rpc, addresses, config);
  return maybeAccounts.map((maybeAccount) =>
    decodePluginRegistryV1(maybeAccount)
  );
}
