import {
  BaseLinkedAppData,
  ExternalRegistryRecord,
} from '../../generated';
import { BaseExternalPluginAdapter } from './externalPluginAdapters';
import {
  PluginAuthority,
  pluginAuthorityFromBase,
} from './pluginAuthority';

export type LinkedAppData = Omit<BaseLinkedAppData, 'dataAuthority'> & {
  dataAuthority: PluginAuthority;
  data?: any;
};

export type LinkedAppDataPlugin = BaseExternalPluginAdapter &
  LinkedAppData & {
    type: 'LinkedAppData';
    dataAuthority: PluginAuthority;
  };

export function linkedAppDataFromBase(
  s: BaseLinkedAppData,
  _r: ExternalRegistryRecord,
  _account: Uint8Array
): LinkedAppData {
  return {
    ...s,
    dataAuthority: pluginAuthorityFromBase(s.dataAuthority),
    // plugin has no data but injected in the derivation of the asset
  };
}
