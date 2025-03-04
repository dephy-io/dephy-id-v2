import { Address } from '@solana/kit';

import { BaseLinkedDataKey } from '../../generated';
import {
  PluginAuthority,
  pluginAuthorityFromBase,
} from '.';

export type LinkedDataKey =
  {
      dataAuthority: PluginAuthority;
      type: 'LinkedAppData';
    } | {
      hookedProgram: Address;
      type: 'LinkedLifecycleHook';
    };

export function linkedDataKeyFromBase(e: BaseLinkedDataKey): LinkedDataKey {
  switch (e.__kind) {
    case 'LinkedLifecycleHook':
      return {
        hookedProgram: e.fields[0],
        type: e.__kind,
      };
    case 'LinkedAppData':
      return {
        dataAuthority: pluginAuthorityFromBase(e.fields[0]),
        type: e.__kind,
      };
    default:
      throw new Error('Unknown LinkedDataKey type');
  }
}
