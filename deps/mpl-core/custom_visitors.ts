import {
  accountNode,
  addPdasVisitor,
  arrayValueNode,
  bottomUpTransformerVisitor,
  bytesTypeNode,
  constantPdaSeedNodeFromString,
  enumValueNode,
  noneValueNode,
  pdaValueNode,
  type ProgramNode,
  programNode,
  publicKeyTypeNode,
  publicKeyValueNode,
  setAccountDiscriminatorFromFieldVisitor,
  structFieldTypeNode,
  structTypeNode,
  updateAccountsVisitor,
  updateDefinedTypesVisitor,
  updateInstructionsVisitor,
  updateProgramsVisitor, variablePdaSeedNode,
} from 'codama';


export const program = updateProgramsVisitor({
  mplCoreProgram: { name: 'mplCore' },
})


export const transformProgramNode = bottomUpTransformerVisitor([{
  select: ['[programNode]', node => 'name' in node && node.name === "mplCore"],
  transform: (node: ProgramNode) => {
    return programNode({
      ...node,
      accounts: [
        ...node.accounts,
        accountNode({
          name: "assetSigner",
          size: 0,
          data: structTypeNode([
            structFieldTypeNode({
              name: "data",
              type: bytesTypeNode(),
            })
          ]),
        }),
      ],
    });
  },
}])

export const pdas = addPdasVisitor({
  mplCore: [{
    name: "assetSigner",
    seeds: [
      constantPdaSeedNodeFromString('utf8', "mpl-core-execute"),
      variablePdaSeedNode(
        "asset",
        publicKeyTypeNode(),
        "The address of the asset account"
      ),
    ],
  }],
})

export const accounts = updateAccountsVisitor({
  assetV1: {
    name: "baseAssetV1",
  },
  collectionV1: {
    name: "baseCollectionV1",
  },
})

export const definedTypes = updateDefinedTypesVisitor({
  authority: {
    name: "pluginAuthority"
  }
})

// Update instructions with default values
export const instructions = updateInstructionsVisitor({
  // create: {
  //   bytesCreatedOnChain: c.bytesFromAccount("assetAccount"),
  // },
  transferV1: {
    arguments: {
      compressionProof: {
        defaultValue: noneValueNode()
      }
    }
  },
  addPluginV1: {
    arguments: {
      initAuthority: {
        defaultValue: noneValueNode()
      }
    }
  },
  addCollectionPluginV1: {
    arguments: {
      initAuthority: {
        defaultValue: noneValueNode()
      }
    }
  },
  burnV1: {
    arguments: {
      compressionProof: {
        defaultValue: noneValueNode()
      }
    }
  },
  createV1: {
    arguments: {
      plugins: {
        defaultValue: arrayValueNode([])
      },
      dataState: {
        defaultValue: enumValueNode('DataState', 'AccountState')
      }
    }
  },
  createV2: {
    arguments: {
      plugins: {
        defaultValue: arrayValueNode([])
      },
      externalPluginAdapters: {
        defaultValue: arrayValueNode([])
      },
      dataState: {
        defaultValue: enumValueNode('DataState', 'AccountState')
      }
    }
  },
  createCollectionV1: {
    arguments: {
      plugins: {
        defaultValue: noneValueNode()
      }
    }
  },
  createCollectionV2: {
    arguments: {
      plugins: {
        defaultValue: noneValueNode()
      },
      externalPluginAdapters: {
        defaultValue: arrayValueNode([])
      },
    }
  },
  collect: {
    accounts: {
      recipient1: {
        defaultValue: publicKeyValueNode("8AT6o8Qk5T9QnZvPThMrF9bcCQLTGkyGvVZZzHgCw11v")
      },
      recipient2: {
        defaultValue: publicKeyValueNode("MmHsqX4LxTfifxoH8BVRLUKrwDn1LPCac6YcCZTHhwt")
      }
    }
  },
  updateV1: {
    arguments: {
      newUpdateAuthority: {
        defaultValue: noneValueNode()
      },
      newName: {
        defaultValue: noneValueNode()
      },
      newUri: {
        defaultValue: noneValueNode()
      },
    }
  },
  updateV2: {
    arguments: {
      newUpdateAuthority: {
        defaultValue: noneValueNode()
      },
      newName: {
        defaultValue: noneValueNode()
      },
      newUri: {
        defaultValue: noneValueNode()
      },
    }
  },
  updateCollectionV1: {
    arguments: {
      newName: {
        defaultValue: noneValueNode()
      },
      newUri: {
        defaultValue: noneValueNode()
      },
    }
  },
  executeV1: {
    accounts: {
      assetSigner: {
        defaultValue: pdaValueNode("assetSigner")
      }
    }
  },
})


const key = (name: string) => ({ field: "key", value: enumValueNode("Key", name) });
export const discriminators = setAccountDiscriminatorFromFieldVisitor({
  assetV1: key("AssetV1"),
  collectionV1: key("CollectionV1"),
})


export const definedTypes_js = updateDefinedTypesVisitor({
  ruleSet: {
    name: "baseRuleSet"
  },
  royalties: {
    name: "baseRoyalties"
  },
  pluginAuthority: {
    name: "basePluginAuthority"
  },
  updateAuthority: {
    name: "baseUpdateAuthority"
  },
  seed: {
    name: "baseSeed"
  },
  extraAccount: {
    name: "baseExtraAccount"
  },
  externalPluginAdapterKey: {
    name: "baseExternalPluginAdapterKey"
  },
  linkedDataKey: {
    name: 'baseLinkedDataKey'
  },
  externalPluginAdapterInitInfo: {
    name: "baseExternalPluginAdapterInitInfo"
  },
  externalPluginAdapterUpdateInfo: {
    name: "baseExternalPluginAdapterUpdateInfo"
  },
  oracle: {
    name: "baseOracle"
  },
  oracleInitInfo: {
    name: "baseOracleInitInfo"
  },
  oracleUpdateInfo: {
    name: "baseOracleUpdateInfo"
  },
  lifecycleHook: {
    name: "baseLifecycleHook"
  },
  lifecycleHookInitInfo: {
    name: "baseLifecycleHookInitInfo"
  },
  lifecycleHookUpdateInfo: {
    name: "baseLifecycleHookUpdateInfo"
  },
  linkedLifecycleHook: {
    name: "baseLinkedLifecycleHook"
  },
  linkedLifecycleHookInitInfo: {
    name: "baseLinkedLifecycleHookInitInfo"
  },
  linkedLifecycleHookUpdateInfo: {
    name: "baseLinkedLifecycleHookUpdateInfo"
  },
  appData: {
    name: "baseAppData"
  },
  appDataInitInfo: {
    name: "baseAppDataInitInfo"
  },
  appDataUpdateInfo: {
    name: "baseAppDataUpdateInfo"
  },
  linkedAppData: {
    name: "baseLinkedAppData"
  },
  linkedAppDataInitInfo: {
    name: "baseLinkedAppDataInitInfo"
  },
  linkedAppDataUpdateInfo: {
    name: "baseLinkedAppDataUpdateInfo"
  },
  dataSection: {
    name: "baseDataSection"
  },
  dataSectionInitInfo: {
    name: "baseDataSectionInitInfo"
  },
  dataSectionUpdateInfo: {
    name: "baseDataSectionUpdateInfo"
  },
  validationResultsOffset: {
    name: "baseValidationResultsOffset"
  },
  masterEdition: {
    name: "baseMasterEdition"
  }
})
