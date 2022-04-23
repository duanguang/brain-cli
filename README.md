# brain-cli

## 介绍(Introduction)

在日常开发中，我们经常需要用到 webpack 作为打包工具，但每次新建一个项目，都需要去配置一次，虽然配置一次之后，后面都可以进行复制，但这样还是很繁琐。而且每个人水平不一样，不可能要求所有人都非常熟悉 webpack,然后在团队开发中，我们需要对配置统一。基于这些原因，
我们对 webpack 配置进行二次封装(js 文件打包拆分，css 单独打包，打包时间优化，反向代理，多入口处理等)，对外部暴露少量配置，用于满足一些特殊的要求。

## 使用

npm install brain-cli -D 或者 yarn add brain-cli

## barin-cli 优势

- 基于 webpack4.x、继承 react16.x 开发环境
- 支持多入口
- 不同入口页面 css/js 单独合并压缩
- 支持生成 ejs,jsp 模板页面
- 支持 webpack dll
- 支持增量构建
- 静态文件加戳
- 支持反向代理
- 支持对指定入口文件进行编译，打包
- 支持多套环境配置文件切换
- 支持 typescript

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
const ProgressBarPlugin = require("progress-bar-webpack-plugin");
const chalk = require("chalk");
module.exports = {
  name: "test",
  open: true,
  defaultPort: 8001,
  server: "0.0.0.0",
  imageInLineSize: 8192,
  isTslint: true,
  publicPath: "/public/",
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
    },
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
        "not ie<=8",
      ],
    },
  },
  webpack: {
    dllConfig: {
      vendors: ["react", "react-dom", "invariant"],
    },
    disableReactHotLoader: false,
    happyPack: {
      open: false,
    },
    commonsChunkPlugin: ["common", "vendor"],
    plugins: [
      new ProgressBarPlugin({
        summary: false,
        format:
          `${chalk.green.bold("build [:bar]")}` +
          chalk.green.bold(":percent") +
          " (:elapsed seconds)",
        summaryContent: "",
      }),
    ],
  },
  babel: {
    query: {
      presets: [
        [
          "@babel/preset-env",
          {
            useBuiltIns: "usage", // entry usage  entry模式兼容IE11
            corejs: "3",
            targets: {
              browsers: [
                // 浏览器
                "last 2 versions",
                "ie >= 10",
              ],
            },
          },
        ],
        /*  "@babel/preset-env", */
        "@babel/preset-react",
      ],
      cacheDirectory: true,
      plugins: [
        "add-module-exports",
        "@babel/plugin-transform-runtime",
        [
          "@babel/plugin-proposal-decorators",
          {
            legacy: true,
          },
        ],
        [
          "import",
          {
            libraryName: "antd",
            style: true,
          },
        ],
      ],
    },
  },
  htmlWebpackPlugin: {
    title: "webApp" /**/,
  },
  apps: ["app1", "app2", "app3"],
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
externalUrl: ''; //可选参数 当设置了此值，则 index.html dll 文件 url 变成外部链接
value:[],// 需要打包到 dll 文件的库
options: {
libraryTarget: 'umd' | 'var' | 'commonjs2' | 'commonjs' | 'amd' | 'window' | 'global' | 'this', // dll 文件模块输出模式
//当使用了 libraryTarget: "umd"，设置：true 会对 UMD 的构建过程中的 AMD 模块进行命名。否则就使用匿名的 define。
umdNamedDefine?: boolean;

    // globalObject为改变全局指向
      globalObject?:'this'

}, // 可选参数
}
```

2. customDll(自定义 dll 文件)

   ```md
   [
   {
   key: '' // dll 文件名称
   externalUrl?: '' // 当设置了此值，则 index.html dll 文件 url 变成外部链接
   value: [],// 需要打包到 dll 文件的库
   options?:{
   libraryTarget: 'umd' | 'var' | 'commonjs2' | 'commonjs' | 'amd' | 'window' | 'global' | 'this', // dll 文件模块输出模式
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
   当在 dllConfig,配置了该参数，即可生效到所有 dll 文件，等同于配置了 options 参数，当 dll 文件指定了自身局部配置数据，则生效局部数据
   {
   libraryTarget: 'umd' | 'var' | 'commonjs2' | 'commonjs' | 'amd' | 'window' | 'global' | 'this', // dll 文件模块输出模式
   //当使用了 libraryTarget: "umd"，设置：true 会对 UMD 的构建过程中的 AMD 模块进行命名。否则就使用匿名的 define。
   umdNamedDefine?: boolean;

          // globalObject为改变全局指向
          globalObject?:'this'
       }
   ```

#### config.webpack.extend

首先它是一个函数，执行会抛出底层 loaders 等数据，当默认 loaders 不满足使用时，可以传入此配置用于扩展增强

```ts
interface ITransform{
  readonly cssModule: {
    modules: boolean;
    importLoaders: number;
    localIdentName: string;
  },
  readonly LoaderOptions: postcss_loader,
  execution:(cssModule,loader,currLoader)=>loader.use
}
interface IOptions{
  isDev:boolean;
  type:'hotLoader' | 'jsLoader' | 'tsLoader' | 'styleLoader';
  transform:ITransform
}
function (loaders:[], options:IOptions={
  isDev,loaderType,transform
})

// 例如
function (loaders,{ isDev, loaderType, transform }){
  const nodeModulesPath=path.resolve('../../', 'node_modules')
   if (type === 'js_loader') {
     if (loaders.length) {
            
      }
    }
    if (type === 'ts_loader' ) {
    }
    if (type === 'style_loader' && transform) {
      loaders.push({
            test: /\.css$/,
            use: transform.execution(null, null, null),
            include: [path.resolve(nodeModulesPath)],
          },)
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

#### config.webpack.[happyPack](https://github.com/amireh/happypack)

> 1.配置信息

```ts
interface IHappyPack{
    /** 代表开启几个子进程去处理这一类型的文件，默认是3个，类型必须是整数。 */
    threads?: Number;
    /** 是否允许 HappyPack 输出日志，默认是 true。 */
    verbose?: Boolean;
    /** 代表共享进程池，即多个 HappyPack 实例都使用同一个共享进程池中的子进程去处理任务，以防止资源占用过多。 */
    threadPool?: any;
    /** 开启webpack --profile ,仍然希望HappyPack产生输出。 */
    verboseWhenProfiling?: boolean;
    /** 启用debug 用于故障排查。默认 false。 */
    debug?: boolean;
}
{
  open:false // 是否开启多线程
  /** js 线程配置 */
  procJs?: IHappyPack;
  /** ts 线程配置 */
  procTs?: IHappyPack;
}
```

> 2.开启多线程时，如果是编译 ts,tsx 文件，默认使用 ts-loader, 这时多进程下存在使用插件无法生效[问题](https://github.com/Igorbek/typescript-plugin-styled-components#forked-process-configuration)

```ts
const {
    createTransformer,
    createTransformerReactJsxProps,
  } = require('ts-plugin-legions');
// 2. create a transformer;
// the factory additionally accepts an options object which described below

// 3. create getCustomTransformer function
const getCustomTransformers = () => ({ before: [createTransformer([
    {
      libraryName: 'legions/store',
      bindings: ['StoreModules'],
    },
  ]),
  createTransformerReactJsxProps({
    components: [
      { name: 'LegionsProTable', props: 'uniqueUid', value: '' },
      { name: 'LegionsProForm', props: 'uniqueUid' },
      { name: 'LegionsProTabsForm', props: 'uniqueUid' },
      { name: 'LegionsProTabsForm', props: 'uniqueUid' },
      { name: 'LegionsProConditions', props: 'uniqueUid' },
      { name: 'HLDataImport', props: 'uniqueUid' },
    ],
  }),] });

// 4. export getCustomTransformers
module.exports = getCustomTransformers;
// webpack.ts-transformers.js


tsCompilePlugin: {
  option: {
    getCustomTransformers:path.join(__dirname, './webpack.ts-transformers.js'),
  },
},
```

## changeLog webpack4.x

## v1.1.3

- 【chore】优化loader加载器配置结构

## v1.1.1

- deprecate: 废弃部分不合适的参数配置 **disableHappyPack** , **cssModules**
- chore: 优化多进程由强制开启变成可以自由控制
- fix: 修复版本更新探测代码无法生效
- chore: 优化控制台输出信息
- chore: 升级 typescript 版本至 4.x

## v1.0.8-alpha.6(2020-12-01)

- feat: 新增 webpack 配置文件输出属性 output 支持自定义 library 及 libraryTarget
- feat: 新增 webpack dll 配置文件输出属性 output 支持自定义 libraryTarget 及其他属性
- feat: 新增 webpack dll 插件支持自定义
- fix: 修复 file-loader 插件通过 require 引入文件及样式引入文件,404 问题
- 升级 webpack 版本 4.x

## changeLog

## v0.3.28-beta.3 (2020-12-01)

- feat: 新增 webpack dll 配置文件输出属性 output 支持自定义 libraryTarget 及其他属性
- feat: 新增 webpack dll 插件支持自定义

## v0.3.28-beta.1 （2020-11-13）

- feat: 新增 webpack 配置文件输出属性 output 支持自定义 library 及 libraryTarget

## License

[MIT](LICENSE)
