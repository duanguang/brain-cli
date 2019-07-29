import {getDllReferencePlugin} from './helpers';
import WebpackDllManifest from '../libs/settings/WebpackDllManifest';
import getBaseConfig from './base';
import EConfig from '../libs/settings/EConfig';
import { DllPlugins } from './dllPlugins';
const {webpack:{dllConfig}} = EConfig.getInstance();
const {vendors,...otherDll } = dllConfig
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
            if (filepath) {
                config.plugins.push(new AddAssetHtmlPlugin({
                    includeSourcemap: false, filepath,
                }));
                const dllReferencePlugin = getDllReferencePlugin();
                if (dllReferencePlugin) {
                    config.plugins.push(dllReferencePlugin)
                }
            }
            Object.keys(DllPlugins).forEach((key) => {
                let vendorsDll = []
                if (typeof otherDll[key] === 'object') {
                    if (Array.isArray(otherDll[key])) {
                        vendorsDll = otherDll[key]
                    } else {
                        vendorsDll = otherDll[key].FrameList || []
                    }
                }
                const filepath = WebpackDllManifest.getInstance().resolveManifestPath(key,WebpackDllManifest.getInstance().getDllPluginsHash(vendorsDll));
                if (filepath) {
                    config.plugins.push(new AddAssetHtmlPlugin({
                        includeSourcemap: false, filepath,
                    }));
                    const dllReference = getDllReferencePlugin(key);
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