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
