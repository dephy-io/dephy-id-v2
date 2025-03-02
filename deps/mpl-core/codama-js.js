export default {
  idl: './mpl-core.json',
  before: [
    './custom_visitors.ts#program',
    './custom_visitors.ts#transformProgramNode',
    './custom_visitors.ts#pdas',
    './custom_visitors.ts#definedTypes',
    './custom_visitors.ts#instructions',
    './custom_visitors.ts#discriminators',
    './custom_visitors.ts#definedTypes_js',
  ],
  scripts: {
    js: {
      from: '@codama/renderers-js',
      args: [
        './deps/mpl-core/js/src/generated'
      ]
    }
  },
}
