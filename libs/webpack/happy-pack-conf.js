(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../settings/EConfig", "./javaScriptLoader"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const EConfig_1 = require("../settings/EConfig");
    const javaScriptLoader_1 = require("./javaScriptLoader");
    const HappyPack = require('happypack');
    const os = require('os');
    const happyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length });
    const { webpack: { happyPack }, babel, } = EConfig_1.default.getInstance();
    /** JS编译线程插件 */
    exports.happyPackToJsPlugin = () => {
        if (happyPack && happyPack.open) {
            const jsConfig = happyPack.procJs || {};
            return [
                new HappyPack(Object.assign({ threads: os.cpus().length - 1 }, jsConfig, { id: 'js', 
                    /* threadPool: happyThreadPool, */
                    use: [
                        {
                            loader: `babel-loader`,
                            query: babel.query,
                        },
                    ] })),
            ];
        }
        return [];
    };
    exports.happyPackToTsPlugin = () => {
        if (happyPack && happyPack.open) {
            const jsConfig = happyPack.procTs || {};
            return [
                new HappyPack(Object.assign({ threads: os.cpus().length - 1 }, jsConfig, { 
                    /* threadPool: happyThreadPool, */
                    id: 'ts', use: [
                        {
                            loader: 'babel-loader',
                            query: babel.query,
                        },
                        javaScriptLoader_1.tsloaderPlugin(),
                    ] })),
            ];
        }
        return [];
    };
});
