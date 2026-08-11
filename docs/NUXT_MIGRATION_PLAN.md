# Nuxt 4 迁移重建方案

> 状态：已确认方向，待执行
> 日期：2026-08-11
> 决策：渲染层重写 + 编辑器收敛重建；map-editor / card-cell-editor 按新架构重写但优先级最后；CI 用 Gitee Go（兼容 GitHub Actions）；渲染层表现（外观+交互）为最高优先验收金标准

---

## 1. 背景与目标

当前工程为 **Vue 2.7 + Vite 5 + element-ui 2.15** 低代码渲染与编辑独立工程（213 个源文件），nginx 静态托管 + 网关注入运行配置。存在历史包袱：4 套编辑器并存（low-app 桌面/移动 + lowcode 桌面/移动）、2000+ 行大泥球 mixin、Vue2 特有 API 大面积使用（`$set` 56 处、`beforeDestroy` 30 文件、`Vue.extend` 17 处、`Vue.prototype` 33 处）。

**目标**：迁移至最新 Nuxt 技术栈（Nuxt 4 + Vue 3.5 + Vite + Nitro + TypeScript），以**渲染表现为金标准**重建，抛弃历史包袱，产出好维护、易扩展、适合 3-5 人团队协作、具备完整但简单 DevOps 工作流的新工程。

## 2. 原则（约束分级）

| 级别      | 约束                                                    | 说明                                                                                                        |
| --------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 🔒 硬约束 | 低代码渲染页面外观 + 交互功能与旧工程**一模一样**       | 验收金标准，靠 golden 视觉回归机器保障                                                                      |
| 🔒 硬约束 | 页面 JSON schema 兼容                                   | 存量页面数据资产在后端，新工程必须能渲染旧数据（协议版本化，必要时加转换层）                                |
| 🔒 硬约束 | 后端 API 协议兼容                                       | `/config/select/*` 等数据接口契约不变（可在 shared 中重新建模）                                             |
| 🔒 硬约束 | 部署链路兼容                                            | nginx 静态托管、网关注入 `/js/server.js`、`config_dev.js`（window.APP_CONFIG）、二级目录、hash 路由初始保留 |
| 自由      | 实现逻辑、UI 框架、代码结构、状态管理、构建、测试、规范 | 全部按最佳实践重新设计                                                                                      |

## 3. 目标架构：pnpm monorepo + Nuxt 4 宿主

```
lowcode-front/
├── apps/
│   └── web/                       # Nuxt 4 宿主（SPA 模式，Nitro 静态输出）
│       ├── app/                   # Nuxt 4 目录约定：pages/ plugins/ layouts/ app.vue
│       ├── public/                # config_dev.js / favicon（静态复制）
│       └── nuxt.config.ts
├── packages/
│   ├── shared/                    # 协议层：页面 schema 类型、后端契约、常量（纯 TS，零依赖，契约先行）
│   ├── runtime/                   # 渲染核心引擎：schema 解析、组件注册表、数据流、事件、SWR 缓存
│   ├── runtime-ui/                # 渲染层基础组件库：视觉复刻 element-ui（token 驱动）
│   ├── widgets/                   # 业务组件库（24+ 组件）：chart/map/list/card-group/video/chat/nav-menu…
│   └── studio/                    # 低代码编辑器：画布/材料/属性/图层树/历史（element-plus 重建）
├── e2e/                           # Playwright：E2E + golden 视觉回归
├── docs/                          # 架构、规范、ADR、CONTRIBUTING、本方案
├── .gitee/workflows/              # Gitee Go 流水线（GitHub Actions 语法，双平台兼容）
├── .github/workflows/             # GitHub Actions 流水线（同一份，两平台同步）
└── package.json                   # 根编排：lint/test/typecheck/build
```

### 包职责与协作边界

