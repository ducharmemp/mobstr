module.exports = {
    src: ["src/index.ts"],
    module: "commonjs",
    excludeNotExported: true,
    excludePrivate: true,
    excludeProtected: true,
    mode: "file",
    readme: "none",
    out: "./docs",
    tsconfig: "tsconfig.json",
    listInvalidSymbolLinks: true,
    mdHideSources: true,
    readme: "./README.md"
}
