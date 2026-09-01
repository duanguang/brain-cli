# brain-cli 换 Rspack 内核迁移实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 为自研构建工具 brain-cli（webpack 5 内核）增加 Rspack 内核，通过 `--engine=rspack` 双内核切换，最终默认引擎切到 Rspack，解决 dev 内存 ~3GB 驻留与编译慢问题，且全部兜住现有功能。

**架构：** "包壳换芯"——对外保持 CLI 命令（dev/build/dll）与 `.e-config.js` 工厂函数签名完全不变，对内新增 `cfg/rspack/` 配置生成器 + `rspackCompiler`，复用 brain-cli 现有 EConfig/entries/devServer 编排层。babel-loader + ts-loader（含 ts-plugin-legions transformer）链路原样保留以保证产物行为等价。dll 链路与 Spritesmith 已确认为死代码（vendors=[]、6 个 app 的 icons 目录全空），不做迁移。

**技术栈：** Rspack（@rspack/core + @rspack/cli + @rspack/dev-server）、webpack 5.106.2（兜底内核）、babel-loader 9.2.1 + ts-loader 9.5.7（transpileOnly + ts-plugin-legions transformer）、html-webpack-plugin 5.6.7、qiankun 微前端（`libraryTarget: window` + `chunkLoadingGlobal`）。

**已实证的关键前提（2026-08-31 摸底，执行者可直接采信）：**

| 事实 | 证据 |
|------|------|
| dev 全量 6 app 内存 ~3GB（WS 2998MB） | PowerShell Get-Process 实测 brain-cli 进程 |
| brain-cli 是自研 CLI，~40 个文件 | `node_modules/brain-cli/` 目录清单 |
| dll 链路已停用（死代码） | `.e-config.js:110-115` 注释「方案2：不用 dll」 |
| 6 个 app 的 icons 目录全空，Spritesmith 空转 | `ls src/*/assets/images/icons/` 全部为空 |
| `--apps` 通过 `process.env.apps` 过滤 entry | `node_modules/brain-cli/libs/program/command.js:64-68` |
| ts-loader transpileOnly + getCustomTransformers | `node_modules/brain-cli/libs/webpack/javaScriptLoader.js:26-38` |
| devtool 硬编码 `cheap-module-source-map` | `node_modules/brain-cli/cfg/base.js:345` |
| qiankun 产物形态：`libraryTarget: 'window'` + `chunkLoadingGlobal` | `.e-config.js:253-264`、`cfg/base.js:340` |
| IE10 目标已是虚的（webpack 5 runtime = ES2015 语法） | base.js 无 target 配置，webpack 5 官方行为 |
| 测试基建：jest 单测 + Playwright E2E + Midscene | `package.json` scripts、`tests/` 目录 |

---

## 文件结构（锁定分解决策）

```
docs/superpowers/plans/
  2026-08-31-brain-cli-rspack-baseline.md   # 基线数据与 spike 结论（任务 1/7 产出）

scripts/rspack/
  spike.spo.config.mjs                      # P0 spike：spo 单模块 Rspack dev 配置（阶段 1）
  check-output-syntax.js                    # 产物语法扫描（acorn ecmaVersion:5/2015 双档）
  diff-build-output.js                      # 新旧引擎产物 diff（文件清单/大小/HTML 引用）

tools/brain-cli/                            # brain-cli v3 fork（阶段 2 起，本地 file: 依赖）
  package.json                              # version 3.0.0，依赖 @rspack/core 等
  bin/index.js
  libs/program/command.js                   # 增加 --engine 参数
  libs/settings/EConfig.js                  # 增加 engine 字段
  cfg/rspack/base.js                        # Rspack 配置生成器（对应 webpack 版 cfg/base.js）
  cfg/rspack/dev.js                         # devServer 组装
  cfg/rspack/dist.js                        # build 产物链路
  libs/webpack/rspackCompiler.js            # @rspack/core rspack() 编译器封装
  libs/webpack/webpackDevServer.js          # 按引擎分发 dev server

package.json                                # 项目侧：brain-cli 依赖指向 tools/brain-cli，scripts 加 --engine
```

**职责边界：** spike 配置（阶段 1）是一次性验证物，验证结论沉淀进 baseline 文档后归档；`tools/brain-cli/cfg/rspack/*` 是长期交付物，字段语义对齐 webpack 版 `cfg/base.js`；扫描/diff 脚本是验收工具，随仓库沉淀。业务源码（`src/**`）**零改动**。

---

## 阶段 0：基线采集（P0 前置，半天）

### 任务 1：采集现状基线数据

**文件：**
- 创建：`docs/superpowers/plans/2026-08-31-brain-cli-rspack-baseline.md`

- [ ] **步骤 1：记录环境信息**

在 baseline 文档写入：

```markdown
# brain-cli Rspack 迁移基线数据（2026-08-31）

## 环境
- Node: v24.16.0（注意：仓库 README/CLAUDE.md 写的 14.21.1 已过时）
- OS: Windows 11 Pro 10.0.26200
- brain-cli: 2.0.0-alpha.3 / webpack 5.106.2 / ts-loader 9.5.7 / babel-loader 9.2.1 / html-webpack-plugin 5.6.7
- Rspack 版本: （任务 2 安装后回填）

## 基线指标（webpack 5 现状）
| 指标 | 数值 | 采集方式 |
|------|------|---------|
```

- [ ] **步骤 2：采集 dev 冷启动耗时**

```bash
# 先停掉现有 dev server，清缓存做冷启动（模拟最坏情况）
rtk git status   # 确认工作区干净
rm -rf .webpack_cache
time yarn dev:spo
```

预期：终端输出 real 时间。记录到基线表「dev 冷启动（spo 单模块，冷缓存）」。
（顺手补一组全量 `time yarn dev` 的耗时，记录「dev 冷启动（全量 6 app）」。）

- [ ] **步骤 3：采集稳态内存**

dev server 编译完成后（终端出现「打包完成」），另开终端执行：

