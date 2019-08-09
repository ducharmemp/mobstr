const path = require('path');

module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
  },
  settings: {
    "import/resolver": {
      node: {
        paths: [path.resolve(__dirname, 'src')],
        extensions: [".js", ".jsx", ".ts", ".tsx"]
      }
    }
  },
  parser:  '@typescript-eslint/parser',
  extends: [
    'airbnb',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: [
    'react',
  ],
  rules: {
    'no-underscore-dangle': 0,
    'no-param-reassign': 0,
    "complexity": ["error", 2]
  },
};
