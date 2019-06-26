"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
// const getDistConfig = getBaseConfig;
const WebpackDllManifest_1 = require("../libs/settings/WebpackDllManifest");
const helpers_1 = require("./helpers");
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin');
const path = require('path');
function getDistConfig(eConfig) {
    const config = base_1.default(eConfig);
    config.pendings = [
        () => {
            //TODO:暂时放在这里
            const filepath = WebpackDllManifest_1.default.getInstance().resolveManifestPath();
            if (filepath) {
                config.plugins.push(new AddAssetHtmlPlugin({
                    includeSourcemap: false, filepath,
                    outputPath: 'common/js',
                    /* publicPath: path.posix.join('../', 'common/js'), */
                    publicPath: process.env.cdnRelease ? `${process.env.cdnRelease}/common/js` : path.posix.join('../', 'common/js'),
                }));
                const dllReferencePlugin = helpers_1.getDllReferencePlugin();
                if (dllReferencePlugin) {
                    config.plugins.push(dllReferencePlugin);
                }
            }
        }
    ];
    return config;
}
exports.default = getDistConfig;
