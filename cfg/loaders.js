(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../libs/utils/env", "../libs/constants/constants", "path", "../libs/settings/EConfig"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.loaders = void 0;
    const env_1 = require("../libs/utils/env");
    const constants_1 = require("../libs/constants/constants");
    const path = require("path");
    const EConfig_1 = require("../libs/settings/EConfig");
    /**
     * @deprecated 此文件已废弃，CSS/Less 加载器配置已迁移到 cfg/base.ts 的 getCssLoaders() 方法中。
     * WP5 升级后使用 MiniCssExtractPlugin 替代了 ExtractTextPlugin，加载器配置在 base.ts 中统一管理。
     * 保留此文件仅为向后兼容，如需自定义样式加载器，请通过 webpack.extend 配置项扩展。
     */
    const __DEV__ = (0, env_1.isDev)();
    const CSS_MODULE_OPTION = {
        modules: {
            localIdentName: `[local]-[hash:base64:6]`,
        },
        importLoaders: 1,
    };
    let browsers = EConfig_1.default.getInstance().postcss.autoprefixer.browsers;
    let px2rem = EConfig_1.default.getInstance().postcss.px2rem;
    const postcss_loader = {
        loader: 'postcss-loader',
        options: {
            postcssOptions: {
                plugins: [require('autoprefixer')({ overrideBrowserslist: browsers })],
            },
        },
    };
    if (px2rem && Object.getOwnPropertyNames(px2rem).length) {
        postcss_loader.options.postcssOptions.plugins.push(require('postcss-plugin-px2rem')(px2rem));
    }
    const MiniCssExtractPlugin = require('mini-css-extract-plugin');
    function generateLoaders(cssModule, loader, loaderOptions) {
        let style = [{ loader: 'css-loader', options: { importLoaders: 1 } }];
        if (cssModule) {
            style[0] = Object.assign(style[0], { options: cssModule });
        }
        if (loader) {
            style.push(loader);
        }
        if (loaderOptions) {
            style.push(loaderOptions);
        }
        if (__DEV__) {
            let styles = ['style-loader', ...style];
            return styles;
        }
        // WP5: 使用 MiniCssExtractPlugin 替代 ExtractTextPlugin
        return [MiniCssExtractPlugin.loader, ...style];
    }
    exports.loaders = [
        {
            test: /\.less/,
            use: generateLoaders(null, {
                loader: 'less-loader',
                options: { lessOptions: { javascriptEnabled: true } },
            }),
            include: [path.resolve(constants_1.nodeModulesPath, 'antd')],
        },
        {
            test: new RegExp(`^(?!.*\\.modules).*\\.css`),
            use: generateLoaders(null, null, postcss_loader),
            exclude: [constants_1.nodeModulesPath],
            include: path.join(process.cwd(), './src'),
        },
        {
            test: new RegExp(`^(.*\\.modules).*\\.css`),
            use: generateLoaders(CSS_MODULE_OPTION, null, postcss_loader),
            exclude: [constants_1.nodeModulesPath],
            include: path.join(process.cwd(), './src'),
        },
        {
            test: new RegExp(`^(?!.*\\.modules).*\\.less`),
            use: generateLoaders(null, postcss_loader, {
                loader: 'less-loader',
                options: { lessOptions: { javascriptEnabled: true } },
            }),
            exclude: [constants_1.nodeModulesPath],
            include: path.join(process.cwd(), './src'),
        },
        {
            test: new RegExp(`^(.*\\.modules).*\\.less`),
            use: generateLoaders(CSS_MODULE_OPTION, postcss_loader, {
                loader: 'less-loader',
                options: { lessOptions: { javascriptEnabled: true } },
            }),
            exclude: [constants_1.nodeModulesPath],
            include: path.join(process.cwd(), './src'),
        },
    ];
});
