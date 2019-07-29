# brain-cli

## 介绍(Introduction)
在日常开发中，我们经常需要用到webpack作为打包工具，但每次新建一个项目，都需要去配置一次，虽然配置一次之后，后面都可以进行复制，
但这样还是很繁琐，首先每个人水平不一样，不可能要求所有人都非常熟悉webpack,然后在团队开发中，我们需要对配置统一。基于这些原因，
我们对webpack配置进行二次封装(js文件打包拆分，css单独打包，打包时间优化，反向代理，多入口处理等)，对外部暴露少量配置，用于满足一些特殊的要求。

## 使用
 npm install brain-cli -D 或者 yarn add brain-cli

## barin-cli 优势
- 基于最新的webpack2、react15.x.x、react-router4
- 支持多入口
- 不同入口页面css/js单独合并压缩
- 支持生成ejs,jsp模板页面
- 支持webpack dll
- 支持增量构建
- 静态文件加戳
- 支持反向代理
- 支持对指定入口文件进行编译，打包
- 支持多套环境配置文件切换
- 支持typescript
![alt tag](/gif/WX20170607-095219@2x.png)

## 常用命令介绍

##### 编译举例
- brain-cli build dev 运行开发模式
- brain-cli build prod 生产环境
- brain-cli build test 测试环境
- brain-cli build dist 预发布环境(一般很少用到,特殊情况可以使用)
- brain-cli build -s 构建大小分析
- brain-cli build dev --apps=app1,app2 (编译指定入口文件)
- brain-cli build prod --apps=app1,app2 (编译指定入口文件)
- brain-cli build test --apps=app1,app2 (编译指定入口文件)

## .e-config
```js
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
      //     target: 'https://xxx.com/',
      //     //changeOrigin: true,
      //     secure: false,
      //         onProxyReq: (proxyReq, req, res) => {
      //             proxyReq.setHeader('host', 'xxx.com')
      //             proxyReq.setHeader('cookie', ' a=1111')
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
       vendors: ['react','react-dom','invariant'],
       /* vendors: {cdn:'https://hoolinks.com',FrameList:['react','react-dom','invariant']}, */
    /* framework:['react','react-dom'] */ // 支持自定义dll 包
      /* framework:{cdn:'https://hoolinks1.com',FrameList:['react','react-dom']} */
    },
    disableReactHotLoader: false,
    commonsChunkPlugin: ['react', 'react-dom', 'invariant'],
    disableHappyPack: false,
    cssModules: {
      enable: true // 默认为 false，如需使用 css modules 功能，则设为 true
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
```
#### webpack dll build
- brain-cli dll

## changeLog
- v0.3.21 新增dll 文件支持指定资源发布路径，默认没有指定情况下，去相对或者模块cdn参数值
- v0.3.20 修复开启多线程，在linux系统环境loader名称大小写问题
- v0.3.15 增加资源可指定cdn及css modules 启用，可以指定文件类型进行css modules
- v0.3.13 调整按需加载文件路径，增加本地静态资源读取能力，可读取static文件
- v0.3.12 添加tslint,及可以自定义环境变量
## License
[MIT](LICENSE)





