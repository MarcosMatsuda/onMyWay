const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');
const eslintPluginPrettier = require('eslint-plugin-prettier');
const importPlugin = require('eslint-plugin-import');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

module.exports = [
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*'],
  },
  ...compat.extends('expo', 'prettier'),
  {
    files: ['src/**/*.{ts,tsx,js,jsx}'],
    plugins: {
      prettier: eslintPluginPrettier,
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        alias: {
          map: [
            ['@domain', './src/domain'],
            ['@data', './src/data'],
            ['@infrastructure', './src/infrastructure'],
            ['@presentation', './src/presentation'],
          ],
          extensions: ['.ts', '.tsx', '.js', '.jsx'],
        },
      },
    },
    rules: {
      'prettier/prettier': 'error',
      'import/no-unresolved': ['error', { ignore: ['^@', '^expo-', '^axios'] }],
    },
  },
];
