import { BaseMasterEdition } from '../../generated';
import { unwrapOption } from "@solana/kit";

export type MasterEdition = {
  maxSupply?: number;
  name?: string;
  uri?: string;
};

export function masterEditionFromBase(s: BaseMasterEdition): MasterEdition {
  return {
    maxSupply: unwrapOption(s.maxSupply),
    name: unwrapOption(s.name),
    uri: unwrapOption(s.uri),
  };
}
