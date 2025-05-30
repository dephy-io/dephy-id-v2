/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama-idl/codama
 */

import {
  combineCodec,
  getEnumDecoder,
  getEnumEncoder,
  type Codec,
  type Decoder,
  type Encoder,
} from '@solana/kit';

export enum DataState {
  AccountState,
  LedgerState,
}

export type DataStateArgs = DataState;

export function getDataStateEncoder(): Encoder<DataStateArgs> {
  return getEnumEncoder(DataState);
}

export function getDataStateDecoder(): Decoder<DataState> {
  return getEnumDecoder(DataState);
}

export function getDataStateCodec(): Codec<DataStateArgs, DataState> {
  return combineCodec(getDataStateEncoder(), getDataStateDecoder());
}