```bash
powershell -NoProfile -Command 'Get-CimInstance Win32_Process | Where-Object { $_.Name -eq "node.exe" } | ForEach-Object { $p = $_; try { $proc = Get-Process -Id $p.ProcessId -ErrorAction Stop; [PSCustomObject]@{ PID=$p.ProcessId; WS_MB=[math]::Round($proc.WorkingSet64/1MB); CMD=($p.CommandLine -replace "\s+"," ").Substring(0,[Math]::Min(120,$p.CommandLine.Length)) } } catch {} } | Sort-Object WS_MB -Descending | Select-Object -First 5 | Format-Table -AutoSize'
```

预期：找到 brain-cli 进程行，记录 WS_MB 到基线表「dev 稳态内存（spo）」。全量 dev 同理再测一组。

- [ ] **步骤 4：采集 HMR 单次耗时**

dev server 运行中，修改 `src/spo/containers` 下任一页面的一个字段文案并保存，观察终端从「打包中...」到「打包完成, 耗时 X s」的输出，记录到「HMR 增量编译（单文件改动）」。重复 3 次取平均。

- [ ] **步骤 5：采集 build 耗时**

```bash
time yarn build:spo
```

预期：记录 real 时间到「production build（spo）」。

- [ ] **步骤 6：Commit**

```bash
rtk git add docs/superpowers/plans/2026-08-31-brain-cli-rspack-baseline.md
rtk git commit -m "docs: brain-cli Rspack 迁移基线数据采集"
```

---

## 阶段 1：P0 spike——Rspack 跑通 spo 单模块 dev（2-3 天）

> 本阶段目标：用最小代价回答两个 GO/NO-GO 问题——① qiankun 产物形态能否挂载 ② 内存/速度收益是否兑现。spike 配置是一次性验证物，不进 brain-cli。

### 任务 2：安装 Rspack 依赖

**文件：**
- 修改：`package.json`（devDependencies）

- [ ] **步骤 1：安装**

```bash
yarn add -D @rspack/core @rspack/cli @rspack/dev-server --ignore-engines
```

- [ ] **步骤 2：记录版本**

```bash
npm ls @rspack/core @rspack/cli @rspack/dev-server
```

预期：三个包安装成功。把版本号回填 baseline 文档「Rspack 版本」行。
（若安装报 native 二进制下载失败，检查网络代理对 `https://registry.npmmirror.com/-/binary/rspack/` 的可达性。）

- [ ] **步骤 3：Commit**

```bash
rtk git add package.json yarn.lock
rtk git commit -m "chore: 安装 @rspack/core/cli/dev-server 依赖"
```

### 任务 3：编写 spike 配置

**文件：**
- 创建：`scripts/rspack/spike.spo.config.mjs`

- [ ] **步骤 1：编写配置（完整代码）**

```js
/**
 * P0 spike：spo 单模块 Rspack dev 配置
 * 复用项目 .e-config.js（proxy/alias/apps），字段语义对齐 brain-cli cfg/base.js
 * 运行：node scripts/rspack/spike-dev.mjs
 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

// 1. 复用项目配置工厂（与 brain-cli EConfig 同构：默认配置 + 项目 .e-config.js）
const brainDefaults = require('brain-cli/.e-config.js')
const econfig = require('../../.e-config.js')(brainDefaults)

const { rspack } = require('@rspack/core')
const webpack = require('webpack')
const ProgressBarPlugin = require('progress-bar-webpack-plugin')
const chalk = require('chalk')
const path = require('path')
const cwd = process.cwd()

process.env.NODE_ENV = 'development'
const APP = 'spo'

// 2. alias 对齐 .e-config.js webpack.resolve.alias
const alias = econfig.webpack.resolve.alias

// 3. babel/ts-loader 链对齐 brain-cli javaScriptLoader.js（保留 transformer）
const babelQuery = econfig.babel.query
const tsPluginLegions = require('ts-plugin-legions')

const config = {
    stats: 'errors-only',
    mode: 'development',
    entry: { [APP]: path.resolve(cwd, `src/${APP}/index`) },
    output: {
        // qiankun 产物形态（对齐 .e-config.js output + brain-cli base.js:340）
        library: `wms-business-platform-web-[name]`,
        libraryTarget: 'window',           // Rspack 支持度在任务 5 验证，失败则降级 umd
        chunkLoadingGlobal: 'webpackJsonpScpSpo',
        path: path.join(cwd, 'dist'),
        filename: '[name]/js/[name].js',
        publicPath: '/app/',
        hashFunction: 'xxhash64',
    },
    devtool: 'cheap-module-source-map',
    resolve: {
        alias,
        extensions: ['.web.js', '.js', '.json', '.ts', '.tsx', '.jsx'],
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                include: [path.join(cwd, './src')],
                use: [
                    { loader: 'babel-loader', options: babelQuery },
                    {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: true,
                            // transformer 链路原样保留（对齐 .e-config.js:265-312）
                            getCustomTransformers: () => ({
                                before: [
                                    tsPluginLegions.createTransformer([{ libraryName: 'legions/store', bindings: ['StoreModules'] }]),
                                    tsPluginLegions.createTransformerReactJsxProps({
                                        components: [
                                            { name: 'LegionsProTable', props: 'uniqueUid', value: '' },
                                            { name: 'LegionsProForm', props: 'uniqueUid' },
                                            { name: 'LegionsProTabsForm', props: 'uniqueUid' },
                                            { name: 'LegionsProTableForm', props: 'uniqueUid' },
                                            { name: 'LegionsProConditions', props: 'uniqueUid' },
                                            { name: 'LegionsProDataImport', props: 'uniqueUid' },
                                            { name: 'LegionsProVTable', props: 'uniqueUid' },
                                            { name: 'LegionsProQuickFilter', props: 'uniqueUid' },
                                        ],
                                    }),
                                ],
                            }),
                        },
                    },
                ],
            },
            {
                test: /\.(jsx|js)$/,
                include: [path.join(cwd, './src')],
                use: [{ loader: 'babel-loader', options: babelQuery }],
            },
            // css 链对齐 brain-cli base.js getCssLoaders（dev：style-loader 在前）
            {
                test: /\.css$/,
                use: ['style-loader', { loader: 'css-loader', options: { importLoaders: 1 } }],
            },
            {
                test: /\.less$/,
                use: [
                    'style-loader',
                    { loader: 'css-loader', options: { importLoaders: 2 } },
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: [require('autoprefixer')({ overrideBrowserslist: econfig.postcss.autoprefixer.browsers })],
                            },
                        },
                    },
                    'less-loader',
                ],
            },
            // antd 2 的 less 由 babel-plugin-import style:true 引入，include 放行 node_modules
            {
                test: /\.(png|jpe?g|gif|svg|woff|woff2|ttf|eot)$/,
                type: 'asset/resource',
                generator: { filename: 'others/[name].[ext]' },
            },
        ],
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.environment': '""',
            'process.env.apps': '"spo"',
            'process.env.webpackJsonp': '"webpackJsonpScpSpo"',
            'process.env.cdnRelease': '""',
            'process.env.LOCAL_OLD_URL': '""',
            'process.env.LOCAL_NEXT_URL': '""',
        }),
        new ProgressBarPlugin({ format: `spike [:bar] :percent (:elapsed seconds)` }),
    ],
    devServer: {
        port: 8021,                          // 避开 brain-cli 默认 8020，可并行对比
        hot: true,
        headers: { 'Access-Control-Allow-Origin': '*' },
        historyApiFallback: { rewrites: [{ from: new RegExp(`^/app/${APP}`), to: `/app/${APP}/index.html` }] },
        devMiddleware: { publicPath: '/app/', stats: 'errors-only' },
        static: { directory: path.resolve(cwd, 'static') },
        proxy: econfig.devServer.proxy,      // 代理配置直接复用项目 .e-config.js
        client: { overlay: { errors: true, warnings: false, runtimeErrors: false } },
    },
}

export default config
```

