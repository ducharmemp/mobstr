const resolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");
const sourceMaps = require("rollup-plugin-sourcemaps");
const typescript = require("rollup-plugin-typescript2");
const autoExternal = require("rollup-plugin-auto-external");
const json = require("rollup-plugin-json");
const { terser } = require("rollup-plugin-terser");

const pkg = require("./package.json");

module.exports = {
  input: `src/index.ts`,
  output: [
    {
      file: pkg.main,
      name: pkg.name,
      format: "umd",
      sourcemap: true
    },
    // { file: pkg.main, format: "es", sourcemap: true }
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
    (process.env.NODE_ENV === 'production' && terser())
  ]
};
