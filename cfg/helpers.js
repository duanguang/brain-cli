(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../libs/settings/WebpackDllManifest", "path"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getEntry = exports.getRspackDllReferencePlugin = exports.getDllReferencePlugin = void 0;
    const WebpackDllManifest_1 = require("../libs/settings/WebpackDllManifest");
    const EConfig_1 = require("../libs/settings/EConfig");
    const path = require("path");
    const { DllReferencePlugin } = require('webpack');
    const glob = require('glob');
    function getDllReferencePlugin(entityName = 'vendor') {
        try {
            const webpackDllManifest = WebpackDllManifest_1.default.getInstance();
            // const vendorsHash = webpackDllManifest.getVendorsHash();
            const distPath = webpackDllManifest.distPath;
            // const manifest = require(path.join(distPath, vendorsHash + `.json`));
            const manifest = require(path.join(distPath, `${entityName}.dll` + `.json`));
            return new DllReferencePlugin({
                context: process.cwd(),
                manifest
            });
        }
        catch (e) {
            console.error(e);
            return null;
        }
    }
    exports.getDllReferencePlugin = getDllReferencePlugin;
    /**
     * rspack 版 DllReferencePlugin 工厂（cfg/rspack/dev.js DLL 注入用）。
     * webpack 包的 DllReferencePlugin 在 @rspack/core 2.x 编译器下 hook 不兼容会崩
     * （同 DefinePlugin 前科），必须用 @rspack/core 的实现；manifest 为标准 JSON 协议，
     * 可直接消费 brain-cli dll（webpack DllPlugin）构建的产物。
     */
    function getRspackDllReferencePlugin(entityName = 'vendor') {
        try {
            const webpackDllManifest = WebpackDllManifest_1.default.getInstance();
            const distPath = webpackDllManifest.distPath;
            const manifest = require(path.join(distPath, `${entityName}.dll` + `.json`));
            const { DllReferencePlugin: RspackDllReferencePlugin } = require('@rspack/core');
            return new RspackDllReferencePlugin({
                context: process.cwd(),
                manifest
            });
        }
        catch (e) {
            return null;
        }
    }
    exports.getRspackDllReferencePlugin = getRspackDllReferencePlugin;
    /**
     * 完整 DLL 模式判定：DLL 将注入（配置 + 产物存在）且 react-dom 在注入的 DLL 内。
     * DLL 为 production 构建，其 react-dom 的 Fast Refresh API（scheduleRefresh 等）
     * 为 null（React 16 仅 DEV 构建提供）——此模式下必须同时关闭：
     * 1. ReactRefreshRspackPlugin（dev.js，运行时/包装定义提供者）
     * 2. babel 侧 react-refresh/babel 组件签名转换（base.js，$RefreshSig$ 调用插入者）
     * 两者必须同开同关：只关 1 会留下裸 $RefreshSig$ 调用且无定义 → 启动即崩
     * （legions-pro-examples 实证缺陷，2026-09-04 修复）
     */
    function isReactDomInDll() {
        const webpackDllManifest = WebpackDllManifest_1.default.getInstance();
        const eConfig = EConfig_1.default.getInstance();
        const dllConfig = (eConfig.webpack && eConfig.webpack.dllConfig) || {};
        const vendors = dllConfig.vendors;
        const vendorsValue = Array.isArray(vendors) ? vendors : ((vendors && vendors.value) || []);
        const customDll = dllConfig.customDll;
        const reactDomIn = (value) => Array.isArray(value) && value.indexOf('react-dom') !== -1;
        // react-dom 在主 vendors 且主 DLL 产物已构建
        if (reactDomIn(vendorsValue) && webpackDllManifest.resolveManifestPath()) {
            return true;
        }
        // react-dom 在某项 customDll 且该 DLL 产物已构建
        if (Array.isArray(customDll)) {
            for (let i = 0; i < customDll.length; i++) {
                const item = customDll[i];
                if (reactDomIn(item.value) &&
                    webpackDllManifest.resolveManifestPath(item.key, webpackDllManifest.getDllPluginsHash(item.value || []))) {
                    return true;
                }
            }
        }
        return false;
    }
    exports.isReactDomInDll = isReactDomInDll;
    function getEntry(pathDir) {
        let files = glob.sync(`${pathDir}`);
        let entries = [], entry, dirname, basename, pathname, extname;
        for (let i = 0; i < files.length; i++) {
            entry = files[i];
            dirname = path.dirname(entry);
            extname = path.extname(entry);
            basename = path.basename(entry, extname);
            pathname = path.normalize(path.join(dirname, basename));
            pathDir = path.normalize(pathDir);
            if (pathname.startsWith(pathDir)) {
                pathname = pathname.substring(pathDir.length);
            }
            entries.push('./' + entry);
        }
        return entries;
    }
    exports.getEntry = getEntry;
});
