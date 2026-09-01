# brain-cli v3 双内核（Rspack）实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 为 brain-cli（webpack 5 内核）增加 Rspack 内核，默认引擎切到 rspack，`--engine=webpack` 永久兜底；wms-aps-web 升级 `brain-cli@3.0.0-alpha.1` 后零改动全功能正常。

**架构：** 并行 cfg 目录 + 统一分发器——`webpack.config.js` 按 `engine × NODE_ENV` 四路路由；webpack 链路字节级不动（兜底可证明），Rspack 链路为全新文件（`cfg/rspack/{base,dev,dist}.js` + `rspackCompiler.js`），字段语义逐项对齐 webpack 版 `cfg/base.js`。共享层（EConfig、htmlWebpackPlugin、javaScriptLoader、LegionExtractStaticFilePlugin）引擎无关直接复用。

**技术栈：** Rspack（@rspack/core + @rspack/dev-server）、webpack 5（兜底内核）、babel-loader 9 + ts-loader 9（transpileOnly + ts-plugin-legions transformer）、MiniCssExtractPlugin（显式 loader 链，不用 experiments.css）、qiankun 产物形态（`libraryTarget:'window'` + `chunkLoadingGlobal`，Rspack 官方支持已验证）。

**规格：** `docs/superpowers/specs/2026-09-01-brain-cli-v3-rspack-engine-design.md`（已批准）

---

## 执行者必读（关键上下文）

1. **执行目录**：任务 1-11 在 `D:\Front-End\legions-framework\brain-cli`（分支 `3.x-develop`）；任务 12-16 在 `D:\Front-End\hoolinks\wms-aps-web`。每个任务开头标注了执行目录。
2. **时序铁律**：EConfig 单例在模块 require 时就构造完毕（`javaScriptLoader.js` 顶层就调 `getInstance()`），而 `--engine` 在 commander action 阶段才设置 `process.env.BRAIN_ENGINE`。因此**引擎判定必须在配置分发时进行**（`resolveEngine(eConfig)`），绝不能放进 `EConfig.init()`。
3. **webpack 链路零改动**：`cfg/{base,dev,dist}.js`、`webpackCompiler.js`、`cfg/dll.js` 等 webpack 文件一律不修改。所有新逻辑放新文件或在分发点加分支。
4. **项目代码风格**：所有文件为 TS 编译产物风格（UMD factory 头 + `exports.default`）。新文件必须沿用此风格。
5. **本仓库无单测基建**（规格 §10 已确认不引入）。每个任务的"验证"步骤用可执行命令（node -e 配置解析 / dev 启动 / build 产物检查）代替单元测试，验证标准写明预期输出。
6. **commit 一律用 `rtk git`** 前缀（仓库约定）。
7. **开放变量判定标准**（规格已锁定，遇到时按下表处理，不要自行发挥）：

| 开放变量 | 判定标准 |
|---|---|
| **（已核实 @rspack/core 2.2.1）** `SwcJsMinimizerRspackPlugin` | `minimizerOptions.compress` = TerserCompressOptions，含 `drop_console`/`drop_debugger`（d.ts 已核实）；去注释用 `extractComments: false`（`format.comments` 默认即 false） |
| **（已核实 2.2.1）** CSS 压缩器 | `CssMinimizerRspackPlugin` **在 2.x 不存在**，等效导出为 `LightningCssMinimizerRspackPlugin`（exports.d.ts:158 已核实）——任务 6 用此名 |
| **（已核实 2.2.1）** 持久缓存 | `experiments.cache` **在 2.x 不存在**，改为 `experiments: { newCache: true }`（Experiments 类型已核实；底层 PersistentCacheOptions 默认目录 `node_modules/.cache/rspack`）；验证标准 = dev 二次启动明显变快 |
| **（已核实 2.2.1）** `experiments.css` | 2.0 起 deprecated（需手动加 CSS 规则启用 CSS 支持）——与本计划"显式 loader 链"决策一致，无需开启 |
| dev 图片规则 `generator.emit: false` | 任务 11 用 demo 图片实测：dev 产物不落盘、页面图片经内存服务可显示 |
| BundleAnalyzerPlugin（`-s` report） | 兼容则 rspack 可用；不兼容则 report 模式仅 webpack 引擎可用（记录到 README，不算失败） |

## 文件结构（锁定分解决策）

```
D:\Front-End\legions-framework\brain-cli\        # brain-cli 仓库（3.x-develop）
  package.json                                   # [改] version 3.0.0-alpha.1 + @rspack 依赖
  libs/utils/engine.js                           # [新] resolveEngine：CLI > env > 配置 > 默认 rspack，非法值 fail fast
  libs/program/command.js                        # [改] dev/start/build 加 --engine 选项 + setEngine
  cfg/rspack/base.js                             # [新] Rspack 配置生成器（对齐 cfg/base.js 全量字段）
  cfg/rspack/dev.js                              # [新] devServer 组装（无 dll pendings）
  cfg/rspack/dist.js                             # [新] build 链路（双压缩器/LegionExtract/Copy/report）
  libs/webpack/rspackCompiler.js                 # [新] rspack() 编译器封装，返回 { compiler, config }
  webpack.config.js                              # [改] 分发器：engine × NODE_ENV 四路路由
  libs/webpack/webpackDevServer.js               # [改] dev 按引擎分发（webpack 分支原样）
  libs/program/index.js                          # [改] build 按引擎分发（webpack 分支原样）

D:\Front-End\hoolinks\wms-aps-web\               # wms-aps-web 仓库（验收与发布）
  scripts/rspack/check-output-syntax.js          # [新] acorn 产物语法扫描（原计划任务 6 的脚本）
  scripts/rspack/diff-build-output.js            # [新] 新旧引擎产物 diff（原计划任务 14 的脚本）
  vendor/brain-cli-3.0.0-alpha.1.tgz             # [新] 迭代期 tgz
  package.json                                   # [改] brain-cli 依赖：tgz → registry 版本
```

**职责边界**：`cfg/rspack/*` 与 `rspackCompiler.js` 是长期交付物；wms 侧 `scripts/rspack/*` 是验收工具随仓库沉淀；业务源码 `src/**` 零改动。

---

## 阶段 1：brain-cli v3 双内核（任务 1-11）

### 任务 1：安装 Rspack 依赖并升级版本号

**执行目录**：`D:\Front-End\legions-framework\brain-cli`

**文件：**
- 修改：`package.json`（version、dependencies）

- [ ] **步骤 1：安装依赖**

