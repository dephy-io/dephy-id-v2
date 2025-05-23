/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama-idl/codama
 */

import {
  addDecoderSizePrefix,
  addEncoderSizePrefix,
  combineCodec,
  getOptionDecoder,
  getOptionEncoder,
  getStructDecoder,
  getStructEncoder,
  getU32Decoder,
  getU32Encoder,
  getU8Decoder,
  getU8Encoder,
  getUtf8Decoder,
  getUtf8Encoder,
  none,
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
  type Option,
  type OptionOrNullable,
  type ReadonlyAccount,
  type ReadonlySignerAccount,
  type TransactionSigner,
  type WritableAccount,
  type WritableSignerAccount,
} from '@solana/kit';
import { MPL_CORE_PROGRAM_ADDRESS } from '../programs';
import { getAccountMetaFactory, type ResolvedAccount } from '../shared';

export const UPDATE_COLLECTION_V1_DISCRIMINATOR = 16;

export function getUpdateCollectionV1DiscriminatorBytes() {
  return getU8Encoder().encode(UPDATE_COLLECTION_V1_DISCRIMINATOR);
}

export type UpdateCollectionV1Instruction<
  TProgram extends string = typeof MPL_CORE_PROGRAM_ADDRESS,
  TAccountCollection extends string | IAccountMeta<string> = string,
  TAccountPayer extends string | IAccountMeta<string> = string,
  TAccountAuthority extends string | IAccountMeta<string> = string,
  TAccountNewUpdateAuthority extends string | IAccountMeta<string> = string,
  TAccountSystemProgram extends
    | string
    | IAccountMeta<string> = '11111111111111111111111111111111',
  TAccountLogWrapper extends string | IAccountMeta<string> = string,
  TRemainingAccounts extends readonly IAccountMeta<string>[] = [],
> = IInstruction<TProgram> &
  IInstructionWithData<Uint8Array> &
  IInstructionWithAccounts<
    [
      TAccountCollection extends string
        ? WritableAccount<TAccountCollection>
        : TAccountCollection,
      TAccountPayer extends string
        ? WritableSignerAccount<TAccountPayer> &
            IAccountSignerMeta<TAccountPayer>
        : TAccountPayer,
      TAccountAuthority extends string
        ? ReadonlySignerAccount<TAccountAuthority> &
            IAccountSignerMeta<TAccountAuthority>
        : TAccountAuthority,
      TAccountNewUpdateAuthority extends string
        ? ReadonlyAccount<TAccountNewUpdateAuthority>
        : TAccountNewUpdateAuthority,
      TAccountSystemProgram extends string
        ? ReadonlyAccount<TAccountSystemProgram>
        : TAccountSystemProgram,
      TAccountLogWrapper extends string
        ? ReadonlyAccount<TAccountLogWrapper>
        : TAccountLogWrapper,
      ...TRemainingAccounts,
    ]
  >;

export type UpdateCollectionV1InstructionData = {
  discriminator: number;
  newName: Option<string>;
  newUri: Option<string>;
};

export type UpdateCollectionV1InstructionDataArgs = {
  newName?: OptionOrNullable<string>;
  newUri?: OptionOrNullable<string>;
};

export function getUpdateCollectionV1InstructionDataEncoder(): Encoder<UpdateCollectionV1InstructionDataArgs> {
  return transformEncoder(
    getStructEncoder([
      ['discriminator', getU8Encoder()],
      [
        'newName',
        getOptionEncoder(
          addEncoderSizePrefix(getUtf8Encoder(), getU32Encoder())
        ),
      ],
      [
        'newUri',
        getOptionEncoder(
          addEncoderSizePrefix(getUtf8Encoder(), getU32Encoder())
        ),
      ],
    ]),
    (value) => ({
      ...value,
      discriminator: UPDATE_COLLECTION_V1_DISCRIMINATOR,
      newName: value.newName ?? none(),
      newUri: value.newUri ?? none(),
    })
  );
}

export function getUpdateCollectionV1InstructionDataDecoder(): Decoder<UpdateCollectionV1InstructionData> {
  return getStructDecoder([
    ['discriminator', getU8Decoder()],
    [
      'newName',
      getOptionDecoder(addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder())),
    ],
    [
      'newUri',
      getOptionDecoder(addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder())),
    ],
  ]);
}

export function getUpdateCollectionV1InstructionDataCodec(): Codec<
  UpdateCollectionV1InstructionDataArgs,
  UpdateCollectionV1InstructionData
> {
  return combineCodec(
    getUpdateCollectionV1InstructionDataEncoder(),
    getUpdateCollectionV1InstructionDataDecoder()
  );
}

export type UpdateCollectionV1Input<
  TAccountCollection extends string = string,
  TAccountPayer extends string = string,
  TAccountAuthority extends string = string,
  TAccountNewUpdateAuthority extends string = string,
  TAccountSystemProgram extends string = string,
  TAccountLogWrapper extends string = string,
