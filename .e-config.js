module.exports = {
    name: "test",
    open: true,
    defaultPort: 8000,
    server: "0.0.0.0",
    imageInLineSize: 8192,
    publicPath: "/public/",
    devServer: {
        noInfo: true,
        proxy: []
        /*proxy: [{
         context: ['/**', '!/static/**', '!/webpack/**', '!/webpack-dev-server/**', '!/sockjs-node/**', '!/index.html'],
         target: 'http://tstmanage.360kad.com
         ',
         changeOrigin: true
         }]*/
    },
    postcss: {
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
            vendors: [`babel-polyfill`,'react']
        },
        disableReactHotLoader: false,
        commonsChunkPlugin:['react']
    },
    babel: {
        query: {
            presets: [
                "es2015",
                "stage-0",
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
        title: ""/*O2O订单管理系统*/,
    },
    apps: ['app2','app1']
};