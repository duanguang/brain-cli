# brain-cli

## 介绍(Introduction)
在日常开发中，我们经常需要用到webpack作为打包工具，但每次新建一个项目，都需要去配置一次，虽然配置一次之后，后面都可以进行复制，但这样还是很繁琐。而且每个人水平不一样，不可能要求所有人都非常熟悉webpack,然后在团队开发中，我们需要对配置统一。基于这些原因，
我们对webpack配置进行二次封装(js文件打包拆分，css单独打包，打包时间优化，反向代理，多入口处理等)，对外部暴露少量配置，用于满足一些特殊的要求。

## 使用
 npm install brain-cli -D 或者 yarn add brain-cli

## barin-cli 优势
- 基于webpack4.x、继承react16.x开发环境
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

## 常用命令介绍

##### 编译命令
- brain-cli dev 运行开发模式
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
    },
    disableReactHotLoader: false,
    disableHappyPack: false,
    commonsChunkPlugin: ['common', 'vendor'],
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
      presets: [
          [
            '@babel/preset-env',
            {
              useBuiltIns: 'usage', // entry usage  entry模式兼容IE11
              corejs: '3',
              targets: {
                browsers: [
                  // 浏览器
                  'last 2 versions',
                  'ie >= 10',
                ],
              },
            },
          ],
          /*  "@babel/preset-env", */
          '@babel/preset-react',
      ],
      cacheDirectory: true,
      plugins: [
          'add-module-exports',
          '@babel/plugin-transform-runtime',
          [
            '@babel/plugin-proposal-decorators',
            {
              legacy: true,
            },
          ],
          [
            'import',
            {
              libraryName: 'antd',
              style: true,
            },
          ],
      ],
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

### 配置参数

#### config.webpack.dllConfig
支持默认配置及自定义文件

1. vendors
  ```md
  默认值 ['react'],如果需要配置复杂信息，则可以由数组变成对象
  {
    externalUrl: ''; //可选参数 当设置了此值，则index.html dll 文件url变成外部链接
    value:[],// 需要打包到dll 文件的库
    options: {
      libraryTarget: 'umd' | 'var' | 'commonjs2' | 'commonjs' | 'amd' | 'window' | 'global' | 'this', // dll文件模块输出模式
      //当使用了 libraryTarget: "umd"，设置：true 会对 UMD 的构建过程中的 AMD 模块进行命名。否则就使用匿名的 define。
      umdNamedDefine?: boolean;

      // globalObject为改变全局指向
        globalObject?:'this'
    }, // 可选参数
  }
  ```
2. customDll(自定义dll文件)
   ```md
   [
     {
       key: '' // dll 文件名称
       externalUrl?: '' // 当设置了此值，则index.html dll 文件url变成外部链接
       value: [],// 需要打包到dll 文件的库
       options?:{
          libraryTarget: 'umd' | 'var' | 'commonjs2' | 'commonjs' | 'amd' | 'window' | 'global' | 'this', // dll文件模块输出模式
          //当使用了 libraryTarget: "umd"，设置：true 会对 UMD 的构建过程中的 AMD 模块进行命名。否则就使用匿名的 define。
          umdNamedDefine?: boolean;

          // globalObject为改变全局指向
          globalObject?:'this'
       }
     }
   ]
   ```
3. compileOptions(全局生效配置)
   ```md
   当在dllConfig,配置了该参数，即可生效到所有dll 文件，等同于配置了options参数，当dll 文件指定了自身局部配置数据，则生效局部数据
   {
          libraryTarget: 'umd' | 'var' | 'commonjs2' | 'commonjs' | 'amd' | 'window' | 'global' | 'this', // dll文件模块输出模式
          //当使用了 libraryTarget: "umd"，设置：true 会对 UMD 的构建过程中的 AMD 模块进行命名。否则就使用匿名的 define。
          umdNamedDefine?: boolean;

          // globalObject为改变全局指向
          globalObject?:'this'
       }
   ```


#### config.webpack.extend
首先它是一个函数，执行会抛出底层loaders等数据，当默认loaders不满足使用时，可以传入此配置用于扩展增强 

