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
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "path", "../libs/settings/EConfig", "../libs/constants/constants", "webpack", "../libs/webpack/plugins/htmlWebpackPlugin", "../libs/utils/env", "../libs/webpack/plugins/LegionExtractStaticFilePlugin", "../libs/webpack/entries/getEntries", "../libs/utils/objects", "../libs/webpack/javaScriptLoader"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const path = require("path");
    const fs = require("fs");
    const EConfig_1 = require("../libs/settings/EConfig");
    const constants_1 = require("../libs/constants/constants");
    const webpack = require("webpack");
    const htmlWebpackPlugin_1 = require("../libs/webpack/plugins/htmlWebpackPlugin");
    const env_1 = require("../libs/utils/env");
    const LegionExtractStaticFilePlugin_1 = require("../libs/webpack/plugins/LegionExtractStaticFilePlugin");
    const getEntries_1 = require("../libs/webpack/entries/getEntries");
    const objects_1 = require("../libs/utils/objects");
    const javaScriptLoader_1 = require("../libs/webpack/javaScriptLoader");
    const nodeModulesPath = path.resolve(process.cwd(), 'node_modules');
    const MiniCssExtractPlugin = require('mini-css-extract-plugin');
    const CssMinimizerWebpackPlugin = require('css-minimizer-webpack-plugin');
    const CopyWebpackPlugin = require('copy-webpack-plugin');
    const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
        .BundleAnalyzerPlugin;
    const SpritesmithPlugin = require('webpack-spritesmith');
    const express = require('express');
    const TerserPlugin = require('terser-webpack-plugin');
    const Optimization = {
        runtimeChunk: false,
        splitChunks: {
            cacheGroups: {
                common: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'common',
                    chunks: 'initial',
                    minChunks: 1,
                    priority: 6,
                },
            },
        },
    };
    const entries = (0, getEntries_1.getApps)();
    function getBaseConfig({ name, devServer, imageInLineSize, defaultPort, publicPath, apps, server, babel, webpack: webpackConfig, htmlWebpackPlugin, isTslint, }) {
        var _a, _b;
        const __DEV__ = (0, env_1.isDev)();
        publicPath += name + '/';
        const { disableReactHotLoader, commonsChunkPlugin, plugins, output, css, } = webpackConfig;
        const NewOptimization = (0, objects_1.merge)(Optimization, webpackConfig.optimization);
        const { noInfo, proxy, before, stats, contentBase, historyApiFallback, headers = {}, hot, port } = devServer, serverProps = __rest(devServer, ["noInfo", "proxy", "before", "stats", "contentBase", "historyApiFallback", "headers", "hot", "port"]);
        const webpackDevEntries = [
        /* 'react-hot-loader/patch',  */
        /*  `webpack-dev-server/client?http://localhost:${defaultPort}`,
        `webpack/hot/only-dev-server` */
        /* 'webpack/hot/dev-server' */
        ];
        function getEntries() {
            let entity = entries().reduce((prev, app) => {
                prev[app] = `./src/${app}/index`;
                return prev;
            }, {});
            let chunk = {};
            /* chunk[CommonsChunkPlugin.name] = CommonsChunkPlugin.value; */
            entity = Object.assign(entity, chunk);
            return entity;
        }
        function getCssLoaders(css) {
            const CSS_MODULE_QUERY = `?modules&importLoaders=1&localIdentName=[local]-[hash:base64:6]`;
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
            function generateLoaders(cssModule, loader, loaderOptions) {
                let style = [
                    { loader: 'css-loader', options: { importLoaders: 1 } },
                ];
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
            if (!__DEV__) {
                config.plugins.push(new MiniCssExtractPlugin({
                    filename: '[name]/styles/[name].[contenthash:8].bundle.css',
                    chunkFilename: 'common/styles/[name].[contenthash:8].bundle.css',
                }));
                // WP5: 使用 CssMinimizerWebpackPlugin 替代 OptimizeCssAssetsPlugin
                config.optimization.minimizer = [
                    ...(config.optimization.minimizer || []),
                    new CssMinimizerWebpackPlugin(),
                ];
            }
            const loaders = [
                {
                    test: /\.less/,
                    use: generateLoaders(null, {
                        loader: 'less-loader',
                        options: { lessOptions: { javascriptEnabled: true, math: 'always', quietDeprecations: true } },
                    }),
                    include: [path.resolve(nodeModulesPath, 'antd'), /antd/],
                },
                {
                    test: new RegExp(`^(?!.*\\.modules).*\\.css`),
                    use: generateLoaders(null, null, postcss_loader),
                    include: [path.join(process.cwd(), './src')].concat((css === null || css === void 0 ? void 0 : css.loader_include) || []),
                },
                {
                    test: new RegExp(`^(.*\\.modules).*\\.css`),
                    use: generateLoaders(CSS_MODULE_OPTION, null, postcss_loader),
                    include: [path.join(process.cwd(), './src')].concat((css === null || css === void 0 ? void 0 : css.loader_include) || []),
                },
                {
                    test: new RegExp(`^(?!.*\\.modules).*\\.less`),
                    use: generateLoaders(null, postcss_loader, { loader: 'less-loader', options: { lessOptions: { javascriptEnabled: true, math: 'always', quietDeprecations: true } } }),
                    include: [path.join(process.cwd(), './src')].concat((css === null || css === void 0 ? void 0 : css.loader_include) || []),
                },
                {
                    test: new RegExp(`^(.*\\.modules).*\\.less`),
                    use: generateLoaders(CSS_MODULE_OPTION, postcss_loader, { loader: 'less-loader', options: { lessOptions: { javascriptEnabled: true, math: 'always', quietDeprecations: true } } }),
                    include: [path.join(process.cwd(), './src')].concat((css === null || css === void 0 ? void 0 : css.loader_include) || []),
                },
            ];
            if (webpackConfig.extend && typeof webpackConfig.extend === 'function') {
                webpackConfig.extend &&
                    webpackConfig.extend(loaders, {
                        isDev: __DEV__,
                        type: 'style_loader',
                        transform: {
                            cssModule: CSS_MODULE_OPTION,
                            postcss_loader: postcss_loader,
                            execution: generateLoaders,
                        },
                    });
            }
            return loaders;
        }
        // WP5: 原生支持 JSON，无需 json-loader
        function getJsonLoaders() {
            return [];
        }
        // WP5: 使用 Asset Modules 替代 file-loader/url-loader
        function getImageLoaders() {
            if (__DEV__) {
                return [
                    {
                        test: /\.(png|jpe?g|gif)$/,
                        type: 'asset/resource',
                        generator: {
                            emit: false,
                        },
                    },
                ];
            }
            return [
                {
                    test: /\.(png|jpe?g|gif)$/,
                    type: 'asset',
                    parser: {
                        dataUrlCondition: {
                            maxSize: imageInLineSize,
                        },
                    },
                    generator: {
                        filename: 'common/images/[hash:8].[name].[ext]',
                    },
                },
            ];
        }
        // WP5: 使用 Asset modules 替代 url-loader
        function getFontLoaders() {
            return [
                {
                    test: /\.(woff|woff2|svg|eot|ttf)$/,
                    type: 'asset',
                    parser: {
                        dataUrlCondition: {
                            maxSize: imageInLineSize,
                        },
                    },
                    generator: {
                        filename: 'fonts/[hash:8].[name].[ext]',
                    },
                },
            ];
        }
        // WP5: 使用 Asset modules 替代 file-loader
        function getFileResourcesLoaders() {
            return [
                {
                    test: /\.(mp4|ogg)$/,
                    type: 'asset/resource',
                    generator: {
                        filename: 'others/[name].[ext]',
                    },
                },
            ];
        }
        // WP5: 使用 Asset modules 替代 raw-loader
        function getTemplateJspLoaders() {
            return [
                {
                    test: /\.jsp$/,
                    type: 'asset/source',
                    exclude: [nodeModulesPath],
                },
            ];
        }
        function getTslintLoaders() {
            if (isTslint) {
                return [
                    {
                        test: /\.ts|tsx$/,
                        exclude: /node_modules/,
                        enforce: 'pre',
                        loader: 'tslint-loader',
                    },
                ];
            }
            return [];
        }
        function getHtmlWebpackPlugins() {
            if (__DEV__) {
                return (0, htmlWebpackPlugin_1.default)(null, entries);
            }
            else {
                return (0, htmlWebpackPlugin_1.default)(null, entries);
            }
        }
        const templateFunction = function (data) {
            const shared = '.w-icon { background-image: url(I); }'.replace('I', data.sprites.length ? data.sprites[0].image : '');
            const perSprite = data.sprites
                .map(function (sprite) {
                return '.w-icon-N { width: SWpx; height: SHpx; }\n.w-icon-N .w-icon, .w-icon-N.w-icon { width: Wpx; height: Hpx; background-position: Xpx Ypx; margin-top: -SHpx; margin-left: -SWpx; } '
                    .replace(/N/g, sprite.name)
                    //@ts-ignore
                    .replace(/SW/g, sprite.width / 2)
                    //@ts-ignore
                    .replace(/SH/g, sprite.height / 2)
                    .replace(/W/g, sprite.width)
                    .replace(/H/g, sprite.height)
                    .replace(/X/g, sprite.offset_x)
                    .replace(/Y/g, sprite.offset_y);
            })
                .join('\n');
            return shared + '\n' + perSprite;
        };
        const SpritesmithPlugins = apps.map(item => {
            return new SpritesmithPlugin({
                src: {
                    cwd: path.resolve(process.cwd(), `./src/${item}/assets/images/icons/`),
                    glob: '**/*.png',
                },
                target: {
                    image: path.resolve(process.cwd(), `./src/${item}/assets/css/sprites-generated.png`),
                    css: [
                        [
                            path.resolve(process.cwd(), `./src/${item}/assets/css/sprites-generated.css`),
                            {
                                format: 'function_based_template',
                            },
                        ],
                    ],
                },
                customTemplates: {
                    function_based_template: templateFunction,
                },
                apiOptions: {
                    cssImageRef: './sprites-generated.png',
                },
                spritesmithOptions: {
                    padding: 4,
                },
            });
        });
        const library = {};
        if (output && typeof output === 'object' && !Array.isArray(output)) {
            const libraryArrylist = ['library', 'libraryTarget'];
            libraryArrylist.map((item) => {
                if (output.hasOwnProperty(item)) {
                    if (typeof output[item] === 'string') {
                        library[item] = output[item];
                    }
                    else if (typeof output[item] === 'function') {
                        library[item] = output[item](name);
                    }
                }
            });
        }
        const config = {
            entry: getEntries(),
            // WP5: 文件系统缓存，替代 DLL 解决内存增长问题
            cache: {
                type: 'filesystem',
                // 用户配置文件（.e-config.js/.e-config-ignore.js）纳入缓存依赖：
                // 用户配置变更后缓存自动失效，避免改配置后重启仍命中旧缓存
                buildDependencies: {
                    config: [
                        __filename,
                        ...[
                            path.resolve(process.cwd(), constants_1.PROJECT_USER_CONFIG_FILE),
                            path.resolve(process.cwd(), constants_1.PROJECT_USER_CONFIG_IGNORE_FILE),
                        ].filter(function (p) { return fs.existsSync(p); }),
                    ],
                },
                cacheDirectory: path.resolve(process.cwd(), '.webpack_cache'),
            },
            output: Object.assign(Object.assign({}, library), { 
                // WP5: chunkLoadingGlobal 替代 jsonpFunction
                chunkLoadingGlobal: process.env.webpackJsonp || 'webpackJsonpName', path: path.join(process.cwd(), `${constants_1.DIST}`), filename: __DEV__
                    ? `[name]/js/[name].js`
                    : `[name]/js/[name].[chunkhash:5].bundle.js`, chunkFilename: 'common/js/[name].[chunkhash:5].bundle.js', publicPath: __DEV__ ? publicPath : process.env.cdnRelease || '../', 
                // WP5: 使用更快的 hash 算法
                hashFunction: 'xxhash64' }),
            devtool: __DEV__ && 'cheap-module-source-map',
            resolve: Object.assign(Object.assign({}, webpackConfig.resolve), { alias: Object.assign({ 
                    // WP5: UMD 模块别名，解决 Webpack 5 无法识别 UMD 命名导出的问题
                    'legions-nprogress': path.resolve(nodeModulesPath, 'legions-nprogress/dist/legions-nprogress.esm.js'), 'legions-utils-tool': path.resolve(nodeModulesPath, 'legions-utils-tool/dist/legions-utils-tool.esm.js') }, (((_a = webpackConfig.resolve) === null || _a === void 0 ? void 0 : _a.alias) || {})), extensions: ['.web.js', '.js', '.json', '.ts', '.tsx', '.jsx'], modules: [
                    'src',
                    'node_modules',
                    path.join(process.cwd(), `src`),
                    path.join(process.cwd(), `node_modules`),
                ] }),
            mode: (0, env_1.isDev)() ? 'development' : 'production',
            // WP5: 跳过第三方库导出不兼容警告（Webpack 5 更严格的 ESM/CJS 互操作检测）
            ignoreWarnings: [
                /export .+ was not found in/,
                /Should not import the named export/,
                /Module not found.*is not exported under the conditions/,
                /Replace .* to .*, because spec had been changed/,
                ...(webpackConfig.ignoreWarnings || []),
            ],
            optimization: NewOptimization,
            plugins: [
                ...getHtmlWebpackPlugins(),
                ...SpritesmithPlugins,
                ...plugins,
                // WP5: 移除 HappyPack，使用原生并行处理
                ...((0, env_1.isDev)()
                    ? []
                    : [
                        new TerserPlugin({
                            parallel: true,
                            extractComments: false,
                            terserOptions: {
                                compress: {
                                    drop_debugger: true,
                                    drop_console: true,
                                },
                            },
                        }),
                    ]),
                new webpack.DefinePlugin({
                    // 'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || (__DEV__ ? 'development' : 'production')),
                    'process.env.environment': '"' + process.env.environment + '"',
                    'process.env.apps': '"' + process.env.apps + '"',
                    'process.env.webpackJsonp': '"' + process.env.webpackJsonp + '"',
                    'process.env.cdnRelease': '"' + process.env.cdnRelease + '"',
                }),
            ],
        };
        if (__DEV__) {
            config.devServer = Object.assign(Object.assign({}, serverProps), { static: {
                    directory: path.resolve(process.cwd(), constants_1.WORKING_DIRECTORY),
                }, 
                // WP5: publicPath 移到 devMiddleware
                devMiddleware: {
                    publicPath: publicPath,
                    stats: 'errors-only',
                }, historyApiFallback: {
                    rewrites: apps.map((app) => ({
                        from: (0, constants_1.HISTORY_REWRITE_FALL_BACK_REGEX_FUNC)(app),
                        to: `${publicPath}/${app}/index.html`,
                    })),
                }, headers: Object.assign({ 'Access-Control-Allow-Origin': '*' }, headers), hot: true, port: defaultPort, proxy: proxy, 
                // WP5 dev-server v4: setupMiddlewares 替代 onBeforeSetupMiddleware
                setupMiddlewares: function (middlewares, devServer) {
                    if (!devServer)
                        return middlewares;
                    devServer.app.use(path.posix.join(`/static`), express.static('./static'));
                    before && before(devServer.app);
                    return middlewares;
                } });
        }
        else {
            if (process.env.environment === 'report') {
                config.plugins.push(new BundleAnalyzerPlugin());
            }
            config.plugins.push(new LegionExtractStaticFilePlugin_1.default());
            // WP5: CopyWebpackPlugin v11 使用对象格式
            config.plugins.push(new CopyWebpackPlugin({
                patterns: [
                    {
                        from: path.join(process.cwd(), `static`),
                        to: 'common',
                        globOptions: {
                            ignore: ['.*'],
                        },
                    },
                ],
            }));
        }
        config.module = {
            rules: [
                ...(0, javaScriptLoader_1.getJSXLoadersed)((babel === null || babel === void 0 ? void 0 : babel.loader_include) || []),
                ...(0, javaScriptLoader_1.getTsLoadersed)((babel === null || babel === void 0 ? void 0 : babel.loader_include) || []),
                ...getCssLoaders(css),
                ...getImageLoaders(),
                ...getJsonLoaders(),
                ...getFontLoaders(),
                ...getFileResourcesLoaders(),
                ...getTemplateJspLoaders(),
            ],
        };
        if (webpackConfig.extend && typeof webpackConfig.extend === 'function') {
            webpackConfig.extend &&
                webpackConfig.extend(((_b = config === null || config === void 0 ? void 0 : config.module) === null || _b === void 0 ? void 0 : _b.rules) || [], {
                    isDev: __DEV__,
                    type: 'module_rule',
                });
        }
        return config;
    }
    exports.default = getBaseConfig;
});
