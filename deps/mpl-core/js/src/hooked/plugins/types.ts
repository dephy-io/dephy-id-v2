import { Address } from '@solana/kit';
import {
  AddBlocker, Attributes, Autograph, BasePluginAuthority, BaseRoyalties, BurnDelegate, Edition,
  FreezeDelegate, ImmutableMetadata, PermanentBurnDelegate, PermanentFreezeDelegate, PermanentTransferDelegate,
  TransferDelegate, UpdateDelegate, VerifiedCreators
} from '../../generated';
import { MasterEdition } from './masterEdition';

export type PluginAuthorityType = BasePluginAuthority['__kind'];

export type PluginAuthority = {
  type: PluginAuthorityType;
  address?: Address;
};

export type BasePlugin = {
  authority: PluginAuthority;
  offset?: bigint;
};

export type FreezeDelegatePlugin = BasePlugin & FreezeDelegate;
export type BurnDelegatePlugin = BasePlugin & BurnDelegate;
export type TransferDelegatePlugin = BasePlugin & TransferDelegate;
export type UpdateDelegatePlugin = BasePlugin & UpdateDelegate;
export type PermanentFreezeDelegatePlugin = BasePlugin &
  PermanentFreezeDelegate;
export type AttributesPlugin = BasePlugin & Attributes;
export type PermanentTransferDelegatePlugin = BasePlugin &
  PermanentTransferDelegate;
export type PermanentBurnDelegatePlugin = BasePlugin & PermanentBurnDelegate;
export type EditionPlugin = BasePlugin & Edition;
export type MasterEditionPlugin = BasePlugin & MasterEdition;
export type AddBlockerPlugin = BasePlugin & AddBlocker;
export type ImmutableMetadataPlugin = BasePlugin & ImmutableMetadata;
export type VerifiedCreatorsPlugin = BasePlugin & VerifiedCreators;
export type AutographPlugin = BasePlugin & Autograph;


export type CommonPluginsList = {
  attributes?: AttributesPlugin;
  royalties?: BaseRoyalties;
  updateDelegate?: UpdateDelegatePlugin;
  permanentFreezeDelegate?: PermanentFreezeDelegatePlugin;
  permanentTransferDelegate?: PermanentTransferDelegatePlugin;
  permanentBurnDelegate?: PermanentBurnDelegatePlugin;
  addBlocker?: AddBlockerPlugin;
  immutableMetadata?: ImmutableMetadataPlugin;
  autograph?: AutographPlugin;
  verifiedCreators?: VerifiedCreatorsPlugin;
};

export type AssetPluginsList = {
  freezeDelegate?: FreezeDelegatePlugin;
  burnDelegate?: BurnDelegatePlugin;
  transferDelegate?: TransferDelegatePlugin;
  edition?: EditionPlugin;
} & CommonPluginsList;

export type CollectionPluginsList = {
  masterEdition?: MasterEditionPlugin;
} & CommonPluginsList;

export type PluginsList = AssetPluginsList & CollectionPluginsList;
