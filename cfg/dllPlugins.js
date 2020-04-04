"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const EConfig_1 = require("../libs/settings/EConfig");
const WebpackDllManifest_1 = require("../libs/settings/WebpackDllManifest");
const path = require('path');
const webpack = require('webpack');
const { webpack: { dllConfig } } = EConfig_1.default.getInstance();
const { vendors } = dllConfig, otherDll = __rest(dllConfig, ["vendors"]);
const webpackDllManifest = WebpackDllManifest_1.default.getInstance();
const distPath = webpackDllManifest.distPath;
const DllPlugins = {};
exports.DllPlugins = DllPlugins;
if (otherDll && typeof otherDll === 'object' && !Array.isArray(otherDll)) {
    Object.keys(otherDll).forEach((key) => {
        let vendorsDll = [];
        if (typeof otherDll[key] === 'object') {
            if (Array.isArray(otherDll[key])) {
                vendorsDll = otherDll[key];
            }
            else {
                vendorsDll = otherDll[key].FrameList || [];
            }
        }
        const isVendorExist = vendorsDll && vendorsDll.length;
        if (isVendorExist) {
            const distFileName = webpackDllManifest.getDllPluginsHash(vendorsDll);
            const dll = {
                entry: {
                    key: vendorsDll
                },
                mode: 'production',
                output: {
                    path: distPath,
                    // filename: `${distFileName}.js`,
                    filename: `${key}.dll.${distFileName}.js`,
                    /**
                     * output.library
                     * 将会定义为 window.${output.library}
                     * 在这次的例子中，将会定义为`window.vendor_library`
                     */
                    library: `${key}_${distFileName}_library`,
                },
                plugins: [
                    new webpack.DllPlugin({
                        /**
                         * path
                         * 定义 manifest 文件生成的位置
                         * [name]的部分由entry的名字替换
                         */
                        // path: path.join(distPath, `${distFileName}.json`),
                        path: path.join(distPath, `${key}.dll.json`),
                        /**
                         * name
                         * dll bundle 输出到那个全局变量上
                         * 和 output.library 一样即可。
                         */
                        name: `${key}_${distFileName}_library`
                    }),
                ]
            };
            DllPlugins[key] = dll;
        }
        else {
            console.log(`webpack dll vendor is empty`);
            module.exports = null;
        }
    });
}