- [ ] **步骤 2：编写 spike 启动脚本**

创建 `scripts/rspack/spike-dev.mjs`：

```js
/** spike dev server 启动器 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { rspack } = require('@rspack/core')
const { RspackDevServer } = require('@rspack/dev-server')
const config = (await import('./spike.spo.config.mjs')).default

const compiler = rspack(config)
const server = new RspackDevServer(config.devServer, compiler)
server.startCallback(() => {
    console.log(`spike dev: http://localhost:8021/app/spo/index.html`)
})
```

- [ ] **步骤 3：本地验证配置可解析（先不启动）**

```bash
node -e "import('./scripts/rspack/spike.spo.config.mjs').then(c => console.log('config OK, entries:', Object.keys(c.default.entry)))"
```

预期：输出 `config OK, entries: ['spo']`。报错则修复路径/依赖后再继续。

- [ ] **步骤 4：Commit**

```bash
rtk git add scripts/rspack/
rtk git commit -m "feat: brain-cli Rspack spike 配置（spo 单模块 dev）"
```

### 任务 4：spike dev 启动与 HMR 验证

- [ ] **步骤 1：启动 spike dev server**

```bash
node scripts/rspack/spike-dev.mjs
```

预期：进度条走完、终端打印 spike dev 地址，无编译错误。
（**已知可能报错点**：① `ts-plugin-legions` transformer 在 Rspack 的 ts-loader 下行为需确认——若报 transformer 相关错，检查 ts-loader 9.5.7 的 `getCustomTransformers` 是否被调用；② Rspack 对 `libraryTarget: 'window'` 若不支持会报 output 校验错，此时改 `'umd'` 记录到 baseline 并继续——qiankun 挂载验证（任务 5）决定是否可接受。）

- [ ] **步骤 2：页面渲染验证**

浏览器打开 `http://localhost:8021/app/spo/index.html`，F12 Console 应无红色报错，spo 模块登录后路由正常。

- [ ] **步骤 3：HMR 验证**

修改 `src/spo/containers` 下任一页面文案并保存。

预期：终端在 1 秒内出现「打包完成」。记录 HMR 耗时 3 次取平均，回填 baseline 文档。

- [ ] **步骤 4：内存采集**

```bash
# 编译完成后另开终端（与任务 1 步骤 3 同一条命令）
powershell -NoProfile -Command '<同任务 1 的 Get-CimInstance 命令>'
```

预期：spike node 进程 WS_MB 记入 baseline「spike 稳态内存（spo）」，与 webpack 基线对比。

- [ ] **步骤 5：Commit（仅记录文档）**

```bash
rtk git add docs/superpowers/plans/2026-08-31-brain-cli-rspack-baseline.md
rtk git commit -m "docs: spike dev 启动/HMR/内存数据"
```

### 任务 5：qiankun 挂载验证（头号 GO/NO-GO）

**文件：**
- 修改：`scripts/rspack/spike.spo.config.mjs`（如需 umd 降级）

- [ ] **步骤 1：验证产物全局变量导出**

```bash
curl -s http://localhost:8021/app/spo/js/spo.js | head -c 2000
```

预期：文件头部可见 `window["wms-business-platform-web-spo"]` 形态的赋值（`libraryTarget` 生效）。若配置了 `umd` 则为 `window["webpackJsonpScpSpo"]` chunk 全局 + library 挂载。

- [ ] **步骤 2：宿主页挂载验证**

本地 dev 的子应用验证口径（不依赖远程宿主联调）：
① 打开 `http://localhost:8021/app/spo/index.html`，正常渲染（独立运行模式）；
② 走现有宿主联调路径：按项目惯例从 demo18 宿主入口进入，本地代理指向 spike 8021（或在宿主页签内打开 spo 页签），验证 qiankun iframe/tab 内挂载、路由跳转、VTable 列表正常渲染、无 `React #321` 多实例报错。

预期：两条路径均正常。**此任务失败即 NO-GO**（产物形态是迁移的硬前提）。

- [ ] **步骤 3：记录结论**

baseline 文档追加「spike 结论」节：libraryTarget 实测值、挂载结果、遗留问题。