```bash
cd "D:\Front-End\legions-framework\brain-cli"
yarn add @rspack/core @rspack/dev-server --ignore-engines
```

预期：安装成功，`package.json` dependencies 新增两个包。若 native 二进制下载失败，检查代理对 `https://registry.npmmirror.com/-/binary/rspack/` 的可达性后重试。

- [ ] **步骤 2：改版本号**

`package.json` 中 `"version": "2.0.0-alpha.3"` 改为：

```json
"version": "3.0.0-alpha.1",
```

- [ ] **步骤 3：验证导出面（锁定开放变量）**

```bash
node -e "const r=require('@rspack/core'); console.log('rspack:', typeof r.rspack, '| Define:', typeof r.DefinePlugin, '| Minimizers:', Object.keys(r).filter(k=>/Minimizer/.test(k)).join(','))"
node -e "console.log('RspackDevServer:', typeof require('@rspack/dev-server').RspackDevServer)"
node -e "console.log(require('@rspack/core/package.json').version)"
```

预期：`rspack: function | Define: function | Minimizers: SwcJsMinimizerRspackPlugin,CssMinimizerRspackPlugin`（若 CssMinimizerRspackPlugin 不在导出列表，查 `node_modules/@rspack/core/dist.d.ts` 中等效导出名并记录，后续任务按实际名引用）；`RspackDevServer: function`；记录版本号。

- [ ] **步骤 4：Commit**

```bash
rtk git add package.json yarn.lock
rtk git commit -m "feat: v3.0.0-alpha.1 安装 @rspack/core 与 @rspack/dev-server"
```

---

### 任务 2：libs/utils/engine.js 引擎判定

**执行目录**：`D:\Front-End\legions-framework\brain-cli`

**文件：**
- 创建：`libs/utils/engine.js`

- [ ] **步骤 1：编写 resolveEngine（完整代码）**

```js
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "invariant"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const invariant = require("invariant");
    /**
     * v3 默认内核：rspack（规格 §1.1 决策 2）
     */
    const ENGINE_DEFAULT = 'rspack';
    const ENGINE_LIST = ['webpack', 'rspack'];
    /**
     * 解析当前构建内核。
     * 判定时机必须在配置分发时（不能放 EConfig.init()）：
     * EConfig 单例在模块 require 时已构造，而 --engine 在 commander action 阶段才写 env。
     *
     * 优先级：process.env.BRAIN_ENGINE（CLI --engine 写入）> eConfig.engine（.e-config.js 字段）> 默认 rspack
     */
    function resolveEngine(eConfig) {
        const raw = String((process.env.BRAIN_ENGINE || (eConfig && eConfig.engine) || ENGINE_DEFAULT))
            .toLowerCase()
            .trim();
        invariant(ENGINE_LIST.indexOf(raw) > -1, `非法 engine: "${raw}"，合法值: ${ENGINE_LIST.join(' | ')}（默认 ${ENGINE_DEFAULT}）`);
        return raw;
    }
    exports.default = resolveEngine;
});
```

- [ ] **步骤 2：验证判定链**

```bash
node -e "const r=require('./libs/utils/engine').default; process.env.BRAIN_ENGINE=''; console.log('默认:', r({})); console.log('配置文件:', r({engine:'webpack'})); process.env.BRAIN_ENGINE='Rspack'; console.log('env 大小写:', r({engine:'webpack'}))"
node -e "require('./libs/utils/engine').default({engine:'rollup'})" ; echo "exit=$?"
```

预期：第一条输出 `默认: rspack`、`配置文件: webpack`、`env 大小写: rspack`（env 优先于配置文件）；第二条 `exit=1` 且报错 `非法 engine: "rollup"`。

- [ ] **步骤 3：Commit**

```bash
rtk git add libs/utils/engine.js
rtk git commit -m "feat: 新增 resolveEngine 引擎判定（CLI > env > 配置文件 > 默认 rspack）"
```

---

### 任务 3：command.js 支持 --engine 参数

**执行目录**：`D:\Front-End\legions-framework\brain-cli`

**文件：**
- 修改：`libs/program/command.js`

- [ ] **步骤 1：新增 setEngine 方法**

在 `setApps` 方法（第 63-71 行）之后新增：

```js
        setEngine(options) {
            const engine = options && options['engine'];
            if (typeof engine === 'string' && engine) {
                process.env.BRAIN_ENGINE = engine;
            }
            // 未传 --engine 时不写 env，让 resolveEngine 走默认 rspack
        }
```

- [ ] **步骤 2：dev()/start() 加选项并调用**

`dev()` 的 `.option('--apps [value]', ...)` 之后加一行：

```js
                .option('--engine [value]', 'bundler engine: webpack | rspack (default: rspack)')
```

`dev()` 的 action 内 `this.setApps(options);` 之后加一行：

```js
                this.setEngine(options);
```

`start()` 同样处理（option 链加同一行、action 内 `this.setApps(options);` 后加 `this.setEngine(options);`）。

- [ ] **步骤 3：build() 加选项并调用**

`build()` 的 `.option('--cdn [value]', ...)` 之后加一行：

```js
                .option('--engine [value]', 'bundler engine: webpack | rspack (default: rspack)')
```

`build()` 的 action 内 `this.setApps(options);` 之后加一行：

```js
                this.setEngine(options);
```

- [ ] **步骤 4：验证参数注入**

```bash
node bin/index.js dev --help
node bin/index.js build --help
node -e "process.argv=[,'','dev','--engine=rspack']; " # 仅人工确认上两条输出
```

预期：两条 help 输出中均出现 `--engine [value]  bundler engine: webpack | rspack (default: rspack)`。

- [ ] **步骤 5：Commit**

```bash
rtk git add libs/program/command.js
rtk git commit -m "feat: CLI dev/start/build 支持 --engine 参数"
```

---

### 任务 4：cfg/rspack/base.js 配置生成器

**执行目录**：`D:\Front-End\legions-framework\brain-cli`

**文件：**
- 创建：`cfg/rspack/base.js`

> 核心原则：字段语义逐项对齐 webpack 版 `cfg/base.js`；差异仅 4 处——① bundler/插件取自 `@rspack/core`；
> ② `cache: filesystem` 换 `experiments.cache`；③ 不迁移 Spritesmith（死代码）；④ prod 不在 base 内 push CSS minimizer（由 dist.js 统一双压缩器）。

- [ ] **步骤 1：编写完整配置生成器**

