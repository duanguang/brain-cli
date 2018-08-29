import * as path from 'path';
import EConfig from '../libs/settings/EConfig';
import {HISTORY_REWRITE_FALL_BACK_REGEX_FUNC, DIST, WORKING_DIRECTORY, DEV} from '../libs/constants/constants';
import * as webpack from 'webpack';
import htmlWebpackPlugins from '../libs/webpack/plugins/htmlWebpackPlugin';
import {warning} from '../libs/utils/logs';
import * as invariant from 'invariant';
import {isDev} from '../libs/utils/env';
import LegionExtractStaticFilePlugin from "../libs/webpack/plugins/LegionExtractStaticFilePlugin";
const nodeModulesPath = path.resolve(process.cwd(), 'node_modules');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
// const HappyPack = require('happypack'),
//   os = require('os'),
//   happyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length });
export default function getBaseConfig({name, devServer, imageInLineSize, defaultPort, publicPath, apps, server, babel, webpack: webpackConfig,htmlWebpackPlugin}: EConfig) {
    const __DEV__ = isDev();

    publicPath += name + "/";
    const {disableReactHotLoader,commonsChunkPlugin} = webpackConfig;
    const DisableReactHotLoader=disableReactHotLoader||false;//默认启用热加载
    let CommonsChunkPlugin={name:'common',value:['babel-polyfill']}
    if(commonsChunkPlugin&&commonsChunkPlugin instanceof Array&&commonsChunkPlugin.length>0){
        CommonsChunkPlugin.value=[...new Set(commonsChunkPlugin.concat(CommonsChunkPlugin.value))];
    }
    const {noInfo, proxy} = devServer;
    const webpackDevEntries = [
        `webpack-dev-server/client?http://${server}:${defaultPort}`,
        `webpack/hot/only-dev-server`
        //'webpack/hot/dev-server'
    ];
    function getEntries(): any[] {
        let entity= apps.reduce((prev, app) => {
            // prev={
            //     'common/core':__DEV__?['react']:[
            //         'react','mobx-react','mobx','babel-polyfill','superagent',
            //         'react-router-dom','classnames','isomorphic-fetch',
            //         'react-dom','history','invariant','warning','hoist-non-react-statics'
            //     ]
            // }
            prev[app] = `./src/${app}/index`;
            // prev[app] = [
            //     'babel-polyfill',
            //     `./src/${app}/index`
            // ];

            return prev;
        }, {} as any);
        let chunk={};
        chunk[CommonsChunkPlugin.name]=CommonsChunkPlugin.value;
        entity= Object.assign(entity,chunk)
        if (__DEV__) {
           // entity[app].unshift(...webpackDevEntries);
           entity[CommonsChunkPlugin.name].unshift(...webpackDevEntries);
        }
        return entity
    }

    function getCssLoaders() {
        const CSS_MODULE_QUERY = `?modules&importLoaders=1&localIdentName=[local]-[hash:base64:6]`;
        const CSS_MODULE_OPTION={
            modules:true,
            importLoaders:1,
            localIdentName:`[local]-[hash:base64:6]`
        };
        let browsers= EConfig.getInstance().postcss.autoprefixer.browsers;
        let px2rem=EConfig.getInstance().postcss.px2rem;
        const postcss_loader={
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: [
                require('autoprefixer')({browsers})
              ]
            }
        }
        if(px2rem){
            postcss_loader.options.plugins.push(require('px2rem')(px2rem)) 
        }
        function generateLoaders(cssModule?,loader?:string, loaderOptions?){
            let style :any= [{ loader: 'css-loader' }];
            if(cssModule){
                style[0]=Object.assign(style[0],{ options: cssModule})
            }
            if(loader){
                style.push(loader);
            }
            if(loaderOptions){
                style.push(loaderOptions);
            }
            if(__DEV__){
                let styles=['style-loader',...style]
                return styles;
            }         
            return ExtractTextPlugin.extract(
            {
                fallback: 'style-loader',
                use: style,
            })
        }
        if (!__DEV__) {
           // ExtractTextPlugin.extract = f => `style-loader!` + f;
            config.plugins.push(
                //new ExtractTextPlugin('[name]/styles/[name].css')
                new ExtractTextPlugin({filename:'[name]/styles/[name].[contenthash:8].bundle.css',allChunks:true})
            );
            config.plugins.push(
                new OptimizeCssAssetsPlugin({
                    assetNameRegExp: /\.optimize\.css$/g,
                    cssProcessor: require('cssnano'),
                    cssProcessorOptions: { discardComments: {removeAll: true } },
                    canPrint: true
                })
            )
        }
        
        return [
            {
                test: /\.css$/,
                use:generateLoaders(),
                // use: ExtractTextPlugin.extract(
                //     {
                //         fallback: 'style-loader',
                //         use: [
                //           { loader: 'css-loader' },
                          
                //         ]
                //       }),
                include: [nodeModulesPath]
            },
            {
                test: /\.less/,
                use: generateLoaders(CSS_MODULE_OPTION,'less-loader', postcss_loader),
                // use:ExtractTextPlugin.extract(
                //     {
                //         fallback: 'style-loader',
                //         use: [
                //             {loader:`css-loader`,options:CSS_MODULE_OPTION},'less-loader',postcss_loader
                //         ]
                //       }),
                include: [path.resolve(nodeModulesPath, 'basics-widget')]
            },
            {
                test: /\.less/,
                use: generateLoaders(null,'less-loader'),
                // use:ExtractTextPlugin.extract(
                //     {
                //         fallback: 'style-loader',
                //         use: [
                //             {loader:`css-loader`},'less-loader',postcss_loader
                //         ]
                //       }),
                include: [path.resolve(nodeModulesPath, 'antd')]
            },
            {
                test: /\.css$/,
                use: generateLoaders(null,null, postcss_loader),
                // use:ExtractTextPlugin.extract(
                //     {
                //         fallback: 'style-loader',
                //         use: [
                //             {loader:`css-loader`,options:CSS_MODULE_OPTION},postcss_loader
                //         ]
                //       }),
                exclude: [nodeModulesPath]
            },
            {
                test: /\.less/,
                use: generateLoaders(CSS_MODULE_OPTION,'less-loader', postcss_loader),
                // use:ExtractTextPlugin.extract(
                //     {
                //         fallback: 'style-loader',
                //         use: [
                //             {loader:`css-loader`,options:CSS_MODULE_OPTION},'less-loader',postcss_loader
                //         ]
                //       }
                // ),
                exclude: [nodeModulesPath]
            }
        ]
    }
    function getJsonLoaders(){
        return[
            {
                test: /\.json$/,
                loader: 'json-loader'
            }
        ]
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
            ]
        }
        return [
            {
                test: /\.(png|jpg|gif)$/,
                //loader: `url-loader?limit=${8192}&name=${path.posix.join('common', 'images/[hash:8].[name].[ext]')}`,
                loaders: [
                    `file-loader?limit=${imageInLineSize}&name=common/images/[hash:8].[name].[ext]`,
                    //optimizationLevel似乎没什么用
                    //`image-webpack?{optipng:{optimizationLevel:7}, pngquant:{quality: "65-90", speed: 4}, mozjpeg: {quality: 65}}`
                ]
            }
        ]
    }

    function getFontLoaders() {
        return [
            {
                test: /\.(woff|woff2|svg|eot|ttf)$/,
                loader: `url-loader?limit=${imageInLineSize}&name=fonts/[hash:8].[name].[ext]`
            }
        ]
    }

    function getJSXLoaders() {
        const loaders = [];
        if (__DEV__) {
            if (!DisableReactHotLoader) {
                // if (!__DEV__) {
                //     warning(`please turn off the disableReactHotLoader option. it's not supposed to be on in production stage`);
                //     warning(`skip react-hot-loader`);
                // }
                loaders.push({
                    test: /\.(jsx|js)?$/,
                   // loader: 'react-hot',
                    loader:'react-hot-loader!babel-loader',
                    include: [path.join(process.cwd(), './src')],
                    exclude: [nodeModulesPath],//优化构建效率
                });
            }
            else {
                babel.query.plugins.push("babel-plugin-legion-hmr");
            }
        }
        // loaders.push(
        //     {
        //       test: /\.js|jsx$/,
        //       loader: 'HappyPack/loader?id=jsHappy',
        //       exclude: /node_modules/
        //     }
        // )
        loaders.push(
            {
                test: /\.(jsx|js)?$/,
                loader: `babel-loader`,
                query: babel.query,
                include: [
                    path.join(process.cwd(), 'node_modules/basics-widget'),
                    path.join(process.cwd(), './src')
                ],
                exclude: [nodeModulesPath]
            }
        );
        
        return loaders;
    }

    function getFileResourcesLoaders() {
        return [
            {
                test: /\.(mp4|ogg)$/,
                loader: 'file-loader?&name=others/[name].[ext]'
            }
        ]
    }

    function getHtmlWebpackPlugins() {
        if (__DEV__) {
            return htmlWebpackPlugins()
        }
        else {
            // invariant(apps.length === 1, `在部署环境下仅支持单入口`);
            return htmlWebpackPlugins(apps);
        }
    }
    const config: any = {
        entry: getEntries(),
        //port: defaultPort,
        //additionalPaths: [],
        output: {
            path: path.join(process.cwd(), `${DIST}`),
            filename: `[name]/js/[name].[chunkhash:5].bundle.js`,
            chunkFilename: 'bundle/[name]-[id].[chunkhash:5].bundle.js',
            //chunkFilename:path.posix.join('common', 'js/[name]-[id].[chunkhash:5].bundle.js'),
            publicPath: __DEV__?publicPath:"../"
        },
        devtool: __DEV__ && 'cheap-module-source-map',
        resolve: {
            alias: {},
            extensions: ['.web.js','.js', '.json', 'ts','.css', '.tsx','.jsx'],//自动扩展文件后缀
            //modulesDirectories: ['src', 'node_modules', path.join(__dirname, '../node_modules')],
            modules: [
                'src', 'node_modules', path.join(__dirname, '../node_modules')
              ]
        },
        module: {
            loaders: []
        },
        plugins: [
            ...getHtmlWebpackPlugins(),
            // new webpack.optimize.CommonsChunkPlugin({
            //     name: CommonsChunkPlugin.name, 
            //     filename: 'common/js/core.js',
            // }),
            new webpack.optimize.CommonsChunkPlugin({
                name: CommonsChunkPlugin.name, 
                minChunks: function (module) {
                    // 该配置假定你引入的 vendor 存在于 node_modules 目录中
                    return (
                        module.resource &&
                        /\.js$/.test(module.resource) &&
                        module.resource.indexOf(
                          path.join(__dirname, '../node_modules')
                        ) === 0
                      )
                   // return module.context && module.context.indexOf('node_modules') !== -1;
                 },
                 filename: 'common/js/[name].[chunkhash:5].core.js',
            }),
            new webpack.optimize.CommonsChunkPlugin({
                name: 'manifest',
                chunks: ['common'],
                filename: process.env.NODE_ENV!=='dev'?'common/js/manifest.[chunkhash:5].js':'common/js/manifest.js',
              }),
            // new HappyPack({
            //     id: 'jsHappy',
            //     cache: true,
            //     threadPool: happyThreadPool,
            //     loaders: [{
            //       path: 'babel',
            //       query: {
            //         cacheDirectory: '.webpack_cache',
            //         presets: [
            //           'es2015',
            //           'react'
            //         ]
            //       }
            //     }]
            //   }),
            //如果有单独提取css文件的话
            // new HappyPack({
            //    id: 'lessHappy',
            //    loaders: ['style','css','less']
            //     // loaders: [ 'style-loader', 'css-loader', 'less-loader' ]
            // }),
            new HtmlWebpackHarddiskPlugin(),
            new webpack.DefinePlugin({
                "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || DEV),
                'process.env.environment': '\"' + process.env.environment + '\"'
            })
        ]
    };

    if (__DEV__) {
        config.devServer = {
            stats: {colors: true},
            contentBase: [`./${WORKING_DIRECTORY}/`],
            historyApiFallback: {
                rewrites: apps.map((app: string) => ({
                    from: HISTORY_REWRITE_FALL_BACK_REGEX_FUNC(app),
                    to: `${publicPath}/${app}/index.html`
                }))
            },
            hot: true,
            port: defaultPort,
            publicPath: publicPath,
            noInfo: noInfo,
            proxy: proxy,
            inline: false,
            progress: true,
        };

        config.plugins.push(new webpack.NoEmitOnErrorsPlugin());
        config.plugins.push(new webpack.HotModuleReplacementPlugin());
        // config.plugins.push(new CopyWebpackPlugin([
        //     {
        //       from: path.resolve(__dirname, '../common'),
        //       to: 'common',
        //       ignore: ['.*']
        //     }
        //   ]))
    }
    else {
        config.plugins.push(
            new webpack.optimize.UglifyJsPlugin({
               // mangle: false,
                 // 最紧凑的输出
                //beautify: false,
                compress: {
                    warnings: false,
                    drop_debugger: true,// 删除所有的 `console` 语句// 还可以兼容ie浏览器
                    drop_console: true
                },
                comments: false,// 删除所有的注释
            })
        );
        if(process.env.environment==='report'){
            config.plugins.push(
                new BundleAnalyzerPlugin()
               // new webpack.optimize.DedupePlugin()//webpack1用于优化重复模块
            );
        }       
        config.plugins.push(new LegionExtractStaticFilePlugin());
    }
    config.module = {
        rules: [
            ...getJSXLoaders(),
            ...getCssLoaders(),
            ...getImageLoaders(),
            ...getJsonLoaders(),
            ...getFontLoaders(),
            ...getFileResourcesLoaders()
        ],
        //noParse: []
    };
    return config;
}