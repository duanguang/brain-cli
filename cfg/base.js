"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const constants_1 = require("../libs/constants/constants");
const webpack = require("webpack");
const htmlWebpackPlugin_1 = require("../libs/webpack/plugins/htmlWebpackPlugin");
const env_1 = require("../libs/utils/env");
const LegionExtractStaticFilePlugin_1 = require("../libs/webpack/plugins/LegionExtractStaticFilePlugin");
const nodeModulesPath = path.resolve(process.cwd(), 'node_modules');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
function getBaseConfig({ name, devServer, imageInLineSize, defaultPort, publicPath, apps, server, babel, webpack: webpackConfig }) {
    const __DEV__ = env_1.isDev();
    publicPath += name + "/";
    const { disableReactHotLoader } = webpackConfig;
    const { noInfo, proxy } = devServer;
    function getEntries() {
        const webpackDevEntries = [
            `webpack-dev-server/client?http://${server}:${defaultPort}`,
            `webpack/hot/only-dev-server`
        ];
        return apps.reduce((prev, app) => {
            prev = {
                'common/core': [
                    'react', 'mobx-react', 'mobx', 'babel-polyfill', 'superagent',
                    'react-router-dom', 'classnames', 'isomorphic-fetch',
                    'react-dom', 'history', 'invariant', 'warning', 'hoist-non-react-statics'
                ]
            };
            prev[app] = `./src/${app}/index`;
            /*prev[app] = [
                'babel-polyfill',
                `./src/${app}/index`
            ];*/
            if (__DEV__) {
                //prev[app].unshift(...webpackDevEntries);
                prev['common/core'].unshift(...webpackDevEntries);
            }
            return prev;
        }, {});
    }
    function getCssLoaders() {
        const CSS_MODULE_QUERY = `?modules&importLoaders=1&localIdentName=[local]-[hash:base64:6]`;
        if (__DEV__) {
            ExtractTextPlugin.extract = f => `style-loader!` + f;
        }
        else {
            config.plugins.push(
            //new ExtractTextPlugin('[name]/styles/[name].css')
            new ExtractTextPlugin('[name]/styles/[name].[contenthash:8].bundle.css', { allChunks: true }));
            config.plugins.push(new OptimizeCssAssetsPlugin({
                assetNameRegExp: /\.optimize\.css$/g,
                cssProcessor: require('cssnano'),
                cssProcessorOptions: { discardComments: { removeAll: true } },
                canPrint: true
            }));
        }
        return [
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract('css-loader!resolve-url'),
                include: [nodeModulesPath]
            },
            {
                test: /\.less/,
                loader: ExtractTextPlugin.extract(`css-loader${CSS_MODULE_QUERY}!resolve-url!postcss-loader!less-loader`),
                include: [path.resolve(nodeModulesPath, 'basics-widget')]
            },
            {
                test: /\.less/,
                loader: ExtractTextPlugin.extract(`css-loader!postcss-loader!less-loader`),
                include: [path.resolve(nodeModulesPath, 'antd')]
            },
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract(`css-loader?${CSS_MODULE_QUERY}!resolve-url!postcss-loader`),
                exclude: [nodeModulesPath]
            },
            {
                test: /\.less/,
                loader: ExtractTextPlugin.extract(`css-loader${CSS_MODULE_QUERY}!resolve-url!postcss-loader!less-loader`),
                exclude: [nodeModulesPath]
            }
        ];
    }
    function getJsonLoaders() {
        return [
            {
                test: /\.json$/,
                loader: 'json-loader'
            }
        ];
    }
    function getImageLoaders() {
        if (__DEV__) {
            return [
                {
                    test: /\.(png|jpg|gif)$/,
                    loaders: [
                        `file-loader`
                    ]
                }
            ];
        }
        return [
            {
                test: /\.(png|jpg|gif)$/,
                loaders: [
                    `url-loader?limit=${imageInLineSize}&name=images/[hash:8].[name].[ext]`,
                    //optimizationLevel似乎没什么用
                    `image-webpack?{optipng:{optimizationLevel:7}, pngquant:{quality: "65-90", speed: 4}, mozjpeg: {quality: 65}}`
                ]
            }
        ];
    }
    function getFontLoaders() {
        return [
            {
                test: /\.(woff|woff2|svg|eot|ttf)$/,
                loader: `url-loader?limit=${imageInLineSize}&name=fonts/[hash:8].[name].[ext]`
            }
        ];
    }
    function getJSXLoaders() {
        const loaders = [];
        if (__DEV__) {
            if (!disableReactHotLoader) {
                // if (!__DEV__) {
                //     warning(`please turn off the disableReactHotLoader option. it's not supposed to be on in production stage`);
                //     warning(`skip react-hot-loader`);
                // }
                loaders.push({
                    test: /\.jsx?$/,
                    loader: 'react-hot',
                    include: [path.join(process.cwd(), './src')],
                    exclude: [nodeModulesPath],
                });
            }
            else {
                babel.query.plugins.push("babel-plugin-legion-hmr");
            }
        }
        loaders.push({
            test: /\.jsx?$/,
            loader: `babel-loader`,
            query: babel.query,
            include: [
                path.join(process.cwd(), 'node_modules/basics-widget'),
                path.join(process.cwd(), './src')
            ],
        });
        return loaders;
    }
    function getFileResourcesLoaders() {
        return [
            {
                test: /\.(mp4|ogg)$/,
                loader: 'file-loader?&name=others/[name].[ext]'
            }
        ];
    }
    function getHtmlWebpackPlugins() {
        if (__DEV__) {
            return htmlWebpackPlugin_1.default();
        }
        else {
            // invariant(apps.length === 1, `在部署环境下仅支持单入口`);
            return htmlWebpackPlugin_1.default(apps);
        }
    }
    const config = {
        entry: getEntries(),
        port: defaultPort,
        additionalPaths: [],
        output: {
            path: path.join(process.cwd(), constants_1.DIST),
            filename: `[name]/js/bundle.js`,
            chunkFilename: 'bundle/[name]-[id].[chunkhash:5].bundle.js',
            publicPath: __DEV__ ? publicPath : "../"
        },
        devtool: __DEV__ && 'cheap-module-source-map',
        resolve: {
            alias: {}
        },
        module: {
            loaders: []
        },
        postcss: () => {
            return [require('autoprefixer')];
        },
        plugins: [
            ...getHtmlWebpackPlugins(),
            new webpack.optimize.CommonsChunkPlugin('common/core', 'common/core.js'),
            new HtmlWebpackHarddiskPlugin(),
            new webpack.DefinePlugin({
                "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || constants_1.DEV)
            })
        ]
    };
    if (__DEV__) {
        config.devServer = {
            stats: { colors: true },
            contentBase: [`./${constants_1.WORKING_DIRECTORY}/`],
            historyApiFallback: {
                rewrites: apps.map((app) => ({
                    from: constants_1.HISTORY_REWRITE_FALL_BACK_REGEX_FUNC(app),
                    to: `${publicPath}/${app}/index.html`
                }))
            },
            hot: true,
            port: defaultPort,
            publicPath: publicPath,
            noInfo: noInfo,
            proxy: proxy
        };
        config.plugins.push(new webpack.NoErrorsPlugin());
        config.plugins.push(new webpack.HotModuleReplacementPlugin());
    }
    else {
        config.plugins.push(new webpack.optimize.UglifyJsPlugin({
            mangle: false,
            compress: {
                warnings: false
            },
            comments: false
        }));
        config.plugins.push(new webpack.optimize.DedupePlugin());
        config.plugins.push(new LegionExtractStaticFilePlugin_1.default());
    }
    config.module = {
        loaders: [
            ...getJSXLoaders(),
            ...getCssLoaders(),
            ...getImageLoaders(),
            ...getJsonLoaders(),
            ...getFontLoaders(),
            ...getFileResourcesLoaders()
        ],
        noParse: []
    };
    return config;
}
exports.default = getBaseConfig;
