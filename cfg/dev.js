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
const helpers_1 = require("./helpers");
const WebpackDllManifest_1 = require("../libs/settings/WebpackDllManifest");
const base_1 = require("./base");
const EConfig_1 = require("../libs/settings/EConfig");
const dllPlugins_1 = require("./dllPlugins");
const { webpack: { dllConfig } } = EConfig_1.default.getInstance();
const { vendors } = dllConfig, otherDll = __rest(dllConfig, ["vendors"]);
const path = require('path');
// const webpack = require('webpack');
// const config = require('./base');
// const nodeModulesPath = path.resolve(process.cwd(), 'node_modules');
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin');
function getDevConfig(eConfig) {
    const config = base_1.default(eConfig);
    config.pendings = [
        () => {
            //TODO:暂时放在这里
            const filepath = WebpackDllManifest_1.default.getInstance().resolveManifestPath();
            if (filepath) {
                config.plugins.push(new AddAssetHtmlPlugin({
                    includeSourcemap: false, filepath,
                }));
                const dllReferencePlugin = helpers_1.getDllReferencePlugin();
                if (dllReferencePlugin) {
                    config.plugins.push(dllReferencePlugin);
                }
            }
            Object.keys(dllPlugins_1.DllPlugins).forEach((key) => {
                let vendorsDll = [];
                if (typeof otherDll[key] === 'object') {
                    if (Array.isArray(otherDll[key])) {
                        vendorsDll = otherDll[key];
                    }
                    else {
                        vendorsDll = otherDll[key].FrameList || [];
                    }
                }
                const filepath = WebpackDllManifest_1.default.getInstance().resolveManifestPath(key, WebpackDllManifest_1.default.getInstance().getDllPluginsHash(vendorsDll));
                if (filepath) {
                    config.plugins.push(new AddAssetHtmlPlugin({
                        includeSourcemap: false, filepath,
                    }));
                    const dllReference = helpers_1.getDllReferencePlugin(key);
                    if (dllReference) {
                        config.plugins.push(dllReference);
                    }
                }
            });
        }
    ];
    // const deps = [
    //     'react/dist/react.js',
    //     //'react-router/dist/react-router.min.js'
    // ];
    // deps.forEach(function (dep) {
    //     const depPath = path.resolve(nodeModulesPath, dep);
    //     config.resolve.alias[dep.split(path.sep)[0]] = depPath;
    //     config.module.noParse.push(depPath);
    // });
    return config;
}
exports.default = getDevConfig;
