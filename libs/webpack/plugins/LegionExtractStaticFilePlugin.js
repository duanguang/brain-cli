(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "webpack"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const webpack_1 = require("webpack");
    /**
     * LegionExtractStaticFilePlugin
     *
     * 将模块级别的静态资源重新定位到对应的 chunk 目录下，
     * 并清理根目录下的重复资源。
     *
     * WP5 Migration:
     * - compiler.plugin() → compiler.hooks.compilation.tap()
     * - compilation.plugin('before-chunk-assets') → compilation.hooks.processAssets.tap()
     * - mainTemplate.plugin('asset-path') → Removed (MiniCssExtractPlugin handles CSS placement)
     * - compilation.plugin('emit') → merged into processAssets
     */
    function LegionExtractStaticFilePlugin(options) {
        this.options = options;
    }
    exports.default = LegionExtractStaticFilePlugin;
    LegionExtractStaticFilePlugin.prototype.apply = function (compiler) {
        compiler.hooks.compilation.tap('LegionExtractStaticFilePlugin', (compilation) => {
            compilation.hooks.processAssets.tap({
                name: 'LegionExtractStaticFilePlugin',
                stage: webpack_1.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE,
            }, () => {
                const chunks = [...compilation.chunks];
                if (!chunks.length)
                    return;
                for (const module of compilation.modules) {
                    if (!module.assets || !Object.keys(module.assets).length)
                        continue;
                    const moduleChunks = module.getChunks
                        ? [...module.getChunks()]
                        : [];
                    if (!moduleChunks.length)
                        continue;
                    const assetKeys = Object.keys(module.assets);
                    for (const key of assetKeys) {
                        for (const chunk of moduleChunks) {
                            if (chunk.name && key in compilation.assets) {
                                const newPath = `${chunk.name}/${key}`;
                                if (!(newPath in compilation.assets)) {
                                    compilation.assets[newPath] = compilation.assets[key];
                                }
                            }
                        }
                        delete compilation.assets[key];
                    }
                }
            });
        });
    };
});
