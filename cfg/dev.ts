import {getDllReferencePlugin} from './helpers';
import WebpackDllManifest from '../libs/settings/WebpackDllManifest';
import getBaseConfig from './base';
import EConfig from '../libs/settings/EConfig';
import { DllPlugins } from './dllPlugins';
const {webpack:{dllConfig}} = EConfig.getInstance();
const { vendors,customDll,dllCompileParam } = dllConfig;dllConfig
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
                if (dllCompileParam && Object.prototype.toString.call(dllCompileParam) === '[object Object]') {
                    vencdn = dllCompileParam.externalUrl || process.env.cdnRelease
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
                let vendorsDll = []
                const item = customDll.find((i) => i.key === keys);
                let cdn = ''
                if (item) {
                    vendorsDll = item.value;
                    cdn = item.externalUrl||dllCompileParam.externalUrl||process.env.cdnRelease;
                }
                const filepath = WebpackDllManifest.getInstance().resolveManifestPath(keys,WebpackDllManifest.getInstance().getDllPluginsHash(vendorsDll));
                if (filepath) {
                    config.plugins.push(new AddAssetHtmlPlugin({
                        includeSourcemap: false, filepath,
                    }));
                    const dllReference = getDllReferencePlugin(keys);
                    if (dllReference) {
                        config.plugins.push(dllReference)
                    }
                }
            })
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