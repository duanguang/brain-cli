# brain-cli v3 双内核（Rspack）设计规格

- **日期**：2026-09-01
- **状态**：设计已批准，待实现
- **仓库**：brain-cli（分支 `3.x-develop`）

## 1. 背景与目标

brain-cli 2.0.0-alpha.3（webpack 5）在 wms-aps-web 上 dev 全量 6 app 内存 ~3GB、编译慢。
目标：增加 Rspack 内核，wms-aps-web 升级 `brain-cli@3.0.0-alpha.1` 后零改动、全功能正常，dev 内存/速度收益兑现。

### 1.1 三个关键决策（已批准）

| 决策 | 结论 |
|---|---|
| 架构落点 | brain-cli 仓库 `3.x-develop` 实现（否决计划中 `tools/brain-cli` fork 方案）；wms-aps-web 仅改一行依赖版本 |
| 默认引擎 | 3.0.0-alpha.1 直接默认 rspack；`--engine=webpack` 永久兜底；升级前完成第 8 节验收矩阵 |
| 联调方式 | 先 tgz 后发布：迭代期 `npm pack` → wms-aps-web `file:./vendor/….tgz`；稳定后 `npm publish --tag alpha` → wms-aps-web 切回 registry 版本 |

## 2. 对原计划的评估结论

原计划方法论正确（基线先行、spike GO/NO-GO、阶段化兜底），dll/Spritesmith 死代码判定经逐行核实正确；
`libraryTarget:'window'` 风险已解除（Rspack 官方支持）。v3 修正计划 5 个缺陷：

| # | 计划缺陷 | v3 修正 |
|---|---|---|
| 1 | 架构落点为项目内 fork | brain-cli 仓库实现 |
| 2 | `--engine` 在 `EConfig.init()` 读 env（时序 bug：单例在 require 时已构造，env 读不到） | 判定移到配置分发时（`libs/utils/engine.js`） |
| 3 | `static.directory` 用 `'static'`，webpack 版实际是 `src` | 对齐：`static.directory = src` |
| 4 | rspack base 草稿缺 asset 规则/`ignoreWarnings`/`loader_include`/px2rem | 第 5 节字段映射逐项对齐全量字段 |
| 5 | dist 覆盖式 `minimizer` 丢 CSS 压缩 | 双压缩器数组对齐 webpack 版结构 |

计划未覆盖但已补充：react-hot-loader、FixHtmlAssetsPathPlugin、ws 代理、`--cdn` publicPath、产物 diff/语法扫描（见第 7/8 节）。

## 3. 总体架构

```
bin/index.js
 └── libs/program/command.js            # [改] + --engine 选项，action 内 setEngine
       └── libs/program/index.js        # [改] build 分支按引擎分发
             ├── dev:  server.js → webpackDevServer.js   # [改] 按引擎分发
             │         ├── webpack → webpackCompiler.js  # [零改动]
             │         └── rspack  → rspackCompiler.js   # [新]
             └── build: 按引擎调 rspack(config, cb) 或 webpack(config, cb)
                        配置统一经 webpack.config.js 分发器   # [改] engine × NODE_ENV 四路路由
                        ├── webpack → cfg/{dev,dist}.js → cfg/base.js       # [零改动]
                        └── rspack  → cfg/rspack/{dev,dist}.js → cfg/rspack/base.js  # [新]
```

共享层（引擎无关，零改动复用）：EConfig、htmlWebpackPlugin、javaScriptLoader（babel+ts-loader 规则）、
LegionExtractStaticFilePlugin（hook 面全兼容）、logs/format/env/constants 工具。
新增文件：`libs/utils/engine.js`、`cfg/rspack/{base,dev,dist}.js`、`libs/webpack/rspackCompiler.js`；
修改文件：`command.js`、`libs/program/index.js`、`webpack.config.js`、`webpackDevServer.js`、`package.json`。
webpack 链路字节级不动，兜底路径等价性由物理隔离直接保证。

## 4. 引擎判定链

```js
// libs/utils/engine.js（新）
// 判定时机：配置分发时（webpack.config.js / server 分发点），不在 EConfig.init() 里。
// 原因：EConfig 单例在模块 require 时已构造（javaScriptLoader.js 顶层调 getInstance()），
//       而 --engine 在 commander action 阶段才设置 env —— 在 init() 里读永远读不到（原计划时序 bug）。
const invariant = require('invariant');

function resolveEngine(eConfig) {
    const raw = (process.env.BRAIN_ENGINE || (eConfig && eConfig.engine) || 'rspack').toLowerCase().trim();
    invariant(raw === 'webpack' || raw === 'rspack',
        `非法 engine: "${raw}"，合法值: webpack | rspack（默认 rspack）`);
    return raw;
}
module.exports = resolveEngine;
```

