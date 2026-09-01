(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "path", "./base", "../libs/webpack/plugins/LegionExtractStaticFilePlugin"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const path = require("path");
    const base_1 = require("./base");
    const LegionExtractStaticFilePlugin_1 = require("../../libs/webpack/plugins/LegionExtractStaticFilePlugin");
    const { SwcJsMinimizerRspackPlugin, LightningCssMinimizerRspackPlugin } = require('@rspack/core');
    const CopyWebpackPlugin = require('copy-webpack-plugin');
    const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
    /**
     * Rspack build 配置：
     * - 双压缩器对齐 webpack 版行为（JS: drop_console/drop_debugger/去注释；CSS: 压缩）
     * - LegionExtract + CopyPlugin static→common 对齐 webpack 版 dist 分支
     * - `-s` report 模式透传（低兼容风险验证项，失败则 report 仅 webpack 引擎可用）
     */
    function getRspackDistConfig(eConfig) {
        const config = (0, base_1.default)(eConfig);
        config.devtool = false;
        config.mode = 'production';
        config.optimization.minimizer = [
            new SwcJsMinimizerRspackPlugin({
                extractComments: false,
                minimizerOptions: {
                    compress: { drop_console: true, drop_debugger: true },
                },
            }),
            new LightningCssMinimizerRspackPlugin(),
        ];
        config.plugins.push(new LegionExtractStaticFilePlugin_1.default());
        config.plugins.push(new CopyWebpackPlugin({
            patterns: [{
                    from: path.join(process.cwd(), 'static'),
                    to: 'common',
                    globOptions: { ignore: ['.*'] },
                }],
        }));
        if (process.env.environment === 'report') {
            config.plugins.push(new BundleAnalyzerPlugin());
        }
        return config;
    }
    exports.default = getRspackDistConfig;
});
