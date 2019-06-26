"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EConfig_1 = require("../settings/EConfig");
const webpackCompiler_1 = require("./webpackCompiler");
const WebpackDevServer = require('webpack-dev-server');
const webpack_config_1 = require("../../webpack.config");
const logs_1 = require("../utils/logs");
const eConfig = EConfig_1.default.getInstance();
/**
 * 启动webpack服务器
 */
function startWebpackDevServer() {
    return new Promise((resolve, reject) => {
        const { server } = eConfig;
        const config = webpack_config_1.default(eConfig);
        new WebpackDevServer(webpackCompiler_1.default(), config.devServer).listen(eConfig.defaultPort, server, err => {
            if (err) {
                reject(err);
            }
            logs_1.log(`监听本地 ${server}:${eConfig.defaultPort}`);
            //console.log(`监听本地 ${server}:${eConfig.defaultPort}`);
            resolve();
        });
    });
}
exports.default = startWebpackDevServer;
