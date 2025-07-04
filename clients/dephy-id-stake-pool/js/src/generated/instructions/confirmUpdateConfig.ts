/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama-idl/codama
 */

import {
  combineCodec,
  fixDecoderSize,
  fixEncoderSize,
  getAddressEncoder,
  getBytesDecoder,
  getBytesEncoder,
  getProgramDerivedAddress,
  getStructDecoder,
  getStructEncoder,
  transformEncoder,
  type Address,
  type Codec,
  type Decoder,
  type Encoder,
  type IAccountMeta,
  type IAccountSignerMeta,
  type IInstruction,
  type IInstructionWithAccounts,
  type IInstructionWithData,
  type ReadonlySignerAccount,
  type ReadonlyUint8Array,
  type TransactionSigner,
  type WritableAccount,
  type WritableSignerAccount,
} from '@solana/kit';
import { DEPHY_ID_STAKE_POOL_PROGRAM_ADDRESS } from '../programs';
import {
  expectAddress,
  getAccountMetaFactory,
  type ResolvedAccount,
} from '../shared';

export const CONFIRM_UPDATE_CONFIG_DISCRIMINATOR = new Uint8Array([
  25, 58, 1, 51, 3, 105, 99, 234,
]);

export function getConfirmUpdateConfigDiscriminatorBytes() {
  return fixEncoderSize(getBytesEncoder(), 8).encode(
    CONFIRM_UPDATE_CONFIG_DISCRIMINATOR
  );
}

export type ConfirmUpdateConfigInstruction<
  TProgram extends string = typeof DEPHY_ID_STAKE_POOL_PROGRAM_ADDRESS,
  TAccountStakePool extends string | IAccountMeta<string> = string,
  TAccountAuthority extends string | IAccountMeta<string> = string,
  TAccountAnnouncedConfig extends string | IAccountMeta<string> = string,
  TAccountPayer extends string | IAccountMeta<string> = string,
  TRemainingAccounts extends readonly IAccountMeta<string>[] = [],
> = IInstruction<TProgram> &
  IInstructionWithData<Uint8Array> &
  IInstructionWithAccounts<
    [
      TAccountStakePool extends string
        ? WritableAccount<TAccountStakePool>
        : TAccountStakePool,
      TAccountAuthority extends string
        ? ReadonlySignerAccount<TAccountAuthority> &
            IAccountSignerMeta<TAccountAuthority>
        : TAccountAuthority,
      TAccountAnnouncedConfig extends string
        ? WritableAccount<TAccountAnnouncedConfig>
        : TAccountAnnouncedConfig,
      TAccountPayer extends string
        ? WritableSignerAccount<TAccountPayer> &
            IAccountSignerMeta<TAccountPayer>
        : TAccountPayer,
      ...TRemainingAccounts,
    ]
  >;

export type ConfirmUpdateConfigInstructionData = {
  discriminator: ReadonlyUint8Array;
};

export type ConfirmUpdateConfigInstructionDataArgs = {};

export function getConfirmUpdateConfigInstructionDataEncoder(): Encoder<ConfirmUpdateConfigInstructionDataArgs> {
  return transformEncoder(
    getStructEncoder([['discriminator', fixEncoderSize(getBytesEncoder(), 8)]]),
    (value) => ({
      ...value,
      discriminator: CONFIRM_UPDATE_CONFIG_DISCRIMINATOR,
    })
  );
}

export function getConfirmUpdateConfigInstructionDataDecoder(): Decoder<ConfirmUpdateConfigInstructionData> {
  return getStructDecoder([
    ['discriminator', fixDecoderSize(getBytesDecoder(), 8)],
  ]);
}

export function getConfirmUpdateConfigInstructionDataCodec(): Codec<
  ConfirmUpdateConfigInstructionDataArgs,
  ConfirmUpdateConfigInstructionData
> {
  return combineCodec(
    getConfirmUpdateConfigInstructionDataEncoder(),
    getConfirmUpdateConfigInstructionDataDecoder()
  );
}

export type ConfirmUpdateConfigAsyncInput<
  TAccountStakePool extends string = string,
  TAccountAuthority extends string = string,
  TAccountAnnouncedConfig extends string = string,
  TAccountPayer extends string = string,
> = {
  stakePool: Address<TAccountStakePool>;
  authority: TransactionSigner<TAccountAuthority>;
  announcedConfig?: Address<TAccountAnnouncedConfig>;
  payer: TransactionSigner<TAccountPayer>;
};

export async function getConfirmUpdateConfigInstructionAsync<
  TAccountStakePool extends string,
  TAccountAuthority extends string,
  TAccountAnnouncedConfig extends string,
  TAccountPayer extends string,
  TProgramAddress extends Address = typeof DEPHY_ID_STAKE_POOL_PROGRAM_ADDRESS,
>(
  input: ConfirmUpdateConfigAsyncInput<
    TAccountStakePool,
    TAccountAuthority,
    TAccountAnnouncedConfig,
    TAccountPayer
  >,
  config?: { programAddress?: TProgramAddress }
): Promise<
  ConfirmUpdateConfigInstruction<
    TProgramAddress,
    TAccountStakePool,
    TAccountAuthority,
    TAccountAnnouncedConfig,
    TAccountPayer
  >
