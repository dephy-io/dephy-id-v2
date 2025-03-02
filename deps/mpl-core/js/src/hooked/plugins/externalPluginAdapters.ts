import {
  BaseExternalPluginAdapterKey,
  ExternalRegistryRecord,
  getExternalPluginAdapterDecoder,
} from '../../generated';
import {
  lifecycleChecksFromBase,
  LifecycleChecksContainer,
} from './lifecycleChecks';
import { BasePlugin } from './types';
import {
  dataSectionFromBase,
  DataSectionPlugin,
} from './dataSection';
import { isSome, unwrapOption } from '@solana/kit';
import {
  pluginAuthorityFromBase,
} from '.';

export type ExternalPluginAdapterTypeString =
  BaseExternalPluginAdapterKey['__kind'];

export type BaseExternalPluginAdapter = BasePlugin &
  ExternalPluginAdapterData &
  LifecycleChecksContainer;

export type ExternalPluginAdapters =
  // | LifecycleHookPlugin
  // | OraclePlugin
  // | AppDataPlugin
  // | LinkedLifecycleHookPlugin
  // | LinkedAppDataPlugin
  | DataSectionPlugin;

export type ExternalPluginAdaptersList = {
  // lifecycleHooks?: LifecycleHookPlugin[];
  // oracles?: OraclePlugin[];
  // appDatas?: AppDataPlugin[];
  // linkedLifecycleHooks?: LinkedLifecycleHookPlugin[];
  // linkedAppDatas?: LinkedAppDataPlugin[];
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
      lifecycleChecks:
        isSome(record.lifecycleChecks)
          ? lifecycleChecksFromBase(record.lifecycleChecks.value)
          : undefined,
      authority: pluginAuthorityFromBase(record.authority),
      offset: record.offset,
    };

    switch (deserializedPlugin.__kind) {
      case 'DataSection':
        if (!result.dataSections) {
          result.dataSections = [];
        }
        result.dataSections.push({
          type: 'DataSection',
          dataOffset: unwrapOption(record.dataOffset),
          dataLen: unwrapOption(record.dataLen),
          ...mappedPlugin,
          ...dataSectionFromBase(
            deserializedPlugin.fields[0],
            record,
            accountData
          ),
        });
        break;

      case 'LifecycleHook':
      case 'Oracle':
      case 'AppData':
      case 'LinkedLifecycleHook':
      case 'LinkedAppData':
      default:
        throw new Error(`Unsupported plugin type: ${deserializedPlugin.__kind}`);
    }
  });

  return result;
}
