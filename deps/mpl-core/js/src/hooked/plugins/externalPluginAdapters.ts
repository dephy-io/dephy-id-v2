import { isSome, unwrapOption } from '@solana/kit';

import {
  BaseExternalPluginAdapterKey,
  ExternalRegistryRecord,
  getExternalPluginAdapterDecoder,
} from '../../generated';
import {
  pluginAuthorityFromBase,
} from '.';
import { appDataFromBase, AppDataPlugin } from './appData';
import {
  dataSectionFromBase,
  DataSectionPlugin,
} from './dataSection';
import {
  LifecycleChecksContainer,
  lifecycleChecksFromBase,
} from './lifecycleChecks';
import { linkedAppDataFromBase, LinkedAppDataPlugin } from './linkedAppData';
import { BasePlugin } from './types';

export type ExternalPluginAdapterTypeString =
  BaseExternalPluginAdapterKey['__kind'];

export type BaseExternalPluginAdapter = BasePlugin &
  ExternalPluginAdapterData &
  LifecycleChecksContainer;

export type ExternalPluginAdapters =
  // | LifecycleHookPlugin
  // | OraclePlugin
  | AppDataPlugin
  // | LinkedLifecycleHookPlugin
  | LinkedAppDataPlugin
  | DataSectionPlugin;

export type ExternalPluginAdaptersList = {
  // lifecycleHooks?: LifecycleHookPlugin[];
  // oracles?: OraclePlugin[];
  appDatas?: AppDataPlugin[];
  // linkedLifecycleHooks?: LinkedLifecycleHookPlugin[];
  linkedAppDatas?: LinkedAppDataPlugin[];
  dataSections?: DataSectionPlugin[];
};


export type ExternalPluginAdapterData = {
  dataLen?: bigint;
  dataOffset?: bigint;
};

export function externalRegistryRecordsToExternalPluginAdapterList(
  records: ExternalRegistryRecord[],
  accountData: Uint8Array
): ExternalPluginAdaptersList {
  const result: ExternalPluginAdaptersList = {};

  records.forEach((record) => {
    const deserializedPlugin = getExternalPluginAdapterDecoder().decode(accountData, Number(record.offset));

    const mappedPlugin: BaseExternalPluginAdapter = {
      authority: pluginAuthorityFromBase(record.authority),
      lifecycleChecks:
        isSome(record.lifecycleChecks)
          ? lifecycleChecksFromBase(record.lifecycleChecks.value)
          : undefined,
      offset: record.offset,
    };

    switch (deserializedPlugin.__kind) {
      case 'DataSection':
        if (!result.dataSections) {
          result.dataSections = [];
        }
        result.dataSections.push({
          dataLen: unwrapOption(record.dataLen),
          dataOffset: unwrapOption(record.dataOffset),
          type: 'DataSection',
          ...mappedPlugin,
          ...dataSectionFromBase(deserializedPlugin.fields[0], record, accountData),
        });
        break;

      case 'AppData':
        if (!result.appDatas) {
          result.appDatas = [];
        }
        result.appDatas.push({
          dataLen: unwrapOption(record.dataLen),
          dataOffset: unwrapOption(record.dataOffset),
          type: 'AppData',
          ...mappedPlugin,
          ...appDataFromBase(deserializedPlugin.fields[0], record, accountData),
        });
        break;
      
      case 'LinkedAppData':
        if (!result.linkedAppDatas) {
          result.linkedAppDatas = [];
        }
        result.linkedAppDatas.push({
          type: 'LinkedAppData',
          ...mappedPlugin,
          ...linkedAppDataFromBase(
            deserializedPlugin.fields[0],
            record,
            accountData
          ),
        });
        break;

      case 'LifecycleHook':
      case 'Oracle':
      case 'LinkedLifecycleHook':
      default:
        throw new Error(`Unsupported plugin type: ${deserializedPlugin.__kind}`);
    }
  });

  return result;
}
