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
const base_1 = require("./base");
const EConfig_1 = require("../libs/settings/EConfig");
// const getDistConfig = getBaseConfig;
const WebpackDllManifest_1 = require("../libs/settings/WebpackDllManifest");
const helpers_1 = require("./helpers");
const dllPlugins_1 = require("./dllPlugins");
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin');
const { webpack: { dllConfig } } = EConfig_1.default.getInstance();
const { vendors } = dllConfig, otherDll = __rest(dllConfig, ["vendors"]);
const path = require('path');
function getDistConfig(eConfig) {
    const config = base_1.default(eConfig);
    config.pendings = [
        () => {
            //TODO:暂时放在这里
            const filepath = WebpackDllManifest_1.default.getInstance().resolveManifestPath();
            if (filepath) {
                let publicPath = path.posix.join('../', 'common/js');
                let cdn = '';
                if (typeof vendors === 'object' && !Array.isArray(vendors)) {
                    if (vendors.cdn) {
                        cdn = vendors.cdn;
                    }
                }
                if (cdn || process.env.cdnRelease) {
                    publicPath = `${cdn || process.env.cdnRelease}/common/js`;
                }
                /* config.plugins.push(new AddAssetHtmlPlugin({
                    includeSourcemap: false, filepath,
                    outputPath: 'common/js',
                
                    publicPath,
                })); */
                const dllReferencePlugin = helpers_1.getDllReferencePlugin();
                if (dllReferencePlugin) {
                    config.plugins.push(dllReferencePlugin);
                }
            }
            Object.keys(dllPlugins_1.DllPlugins).forEach((key) => {
                let vendorsDll = [];
                let publicPath = path.posix.join('../', 'common/js');
                let cdn = '';
                if (typeof otherDll[key] === 'object') {
                    if (Array.isArray(otherDll[key])) {
                        vendorsDll = otherDll[key];
                    }
                    else {
                        vendorsDll = otherDll[key].FrameList || [];
                        if (otherDll[key].cdn) {
                            cdn = otherDll[key].cdn;
                        }
                    }
                    if (cdn || process.env.cdnRelease) {
                        publicPath = `${cdn || process.env.cdnRelease}/common/js`;
                    }
                }
                const filepath = WebpackDllManifest_1.default.getInstance().resolveManifestPath(key, WebpackDllManifest_1.default.getInstance().getDllPluginsHash(vendorsDll));
                if (filepath) {
                    config.plugins.push(new AddAssetHtmlPlugin({
                        includeSourcemap: false, filepath,
                        outputPath: 'common/js',
                        publicPath
                        /* publicPath:process.env.cdnRelease?`${process.env.cdnRelease}/common/js`:path.posix.join('../', 'common/js'), */
                    }));
                    const dllReference = helpers_1.getDllReferencePlugin(key);
                    if (dllReference) {
                        config.plugins.push(dllReference);
                    }
                }
            });
        }
    ];
    return config;
}
exports.default = getDistConfig;