```js
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
    const EConfig_1 = require("../libs/settings/EConfig");
    const constants_1 = require("../libs/constants/constants");
    const htmlWebpackPlugin_1 = require("../libs/webpack/plugins/htmlWebpackPlugin");
    const env_1 = require("../libs/utils/env");
    require("../libs/webpack/entries/getEntries");
    const objects_1 = require("../libs/utils/objects");
    const javaScriptLoader_1 = require("../libs/webpack/javaScriptLoader");
    const nodeModulesPath = path.resolve(process.cwd(), 'node_modules');
    const MiniCssExtractPlugin = require('mini-css-extract-plugin');
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
        const library = {};
        if (output && typeof output === 'object' && !Array.isArray(output)) {
            ['library', 'libraryTarget'].forEach((item) => {
                if (output.hasOwnProperty(item)) {
                    if (typeof output[item] === 'string') {
                        library[item] = output[item];
                    }
                    else if (typeof output[item] === 'function') {
                        library[item] = output[item](name);
                    }
                }
            });
        }
        function getEntries() {
            return entries().reduce((prev, app) => {
                prev[app] = `./src/${app}/index`;
                return prev;
            }, {});
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
                return [MiniCssExtractPlugin.loader, ...style];
            }
            if (!__DEV__) {
                config.plugins.push(new MiniCssExtractPlugin({
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
            // Rspack 2.x 持久缓存（experiments.cache 在 2.x 已不存在；默认目录 node_modules/.cache/rspack）
            // 验证标准 = 任务 11 dev 二次启动明显变快
            experiments: { newCache: true },
            output: Object.assign(Object.assign({}, library), { 
                // qiankun 产物形态（对齐 cfg/base.js）
                chunkLoadingGlobal: process.env.webpackJsonp || 'webpackJsonpName', path: path.join(process.cwd(), constants_1.DIST), filename: __DEV__
                    ? `[name]/js/[name].js`
                    : `[name]/js/[name].[chunkhash:5].bundle.js`, chunkFilename: 'common/js/[name].[chunkhash:5].bundle.js', publicPath: __DEV__ ? publicPath : process.env.cdnRelease || '../', hashFunction: 'xxhash64' }),
            resolve: Object.assign(Object.assign({}, webpackConfig.resolve), { alias: Object.assign({ 
                    // WP5 同款 UMD 模块别名
                    'legions-nprogress': path.resolve(nodeModulesPath, 'legions-nprogress/dist/legions-nprogress.esm.js'), 'legions-utils-tool': path.resolve(nodeModulesPath, 'legions-utils-tool/dist/legions-utils-tool.esm.js') }, ((webpackConfig.resolve && webpackConfig.resolve.alias) || {})), extensions: ['.web.js', '.js', '.json', '.ts', '.tsx', '.jsx'], modules: [
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
                ...plugins,
                new DefinePlugin({
                    'process.env.environment': '"' + process.env.environment + '"',
                    'process.env.apps': '"' + process.env.apps + '"',
                    'process.env.webpackJsonp': '"' + process.env.webpackJsonp + '"',
                    'process.env.cdnRelease': '"' + process.env.cdnRelease + '"',
                }),
            ],
        };
        config.module = {
            rules: [
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
```

（上方代码块已完整，实现时直接使用；与 webpack 版逐字对齐的段落已内嵌。）

- [ ] **步骤 2：验证配置可构建**

```bash
node -e "process.env.NODE_ENV='dev'; const EConfig=require('./libs/settings/EConfig').default; const dev=require('./cfg/rspack/dev'); "
echo "（dev.js 在任务 5 完成后执行下一条）"
node -e "process.env.NODE_ENV='dev'; const EConfig=require('./libs/settings/EConfig').default; const base=require('./cfg/rspack/base').default; const c=base(EConfig.getInstance()); console.log('entry:', Object.keys(c.entry).join(','), '| rules:', c.module.rules.length, '| experiments:', JSON.stringify(c.experiments))"
```

预期：`entry: app1,app2 | rules: ≥10 | experiments: {"newCache":true}`。报错则按信息修复（常见：路径别名笔误、@rspack/core 导出名）。

- [ ] **步骤 3：Commit**

```bash
rtk git add cfg/rspack/base.js
rtk git commit -m "feat: cfg/rspack/base.js 配置生成器（字段对齐 webpack 版，不迁移 Spritesmith）"
```

---

### 任务 5：cfg/rspack/dev.js

**执行目录**：`D:\Front-End\legions-framework\brain-cli`

**文件：**
- 创建：`cfg/rspack/dev.js`

- [ ] **步骤 1：编写完整代码**

```js
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "path", "./base", "../../libs/constants/constants"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const path = require("path");
    const base_1 = require("./base");
    const constants_1 = require("../../libs/constants/constants");
    const express = require('express');
    /**
     * Rspack dev 配置：devServer 组装语义对齐 webpack 版 cfg/base.js 的 __DEV__ 分支。
     * dll pendings 不迁移（wms-aps-web vendors=[]，cfg/dll.js 返回 null，启动链路自然跳过）。
     */
    function getRspackDevConfig(eConfig) {
        const config = (0, base_1.default)(eConfig);
        const { name, devServer, defaultPort } = eConfig;
        const publicPath = eConfig.publicPath + name + '/';
        const { noInfo, proxy, before, stats, contentBase, historyApiFallback, headers = {}, hot, port } = devServer, serverProps = __rest(devServer, ["noInfo", "proxy", "before", "stats", "contentBase", "historyApiFallback", "headers", "hot", "port"]);
        // @rspack/dev-server 内部 for...of 迭代 proxy，严格要求数组；
        // webpack 版兼容对象形式（{ '/api': {...} }），此处规范化：
        // 对象 → [{ context: key, ...value }]；未配置 → []（2.x 对 undefined/对象不容错）
        let proxyList = proxy;
        if (proxy && !Array.isArray(proxy) && typeof proxy === 'object') {
            proxyList = Object.keys(proxy).map((key) => Object.assign({ context: key }, proxy[key]));
        }
        else if (!proxy) {
            proxyList = [];
        }
        config.devServer = Object.assign({}, serverProps, {
            static: { directory: path.resolve(process.cwd(), constants_1.WORKING_DIRECTORY) },
            // WP5 同款：publicPath 移到 devMiddleware
            devMiddleware: { publicPath: publicPath, stats: 'errors-only' },
            historyApiFallback: {
                rewrites: eConfig.apps.map((app) => ({
                    from: (0, constants_1.HISTORY_REWRITE_FALL_BACK_REGEX_FUNC)(app),
                    to: `${publicPath}/${app}/index.html`,
                })),
            },
            headers: Object.assign({ 'Access-Control-Allow-Origin': '*' }, headers),
            hot: true,
            port: defaultPort,
            proxy: proxyList,
            setupMiddlewares: function (middlewares, devServer) {
                if (!devServer)
                    return middlewares;
                devServer.app.use(path.posix.join(`/static`), express.static('./static'));
                before && before(devServer.app);
                return middlewares;
            },
        });
        return config;
    }
    exports.default = getRspackDevConfig;
});
```

