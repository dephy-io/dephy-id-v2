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
  type ParsedAnnounceUpdateConfigInstruction,
  type ParsedCancelUpdateConfigInstruction,
  type ParsedCloseNftStakeInstruction,
  type ParsedConfirmUpdateConfigInstruction,
  type ParsedCreateNftStakeInstruction,
  type ParsedCreateStakePoolInstruction,
  type ParsedDepositTokenInstruction,
  type ParsedInitializeInstruction,
  type ParsedUnstakeNftInstruction,
  type ParsedWithdrawInstruction,
} from '../instructions';

export const DEPHY_ID_STAKE_POOL_PROGRAM_ADDRESS =
  'DSTKMXnJXgvViSkr6hciBaYsTpcduxZuF334WLrvEZmW' as Address<'DSTKMXnJXgvViSkr6hciBaYsTpcduxZuF334WLrvEZmW'>;

export enum DephyIdStakePoolAccount {
  AdminAccount,
  AnnouncedConfigAccount,
  NftStakeAccount,
  StakePoolAccount,
  UserStakeAccount,
}

export function identifyDephyIdStakePoolAccount(
  account: { data: ReadonlyUint8Array } | ReadonlyUint8Array
): DephyIdStakePoolAccount {
  const data = 'data' in account ? account.data : account;
  if (
    containsBytes(
      data,
      fixEncoderSize(getBytesEncoder(), 8).encode(
        new Uint8Array([153, 119, 180, 178, 43, 66, 235, 148])
      ),
      0
    )
  ) {
    return DephyIdStakePoolAccount.AdminAccount;
  }
  if (
    containsBytes(
      data,
      fixEncoderSize(getBytesEncoder(), 8).encode(
        new Uint8Array([56, 17, 67, 145, 200, 140, 137, 226])
      ),
      0
    )
  ) {
    return DephyIdStakePoolAccount.AnnouncedConfigAccount;
  }
  if (
    containsBytes(
      data,
      fixEncoderSize(getBytesEncoder(), 8).encode(
        new Uint8Array([109, 22, 236, 62, 96, 242, 14, 116])
      ),
      0
    )
  ) {
    return DephyIdStakePoolAccount.NftStakeAccount;
  }
  if (
    containsBytes(
      data,
      fixEncoderSize(getBytesEncoder(), 8).encode(
        new Uint8Array([87, 244, 250, 124, 34, 252, 189, 44])
      ),
      0
    )
  ) {
    return DephyIdStakePoolAccount.StakePoolAccount;
  }
  if (
    containsBytes(
      data,
      fixEncoderSize(getBytesEncoder(), 8).encode(
        new Uint8Array([167, 87, 153, 81, 129, 95, 15, 213])
      ),
      0
    )
  ) {
    return DephyIdStakePoolAccount.UserStakeAccount;
  }
  throw new Error(
    'The provided account could not be identified as a dephyIdStakePool account.'
  );
}

export enum DephyIdStakePoolInstruction {
  AnnounceUpdateConfig,
  CancelUpdateConfig,
  CloseNftStake,
  ConfirmUpdateConfig,
  CreateNftStake,
  CreateStakePool,
  DepositToken,
  Initialize,
  UnstakeNft,
  Withdraw,
}