| 包           | 依赖                          | 职责                                      | 多人协作要点                                                              |
| ------------ | ----------------------------- | ----------------------------------------- | ------------------------------------------------------------------------- |
| `shared`     | 无                            | schema 类型、API 契约、常量               | **契约先行**：runtime/studio/widgets 均依赖它，类型即文档，团队可并行开发 |
| `runtime`    | shared                        | 渲染引擎（零 UI 依赖）                    | 纯函数 + 单测，独立版本；引擎改动不影响组件                               |
| `runtime-ui` | shared                        | 基础控件（table/dialog/select/form…）     | 视觉 token 驱动，任何组件不得硬编码颜色/字号                              |
| `widgets`    | shared + runtime + runtime-ui | 业务组件                                  | 新增组件 = 注册表登记 + storybook，不触碰引擎                             |
| `studio`     | 全部                          | 编辑器（消费 runtime 渲染，不碰渲染逻辑） | 只做编辑态包装，事件订阅解耦                                              |
| `apps/web`   | 全部                          | 页面装配、路由、插件、部署                | 最薄的一层                                                                |

### 技术选型

| 维度         | 选型                                         | 说明                                                                                      |
| ------------ | -------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 框架         | Nuxt 4（`ssr: false` SPA 起步）              | 目录约定 `app/`；Node ≥ 20.19（建议 22 LTS，构建机需确认）                                |
| 语言         | TypeScript strict 全量                       | 存量语义迁移过程中类型即文档                                                              |
| 包管理       | pnpm workspace                               | 现状沿用                                                                                  |
| UI（编辑器） | element-plus（按需引入）                     | element-plus 原生 ESM，按需是正收益（不同于 element-ui 时代 CJS 坑）                      |
| UI（渲染层） | 自研 runtime-ui（复刻 element-ui 视觉）      | 见 §5，保证像素级一致的根本手段                                                           |
| 状态         | Pinia                                        | 编辑器状态、主题、登录、聊天                                                              |
| 图表         | echarts 5.x + liquidfill 3.x + wordcloud 2.x | 按需 `echarts/core`                                                                       |
| 图标         | unocss + 离线 icon-store（沿用现有三层架构） | 集合限定、离线部署                                                                        |
| 样式         | SCSS 变量 token + unocss                     | preflight 一致性依赖现有 `theme/scss/preflight.scss` 三层引入顺序，**原样保留并纳入回归** |
| 测试         | Vitest + Playwright + Storybook              | 单测/视觉回归/组件文档                                                                    |
| 路由         | Nuxt 文件路由，`[...slug].vue` 兜底          | 初始保留 hash，二期可切 history                                                           |

## 4. 渲染引擎重设计

旧工程痛点：`lowcode-page-mixin.js` 2000+ 行泥球、`inEdit` 三态耦合编辑器与渲染器、widgets 靠 400 行 v-if 链分派。

新设计：

```
页面 JSON (后端)
  → shared 类型校验（协议版本号）
  → runtime.parsePageConfig（纯函数：*_json 解析 → 规范化组件树 → com_type→loader 映射）
  → 组件注册表调度（动态 import 懒加载）
  → widgets 渲染（数据流 srvReq → 渲染 → 事件）
  → SWR 缓存层（IndexedDB 快照秒开 + 网络后台校验整帧替换，实现重写、缓存加版本号）
```

| 机制      | 旧工程                 | 新设计                                                                |
| --------- | ---------------------- | --------------------------------------------------------------------- |
| 页面解析  | mixin 内 300+ 行       | `shared` 类型 + runtime 纯函数（可单测）                              |
| 组件分派  | v-if 链 400 行         | 注册表：`componentType → (loader, meta)`，缺注册编译报错              |
| 编辑/渲染 | `inEdit` 三态混写      | runtime 只渲染 + 抛编辑事件（onTap/onMove/onResize），studio 订阅包装 |
| 参数映射  | `srvReq` 大函数        | 声明式配置 + 纯函数管道（`${}` 模板、日期关键词、between 区间）       |
| 表达式    | safeEval（近期已收敛） | 沙箱表达式解析器（静态 AST，安全从源头解决）                          |
| 缓存      | IndexedDB SWR          | cache 层独立 + schema 版本号（顺带解决旧缓存结构兼容）                |
| 大 JSON   | `Object.freeze` 优化   | 保留该优化（性能手段，非包袱）                                        |

