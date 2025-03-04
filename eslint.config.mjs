import solanaConfigs from '@solana/eslint-config-solana'

export default [
  ...solanaConfigs,
  {
    rules: {
      'sort-keys-fix/sort-keys-fix': 'off',
      'typescript-sort-keys/interface': 'off',
      '@typescript-eslint/sort-type-constituents': 'off',
    }
  }
]