export function identifyDephyIdStakePoolInstruction(
  instruction: { data: ReadonlyUint8Array } | ReadonlyUint8Array
): DephyIdStakePoolInstruction {
  const data = 'data' in instruction ? instruction.data : instruction;
  if (
    containsBytes(
      data,
      fixEncoderSize(getBytesEncoder(), 8).encode(
        new Uint8Array([25, 72, 63, 45, 123, 42, 124, 197])
      ),
      0
    )
  ) {
    return DephyIdStakePoolInstruction.AnnounceUpdateConfig;
  }
  if (
    containsBytes(
      data,
      fixEncoderSize(getBytesEncoder(), 8).encode(
        new Uint8Array([235, 155, 243, 161, 6, 145, 121, 173])
      ),
      0
    )
  ) {
    return DephyIdStakePoolInstruction.CancelUpdateConfig;
  }
  if (
    containsBytes(
      data,
      fixEncoderSize(getBytesEncoder(), 8).encode(
        new Uint8Array([254, 163, 164, 157, 253, 253, 83, 23])
      ),
      0
    )
  ) {
    return DephyIdStakePoolInstruction.CloseNftStake;
  }
  if (
    containsBytes(
      data,
      fixEncoderSize(getBytesEncoder(), 8).encode(
        new Uint8Array([25, 58, 1, 51, 3, 105, 99, 234])
      ),
      0
    )
  ) {
    return DephyIdStakePoolInstruction.ConfirmUpdateConfig;
  }
  if (
    containsBytes(
      data,
      fixEncoderSize(getBytesEncoder(), 8).encode(
        new Uint8Array([107, 143, 248, 220, 223, 135, 171, 100])
      ),
      0
    )
  ) {
    return DephyIdStakePoolInstruction.CreateNftStake;
  }
  if (
    containsBytes(
      data,
      fixEncoderSize(getBytesEncoder(), 8).encode(
        new Uint8Array([198, 175, 88, 63, 128, 43, 8, 214])
      ),
      0
    )
  ) {
    return DephyIdStakePoolInstruction.CreateStakePool;
  }
  if (
    containsBytes(
      data,
      fixEncoderSize(getBytesEncoder(), 8).encode(
        new Uint8Array([11, 156, 96, 218, 39, 163, 180, 19])
      ),
      0
    )
  ) {
    return DephyIdStakePoolInstruction.DepositToken;
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
    return DephyIdStakePoolInstruction.Initialize;
  }
  if (
    containsBytes(
      data,
      fixEncoderSize(getBytesEncoder(), 8).encode(
        new Uint8Array([17, 182, 24, 211, 101, 138, 50, 163])
      ),
      0
    )
  ) {
    return DephyIdStakePoolInstruction.UnstakeNft;
  }
  if (
    containsBytes(
      data,
      fixEncoderSize(getBytesEncoder(), 8).encode(
        new Uint8Array([183, 18, 70, 156, 148, 109, 161, 34])
      ),
      0
    )
  ) {
    return DephyIdStakePoolInstruction.Withdraw;
  }
  throw new Error(
    'The provided instruction could not be identified as a dephyIdStakePool instruction.'
  );
}

export type ParsedDephyIdStakePoolInstruction<
  TProgram extends string = 'DSTKMXnJXgvViSkr6hciBaYsTpcduxZuF334WLrvEZmW',
> =
  | ({
      instructionType: DephyIdStakePoolInstruction.AnnounceUpdateConfig;
    } & ParsedAnnounceUpdateConfigInstruction<TProgram>)
  | ({
      instructionType: DephyIdStakePoolInstruction.CancelUpdateConfig;
    } & ParsedCancelUpdateConfigInstruction<TProgram>)
  | ({
      instructionType: DephyIdStakePoolInstruction.CloseNftStake;
    } & ParsedCloseNftStakeInstruction<TProgram>)
  | ({
      instructionType: DephyIdStakePoolInstruction.ConfirmUpdateConfig;
    } & ParsedConfirmUpdateConfigInstruction<TProgram>)
  | ({
      instructionType: DephyIdStakePoolInstruction.CreateNftStake;
    } & ParsedCreateNftStakeInstruction<TProgram>)
  | ({
      instructionType: DephyIdStakePoolInstruction.CreateStakePool;
    } & ParsedCreateStakePoolInstruction<TProgram>)
  | ({
      instructionType: DephyIdStakePoolInstruction.DepositToken;
    } & ParsedDepositTokenInstruction<TProgram>)
  | ({
      instructionType: DephyIdStakePoolInstruction.Initialize;
    } & ParsedInitializeInstruction<TProgram>)
  | ({
      instructionType: DephyIdStakePoolInstruction.UnstakeNft;
    } & ParsedUnstakeNftInstruction<TProgram>)
  | ({
      instructionType: DephyIdStakePoolInstruction.Withdraw;
    } & ParsedWithdrawInstruction<TProgram>);
