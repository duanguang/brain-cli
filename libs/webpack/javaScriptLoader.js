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
    exports.getJSXLoadersed = exports.getTsLoadersed = exports.tsloaderPlugin = void 0;
    const EConfig_1 = require("../settings/EConfig");
    const env_1 = require("../utils/env");
    const path = require("path");
    const { webpack: { disableReactHotLoader, tsCompilePlugin, extend }, babel, } = EConfig_1.default.getInstance();
    const __DEV__ = (0, env_1.isDev)();
    const DisableReactHotLoader = disableReactHotLoader || false;
    const nodeModulesPath = path.resolve(process.cwd(), 'node_modules');
    function hasWebpackExtend() {
        if (extend && typeof extend === 'function') {
            return true;
        }
        return false;
    }
    const tsloaderPlugin = () => {
        let tsCompileOption = {};
        if (tsCompilePlugin && tsCompilePlugin.option) {
            tsCompileOption = tsCompilePlugin.option;
        }
        return {
            loader: require.resolve('ts-loader'),
            options: Object.assign({
                transpileOnly: true,
                // WP5: 移除 happyPackMode，不再使用 HappyPack
            }, (tsCompileOption || {})),
        };
    };
    exports.tsloaderPlugin = tsloaderPlugin;
    const getTsLoadersed = (include = []) => {
        const loaders = [];
        // WP5: 统一使用 babel-loader + ts-loader，不再区分 HappyPack 模式
        loaders.push({
            test: /\.(ts|tsx)$/,
            include: [path.join(process.cwd(), './src')].concat(include),
            use: [
                {
                    loader: 'babel-loader',
                    options: babel.query,
                },
                (0, exports.tsloaderPlugin)(),
            ],
        });
        if (hasWebpackExtend()) {
            extend(loaders, {
                isDev: __DEV__,
                type: 'ts_loader',
            });
        }
        return loaders;
    };
    exports.getTsLoadersed = getTsLoadersed;
    const getJSXLoadersed = (include = []) => {
        const loaders = [];
        const hotLoader = [];
        if (__DEV__) {
            if (!DisableReactHotLoader) {
                hotLoader.push({
                    test: /\.(jsx|js)?$/,
                    loader: 'babel-loader',
                    include: [path.join(process.cwd(), './src')].concat(include),
                    exclude: [nodeModulesPath],
                    options: {
                        cacheDirectory: true,
                        plugins: ['react-hot-loader/babel'],
                    },
                });
                if (hasWebpackExtend()) {
                    extend(hotLoader, {
                        isDev: __DEV__,
                        type: 'hot_loader',
                    });
                }
            }
        }
        // WP5: 统一使用 babel-loader，不再区分 HappyPack 模式
        loaders.push({
            test: /\.(jsx|js)?$/,
            include: [path.join(process.cwd(), './src')].concat(include),
            use: [
                {
                    loader: `babel-loader`,
                    options: babel.query,
                },
            ],
        });
        if (hasWebpackExtend()) {
            extend(loaders, {
                isDev: __DEV__,
                type: 'js_loader',
            });
        }
        return [...hotLoader, ...loaders];
    };
    exports.getJSXLoadersed = getJSXLoadersed;
});
