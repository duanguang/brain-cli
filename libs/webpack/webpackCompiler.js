"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const format_1 = require("../utils/format");
const webpack_config_1 = require("../../webpack.config");
const EConfig_1 = require("../settings/EConfig");
const logs_1 = require("../utils/logs");
const constants_1 = require("../constants/constants");
const webpack = require('webpack');
function webpackCompiler(options) {
    const webpackConfig = webpack_config_1.default(EConfig_1.default.getInstance());
    if (Array.isArray(webpackConfig.pendings)) {
        webpackConfig.pendings.forEach(pending => pending());
    }
    delete webpackConfig.pendings;
    const webpackCompiler = webpack(webpackConfig);
    const { name: projectName, apps, defaultPort } = EConfig_1.default.getInstance();
    let bundleStartTime;
    webpackCompiler.plugin('compile', () => {
        logs_1.log('打包中...');
        //console.info('打包中...');
        bundleStartTime = Date.now();
    });
    webpackCompiler.plugin('done', () => {
        const timeSpent = Date.now() - bundleStartTime;
        logs_1.log(`打包完成, 耗时 ${format_1.asSeconds(timeSpent)} s. ${new Date()}`);
        logs_1.log(`server: http://localhost:${defaultPort}/${constants_1.URL_PREFIX}/${projectName}/${apps.length ? apps[0] : ''}`);
        //console.info(`打包完成, 耗时 ${asSeconds(timeSpent)} s. ${new Date()}`);
    });
    return webpackCompiler;
}
exports.default = webpackCompiler;
