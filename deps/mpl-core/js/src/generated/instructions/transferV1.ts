/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama-idl/codama
 */

import {
  combineCodec,
  getOptionDecoder,
  getOptionEncoder,
  getStructDecoder,
  getStructEncoder,
  getU8Decoder,
  getU8Encoder,
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
import {
  getCompressionProofDecoder,
  getCompressionProofEncoder,
  type CompressionProof,
  type CompressionProofArgs,
} from '../types';

export const TRANSFER_V1_DISCRIMINATOR = 14;

export function getTransferV1DiscriminatorBytes() {
  return getU8Encoder().encode(TRANSFER_V1_DISCRIMINATOR);
}

export type TransferV1Instruction<
  TProgram extends string = typeof MPL_CORE_PROGRAM_ADDRESS,
  TAccountAsset extends string | IAccountMeta<string> = string,
  TAccountCollection extends string | IAccountMeta<string> = string,
  TAccountPayer extends string | IAccountMeta<string> = string,
  TAccountAuthority extends string | IAccountMeta<string> = string,
  TAccountNewOwner extends string | IAccountMeta<string> = string,
  TAccountSystemProgram extends string | IAccountMeta<string> = string,
  TAccountLogWrapper extends string | IAccountMeta<string> = string,
  TRemainingAccounts extends readonly IAccountMeta<string>[] = [],
> = IInstruction<TProgram> &
  IInstructionWithData<Uint8Array> &
  IInstructionWithAccounts<
    [
      TAccountAsset extends string
        ? WritableAccount<TAccountAsset>
        : TAccountAsset,
      TAccountCollection extends string
        ? ReadonlyAccount<TAccountCollection>
        : TAccountCollection,
      TAccountPayer extends string
        ? WritableSignerAccount<TAccountPayer> &
            IAccountSignerMeta<TAccountPayer>
        : TAccountPayer,
      TAccountAuthority extends string
        ? ReadonlySignerAccount<TAccountAuthority> &
            IAccountSignerMeta<TAccountAuthority>
        : TAccountAuthority,
      TAccountNewOwner extends string
        ? ReadonlyAccount<TAccountNewOwner>
        : TAccountNewOwner,
      TAccountSystemProgram extends string
        ? ReadonlyAccount<TAccountSystemProgram>
        : TAccountSystemProgram,
      TAccountLogWrapper extends string
        ? ReadonlyAccount<TAccountLogWrapper>
        : TAccountLogWrapper,
      ...TRemainingAccounts,
    ]
  >;

export type TransferV1InstructionData = {
  discriminator: number;
  compressionProof: Option<CompressionProof>;
};

export type TransferV1InstructionDataArgs = {
  compressionProof?: OptionOrNullable<CompressionProofArgs>;
};

export function getTransferV1InstructionDataEncoder(): Encoder<TransferV1InstructionDataArgs> {
  return transformEncoder(
    getStructEncoder([
      ['discriminator', getU8Encoder()],
      ['compressionProof', getOptionEncoder(getCompressionProofEncoder())],
    ]),
    (value) => ({
      ...value,
      discriminator: TRANSFER_V1_DISCRIMINATOR,
      compressionProof: value.compressionProof ?? none(),
    })
  );
}

export function getTransferV1InstructionDataDecoder(): Decoder<TransferV1InstructionData> {
  return getStructDecoder([
    ['discriminator', getU8Decoder()],
    ['compressionProof', getOptionDecoder(getCompressionProofDecoder())],
  ]);
}

export function getTransferV1InstructionDataCodec(): Codec<
  TransferV1InstructionDataArgs,
  TransferV1InstructionData
> {
  return combineCodec(
    getTransferV1InstructionDataEncoder(),
    getTransferV1InstructionDataDecoder()
  );
}

export type TransferV1Input<
  TAccountAsset extends string = string,
  TAccountCollection extends string = string,
  TAccountPayer extends string = string,
  TAccountAuthority extends string = string,
  TAccountNewOwner extends string = string,
  TAccountSystemProgram extends string = string,
  TAccountLogWrapper extends string = string,
> = {
  /** The address of the asset */
  asset: Address<TAccountAsset>;
  /** The collection to which the asset belongs */
  collection?: Address<TAccountCollection>;
  /** The account paying for the storage fees */
  payer: TransactionSigner<TAccountPayer>;
  /** The owner or delegate of the asset */
  authority?: TransactionSigner<TAccountAuthority>;
  /** The new owner to which to transfer the asset */
  newOwner: Address<TAccountNewOwner>;
  /** The system program */
  systemProgram?: Address<TAccountSystemProgram>;
  /** The SPL Noop Program */
  logWrapper?: Address<TAccountLogWrapper>;
  compressionProof?: TransferV1InstructionDataArgs['compressionProof'];
};

export function getTransferV1Instruction<
  TAccountAsset extends string,
  TAccountCollection extends string,
  TAccountPayer extends string,
  TAccountAuthority extends string,
  TAccountNewOwner extends string,
  TAccountSystemProgram extends string,
  TAccountLogWrapper extends string,
  TProgramAddress extends Address = typeof MPL_CORE_PROGRAM_ADDRESS,
>(
  input: TransferV1Input<
    TAccountAsset,
    TAccountCollection,
    TAccountPayer,
    TAccountAuthority,
    TAccountNewOwner,
    TAccountSystemProgram,
    TAccountLogWrapper
  >,
  config?: { programAddress?: TProgramAddress }
): TransferV1Instruction<
  TProgramAddress,
  TAccountAsset,
  TAccountCollection,
  TAccountPayer,
  TAccountAuthority,
  TAccountNewOwner,
  TAccountSystemProgram,
  TAccountLogWrapper
> {
  // Program address.
  const programAddress = config?.programAddress ?? MPL_CORE_PROGRAM_ADDRESS;

  // Original accounts.
  const originalAccounts = {
    asset: { value: input.asset ?? null, isWritable: true },
    collection: { value: input.collection ?? null, isWritable: false },
    payer: { value: input.payer ?? null, isWritable: true },
    authority: { value: input.authority ?? null, isWritable: false },
    newOwner: { value: input.newOwner ?? null, isWritable: false },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false },
    logWrapper: { value: input.logWrapper ?? null, isWritable: false },
  };
  const accounts = originalAccounts as Record<
    keyof typeof originalAccounts,
    ResolvedAccount
  >;

  // Original args.
  const args = { ...input };

  const getAccountMeta = getAccountMetaFactory(programAddress, 'programId');
  const instruction = {
    accounts: [
      getAccountMeta(accounts.asset),
      getAccountMeta(accounts.collection),
      getAccountMeta(accounts.payer),
      getAccountMeta(accounts.authority),
      getAccountMeta(accounts.newOwner),
      getAccountMeta(accounts.systemProgram),
      getAccountMeta(accounts.logWrapper),
    ],
    programAddress,
    data: getTransferV1InstructionDataEncoder().encode(
      args as TransferV1InstructionDataArgs
    ),
  } as TransferV1Instruction<
    TProgramAddress,
    TAccountAsset,
    TAccountCollection,
    TAccountPayer,
    TAccountAuthority,
    TAccountNewOwner,
    TAccountSystemProgram,
    TAccountLogWrapper
  >;

  return instruction;
}

