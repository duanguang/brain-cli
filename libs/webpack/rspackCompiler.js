(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../../webpack.config", "../settings/EConfig", "../utils/logs", "../utils/format", "../constants/constants", "../utils/update-notifier"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const format_1 = require("../utils/format");
    const webpack_config_1 = require("../../webpack.config");
    const EConfig_1 = require("../settings/EConfig");
    const logs_1 = require("../utils/logs");
    const constants_1 = require("../constants/constants");
    const update_notifier_1 = require("../utils/update-notifier");
    const { rspack } = require('@rspack/core');
    /**
     * Rspack 编译器封装：日志 hooks 与 webpackCompiler.js 对齐（[rspack] 前缀）。
     * 返回 { compiler, config }——dev server 需要 config.devServer。
     */
    function rspackCompiler() {
        const config = webpack_config_1.default(EConfig_1.default.getInstance());
        if (Array.isArray(config.pendings)) {
            config.pendings.forEach(pending => pending());
        }
        delete config.pendings;
        const compiler = rspack(config);
        const { name: projectName, apps, defaultPort, devServer: { https }, server } = EConfig_1.default.getInstance();
        const projectUrl = `${constants_1.URL_PREFIX}/${projectName}/${apps.length ? apps[0] : ''}`;
        let bundleStartTime;
        compiler.hooks.compile.tap('brain-cli', () => {
            (0, logs_1.log)('[rspack] 打包中...');
            bundleStartTime = Date.now();
        });
        compiler.hooks.done.tap('brain-cli', () => {
            (0, logs_1.log)(`[rspack] 打包完成, 耗时 ${(0, format_1.asSeconds)(Date.now() - bundleStartTime)} s. ${new Date()}`);
            (0, logs_1.logAppRunning)({ port: defaultPort, projectUrl, https, server });
            (0, update_notifier_1.chkUpdateNotifier)();
        });
        return { compiler, config };
    }
    exports.default = rspackCompiler;
});
