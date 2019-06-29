import {getDllReferencePlugin} from './helpers';
import WebpackDllManifest from '../libs/settings/WebpackDllManifest';
import getBaseConfig from './base';
import EConfig from '../libs/settings/EConfig';
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