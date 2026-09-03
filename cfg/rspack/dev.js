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
    // DLL 支持（对齐 webpack 引擎 cfg/dev.js pendings 语义）：
    // webpack 包的 DllReferencePlugin 在 rspack 编译器下不兼容，必须用 @rspack/core 实现
    const helpers_1 = require("../helpers");
    const WebpackDllManifest_1 = require("../../libs/settings/WebpackDllManifest");
    const node_path_1 = require("path");
    const RspackDllHtmlPlugin_1 = require("../../libs/webpack/plugins/rspackDllHtmlPlugin.js");
    const express = require('express');
    /**
     * Rspack dev 配置：devServer 组装语义对齐 webpack 版 cfg/base.js 的 __DEV__ 分支。
     * DLL：vendors/customDll 有配置且存在已构建产物（brain-cli dll）时注入，
     * 行为对齐 webpack 引擎；无 DLL 时零影响。
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
        //（react-dom 模块 prepend，先于其顶层注册执行，不受 chunk 拆分影响）。
        // 完整 DLL 模式（react-dom 在 DLL 内）下 Fast Refresh 降级说明见 DLL 注入段；
        // 判定必须基于「实际注入的 DLL」——dllScripts 组装完成后再决策（见下）
        var reactDomInDll = false;
        // DLL 注入（对齐 webpack 引擎 cfg/dev.js pendings；仅 dev，dist 链路无此逻辑）。
        // 主 vendors 与 customDll 各项：manifest js 存在（已执行 brain-cli dll）才注入——
        // 未构建 DLL 时自然跳过，行为与 vendors=[] 一致
        var dllScripts = [];
        var manifest_1 = WebpackDllManifest_1.default.getInstance();
        var dllConfig = (eConfig.webpack && eConfig.webpack.dllConfig) || {};
        var vendors = dllConfig.vendors;
        var vendorsValue = Array.isArray(vendors) ? vendors : ((vendors && vendors.value) || []);
        if (vendorsValue.length && manifest_1.resolveManifestPath()) {
            var vendorDllFile = manifest_1.resolveManifestPath();
            dllScripts.push({
                basename: node_path_1.basename(vendorDllFile),
                diskPath: vendorDllFile,
                // URL 语义对齐 webpack 引擎（AddAssetHtmlPlugin）：DLL emit 进编译产物，
                // script src 走 output.publicPath
                publicSrc: publicPath + node_path_1.basename(vendorDllFile),
            });
            var vendorRef = helpers_1.getRspackDllReferencePlugin();
            if (vendorRef) {
                config.plugins.push(vendorRef);
            }
        }
        var customDll = dllConfig.customDll;
        if (Array.isArray(customDll)) {
            customDll.forEach(function (item) {
                var hash = manifest_1.getDllPluginsHash(item.value || []);
                var dllFile = manifest_1.resolveManifestPath(item.key, hash);
                if (item.value && item.value.length && dllFile) {
                    dllScripts.push({
                        basename: node_path_1.basename(dllFile),
                        diskPath: dllFile,
                        publicSrc: publicPath + node_path_1.basename(dllFile),
                    });
                    var customRef = helpers_1.getRspackDllReferencePlugin(item.key);
                    if (customRef) {
                        config.plugins.push(customRef);
                    }
                }
            });
        }
        if (dllScripts.length) {
            // 完整 DLL 模式判定：react-dom 在实际注入的 DLL 内——DLL 为 production 构建
            //（bundleType=0），其 react-dom 的 Fast Refresh API（scheduleRefresh 等）为 null
            //（React 16 仅 DEV 构建提供），Fast Refresh 无法工作——对齐 webpack 引擎 + DLL 现状：
            // 不接 Fast Refresh，更新走 HMR 冒泡整页刷新（行为明确可预期）
            reactDomInDll = vendorsValue.indexOf('react-dom') !== -1 ||
                (Array.isArray(customDll) && customDll.some(function (item) {
                    return item.value && item.value.indexOf('react-dom') !== -1;
                }));
            if (!reactDomInDll) {
                config.plugins.push(new react_refresh_1.ReactRefreshRspackPlugin());
            }
            // hook stub → DLL scripts 注入 HTML head 首位（script 顺序即依赖加载时序）
            config.plugins.push(new RspackDllHtmlPlugin_1({ scripts: dllScripts, injectHookStub: !reactDomInDll }));
            if (!reactDomInDll) {
                // 半 DLL（react-dom 走 rspack 编译）：Fast Refresh 完整——
                // 内联 stub 先装 hook，react-dom 模块的 loader 版 snippet 增强后登记 helpers；
                // enhance loader 消费 __rrNeedsEnhance 做二次增强（幂等、无害）
                config.module.rules.unshift({
                    test: /\.(js|jsx|ts|tsx)$/,
                    include: [node_path_1.resolve(process.cwd(), 'src')],
                    loader: node_path_1.resolve(__dirname, '../../libs/webpack/loaders/rspackRefreshEnhanceLoader.js'),
                });
            }
        }
        else {
            // 无 DLL：Fast Refresh 照常（react-dom 走 rspack 编译，loader 时序修复命中）
            config.plugins.push(new react_refresh_1.ReactRefreshRspackPlugin());
        }
        return config;
    }
    exports.default = getRspackDevConfig;
});
