var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "path", "./base", "../../libs/constants/constants"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const path = require("path");
    const base_1 = require("./base");
    const constants_1 = require("../../libs/constants/constants");
    const express = require('express');
    /**
     * Rspack dev 配置：devServer 组装语义对齐 webpack 版 cfg/base.js 的 __DEV__ 分支。
     * dll pendings 不迁移（wms-aps-web vendors=[]，cfg/dll.js 返回 null，启动链路自然跳过）。
     */
    function getRspackDevConfig(eConfig) {
        const config = (0, base_1.default)(eConfig);
        const { name, devServer, defaultPort } = eConfig;
        const publicPath = eConfig.publicPath + name + '/';
        const { noInfo, proxy, before, stats, contentBase, historyApiFallback, headers = {}, hot, port } = devServer, serverProps = __rest(devServer, ["noInfo", "proxy", "before", "stats", "contentBase", "historyApiFallback", "headers", "hot", "port"]);
        config.devServer = Object.assign({}, serverProps, {
            static: { directory: path.resolve(process.cwd(), constants_1.WORKING_DIRECTORY) },
            // WP5 同款：publicPath 移到 devMiddleware
            devMiddleware: { publicPath: publicPath, stats: 'errors-only' },
            historyApiFallback: {
                rewrites: eConfig.apps.map((app) => ({
                    from: (0, constants_1.HISTORY_REWRITE_FALL_BACK_REGEX_FUNC)(app),
                    to: `${publicPath}/${app}/index.html`,
                })),
            },
            headers: Object.assign({ 'Access-Control-Allow-Origin': '*' }, headers),
            hot: true,
            port: defaultPort,
            proxy: proxy,
            setupMiddlewares: function (middlewares, devServer) {
                if (!devServer)
                    return middlewares;
                devServer.app.use(path.posix.join(`/static`), express.static('./static'));
                before && before(devServer.app);
                return middlewares;
            },
        });
        return config;
    }
    exports.default = getRspackDevConfig;
});
