var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "webpack", "../settings/WebpackDllManifest", "../utils/logs", "../../cfg/dllPlugins", "../settings/EConfig"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const webpack = require("webpack");
    const WebpackDllManifest_1 = require("../settings/WebpackDllManifest");
    const logs_1 = require("../utils/logs");
    const dllPlugins_1 = require("../../cfg/dllPlugins");
    const EConfig_1 = require("../settings/EConfig");
    const dllConfig = require('../../cfg/dll');
    const { vendors, customDll } = EConfig_1.default.getInstance().webpack.dllConfig;
    function webpackDllCompiler() {
        const requireCompile = WebpackDllManifest_1.default.getInstance().isCompileManifestDirty();
        return new Promise((resolve, reject) => {
            if (!dllConfig) {
                logs_1.log(`ignore webpack dll manifest compile`);
                //console.info('ignore webpack dll manifest compile');
                resolve();
                return;
            }
            if (requireCompile) {
                logs_1.log(`create webpack dll manifest [vendors]`);
                //console.info('create webpack dll manifest');
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
                logs_1.log('skip webpack dll manifest [vendors]');
                //console.info('skip webpack dll manifest');
                resolve();
            }
        });
    }
    exports.default = webpackDllCompiler;
    function webpackDllPluginsCompiler() {
        return __awaiter(this, void 0, void 0, function* () {
            const promiseDll = [];
            const dllManifestInstance = WebpackDllManifest_1.default.getInstance();
            Object.keys(dllPlugins_1.DllPlugins).forEach((key) => {
                let vendorsDll = [];
                const item = customDll.find((item) => item.key === key);
                if (item) {
                    vendorsDll = item.value;
                }
                const hash = dllManifestInstance.getDllPluginsHash(vendorsDll);
                const requireCompile = dllManifestInstance.isCompileManifestDirty(key, hash);
                const promise = new Promise((resolve, reject) => {
                    if (!dllPlugins_1.DllPlugins[key]) {
                        logs_1.log(`ignore webpack dll manifest compile`);
                        //console.info('ignore webpack dll manifest compile');
                        resolve();
                        return;
                    }
                    if (requireCompile) {
                        logs_1.log(`create webpack dll manifest [${key}]`);
                        //console.info('create webpack dll manifest');
                        const compiler = webpack(dllPlugins_1.DllPlugins[key]);
                        compiler.run((err, stats) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            resolve(stats);
                        });
                    }
                    else {
                        logs_1.log(`skip webpack dll manifest [${key}]`);
                        //console.info('skip webpack dll manifest');
                        resolve();
                    }
                });
                promiseDll.push(promise);
            });
            let result = '';
            yield Promise.all(promiseDll).then((values) => {
                // @ts-ignore
                result = values;
            });
            return result;
        });
    }
    exports.webpackDllPluginsCompiler = webpackDllPluginsCompiler;
});
