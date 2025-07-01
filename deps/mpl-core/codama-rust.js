export default {
  idl: './mpl-core.json',
  before: [
    './custom_visitors.ts#program',
    './custom_visitors.ts#transformProgramNode',
    './custom_visitors.ts#accounts',
    './custom_visitors.ts#pdas',
    './custom_visitors.ts#definedTypes',
    './custom_visitors.ts#instructions',
    './custom_visitors.ts#discriminators',
  ],
  scripts: {
    rust: {
      from: '@codama/renderers-rust',
      args: [
        './deps/mpl-core/rust/src/generated',
        {
          crateFolder: './deps/mpl-core/rust',
          formatCode: true,
          anchorTraits: false,
          traitOptions: {
            baseDefaults: [
              'anchor_lang::prelude::AnchorSerialize',
              'anchor_lang::prelude::AnchorDeserialize',
              'Clone',
              'Debug',
              'Eq',
              'PartialEq',
            ],
            scalarEnumDefaults: ['Copy', 'num_derive::FromPrimitive'],
          },
        }
      ]
    },
  },
}
