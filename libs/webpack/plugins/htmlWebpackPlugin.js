"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("../../utils/env");
const EConfig_1 = require("../../settings/EConfig");
const path = require("path");
const fs = require("fs");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const minify = require('html-minifier').minify;
const { apps, htmlWebpackPlugin: { title } } = EConfig_1.default.getInstance();
function htmlWebpackPluginInstance(templatePath, filename, chunks) {
    return new HtmlWebpackPlugin({
        template: templatePath,
        filename: filename,
        minify: env_1.isDev() ? false : minify,
        hash: !env_1.isDev(),
        alwaysWriteToDisk: true,
        chunks: chunks,
        title: 'webApp'
    });
}
function getHtmlWebpackPlugins(entries) {
    return (entries || apps).map((app) => {
        const workingDirectory = process.cwd();
        const relativeTargetDirectory = `${app}`;
        const relativeTargetHtml = path.join(relativeTargetDirectory, '/index.html');
        const projectTargetPath = path.resolve(workingDirectory, relativeTargetHtml);
        if (fs.existsSync(projectTargetPath)) {
            return htmlWebpackPluginInstance(projectTargetPath, relativeTargetHtml, [app, 'common']);
        }
        else {
            const baseTarget = path.resolve(__dirname, '../../../tpl/index.ejs');
            return htmlWebpackPluginInstance(baseTarget, relativeTargetHtml, [app, 'common']);
        }
    });
}
exports.default = getHtmlWebpackPlugins;