- [ ] **步骤 4：Commit**

```bash
rtk git add docs/superpowers/plans/2026-08-31-brain-cli-rspack-baseline.md scripts/rspack/
rtk git commit -m "docs: qiankun 挂载验证结论"
```

### 任务 6：产物语法扫描（兼容性验证）

**文件：**
- 创建：`scripts/rspack/check-output-syntax.js`

- [ ] **步骤 1：编写扫描脚本（完整代码）**

```js
/**
 * 产物语法级别扫描：用 acorn 按指定 ecmaVersion 解析所有产物 chunk。
 * 用法：node scripts/rspack/check-output-syntax.js <产物目录> <ecmaVersion>
 * 例：node scripts/rspack/check-output-syntax.js dist 5
 * 退出码：0=全部通过，1=存在超纲语法（打印文件与语句位置）
 */
const fs = require('fs')
const path = require('path')
const acorn = require('acorn')

const dir = process.argv[2]
const ecmaVersion = parseInt(process.argv[3] || '5', 10)
if (!dir || !fs.existsSync(dir)) {
    console.error('用法: node check-output-syntax.js <产物目录> <ecmaVersion>')
    process.exit(2)
}

function walkFiles(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
        const full = path.join(dir, d.name)
        return d.isDirectory() ? walkFiles(full) : /\.js$/.test(d.name) ? [full] : []
    })
}

const failures = []
const files = walkFiles(dir)
for (const file of files) {
    const code = fs.readFileSync(file, 'utf8')
    try {
        acorn.parse(code, { ecmaVersion })
    } catch (e) {
        failures.push({ file: path.relative(process.cwd(), file), error: e.message })
    }
}
console.log(`扫描 ${files.length} 个 JS 产物，ecmaVersion=${ecmaVersion}`)
if (failures.length) {
    console.log(`\n超纲语法 ${failures.length} 个文件（前 20 个）：`)
    failures.slice(0, 20).forEach((f) => console.log(`  - ${f.file}: ${f.error}`))
    process.exit(1)
}
console.log('全部通过')
```

- [ ] **步骤 2：扫描 webpack 现状产物（基线）**

```bash
yarn build:spo && node scripts/rspack/check-output-syntax.js dist 5
```

预期：退出码 1，报出 ES2015 语法（webpack 5 runtime 所致）——**这就是"现状基线"的证据**，记录报错文件数到 baseline「现状产物语法级别」。

- [ ] **步骤 3：扫描 Rspack spike 产物**

```bash
node scripts/rspack/spike-dev.mjs   # 或产出 dist 的 spike build，产物目录传入扫描
node scripts/rspack/check-output-syntax.js <spike产物目录> 5
```

预期：报错文件集合与步骤 2 同量级（业务代码同走 babel ES5，差异仅打包器 runtime）。

- [ ] **步骤 4：Commit**

```bash
rtk git add scripts/rspack/check-output-syntax.js docs/superpowers/plans/2026-08-31-brain-cli-rspack-baseline.md
rtk git commit -m "feat: 产物语法扫描工具与新旧引擎对比"
```

### 任务 7：Spritesmith 验证 + spike GO/NO-GO 决策

- [ ] **步骤 1：验证 Spritesmith 前提（已在摸底时确认为空目录，此处做运行时确认）**

```bash
find src -type d -name icons -path "*assets/images*" | xargs -I{} sh -c 'echo "{}: $(ls {} | wc -l) 个文件"'
```

预期：全部为 0 个文件（与摸底一致）→ webpack-spritesmith 当前为空转，Rspack 内核下**不迁移**，仅在 brain-cli v3 的 rspack 分支跳过该插件。

- [ ] **步骤 2：GO/NO-GO 决策**

baseline 文档「spike 结论」节给出明确判定：

| 检查项 | 通过标准 |
|--------|---------|
| spo 单模块 dev 编译成功 | 无编译错误 |
| qiankun 挂载 | 独立运行 + 宿主页签两种路径均正常，无 React #321 |
| HMR | 毫秒~1 秒级 |
| 稳态内存 | 低于 webpack 基线的 60% |
| 语法级别 | 与 webpack 现状同档（差异仅 runtime） |

五项全过 → GO 进阶段 2；任一硬性失败（挂载/语法）→ 记录原因，终止迁移，止血方案（dev:spo 三件套）继续用。

- [ ] **步骤 3：Commit**

```bash
rtk git add docs/superpowers/plans/2026-08-31-brain-cli-rspack-baseline.md
rtk git commit -m "docs: P0 spike GO/NO-GO 决策记录"
```

---

## 阶段 2：brain-cli v3 双内核——dev 链路（1 周）

> fork 本地化：`tools/brain-cli` 从 `node_modules/brain-cli` 拷贝后改造。fork 时保留 webpack 原路径不动，所有 Rspack 逻辑走新分支文件，保证 `--engine=webpack` 行为与 2.0.0-alpha.3 完全一致（兜底）。

### 任务 8：fork brain-cli 到 tools/brain-cli

**文件：**
- 创建：`tools/brain-cli/**`（从 node_modules/brain-cli 拷贝）

- [ ] **步骤 1：拷贝**

```bash
mkdir -p tools
cp -r node_modules/brain-cli tools/brain-cli
rm -rf tools/brain-cli/node_modules tools/brain-cli/test
```

- [ ] **步骤 2：改造 package.json**

修改 `tools/brain-cli/package.json`：`version` 改为 `3.0.0-alpha.1`；`dependencies` 增加 `"@rspack/core": "^1.x"`（与任务 2 安装版本一致）、`"@rspack/dev-server": "^1.x"`；移除 `devDependencies`（fork 后由宿主项目提供）。

- [ ] **步骤 3：项目接入**

修改项目 `package.json`：

```json
"brain-cli": "file:./tools/brain-cli"
```

然后：

```bash
yarn install --ignore-engines
```

预期：`npm ls brain-cli` 显示 `brain-cli@3.0.0-alpha.1`，指向 tools/brain-cli。

- [ ] **步骤 4：回归验证 webpack 内核未被破坏**