优先级：**CLI `--engine` > `BRAIN_ENGINE` env > `.e-config.js` `engine` 字段 > 默认 `rspack`**。

## 5. cfg/rspack/base.js 字段映射表（逐项对齐 webpack 版 cfg/base.js）

| webpack 版 | rspack 版 | 说明 |
|---|---|---|
| entry/mode/devtool `cheap-module-source-map` | 同 | Rspack 直接支持 |
| `cache: filesystem(.webpack_cache)` | `experiments.cache`（默认 `node_modules/.cache/rspack`） | 两引擎缓存天然隔离 |
| `output.library` + `libraryTarget:'window'`（支持 string/function library） | 同 | Rspack 官方支持 window |
| `chunkLoadingGlobal`/`filename`/`chunkFilename`/`publicPath`/`hashFunction: xxhash64` | 同 | qiankun 产物形态不变 |
| `resolve.alias`（legions-nprogress/utils-tool esm 别名+项目别名）/`extensions`/`modules` | 同 | |
| `ignoreWarnings`（4 条+用户追加） | 同 | Rspack 支持 |
| `optimization.splitChunks` common（node_modules, initial, priority 6） | 同 | |
| javaScriptLoader（babel+ts-loader，含 ts-plugin-legions transformer） | **直接复用同一模块** | 引擎无关 |
| getCssLoaders（style/css/postcss+px2rem/less+javascriptEnabled + `*.modules.css` 正则 + `loader_include`） | **显式 loader 链原样搬运，不用 experiments.css** | antd2 less/CSS Modules 正则/loader_include 行为最等价；MiniCssExtractPlugin 在 Rspack 兼容列表 |
| 图片/字体/jsp asset 规则（dev 图片 `emit:false`） | 同 | dev emit:false 列为实现期验证点 |
| TerserPlugin(drop_console/drop_debugger) | `SwcJsMinimizerRspackPlugin`（minimizerOptions 等价参数） | 以安装版 d.ts 为准 |
| CssMinimizerWebpackPlugin | `CssMinimizerRspackPlugin`（内置） | 双压缩器数组对齐 webpack 版结构 |
| `...plugins` 透传（项目侧 ProgressBar/FixHtmlAssetsPath/DefinePlugin） | 原样透传 | |
| webpack.DefinePlugin | `@rspack/core` 的 DefinePlugin | cfg/rspack 内一律用 @rspack/core 导出 |
| Spritesmith | 不迁移（icons 全空死代码） | rspack 分支不放 |
| devServer 组装 | cfg/rspack/dev.js | 无 dll pendings |

## 6. 接线与 dev/dist 对齐项

**rspackCompiler.js（新）**：日志 hooks 对齐 webpackCompiler.js（打包中/完成耗时/logAppRunning，`[rspack]` 前缀），返回 `{ compiler, config }`（dev server 需要 config.devServer）。

**webpackDevServer.js（改）**：
```js
if (resolveEngine(eConfig) === 'rspack') {
    const { RspackDevServer } = require('@rspack/dev-server');
    const { compiler, config } = rspackCompiler();
    const devServerOptions = Object.assign({}, config.devServer, { port: eConfig.defaultPort, host: eConfig.server || '0.0.0.0' });
    new RspackDevServer(devServerOptions, compiler).startCallback(cb);
} else {
    // 原 webpack 路径一行不动（含 pendings 处理）
}
```

**cfg/rspack/dev.js**：`static.directory = src`（对齐 webpack 版）、`setupMiddlewares`（express.static('./static') + before(app)）、historyApiFallback 复用 `HISTORY_REWRITE_FALL_BACK_REGEX_FUNC`、CORS headers 合并、proxy 透传、devServer 合并语义（解构+spread）对齐 webpack 版；无 dll pendings（vendors=[] 时 cfg/dll.js 返回 null，启动链路自然跳过）。

**cfg/rspack/dist.js**：devtool:false、双压缩器、LegionExtract + CopyPlugin static→common、`-s` report 模式透传（低兼容风险验证项，失败则 report 仅 webpack 引擎可用）。

## 7. 兼容性风险矩阵

