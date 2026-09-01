# brain-cli Rspack 迁移基线与验收数据（wms-aps-web · 2026-09-01）

> 执行依据：brain-cli 仓库 `docs/superpowers/plans/2026-09-01-brain-cli-v3-rspack-engine.md` 任务 13-15。
> 环境响应：Node v24.16.0 / brain-cli 3.0.0-alpha.9（tgz 联调）/ @rspack/core 2.2.1 / webpack 5.106.2（兜底）。

## 一、性能基线（spo 模块实测）

| 指标 | webpack 5.106.2 | rspack 2.2.1 | 收益 |
|---|---|---|---|
| dev 冷编译（spo 单模块） | 37.3s | **17.5~18.7s** | ~2 倍 |
| dev 编译期内存峰值 | 1912MB | **944MB** | 减半 |
| 生产构建（build:spo） | 73.1s（总 80.6s） | **17.3s（总 21.2s）** | **4.2 倍** |
| HMR 增量（brain-cli demo 实测） | — | 0.03~0.35s | 毫秒级 |
| 持久缓存热启动（demo 实测） | — | 0.234s（冷 1.462s 的 1/6） | newCache→persistent 修复后 |

> 全量 6 app 的稳态内存对比（原痛点 ~3GB）待团队日常使用中采集；单模块已证明减半趋势。

## 二、build 验收矩阵结果（任务 15 第 10-14 项）

| # | 检查项 | 结果 | 证据 |
|---|---|---|---|
| 10 | 产物结构 diff | ✅ 等价 | 顶层目录 common+spo 一致；common 7=7、spo 3=3（diff 工具退出码 0） |
| 11 | drop_console | ✅ 等价 | 两引擎产物仅存日志库特性检测代码中的 `console.log` 字样（逐字节对齐）；业务调试输出均已移除 |
| 12 | CSS 提取与压缩 / --cdn | ✅ 等价 | 双引擎均有 `spo/styles/*.bundle.css` + `common/styles/*.bundle.css`；HTML 均引 `https://demo18-scm.hoolinks.com/static/...` |
| 13 | LegionExtract / FixHtmlAssetsPathPlugin | ✅ 等价 | 静态资源落 chunk 目录；FixHtml 两引擎同为 no-op（HTML 无待修复路径模式），部署冒烟时再实战核验 |
| 14 | 产物语法扫描（acorn ES5） | ✅ 同档 | 两引擎超纲文件一一对应（common/dexie/spo，均为打包器 runtime ES2015，业务代码同走 babel ES5） |
| — | uniqueUid transformer | ✅ 等价 | 双引擎 spo 产物各 1 处注入，数量一致 |
| — | 编译错误 | ✅ 0 | 568→4→0 攻坚后 |

## 三、dev 验收矩阵状态（任务 14 第 1-9 项）

| # | 检查项 | 状态 |
|---|---|---|
| 1 | 6 app 逐个 dev 编译 | ⏳ spo 已过（0 错误）；其余 5 app 待逐个验证 |
| 2 | 全量 dev + 内存基线 | ⏳ 待采集 |
| 3 | HMR 手感 | ✅ demo 实证毫秒级；wms 人工手感待确认 |
| 4 | antd 2 样式 | ⏳ 待人工核对（需登录态） |
| 5 | CSS Modules | ✅ 编译级等价；渲染待人工 |
| 6 | ts-plugin-legions | ✅ 产物级 1=1 注入 |
| 7 | 代理 + WebSocket | ⏳ 待人工（消息中心） |
| 8 | qiankun 双路径 | ⏳ 待人工（demo18 宿主页签） |
| 9 | 静态资源引用 | ✅ 产物级等价 |

## 四、发布与升级记录（任务 16 · 2026-09-01）

- **已发布**：`brain-cli@3.0.0-alpha.9` → 私有源 `http://npm.hoolinks.cn/`（dist-tag: alpha，`latest` 仍为 2.0.0-alpha.3 不影响其他项目）
- **wms-aps-web 已切换**：`"brain-cli": "3.0.0-alpha.9"`（registry 版本，vendor tgz 已清理）
- **registry 链路验证**：`yarn dev:spo` 0 错误、HTTP 200、编译 **3.28s**（持久缓存热启动；webpack 37.3s → rspack 冷启 17.5s → 热启 3.28s）

### 团队/CI 环境清单

| 项 | 要求 | 说明 |
|---|---|---|
| Node | ≥ 18（@rspack/core 2.x native 二进制） | 团队当前 v24.16.0 已验证；CI 镜像需核对 |
| registry | `http://npm.hoolinks.cn/` | brain-cli 与 @rspack 包均从私有源解析 |
| native 二进制 | `@rspack/binding-win32-x64-msvc` 随依赖自动安装 | 离线环境需确认 npmmirror binary 或私有源代理可达 |
| 缓存目录 | webpack `.webpack_cache` 与 rspack `node_modules/.cache/rspack` 天然隔离 | 无需迁移/清理 |
| 回退 | ① 任何命令加 `--engine=webpack`（秒级）② 依赖回 `2.0.0-alpha.3`（版本级） | 双保险 |

### 剩余观察项（不阻塞发布）

1. 6 app 逐个 dev 编译 + 登录态人工核对（antd/路由/列表/消息中心/qiankun 宿主挂载）
2. `build:spo:uat` 真实部署冒烟、E2E 基线比对、177 存量单测零新增
3. 观察 1-2 个迭代后清理 brain-cli 内 webpack 死代码（dll/Spritesmith/happyPack，webpack 兜底路径保留期团队决策）

