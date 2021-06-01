(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./base", "../libs/settings/EConfig", "../libs/settings/WebpackDllManifest", "./helpers", "./dllPlugins"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const base_1 = require("./base");
    const EConfig_1 = require("../libs/settings/EConfig");
    // const getDistConfig = getBaseConfig;
    const WebpackDllManifest_1 = require("../libs/settings/WebpackDllManifest");
    const helpers_1 = require("./helpers");
    const dllPlugins_1 = require("./dllPlugins");
    const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin');
    const { webpack: { dllConfig } } = EConfig_1.default.getInstance();
    const { vendors, dllCompileParam, customDll } = dllConfig;
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
                    if (typeof vendors === 'object') {
                        if (!Array.isArray(vendors)) {
                            if (vendors.externalUrl) {
                                cdn = vendors.externalUrl;
                            }
                        }
                    }
                    if (cdn) {
                        publicPath = `${cdn}/common/js`;
                    }
                    config.plugins.push(new AddAssetHtmlPlugin({
                        includeSourcemap: false, filepath,
                        outputPath: 'common/js',
                        /* publicPath: path.posix.join('../', 'common/js'), */
                        /* publicPath:process.env.cdnRelease?`${process.env.cdnRelease}/common/js`:path.posix.join('../', 'common/js'), */
                        publicPath,
                    }));
                    const dllReferencePlugin = helpers_1.getDllReferencePlugin();
                    if (dllReferencePlugin) {
                        config.plugins.push(dllReferencePlugin);
                    }
                }
                Object.keys(dllPlugins_1.DllPlugins).forEach((key) => {
                    let vendorsDll = [];
                    let publicPath = path.posix.join('../', 'common/js');
                    let cdn = '';
                    const item = customDll.find((i) => i.key === key);
                    if (item) {
                        vendorsDll = item.value;
                        cdn = item.externalUrl;
                    }
                    if (cdn || process.env.cdnRelease) {
                        publicPath = `${cdn || process.env.cdnRelease}/common/js`;
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
});
