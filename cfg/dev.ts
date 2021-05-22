import {getDllReferencePlugin} from './helpers';
import WebpackDllManifest from '../libs/settings/WebpackDllManifest';
import getBaseConfig from './base';
import EConfig from '../libs/settings/EConfig';
import { DllPlugins } from './dllPlugins';
const {webpack:{dllConfig}} = EConfig.getInstance();
const {vendors,customDll,compileOptions } = dllConfig
const path = require('path');
// const webpack = require('webpack');
// const config = require('./base');
// const nodeModulesPath = path.resolve(process.cwd(), 'node_modules');
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin');

export default function getDevConfig(eConfig: EConfig) {
    const config = getBaseConfig(eConfig);
    config.pendings = [
        () => {
            //TODO:暂时放在这里
            const filepath = WebpackDllManifest.getInstance().resolveManifestPath();
            let vencdn = ''
            if (Object.prototype.toString.call(vendors) === '[object Object]') {
                if (vendors['externalUrl']) {
                    vencdn = vendors['externalUrl']
                }
            }
            if (!vencdn) {
                if (compileOptions && Object.prototype.toString.call(compileOptions) === '[object Object]') {
                    vencdn = compileOptions.externalUrl || process.env.cdnRelease
                }
            }
            let venPublicPath = {};
            if (vencdn) {
                venPublicPath = { publicPath: vencdn };
            }
            if (filepath) {
                config.plugins.push(new AddAssetHtmlPlugin({
                    includeSourcemap: false, filepath,...venPublicPath
                }));
                const dllReferencePlugin = getDllReferencePlugin();
                if (dllReferencePlugin) {
                    config.plugins.push(dllReferencePlugin)
                }
            }
            Object.keys(DllPlugins).forEach((keys) => {
                let vendorsDll = [];
                const item = customDll.find((i) => i.key === keys);
                let cdn = ''
                if (item) {
                    vendorsDll = item.value;
                    cdn = item.externalUrl||compileOptions.externalUrl||process.env.cdnRelease;
                }
                const filepathDll = WebpackDllManifest.getInstance().resolveManifestPath(keys,WebpackDllManifest.getInstance().getDllPluginsHash(vendorsDll));
                let publicPath = {};
                if (cdn) {
                    publicPath = { publicPath: cdn };
                }
                if (filepathDll) {
                    config.plugins.push(new AddAssetHtmlPlugin({
                        includeSourcemap: false,filepath: filepathDll,
                        ...publicPath,
                    }));
                    const dllReference = getDllReferencePlugin(keys);
                    if (dllReference) {
                        config.plugins.push(dllReference)
                    }
                }
            })
        }
    ];
    return config;
}