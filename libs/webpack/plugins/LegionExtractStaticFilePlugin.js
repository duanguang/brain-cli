(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * WP5 Migration:
     * - compiler.plugin() → compiler.hooks.compilation.tap()
     * - compilation.plugin('before-chunk-assets') → compilation.hooks.processAssets.tap()
     * - mainTemplate.plugin('asset-path') → Removed (MiniCssExtractPlugin handles CSS placement)
     * - compiler.plugin('emit') → merged into processAssets
     */
    function LegionExtractStaticFilePlugin(options) {
        this.options = options;
    }
    exports.default = LegionExtractStaticFilePlugin;
    LegionExtractStaticFilePlugin.prototype.apply = function (compiler) {
        compiler.hooks.compilation.tap('LegionExtractStaticFilePlugin', function (compilation) {
            compilation.hooks.processAssets.tap({
                name: 'LegionExtractStaticFilePlugin',
                stage: compilation.constructor.PROCESS_ASSETS_STAGE_OPTIMIZE,
            }, function () {
                var chunks = Array.from(compilation.chunks);
                if (!chunks.length) return;
                var modules = Array.from(compilation.modules);
                for (var _i = 0; _i < modules.length; _i++) {
                    var module_1 = modules[_i];
                    if (!module_1.assets || !Object.keys(module_1.assets).length) continue;
                    var moduleChunks = module_1.getChunks
                        ? Array.from(module_1.getChunks())
                        : [];
                    if (!moduleChunks.length) continue;
                    var assetKeys = Object.keys(module_1.assets);
                    for (var _a = 0; _a < assetKeys.length; _a++) {
                        var key = assetKeys[_a];
                        for (var _b = 0; _b < moduleChunks.length; _b++) {
                            var chunk = moduleChunks[_b];
                            if (chunk.name && key in compilation.assets) {
                                var newPath = chunk.name + "/" + key;
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