## 5. 渲染层视觉复刻与 golden 回归（最高优先级）

### 5.1 为什么自研 runtime-ui

element-plus 视觉与 element-ui 差异大（圆角/间距/阴影/字体/表格细节），框架替换必然导致渲染外观漂移，**无法满足"一模一样"**。因此渲染层基础控件（table/dialog/select/form/message/confirm 等约 10-15 个）自研实现：

1. **设计 token 提取**：从旧工程真实渲染截图反推 element-ui 视觉规范（色板、字号、圆角、间距、阴影、表格/弹窗/表单细节），建成 SCSS 变量系统
2. **基础控件实现**：按 token 逐组件复刻；组件行为（合并单元格、表单校验交互、弹窗定位）逐项对照
3. **唯一视觉入口**：任何组件不得绕过 token 硬编码视觉值（lint 规则保障）

### 5.2 golden 视觉回归流水线（"一模一样"的机器验收）

```
黄金用例集（覆盖全部 widgets + 典型组合页面的页面 JSON，从旧工程真实数据导出）
   ├── 基线生成（手动/CI 手动触发）：
   │     旧工程构建为对照容器 → 渲染用例 → 截图 → 固化基线 PNG 入库（更新走 PR 评审）
   └── 每次 CI：
         新工程渲染同一 JSON → Playwright 截图 → pixelmatch 像素对比 → 超阈值即红
```

- 静态快照 + 关键交互基线（hover/弹窗/展开态）双覆盖；动画类动效人工对照清单（golden 覆盖不了的部分）
- 基线更新必须是显式 PR，防止视觉悄悄漂移

## 6. 编辑器收敛重建

旧工程 4 套编辑器（low-app 桌面/移动 + lowcode 桌面/移动）收敛为 **1 套 studio + 响应式画布**（桌面 ↔ 移动设备模拟切换）。

| 编辑器能力 | 旧工程                              | 新 studio                                         |
| ---------- | ----------------------------------- | ------------------------------------------------- |
| 画布       | ui-scaler 缩放 + 拖拽 + 连线        | 重写（缩放/拖拽/参考线/吸附）                     |
| 材料面板   | materials 组件树                    | element-plus 重建，数据源来自 widgets 注册表 meta |
| 属性面板   | columns.js 驱动动态表单             | 沿用"配置驱动"思路重写（声明式表单 schema）       |
| 图层树     | OutlineTree                         | 重建                                              |
| 历史/撤销  | useHistory + snapshot-db(IndexedDB) | 重写（命令模式 + 快照）                           |
| 移动端     | 独立 app-materials 全套             | studio 设备模拟（删掉双套）                       |

编辑器 UI 外观**不要求**与旧工程一致（只要求功能等价），可自由采用 element-plus 现代设计。

## 7. 深业务模块重写（优先级最后）

| 模块                                 | 现状                             | 新架构做法                                                             |
| ------------------------------------ | -------------------------------- | ---------------------------------------------------------------------- |
| map-editor（地图编辑器）             | 地图打点/区域编辑                | 按新架构重写，复用 widgets/map-card 的 useMarkers 等组合式逻辑         |
| card-cell-editor（卡片单元格编辑器） | 单元格/部件/主题编辑             | 按新架构重写（useDragDrop/useHistory/usePartTree 等 composables 平移） |
| 聊天                                 | chat-box/entrance/wssocket       | 功能等价重写                                                           |
| 视频                                 | dahua-video/video-card/hls       | 功能等价重写（dhhls.min.js 等闭源库原样复用）                          |
| 登录/修改密码                        | login-dialog + SSO               | 重建（SSO 协议不变）                                                   |
| 工具页                               | get-page-address / property-form | 重建                                                                   |
| legacy-form                          | 旧工程表单 iframe 包装           | 保留协议（iframe + postMessage 契约）                                  |

