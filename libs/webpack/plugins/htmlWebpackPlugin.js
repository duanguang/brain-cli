(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../../utils/env", "../../settings/EConfig", "path", "fs"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const env_1 = require("../../utils/env");
    const EConfig_1 = require("../../settings/EConfig");
    const path = require("path");
    const fs = require("fs");
    const HtmlWebpackPlugin = require('html-webpack-plugin');
    const minify = require('html-minifier').minify;
    const { apps, htmlWebpackPlugin: { title }, webpack: { commonsChunkPlugin } } = EConfig_1.default.getInstance();
    function htmlWebpackPluginInstance(templatePath, filename, chunks, chunksSortMode) {
        const options = {
            template: templatePath,
            filename: filename,
            //minify: isDev() ? false :minify,
            hash: !(0, env_1.isDev)(),
            inject: true,
            alwaysWriteToDisk: true,
            chunks: chunks,
            // WP5: chunksSortMode 由 webpack 5 原生处理
            title: title || 'webApp'
        };
        // chunksSortMode 仅在显式指定时设置：v5 对显式 undefined 会覆盖默认 'auto' 并校验失败
        if (chunksSortMode) {
            options.chunksSortMode = chunksSortMode;
        }
        return new HtmlWebpackPlugin(options);
    }
    /**
     * Fast Refresh 时序修复：react-dom 被 splitChunks 抽进先加载的 common chunk 后，
     * 其模块顶层的 devtools hook 注册会先于 refresh runtime 执行而永久失效（renderers=0）。
     * 必须让 refresh runtime 独立成 chunk 并以 manual 模式排进 HTML 最前（refresh → common → app）。
     * 仅 rspack dev 传入 refreshChunk 启用；webpack 引擎与生产构建维持原生 'auto' 依赖排序
     */
    function getHtmlWebpackPlugins(htmlWebpackPlugin, entries, refreshChunk) {
        return (entries() || apps).map((app) => {
            const workingDirectory = process.cwd();
            const chunk = [...new Set(commonsChunkPlugin.concat(['common']))];
            const relativeTargetDirectory = `${app}`;
            const relativeTargetHtml = path.join(relativeTargetDirectory, '/index.html');
            const projectTargetPath = path.resolve(workingDirectory, 'src/', relativeTargetHtml);
            const relativeTargetJSP = path.join(relativeTargetDirectory, '/index.jsp');
            const projectTargetPathJSP = path.resolve(workingDirectory, 'src/', relativeTargetJSP);
            if (refreshChunk) {
                const orderedChunks = [refreshChunk, ...chunk, app];
                const useManual = (templatePath, filename) => htmlWebpackPluginInstance(templatePath, filename, orderedChunks, 'manual');
                if (fs.existsSync(projectTargetPath)) {
                    return useManual(projectTargetPath, relativeTargetHtml);
                }
                else if (fs.existsSync(projectTargetPathJSP)) {
                    return useManual(projectTargetPathJSP, relativeTargetJSP);
                }
                else {
                    const baseTarget = path.resolve(__dirname, '../../../tpl/index.ejs');
                    return useManual(baseTarget, relativeTargetHtml);
                }
            }
            if (fs.existsSync(projectTargetPath)) {
                return htmlWebpackPluginInstance(projectTargetPath, relativeTargetHtml, [app, ...chunk]);
            }
            else if (fs.existsSync(projectTargetPathJSP)) {
                return htmlWebpackPluginInstance(projectTargetPathJSP, relativeTargetJSP, [app, ...chunk]);
            }
            else {
                const baseTarget = path.resolve(__dirname, '../../../tpl/index.ejs');
                return htmlWebpackPluginInstance(baseTarget, relativeTargetHtml, [app, ...chunk]);
            }
        });
    }
    exports.default = getHtmlWebpackPlugins;
});
