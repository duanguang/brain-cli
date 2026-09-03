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
