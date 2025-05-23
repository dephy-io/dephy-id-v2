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
  getAddBlockerDecoder,
  getAddBlockerEncoder,
  getAttributesDecoder,
  getAttributesEncoder,
  getAutographDecoder,
  getAutographEncoder,
  getBaseMasterEditionDecoder,
  getBaseMasterEditionEncoder,
  getBaseRoyaltiesDecoder,
  getBaseRoyaltiesEncoder,
  getBurnDelegateDecoder,
  getBurnDelegateEncoder,
  getEditionDecoder,
  getEditionEncoder,
  getFreezeDelegateDecoder,
  getFreezeDelegateEncoder,
  getImmutableMetadataDecoder,
  getImmutableMetadataEncoder,
  getPermanentBurnDelegateDecoder,
  getPermanentBurnDelegateEncoder,
  getPermanentFreezeDelegateDecoder,
  getPermanentFreezeDelegateEncoder,
  getPermanentTransferDelegateDecoder,
  getPermanentTransferDelegateEncoder,
  getTransferDelegateDecoder,
  getTransferDelegateEncoder,
  getUpdateDelegateDecoder,
  getUpdateDelegateEncoder,
  getVerifiedCreatorsDecoder,
  getVerifiedCreatorsEncoder,
  type AddBlocker,
  type AddBlockerArgs,
  type Attributes,
  type AttributesArgs,
  type Autograph,
  type AutographArgs,
  type BaseMasterEdition,
  type BaseMasterEditionArgs,
  type BaseRoyalties,
  type BaseRoyaltiesArgs,
  type BurnDelegate,
  type BurnDelegateArgs,
  type Edition,
  type EditionArgs,
  type FreezeDelegate,
  type FreezeDelegateArgs,
  type ImmutableMetadata,
  type ImmutableMetadataArgs,
  type PermanentBurnDelegate,
  type PermanentBurnDelegateArgs,
  type PermanentFreezeDelegate,
  type PermanentFreezeDelegateArgs,
  type PermanentTransferDelegate,
  type PermanentTransferDelegateArgs,
  type TransferDelegate,
  type TransferDelegateArgs,
  type UpdateDelegate,
  type UpdateDelegateArgs,
  type VerifiedCreators,
  type VerifiedCreatorsArgs,
} from '.';

export type Plugin =
  | { __kind: 'Royalties'; fields: readonly [BaseRoyalties] }
  | { __kind: 'FreezeDelegate'; fields: readonly [FreezeDelegate] }
  | { __kind: 'BurnDelegate'; fields: readonly [BurnDelegate] }
  | { __kind: 'TransferDelegate'; fields: readonly [TransferDelegate] }
  | { __kind: 'UpdateDelegate'; fields: readonly [UpdateDelegate] }
  | {
      __kind: 'PermanentFreezeDelegate';
      fields: readonly [PermanentFreezeDelegate];
    }
  | { __kind: 'Attributes'; fields: readonly [Attributes] }
  | {
      __kind: 'PermanentTransferDelegate';
      fields: readonly [PermanentTransferDelegate];
    }
  | {
      __kind: 'PermanentBurnDelegate';
      fields: readonly [PermanentBurnDelegate];
    }
  | { __kind: 'Edition'; fields: readonly [Edition] }
  | { __kind: 'MasterEdition'; fields: readonly [BaseMasterEdition] }
  | { __kind: 'AddBlocker'; fields: readonly [AddBlocker] }
  | { __kind: 'ImmutableMetadata'; fields: readonly [ImmutableMetadata] }
  | { __kind: 'VerifiedCreators'; fields: readonly [VerifiedCreators] }
  | { __kind: 'Autograph'; fields: readonly [Autograph] };

export type PluginArgs =
  | { __kind: 'Royalties'; fields: readonly [BaseRoyaltiesArgs] }
  | { __kind: 'FreezeDelegate'; fields: readonly [FreezeDelegateArgs] }
  | { __kind: 'BurnDelegate'; fields: readonly [BurnDelegateArgs] }
  | { __kind: 'TransferDelegate'; fields: readonly [TransferDelegateArgs] }
  | { __kind: 'UpdateDelegate'; fields: readonly [UpdateDelegateArgs] }
  | {
      __kind: 'PermanentFreezeDelegate';
      fields: readonly [PermanentFreezeDelegateArgs];
    }
  | { __kind: 'Attributes'; fields: readonly [AttributesArgs] }
  | {
      __kind: 'PermanentTransferDelegate';
      fields: readonly [PermanentTransferDelegateArgs];
    }
  | {
      __kind: 'PermanentBurnDelegate';
      fields: readonly [PermanentBurnDelegateArgs];
    }
  | { __kind: 'Edition'; fields: readonly [EditionArgs] }
  | { __kind: 'MasterEdition'; fields: readonly [BaseMasterEditionArgs] }
  | { __kind: 'AddBlocker'; fields: readonly [AddBlockerArgs] }
  | { __kind: 'ImmutableMetadata'; fields: readonly [ImmutableMetadataArgs] }
  | { __kind: 'VerifiedCreators'; fields: readonly [VerifiedCreatorsArgs] }
  | { __kind: 'Autograph'; fields: readonly [AutographArgs] };

