import { addPdasVisitor, constantPdaSeedNodeFromString, updateProgramsVisitor } from 'codama';

export const program = updateProgramsVisitor({
  dephyIoDephyIdStakePool: { name: 'dephyIdStakePool' },
})

export const pdas = addPdasVisitor({
  dephyIdStakePool: [{
    name: 'adminAccount',
    seeds: [constantPdaSeedNodeFromString('utf8', 'ADMIN')],
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
