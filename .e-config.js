const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const chalk = require('chalk');
module.exports = {
  name: 'test',
  open: true,
  defaultPort: 8001,
  projectType: 'ts',
  server: '0.0.0.0',
  imageInLineSize: 8192,
  isTslint: true,
  publicPath: '/public/',
  devServer: {
    noInfo: true,
    proxy: {
      // '/cia-j': {
      //     target: 'http://192.168.1.181:8081',
      //         onProxyReq: (proxyReq, req, res) => {
      //         }
      // },
      // '/main': {
      //     target: 'https://uat-scm.hoolinks.com/',
      //     //changeOrigin: true,
      //     secure: false,
      //         onProxyReq: (proxyReq, req, res) => {
      //             proxyReq.setHeader('host', 'uat-scm.hoolinks.com')
      //             proxyReq.setHeader('cookie', ' Hm_lvt_c255ba4153ae8ae8b787c209cc7518a8=1553052488,1553052893,1553053026,1553053105; SYSSOURCE=SCM; JSESSIONID=F46353CD405C32BF40B7CC6CC0B4C44D; SCP_JSESSIONID=8221664EFABD7C98FFB74DDC8CC12C85; Hm_lpvt_c255ba4153ae8ae8b787c209cc7518a8=1554866067; SESSION=d2104255-eee1-4299-9d8d-9369d83f0977')
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
        'last 2 versions',
        // "Firefox ESR",
        'Firefox >= 15',
        '> 1%',
        'ie >= 8',
        'not ie<=8'
      ]
    }
  },
  webpack: {
    dllConfig: {
      vendors: ['react', 'react-dom', 'invariant']
    },
    disableReactHotLoader: false,
    commonsChunkPlugin: ['react', 'react-dom', 'invariant'],
    disableHappyPack: false,
    cssModules: {
      enable: false // 默认为 false，如需使用 css modules 功能，则设为 true
      // config: {
      //   namingPattern: 'module', // 转换模式，取值为 global/module，下文详细说明
      //   generateScopedName: '[name]__[local]___[hash:base64:5]'
      // }
    },
    plugins: [
      new ProgressBarPlugin({
        summary: false,
        format:
          `${chalk.green.bold('build [:bar]')}` +
          chalk.green.bold(':percent') +
          ' (:elapsed seconds)',
        summaryContent: ''
      })
    ]
    //commonsChunkPlugin:['react']
  },
  babel: {
    query: {
      presets: ['es2015', 'stage-2', 'react'],
      cacheDirectory: true,
      plugins: [
        'add-module-exports',
        'transform-runtime',
        'transform-decorators-legacy'
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
    title: 'webApp' /**/
  },
  apps: ['app1', 'app2', 'app3']
};
