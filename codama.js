export default {
  idl: 'target/idl/dephy_id.json',
  before: [
    './scripts/custom_visitors.ts#program',
    './scripts/custom_visitors.ts#pdas',
    './scripts/custom_visitors.ts#instructions',
  ],
  scripts: {
    js: {
      from: '@codama/renderers-js',
      args: [
        'clients/js/src/generated',
      ]
    },
    rust: {
      from: '@codama/renderers-rust',
      args: [
        'clients/rust/src/generated',
        {
          crateFolder: 'clients/rust',
          formatCode: true,
        }
      ]
    }
  }
}
