"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
const webpack = require("webpack");
const WebpackDllManifest_1 = require("../settings/WebpackDllManifest");
const logs_1 = require("../utils/logs");
const dllPlugins_1 = require("../../cfg/dllPlugins");
const EConfig_1 = require("../settings/EConfig");
const dllConfig = require('../../cfg/dll');
const _a = EConfig_1.default.getInstance().webpack.dllConfig, { vendors } = _a, otherDll = __rest(_a, ["vendors"]);
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
        Object.keys(dllPlugins_1.DllPlugins).forEach((key) => {
            let vendorsDll = [];
            if (typeof otherDll[key] === 'object') {
                if (Array.isArray(otherDll[key])) {
                    vendorsDll = otherDll[key];
                }
                else {
                    vendorsDll = otherDll[key].FrameList || [];
                }
            }
            const requireCompile = WebpackDllManifest_1.default.getInstance().isCompileManifestDirty(key, WebpackDllManifest_1.default.getInstance().getDllPluginsHash(vendorsDll));
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
