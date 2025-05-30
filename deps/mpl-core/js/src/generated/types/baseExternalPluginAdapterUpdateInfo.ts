/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama-idl/codama
 */

import {
  combineCodec,
  getDiscriminatedUnionDecoder,
  getDiscriminatedUnionEncoder,
  getStructDecoder,
  getStructEncoder,
  getTupleDecoder,
  getTupleEncoder,
  type Codec,
  type Decoder,
  type Encoder,
  type GetDiscriminatedUnionVariant,
  type GetDiscriminatedUnionVariantContent,
} from '@solana/kit';
import {
  getBaseAppDataUpdateInfoDecoder,
  getBaseAppDataUpdateInfoEncoder,
  getBaseLifecycleHookUpdateInfoDecoder,
  getBaseLifecycleHookUpdateInfoEncoder,
  getBaseLinkedAppDataUpdateInfoDecoder,
  getBaseLinkedAppDataUpdateInfoEncoder,
  getBaseLinkedLifecycleHookUpdateInfoDecoder,
  getBaseLinkedLifecycleHookUpdateInfoEncoder,
  getBaseOracleUpdateInfoDecoder,
  getBaseOracleUpdateInfoEncoder,
  type BaseAppDataUpdateInfo,
  type BaseAppDataUpdateInfoArgs,
  type BaseLifecycleHookUpdateInfo,
  type BaseLifecycleHookUpdateInfoArgs,
  type BaseLinkedAppDataUpdateInfo,
  type BaseLinkedAppDataUpdateInfoArgs,
  type BaseLinkedLifecycleHookUpdateInfo,
  type BaseLinkedLifecycleHookUpdateInfoArgs,
  type BaseOracleUpdateInfo,
  type BaseOracleUpdateInfoArgs,
} from '.';

export type BaseExternalPluginAdapterUpdateInfo =
  | { __kind: 'LifecycleHook'; fields: readonly [BaseLifecycleHookUpdateInfo] }
  | { __kind: 'Oracle'; fields: readonly [BaseOracleUpdateInfo] }
  | { __kind: 'AppData'; fields: readonly [BaseAppDataUpdateInfo] }
  | {
      __kind: 'LinkedLifecycleHook';
      fields: readonly [BaseLinkedLifecycleHookUpdateInfo];
    }
  | { __kind: 'LinkedAppData'; fields: readonly [BaseLinkedAppDataUpdateInfo] };

export type BaseExternalPluginAdapterUpdateInfoArgs =
  | {
      __kind: 'LifecycleHook';
      fields: readonly [BaseLifecycleHookUpdateInfoArgs];
    }
  | { __kind: 'Oracle'; fields: readonly [BaseOracleUpdateInfoArgs] }
  | { __kind: 'AppData'; fields: readonly [BaseAppDataUpdateInfoArgs] }
  | {
      __kind: 'LinkedLifecycleHook';
      fields: readonly [BaseLinkedLifecycleHookUpdateInfoArgs];
    }
  | {
      __kind: 'LinkedAppData';
      fields: readonly [BaseLinkedAppDataUpdateInfoArgs];
    };

export function getBaseExternalPluginAdapterUpdateInfoEncoder(): Encoder<BaseExternalPluginAdapterUpdateInfoArgs> {
  return getDiscriminatedUnionEncoder([
    [
      'LifecycleHook',
      getStructEncoder([
        ['fields', getTupleEncoder([getBaseLifecycleHookUpdateInfoEncoder()])],
      ]),
    ],
    [
      'Oracle',
      getStructEncoder([
        ['fields', getTupleEncoder([getBaseOracleUpdateInfoEncoder()])],
      ]),
    ],
    [
      'AppData',
      getStructEncoder([
        ['fields', getTupleEncoder([getBaseAppDataUpdateInfoEncoder()])],
      ]),
    ],
    [
      'LinkedLifecycleHook',
      getStructEncoder([
        [
          'fields',
          getTupleEncoder([getBaseLinkedLifecycleHookUpdateInfoEncoder()]),
        ],
      ]),
    ],
    [
      'LinkedAppData',
      getStructEncoder([
        ['fields', getTupleEncoder([getBaseLinkedAppDataUpdateInfoEncoder()])],
      ]),
    ],
  ]);
}

