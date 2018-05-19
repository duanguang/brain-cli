"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const format_1 = require("../utils/format");
const webpack_config_1 = require("../../webpack.config");
const EConfig_1 = require("../settings/EConfig");
const webpack = require('webpack');
function webpackCompiler() {
    const webpackConfig = webpack_config_1.default(EConfig_1.default.getInstance());
    if (Array.isArray(webpackConfig.pendings)) {
        webpackConfig.pendings.forEach(pending => pending());
    }
    const webpackCompiler = webpack(webpackConfig);
    let bundleStartTime;
    webpackCompiler.plugin('compile', () => {
        console.info('打包中...');
        bundleStartTime = Date.now();
    });
    webpackCompiler.plugin('done', () => {
        const timeSpent = Date.now() - bundleStartTime;
        console.info(`打包完成, 耗时 ${format_1.asSeconds(timeSpent)} s. ${new Date()}`);
    });
    return webpackCompiler;
}
exports.default = webpackCompiler;