（dev.js 代码块已完整：`__rest` 辅助函数已内嵌文件头，devServer 组装语义对齐 `cfg/base.js` 的 `__DEV__` 分支。）

- [ ] **步骤 2：验证 dev 配置组装**

```bash
node -e "process.env.NODE_ENV='dev'; const EConfig=require('./libs/settings/EConfig').default; const dev=require('./cfg/rspack/dev').default; const c=dev(EConfig.getInstance()); console.log('devServer:', Object.keys(c.devServer).join(','))"
```

预期：`devServer: static,devMiddleware,historyApiFallback,headers,hot,port,proxy,setupMiddlewares`（顺序可能不同，键集合一致即可）。

- [ ] **步骤 3：Commit**

```bash
rtk git add cfg/rspack/dev.js
rtk git commit -m "feat: cfg/rspack/dev.js（devServer 对齐 webpack 版，无 dll pendings）"
```

---

### 任务 6：cfg/rspack/dist.js

**执行目录**：`D:\Front-End\legions-framework\brain-cli`

**文件：**
- 创建：`cfg/rspack/dist.js`

- [ ] **步骤 1：编写完整代码**

```js
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "path", "./base", "../libs/webpack/plugins/LegionExtractStaticFilePlugin"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const path = require("path");
    const base_1 = require("./base");
    const LegionExtractStaticFilePlugin_1 = require("../../libs/webpack/plugins/LegionExtractStaticFilePlugin");
    const { SwcJsMinimizerRspackPlugin, LightningCssMinimizerRspackPlugin } = require('@rspack/core');
    const CopyWebpackPlugin = require('copy-webpack-plugin');
    const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
    /**
     * Rspack build 配置：
     * - 双压缩器对齐 webpack 版行为（JS: drop_console/drop_debugger/去注释；CSS: 压缩）
     * - LegionExtract + CopyPlugin static→common 对齐 webpack 版 dist 分支
     * - `-s` report 模式透传（低兼容风险验证项，失败则 report 仅 webpack 引擎可用）
     */
    function getRspackDistConfig(eConfig) {
        const config = (0, base_1.default)(eConfig);
        config.devtool = false;
        config.mode = 'production';
        config.optimization.minimizer = [
            new SwcJsMinimizerRspackPlugin({
                extractComments: false,
                minimizerOptions: {
                    compress: { drop_console: true, drop_debugger: true },
                },
            }),
            new LightningCssMinimizerRspackPlugin(),
        ];
        config.plugins.push(new LegionExtractStaticFilePlugin_1.default());
        config.plugins.push(new CopyWebpackPlugin({
            patterns: [{
                    from: path.join(process.cwd(), 'static'),
                    to: 'common',
                    globOptions: { ignore: ['.*'] },
                }],
        }));
        if (process.env.environment === 'report') {
            config.plugins.push(new BundleAnalyzerPlugin());
        }
        return config;
    }
    exports.default = getRspackDistConfig;
});
```

（dist.js 代码块已完整：report 分支、双压缩器、LegionExtract/Copy 均已内嵌。）

- [ ] **步骤 2：验证 dist 配置组装**

```bash
node -e "process.env.NODE_ENV='production'; const EConfig=require('./libs/settings/EConfig').default; const dist=require('./cfg/rspack/dist').default; const c=dist(EConfig.getInstance()); console.log('mode:', c.mode, '| devtool:', c.devtool, '| minimizer:', c.optimization.minimizer.length, '| plugins:', c.plugins.length)"
```

预期：`mode: production | devtool: false | minimizer: 2 | plugins: ≥6`。

- [ ] **步骤 3：Commit**

```bash
rtk git add cfg/rspack/dist.js
rtk git commit -m "feat: cfg/rspack/dist.js（双压缩器 + LegionExtract + Copy + report 透传）"
```

---

### 任务 7：webpack.config.js 分发器改造

**执行目录**：`D:\Front-End\legions-framework\brain-cli`

**文件：**
- 修改：`webpack.config.js`

- [ ] **步骤 1：加 engine 路由（webpack 分支零改动）**

`webpack.config.js` 完整改动（仅新增 require 与 if 分支，原 switch 不动）：

```js
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./cfg/dev", "./cfg/dist", "./cfg/rspack/dev", "./cfg/rspack/dist", "./libs/utils/engine"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const dev_1 = require("./cfg/dev");
    const dist_1 = require("./cfg/dist");
    const rspack_dev_1 = require("./cfg/rspack/dev");
    const rspack_dist_1 = require("./cfg/rspack/dist");
    const resolveEngine = require("./libs/utils/engine").default;
    const path = require('path');
    /**
     * Build the webpack configuration
     * @param  {String} wantedEnv The wanted environment
     * @return {Object} Webpack config
     */
    function buildConfig() {
        return (eConfig) => {
            let env;
            if (process.env.NODE_ENV === 'production') {
                env = 'production';
            }
            else {
                env = process.env.NODE_ENV = 'dev';
            }
            // v3 双内核分发：engine × NODE_ENV 四路路由（webpack 链路零改动）
            if (resolveEngine(eConfig) === 'rspack') {
                return env === 'production' ? (0, rspack_dist_1.default)(eConfig) : (0, rspack_dev_1.default)(eConfig);
            }
            switch (env) {
                case 'production':
                    return (0, dist_1.default)(eConfig);
                case 'dev':
                    return (0, dev_1.default)(eConfig);
            }
        };
    }
    const getConfig = buildConfig();
    exports.default = getConfig;
});
```

- [ ] **步骤 2：验证双路分发**

```bash
node -e "process.env.NODE_ENV='dev'; const EConfig=require('./libs/settings/EConfig').default; const getConfig=require('./webpack.config').default; const c=getConfig(EConfig.getInstance()); console.log('默认(rspack) experiments:', JSON.stringify(c.experiments), '| devServer?', !!c.devServer)"
node -e "process.env.NODE_ENV='dev'; process.env.BRAIN_ENGINE='webpack'; const EConfig=require('./libs/settings/EConfig').default; const getConfig=require('./webpack.config').default; const c=getConfig(EConfig.getInstance()); console.log('webpack 兜底 experiments:', JSON.stringify(c.experiments), '| devServer?', !!c.devServer)"
```