export function getBaseExternalPluginAdapterUpdateInfoDecoder(): Decoder<BaseExternalPluginAdapterUpdateInfo> {
  return getDiscriminatedUnionDecoder([
    [
      'LifecycleHook',
      getStructDecoder([
        ['fields', getTupleDecoder([getBaseLifecycleHookUpdateInfoDecoder()])],
      ]),
    ],
    [
      'Oracle',
      getStructDecoder([
        ['fields', getTupleDecoder([getBaseOracleUpdateInfoDecoder()])],
      ]),
    ],
    [
      'AppData',
      getStructDecoder([
        ['fields', getTupleDecoder([getBaseAppDataUpdateInfoDecoder()])],
      ]),
    ],
    [
      'LinkedLifecycleHook',
      getStructDecoder([
        [
          'fields',
          getTupleDecoder([getBaseLinkedLifecycleHookUpdateInfoDecoder()]),
        ],
      ]),
    ],
    [
      'LinkedAppData',
      getStructDecoder([
        ['fields', getTupleDecoder([getBaseLinkedAppDataUpdateInfoDecoder()])],
      ]),
    ],
  ]);
}

export function getBaseExternalPluginAdapterUpdateInfoCodec(): Codec<
  BaseExternalPluginAdapterUpdateInfoArgs,
  BaseExternalPluginAdapterUpdateInfo
> {
  return combineCodec(
    getBaseExternalPluginAdapterUpdateInfoEncoder(),
    getBaseExternalPluginAdapterUpdateInfoDecoder()
  );
}

// Data Enum Helpers.
export function baseExternalPluginAdapterUpdateInfo(
  kind: 'LifecycleHook',
  data: GetDiscriminatedUnionVariantContent<
    BaseExternalPluginAdapterUpdateInfoArgs,
    '__kind',
    'LifecycleHook'
  >['fields']
): GetDiscriminatedUnionVariant<
  BaseExternalPluginAdapterUpdateInfoArgs,
  '__kind',
  'LifecycleHook'
>;
export function baseExternalPluginAdapterUpdateInfo(
  kind: 'Oracle',
  data: GetDiscriminatedUnionVariantContent<
    BaseExternalPluginAdapterUpdateInfoArgs,
    '__kind',
    'Oracle'
  >['fields']
): GetDiscriminatedUnionVariant<
  BaseExternalPluginAdapterUpdateInfoArgs,
  '__kind',
  'Oracle'
>;
export function baseExternalPluginAdapterUpdateInfo(
  kind: 'AppData',
  data: GetDiscriminatedUnionVariantContent<
    BaseExternalPluginAdapterUpdateInfoArgs,
    '__kind',
    'AppData'
  >['fields']
): GetDiscriminatedUnionVariant<
  BaseExternalPluginAdapterUpdateInfoArgs,
  '__kind',
  'AppData'
>;
export function baseExternalPluginAdapterUpdateInfo(
  kind: 'LinkedLifecycleHook',
  data: GetDiscriminatedUnionVariantContent<
    BaseExternalPluginAdapterUpdateInfoArgs,
    '__kind',
    'LinkedLifecycleHook'
  >['fields']
): GetDiscriminatedUnionVariant<
  BaseExternalPluginAdapterUpdateInfoArgs,
  '__kind',
  'LinkedLifecycleHook'
>;
export function baseExternalPluginAdapterUpdateInfo(
  kind: 'LinkedAppData',
  data: GetDiscriminatedUnionVariantContent<
    BaseExternalPluginAdapterUpdateInfoArgs,
    '__kind',
    'LinkedAppData'
  >['fields']
): GetDiscriminatedUnionVariant<
  BaseExternalPluginAdapterUpdateInfoArgs,
  '__kind',
  'LinkedAppData'
>;
export function baseExternalPluginAdapterUpdateInfo<
  K extends BaseExternalPluginAdapterUpdateInfoArgs['__kind'],
  Data,
>(kind: K, data?: Data) {
  return Array.isArray(data)
    ? { __kind: kind, fields: data }
    : { __kind: kind, ...(data ?? {}) };
}

export function isBaseExternalPluginAdapterUpdateInfo<
  K extends BaseExternalPluginAdapterUpdateInfo['__kind'],
>(
  kind: K,
  value: BaseExternalPluginAdapterUpdateInfo
): value is BaseExternalPluginAdapterUpdateInfo & { __kind: K } {
  return value.__kind === kind;
}
