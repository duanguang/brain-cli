const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const chalk = require('chalk');
module.exports = {
    name: "test",
    open: true,
    defaultPort: 8001,
    server: "0.0.0.0",
    imageInLineSize: 8192,
    publicPath: "/public/",
    devServer: {
        noInfo: true,
        proxy: {
            // '/cia-j': {
            //     target: 'http://192.168.1.181:8081',
            //         onProxyReq: (proxyReq, req, res) => {
            //         }
            // },
        }
    },
    postcss: {
        // px2rem:{
        //     rootValue: 75,
        //     unitPrecision: 3,
        // },
        autoprefixer: {
            /**
             * 参考dora配置
             */
            browsers: [
                "last 2 versions",
                // "Firefox ESR",
                "Firefox >= 15",
                "> 1%",
                "ie >= 8",
                "not ie<=8"
            ]
        }
    },
    webpack: {
        dllConfig: {
            vendors: ['react','babel-polyfill',
            'react-dom','invariant']
        },
        disableReactHotLoader: false,
        commonsChunkPlugin:['react','babel-polyfill',
                 'react-dom','invariant'],
        disableHappyPack:false,
        cssModules: {
            enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
            // config: {
            //   namingPattern: 'module', // 转换模式，取值为 global/module，下文详细说明
            //   generateScopedName: '[name]__[local]___[hash:base64:5]'
            // }
        },
        plugins:[new ProgressBarPlugin({
            summary:false,
            format: `${chalk.green.bold('build [:bar]')}`  + chalk.green.bold(':percent') + ' (:elapsed seconds)',
            summaryContent:''})]
        //commonsChunkPlugin:['react']
    },
    babel: {
        query: {
            presets: [
                "es2015",
                "stage-2",
                "react"
            ],
            cacheDirectory: true,
            plugins: [
                "add-module-exports",
                "transform-runtime",
                "transform-decorators-legacy",
                // [
                //     "import",
                //     [
                //         {libraryName: "@kad/e-antd"},
                //         {libraryName: "antd", style: true}
                //     ]
                // ]
            ]
        }
    },
    htmlWebpackPlugin: {
        title: "webApp"/**/,
    },
    apps: ['app2','app1']
};