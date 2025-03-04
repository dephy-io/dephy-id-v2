import {
  BaseDataSection,
  ExternalRegistryRecord,
} from '../../generated';
import { PluginAuthority, pluginAuthorityFromBase } from '.';
import { BaseExternalPluginAdapter } from './externalPluginAdapters';
import { parseExternalPluginAdapterData } from './lib';
import {
  LinkedDataKey,
  linkedDataKeyFromBase,
} from './linkedDataKey';

export type DataSection = Omit<
  BaseDataSection,
  'dataAuthority' | 'parentKey'
> & {
  data?: any;
  dataAuthority?: PluginAuthority;
  parentKey: LinkedDataKey;
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
    data: parseExternalPluginAdapterData(s, r, account),
    dataAuthority:
      s.parentKey.__kind !== 'LinkedLifecycleHook'
        ? pluginAuthorityFromBase(s.parentKey.fields[0])
        : undefined,
    parentKey: linkedDataKeyFromBase(s.parentKey),
  };
}
