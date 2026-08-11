# lowcode-front 低代码独立工程

低代码页面渲染与编辑的独立前端工程，从主工程（`l-pc-front`）拆分而来。

## 技术栈

| 项 | 版本 | 说明 |
|---|---|---|
| Vite | 5.x | 构建工具（Node 18+），`vite.config.mjs`（ESM） |
| Vue | 2.7.16 | `@vitejs/plugin-vue2` |
| vue-router / vuex | 3.x | Vue 2 生态 |
| element-ui | 2.15.14 | 全量引入（按需验证不可行，见 docs/PERFORMANCE.md） |
| unocss | 66.x | presetIcons 图标内联（静态图标零 JS 下载） |
| 包管理 | pnpm 10.x | `pnpm install` |

## 快速开始

```bash
pnpm install        # 安装依赖
pnpm dev            # 开发服务 http://localhost:8088
pnpm build          # 生产构建（输出 dist/）
pnpm preview        # 预览构建产物
```

## 路由

| 路由 | 说明 |
|---|---|
| `/` 、`/:pageNo` | 首页 / 短路径渲染 |
| `/site/:pageNo`、`/site/:pageNo/:anchorName` | 官网渲染（含锚点） |
| `/lowcode/view/:pageNo` | 渲染 |
| `/lowcode/editor/:pageNo`、`/edit/:pageNo` | 编辑器 |
| `/card-cell-editor/:cardNo`、`/map-editor/:mapNo` | 卡片/地图编辑器 |
| `/get-page-address`、`/property-form` | 工具页 |
| `/app/edit/:pageNo`、`/app/preview/:pageNo` | 移动端编辑/预览 |

## 目录结构

```
├── index.html                 # 入口（含首屏骨架屏）
├── vite.config.mjs            # Vite 配置（ESM，proxy/manualChunks/alias/unocss）
├── unocss.config.js           # unocss 图标预设（safelist 与运行时共享 icon-safelist.js）
├── public/
│   └── config/config_dev.js   # 环境配置（APP_CONFIG：地图/视频/登录白名单/旧工程地址）
├── theme/scss/                # preflight（tailwind，渲染一致性关键）+ 全局主题
└── src/
    ├── main.js                # 精简入口（ElementUI/unocss/全局方法）
    ├── App.vue
    ├── router/                # 渲染 + 编辑器路由
    ├── store/                 # theme / pageEvent / loginInfo / chatInfo
    ├── common/                # http.js（跨域适配）/ envList / vueApi / config
    ├── components/            # 依赖的最小组件集 + legacy-form（表单 iframe 包装）
    ├── directives/            # clickoutside
    └── pages/lowcode/         # 低代码引擎全部代码
        ├── engine/            # 渲染引擎入口 view.vue
        ├── widgets/           # 业务组件唯一源（含 common: 图标方案 / nav-menu: 导航族 / dahua-video）
        ├── common/            # 引擎公共工具（formatStyleData 等）
        ├── mixins/            # 页面/组件混入
        ├── components/        # materials(组件树) / property(属性面板) / editor
        ├── index.vue          # 编辑器入口
        ├── card-cell-editor/  map-editor/  get-page-address/  property-form/
        ├── preview/           # 移动端预览
        ├── editor/mobile/     # 移动端编辑器
        ├── store/             # dragStore（编辑器拖拽）
        └── utils/             # snapshot-db（IndexedDB SWR）/ common（组件树构建）
```

## 与主工程的差异（拆分要点）

1. **构建栈**：webpack4 → Vite5，chunk 自动按需拆分（渲染/编辑器/echarts/element-ui/iconify）
2. **全局注册精简**：仅 ElementUI + fragment + clickoutside + `$http` + vue_util 全局方法；移除 bxPlugin / routeStack / vue_init / updateChecker
3. **依赖内聚**：datav/大华视频收敛至 `widgets/`（vendor 目录已移除）；表单组件（simple-add/update 等）**不迁入**，用 iframe 嵌入旧工程（见 `components/common/legacy-form.vue` 与 docs/LEGACY_FORM.md）
4. **登录跨域适配**：静态网关 + iframe postMessage 注入 + SSO 兜底（见 docs/LOGIN.md）
5. **样式统一 sass**：less 全部转为 scss；图标用 unocss + 本地集合（离线可用）

## 文档

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — 架构说明
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — 独立域名 + 二级目录部署
- [docs/LOGIN.md](docs/LOGIN.md) — 跨域登录方案（postMessage / SSO）
- [docs/LEGACY_FORM.md](docs/LEGACY_FORM.md) — 旧工程表单 iframe 嵌入方案
- [docs/PERFORMANCE.md](docs/PERFORMANCE.md) — 性能优化方案与验收
- [docs/PERFORMANCE_OPTIMIZATION_PLAN.md](docs/PERFORMANCE_OPTIMIZATION_PLAN.md) — 原方案书（迁移自主工程）
- [docs/PERFORMANCE_OPTIMIZATION_IMPL_PLAN.md](docs/PERFORMANCE_OPTIMIZATION_IMPL_PLAN.md) — 原实施方案（迁移自主工程）

## 环境切换

环境（dev/saas/yanxue 等）由 `src/common/envList.js` 的 `pathConfigMap` 定义，切换方式（优先级从高到低）：

1. URL 参数 `?env=xxx`（仅开发环境）
2. `sessionStorage.setItem('dev_env', 'xxx')`
3. `.env` 的 `VUE_APP_DEFAULT_ENV`（构建时注入）