## 8. 工程质量与规范体系

| 维度       | 方案                                                                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 语言       | TypeScript strict；schema 类型即协议文档                                                                                                           |
| Lint/格式  | ESLint（Vue3+TS）+ Prettier，全仓 `pnpm lint` 统一；禁止硬编码视觉值的 lint 规则                                                                   |
| 提交       | Conventional Commits + commitlint + husky + lint-staged（提交前自动 lint + 单测）；commit body 按 `文件: 功能说明` 列变更（升级日志原料，见 §9.5） |
| 单测       | Vitest：引擎解析、数据管道、表达式沙箱、widgets 关键逻辑；覆盖率红线（引擎 ≥ 90%）                                                                 |
| 组件文档   | Storybook（runtime-ui + widgets 逐个 story，同时是分工清单）                                                                                       |
| E2E        | Playwright：渲染→编辑→保存→预览→分享核心链路 + golden 回归                                                                                         |
| 协作       | GitHub Flow（main + feature 分支 + PR 评审）；PR/Issue 模板；Changesets 版本                                                                       |
| 文档       | docs/：本方案、ARCHITECTURE、CONTRIBUTING、组件开发指南、ADR 记录                                                                                  |
| 代码所有权 | 每个 package 指定 owner（3-5 人团队按包认领，PR 自动分配 reviewer）                                                                                |

## 9. DevOps 工作流（Gitee Go 为主，兼容 GitHub Actions）

### 9.1 流水线

```
[PR / dev 分支] → CI: install → lint → typecheck → unit → build → golden 视觉回归 → dev 自动部署预览
[main 合并]     → CI 同上 → 产物归档 → CD: 推送 nginx 服务器（保留现有静态托管 + server.js 注入）
[打 tag]        → 生产部署确认（可选人工闸门）
```

### 9.2 平台兼容方案

- 统一用 **GitHub Actions 语法**编写 `.github/workflows/*.yml`（一套流水线）
- **Gitee Go 2.0 原生兼容 GitHub Actions 语法**：在 `.gitee/workflows/` 建立同一份（或 Gitee Go 直接识别），主跑 Gitee Go（仓库主托管在 Gitee，免费原生集成）
- 如未来需要 GitHub 侧跑：`git push` 镜像到 GitHub 仓库即可复用同一份工作流（双平台语法一致，零维护两套）
- 流水线脚本（lint/test/build/golden）抽到 `scripts/` + pnpm 命令，CI 只做编排——**平台无关，换 CI 不重写逻辑**

### 9.3 环境与发布

| 环境     | 触发               | 说明                                       |
| -------- | ------------------ | ------------------------------------------ |
| dev 预览 | PR/合并 dev        | 自动部署，供联调与 golden 对比             |
| prod     | tag（如 `v1.0.0`） | 产物推送 nginx，保留上一版产物 + 一键回切  |
| 双跑期   | 手动               | 新旧工程并跑同一数据源，灰度流量对比（P7） |

### 9.4 运行保障

- 错误上报：Sentry（前端）可选接入；nginx 日志
- 回滚：保留上 N 版产物目录，nginx 软链一键切换
- 健康检查：`/healthz` 静态探针（Nitro 或 nginx 直出）

### 9.5 版本与升级日志（Release Notes）

**目标**：每次升级后能在两个地方看到升级日志——仓库 `docs/CHANGELOG.md`（开发/评审视角）与应用内 `/changelog` 页（用户视角）；日志**自动化生成 + 手动编辑**双通道；内容列出变更文件与对应功能。

