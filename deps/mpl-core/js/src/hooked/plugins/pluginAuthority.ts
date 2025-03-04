import { Address } from '@solana/kit';

import { BasePluginAuthority } from '../../generated';

export type PluginAuthority = {
  type: PluginAuthorityType;
  address?: Address;
};

export type PluginAuthorityType = BasePluginAuthority['__kind'];

export function pluginAuthorityFromBase(
  authority: BasePluginAuthority
): PluginAuthority {
  return {
    type: authority.__kind,
    address: (authority as any).address,
  };
}
