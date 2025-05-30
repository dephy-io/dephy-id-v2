/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama-idl/codama
 */

import {
  combineCodec,
  getAddressDecoder,
  getAddressEncoder,
  getArrayDecoder,
  getArrayEncoder,
  getOptionDecoder,
  getOptionEncoder,
  getStructDecoder,
  getStructEncoder,
  getTupleDecoder,
  getTupleEncoder,
  type Address,
  type Codec,
  type Decoder,
  type Encoder,
  type Option,
  type OptionOrNullable,
} from '@solana/kit';
import {
  getBaseExtraAccountDecoder,
  getBaseExtraAccountEncoder,
  getBasePluginAuthorityDecoder,
  getBasePluginAuthorityEncoder,
  getBaseValidationResultsOffsetDecoder,
  getBaseValidationResultsOffsetEncoder,
  getExternalCheckResultDecoder,
  getExternalCheckResultEncoder,
  getHookableLifecycleEventDecoder,
  getHookableLifecycleEventEncoder,
  type BaseExtraAccount,
  type BaseExtraAccountArgs,
  type BasePluginAuthority,
  type BasePluginAuthorityArgs,
  type BaseValidationResultsOffset,
  type BaseValidationResultsOffsetArgs,
  type ExternalCheckResult,
  type ExternalCheckResultArgs,
  type HookableLifecycleEvent,
  type HookableLifecycleEventArgs,
} from '.';

export type BaseOracleInitInfo = {
  baseAddress: Address;
  initPluginAuthority: Option<BasePluginAuthority>;
  lifecycleChecks: Array<
    readonly [HookableLifecycleEvent, ExternalCheckResult]
  >;
  baseAddressConfig: Option<BaseExtraAccount>;
  resultsOffset: Option<BaseValidationResultsOffset>;
};

export type BaseOracleInitInfoArgs = {
  baseAddress: Address;
  initPluginAuthority: OptionOrNullable<BasePluginAuthorityArgs>;
  lifecycleChecks: Array<
    readonly [HookableLifecycleEventArgs, ExternalCheckResultArgs]
  >;
  baseAddressConfig: OptionOrNullable<BaseExtraAccountArgs>;
  resultsOffset: OptionOrNullable<BaseValidationResultsOffsetArgs>;
};

export function getBaseOracleInitInfoEncoder(): Encoder<BaseOracleInitInfoArgs> {
  return getStructEncoder([
    ['baseAddress', getAddressEncoder()],
    ['initPluginAuthority', getOptionEncoder(getBasePluginAuthorityEncoder())],
    [
      'lifecycleChecks',
      getArrayEncoder(
        getTupleEncoder([
          getHookableLifecycleEventEncoder(),
          getExternalCheckResultEncoder(),
        ])
      ),
    ],
    ['baseAddressConfig', getOptionEncoder(getBaseExtraAccountEncoder())],
    [
      'resultsOffset',
      getOptionEncoder(getBaseValidationResultsOffsetEncoder()),
    ],
  ]);
}

export function getBaseOracleInitInfoDecoder(): Decoder<BaseOracleInitInfo> {
  return getStructDecoder([
    ['baseAddress', getAddressDecoder()],
    ['initPluginAuthority', getOptionDecoder(getBasePluginAuthorityDecoder())],
    [
      'lifecycleChecks',
      getArrayDecoder(
        getTupleDecoder([
          getHookableLifecycleEventDecoder(),
          getExternalCheckResultDecoder(),
        ])
      ),
    ],
    ['baseAddressConfig', getOptionDecoder(getBaseExtraAccountDecoder())],
    [
      'resultsOffset',
      getOptionDecoder(getBaseValidationResultsOffsetDecoder()),
    ],
  ]);
}

export function getBaseOracleInitInfoCodec(): Codec<
  BaseOracleInitInfoArgs,
  BaseOracleInitInfo
> {
  return combineCodec(
    getBaseOracleInitInfoEncoder(),
    getBaseOracleInitInfoDecoder()
  );
}