```bash
yarn dev:spo
```

预期：与 fork 前行为一致（编译成功、8020 端口可访问）。

- [ ] **步骤 5：Commit**

```bash
rtk git add tools/brain-cli package.json yarn.lock
rtk git commit -m "chore: fork brain-cli 2.0.0-alpha.3 到 tools/brain-cli（v3.0.0-alpha.1）"
```

### 任务 9：EConfig 与 CLI 支持 --engine

**文件：**
- 修改：`tools/brain-cli/libs/settings/EConfig.js`
- 修改：`tools/brain-cli/libs/program/command.js`

- [ ] **步骤 1：EConfig 增加 engine 字段**

`EConfig.js` 的 `init()` 方法（当前第 56-63 行）末尾增加：

```js
this.engine = (finalConfig && finalConfig.engine) || process.env.BRAIN_ENGINE || 'webpack';
```

- [ ] **步骤 2：command.js 读取 --engine 参数**

`command.js` 的 `setApps` 方法（当前第 63-71 行）之后新增方法：

```js
setEngine(options) {
    process.env.BRAIN_ENGINE = (options && options['engine']) || 'webpack';
}
```

`dev()` 的 action（当前第 78-85 行）与 `build()` 的 action（当前第 122-133 行）中，`this.setApps(options);` 之后各加一行：

```js
this.setEngine(options);
```

`dev()` 与 `build()` 的 `.option(...)` 链上各加：

```js
.option('--engine [value]', 'webpack | rspack, bundler engine (default: webpack)')
```

- [ ] **步骤 3：验证参数生效**

```bash
yarn dev:spo   # 不带 --engine，默认 webpack
# 停止后
yarn dev:spo --engine=rspack
```

预期：两条命令均能进入编译流程（rspack 尚未接线，此阶段 --engine=rspack 允许 fallback 回 webpack 实现，任务 11 接线后走真 Rspack）。在 `EConfig.js` init 后临时加 `console.log('engine =', this.engine)` 验证输出后删除。

- [ ] **步骤 4：Commit**

```bash
rtk git add tools/brain-cli
rtk git commit -m "feat: brain-cli v3 支持 --engine 参数与 EConfig.engine 字段"
```

### 任务 10：cfg/rspack/base.js 配置生成器

**文件：**
- 创建：`tools/brain-cli/cfg/rspack/base.js`

- [ ] **步骤 1：编写配置生成器（完整代码）**

```js
/**
 * Rspack 配置生成器——字段语义对齐 webpack 版 cfg/base.js
 * 死代码不迁移：dll 链路（vendors=[]）、SpritesmithPlugin（icons 目录全空）
 */
const path = require("path");
const webpack = require("webpack");
const EConfig_1 = require("../libs/settings/EConfig");
const constants_1 = require("../libs/constants/constants");
const htmlWebpackPlugin_1 = require("../libs/webpack/plugins/htmlWebpackPlugin");
const env_1 = require("../libs/utils/env");
const getEntries_1 = require("../libs/webpack/entries/getEntries");
const javaScriptLoader_1 = require("../libs/webpack/javaScriptLoader");
const nodeModulesPath = path.resolve(process.cwd(), 'node_modules');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const entryList = (0, getEntries_1.getApps)();

function getRspackConfig({ name, defaultPort, publicPath, apps, babel, webpack: webpackConfig, htmlWebpackPlugin, }) {
    const __DEV__ = (0, env_1.isDev)();
    publicPath += name + '/';
    const { disableReactHotLoader, plugins, output } = webpackConfig;
    const library = {};
    if (output && typeof output === 'object' && !Array.isArray(output)) {
        ['library', 'libraryTarget'].forEach((item) => {
            if (typeof output[item] === 'string') library[item] = output[item];
        });
    }
    function getEntries() {
        return entryList().reduce((prev, app) => {
            prev[app] = path.resolve(process.cwd(), `./src/${app}/index`);
            return prev;
        }, {});
    }
    const config = {
        entry: getEntries(),
        mode: __DEV__ ? 'development' : 'production',
        devtool: __DEV__ && 'cheap-module-source-map',
        // Rspack 持久缓存（以安装版本 d.ts 为准；验证标准=任务 12 二次启动明显变快）
        experiments: { cache: true },
        output: Object.assign(Object.assign({}, library), {
            chunkLoadingGlobal: process.env.webpackJsonp || 'webpackJsonpName',
            path: path.join(process.cwd(), constants_1.DIST),
            filename: __DEV__ ? `[name]/js/[name].js` : `[name]/js/[name].[chunkhash:5].bundle.js`,
            chunkFilename: 'common/js/[name].[chunkhash:5].bundle.js',
            publicPath: __DEV__ ? publicPath : process.env.cdnRelease || '../',
            hashFunction: 'xxhash64',
        }),
        resolve: {
            alias: Object.assign({
                'legions-nprogress': path.resolve(nodeModulesPath, 'legions-nprogress/dist/legions-nprogress.esm.js'),
                'legions-utils-tool': path.resolve(nodeModulesPath, 'legions-utils-tool/dist/legions-utils-tool.esm.js'),
            }, (webpackConfig.resolve && webpackConfig.resolve.alias) || {}),
            extensions: ['.web.js', '.js', '.json', '.ts', '.tsx', '.jsx'],
            modules: ['src', 'node_modules', path.join(process.cwd(), `src`), path.join(process.cwd(), `node_modules`)],
        },
        module: { rules: [
            ...(0, javaScriptLoader_1.getTsLoadersed)(),
            ...(0, javaScriptLoader_1.getJSXLoadersed)(),
        ] },
        optimization: __DEV__ ? {} : { splitChunks: { cacheGroups: { common: {
            test: /[\\/]node_modules[\\/]/, name: 'common', chunks: 'initial', priority: 6,
        } } } },
        plugins: [
            ...(0, htmlWebpackPlugin_1.default)(null, entryList()),
            ...plugins,
            new webpack.DefinePlugin({
                'process.env.environment': '"' + process.env.environment + '"',
                'process.env.apps': '"' + process.env.apps + '"',
                'process.env.webpackJsonp': '"' + process.env.webpackJsonp + '"',
                'process.env.cdnRelease': '"' + process.env.cdnRelease + '"',
                'process.env.LOCAL_OLD_URL': JSON.stringify(process.env.LOCAL_OLD_URL || ''),
                'process.env.LOCAL_NEXT_URL': JSON.stringify(process.env.LOCAL_NEXT_URL || ''),
            }),
        ],
    };
    return config;
}
module.exports = function (eConfig) {
    return getRspackConfig(eConfig);
};
```

