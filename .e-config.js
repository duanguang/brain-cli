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
                "Firefox ESR",
                "> 1%",
                "ie >= 8"
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
        title: "webApp"/*O2O订单管理系统*/,
    },
    apps: ['app2','app1']
};