export type ParsedTransferV1Instruction<
  TProgram extends string = typeof MPL_CORE_PROGRAM_ADDRESS,
  TAccountMetas extends readonly IAccountMeta[] = readonly IAccountMeta[],
> = {
  programAddress: Address<TProgram>;
  accounts: {
    /** The address of the asset */
    asset: TAccountMetas[0];
    /** The collection to which the asset belongs */
    collection?: TAccountMetas[1] | undefined;
    /** The account paying for the storage fees */
    payer: TAccountMetas[2];
    /** The owner or delegate of the asset */
    authority?: TAccountMetas[3] | undefined;
    /** The new owner to which to transfer the asset */
    newOwner: TAccountMetas[4];
    /** The system program */
    systemProgram?: TAccountMetas[5] | undefined;
    /** The SPL Noop Program */
    logWrapper?: TAccountMetas[6] | undefined;
  };
  data: TransferV1InstructionData;
};

export function parseTransferV1Instruction<
  TProgram extends string,
  TAccountMetas extends readonly IAccountMeta[],
>(
  instruction: IInstruction<TProgram> &
    IInstructionWithAccounts<TAccountMetas> &
    IInstructionWithData<Uint8Array>
): ParsedTransferV1Instruction<TProgram, TAccountMetas> {
  if (instruction.accounts.length < 7) {
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
      asset: getNextAccount(),
      collection: getNextOptionalAccount(),
      payer: getNextAccount(),
      authority: getNextOptionalAccount(),
      newOwner: getNextAccount(),
      systemProgram: getNextOptionalAccount(),
      logWrapper: getNextOptionalAccount(),
    },
    data: getTransferV1InstructionDataDecoder().decode(instruction.data),
  };
}
