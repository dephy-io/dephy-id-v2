/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama-idl/codama
 */

import {
  containsBytes,
  fixEncoderSize,
  getBytesEncoder,
  type Address,
  type ReadonlyUint8Array,
} from '@solana/kit';
import {
  type ParsedCreateDeviceInstruction,
  type ParsedCreateProductInstruction,
  type ParsedInitializeInstruction,
} from '../instructions';

export const DEPHY_ID_PROGRAM_ADDRESS =
  'D1DdkvuK3V8kzxD5CSsx7JorEo3hMLw4L7Bvujv3pTD6' as Address<'D1DdkvuK3V8kzxD5CSsx7JorEo3hMLw4L7Bvujv3pTD6'>;

export enum DephyIdAccount {
  DephyAccount,
  ProductAccount,
}

export function identifyDephyIdAccount(
  account: { data: ReadonlyUint8Array } | ReadonlyUint8Array
): DephyIdAccount {
  const data = 'data' in account ? account.data : account;
  if (
    containsBytes(
      data,
      fixEncoderSize(getBytesEncoder(), 8).encode(
        new Uint8Array([138, 216, 55, 116, 51, 4, 249, 98])
      ),
      0
    )
  ) {
    return DephyIdAccount.DephyAccount;
  }
  if (
    containsBytes(
      data,
      fixEncoderSize(getBytesEncoder(), 8).encode(
        new Uint8Array([244, 140, 143, 108, 240, 97, 155, 231])
      ),
      0
    )
  ) {
    return DephyIdAccount.ProductAccount;
  }
  throw new Error(
    'The provided account could not be identified as a dephyId account.'
  );
}

export enum DephyIdInstruction {
  CreateDevice,
  CreateProduct,
  Initialize,
}

export function identifyDephyIdInstruction(
  instruction: { data: ReadonlyUint8Array } | ReadonlyUint8Array
): DephyIdInstruction {
  const data = 'data' in instruction ? instruction.data : instruction;
  if (
    containsBytes(
      data,
      fixEncoderSize(getBytesEncoder(), 8).encode(
        new Uint8Array([56, 101, 5, 177, 25, 113, 80, 174])
      ),
      0
    )
  ) {
    return DephyIdInstruction.CreateDevice;
  }
  if (
    containsBytes(
      data,
      fixEncoderSize(getBytesEncoder(), 8).encode(
        new Uint8Array([183, 155, 202, 119, 43, 114, 174, 225])
      ),
      0
    )
  ) {
    return DephyIdInstruction.CreateProduct;
  }
  if (
    containsBytes(
      data,
      fixEncoderSize(getBytesEncoder(), 8).encode(
        new Uint8Array([175, 175, 109, 31, 13, 152, 155, 237])
      ),
      0
    )
  ) {
    return DephyIdInstruction.Initialize;
  }
  throw new Error(
    'The provided instruction could not be identified as a dephyId instruction.'
  );
}

export type ParsedDephyIdInstruction<
  TProgram extends string = 'D1DdkvuK3V8kzxD5CSsx7JorEo3hMLw4L7Bvujv3pTD6',
> =
  | ({
      instructionType: DephyIdInstruction.CreateDevice;
    } & ParsedCreateDeviceInstruction<TProgram>)
  | ({
      instructionType: DephyIdInstruction.CreateProduct;
    } & ParsedCreateProductInstruction<TProgram>)
  | ({
      instructionType: DephyIdInstruction.Initialize;
    } & ParsedInitializeInstruction<TProgram>);
