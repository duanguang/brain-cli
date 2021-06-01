(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../settings/EConfig", "../utils/env", "path"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const EConfig_1 = require("../settings/EConfig");
    const env_1 = require("../utils/env");
    const path = require("path");
    const { webpack: { happyPack, disableReactHotLoader, tsCompilePlugin, extend }, babel, projectType, } = EConfig_1.default.getInstance();
    const __DEV__ = env_1.isDev();
    const DisableReactHotLoader = disableReactHotLoader || false; //默认启用热加载
    const nodeModulesPath = path.resolve(process.cwd(), 'node_modules');
    function hasWebpackExtend() {
        if (extend && typeof extend === 'function') {
            return true;
        }
        return false;
    }
    exports.tsloaderPlugin = () => {
        let tsCompileOption = {};
        if (tsCompilePlugin && tsCompilePlugin.option) {
            tsCompileOption = tsCompilePlugin.option;
        }
        return {
            loader: require.resolve('ts-loader'),
            options: Object.assign({
                // disable type checker - we will use it in fork plugin
                transpileOnly: true,
                happyPackMode: true,
            }, (tsCompileOption || {})),
        };
    };
    exports.getTsLoadersed = () => {
        const loaders = [];
        if (happyPack && happyPack.open) {
            loaders.push({
                test: /\.(ts|tsx)$/,
                include: [path.join(process.cwd(), './src')],
                loader: 'happypack/loader?id=ts',
                exclude: [],
            });
        }
        else {
            // 解决多线程下ts-loader 编译插件无法被执行问题
            loaders.push({
                test: /\.(ts|tsx)$/,
                include: [path.join(process.cwd(), './src')],
                use: [
                    {
                        loader: 'babel-loader',
                        query: babel.query,
                    },
                    exports.tsloaderPlugin(),
                ],
                exclude: [],
            });
        }
        if (hasWebpackExtend()) {
            extend(loaders, {
                isDev: __DEV__,
                loaderType: 'TsLoader',
                projectType,
            });
        }
        return loaders;
    };
    exports.getJSXLoadersed = () => {
        const loaders = [];
        const hotLoader = [];
        if (__DEV__) {
            if (!DisableReactHotLoader) {
                hotLoader.push({
                    test: /\.(jsx|js)?$/,
                    // loader: 'react-hot',
                    loader: 'react-hot-loader!babel-loader',
                    include: [path.join(process.cwd(), './src')],
                    exclude: [nodeModulesPath],
                });
                if (hasWebpackExtend()) {
                    extend(hotLoader, {
                        isDev: __DEV__,
                        loaderType: 'HotLoader',
                        projectType,
                    });
                }
            }
        }
        if (happyPack && happyPack.open) {
            loaders.push({
                test: /\.(jsx|js)?$/,
                include: [path.join(process.cwd(), './src')],
                loader: 'happypack/loader?id=js',
                exclude: [],
            });
        }
        else {
            loaders.push({
                test: /\.(jsx|js)?$/,
                include: [path.join(process.cwd(), './src')],
                use: [
                    {
                        loader: `babel-loader`,
                        query: babel.query,
                    },
                ],
                exclude: [],
            });
        }
        if (hasWebpackExtend()) {
            extend(loaders, {
                isDev: __DEV__,
                loaderType: 'JsLoader',
                projectType,
            });
        }
        return [...hotLoader, ...loaders];
    };
});
