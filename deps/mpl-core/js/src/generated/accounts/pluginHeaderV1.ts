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
  getStructDecoder,
  getStructEncoder,
  getU64Decoder,
  getU64Encoder,
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
import { getKeyDecoder, getKeyEncoder, type Key, type KeyArgs } from '../types';

export type PluginHeaderV1 = { key: Key; pluginRegistryOffset: bigint };

export type PluginHeaderV1Args = {
  key: KeyArgs;
  pluginRegistryOffset: number | bigint;
};

export function getPluginHeaderV1Encoder(): Encoder<PluginHeaderV1Args> {
  return getStructEncoder([
    ['key', getKeyEncoder()],
    ['pluginRegistryOffset', getU64Encoder()],
  ]);
}

export function getPluginHeaderV1Decoder(): Decoder<PluginHeaderV1> {
  return getStructDecoder([
    ['key', getKeyDecoder()],
    ['pluginRegistryOffset', getU64Decoder()],
  ]);
}

export function getPluginHeaderV1Codec(): Codec<
  PluginHeaderV1Args,
  PluginHeaderV1
> {
  return combineCodec(getPluginHeaderV1Encoder(), getPluginHeaderV1Decoder());
}

export function decodePluginHeaderV1<TAddress extends string = string>(
  encodedAccount: EncodedAccount<TAddress>
): Account<PluginHeaderV1, TAddress>;
export function decodePluginHeaderV1<TAddress extends string = string>(
  encodedAccount: MaybeEncodedAccount<TAddress>
): MaybeAccount<PluginHeaderV1, TAddress>;
export function decodePluginHeaderV1<TAddress extends string = string>(
  encodedAccount: EncodedAccount<TAddress> | MaybeEncodedAccount<TAddress>
): Account<PluginHeaderV1, TAddress> | MaybeAccount<PluginHeaderV1, TAddress> {
  return decodeAccount(
    encodedAccount as MaybeEncodedAccount<TAddress>,
    getPluginHeaderV1Decoder()
  );
}

export async function fetchPluginHeaderV1<TAddress extends string = string>(
  rpc: Parameters<typeof fetchEncodedAccount>[0],
  address: Address<TAddress>,
  config?: FetchAccountConfig
): Promise<Account<PluginHeaderV1, TAddress>> {
  const maybeAccount = await fetchMaybePluginHeaderV1(rpc, address, config);
  assertAccountExists(maybeAccount);
  return maybeAccount;
}

export async function fetchMaybePluginHeaderV1<
  TAddress extends string = string,
>(
  rpc: Parameters<typeof fetchEncodedAccount>[0],
  address: Address<TAddress>,
  config?: FetchAccountConfig
): Promise<MaybeAccount<PluginHeaderV1, TAddress>> {
  const maybeAccount = await fetchEncodedAccount(rpc, address, config);
  return decodePluginHeaderV1(maybeAccount);
}

export async function fetchAllPluginHeaderV1(
  rpc: Parameters<typeof fetchEncodedAccounts>[0],
  addresses: Array<Address>,
  config?: FetchAccountsConfig
): Promise<Account<PluginHeaderV1>[]> {
  const maybeAccounts = await fetchAllMaybePluginHeaderV1(
    rpc,
    addresses,
    config
  );
  assertAccountsExist(maybeAccounts);
  return maybeAccounts;
}

export async function fetchAllMaybePluginHeaderV1(
  rpc: Parameters<typeof fetchEncodedAccounts>[0],
  addresses: Array<Address>,
  config?: FetchAccountsConfig
): Promise<MaybeAccount<PluginHeaderV1>[]> {
  const maybeAccounts = await fetchEncodedAccounts(rpc, addresses, config);
  return maybeAccounts.map((maybeAccount) =>
    decodePluginHeaderV1(maybeAccount)
  );
}

export function getPluginHeaderV1Size(): number {
  return 9;
}