**版本策略**

- SemVer（新工程自 `v1.0.0` 起）：`major` = schema/API 不兼容，`minor` = 新功能，`patch` = 修复
- 双轨版本：**平台版本**（应用 tag）与 **schema 协议版本**（`shared` 中 `schemaVersion`，页面数据兼容由它管）解耦——平台升级不影响存量页面
- 一个 tag = 一次发布 = 一段 changelog

**提交规范（日志原料，升级日志的地基）**

- commit body 按 `文件: 功能说明` 逐行列出本提交的变更（§8 已约定 conventional commits，这里强化 body 格式）：

  ```
  feat(widgets): 图表组件升级 echarts 5

  - widgets/chart/chart.vue: 按需引入 echarts/core
  - widgets/chart/buildOption.ts: 重构配置构建
  - widgets/chart/SankeyChart.vue: 升级 sankey 渲染
  ```

- "改了哪些文件、大概对应什么功能"从提交源头就是结构化的，后续所有日志产物都从它派生（lint 规则校验 body 文件路径真实存在）

**自动化生成（git-cliff）**

- **git-cliff** 从 conventional commits 增量生成 changelog：按 tag 分组、按 scope（feat/fix/refactor…）分类、**含每个 commit 的变更文件清单**（`--with-commit-file-changes`）
- 双产物模板：
  - `docs/CHANGELOG.md`：完整版（开发/评审视角）
  - `apps/web/public/changelog.json`：精简版（版本/日期/分类/要点/文件清单，控制体积，应用内展示用）
- `git-cliff --bump` 只处理未发布区间，**人工编辑过的段落不被覆盖**

**手动编辑（发布人）**

- 打 tag 前，发布人编辑 `CHANGELOG.md` 对应版本段落：补充产品化描述、使用说明、截图、已知问题
- 自动生成（机械事实）+ 手动润色（产品叙事）两部分合入同一版本段落；CI 不覆盖已编辑内容

**应用内升级日志页（用户视角）**

- 新增 `/changelog` 页：读取 `changelog.json` 渲染版本列表，按「新功能 / 修复 / 优化 / 破坏性变更」分类展示
- 构建注入 `__APP_VERSION__`（package 版本 + 构建时间 + commit sha），关于弹窗/登录页展示当前版本
- 可选：新版本上线后首次访问弹"本次更新"提示（开关控制，默认关）

**Gitee Releases 同步**

- CI 打 tag 时自动创建 Gitee Release：标题 `vX.Y.Z`，body 取 changelog 该版本节选（自动 + 手动的融合产物）

**闭环流程**

```
开发提交（body 写明 文件: 功能）
  → 合并 main → 打 tag vX.Y.Z
  → CI: git-cliff 增量生成 CHANGELOG.md + changelog.json（自动部分）
  → 发布人编辑润色该版本段并提交（手动部分）
  → 构建部署（产物内嵌版本号）
  → 应用内 /changelog 升级日志页展示 + Gitee Releases 自动发布
```

**落地归属**：P0 落地提交 body 规范 + git-cliff 骨架（F21a）；P4 应用内 `/changelog` 页（F21b）；P7 发布闭环验证。

## 10. 执行路线与里程碑

> 优先级说明：**P1-P3（渲染链路）为最高优先**，map-editor / card-cell-editor（P6）放最后。

