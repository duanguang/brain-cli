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
    /**
     * Fast Refresh babel 转换：给 babel options 合并 react-refresh/babel 插件（组件签名注册）。
     * 必须浅拷贝合并：babel.query 对象被双引擎共享，直接 push 会污染 webpack 引擎路径；
     * 插件用 require.resolve 绝对路径：由 brain-cli 上下文解析，不依赖项目侧依赖 hoist
     */
    function withReactRefresh(babelOptions) {
        return Object.assign(Object.assign({}, babelOptions), { plugins: [
                ...(babelOptions.plugins || []),
                // skipEnvCheck：brain-cli 用 NODE_ENV=dev 而非 development，
                // react-refresh/babel 的环境检查不认识 "dev" 会直接抛错
                [require.resolve('react-refresh/babel'), { skipEnvCheck: true }],
            ] });
    }
    const getTsLoadersed = (include = [], reactRefresh = false) => {
        const loaders = [];
        // WP5: 统一使用 babel-loader + ts-loader，不再区分 HappyPack 模式
        loaders.push({
            test: /\.(ts|tsx)$/,
            include: [path.join(process.cwd(), './src')].concat(include),
            use: [
                {
                    loader: 'babel-loader',
                    options: reactRefresh ? withReactRefresh(babel.query) : babel.query,
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
    const getJSXLoadersed = (include = [], reactRefresh = false) => {
        const loaders = [];
        const hotLoader = [];
        // react-refresh（Fast Refresh）与 react-hot-loader 是两套互斥的热替换机制，叠加会冲突；
        // rspack 引擎启用 Fast Refresh 时跳过 react-hot-loader 规则（webpack 引擎不受影响）
        if (__DEV__ && !reactRefresh) {
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
                    options: reactRefresh ? withReactRefresh(babel.query) : babel.query,
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
