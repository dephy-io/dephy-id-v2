import { Address } from '@solana/kit';
import {
  PluginAuthority,
  pluginAuthorityFromBase,
} from '.';
import { BaseLinkedDataKey } from '../../generated';

export type LinkedDataKey =
  | {
      type: 'LinkedLifecycleHook';
      hookedProgram: Address;
    }
  | {
      type: 'LinkedAppData';
      dataAuthority: PluginAuthority;
    };

export function linkedDataKeyFromBase(e: BaseLinkedDataKey): LinkedDataKey {
  switch (e.__kind) {
    case 'LinkedLifecycleHook':
      return {
        type: e.__kind,
        hookedProgram: e.fields[0],
      };
    case 'LinkedAppData':
      return {
        type: e.__kind,
        dataAuthority: pluginAuthorityFromBase(e.fields[0]),
      };
    default:
      throw new Error('Unknown LinkedDataKey type');
  }
}