| 风险项 | 等级 | 状态/预案 |
|---|---|---|
| `libraryTarget:'window'` | ~~高~~ 已解除 | Rspack 官方支持；实现后仍验证产物全局变量形态 |
| ts-plugin-legions transformer | 高 | getCustomTransformers 引擎无关；验收看表格页渲染 + 产物比对 |
| react-hot-loader（dev） | 中 | babel 插件引擎无关；失败兜底 = 项目侧 `disableReactHotLoader:true` |
| experiments.css vs loader 链 | 已定 | 不用 experiments.css，显式 loader 链原样搬运 |
| FixHtmlAssetsPathPlugin | 中 | `compiler.hooks.emit.tapAsync` Rspack 支持；build 验收看 HTML 路径替换日志 |
| ws 代理（/scmpsm） | 低 | 底层同为 http-proxy-middleware，`ws:true` 支持 |
| dev 图片 emit:false / BundleAnalyzer(-s) | 低 | 实现期实测；`-s` 失败则 report 仅 webpack 引擎可用 |
| Rspack native 二进制（Node≥16/CI/内网镜像） | 低 | 环境清单沉淀文档 |
| experiments.cache 字段名 | 低 | 以安装版 d.ts 为准；验证标准 = 二次启动明显变快 |

## 8. 验收矩阵（wms-aps-web 全功能正常 = 矩阵全过）

**dev 验收（tgz 联调期完成）：**
1. 6 app（admin/basics/spo/wms/system/demo）逐个 `dev:xxx --engine=rspack` 编译成功 + 页面渲染 + 路由正常
2. 全量 dev 编译成功，稳态内存/冷启动/HMR 记录并对比 webpack 基线（收益证据）
3. HMR 改文案 1 秒内生效
4. antd 2 样式正常（babel-plugin-import style:true 链路）
5. CSS Modules 类名正常
6. ts-plugin-legions 生效（LegionsProTable 列表页正常渲染，无 uniqueUid 警告）
7. 代理 + WebSocket（/scmpsm 消息中心）正常
8. qiankun：独立运行 + 宿主页签挂载双路径，无 React #321
9. 静态资源（图片/字体）引用正常

**build 验收：**
10. 产物结构 diff（目录集合/文件数 ±10%/HTML 引用数；用计划中的 `scripts/rspack/diff-build-output.js`）
11. drop_console/drop_debugger 生效（产物 grep 验证）
12. CSS 提取 + 压缩、`--cdn` publicPath 产物引用正确
13. LegionExtract 资源重定位 + FixHtmlAssetsPathPlugin 生效
14. 产物语法扫描（acorn）与 webpack 现状同档
15. 至少一轮 `build:spo:uat` 真实部署冒烟
16. E2E（`test:e2e:traditional`）与基线一致；177 个存量单测失败零新增

brain-cli 侧先行自测：`node bin/index.js dev / build --engine=webpack 兜底回归`（demo app1-3 双引擎对比）。

## 9. 发布与回退路径

发布流程：迭代期 npm pack → tgz 联调 → 验收矩阵全过 → `npm publish --tag alpha` → wms-aps-web 切回 registry 版本号 →
环境清单（Node ≥16、native 二进制内网镜像可达性、CI 核对）随发布沉淀 → 观察期后另行清理死代码（cfg/dll、Spritesmith、happyPack；webpack 路径保留不动）。

三层回退：① `--engine=webpack`（参数级，秒级）→ ② wms-aps-web 依赖回 `2.0.0-alpha.3`（版本级）→ ③ 环境清单指引。

## 10. 测试与错误处理

- 非法 engine 值 fail fast（invariant 报错列出合法值）
- rspack 编译错误：stats errors 输出；dev 下 client overlay 已有
- Rspack 配置校验异常直接抛出，bin 进程退出码非 0
- `[rspack]` 日志前缀区分内核，便于问题定位
- brain-cli 仓库不引入新单测基建（现状无），以 demo 自测 + wms-aps-web 验收矩阵为准

## 11. 自检记录

- **覆盖度**：三决策/评估结论/架构/引擎判定/字段映射/接线/dev+dist 对齐/风险矩阵/验收矩阵/发布回退/测试错误处理——均有对应章节
- **占位符**：无 TODO/待定；开放变量（SwcJsMinimizer 参数名、experiments.cache 字段名、-s 兼容性、dev emit:false）均配判定标准
- **一致性**：`--engine` ↔ `BRAIN_ENGINE` ↔ `resolveEngine` 三处一致；`cfg/rspack/{base,dev,dist}` 对齐 webpack 版命名；回退三层与发布流程自洽
- **范围**：brain-cli v3 双内核 + wms-aps-web 验收，单个实现计划可覆盖