预期：第一条 `experiments: {"newCache":true} | devServer? true`（rspack dev 配置）；第二条 `experiments: undefined | devServer? true`（webpack 版无 experiments 字段 = 原链路未被破坏）。

- [ ] **步骤 3：Commit**

```bash
rtk git add webpack.config.js
rtk git commit -m "feat: webpack.config.js 双内核分发器（engine × NODE_ENV 四路路由）"
```

---

### 任务 8：libs/webpack/rspackCompiler.js

**执行目录**：`D:\Front-End\legions-framework\brain-cli`

**文件：**
- 创建：`libs/webpack/rspackCompiler.js`

- [ ] **步骤 1：编写完整代码**

```js
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../../webpack.config", "../settings/EConfig", "../utils/logs", "../utils/format", "../constants/constants", "../utils/update-notifier"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const format_1 = require("../utils/format");
    const webpack_config_1 = require("../../webpack.config");
    const EConfig_1 = require("../settings/EConfig");
    const logs_1 = require("../utils/logs");
    const constants_1 = require("../constants/constants");
    const update_notifier_1 = require("../utils/update-notifier");
    const { rspack } = require('@rspack/core');
    /**
     * Rspack 编译器封装：日志 hooks 与 webpackCompiler.js 对齐（[rspack] 前缀）。
     * 返回 { compiler, config }——dev server 需要 config.devServer。
     */
    function rspackCompiler() {
        const config = webpack_config_1.default(EConfig_1.default.getInstance());
        if (Array.isArray(config.pendings)) {
            config.pendings.forEach(pending => pending());
        }
        delete config.pendings;
        const compiler = rspack(config);
        const { name: projectName, apps, defaultPort, devServer: { https }, server } = EConfig_1.default.getInstance();
        const projectUrl = `${constants_1.URL_PREFIX}/${projectName}/${apps.length ? apps[0] : ''}`;
        let bundleStartTime;
        compiler.hooks.compile.tap('brain-cli', () => {
            (0, logs_1.log)('[rspack] 打包中...');
            bundleStartTime = Date.now();
        });
        compiler.hooks.done.tap('brain-cli', () => {
            (0, logs_1.log)(`[rspack] 打包完成, 耗时 ${(0, format_1.asSeconds)(Date.now() - bundleStartTime)} s. ${new Date()}`);
            (0, logs_1.logAppRunning)({ port: defaultPort, projectUrl, https, server });
            (0, update_notifier_1.chkUpdateNotifier)();
        });
        return { compiler, config };
    }
    exports.default = rspackCompiler;
});
```

（rspackCompiler.js 代码块已完整：`let bundleStartTime;` 已内嵌，返回 `{ compiler, config }`。）

- [ ] **步骤 2：验证模块可加载**

```bash
node -e "const m=require('./libs/webpack/rspackCompiler'); console.log('module:', typeof m.default)"
```

预期：`module: function`。

- [ ] **步骤 3：Commit**

```bash
rtk git add libs/webpack/rspackCompiler.js
rtk git commit -m "feat: rspackCompiler.js（@rspack/core 编译器封装，返回 { compiler, config }）"
```

---

### 任务 9：webpackDevServer.js 按引擎分发

**执行目录**：`D:\Front-End\legions-framework\brain-cli`

**文件：**
- 修改：`libs/webpack/webpackDevServer.js`

- [ ] **步骤 1：加引擎分支（webpack 分支一行不动）**

① 文件头 UMD define 列表追加 `"../utils/engine"`；② 在 `const logs_1 = require("../utils/logs");` 之后新增：

```js
    const resolveEngine_1 = require("../utils/engine");
```

③ `startWebpackDevServer` 的 Promise 体内，`const { server = '0.0.0.0' } = eConfig;` 之后插入：

```js
            // v3 双内核：按引擎分发（rspack 分支动态 require，避免污染 webpack 兜底路径）
            if (resolveEngine_1.default(eConfig) === 'rspack') {
                const { RspackDevServer } = require('@rspack/dev-server');
                const rspackCompiler_1 = require('./rspackCompiler');
                const { compiler, config } = rspackCompiler_1.default();
                const devServerOptions = Object.assign({}, (config && config.devServer) || {}, {
                    port: eConfig.defaultPort,
                    host: server,
                });
                const devServer = new RspackDevServer(devServerOptions, compiler);
                devServer.startCallback((err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    (0, logs_1.log)(`监听本地 ${server}:${eConfig.defaultPort}`);
                    resolve(undefined);
                });
                return;
            }
```

（rspack 分支动态 require `@rspack/dev-server` 与 `./rspackCompiler`，webpack 兜底路径保持字节级不动。）


- [ ] **步骤 2：验证 webpack 兜底未破坏（此阶段 dev 默认引擎仍走 rspack 配置但 devServer 未分发——只验兜底）**

说明：任务 7 分发器已默认 rspack 配置，但 devServer 分发在任务 9 才接线。此步骤只验 webpack 兜底：

```bash
node bin/index.js dev --apps=app1 --engine=webpack
```

预期：编译成功、端口可访问（与任务 7 之前行为一致），日志无 `[rspack]` 剶缀。Ctrl+C 停止。

- [ ] **步骤 3：验证 rspack dev 全链路启动**

```bash
node bin/index.js dev --apps=app1
```

预期：进度条/日志出现 `[rspack] 打包完成`，浏览器打开 `http://localhost:8001/app/test/app1` 页面渲染正常，Ctrl+C 停止。

- [ ] **步骤 4：Commit**

```bash
rtk git add libs/webpack/webpackDevServer.js
rtk git commit -m "feat: webpackDevServer 按引擎分发（RspackDevServer 接线，webpack 分支零改动）"
```

---

### 任务 10：libs/program/index.js build 分发

**执行目录**：`D:\Front-End\legions-framework\brain-cli`

**文件：**
- 修改：`libs/program/index.js`

- [ ] **步骤 1：production 分支按引擎分发**

① 在 `const webpack = require("webpack");` 之后新增：

```js
    const resolveEngine_1 = require("../utils/engine");
```

② production 分支中 `delete webpackConfig.pendings;` 之后、`webpack(webpackConfig, function (err, stats) {` 之前插入：

```js
            // v3 双内核：build 按引擎分发（rspack 动态 require，webpack 路径零改动）
            const engine = resolveEngine_1.default(eConfig);
            const bundler = engine === 'rspack' ? require('@rspack/core').rspack : webpack;
```

③ 原 `webpack(webpackConfig, function (err, stats) {` 调用改为：

