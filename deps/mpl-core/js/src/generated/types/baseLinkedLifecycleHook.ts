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
  getExternalPluginAdapterSchemaDecoder,
  getExternalPluginAdapterSchemaEncoder,
  type BaseExtraAccount,
  type BaseExtraAccountArgs,
  type BasePluginAuthority,
  type BasePluginAuthorityArgs,
  type ExternalPluginAdapterSchema,
  type ExternalPluginAdapterSchemaArgs,
} from '.';

export type BaseLinkedLifecycleHook = {
  hookedProgram: Address;
  extraAccounts: Option<Array<BaseExtraAccount>>;
  dataAuthority: Option<BasePluginAuthority>;
  schema: ExternalPluginAdapterSchema;
};

export type BaseLinkedLifecycleHookArgs = {
  hookedProgram: Address;
  extraAccounts: OptionOrNullable<Array<BaseExtraAccountArgs>>;
  dataAuthority: OptionOrNullable<BasePluginAuthorityArgs>;
  schema: ExternalPluginAdapterSchemaArgs;
};

export function getBaseLinkedLifecycleHookEncoder(): Encoder<BaseLinkedLifecycleHookArgs> {
  return getStructEncoder([
    ['hookedProgram', getAddressEncoder()],
    [
      'extraAccounts',
      getOptionEncoder(getArrayEncoder(getBaseExtraAccountEncoder())),
    ],
    ['dataAuthority', getOptionEncoder(getBasePluginAuthorityEncoder())],
    ['schema', getExternalPluginAdapterSchemaEncoder()],
  ]);
}

export function getBaseLinkedLifecycleHookDecoder(): Decoder<BaseLinkedLifecycleHook> {
  return getStructDecoder([
    ['hookedProgram', getAddressDecoder()],
    [
      'extraAccounts',
      getOptionDecoder(getArrayDecoder(getBaseExtraAccountDecoder())),
    ],
    ['dataAuthority', getOptionDecoder(getBasePluginAuthorityDecoder())],
    ['schema', getExternalPluginAdapterSchemaDecoder()],
  ]);
}

export function getBaseLinkedLifecycleHookCodec(): Codec<
  BaseLinkedLifecycleHookArgs,
  BaseLinkedLifecycleHook
> {
  return combineCodec(
    getBaseLinkedLifecycleHookEncoder(),
    getBaseLinkedLifecycleHookDecoder()
  );
}