> css 链（less/css/postcss/antd style）与 asset 资源规则在 Rspack 侧**优先尝试零配置内置**（`experiments.css` 体系）；若编译报 less/样式相关错，则回退为显式 loader 链——将 webpack 版 `getCssLoaders` 的产物直接搬到 `module.rules`（spike 配置任务 3 已有可拷贝的完整链）。二选一，以编译通过 + antd 2 样式正常为准。

- [ ] **步骤 2：Commit**

```bash
rtk git add tools/brain-cli/cfg/rspack/base.js
rtk git commit -m "feat: brain-cli v3 Rspack 配置生成器（cfg/rspack/base.js）"
```

### 任务 11：rspackCompiler 与 devServer 接线

**文件：**
- 创建：`tools/brain-cli/libs/webpack/rspackCompiler.js`
- 修改：`tools/brain-cli/libs/webpack/webpackDevServer.js`

- [ ] **步骤 1：编写 rspackCompiler（完整代码）**

```js
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../../cfg/rspack/base", "../settings/EConfig", "../utils/logs", "../utils/format", "../constants/constants"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const rspack_base_1 = require("../../cfg/rspack/base");
    const EConfig_1 = require("../settings/EConfig");
    const logs_1 = require("../utils/logs");
    const format_1 = require("../utils/format");
    const constants_1 = require("../constants/constants");
    const { rspack } = require('@rspack/core');
    function rspackCompiler() {
        const config = (0, rspack_base_1.default)(EConfig_1.default.getInstance());
        const compiler = rspack(config);
        const { name: projectName, apps, defaultPort, devServer: { https }, server } = EConfig_1.default.getInstance();
        const projectUrl = `${constants_1.URL_PREFIX}/${projectName}/${apps.length ? apps[0] : ''}`;
        let bundleStartTime;
        compiler.hooks.compile.tap('brain-cli', () => {
            (0, logs_1.log)('[rspack] 打包中...');
            bundleStartTime = Date.now();
        });
        compiler.hooks.done.tap('brain-cli', () => {
            const timeSpent = Date.now() - bundleStartTime;
            (0, logs_1.log)(`[rspack] 打包完成, 耗时 ${(0, format_1.asSeconds)(timeSpent)} s. ${new Date()}`);
            (0, logs_1.logAppRunning)({ port: defaultPort, projectUrl, https, server });
        });
        return compiler;
    }
    exports.default = rspackCompiler;
});
```

- [ ] **步骤 2：webpackDevServer 按引擎分发**

先 Read `tools/brain-cli/libs/webpack/webpackDevServer.js`（50 行）对齐现有行为，然后在 `server.js` 调用它的地方改为按 `EConfig.getInstance().engine` 分发：

```js
const engine = EConfig_1.default.getInstance().engine;
if (engine === 'rspack') {
    const { RspackDevServer } = require('@rspack/dev-server');
    const compiler = require('./libs/webpack/rspackCompiler').default();
    const server = new RspackDevServer(config.devServer, compiler);
    yield server.startCallback();
}
else {
    yield (0, webpackDevServer_1.default)();
}
```

（`server.js` 已是 async 函数，直接按上述结构替换 `yield (0, webpackDevServer_1.default)();` 一行；`config` 取自 rspackCompiler 返回值对应的 devServer 段——将 `rspackCompiler` 改为返回 `{ compiler, config }`，此处的 `config.devServer` 即任务 12 中 dev.js 组装的 devServer。）

- [ ] **步骤 3：编写 cfg/rspack/dev.js**

```js
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const base_1 = require("./base");
    function getDevConfig(eConfig) {
        const config = base_1.default(eConfig);
        const { devServer: eDevServer, apps, defaultPort, publicPath } = eConfig;
        // Rspack 分支不挂 AddAssetHtmlPlugin/DllReferencePlugin（dll 已停用）
        config.devServer = {
            port: defaultPort,
            hot: true,
            headers: { 'Access-Control-Allow-Origin': '*' },
            historyApiFallback: {
                rewrites: apps.map((app) => ({
                    from: new RegExp(`^${publicPath}${app}`),
                    to: `${publicPath}/${app}/index.html`,
                })),
            },
            devMiddleware: { publicPath, stats: 'errors-only' },
            static: { directory: path.resolve(process.cwd(), 'static') },
            proxy: eDevServer.proxy,
            client: { overlay: { errors: true, warnings: false, runtimeErrors: false } },
        };
        return config;
    }
    exports.default = getDevConfig;
});
```

（文件头补 `const path = require("path");`；`historyApiFallback` 的 from 正则以 webpack 版 `constants_1.HISTORY_REWRITE_FALL_BACK_REGEX_FUNC` 的行为为准——执行时 Read `tools/brain-cli/libs/constants/constants.js` 对齐后直接复用它。）

- [ ] **步骤 4：验证 --engine=rspack 全链路启动**

```bash
yarn dev:spo --engine=rspack
```

预期：终端出现 `[rspack] 打包完成`，`http://localhost:8020/app/spo` 可访问，页面渲染正常。

- [ ] **步骤 5：验证 webpack 兜底未破坏**

```bash
yarn dev:spo
```

预期：行为与任务 8 步骤 4 一致（旧内核零回归）。

- [ ] **步骤 6：Commit**

```bash
rtk git add tools/brain-cli
rtk git commit -m "feat: brain-cli v3 Rspack dev 链路（compiler/devServer/dev.js）"
```

