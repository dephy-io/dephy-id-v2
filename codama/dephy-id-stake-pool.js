import { addPdasVisitor, constantPdaSeedNodeFromString, updateProgramsVisitor, variablePdaSeedNode, publicKeyTypeNode } from 'codama';

export const program = updateProgramsVisitor({
  dephyIoDephyIdStakePool: { name: 'dephyIdStakePool' },
})

export const pdas = addPdasVisitor({
  dephyIdStakePool: [{
    name: 'adminAccount',
    seeds: [constantPdaSeedNodeFromString('utf8', 'ADMIN')],
  }, {
    name: 'stakeTokenAccount',
    seeds: [variablePdaSeedNode('stakePool', publicKeyTypeNode()), constantPdaSeedNodeFromString('utf8', 'STAKE_TOKEN')],
  }, {
    name: 'poolWallet',
    seeds: [variablePdaSeedNode('stakePool', publicKeyTypeNode()), constantPdaSeedNodeFromString('utf8', 'POOL_WALLET')],
  }, {
    name: 'userStakeAccount',
    seeds: [variablePdaSeedNode('nftStake', publicKeyTypeNode()), constantPdaSeedNodeFromString('utf8', 'USER_STAKE'), variablePdaSeedNode('user', publicKeyTypeNode())],
  }, {
    name: 'announcedConfig',
    seeds: [variablePdaSeedNode('stakePool', publicKeyTypeNode()), constantPdaSeedNodeFromString('utf8', 'ANNOUNCED_CONFIG')],
  }]
})


export default {
  idl: '../target/idl/dephy_id_stake_pool.json',
  before: [
    './dephy-id-stake-pool.js#program',
    './dephy-id-stake-pool.js#pdas',
  ],
  scripts: {
    js: {
      from: '@codama/renderers-js',
      args: [
        'clients/dephy-id-stake-pool/js/src/generated',
        {
          nameTransformers: {
            // to avoid conflict with XXXArgs
            dataArgsType: (name, { pascalCase }) => {
              return `${pascalCase(name)}Args_`
            }
          }
        }
      ]
    },
    // rust: {
    //   from: '@codama/renderers-rust',
    //   args: [
    //     'clients/dephy-id-stake-pool/rust/src/generated',
    //     {
    //       crateFolder: 'clients/dephy-id-stake-pool/rust',
    //       formatCode: true,
    //     }
    //   ]
    // }
  }
}