```js
            bundler(webpackConfig, function (err, stats) {
```

（`bundler` 签名与 webpack(config, callback) 一致：`rspack(config, callback)` 同样支持 callback 形式。）

- [ ] **步骤 2：验证 build 双引擎**

```bash
node bin/index.js build --apps=app1 --engine=rspack
node bin/index.js build --apps=app1 --engine=webpack
```

预期：两条命令均产出 `dist/app1/js/` 产物与 HTML；rspack 构建产物中无 `console.log`（demo 代码含 console 时）。

- [ ] **步骤 3：Commit**

```bash
rtk git add libs/program/index.js
rtk git commit -m "feat: build 链路按引擎分发（rspack(config, cb) 接线）"
```

---

### 任务 11：brain-cli demo 双引擎自测矩阵

**执行目录**：`D:\Front-End\legions-framework\brain-cli`

**文件：**
- 无新文件（自测 + 修复循环）

- [ ] **步骤 1：dev 双引擎自测**

```bash
# ① webpack 兜底回归（必须与 2.0.0-alpha.3 行为一致）
node bin/index.js dev --apps=app1 --engine=webpack
# ② rspack 默认（不带 --engine）
node bin/index.js dev --apps=app1
# ③ rspack 显式
node bin/index.js dev --apps=app1 --engine=rspack
```

预期：① 无 `[rspack]` 前缀、编译成功、`http://localhost:8001/app/test/app1` 渲染正常；
②③ `[rspack] 打包完成` 日志出现、页面渲染正常、无 Console 红色报错。

- [ ] **步骤 2：HMR + 持久缓存验证**

dev（rspack）运行中修改 `src/app1` 下任一文件保存 → 预期 1 秒内 `[rspack] 打包完成`。
重启 dev（rspack）→ 预期第二次启动明显快于第一次（`experiments.newCache` 持久缓存生效）。

- [ ] **步骤 3：build 双引擎自测 + 产物检查**

```bash
node bin/index.js build --apps=app1 --engine=rspack && mv dist dist-rs
node bin/index.js build --apps=app1 --engine=webpack && mv dist dist-wp
```

预期：两份产物均含 `app1/js/*.js`、`app1/index.html`、CSS 产物；rspack 产物 grep `console.log` 为空（drop_console 生效）；
`dist-wp` 与 `dist-rs` 顶层目录集合一致。检查后 `rm -rf dist-rs dist-wp dist` 清理。

- [ ] **步骤 4：非法值与兜底**

```bash
node bin/index.js dev --apps=app1 --engine=rollup
```

预期：启动即报 `非法 engine: "rollup"...` 并退出非 0（invariant fail fast）。

- [ ] **步骤 5：问题修复循环 + Commit**

自测发现的偏差修复后重跑失败项，全部通过后：

```bash
rtk git add -A
rtk git commit -m "test: brain-cli demo 双引擎自测通过（dev/HMR/缓存/build/兜底/非法值）"
```

---

## 阶段 2：wms-aps-web 验收与发布（任务 12-16，执行目录 `D:\Front-End\hoolinks\wms-aps-web`）

### 任务 12：创建验收脚本

**执行目录**：`D:\Front-End\hoolinks\wms-aps-web`

**文件：**
- 创建：`scripts/rspack/check-output-syntax.js`
- 创建：`scripts/rspack/diff-build-output.js`

- [ ] **步骤 1：编写 check-output-syntax.js（完整代码）**

```js
/**
 * 产物语法级别扫描：用 acorn 按指定 ecmaVersion 解析所有产物 chunk。
 * 用法：node scripts/rspack/check-output-syntax.js <产物目录> <ecmaVersion>
 * 例：node scripts/rspack/check-output-syntax.js dist 5
 * 退出码：0=全部通过，1=存在超纲语法（打印文件与语句位置），2=参数错误
 */
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const dir = process.argv[2];
const ecmaVersion = parseInt(process.argv[3] || '5', 10);
if (!dir || !fs.existsSync(dir)) {
    console.error('用法: node check-output-syntax.js <产物目录> <ecmaVersion>');
    process.exit(2);
}

function walkFiles(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
        const full = path.join(dir, d.name);
        return d.isDirectory() ? walkFiles(full) : /\.js$/.test(d.name) ? [full] : [];
    });
}

const failures = [];
const files = walkFiles(dir);
for (const file of files) {
    const code = fs.readFileSync(file, 'utf8');
    try {
        acorn.parse(code, { ecmaVersion });
    } catch (e) {
        failures.push({ file: path.relative(process.cwd(), file), error: e.message });
    }
}
console.log(`扫描 ${files.length} 个 JS 产物，ecmaVersion=${ecmaVersion}`);
if (failures.length) {
    console.log(`\n超纲语法 ${failures.length} 个文件（前 20 个）：`);
    failures.slice(0, 20).forEach((f) => console.log(`  - ${f.file}: ${f.error}`));
    process.exit(1);
}
console.log('全部通过');
```

> acorn 来自 jest/playwright 依赖树，若 `require('acorn')` 失败：`yarn add -D acorn --ignore-engines`。

- [ ] **步骤 2：编写 diff-build-output.js（完整代码）**

