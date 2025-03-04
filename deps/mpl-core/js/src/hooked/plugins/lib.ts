import type { Option } from '@solana/kit';
import { isSome } from '@solana/kit';

import { BasePluginAuthority, ExternalPluginAdapterSchema,getPluginDecoder, Plugin as BasePlugin, RegistryRecord } from '../../generated';
import { masterEditionFromBase } from './masterEdition';
import { PluginAuthority, PluginsList } from './types';

export function pluginAuthorityFromBase(
  authority: BasePluginAuthority
): PluginAuthority {
  return {
    address: (authority as any).address,
    type: authority.__kind,
  };
}

export function mapPluginFields(fields: readonly Record<string, any>[]) {
  return fields.reduce((acc2, field) => ({ ...acc2, ...field }), {});
}

export function mapPlugin({
  plugin: plug,
  authority,
  offset,
}: {
  authority: PluginAuthority;
  offset: bigint;
  plugin: Exclude<BasePlugin, { __kind: 'Reserved' }>;
}): PluginsList {
  const pluginKey = plug.__kind.replace(/^./, c => c.toLowerCase())

  if (plug.__kind === 'MasterEdition') {
    return {
      [pluginKey]: {
        authority,
        offset,
        ...masterEditionFromBase(plug.fields[0]),
      },
    };
  }

  return {
    [pluginKey]: {
      authority,
      offset,
      ...('fields' in plug ? mapPluginFields(plug.fields) : {}),
    },
  };
}

export function registryRecordsToPluginsList(
  registryRecords: RegistryRecord[],
  accountData: Uint8Array
) {
  return registryRecords.reduce((acc: PluginsList, record) => {
    const mappedAuthority = pluginAuthorityFromBase(record.authority);
    const deserializedPlugin = getPluginDecoder().decode(accountData, Number(record.offset));

    acc = {
      ...acc,
      ...mapPlugin({
        authority: mappedAuthority,
        offset: record.offset,
        plugin: deserializedPlugin,
      }),
    };

    return acc;
  }, {});
}

export function parseExternalPluginAdapterData(
  plugin: {
    schema: ExternalPluginAdapterSchema;
  },
  record: {
    dataLen: Option<bigint | number>;
    dataOffset: Option<bigint | number>;
  },
  account: Uint8Array
): any {
  let data: any;
  if (isSome(record.dataOffset) && isSome(record.dataLen)) {
    const dataSlice = account.slice(
      Number(record.dataOffset.value),
      Number(record.dataOffset.value) + Number(record.dataLen.value)
    );

    if (plugin.schema === ExternalPluginAdapterSchema.Binary) {
      data = dataSlice;
    } else if (plugin.schema === ExternalPluginAdapterSchema.Json) {
      // if data is empty, the data slice is uninitialized and should be ignored
      if (dataSlice.length !== 0) {
        try {
          data = JSON.parse(new TextDecoder().decode(dataSlice));
        } catch (e) {
          if (e instanceof Error) {
            console.warn('Invalid JSON in external plugin data', e.message);
          }
        }
      }
    } else if (plugin.schema === ExternalPluginAdapterSchema.MsgPack) {
      throw new Error('MsgPack schema is not supported yet');
    }
    return data;
  }
  throw new Error('Invalid DataStore, missing dataOffset or dataLen');
}