export function getPluginEncoder(): Encoder<PluginArgs> {
  return getDiscriminatedUnionEncoder([
    [
      'Royalties',
      getStructEncoder([
        ['fields', getTupleEncoder([getBaseRoyaltiesEncoder()])],
      ]),
    ],
    [
      'FreezeDelegate',
      getStructEncoder([
        ['fields', getTupleEncoder([getFreezeDelegateEncoder()])],
      ]),
    ],
    [
      'BurnDelegate',
      getStructEncoder([
        ['fields', getTupleEncoder([getBurnDelegateEncoder()])],
      ]),
    ],
    [
      'TransferDelegate',
      getStructEncoder([
        ['fields', getTupleEncoder([getTransferDelegateEncoder()])],
      ]),
    ],
    [
      'UpdateDelegate',
      getStructEncoder([
        ['fields', getTupleEncoder([getUpdateDelegateEncoder()])],
      ]),
    ],
    [
      'PermanentFreezeDelegate',
      getStructEncoder([
        ['fields', getTupleEncoder([getPermanentFreezeDelegateEncoder()])],
      ]),
    ],
    [
      'Attributes',
      getStructEncoder([['fields', getTupleEncoder([getAttributesEncoder()])]]),
    ],
    [
      'PermanentTransferDelegate',
      getStructEncoder([
        ['fields', getTupleEncoder([getPermanentTransferDelegateEncoder()])],
      ]),
    ],
    [
      'PermanentBurnDelegate',
      getStructEncoder([
        ['fields', getTupleEncoder([getPermanentBurnDelegateEncoder()])],
      ]),
    ],
    [
      'Edition',
      getStructEncoder([['fields', getTupleEncoder([getEditionEncoder()])]]),
    ],
    [
      'MasterEdition',
      getStructEncoder([
        ['fields', getTupleEncoder([getBaseMasterEditionEncoder()])],
      ]),
    ],
    [
      'AddBlocker',
      getStructEncoder([['fields', getTupleEncoder([getAddBlockerEncoder()])]]),
    ],
    [
      'ImmutableMetadata',
      getStructEncoder([
        ['fields', getTupleEncoder([getImmutableMetadataEncoder()])],
      ]),
    ],
    [
      'VerifiedCreators',
      getStructEncoder([
        ['fields', getTupleEncoder([getVerifiedCreatorsEncoder()])],
      ]),
    ],
    [
      'Autograph',
      getStructEncoder([['fields', getTupleEncoder([getAutographEncoder()])]]),
    ],
  ]);
}

export function getPluginDecoder(): Decoder<Plugin> {
  return getDiscriminatedUnionDecoder([
    [
      'Royalties',
      getStructDecoder([
        ['fields', getTupleDecoder([getBaseRoyaltiesDecoder()])],
      ]),
    ],
    [
      'FreezeDelegate',
      getStructDecoder([
        ['fields', getTupleDecoder([getFreezeDelegateDecoder()])],
      ]),
    ],
    [
      'BurnDelegate',
      getStructDecoder([
        ['fields', getTupleDecoder([getBurnDelegateDecoder()])],
      ]),
    ],
    [
      'TransferDelegate',
      getStructDecoder([
        ['fields', getTupleDecoder([getTransferDelegateDecoder()])],
      ]),
    ],
    [
      'UpdateDelegate',
      getStructDecoder([
        ['fields', getTupleDecoder([getUpdateDelegateDecoder()])],
      ]),
    ],
    [
      'PermanentFreezeDelegate',
      getStructDecoder([
        ['fields', getTupleDecoder([getPermanentFreezeDelegateDecoder()])],
      ]),
    ],
    [
      'Attributes',
      getStructDecoder([['fields', getTupleDecoder([getAttributesDecoder()])]]),
    ],
    [
      'PermanentTransferDelegate',
      getStructDecoder([
        ['fields', getTupleDecoder([getPermanentTransferDelegateDecoder()])],
      ]),
    ],
    [
      'PermanentBurnDelegate',
      getStructDecoder([
        ['fields', getTupleDecoder([getPermanentBurnDelegateDecoder()])],
      ]),
    ],
    [
      'Edition',
      getStructDecoder([['fields', getTupleDecoder([getEditionDecoder()])]]),
    ],
    [
      'MasterEdition',
      getStructDecoder([
        ['fields', getTupleDecoder([getBaseMasterEditionDecoder()])],
      ]),
    ],
    [
      'AddBlocker',
      getStructDecoder([['fields', getTupleDecoder([getAddBlockerDecoder()])]]),
    ],
    [
      'ImmutableMetadata',
      getStructDecoder([
        ['fields', getTupleDecoder([getImmutableMetadataDecoder()])],
      ]),
    ],
    [
      'VerifiedCreators',
      getStructDecoder([
        ['fields', getTupleDecoder([getVerifiedCreatorsDecoder()])],
      ]),
    ],
    [
      'Autograph',
      getStructDecoder([['fields', getTupleDecoder([getAutographDecoder()])]]),
    ],
  ]);
}

