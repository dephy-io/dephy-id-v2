import {
  BaseAppData,
  ExternalRegistryRecord,
} from '../../generated';
import { BaseExternalPluginAdapter } from './externalPluginAdapters';
import { parseExternalPluginAdapterData } from './lib';
import {
  PluginAuthority,
  pluginAuthorityFromBase,
} from './pluginAuthority';

export type AppData = Omit<BaseAppData, 'dataAuthority'> & {
  data?: any;
  dataAuthority: PluginAuthority;
};

export type AppDataPlugin = BaseExternalPluginAdapter &
  AppData & {
    dataAuthority: PluginAuthority;
    type: 'AppData';
  };


export function appDataFromBase(
  s: BaseAppData,
  r: ExternalRegistryRecord,
  account: Uint8Array
): AppData {
  return {
    ...s,
    data: parseExternalPluginAdapterData(s, r, account),
    dataAuthority: pluginAuthorityFromBase(s.dataAuthority),
  };
}
