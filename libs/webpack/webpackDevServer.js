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
    const EConfig_1 = require("../settings/EConfig");
    const webpackCompiler_1 = require("./webpackCompiler");
    const WebpackDevServer = require('webpack-dev-server');
    const webpack_config_1 = require("../../webpack.config");
    const logs_1 = require("../utils/logs");
    const eConfig = EConfig_1.default.getInstance();
    const { name: projectName, apps } = eConfig;
    /**
     * 启动webpack服务器 (WP5 + webpack-dev-server v4)
     */
    function startWebpackDevServer(options) {
        return new Promise((resolve, reject) => {
            const { server = '0.0.0.0' } = eConfig;
            const config = (0, webpack_config_1.default)(eConfig);
            // 处理 pendings（DLL 引用插件等）
            if (Array.isArray(config.pendings)) {
                config.pendings.forEach(pending => pending());
            }
            delete config.pendings;
            const compiler = (0, webpackCompiler_1.default)();
            // WP5 + webpack-dev-server v4: 构造函数签名变更 (options, compiler)
            // v4 移除了 addDevServerEntrypoints，不再需要手动调用
            const devServerOptions = config.devServer || {};
            // 确保端口和 host 配置正确
            devServerOptions.port = eConfig.defaultPort;
            devServerOptions.host = server;
            const devServer = new WebpackDevServer(devServerOptions, compiler);
            // v4: startCallback 只接收回调函数，端口/host 从 devServerOptions 读取
            devServer.startCallback((err) => {
                if (err) {
                    reject(err);
                }
                (0, logs_1.log)(`监听本地 ${server}:${eConfig.defaultPort}`);
                resolve(undefined);
            });
        });
    }
    exports.default = startWebpackDevServer;
});
