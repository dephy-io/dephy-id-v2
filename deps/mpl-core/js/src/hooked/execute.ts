import { IInstruction, Address, TransactionSigner, IAccountMeta, downgradeRoleToNonSigner, IInstructionWithAccounts } from '@solana/kit'
import { getExecuteV1InstructionAsync } from '../generated'

export async function createExecuteIx({
  asset,
  collection,
  payer,
  authority,
  instruction,
}: {
  /** The address of the asset */
  asset: Address;
  /** The collection to which the asset belongs */
  collection?: Address;
  /** The account paying for the storage fees */
  payer: TransactionSigner;
  /** The owner or delegate of the asset */
  authority?: TransactionSigner;
  /** The instruction to execute as the asset signer */
  instruction: IInstruction;
}) {
  const executeIx = await getExecuteV1InstructionAsync({
    collection,
    asset,
    payer,
    authority,
    instructionData: instruction.data,
    programId: instruction.programAddress,
  })

  const assetSigner = executeIx.accounts[2].address

  instruction.accounts?.forEach((a) => {
    (executeIx as IInstructionWithAccounts<IAccountMeta[]>).accounts.push(
      a.address == assetSigner ? {
        address: assetSigner,
        role: downgradeRoleToNonSigner(a.role),
      } : a
    )
  })

  return executeIx
}
