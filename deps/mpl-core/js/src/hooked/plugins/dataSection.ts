import {
  BaseDataSection,
  ExternalRegistryRecord,
} from '../../generated';
import { BaseExternalPluginAdapter } from './externalPluginAdapters';
import { parseExternalPluginAdapterData } from './lib';
import {
  LinkedDataKey,
  linkedDataKeyFromBase,
} from './linkedDataKey';
import { PluginAuthority, pluginAuthorityFromBase } from '.';

export type DataSection = Omit<
  BaseDataSection,
  'dataAuthority' | 'parentKey'
> & {
  dataAuthority?: PluginAuthority;
  parentKey: LinkedDataKey;
  data?: any;
};

export type DataSectionPlugin = BaseExternalPluginAdapter &
  DataSection & {
    type: 'DataSection';
  };

export function dataSectionFromBase(
  s: BaseDataSection,
  r: ExternalRegistryRecord,
  account: Uint8Array
): DataSection {
  return {
    ...s,
    parentKey: linkedDataKeyFromBase(s.parentKey),
    dataAuthority:
      s.parentKey.__kind !== 'LinkedLifecycleHook'
        ? pluginAuthorityFromBase(s.parentKey.fields[0])
        : undefined,
    data: parseExternalPluginAdapterData(s, r, account),
  };
}