### 任务 12：dev 链路全模块验证

- [ ] **步骤 1：逐模块 dev 验证**

```bash
for app in admin basics spo wms system demo; do echo "=== $app ==="; yarn dev --apps=$app --engine=rspack; done
```

（每模块启动后浏览器验证页面渲染，Ctrl+C 后测下一个。）

- [ ] **步骤 2：全量 6 app dev 验证 + 内存对比**

```bash
time yarn dev --engine=rspack
# 编译完成后采集内存（任务 1 步骤 3 同款命令），回填 baseline「rspack dev 稳态内存（全量）」
```

预期：全量 6 app 编译成功；内存显著低于 3GB 基线。

- [ ] **步骤 3：Commit**

```bash
rtk git add docs/superpowers/plans/2026-08-31-brain-cli-rspack-baseline.md
rtk git commit -m "docs: rspack dev 链路全模块验证数据"
```

---

## 阶段 3：build 链路（1 周）

### 任务 13：cfg/rspack/dist.js + LegionExtract 适配

**文件：**
- 创建：`tools/brain-cli/cfg/rspack/dist.js`
- 修改：`tools/brain-cli/libs/webpack/plugins/LegionExtractStaticFilePlugin.js`（如需适配）

- [ ] **步骤 1：编写 dist 配置（在 dev.js 基础上覆盖 build 差异）**

创建 `cfg/rspack/dist.js`：

```js
(function (factory) { /* UMD 头同 dev.js */ })(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const path = require("path");
    const base_1 = require("./base");
    const LegionExtractStaticFilePlugin_1 = require("../libs/webpack/plugins/LegionExtractStaticFilePlugin");
    const CopyWebpackPlugin = require('copy-webpack-plugin');
    function getDistConfig(eConfig) {
        const config = base_1.default(eConfig);
        config.devtool = false;
        config.mode = 'production';
        // Rspack 内置 SwcJsMinifierRspackPlugin（mode=production 自动启用）；
        // 对齐 webpack 版行为（drop_console/drop_debugger）：
        config.optimization.minimizer = [
            new (require('@rspack/core').SwcJsMinimizerRspackPlugin)({
                minimizerOptions: { compress: { drop_console: true, drop_debugger: true } },
            }),
        ];
        // CSS 提取：优先 Rspack 内置 experiments.css 生产模式自动提取；
        // 若与 html-webpack-plugin 引用不兼容，回退 mini-css-extract-plugin（loader 链同步回退）
        config.plugins.push(new LegionExtractStaticFilePlugin_1.default());
        config.plugins.push(new CopyWebpackPlugin({
            patterns: [{ from: path.join(process.cwd(), 'static'), to: 'common', globOptions: { ignore: ['.*'] } }],
        }));
        return config;
    }
    exports.default = getDistConfig;
});
```

- [ ] **步骤 2：LegionExtractStaticFilePlugin 兼容验证**

```bash
yarn build:spo --engine=rspack
```

预期：编译成功，`dist/spo/js/` 下产物按 chunk 目录重定位（plugin 的 processAssets 逻辑生效）。若 plugin 报错，因其仅用 `compilation.hooks.processAssets` + `compilation.assets`/`compilation.chunks`/`module.getChunks()`（Rspack 兼容的 hook 面），排查点只在 `module.assets` 属性是否存在——实测后按需把 `module.assets` 判断改为 Rspack 等价 API，改动收敛在这 30 行内。

- [ ] **步骤 3：Commit**

```bash
rtk git add tools/brain-cli
rtk git commit -m "feat: brain-cli v3 Rspack build 链路（dist.js + 压缩/Copy/LegionExtract）"
```

### 任务 14：产物 diff 工具

**文件：**
- 创建：`scripts/rspack/diff-build-output.js`

- [ ] **步骤 1：编写 diff 工具（完整代码）**

```js
/**
 * 新旧引擎 build 产物 diff：对比两次产物的文件清单/大小/HTML script 引用。
 * 用法：
 *   yarn build:spo                 → mv dist dist-wp
 *   yarn build:spo --engine=rspack → mv dist dist-rs
 *   node scripts/rspack/diff-build-output.js dist-wp dist-rs
 * 退出码 0=等价，1=有差异
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

// 文件名含 chunkhash，逐文件严格比对无意义；按「目录/层级的 chunk 角色集合」比较：
// ① 顶层目录集合一致 ② 各目录 JS 文件数量一致（±10% 容忍 hash 命名差异）
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
// HTML 引用的 chunk 数量对齐
for (const html of new Set([...Object.keys(wpScripts), ...Object.keys(rsScripts)])) {
    const w = (wpScripts[html] || []).length, r = (rsScripts[html] || []).length;
    if (w !== r) { console.log(`✗ ${html}: 引用 JS 数 ${w} vs ${r}`); fail = true; }
}
console.log(fail ? '\n有差异，需人工核对' : '\n产物结构等价');
process.exit(fail ? 1 : 0);
```

- [ ] **步骤 2：Commit**

```bash
rtk git add scripts/rspack/diff-build-output.js
rtk git commit -m "feat: 新旧引擎 build 产物 diff 工具"
```

### 任务 15：build 产物 diff 验证

- [ ] **步骤 1：生成两份产物并 diff**

```bash
yarn build:spo && mv dist dist-wp
yarn build:spo --engine=rspack && mv dist dist-rs
node scripts/rspack/diff-build-output.js dist-wp dist-rs
```

预期：顶层目录集合一致、各目录文件数差异 ≤10%、HTML 引用数一致 → 退出码 0。有差异时逐项人工核对（优先核对 common chunk 与 html 引用清单）。

- [ ] **步骤 2：build 耗时与内存记录**

```bash
time yarn build:spo --engine=rspack
```

回填 baseline「rspack production build（spo）」。

- [ ] **步骤 3：Commit**

```bash
rtk git add docs/superpowers/plans/2026-08-31-brain-cli-rspack-baseline.md
rtk git commit -m "docs: build 产物 diff 与耗时数据"
```

---

## 阶段 4：回归矩阵（3-5 天）

