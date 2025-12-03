import { AccountMeta, Address, downgradeRoleToNonSigner, Instruction, InstructionWithAccounts, TransactionSigner } from '@solana/kit';

import { getExecuteV1InstructionAsync } from '../generated';

export async function createExecuteIx({
  asset,
  collection,
  payer,
  authority,
  instruction,
}: {
  /** The address of the asset */
  asset: Address;
  /** The owner or delegate of the asset */
  authority?: TransactionSigner;
  /** The collection to which the asset belongs */
  collection?: Address;
  /** The instruction to execute as the asset signer */
  instruction: Instruction;
  /** The account paying for the storage fees */
  payer: TransactionSigner;
}) {
  const executeIx = await getExecuteV1InstructionAsync({
    asset,
    authority,
    collection,
    instructionData: instruction.data,
    payer,
    programId: instruction.programAddress,
  })

  const assetSigner = executeIx.accounts[2].address

  instruction.accounts?.forEach((a) => {
    (executeIx as InstructionWithAccounts<AccountMeta[]>).accounts.push(
      a.address == assetSigner ? {
        address: assetSigner,
        role: downgradeRoleToNonSigner(a.role),
      } : a
    )
  })

  return executeIx
}
