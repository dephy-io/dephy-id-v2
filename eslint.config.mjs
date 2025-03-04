import solanaConfigs from '@solana/eslint-config-solana'

export default [
  ...solanaConfigs,
  {
    rules: {
      'typescript-sort-keys/interface': 'off',
      '@typescript-eslint/sort-type-constituents': 'off',
    }
  }
]
