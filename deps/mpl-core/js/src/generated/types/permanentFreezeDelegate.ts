/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama-idl/codama
 */

import {
  combineCodec,
  getBooleanDecoder,
  getBooleanEncoder,
  getStructDecoder,
  getStructEncoder,
  type Codec,
  type Decoder,
  type Encoder,
} from '@solana/kit';

export type PermanentFreezeDelegate = { frozen: boolean };

export type PermanentFreezeDelegateArgs = PermanentFreezeDelegate;

export function getPermanentFreezeDelegateEncoder(): Encoder<PermanentFreezeDelegateArgs> {
  return getStructEncoder([['frozen', getBooleanEncoder()]]);
}

export function getPermanentFreezeDelegateDecoder(): Decoder<PermanentFreezeDelegate> {
  return getStructDecoder([['frozen', getBooleanDecoder()]]);
}

export function getPermanentFreezeDelegateCodec(): Codec<
  PermanentFreezeDelegateArgs,
  PermanentFreezeDelegate
> {
  return combineCodec(
    getPermanentFreezeDelegateEncoder(),
    getPermanentFreezeDelegateDecoder()
  );
}
