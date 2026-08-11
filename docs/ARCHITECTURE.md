# 架构说明

## 渲染链路

```
浏览器访问 /site/:pageNo
  → router → engine/view.vue（渲染引擎入口）
      → mixins/lowcode-page-mixin（拉取 pageConfig、构建组件树、IndexedDB SWR 快照）
      → materials/view.vue（lc-view 递归渲染组件树）
          → widgets/*（业务组件：列表/图表/卡片/导航等）
```

### 关键模块

| 模块 | 职责 |
|---|---|
| `engine/view.vue` | 渲染页入口，ui-scaler 整页缩放，监听路由切换 |
| `mixins/lowcode-page-mixin.js` | 页面配置获取（两阶段提交）、组件树构建、IndexedDB SWR（`utils/snapshot-db.js`）、首屏图片预载、图标集合预载 |
| `mixins/page-params-mixin.js` | 页面参数模型（queryOptions/pageParamsModel） |
| `components/materials/view.vue` | lc-view 组件树递归渲染核心（编辑器/渲染器共用） |
| `components/ui-scaler.vue` | 设计稿等比缩放 |
| `widgets/page-item.vue` | 业务组件分发（v-else-if 链 + 异步组件） |
| `widgets/common/DynamicIcon.vue` | 统一图标渲染：unocss class 优先，safelist 外走 icon-store 本地 SVG |
| `widgets/common/icon-store.js` | 图标集合本地加载（?url 静态资源，离线可用） |
| `widgets/common/icon-safelist.js` | unocss safelist 共享数据（构建期与运行时同源） |
| `widgets/nav-menu/nav-jump.js` | 导航跳转统一工具（登录拦截/外部页面/站内 SPA） |
| `common/http.js` | 请求封装：网关解析（静态配置）、bx_auth_ticket 头、登录失效处理 |

### 数据流

1. `fetchPageData(pageNo)`：请求 `srvpage_cfg_page_guest_select` 获取页面 Schema
2. `parsePageConfig`：解析 `*_json` → `*_json_data`（只读配置深度冻结）
3. `buildComponentList`：构建组件树（`utils/common.js buildComponentsTree`）
4. `applyPageData`：整帧提交（pageConfig/components/主题一次生效，避免闪烁）
5. 首屏 `getPageConfig` / 导航 `loadPageConfig`：SWR——IndexedDB 快照 + 内存缓存命中即秒开，网络结果后台 `revalidate` 比对指纹

## 目录结构（src/pages/lowcode）

```
├── common/          # 引擎公共工具（formatStyleData/params mixins/mapUtils 等）
├── widgets/         # 业务组件唯一源（列表/图表/卡片/导航/地图/视频等）
│   ├── common/      # DynamicIcon / icon-store / icon-safelist
│   ├── nav-menu/    # 导航组件族（nav-menu 系列 + nav-jump.js）
│   └── dahua-video/ # 延安大华视频组件
├── components/      # 编辑器 UI（materials/property/outline/header）
├── engine/          # view.vue（渲染入口）
├── mixins/          # 页面混入（lowcode-page-mixin 等）
├── card-cell-editor/ map-editor/ get-page-address/ property-form/
├── editor/mobile/   # 移动端编辑
├── preview/mobile/  # 移动端预览
└── utils/           # snapshot-db（IndexedDB SWR）、common（组件树构建）
```

> 历史遗留的 vendor/ 目录已全部移除（datav 收敛、大华视频迁入 widgets）。

## 全局挂载清单（main.js）

| 全局 | 来源 | 说明 |
|---|---|---|
| `Vue.use(ElementUI)` | element-ui | 全量（按需经 commonjs 转换反而膨胀，见 PERFORMANCE.md） |
| `Vue.use(Fragment.Plugin)` | vue-fragment | datav grid-layout 使用 |
| `v-clickoutside` | directives/clickoutside.js | nav-menu/map 组件使用 |
| `Vue.use(VueInit)` | components/common/vue_init.js | 渲染一致性所需全局挂载 |
| `Vue.use(VueUtil)` | components/common/vue_util.js | `recoverFileAddress4richText`/`getImagePath`/`jumpAction` 等全局方法 |
| `Vue.prototype.$http/$axios` | common/http.js | 23 个 lowcode 文件依赖 |
| unocss | main.js import "virtual:uno.css" | 图标内联 CSS（presetIcons 单预设） |

**已移除**：bxPlugin、routeStack、updateChecker、`@iconify/vue2`（离线图标方案，见 PERFORMANCE.md）。

## Store 模块

| 模块 | 用途 |
|---|---|
| `theme` | 主题切换（currentTheme/themeList/themeVariable） |
| `pageEvent` | 页面事件（getPageEvents/getAllPageVariables） |
| `loginInfo` | 登录态（logined/bx_auth_ticket/user） |
| `chatInfo` | 在线咨询未读消息 |

编辑器拖拽状态使用 `pages/lowcode/store/dragStore.js`（非 vuex，纯 JS 单例）。

## 样式体系

- 组件样式：scoped scss（`@use` 语法，dart-sass 1.80）
- 全局主题：`theme/scss/preflight.scss`（tailwind preflight + utilities，**渲染一致性关键，勿删**）+ `common-theme.scss`（element-ui 微调）
- 图标：unocss presetIcons（1em 字体图标方式）+ icon-store 本地 SVG 兜底
- 缩放：ui-scaler 设计稿等比 + `--content-width` CSS 变量
