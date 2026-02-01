/* eslint-env node */
module.exports = {
  env: {
    browser: false,
    es2021: true,
    node: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'commonjs',
  },
  globals: {
    require: 'readonly',
    exports: 'readonly',
    module: 'readonly',
    __dirname: 'readonly',
    __filename: 'readonly',
    process: 'readonly',
    Buffer: 'readonly',
    global: 'readonly',
  },
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': 'off', // Allow console.log in Cloud Functions
  },
};
