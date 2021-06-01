(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../settings/EConfig", "./webpackCompiler", "../../webpack.config", "../utils/logs"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /*
     * @Author: duanguang
     * @Date: 2021-06-01 00:16:31
     * @LastEditTime: 2021-06-01 17:50:02
     * @LastEditors: duanguang
     * @Description:
     * @FilePath: /brain-cli/libs/webpack/webpackDevServer.ts
     * 「扫去窗上的尘埃，才可以看到窗外的美景。」
     */
    const EConfig_1 = require("../settings/EConfig");
    const webpackCompiler_1 = require("./webpackCompiler");
    const WebpackDevServer = require('webpack-dev-server');
    const webpack_config_1 = require("../../webpack.config");
    const logs_1 = require("../utils/logs");
    const eConfig = EConfig_1.default.getInstance();
    /**
     * 启动webpack服务器
     */
    function startWebpackDevServer(cmd) {
        return new Promise((resolve, reject) => {
            const { server } = eConfig;
            const config = webpack_config_1.default(eConfig);
            new WebpackDevServer(webpackCompiler_1.default(cmd), config.devServer).listen(eConfig.defaultPort, server, err => {
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
});