### 任务 16：单测与 E2E 全量回归

- [ ] **步骤 1：单测基线比对**

```bash
npm run test:unit 2>&1 | tail -5
```

预期：失败数与摸底基线一致（177 失败均为存量，不得新增失败）。

- [ ] **步骤 2：传统 E2E 回归**

```bash
npm run test:e2e:traditional
```

预期：与 master 基线一致（含登录/仓库列表/客户管理等 iframe 微前端场景——这正是 qiankun 挂载的真实验证）。

- [ ] **步骤 3：Commit**

```bash
rtk git add -A && rtk git commit -m "test: Rspack 内核回归验证通过" --allow-empty
```

### 任务 17：收益对比报告

- [ ] **步骤 1：汇总 baseline 前后数据**

将 baseline 文档中四组指标（冷启动/HMR/内存/build）整理为「webpack 基线 vs rspack」对照表，计算提升倍数。

- [ ] **步骤 2：Commit**

```bash
rtk git add docs/superpowers/plans/2026-08-31-brain-cli-rspack-baseline.md
rtk git commit -m "docs: Rspack 迁移收益对比报告"
```

---

## 阶段 5：切换与收尾（观察期）

### 任务 18：dev 默认引擎切换

- [ ] **步骤 1：package.json dev scripts 默认走 rspack**

```json
"dev": "npm run install:qiankun && brain-cli dev --engine=rspack",
"dev:spo": "npm run install:qiankun && cross-env NODE_ENV=development && cross-env webpackJsonp=webpackJsonpScpSpo brain-cli dev --apps=spo --engine=rspack",
```

（其余 dev:xxx 同步加；`dev:local` 一并加。）webpack 兜底：任何命令追加 `--engine=webpack` 即回旧内核。

- [ ] **步骤 2：验证 + Commit**

```bash
yarn dev:spo   # 不带 --engine，默认走 rspack
rtk git add package.json
rtk git commit -m "feat: dev 默认引擎切换为 Rspack（--engine=webpack 兜底）"
```

### 任务 19：build 默认切换 + 环境/CI 清单

- [ ] **步骤 1：build scripts 默认加 --engine=rspack**（全部 build:xxx 与 build:xxx:uat/prod 同步）
- [ ] **步骤 2：CI/同事环境清单写入 baseline 文档**：
  - Node 版本下限核对（Rspack native 二进制要求；当前 v24.16.0 满足，团队其他环境/CI 需核对）
  - Rspack native 二进制对离线环境/私有源的可达性（npmmirror binary 镜像）
  - `.webpack_cache`（webpack）与 Rspack 缓存目录隔离，避免混用
- [ ] **步骤 3：验证 + Commit**

```bash
yarn build:spo   # 默认走 rspack
rtk git add package.json docs/superpowers/plans/2026-08-31-brain-cli-rspack-baseline.md
rtk git commit -m "feat: build 默认引擎切换为 Rspack，沉淀环境核对清单"
```

### 任务 20：观察期后清理

- [ ] **步骤 1：观察 1-2 个迭代后，移除 brain-cli 内 webpack 死代码**：cfg/dll.js、dllPlugins.js、webpackDllCompiler.js、happy-pack-conf.js、cfg/base.js 中 Spritesmith 逻辑；同步从 dependencies 移除 webpack-spritesmith、add-asset-html-webpack-plugin
- [ ] **步骤 2：--engine=webpack 兜底路径保留一个版本期后下线**（或长期保留，团队决策）
- [ ] **步骤 3：更新 CLAUDE.md 变更记录 + Commit**

```bash
rtk git add -A
rtk git commit -m "chore: brain-cli v3 移除 webpack 死代码（dll/Spritesmith/happyPack）"
```

---

## 风险与回退

| 风险 | 触发点 | 应对 |
|------|-------|------|
| `libraryTarget: 'window'` 在 Rspack 下异常 | 任务 4/5 | 降级 `umd` 重验 qiankun 挂载；qiankun 对 umd 兼容良好 |
| ts-plugin-legions transformer 行为差异 | 任务 4 步骤 1 | ts-loader 9.5.7 纯 JS loader，getCustomTransformers 与打包器无关；失败则比对 uniqueUid 注入产物 diff 定位 |
| experiments.css 与 antd 2 less 按需加载不兼容 | 任务 10/11 | 回退显式 loader 链（spike 配置已有完整可拷贝版本） |
| LegionExtractStaticFilePlugin hook 兼容 | 任务 13 | 改动收敛在 30 行 processAssets 逻辑内 |
| Rspack 持久缓存字段名随版本变化 | 任务 10 | 以安装版本的 `@rspack/core` d.ts 为准，验证标准=二次启动变快 |
| 团队/CI Node 版本低于 Rspack 要求 | 任务 19 | 环境清单先行核对，native 二进制走 npmmirror binary 镜像 |

**总回退方案：** 任何阶段失败，`--engine=webpack`（或不传参数）即回旧行为；dev 日常止血方案（`yarn dev:spo` + `disableReactHotLoader: true` + patch devtool→eval sourcemap）与本迁移不冲突，可先行落地。

---

## 自检记录

- **规格覆盖度：** 内存痛点（任务 1/4/12/17 量化）、qiankun 兜住（任务 5/16）、babel+transformer 链保留（任务 3/10）、dll/Spritesmith 死代码结论（任务 7/20）、浏览器兼容（任务 6 语法扫描）、build 链路（任务 13-15）、测试基建复用（任务 16）、环境风险（任务 19）——均有对应任务
- **占位符扫描：** 无"待定/TODO"；开放变量（Rspack 缓存字段名、css 内置 vs loader 链）均配了明确验证命令与判定标准，非占位符
- **类型/名称一致性：** `--engine` 参数 ↔ `process.env.BRAIN_ENGINE` ↔ `EConfig.engine` 三处一致；`rspackCompiler` 返回值在任务 11 内自洽；`cfg/rspack/{base,dev,dist}` 命名对齐 webpack 版 `cfg/{base,dev,dist}`