export function getPluginCodec(): Codec<PluginArgs, Plugin> {
  return combineCodec(getPluginEncoder(), getPluginDecoder());
}

// Data Enum Helpers.
export function plugin(
  kind: 'Royalties',
  data: GetDiscriminatedUnionVariantContent<
    PluginArgs,
    '__kind',
    'Royalties'
  >['fields']
): GetDiscriminatedUnionVariant<PluginArgs, '__kind', 'Royalties'>;
export function plugin(
  kind: 'FreezeDelegate',
  data: GetDiscriminatedUnionVariantContent<
    PluginArgs,
    '__kind',
    'FreezeDelegate'
  >['fields']
): GetDiscriminatedUnionVariant<PluginArgs, '__kind', 'FreezeDelegate'>;
export function plugin(
  kind: 'BurnDelegate',
  data: GetDiscriminatedUnionVariantContent<
    PluginArgs,
    '__kind',
    'BurnDelegate'
  >['fields']
): GetDiscriminatedUnionVariant<PluginArgs, '__kind', 'BurnDelegate'>;
export function plugin(
  kind: 'TransferDelegate',
  data: GetDiscriminatedUnionVariantContent<
    PluginArgs,
    '__kind',
    'TransferDelegate'
  >['fields']
): GetDiscriminatedUnionVariant<PluginArgs, '__kind', 'TransferDelegate'>;
export function plugin(
  kind: 'UpdateDelegate',
  data: GetDiscriminatedUnionVariantContent<
    PluginArgs,
    '__kind',
    'UpdateDelegate'
  >['fields']
): GetDiscriminatedUnionVariant<PluginArgs, '__kind', 'UpdateDelegate'>;
export function plugin(
  kind: 'PermanentFreezeDelegate',
  data: GetDiscriminatedUnionVariantContent<
    PluginArgs,
    '__kind',
    'PermanentFreezeDelegate'
  >['fields']
): GetDiscriminatedUnionVariant<
  PluginArgs,
  '__kind',
  'PermanentFreezeDelegate'
>;
export function plugin(
  kind: 'Attributes',
  data: GetDiscriminatedUnionVariantContent<
    PluginArgs,
    '__kind',
    'Attributes'
  >['fields']
): GetDiscriminatedUnionVariant<PluginArgs, '__kind', 'Attributes'>;
export function plugin(
  kind: 'PermanentTransferDelegate',
  data: GetDiscriminatedUnionVariantContent<
    PluginArgs,
    '__kind',
    'PermanentTransferDelegate'
  >['fields']
): GetDiscriminatedUnionVariant<
  PluginArgs,
  '__kind',
  'PermanentTransferDelegate'
>;
export function plugin(
  kind: 'PermanentBurnDelegate',
  data: GetDiscriminatedUnionVariantContent<
    PluginArgs,
    '__kind',
    'PermanentBurnDelegate'
  >['fields']
): GetDiscriminatedUnionVariant<PluginArgs, '__kind', 'PermanentBurnDelegate'>;
export function plugin(
  kind: 'Edition',
  data: GetDiscriminatedUnionVariantContent<
    PluginArgs,
    '__kind',
    'Edition'
  >['fields']
): GetDiscriminatedUnionVariant<PluginArgs, '__kind', 'Edition'>;
export function plugin(
  kind: 'MasterEdition',
  data: GetDiscriminatedUnionVariantContent<
    PluginArgs,
    '__kind',
    'MasterEdition'
  >['fields']
): GetDiscriminatedUnionVariant<PluginArgs, '__kind', 'MasterEdition'>;
export function plugin(
  kind: 'AddBlocker',
  data: GetDiscriminatedUnionVariantContent<
    PluginArgs,
    '__kind',
    'AddBlocker'
  >['fields']
): GetDiscriminatedUnionVariant<PluginArgs, '__kind', 'AddBlocker'>;
export function plugin(
  kind: 'ImmutableMetadata',
  data: GetDiscriminatedUnionVariantContent<
    PluginArgs,
    '__kind',
    'ImmutableMetadata'
  >['fields']
): GetDiscriminatedUnionVariant<PluginArgs, '__kind', 'ImmutableMetadata'>;
export function plugin(
  kind: 'VerifiedCreators',
  data: GetDiscriminatedUnionVariantContent<
    PluginArgs,
    '__kind',
    'VerifiedCreators'
  >['fields']
): GetDiscriminatedUnionVariant<PluginArgs, '__kind', 'VerifiedCreators'>;
export function plugin(
  kind: 'Autograph',
  data: GetDiscriminatedUnionVariantContent<
    PluginArgs,
    '__kind',
    'Autograph'
  >['fields']
): GetDiscriminatedUnionVariant<PluginArgs, '__kind', 'Autograph'>;
export function plugin<K extends PluginArgs['__kind'], Data>(
  kind: K,
  data?: Data
) {
  return Array.isArray(data)
    ? { __kind: kind, fields: data }
    : { __kind: kind, ...(data ?? {}) };
}

export function isPlugin<K extends Plugin['__kind']>(
  kind: K,
  value: Plugin
): value is Plugin & { __kind: K } {
  return value.__kind === kind;
}