| 阶段  | 内容                                                                                 | 里程碑出口                                       | 工作量(3 人) |
| ----- | ------------------------------------------------------------------------------------ | ------------------------------------------------ | ------------ |
| P0    | monorepo 骨架、TS/ESLint/commitlint/CI 骨架、shared 契约类型、git-cliff 升级日志骨架 | `pnpm lint/test/build` 全绿，Gitee Go 流水线跑通 | 1 周         |
| P1    | runtime 引擎 + runtime-ui 基础组件（token 提取）                                     | 引擎纯函数单测 ≥90%；基础组件 Storybook 就绪     | 2-3 周       |
| P2 ⭐ | **24+ widgets 重写 + golden 用例集与基线**（最高优先，可 2-3 人分组件并行）          | 黄金用例渲染像素对比通过                         | 4-6 周       |
| P3    | 数据层：http/拦截器/登录、SWR 缓存、表达式沙箱、多环境配置                           | 真实后端数据渲染通过（新老双跑开始）             | 2 周         |
| P4    | studio 编辑器重建（画布/材料/属性/图层树/历史/设备模拟）                             | 编辑器全功能可用（功能清单核销）                 | 4-6 周       |
| P5    | 收尾业务：聊天/视频/地图组件回归、登录、工具页、legacy-form                          | 功能清单逐项核销                                 | 2-3 周       |
| P6    | map-editor / card-cell-editor 按新架构重写（优先级最后）                             | 两编辑器功能等价                                 | 3-4 周       |
| P7    | 部署切换、golden 全量回归、性能基线复测、线上双跑灰度、切换                          | 双跑对比通过后正式切换                           | 1-2 周       |

**总计约 5-6 个月（3 人）/ 4-5 个月（5 人）**。全程新旧并跑（同一数据源），P3 起即可灰度；**渲染层"一模一样"以 golden 全绿为准**，不切换不罢休。

## 11. 风险与对策

| 风险                                           | 影响 | 对策                                                                   |
| ---------------------------------------------- | ---- | ---------------------------------------------------------------------- |
| 视觉还原细节（动效/滚动/悬浮态）               | 高   | golden 覆盖静态+交互基线；动效列人工对照清单逐项核销                   |
| runtime-ui 复刻工作量（表格合并/表单校验细节） | 高   | 独立优先级最高的 P1 子任务；先做高曝光组件（table/dialog/form）        |
| 存量页面 schema 兼容                           | 高   | 协议版本号 + 转换层；用真实线上页面 JSON 建回归用例                    |
| element-plus 仅用于编辑器，避免渲染层引入      | 中   | lint 规则：packages/runtime、runtime-ui、widgets 禁止依赖 element-plus |
| 性能基线（首屏 gzip 500kB / 1.38s）            | 中   | widgets 动态 import 懒加载；P7 复测，目标不低于现基线                  |
| SWR 缓存结构兼容                               | 中   | 缓存加 schema 版本号，旧缓存自动失效重建                               |
| 双跑期数据一致（同一后端）                     | 低   | 读写分离天然无冲突；灰度流量观察                                       |
| Node 版本（Nuxt 4 要求 ≥20.19）                | 低   | 构建机/CI 统一 22 LTS，文档明示                                        |

## 12. 附录

### 12.1 功能清单核销表（验收基线）

