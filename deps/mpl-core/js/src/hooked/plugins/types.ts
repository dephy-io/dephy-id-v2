import { Address } from '@solana/kit';

import {
  AddBlocker, Attributes, Autograph, BasePluginAuthority, BaseRoyalties, BurnDelegate, Edition,
  FreezeDelegate, ImmutableMetadata, PermanentBurnDelegate, PermanentFreezeDelegate, PermanentTransferDelegate,
  TransferDelegate, UpdateDelegate, VerifiedCreators
} from '../../generated';
import { MasterEdition } from './masterEdition';

export type PluginAuthorityType = BasePluginAuthority['__kind'];

export type PluginAuthority = {
  address?: Address;
  type: PluginAuthorityType;
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
export type AttributesPlugin = Attributes & BasePlugin;
export type PermanentTransferDelegatePlugin = BasePlugin &
  PermanentTransferDelegate;
export type PermanentBurnDelegatePlugin = BasePlugin & PermanentBurnDelegate;
export type EditionPlugin = BasePlugin & Edition;
export type MasterEditionPlugin = BasePlugin & MasterEdition;
export type AddBlockerPlugin = AddBlocker & BasePlugin;
export type ImmutableMetadataPlugin = BasePlugin & ImmutableMetadata;
export type VerifiedCreatorsPlugin = BasePlugin & VerifiedCreators;
export type AutographPlugin = Autograph & BasePlugin;


export type CommonPluginsList = {
  addBlocker?: AddBlockerPlugin;
  attributes?: AttributesPlugin;
  autograph?: AutographPlugin;
  immutableMetadata?: ImmutableMetadataPlugin;
  permanentBurnDelegate?: PermanentBurnDelegatePlugin;
  permanentFreezeDelegate?: PermanentFreezeDelegatePlugin;
  permanentTransferDelegate?: PermanentTransferDelegatePlugin;
  royalties?: BaseRoyalties;
  updateDelegate?: UpdateDelegatePlugin;
  verifiedCreators?: VerifiedCreatorsPlugin;
};

export type AssetPluginsList = CommonPluginsList & {
  burnDelegate?: BurnDelegatePlugin;
  edition?: EditionPlugin;
  freezeDelegate?: FreezeDelegatePlugin;
  transferDelegate?: TransferDelegatePlugin;
};

export type CollectionPluginsList = CommonPluginsList & {
  masterEdition?: MasterEditionPlugin;
};

export type PluginsList = AssetPluginsList & CollectionPluginsList;