> {
  // Program address.
  const programAddress =
    config?.programAddress ?? DEPHY_ID_STAKE_POOL_PROGRAM_ADDRESS;

  // Original accounts.
  const originalAccounts = {
    stakePool: { value: input.stakePool ?? null, isWritable: true },
    authority: { value: input.authority ?? null, isWritable: false },
    announcedConfig: { value: input.announcedConfig ?? null, isWritable: true },
    payer: { value: input.payer ?? null, isWritable: true },
  };
  const accounts = originalAccounts as Record<
    keyof typeof originalAccounts,
    ResolvedAccount
  >;

  // Resolve default values.
  if (!accounts.announcedConfig.value) {
    accounts.announcedConfig.value = await getProgramDerivedAddress({
      programAddress,
      seeds: [
        getAddressEncoder().encode(expectAddress(accounts.stakePool.value)),
        getBytesEncoder().encode(
          new Uint8Array([
            65, 78, 78, 79, 85, 78, 67, 69, 68, 95, 67, 79, 78, 70, 73, 71,
          ])
        ),
      ],
    });
  }

  const getAccountMeta = getAccountMetaFactory(programAddress, 'programId');
  const instruction = {
    accounts: [
      getAccountMeta(accounts.stakePool),
      getAccountMeta(accounts.authority),
      getAccountMeta(accounts.announcedConfig),
      getAccountMeta(accounts.payer),
    ],
    programAddress,
    data: getConfirmUpdateConfigInstructionDataEncoder().encode({}),
  } as ConfirmUpdateConfigInstruction<
    TProgramAddress,
    TAccountStakePool,
    TAccountAuthority,
    TAccountAnnouncedConfig,
    TAccountPayer
  >;

  return instruction;
}

export type ConfirmUpdateConfigInput<
  TAccountStakePool extends string = string,
  TAccountAuthority extends string = string,
  TAccountAnnouncedConfig extends string = string,
  TAccountPayer extends string = string,
> = {
  stakePool: Address<TAccountStakePool>;
  authority: TransactionSigner<TAccountAuthority>;
  announcedConfig: Address<TAccountAnnouncedConfig>;
  payer: TransactionSigner<TAccountPayer>;
};

export function getConfirmUpdateConfigInstruction<
  TAccountStakePool extends string,
  TAccountAuthority extends string,
  TAccountAnnouncedConfig extends string,
  TAccountPayer extends string,
  TProgramAddress extends Address = typeof DEPHY_ID_STAKE_POOL_PROGRAM_ADDRESS,
>(
  input: ConfirmUpdateConfigInput<
    TAccountStakePool,
    TAccountAuthority,
    TAccountAnnouncedConfig,
    TAccountPayer
  >,
  config?: { programAddress?: TProgramAddress }
): ConfirmUpdateConfigInstruction<
  TProgramAddress,
  TAccountStakePool,
  TAccountAuthority,
  TAccountAnnouncedConfig,
  TAccountPayer
> {
  // Program address.
  const programAddress =
    config?.programAddress ?? DEPHY_ID_STAKE_POOL_PROGRAM_ADDRESS;

  // Original accounts.
  const originalAccounts = {
    stakePool: { value: input.stakePool ?? null, isWritable: true },
    authority: { value: input.authority ?? null, isWritable: false },
    announcedConfig: { value: input.announcedConfig ?? null, isWritable: true },
    payer: { value: input.payer ?? null, isWritable: true },
  };
  const accounts = originalAccounts as Record<
    keyof typeof originalAccounts,
    ResolvedAccount
  >;

  const getAccountMeta = getAccountMetaFactory(programAddress, 'programId');
  const instruction = {
    accounts: [
      getAccountMeta(accounts.stakePool),
      getAccountMeta(accounts.authority),
      getAccountMeta(accounts.announcedConfig),
      getAccountMeta(accounts.payer),
    ],
    programAddress,
    data: getConfirmUpdateConfigInstructionDataEncoder().encode({}),
  } as ConfirmUpdateConfigInstruction<
    TProgramAddress,
    TAccountStakePool,
    TAccountAuthority,
    TAccountAnnouncedConfig,
    TAccountPayer
  >;

  return instruction;
}

export type ParsedConfirmUpdateConfigInstruction<
  TProgram extends string = typeof DEPHY_ID_STAKE_POOL_PROGRAM_ADDRESS,
  TAccountMetas extends readonly IAccountMeta[] = readonly IAccountMeta[],
> = {
  programAddress: Address<TProgram>;
  accounts: {
    stakePool: TAccountMetas[0];
    authority: TAccountMetas[1];
    announcedConfig: TAccountMetas[2];
    payer: TAccountMetas[3];
  };
  data: ConfirmUpdateConfigInstructionData;
};

export function parseConfirmUpdateConfigInstruction<
  TProgram extends string,
  TAccountMetas extends readonly IAccountMeta[],
>(
  instruction: IInstruction<TProgram> &
    IInstructionWithAccounts<TAccountMetas> &
    IInstructionWithData<Uint8Array>
): ParsedConfirmUpdateConfigInstruction<TProgram, TAccountMetas> {
  if (instruction.accounts.length < 4) {
    // TODO: Coded error.
    throw new Error('Not enough accounts');
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts![accountIndex]!;
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      stakePool: getNextAccount(),
      authority: getNextAccount(),
      announcedConfig: getNextAccount(),
      payer: getNextAccount(),
    },
    data: getConfirmUpdateConfigInstructionDataDecoder().decode(
      instruction.data
    ),
  };
}
