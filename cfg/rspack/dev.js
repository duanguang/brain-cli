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
    // React Fast Refresh：runtime 注入由插件统一负责（builtin:react-refresh-loader），
    // 组件签名转换由 babel 侧 react-refresh/babel 完成（javaScriptLoader reactRefresh 分支）
    const react_refresh_1 = require("@rspack/plugin-react-refresh");
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
        // @rspack/dev-server 内部 for...of 迭代 proxy，严格要求数组；
        // webpack 版兼容对象形式（{ '/api': {...} }），此处规范化：
        // 对象 → [{ context: key, ...value }]；未配置 → []（2.x 对 undefined/对象不容错）
        let proxyList = proxy;
        if (proxy && !Array.isArray(proxy) && typeof proxy === 'object') {
            proxyList = Object.keys(proxy).map((key) => Object.assign({ context: key }, proxy[key]));
        }
        else if (!proxy) {
            proxyList = [];
        }
        config.devServer = Object.assign({}, serverProps, {
            // WDS4 内核 static.watch 默认 true，会监听项目根目录（含 src），
            // src 文件变化时 live reload 抢跑 HMR 导致整页刷新（app1 实测：
            // "from static directory was changed. Reloading..."）；关闭后由 HMR 接管
            static: { directory: path.resolve(process.cwd(), constants_1.WORKING_DIRECTORY), watch: false },
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
            proxy: proxyList,
            setupMiddlewares: function (middlewares, devServer) {
                if (!devServer)
                    return middlewares;
                devServer.app.use(path.posix.join(`/static`), express.static('./static'));
                before && before(devServer.app);
                return middlewares;
            },
        });
        // React Fast Refresh（仅 dev）：给 React 组件模块注入 HMR accept 边界 + 刷新运行时，
        // 无 hot() 包裹的业务组件改动不再冒泡整页刷新（函数组件保留状态，class 组件 remount）。
        // injectEntry 保持默认（匿名 entry 模块被 splitChunks 抽进 common 后不会执行，无副作用）；
        // hook 安装时序由 cfg/rspack/base.js 的 reactRefreshHookLoader 规则保证
        //（react-dom 模块 prepend，先于其顶层注册执行，不受 chunk 拆分影响）
        config.plugins.push(new react_refresh_1.ReactRefreshRspackPlugin());
        return config;
    }
    exports.default = getRspackDevConfig;
});