> = {
  /** The address of the asset */
  collection: Address<TAccountCollection>;
  /** The account paying for the storage fees */
  payer: TransactionSigner<TAccountPayer>;
  /** The update authority or update authority delegate of the asset */
  authority?: TransactionSigner<TAccountAuthority>;
  /** The new update authority of the asset */
  newUpdateAuthority?: Address<TAccountNewUpdateAuthority>;
  /** The system program */
  systemProgram?: Address<TAccountSystemProgram>;
  /** The SPL Noop Program */
  logWrapper?: Address<TAccountLogWrapper>;
  newName?: UpdateCollectionV1InstructionDataArgs['newName'];
  newUri?: UpdateCollectionV1InstructionDataArgs['newUri'];
};

export function getUpdateCollectionV1Instruction<
  TAccountCollection extends string,
  TAccountPayer extends string,
  TAccountAuthority extends string,
  TAccountNewUpdateAuthority extends string,
  TAccountSystemProgram extends string,
  TAccountLogWrapper extends string,
  TProgramAddress extends Address = typeof MPL_CORE_PROGRAM_ADDRESS,
>(
  input: UpdateCollectionV1Input<
    TAccountCollection,
    TAccountPayer,
    TAccountAuthority,
    TAccountNewUpdateAuthority,
    TAccountSystemProgram,
    TAccountLogWrapper
  >,
  config?: { programAddress?: TProgramAddress }
): UpdateCollectionV1Instruction<
  TProgramAddress,
  TAccountCollection,
  TAccountPayer,
  TAccountAuthority,
  TAccountNewUpdateAuthority,
  TAccountSystemProgram,
  TAccountLogWrapper
> {
  // Program address.
  const programAddress = config?.programAddress ?? MPL_CORE_PROGRAM_ADDRESS;

  // Original accounts.
  const originalAccounts = {
    collection: { value: input.collection ?? null, isWritable: true },
    payer: { value: input.payer ?? null, isWritable: true },
    authority: { value: input.authority ?? null, isWritable: false },
    newUpdateAuthority: {
      value: input.newUpdateAuthority ?? null,
      isWritable: false,
    },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false },
    logWrapper: { value: input.logWrapper ?? null, isWritable: false },
  };
  const accounts = originalAccounts as Record<
    keyof typeof originalAccounts,
    ResolvedAccount
  >;

  // Original args.
  const args = { ...input };

  // Resolve default values.
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value =
      '11111111111111111111111111111111' as Address<'11111111111111111111111111111111'>;
  }

  const getAccountMeta = getAccountMetaFactory(programAddress, 'programId');
  const instruction = {
    accounts: [
      getAccountMeta(accounts.collection),
      getAccountMeta(accounts.payer),
      getAccountMeta(accounts.authority),
      getAccountMeta(accounts.newUpdateAuthority),
      getAccountMeta(accounts.systemProgram),
      getAccountMeta(accounts.logWrapper),
    ],
    programAddress,
    data: getUpdateCollectionV1InstructionDataEncoder().encode(
      args as UpdateCollectionV1InstructionDataArgs
    ),
  } as UpdateCollectionV1Instruction<
    TProgramAddress,
    TAccountCollection,
    TAccountPayer,
    TAccountAuthority,
    TAccountNewUpdateAuthority,
    TAccountSystemProgram,
    TAccountLogWrapper
  >;

  return instruction;
}

export type ParsedUpdateCollectionV1Instruction<
  TProgram extends string = typeof MPL_CORE_PROGRAM_ADDRESS,
  TAccountMetas extends readonly IAccountMeta[] = readonly IAccountMeta[],
> = {
  programAddress: Address<TProgram>;
  accounts: {
    /** The address of the asset */
    collection: TAccountMetas[0];
    /** The account paying for the storage fees */
    payer: TAccountMetas[1];
    /** The update authority or update authority delegate of the asset */
    authority?: TAccountMetas[2] | undefined;
    /** The new update authority of the asset */
    newUpdateAuthority?: TAccountMetas[3] | undefined;
    /** The system program */
    systemProgram: TAccountMetas[4];
    /** The SPL Noop Program */
    logWrapper?: TAccountMetas[5] | undefined;
  };
  data: UpdateCollectionV1InstructionData;
};

export function parseUpdateCollectionV1Instruction<
  TProgram extends string,
  TAccountMetas extends readonly IAccountMeta[],
>(
  instruction: IInstruction<TProgram> &
    IInstructionWithAccounts<TAccountMetas> &
    IInstructionWithData<Uint8Array>
): ParsedUpdateCollectionV1Instruction<TProgram, TAccountMetas> {
  if (instruction.accounts.length < 6) {
    // TODO: Coded error.
    throw new Error('Not enough accounts');
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts![accountIndex]!;
    accountIndex += 1;
    return accountMeta;
  };
  const getNextOptionalAccount = () => {
    const accountMeta = getNextAccount();
    return accountMeta.address === MPL_CORE_PROGRAM_ADDRESS
      ? undefined
      : accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      collection: getNextAccount(),
      payer: getNextAccount(),
      authority: getNextOptionalAccount(),
      newUpdateAuthority: getNextOptionalAccount(),
      systemProgram: getNextAccount(),
      logWrapper: getNextOptionalAccount(),
    },
    data: getUpdateCollectionV1InstructionDataDecoder().decode(
      instruction.data
    ),
  };
}
