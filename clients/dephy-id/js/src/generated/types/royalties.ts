/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama-idl/codama
 */

import {
  combineCodec,
  getArrayDecoder,
  getArrayEncoder,
  getStructDecoder,
  getStructEncoder,
  getU16Decoder,
  getU16Encoder,
  type Codec,
  type Decoder,
  type Encoder,
} from '@solana/kit';
import {
  getCreatorDecoder,
  getCreatorEncoder,
  getRuleSetDecoder,
  getRuleSetEncoder,
  type Creator,
  type CreatorArgs,
  type RuleSet,
  type RuleSetArgs,
} from '.';

export type Royalties = {
  basisPoints: number;
  creators: Array<Creator>;
  ruleSet: RuleSet;
};

export type RoyaltiesArgs = {
  basisPoints: number;
  creators: Array<CreatorArgs>;
  ruleSet: RuleSetArgs;
};

export function getRoyaltiesEncoder(): Encoder<RoyaltiesArgs> {
  return getStructEncoder([
    ['basisPoints', getU16Encoder()],
    ['creators', getArrayEncoder(getCreatorEncoder())],
    ['ruleSet', getRuleSetEncoder()],
  ]);
}

export function getRoyaltiesDecoder(): Decoder<Royalties> {
  return getStructDecoder([
    ['basisPoints', getU16Decoder()],
    ['creators', getArrayDecoder(getCreatorDecoder())],
    ['ruleSet', getRuleSetDecoder()],
  ]);
}

export function getRoyaltiesCodec(): Codec<RoyaltiesArgs, Royalties> {
  return combineCodec(getRoyaltiesEncoder(), getRoyaltiesDecoder());
}
