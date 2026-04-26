(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../utils/format", "../../webpack.config", "../settings/EConfig", "../utils/logs", "../constants/constants", "../utils/update-notifier"], factory);
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
    const webpack = require('webpack');
    function webpackCompiler(options) {
        const webpackConfig = (0, webpack_config_1.default)(EConfig_1.default.getInstance());
        if (Array.isArray(webpackConfig.pendings)) {
            webpackConfig.pendings.forEach(pending => pending());
        }
        delete webpackConfig.pendings;
        const webpackCompiler = webpack(webpackConfig);
        const { name: projectName, apps, defaultPort, devServer: { https }, server } = EConfig_1.default.getInstance();
        const projectUrl = `${constants_1.URL_PREFIX}/${projectName}/${apps.length ? apps[0] : ''}`;
        let bundleStartTime;
        // WP5: 使用 hooks API 替代 plugin() 方法
        webpackCompiler.hooks.compile.tap('brain-cli', () => {
            (0, logs_1.log)('打包中...');
            bundleStartTime = Date.now();
        });
        webpackCompiler.hooks.done.tap('brain-cli', () => {
            const timeSpent = Date.now() - bundleStartTime;
            (0, logs_1.log)(`打包完成, 耗时 ${(0, format_1.asSeconds)(timeSpent)} s. ${new Date()}`);
            (0, logs_1.logAppRunning)({ port: defaultPort, projectUrl, https, server });
            (0, update_notifier_1.chkUpdateNotifier)();
        });
        return webpackCompiler;
    }
    exports.default = webpackCompiler;
});
