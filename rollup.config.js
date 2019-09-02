const path = require('path');

const resolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");
const sourceMaps = require("rollup-plugin-sourcemaps");
const typescript = require("rollup-plugin-typescript2");
const autoExternal = require("rollup-plugin-auto-external");
const json = require("rollup-plugin-json");
const { terser } = require("rollup-plugin-terser");
const { sizeSnapshot } = require("rollup-plugin-size-snapshot");

const pkg = require("./package.json");
const fileName = path.parse(pkg.main).name;

module.exports = {
  input: `src/index.ts`,
  output: [
    {
      file: `dist/${fileName}.js`,
      format: "cjs",
      sourcemap: true
    },
    { file: `dist/${fileName}.mjs`, format: "es", sourcemap: true },
    { file: `dist/${fileName}.umd.js`, name: pkg.main, format: "umd", sourcemap: true }
  ],
  // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
  external: [
    'lodash',
    'winston',
    'object-hash',
    'mobx'
  ],
  watch: {
    include: "src/**"
  },
  plugins: [
    // Allow json resolution
    json(),
    // Compile TypeScript files
    typescript(),
    // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
    commonjs(),
    autoExternal(),
    // Allow node_modules resolution, so you can use 'external' to control
    // which external modules to include in the bundle
    // https://github.com/rollup/rollup-plugin-node-resolve#usage
    resolve(),

    // Resolve source maps to the original source
    sourceMaps(),
    sizeSnapshot(),
    terser({ compress: true }),
  ]
};
