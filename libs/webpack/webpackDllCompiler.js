"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const webpack = require("webpack");
const WebpackDllManifest_1 = require("../settings/WebpackDllManifest");
const dllConfig = require('../../cfg/dll');
function webpackDllCompiler() {
    const requireCompile = WebpackDllManifest_1.default.getInstance().isCompileManifestDirty();
    return new Promise((resolve, reject) => {
        if (!dllConfig) {
            console.info('ignore webpack dll manifest compile');
            resolve();
            return;
        }
        if (requireCompile) {
            console.info('create webpack dll manifest');
            const compiler = webpack(dllConfig);
            compiler.run((err, stats) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(stats);
            });
        }
        else {
            console.info('skip webpack dll manifest');
            resolve();
        }
    });
}
exports.default = webpackDllCompiler;
