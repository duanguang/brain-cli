"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const WebpackDllManifest_1 = require("../libs/settings/WebpackDllManifest");
const base_1 = require("./base");
const path = require('path');
const webpack = require('webpack');
const config = require('./base');
const nodeModulesPath = path.resolve(process.cwd(), 'node_modules');
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin');
function getDevConfig(eConfig) {
    const config = base_1.default(eConfig);
    config.pendings = [
        () => {
            //TODO:暂时放在这里
            const filepath = WebpackDllManifest_1.default.getInstance().resolveManifestPath();
            if (filepath) {
                config.plugins.push(new AddAssetHtmlPlugin({ includeSourcemap: false, filepath }));
                const dllReferencePlugin = helpers_1.getDllReferencePlugin();
                if (dllReferencePlugin) {
                    config.plugins.push(dllReferencePlugin);
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
exports.default = getDevConfig;
