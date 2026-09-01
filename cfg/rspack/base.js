(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "path", "../libs/settings/EConfig", "../libs/constants/constants", "../libs/webpack/plugins/htmlWebpackPlugin", "../libs/utils/env", "../libs/webpack/entries/getEntries", "../libs/utils/objects", "../libs/webpack/javaScriptLoader"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const path = require("path");
    const EConfig_1 = require("../../libs/settings/EConfig");
    const constants_1 = require("../../libs/constants/constants");
    const htmlWebpackPlugin_1 = require("../../libs/webpack/plugins/htmlWebpackPlugin");
    const env_1 = require("../../libs/utils/env");
    const getEntries_1 = require("../../libs/webpack/entries/getEntries");
    const objects_1 = require("../../libs/utils/objects");
    const javaScriptLoader_1 = require("../../libs/webpack/javaScriptLoader");
    const nodeModulesPath = path.resolve(process.cwd(), 'node_modules');
    // CSS 提取用 Rspack 原生 CssExtractRspackPlugin（mini-css-extract-plugin 2.10 在
    // @rspack/core 2.x 下因 webpack.util.serialization 缺失崩溃，见执行者必读）；
    // filename/chunkFilename 语义与 MCEP 一致
    const { CssExtractRspackPlugin } = require('@rspack/core');
    // Rspack 内核：bundler 与核心插件一律取自 @rspack/core，不再 require('webpack')
    const { DefinePlugin } = require('@rspack/core');
    const entries = (0, getEntries_1.getApps)();
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
    function getRspackBaseConfig({ name, devServer, imageInLineSize, defaultPort, publicPath, apps, server, babel, webpack: webpackConfig, htmlWebpackPlugin, isTslint, }) {
        // 结构/字段与 webpack 版 getBaseConfig 一致，见 cfg/base.js
        const __DEV__ = (0, env_1.isDev)();
        publicPath += name + '/';
        const { disableReactHotLoader, commonsChunkPlugin, plugins, output, css, } = webpackConfig;
        const NewOptimization = (0, objects_1.merge)(Optimization, webpackConfig.optimization);
        let libraryNested = {};
        if (output && typeof output === 'object' && !Array.isArray(output)) {
            // @rspack/core 2.x 对 legacy「字符串 library + libraryTarget」的归一化会把 type 丢成 var
            // （wms 首编译实证：window 类型被当 var 且拒绝带 - 的库名），必须用嵌套形式
            const extract = (item) => {
                const val = output[item];
                if (typeof val === 'string') return val;
                if (typeof val === 'function') return val(name);
                return undefined;
            };
            const libName = extract('library');
            const libType = extract('libraryTarget');
            if (libName || libType) {
                libraryNested.library = Object.assign(libType ? { type: libType } : {}, libName ? { name: libName } : {});
            }
        }
        function getEntries() {
            return entries().reduce((prev, app) => {
                prev[app] = `./src/${app}/index`;
                return prev;
            }, {});
        }
        /**
         * 项目侧透传插件归一化：webpack 包 DefinePlugin 实例 → @rspack/core DefinePlugin
         * （检测构造名；值字段兼容 webpack 新旧版本：5.106 为 definitions，更早为 values）
         */
        function normalizeProjectPlugins(list) {
            return (list || []).map((p) => {
                if (p && p.constructor && p.constructor.name === 'DefinePlugin') {
                    const defs = p.definitions !== undefined ? p.definitions : p.values;
                    if (defs && Object.keys(defs).length) {
                        return new DefinePlugin(defs);
                    }
                }
                return p;
            });
        }
        function getCssLoaders(css) {
            const CSS_MODULE_OPTION = {
                modules: { localIdentName: `[local]-[hash:base64:6]` },
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
                    return ['style-loader', ...style];
                }
                return [CssExtractRspackPlugin.loader, ...style];
            }
            if (!__DEV__) {
                config.plugins.push(new CssExtractRspackPlugin({
                    filename: '[name]/styles/[name].[contenthash:8].bundle.css',
                    chunkFilename: 'common/styles/[name].[contenthash:8].bundle.css',
                }));
            }
            const loaders = [
                {
                    test: /\.less/,
                    use: generateLoaders(null, {
                        loader: 'less-loader',
                        options: { lessOptions: { javascriptEnabled: true, math: 'always' } },
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
                    use: generateLoaders(null, postcss_loader, { loader: 'less-loader', options: { lessOptions: { javascriptEnabled: true, math: 'always' } } }),
                    include: [path.join(process.cwd(), './src')].concat((css === null || css === void 0 ? void 0 : css.loader_include) || []),
                },
                {
                    test: new RegExp(`^(.*\\.modules).*\\.less`),
                    use: generateLoaders(CSS_MODULE_OPTION, postcss_loader, { loader: 'less-loader', options: { lessOptions: { javascriptEnabled: true, math: 'always' } } }),
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
        // WP5 同款 asset 规则（引擎无关）：dev 图片 emit:false（验证点，见任务 11）
        function getImageLoaders() {
            if (__DEV__) {
                return [{
                        test: /\.(png|jpe?g|gif)$/,
                        type: 'asset/resource',
                        generator: { emit: false },
                    }];
            }
            return [{
                    test: /\.(png|jpe?g|gif)$/,
                    type: 'asset',
                    parser: { dataUrlCondition: { maxSize: imageInLineSize } },
                    generator: { filename: 'common/images/[hash:8].[name].[ext]' },
                }];
        }
        function getFontLoaders() {
            return [{
                    test: /\.(woff|woff2|svg|eot|ttf)$/,
                    type: 'asset',
                    parser: { dataUrlCondition: { maxSize: imageInLineSize } },
                    generator: { filename: 'fonts/[hash:8].[name].[ext]' },
                }];
        }
        function getFileResourcesLoaders() {
            return [{
                    test: /\.(mp4|ogg)$/,
                    type: 'asset/resource',
                    generator: { filename: 'others/[name].[ext]' },
                }];
        }
        function getTemplateJspLoaders() {
            return [{
                    test: /\.jsp$/,
                    type: 'asset/source',
                    exclude: [nodeModulesPath],
                }];
        }
        const config = {
            entry: getEntries(),
            mode: __DEV__ ? 'development' : 'production',
            devtool: __DEV__ && 'cheap-module-source-map',
            // Rspack 2.x 持久缓存（顶层 cache 字段；与 webpack 版 cache: { type: 'filesystem' } 同构；
            // experiments.newCache 在 2.2.1 仅切换缓存引擎不落盘，已实测排除）
            cache: {
                type: 'persistent',
                buildDependencies: [__filename],
            },
            output: Object.assign(Object.assign({}, libraryNested), { 
                // qiankun 产物形态（对齐 cfg/base.js）
                chunkLoadingGlobal: process.env.webpackJsonp || 'webpackJsonpName', path: path.join(process.cwd(), constants_1.DIST), filename: __DEV__
                    ? `[name]/js/[name].js`
                    : `[name]/js/[name].[chunkhash:5].bundle.js`, chunkFilename: 'common/js/[name].[chunkhash:5].bundle.js', publicPath: __DEV__ ? publicPath : process.env.cdnRelease || '../', hashFunction: 'xxhash64' }),
            resolve: Object.assign(Object.assign({}, webpackConfig.resolve), { alias: Object.assign({
                    // WP5 同款 UMD 模块别名
                    'legions-nprogress': path.resolve(nodeModulesPath, 'legions-nprogress/dist/legions-nprogress.esm.js'), 'legions-utils-tool': path.resolve(nodeModulesPath, 'legions-utils-tool/dist/legions-utils-tool.esm.js'),
                    // @legions/pro-design 对 @visactor/vtable-plugins 的深层子路径导入（exports 未声明）：
                    // rspack 解析器缺 webpack javascript/auto 的文件系统回退，逐条精确映射（目标文件已核实存在）
                    '@visactor/vtable-plugins/es/filter/filter-engine$': path.resolve(nodeModulesPath, '@visactor/vtable-plugins/es/filter/filter-engine.js'),
                    '@visactor/vtable-plugins/es/filter/types$': path.resolve(nodeModulesPath, '@visactor/vtable-plugins/es/filter/types.js'),
                    '@visactor/vtable-plugins/es/filter/value-filter$': path.resolve(nodeModulesPath, '@visactor/vtable-plugins/es/filter/value-filter.js'),
                    '@visactor/vtable-plugins/es/table-export/csv$': path.resolve(nodeModulesPath, '@visactor/vtable-plugins/es/table-export/csv/'),
                    '@visactor/vtable-plugins/es/table-export/excel$': path.resolve(nodeModulesPath, '@visactor/vtable-plugins/es/table-export/excel/'),
                }, ((webpackConfig.resolve && webpackConfig.resolve.alias) || {})), extensions: ['.web.js', '.js', '.json', '.ts', '.tsx', '.jsx'], byDependency: { esm: { fullySpecified: false } }, modules: [
                    'src',
                    'node_modules',
                    path.join(process.cwd(), `src`),
                    path.join(process.cwd(), `node_modules`),
                ] }),
            ignoreWarnings: [
                /export .+ was not found in/,
                /Should not import the named export/,
                /Module not found.*is not exported under the conditions/,
                /Replace .* to .*, because spec had been changed/,
                ...(webpackConfig.ignoreWarnings || []),
            ],
            optimization: NewOptimization,
            plugins: [
                ...(0, htmlWebpackPlugin_1.default)(null, entries),
                // 项目侧 .e-config.js 可能传入 webpack 包的 DefinePlugin 实例（如 wms-aps-web 的
                // LOCAL_OLD_URL/LOCAL_NEXT_URL 注入）。webpack 包的 DefinePlugin 在 @rspack/core 2.x
                // 下 hook 签名不兼容（读 undefined 崩溃，wms 首编译实证），按构造名检测并原值替换
                ...normalizeProjectPlugins(plugins),
                new DefinePlugin({
                    'process.env.environment': '"' + process.env.environment + '"',
                    'process.env.apps': '"' + process.env.apps + '"',
                    'process.env.webpackJsonp': '"' + process.env.webpackJsonp + '"',
                    'process.env.cdnRelease': '"' + process.env.cdnRelease + '"',
                }),
            ],
        };
        config.module = {
            parser: {
                javascript: {
                    // webpack 对 CJS/ESM 互操作命名导入缺导出仅告警（被 ignoreWarnings 吞掉），
                    // rspack 2.x 升格为 ESModulesLinkingError 阻断编译（wms 实证 568 处）。
                    // 关闭三导出存在性检查以对齐 webpack 行为（运行时 CJS 互操作本就可用）
                    importExportsPresence: false,
                    exportsPresence: false,
                    reexportsExportsPresence: false,
                },
            },
            rules: [
                {
                    // 对齐 webpack javascript/auto 语义：允许 exports 未声明的深层子路径
                    // 回退到文件系统解析（rspack 2.x 默认严格，wms 的 @visactor/vtable-plugins
                    // 深层导入实证 4 处 error）。fullySpecified 仅在规则级 resolve 生效
                    test: /\.(m?js|jsx|ts|tsx)$/,
                    resolve: { fullySpecified: false },
                },
                ...(0, javaScriptLoader_1.getJSXLoadersed)((babel === null || babel === void 0 ? void 0 : babel.loader_include) || []),
                ...(0, javaScriptLoader_1.getTsLoadersed)((babel === null || babel === void 0 ? void 0 : babel.loader_include) || []),
                ...getCssLoaders(css),
                ...getImageLoaders(),
                ...getFontLoaders(),
                ...getFileResourcesLoaders(),
                ...getTemplateJspLoaders(),
            ],
        };
        if (webpackConfig.extend && typeof webpackConfig.extend === 'function') {
            webpackConfig.extend &&
                webpackConfig.extend(config.module.rules, {
                    isDev: __DEV__,
                    type: 'module_rule',
                });
        }
        return config;
    }
    exports.default = getRspackBaseConfig;
});
