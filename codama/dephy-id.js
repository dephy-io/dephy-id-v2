import {
  accountValueNode, addPdasVisitor, argumentValueNode,
  bytesTypeNode, constantPdaSeedNodeFromString,
  noneValueNode, payerValueNode, pdaSeedValueNode,
  pdaValueNode, publicKeyTypeNode, stringTypeNode,
  updateInstructionsVisitor, updateProgramsVisitor, variablePdaSeedNode,
} from 'codama';

export const program = updateProgramsVisitor({
  dephyIoDephyId: { name: 'dephyId' },
})

export const pdas = addPdasVisitor({
  dephyId: [{
    name: 'dephyAccount',
    seeds: [constantPdaSeedNodeFromString('utf8', 'DePHY_ID')],
  }, {
    name: 'productAsset',
    seeds: [
      constantPdaSeedNodeFromString('utf8', "DePHY_ID-PRODUCT"),
      variablePdaSeedNode('vendor', publicKeyTypeNode()),
      variablePdaSeedNode('product_name', stringTypeNode('utf8')),
    ]
  }, {
    name: 'deviceAsset',
    seeds: [
      constantPdaSeedNodeFromString('utf8', "DePHY_ID-DEVICE"),
      variablePdaSeedNode('product_asset', publicKeyTypeNode()),
      variablePdaSeedNode('device_seed', bytesTypeNode()),
    ]
  }, {
    name: 'productAccount',
    seeds: [
      variablePdaSeedNode('product_asset', publicKeyTypeNode()),
    ]
  }]
})

export const instructions = updateInstructionsVisitor({
  initialize: {
    accounts: {
      dephy: { defaultValue: pdaValueNode('dephyAccount') },
      payer: { defaultValue: payerValueNode() },
    },
  },
  createProduct: {
    accounts: {
      payer: { defaultValue: payerValueNode() },
      productAsset: {
        defaultValue: pdaValueNode('productAsset', [
          pdaSeedValueNode('vendor', accountValueNode('vendor')),
          pdaSeedValueNode('product_name', argumentValueNode('name')),
        ])
      },
    },
  },
  createDevice: {
    arguments: {
      expiry: { defaultValue: noneValueNode() },
    },
    accounts: {
      deviceAsset: {
        defaultValue: pdaValueNode('deviceAsset', [
          pdaSeedValueNode('product_asset', accountValueNode('product_asset')),
          pdaSeedValueNode('device_seed', argumentValueNode('seed')),
        ])
      },
      payer: { defaultValue: payerValueNode() },
    },
  },
})


export default {
  idl: '../target/idl/dephy_id.json',
  before: [
    './dephy-id.js#program',
    './dephy-id.js#pdas',
    './dephy-id.js#instructions',
  ],
  scripts: {
    js: {
      from: '@codama/renderers-js',
      args: [
        'clients/dephy-id/js/src/generated',
      ]
    },
    // rust: {
    //   from: '@codama/renderers-rust',
    //   args: [
    //     'clients/dephy-id/rust/src/generated',
    //     {
    //       crateFolder: 'clients/dephy-id/rust',
    //       formatCode: true,
    //     }
    //   ]
    // }
  }
}
