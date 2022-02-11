module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'eslint-plugin-tsdoc'],
  extends: [
    'airbnb-base',
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  root: true,
  env: {
    node: true,
    jest: true,
  },
  rules: {
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'no-restricted-syntax': 'off',
    'no-shadow': 'off',
    'no-useless-constructor': 'off',
    'import/prefer-default-export': 'off',
    'prettier/prettier': 'error',
    'class-methods-use-this': 'off',
    'no-underscore-dangle': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    camelcase: 'off',
    'import/no-cycle': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '_',
      },
    ],
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        ts: 'never',
      },
    ],
    'tsdoc/syntax': 'warn',
    'prettier/prettier': [
      'error',
      {
        'endOfLine': 'auto',
        'singleQuote': true,
        'bracketSpacing': true,
        'jsxBracketSameLine': true,
        'printWidth': 80,
        'maxClassesPerFile': false,
      }
    ],
    "max-classes-per-file": ["error", 10],
  },
  settings: {
    'import/resolver': {
      typescript: {},
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts'],
    },
  },
};