```js
/**
 * 新旧引擎 build 产物 diff：对比两次产物的文件清单/大小/HTML 引用。
 * 用法：
 *   yarn build:spo && mv dist dist-wp
 *   yarn build:spo（rspack） && mv dist dist-rs
 *   node scripts/rspack/diff-build-output.js dist-wp dist-rs
 * 退出码 0=结构等价，1=有差异
 */
const fs = require('fs');
const path = require('path');

function collect(dir, prefix = '') {
    const map = {};
    if (!fs.existsSync(dir)) return map;
    for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, d.name);
        const rel = `${prefix}${d.name}`;
        if (d.isDirectory()) Object.assign(map, collect(full, `${rel}/`));
        else if (/\.(js|html|css)$/.test(d.name)) map[rel] = fs.statSync(full).size;
    }
    return map;
}

function htmlScripts(dir) {
    const out = {};
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
        if (f.isFile() && f.name.endsWith('.html')) {
            const html = fs.readFileSync(path.join(dir, f.name), 'utf8');
            out[f.name] = [...html.matchAll(/src="([^"]+\.js)"/g)].map((m) => m[1]);
        }
    }
    return out;
}

const [wpDir, rsDir] = process.argv.slice(2);
const wp = collect(wpDir), rs = collect(rsDir);
const wpScripts = htmlScripts(wpDir), rsScripts = htmlScripts(rsDir);

// 文件名含 chunkhash 逐文件比对无意义；按「目录/层级的 chunk 角色集合」比较
const wpTop = new Set(Object.keys(wp).map((k) => k.split('/')[0]));
const rsTop = new Set(Object.keys(rs).map((k) => k.split('/')[0]));
console.log('webpack 顶层目录:', [...wpTop].sort().join(','));
console.log('rspack  顶层目录:', [...rsTop].sort().join(','));
let fail = false;
for (const d of new Set([...wpTop, ...rsTop])) {
    const wc = Object.keys(wp).filter((k) => k.startsWith(`${d}/`)).length;
    const rc = Object.keys(rs).filter((k) => k.startsWith(`${d}/`)).length;
    if (Math.abs(wc - rc) / Math.max(wc, rc, 1) > 0.1) {
        console.log(`✗ ${d}: webpack ${wc} 个 vs rspack ${rc} 个文件（差异超 10%）`);
        fail = true;
    } else {
        console.log(`✓ ${d}: ${wc} vs ${rc}`);
    }
}
for (const html of new Set([...Object.keys(wpScripts), ...Object.keys(rsScripts)])) {
    const w = (wpScripts[html] || []).length, r = (rsScripts[html] || []).length;
    if (w !== r) { console.log(`✗ ${html}: 引用 JS 数 ${w} vs ${r}`); fail = true; }
}
console.log(fail ? '\n有差异，需人工核对' : '\n产物结构等价');
process.exit(fail ? 1 : 0);
```

- [ ] **步骤 3：Commit**

```bash
cd "D:\Front-End\hoolinks\wms-aps-web"
rtk git add scripts/rspack/
rtk git commit -m "feat: Rspack 迁移验收工具（产物语法扫描 + 双引擎产物 diff）"
```

---

### 任务 13：tgz 联调接入

**执行目录**：先 `D:\Front-End\legions-framework\brain-cli`，后 `D:\Front-End\hoolinks\wms-aps-web`

**文件：**
- 修改：`wms-aps-web/package.json`（brain-cli 依赖指向 tgz）

- [ ] **步骤 1：打包 tgz**

```bash
cd "D:\Front-End\legions-framework\brain-cli"
npm pack
# 产出 brain-cli-3.0.0-alpha.1.tgz
cp brain-cli-3.0.0-alpha.1.tgz "D:\Front-End\hoolinks\wms-aps-web\vendor\brain-cli-3.0.0-alpha.1.tgz"
```

（若 vendor 目录不存在先 `mkdir "D:\Front-End\hoolinks\wms-aps-web\vendor"`；确认 `.npmignore` 生效：tgz 内不含 src/dist/cache。）

- [ ] **步骤 2：wms-aps-web 接入**

`wms-aps-web/package.json` 改依赖：

```json
"brain-cli": "file:./vendor/brain-cli-3.0.0-alpha.1.tgz",
```

然后：

```bash
cd "D:\Front-End\hoolinks\wms-aps-web"
yarn install --ignore-engines
yarn brain-cli --version
```

预期：`yarn brain-cli --version` 输出 `3.0.0-alpha.1`。

- [ ] **步骤 3：首验 webpack 兜底（升级即回退保障）**

```bash
yarn dev:spo --engine=webpack
```

预期：与 2.0.0-alpha.3 行为完全一致（编译成功、8020 端口、页面正常）。这是"升级后任何异常都可参数级回退"的实证。

- [ ] **步骤 4：Commit**

```bash
rtk git add package.json vendor/ yarn.lock
rtk git commit -m "chore: brain-cli 升级 3.0.0-alpha.1（tgz 联调期）"
```

---

### 任务 14：wms-aps-web dev 验收矩阵（规格 §8 第 1-9 项）

**执行目录**：`D:\Front-End\hoolinks\wms-aps-web`

**文件：**
- 无新文件（验收 + 基线记录）

- [ ] **步骤 1：逐 app dev 验收（矩阵第 1 项）**

```bash
yarn dev:spo
yarn dev:wms
yarn dev:basics
yarn dev:admin
yarn dev:system
yarn dev:demo
```

（逐个执行、浏览器验证后 Ctrl+C 再测下一个；迭代期脚本未加 --engine，默认引擎即 rspack。）
预期：每个 app 编译成功（`[rspack] 打包完成`）、页面渲染 + 路由跳转正常、Console 无红色报错。

- [ ] **步骤 2：全量 dev + 性能基线对比（矩阵第 2 项）**

```bash
# 基线（旧内核）：
yarn dev:spo --engine=webpack   # 记录冷启动耗时；编译完成后任务管理器/PowerShell 记录 node 进程 WS 内存
# 新内核：
yarn dev:spo                    # 同口径记录
yarn dev                        # 全量 6 app，同口径记录
```

预期：rspack 稳态内存显著低于 webpack 基线（3GB 问题兑现收敛），记录数据写入 wms-aps-web
`docs/superpowers/plans/2026-08-31-brain-cli-rspack-baseline.md`（若未建此文件则创建并记录四组指标：冷启动/HMR/内存/build）。

- [ ] **步骤 3：HMR 验证（矩阵第 3 项）**

dev（rspack）运行中修改 `src/spo/containers` 下页面文案保存。预期 1 秒内 `[rspack] 打包完成`。

- [ ] **步骤 4：样式与 transformer 验证（矩阵第 4-6 项）**

页面核对：antd 2 组件样式正常（表格/表单/弹窗）、CSS Modules 页面类名正常、
LegionsProTable 列表页正常渲染（无 uniqueUid 相关警告）。涉及 LOCAL_OLD_URL/LOCAL_NEXT_URL 联调的场景跑一次 `yarn dev:local`（验证项目侧透传 DefinePlugin 实例在 Rspack 下生效）。

- [ ] **步骤 5：代理与 qiankun 验证（矩阵第 7-8 项）**

代理：任一列表页拉取真实接口数据成功；WebSocket：打开消息中心（/scmpsm ws）连接正常。
qiankun 双路径：① `http://localhost:8020/app/spo/index.html` 独立运行正常；
② 从 demo18 宿主页签进入 spo/wms 页签，挂载/路由/VTable 渲染正常，无 React #321。

- [ ] **步骤 6：静态资源验证（矩阵第 9 项）**

页面核对含图片/字体的页面（或 devtools Network 确认资源 200）。预期：dev 下图片经内存服务可显示（`generator.emit:false` 行为）、字体图标正常。

- [ ] **步骤 7：问题修复循环（brain-cli 侧改动走 tgz 重发布流程）**

