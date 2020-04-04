"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EConfig_1 = require("../settings/EConfig");
const webpackCompiler_1 = require("./webpackCompiler");
const webpackDevServer = require('webpack-dev-server');
const webpack_config_1 = require("../../webpack.config");
const logs_1 = require("../utils/logs");
const constants_1 = require("../constants/constants");
const eConfig = EConfig_1.default.getInstance();
const { name: projectName, apps } = eConfig;
/**
 * 启动webpack服务器
 */
function startWebpackDevServer(cmd) {
    return new Promise((resolve, reject) => {
        const { server } = eConfig;
        if (cmd.cssModules !== undefined) {
            if (cmd.cssModules === 'true') {
                eConfig.webpack.cssModules.enable = true;
            }
            if (cmd.cssModules === 'false') {
                eConfig.webpack.cssModules.enable = false;
            }
        }
        const config = webpack_config_1.default(eConfig);
        webpackDevServer.addDevServerEntrypoints(config, config.devServer);
        new webpackDevServer(webpackCompiler_1.default(cmd), config.devServer).listen(eConfig.defaultPort, server, err => {
            if (err) {
                reject(err);
            }
            logs_1.log(`监听本地 ${server}:${eConfig.defaultPort}`);
            logs_1.log(`server: http://localhost:${eConfig.defaultPort}/${constants_1.URL_PREFIX}/${projectName}/${apps.length ? apps[0] : ''}`);
            //console.log(`监听本地 ${server}:${eConfig.defaultPort}`);
            resolve();
        });
    });
}
exports.default = startWebpackDevServer;