| 编号 | 功能                                                                      | 旧入口                               | 阶段        | 状态 |
| ---- | ------------------------------------------------------------------------- | ------------------------------------ | ----------- | ---- |
| F01  | 低代码页面渲染（短路径）                                                  | `/:pageNo`                           | P2          | ⬜   |
| F02  | 官网渲染（含锚点）                                                        | `/site/:pageNo(/:anchorName)`        | P2          | ⬜   |
| F03  | 移动端页面渲染                                                            | 渲染链路同源                         | P2          | ⬜   |
| F04  | 数据查询/参数映射/SWR 秒开                                                | 引擎                                 | P3          | ⬜   |
| F05  | 表达式/事件（safeEval → 沙箱）                                            | 引擎                                 | P3          | ⬜   |
| F06  | 页面编辑器（桌面）                                                        | `/lowcode/editor/:pageNo`            | P4          | ⬜   |
| F07  | 移动端编辑/预览                                                           | `/app/edit` `/app/preview`           | P4          | ⬜   |
| F08  | 卡片单元格编辑器                                                          | `/card-cell-editor/:cardNo`          | P6          | ⬜   |
| F09  | 地图编辑器                                                                | `/map-editor/:mapNo`                 | P6          | ⬜   |
| F10  | 登录/SSO/修改密码                                                         | login-dialog                         | P5          | ⬜   |
| F11  | 聊天                                                                      | chat-box/entrance                    | P5          | ⬜   |
| F12  | 视频（大华/通用/hls）                                                     | dahua-video/video-card               | P5          | ⬜   |
| F13  | 地图组件（BMap/TMap/建筑树/多源标记）                                     | map-card                             | P2          | ⬜   |
| F14  | 工具页（页面地址/属性表单）                                               | `/get-page-address` `/property-form` | P5          | ⬜   |
| F15  | legacy-form 旧表单 iframe                                                 | legacy-form                          | P5          | ⬜   |
| F16  | 图标三层离线架构                                                          | icon-store                           | P0          | ⬜   |
| F17  | 首屏骨架屏（品牌文字+流光细线）                                           | index.html                           | P1          | ⬜   |
| F18  | golden 视觉回归全绿                                                       | e2e                                  | P2 起持续   | ⬜   |
| F19  | 性能基线达标                                                              | —                                    | P7          | ⬜   |
| F20  | 部署链路（server.js/config_dev/二级目录）                                 | —                                    | P7          | ⬜   |
| F21  | 升级日志：git-cliff 自动生成 + 手动编辑（a）/ 应用内 `/changelog` 页（b） | —                                    | P0(a)/P4(b) | ⬜   |

### 12.2 widgets 清单（P2 分工单元）

chart（含 Sankey/DateFilter）、chart-basic、LiquidFillChart、list（BxTable/grid-list/表格合并）、mix-list、slide-list、user-list、card-group、card-group-cell（含 parts：date-picker/drop-down/ProgressRing/marquee）、grid-card、descriptions-list、info-details、form、notice-bar、tabs、stack-swiper、nav-menu 族（树/目录/tabs/跳转）、map-card 族（约 13 个组件）、dahua-video、video-card、chat 族、qr-code、date-time、weather、current-info、DynamicIcon、容器族（page-item/float-component/chat-entrance/ui-scaler）

### 12.3 依赖对照

| 现有                                                          | 目标                                               | 说明                                                               |
| ------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------ |
| element-ui 2.15                                               | runtime-ui 自研（渲染层）+ element-plus（编辑器）  | 核心决策，见 §5                                                    |
| vuex 3                                                        | Pinia                                              | store：theme/pageEvent/loginInfo/chatInfo + 编辑器 dragStore       |
| vue-router 3                                                  | Nuxt 文件路由 + `[...slug].vue`                    | 初始 hash                                                          |
| echarts 4.8                                                   | echarts 5 + liquidfill 3 + wordcloud 2             | `echarts/lib/*` → `echarts/core`                                   |
| vue-fragment / vue2-teleport                                  | 删除（Vue3 原生）                                  | —                                                                  |
| vue-json-viewer 2                                             | vue3-json-viewer                                   | 编辑器内使用                                                       |
| jquery / vue-grid-layout / vue-sketch-ruler / vue-drag-resize | 删除                                               | 0 引用                                                             |
| vuedraggable 2                                                | 手写 HTML5 draggable（沿用）或 vue-draggable-plus  | —                                                                  |
| mixin 体系                                                    | composables（usePageConfig/useSrvReq/useHistory…） | 引擎层                                                             |
| —（新增）                                                     | git-cliff（devDependencies）                       | 从 conventional commits 生成 CHANGELOG.md + changelog.json（§9.5） |

### 12.4 参考文档

- 旧工程架构：docs/ARCHITECTURE.md、docs/PERFORMANCE.md、docs/DEPLOYMENT.md
- 渲染一致性关键：`theme/scss/preflight.scss` 三层引入顺序（迁移时原样保留）
