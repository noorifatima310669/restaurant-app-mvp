const globals = require('globals');
const react = require('eslint-plugin-react');
const hooks = require('eslint-plugin-react-hooks');
module.exports = [
  { ignores: ['**/node_modules/**', 'dist/**', '.tools/**', 'server/data/extract-seed.cjs'] },
  { files: ['App.js', 'src/**/*.js'], languageOptions: { ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } }, globals: { ...globals.browser, ...globals.node, __DEV__: 'readonly' } },
    plugins: { react, 'react-hooks': hooks }, settings: { react: { version: 'detect' } },
    rules: { 'no-undef': 'error', 'no-unreachable': 'error', 'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^React$' }], 'react/jsx-uses-react': 'error', 'react/jsx-uses-vars': 'error', 'react-hooks/rules-of-hooks': 'error', 'react-hooks/exhaustive-deps': 'error' } },
  { files: ['server/**/*.js'], languageOptions: { ecmaVersion: 'latest', sourceType: 'commonjs', globals: globals.node },
    rules: { 'no-undef': 'error', 'no-unreachable': 'error', 'no-unused-vars': ['error', { argsIgnorePattern: '^_' }] } },
];