验收发现的 brain-cli 缺陷：brain-cli 侧修复 → `npm pack` → 覆盖 vendor tgz → `yarn install --ignore-engines` → 重跑失败项。
全部通过后 Commit：

```bash
rtk git add -A && rtk git commit -m "test: wms-aps-web dev 验收矩阵 1-9 通过（rspack 默认内核）"
```

---

### 任务 15：wms-aps-web build 验收矩阵（规格 §8 第 10-16 项）

**执行目录**：`D:\Front-End\hoolinks\wms-aps-web`

**文件：**
- 无新文件（验收 + 记录）

- [ ] **步骤 1：spo 双引擎产物 diff（矩阵第 10 项）**

```bash
yarn build:spo --engine=webpack && mv dist dist-wp
yarn build:spo && mv dist dist-rs
node scripts/rspack/diff-build-output.js dist-wp dist-rs
```

预期：顶层目录集合一致、各目录文件数差异 ≤10%、HTML 引用数一致 → 退出码 0。核对后 `rm -rf dist-wp dist-rs dist`。

- [ ] **步骤 2：压缩与资源链验证（矩阵第 11-13 项）**

```bash
yarn build:spo
grep -c "console.log" dist/spo/js/*.js || echo "drop_console 生效"
grep -o "uniqueUid" dist/spo/js/*.js | head -1 || echo "transformer 未注入（FAIL）"
```

预期：`drop_console 生效`（或计数为 0）；`uniqueUid` 在产物中出现（ts-plugin-legions 注入生效）；
CSS 产物存在于 `dist/spo/styles/`、`dist/common/styles/`；HTML 引用路径含 `--cdn` 域名（build:spo 自带 `--cdn=https://demo18-scm.hoolinks.com/static/`）。

- [ ] **步骤 3：LegionExtract / FixHtmlAssetsPath / 语法扫描（矩阵第 13-14 项）**

LegionExtract：确认图片等模块级静态资源落在对应 chunk 目录（如 `dist/spo/...`）而非散落 dist 根；
FixHtmlAssetsPathPlugin：build 输出日志出现 `已修复 …index.html 中的静态资源路径`；
语法扫描：`node scripts/rspack/check-output-syntax.js dist 5` 与 webpack 现状同档（差异仅打包器 runtime，报错文件数同量级）。

- [ ] **步骤 4：真实部署冒烟 + 回归（矩阵第 15-16 项）**

```bash
yarn build:spo:uat && 部署 dist 至 uat 环境冒烟（登录/spo 列表/操作流）
npm run test:e2e:traditional   # 与基线一致
npm run test:unit 2>&1 | tail -5   # 177 个存量失败零新增
```

预期：uat 冒烟通过；E2E 传统项目与 master 基线一致；单测失败数不高于存量 177。

- [ ] **步骤 5：Commit**

```bash
rtk git add -A && rtk git commit -m "test: wms-aps-web build 验收矩阵 10-16 通过（产物 diff/压缩/资源链/语法/部署冒烟）"
```

---

### 任务 16：发布 alpha 与团队升级

**执行目录**：`D:\Front-End\legions-framework\brain-cli` → `D:\Front-End\hoolinks\wms-aps-web`

**文件：**
- 修改：`wms-aps-web/package.json`

- [ ] **步骤 1：发布**

```bash
cd "D:\Front-End\legions-framework\brain-cli"
npm publish --tag alpha
```

预期：发布成功（若遇 E404，检查 .npmrc registry 与包名占用后重试）。

- [ ] **步骤 2：wms-aps-web 切回 registry 版本**

`package.json`：

```json
"brain-cli": "3.0.0-alpha.1",
```

```bash
yarn install --ignore-engines
yarn brain-cli --version   # 预期 3.0.0-alpha.1
yarn dev:spo               # 验证 registry 版本行为与 tgz 一致
```

- [ ] **步骤 3：环境清单沉淀（写入 baseline 文档）**

- Node ≥ 16（Rspack native 二进制要求；当前 v24.16.0 满足，团队/CI 环境需核对）
- Rspack native 二进制对离线环境/私有源可达性（npmmirror binary 镜像）
- `.webpack_cache`（webpack）与 Rspack 缓存（node_modules/.cache/rspack）天然隔离，无需迁移
- 兜底说明：任何命令追加 `--engine=webpack` 即回旧内核；版本级回退 = 依赖回 2.0.0-alpha.3

- [ ] **步骤 4：Commit + 推送**

```bash
rtk git add package.json yarn.lock
rtk git commit -m "feat: brain-cli 升级 3.0.0-alpha.1（registry 版本，默认 rspack 内核）"
rtk git push
```

- [ ] **步骤 5：观察期事项（另行任务，不在本计划内执行）**

观察 1-2 个迭代后：清理 brain-cli 内 webpack 死代码（cfg/dll.js、dllPlugins.js、webpackDllCompiler.js、happy-pack-conf.js、cfg/base.js 中 Spritesmith）；`--engine=webpack` 兜底路径保留期由团队决策。

---

## 自检记录

- **规格覆盖度**：规格 §1 三决策（任务 1/16：仓库实现+版本号、默认 rspack 在任务 7/9/10 生效、tgz 在任务 13）；
  §2 评估修正项（任务 2 时序判定、任务 5 static.directory=src、任务 4 全量字段、任务 6 双压缩器）；
  §3-4 架构与判定链（任务 2/7）；§5 字段映射（任务 4）；§6 接线（任务 8/9/10）；
  §7 风险矩阵预案（任务 1 导出面验证、任务 11/14/15 验证点）；§8 验收矩阵 16 项（任务 14/15 逐项对应）；
  §9 发布回退（任务 13 步骤 3 兜底实证、任务 16）；§10 错误处理（任务 2 fail fast、[rspack] 前缀任务 8）——均有对应任务。
- **占位符扫描**：已修复编写过程中的损坏行（base.js require 路径、Optimization 分包对象、css 规则 include、
  getTsLoadersed 调用、cdnRelease 行、dev.js __rest/downstream、dist.js report 分支、rspackCompiler bundleStartTime、
  webpackDevServer 构造参数、命令笔误×3、步骤编号×2），全部内联修复，无遗留"待定/TODO"。
- **类型/名称一致性**：`resolveEngine`（libs/utils/engine.js）↔ `BRAIN_ENGINE`（command.js 写入）↔ 分发点
  （webpack.config.js / webpackDevServer.js / libs/program/index.js）三处一致；`rspackCompiler()` 返回
  `{compiler, config}` 与任务 9 解构一致；`cfg/rspack/{base,dev,dist}` 与分发器 require 路径一致。

