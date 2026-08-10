# 架构说明

## 渲染链路

```
浏览器访问 /site/:pageNo
  → router → engine/view.vue（渲染引擎入口）
      → lowcode-page-mixin（拉取 pageConfig、构建组件树、SWR 内存快照）
      → materials/view.vue（lc-view 递归渲染组件树）
          → widgets/*（业务组件：列表/图表/卡片/导航等）
```

### 关键模块

| 模块 | 职责 |
|---|---|
| `engine/view.vue` | 渲染页入口，ui-scaler 整页缩放，监听路由切换 |
| `mixins/lowcode-page-mixin.js` | 页面配置获取（两阶段提交）、组件树构建、SWR 内存缓存、首屏图片预载、iconify 加载 |
| `mixins/page-params-mixin.js` | 页面参数模型（queryOptions/pageParamsModel） |
| `components/materials/view.vue` | lc-view 组件树递归渲染核心（编辑器/渲染器共用） |
| `components/ui-scaler.vue` | 设计稿等比缩放 |
| `widgets/page-item.vue` | 业务组件分发（v-else-if 链 + 异步组件） |
| `common/http.js` | 请求封装：网关解析（静态配置）、bx_auth_ticket 头、登录失效处理 |

### 数据流

1. `fetchPageData(pageNo)`：请求 `srvpage_cfg_page_guest_select` 获取页面 Schema
2. `parsePageConfig`：解析 `*_json` → `*_json_data`
3. `buildComponentList`：构建组件树（`utils/common.js buildComponentsTree`）
4. `applyPageData`：整帧提交（pageConfig/components/主题一次生效，避免闪烁）
5. `loadPageConfig`：SWR——内存快照命中即秒开，后台 `revalidatePage` 校验更新

## 依赖内聚（vendor）

原 datav（旧大屏系统，已废弃）被 lowcode 引用的部分收敛至 `src/pages/lowcode/vendor/datav`：

- `vendor/datav/common/`：formatStyleData、params mixins、mapUtils
- `vendor/datav/component/`：info-details、LiquidFillChart、page-item-group、date-time 等

import 前缀已统一替换：`@/pages/datav/*` → `@/pages/lowcode/vendor/datav/*`。

## 全局挂载清单（main.js）

与主工程对比，新工程只保留渲染所需：

| 全局 | 来源 | 说明 |
|---|---|---|
| `Vue.use(ElementUI)` | element-ui | 全量 |
| `Vue.use(Fragment.Plugin)` | vue-fragment | datav grid-layout 使用 |
| `v-clickoutside` | directives/clickoutside.js | nav-menu/map 组件使用 |
| `Vue.use(VueUtil)` | components/common/vue_util.js | `recoverFileAddress4richText`/`getImagePath` 等全局方法（已去掉 dialog.vue 表单依赖） |
| `Vue.prototype.$http/$axios` | common/http.js | 23 个 lowcode 文件依赖 |

**已移除**：bxPlugin（仅 $http/v-viewer，已等价替代）、routeStack、vue_init、updateChecker、common-theme 已单独引入。

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
- 全局主题：`theme/scss/common-theme.scss`（element-ui 微调）
- 缩放：ui-scaler 设计稿等比 + `--content-width` CSS 变量
