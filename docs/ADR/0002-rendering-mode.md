# ADR 0002：渲染模式（低代码页 ISR + 官网 SSG + 编辑器 SPA）

- **状态**：已接受（2026-08-11）
- **关联**：`docs/NUXT_MIGRATION_PLAN.md` §4.1、§9.3
- **决策者**：项目负责人（用户拍板：生产部署环境可运行 Node 服务）

## 背景

新工程初始方案为纯 SPA（`ssr: false` + nginx 静态托管，沿用旧工程部署形态）。用户要求低代码页面渲染支持 SSR/SSG，并确认生产环境可运行 Node 服务。

低代码页面为数据驱动（页面配置在后端 API），SSR/SSG 的可行性前提是**服务端能获取页面配置**，且渲染引擎在 Node 端可运行。

## 决策

采用 **Nuxt 4 routeRules 混合渲染**，部署升级为 **Nitro Node 服务 + nginx 反代**：

| 路由                         | 模式                              | 说明                                                                            |
| ---------------------------- | --------------------------------- | ------------------------------------------------------------------------------- |
| `/:pageNo` 等低代码页        | ISR（`routeRules.swr`，TTL 300s） | 服务端拉配置渲染真实 HTML（SEO 可抓）；TTL 内缓存直出；配置变更自动更新，零运维 |
| `/site/**` 官网类            | SSG（`prerender`）                | 构建时预渲染已发布页面为静态 HTML                                               |
| `/editor/**` `/changelog` 等 | SPA（`ssr: false`）               | 编辑器纯客户端                                                                  |

配套机制：

- 页面配置请求走 Nitro `server/api/page/[pageNo]` 服务端代理（内网可达 + 免 CORS + 可聚合）
- 配置提供者抽象：`useRuntimeConfig()` 统一取配置（服务端环境变量 / 客户端 payload 注入，`window.APP_CONFIG`、`server.js` 注入值客户端兼容）
- widgets SSR 安全规范（setup 不碰浏览器 API）+ 引擎统一 `<ClientOnly>` 包装

## 理由

1. 低代码页面数据驱动，SSR 依赖服务端取数——Nitro server 代理同时解决服务端可达、CORS、多环境三件事
2. ISR 让"页面配置变更 → 线上生效"零运维（TTL 自动重建），不需要构建联动/webhook 机制
3. 混合模式各取所长：页面与官网获得 SEO/首屏直出，编辑器保持纯客户端复杂度
4. 配置提供者抽象顺带收敛散落的 window 全局变量（架构正向）
5. 运维成本可控：单 Node 进程 + pm2/Docker + 健康检查，3-5 人团队可维护

## 后果

**积极**：SEO 可抓真实页面内容；首屏 HTML 直出（优于 SPA 白屏）；CORS/多环境问题消解；为未来官网 SEO 需求预留能力。

**消极/注意**：

- 部署形态从纯静态升级为 Node 服务：需要进程管理、服务端日志、回滚策略（方案 §9.4）
- widgets 受 SSR 安全规范约束；引擎统一 ClientOnly 兜底降低逐组件改造成本
- ISR TTL 内页面变更延迟生效（默认 300s，可接受；编辑器保存后主动失效为可选增强）
- `server.js` 注入的 window 全局在服务端不可用——客户端经 payload 注入兼容，行为与旧工程一致
- SSR 与客户端水合一致性（hydration mismatch）需 golden 回归覆盖

## 复盘触发条件

- 部署环境失去 Node 能力 → 降级纯静态全量 SSG（`nuxi generate`，页面更新需重建触发机制）
- 页面实时性要求显著低于 TTL 且无法接受延迟 → 调整 TTL 或改为全 SSR
- golden 回归发现 SSR 渲染与旧工程 CSR 表现不一致且无法修复 → 相关路由回退 SPA（routeRules 局部回退，成本低）