```ts
function (loaders:[], { isDev, /*
'HotLoader' | 'JsLoader' | 'TsLoader' | 'StyleLoader'
*/loaderType,/*'ts' | 'js'*/ projectType, 
/* 
{
  readonly cssModule: {
    modules: boolean;
    importLoaders: number;
    localIdentName: string;
  },
  readonly LoaderOptions: postcss_loader,
  execution:(cssModule,loader,currLoader)=>loader.use
}
*/
transform })

// 例如
function (loaders,{ isDev, loaderType, projectType, transform }){
  const nodeModulesPath=path.resolve('../../', 'node_modules')
   if (loaderType === 'JsLoader') {
      loaders.push({
        test: /\.(jsx|js)?$/,
        include: [
          path.resolve(nodeModulesPath, 'legions-pro-design'),
        ],
        loader: 'happypack/loader?id=js',
      });
    }
    if (loaderType === 'TsLoader' && projectType === 'ts') {
      loaders.push({
        test: /\.(ts|tsx)$/,
        include: [
          path.resolve(nodeModulesPath, 'legions-pro-design'),
        ],
        loader: 'happypack/loader?id=ts',
      });
    }
    if (loaderType === 'StyleLoader' && transform) {
      const newLoaders = [
          {
            test: /\.css$/,
            use: transform.execution(null, null, null),
            exclude: [
              path.resolve(nodeModulesPath, 'legions-pro-design'),
            ],
            include: [path.resolve(nodeModulesPath)],
          },
          {
            test: new RegExp(`^(?!.*\\.modules).*\\.css`),
            use: transform.execution(null, null, transform.LoaderOptions),
            include: [
              path.resolve(nodeModulesPath, 'legions-pro-design'),
            ],
          },
          {
            test: new RegExp(`^(.*\\.modules).*\\.css`),
            use: transform.execution(
              transform.cssModule,
              null,
              transform.LoaderOptions
            ),

            include: [
              path.resolve(nodeModulesPath, 'legions-pro-design'),
            ],
          },
          {
            test:  /\.less/,
            use: transform.execution(null, transform.LoaderOptions,{
              loader: 'less-loader',
              options: { javascriptEnabled: true },
            }),
            include: [
              path.resolve(nodeModulesPath, 'legions-pro-design'),
            ],
          },
          {
            /* test: /\.less/, */
            test: new RegExp(`^(.*\\.modules).*\\.less`),
            use: transform.execution(transform.cssModule,transform.LoaderOptions, {
              loader: 'less-loader',
              options: { javascriptEnabled: true },
            }),
            include: [
              path.resolve(nodeModulesPath, 'legions-pro-design'),
              path.resolve(process.cwd(), './src'),
            ],
          },
          {
            test: /\.less/,
            use: transform.execution(null, {
                loader: 'less-loader',
                options: { javascriptEnabled: true },
            }),
            include: [
              path.resolve(nodeModulesPath, 'antd'),
              path.resolve(process.cwd(), 'src')
            ],
        },
      ];
      loaders.splice(0,loaders.length); // 清空css loaders,重新定义
      loaders.push({oneOf: newLoaders});
    }
}
```
#### config.webpack.[tsCompilePlugin](https://github.com/TypeStrong/ts-loader#loader-options)
```ts
option: {
  getCustomTransformers: () => ({ // 示例， 可根据ts-loader options 文档去进行自由配置
    before: [
      createTransformer(),
      createTransformerReactJsxProps({
        components: [
          { name: 'LegionsProTable', props: 'uniqueUid', value: '' },
          { name: 'LegionsProForm', props: 'uniqueUid' },
          { name: 'LegionsProTabsForm', props: 'uniqueUid' },
          { name: 'LegionsProDataImport', props: 'uniqueUid' },
          { name: 'LegionsProConditions', props: 'uniqueUid' },
        ],
      }),
    ],
  }),
},
```

## changeLog webpack4.x
## v1.0.8-alpha.6(2020-12-01)
- feat: 新增webpack 配置文件输出属性output支持自定义library及libraryTarget
- feat: 新增webpack dll 配置文件输出属性output支持自定义libraryTarget及其他属性 
- feat: 新增webpack dll  插件支持自定义
## v1.0.8-alpha.4(2020-11-10)
- fix: 修复file-loader 插件通过require 引入文件及样式引入文件,404问题
- 升级webpack 版本4.x

## changeLog
##  v0.3.28-beta.3 (2020-12-01)
- feat: 新增webpack dll 配置文件输出属性output支持自定义libraryTarget及其他属性 
- feat: 新增webpack dll  插件支持自定义

##  v0.3.28-beta.1 （2020-11-13）
- feat: 新增webpack 配置文件输出属性output支持自定义library及libraryTarget

## v0.3.27
- feat: 新增dll 文件支持指定资源发布路径，默认没有指定情况下，去相对或者模块cdn参数值
## v0.3.20
- fix: 修复开启多线程，在linux系统环境loader名称大小写问题
## v0.3.15
- feat: 增加资源可指定cdn及css modules 启用，可以指定文件类型进行css modules
## v0.3.13
- chore: 调整按需加载文件路径，增加本地静态资源读取能力，可读取static文件
- chore: 添加tslint,及可以自定义环境变量


## License
[MIT](LICENSE)





