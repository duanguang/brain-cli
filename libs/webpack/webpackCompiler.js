"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const format_1 = require("../utils/format");
const webpack_config_1 = require("../../webpack.config");
const EConfig_1 = require("../settings/EConfig");
const logs_1 = require("../utils/logs");
const webpack = require('webpack');
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
const smp = new SpeedMeasurePlugin();
function webpackCompiler(cmd) {
    const webpackConfig = webpack_config_1.default(EConfig_1.default.getInstance());
    if (Array.isArray(webpackConfig.pendings)) {
        webpackConfig.pendings.forEach(pending => pending());
    }
    delete webpackConfig.pendings;
    const webpackCompiler = webpack((cmd && cmd.smp === 'true') ? smp.wrap(webpackConfig) : webpackConfig);
    let bundleStartTime;
    webpackCompiler.plugin('compile', () => {
        logs_1.log('打包中...');
        //console.info('打包中...');
        bundleStartTime = Date.now();
    });
    webpackCompiler.plugin('done', () => {
        const timeSpent = Date.now() - bundleStartTime;
        logs_1.log(`打包完成, 耗时 ${format_1.asSeconds(timeSpent)} s. ${new Date()}`);
        //console.info(`打包完成, 耗时 ${asSeconds(timeSpent)} s. ${new Date()}`);
    });
    return webpackCompiler;
}
exports.default = webpackCompiler;
