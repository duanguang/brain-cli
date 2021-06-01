var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./libs/webpack/webpackDevServer", "./libs/webpack/webpackDllCompiler", "./libs/settings/EConfig", "./libs/utils/ip", "./libs/utils/logs", "./libs/constants/constants"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const webpackDevServer_1 = require("./libs/webpack/webpackDevServer");
    const webpackDllCompiler_1 = require("./libs/webpack/webpackDllCompiler");
    const EConfig_1 = require("./libs/settings/EConfig");
    const ip_1 = require("./libs/utils/ip");
    const logs_1 = require("./libs/utils/logs");
    const constants_1 = require("./libs/constants/constants");
    const openBrowser = require('open');
    // const config = require('./webpack.config');
    // const {port} = config;
    function autoOpenBrowser(open, ip, port, targetApp) {
        const { name: projectName, devServer: { https } } = EConfig_1.default.getInstance();
        if (open) {
            if (!targetApp) {
                logs_1.warning(`忽略自动打开浏览器功能:`);
                logs_1.warning(`请提供指定需要app name作为相对路径`);
            }
            else {
                openBrowser(`${https ? 'https' : 'http'}://${ip}:${port}/${constants_1.URL_PREFIX}/${projectName}/${targetApp}`);
            }
        }
    }
    /**
     * 程序入口点开始方法
     */
    function start(cmd) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                /**
                 * 按需创建编译webpack dll manifest文件
                 */
                yield webpackDllCompiler_1.default();
                yield webpackDllCompiler_1.webpackDllPluginsCompiler();
                /**
                 * 开启webpack dev server
                 */
                yield webpackDevServer_1.default(cmd);
                /**
                 * 获取配置文件
                 */
                const { open, server, apps, defaultPort } = EConfig_1.default.getInstance();
                let ip = server;
                if (server === `0.0.0.0`) {
                    /**
                     * 显示可选IP列表
                     */
                    ip_1.displayAvailableIPs();
                    /**
                     * 开启后判断配置文件是否需要自动打开浏览器
                     */
                    ip = `localhost`;
                }
                autoOpenBrowser(open, ip, defaultPort, apps[0]);
            }
            catch (e) {
                console.error(e);
            }
        });
    }
    exports.default = start;
});
