# 低代码渲染性能优化 · 具体实施方案

> 分支：`feat/lowcode-page-perf`
> 目标：让 `/site/:pageNo`、`/lowcode/view/:pageNo`、`/`、`/:pageNo` 等低代码渲染页面加载更快，接近静态页面/SSR 体验。
> 原则：每阶段独立可交付、可回滚；阶段一为纯前端低风险改动，先实施；阶段二/三/四需逐项确认。

---

## 0. 总览与阶段划分

| 阶段 | 内容 | 风险 | 状态 |
| :--- | :--- | :--- | :--- |
| 一 | 首屏 JS 瘦身（chunk 拆分 + 组件异步化）+ 请求并行 + 资源预取 | 低 | ✅ 已完成 |
| 二 | IndexedDB 持久化 SWR + 首屏骨架屏 | 低-中 | ✅ 已完成 |
| 三 | 视口按需水合 + 组件树拍平 + 大 JSON 非响应式化 | 中-高 | 待确认 |
| 四 | 后端配合：HTTP 缓存 / BFF 单飞 / 预渲染 | —（需后端） | 建议 |

验收标准（阶段一）：
1. 构建后 `lowcode-view` chunk 中不再包含编辑器代码（对比 `lowcode-editor`）。
2. 官网页面只下载实际用到的业务组件 chunk（地图/视频/表单等低频重型组件按需加载）。
3. 页面 schema 请求与应用配置请求并发发出（Network 面板确认无串行等待）。
4. 站内导航切换、刷新、编辑器编辑、移动端预览均无回归。

---

## 1. 阶段一：首屏 JS 瘦身与请求并行

### 1.1 路由 chunk 拆分（lowcode → lowcode-view / lowcode-editor）

**背景**：`src/router/modules/lowcode.js` 与 `src/router/index.js` 中所有 lowcode 相关路由共用 `webpackChunkName: "lowcode"`，导致访问官网渲染页也要下载编辑器（拖拽、属性面板等重型代码）。

**改动文件**：
- `src/router/modules/lowcode.js`
- `src/router/index.js`

**具体改动**：

渲染路由（改 `webpackChunkName: "lowcode-view"`）：
```js
// modules/lowcode.js
path: "/lowcode/view/:pageNo"   // name: lowcode-view
path: "/site/:pageNo"           // name: website
path: "/site/:pageNo/:anchorName" // name: websiteWithAnchor
// index.js
path: "/:pageNo"                // name: lowcode-view1
path: "/"                       // name: lowcodeHomePage
```

编辑器路由（改 `webpackChunkName: "lowcode-editor"`）：
```js
// modules/lowcode.js
path: "/lowcode/editor/:pageNo"   // name: lowcode-editor
path: "/edit/:pageNo"             // name: lowcode-editor1
path: "/card-cell-editor/:cardNo" // name: cardCellEditor
path: "/map-editor/:mapNo"        // name: MapEditor
path: "/get-page-address"
path: "/property-form"
```

**注意**：`router/index.js` 中 `/:pageNo` 与 `/` 是兜底路由，必须保留 `lowcode-view` chunk（不能拆走）；`modules/lowcode.js` 的移动端路由（`/app/...`）保持 `mobile-app` 不动。

**风险与验证**：
- 风险：webpack4 下同名 chunk 拆开后公共模块可能被重复打包（体积微增，可接受）；编辑器路由首次进入时需重新下载 `lowcode-editor` chunk（原本已含在 lowcode 中，属正常）。
- 验证：`npm run build` 后检查 `dist/assets/js/` 下 `lowcode-view.*.js` 与 `lowcode-editor.*.js` 体积，确认 `lowcode-view` 显著小于原 `lowcode`；本地跑起后访问 `/site/xxx` 走的是新 chunk。

### 1.2 page-item 业务组件异步化（异步注册表）

**背景**：`src/pages/lowcode/widgets/page-item.vue` 顶部**同步 import 了 18 个业务组件**（地图、大华视频、动态表单、详情、描述列表、轮播、视频卡片、用户列表、公告、网格卡片、页签、卡片组、控件、列表等），全部打进同一个 chunk。页面哪怕只用 3 个组件，也要下载全部组件代码。

**改动文件**：
- `src/pages/lowcode/widgets/page-item.vue`

**具体改动**：
1. 删除以下同步 `import`（共 18 行）：
   ```js
   videoCard / currentInfo / slideList / userList / noticeBar
   mapCard / mixList / List / DescriptionsList / pageWidget
   cardGroup / tabList / gridCard / formAdd / NavMenu
   CardCellPart / InfoDetails / DhVideo / CanvasPage
   ```
2. `components` 注册表中改为异步函数 + 独立 chunk 名（模板 `v-else-if` 链**保持不变**，Vue 2 异步组件可直接用于模板）：
   ```js
   components: {
     // —— 保留同步（首屏核心/轻量）——
     Teleport,
     Icon,
     NavMenu,      // 官网顶部导航，首屏常见
     List,         // 列表，官网常见
     CardCellPart, // 卡片部件，高频
     // —— 异步化（低频/重型）——
     CanvasPage: () => import(/* webpackChunkName: "lc-canvas" */ "@/components/common/canvas-line/canvasPage.vue"),
     videoCard: () => import(/* webpackChunkName: "lc-widget-video" */ "./video-card.vue"),
     currentInfo: () => import(/* webpackChunkName: "lc-widget-misc" */ "./current-info.vue"),
     slideList: () => import(/* webpackChunkName: "lc-widget-swiper" */ "./slide-list.vue"),
     userList: () => import(/* webpackChunkName: "lc-widget-misc" */ "./user-list.vue"),
     noticeBar: () => import(/* webpackChunkName: "lc-widget-misc" */ "./notice-bar.vue"),
     mapCard: () => import(/* webpackChunkName: "lc-widget-map" */ "./map-card/index.vue"),
     DescriptionsList: () => import(/* webpackChunkName: "lc-widget-misc" */ "./descriptions-list/descriptions-list.vue"),
     pageWidget: () => import(/* webpackChunkName: "lc-widget-widget" */ "./widget.vue"),
     cardGroup: () => import(/* webpackChunkName: "lc-widget-cardgroup" */ "./card-group/card-group.vue"),
     tabList: () => import(/* webpackChunkName: "lc-widget-tabs" */ "./tabs/tabs.vue"),
     gridCard: () => import(/* webpackChunkName: "lc-widget-grid" */ "./grid-card.vue"),
     formAdd: () => import(/* webpackChunkName: "lc-widget-form" */ "./form/add.vue"),
     InfoDetails: () => import(/* webpackChunkName: "lc-widget-detail" */ "@/pages/datav/component/page-item/info-details.vue"),
     DhVideo: () => import(/* webpackChunkName: "lc-widget-dahua" */ "@/pages/business/yanan-park/dahua-video/video-home.vue"),
     basicChart: () => import(/* webpackChunkName: "echarts-vendor" */ "./chart-basic.vue"), // 保持现状
     pageItemChart: () => import(/* webpackChunkName: "echarts-vendor" */ "./chart/page-item-chart.vue"), // 保持现状
   }
   ```
3. 同步删除 `mixList` 的 import（模板中已被注释，`./mix-list/list.vue` 不再引入）。

**风险与验证**：
- 风险：异步组件首次渲染时有短暂加载期（Vue 2 默认不渲染任何内容直到 chunk 就绪）。对低频重型组件（地图/视频/表单）可接受；若首屏组件渲染时机敏感（如"没数据时隐藏"依赖 mounted 后发请求），异步加载会稍晚触发请求，但功能不变。**若某个异步组件加载失败，该区域空白而非整页崩溃**（异步组件错误仅影响自身）。
- 验证：官网页面 Network 面板应只出现实际使用组件的 chunk 请求；逐一验证卡片部件、navBar、list、chart、form、detail、map、视频、swiper、描述列表、控件、cardGroup、tabs、grid 等各类型渲染正常；编辑器内拖入各组件正常。

### 1.3 恢复 prefetch（异步 chunk 空闲预取）

**背景**：`vue.config.js:43-44` 显式删除了 `preload` 与 `prefetch` 插件，所有异步 chunk 只能运行时动态请求。

**改动文件**：
- `vue.config.js`

**具体改动**：
```js
// 删除以下两行中的 prefetch（保留删除 preload）
config.plugins.delete('preload');
config.plugins.delete('prefetch'); // ← 删除此行，恢复 prefetch
```

**说明**：webpack4 的 `PrefetchPlugin` 会在主 chunk 加载完成后空闲时预取异步 chunk，配合 1.2 的组件异步化，可让低频组件 chunk 提前进入浏览器缓存而不阻塞首屏。`preload` 保持删除（避免 initial async chunk 全部提前加载拖慢首屏）。

**风险与验证**：
- 风险：预取会增加少量空闲期带宽占用（可接受）；生产环境 `preload` 指令数量增多不影响功能。
- 验证：构建后 index.html 中出现 `<link rel="prefetch" ...>` 标签；首屏加载完成后 Network 面板可见低频 chunk 自动下载。

### 1.4 schema 与 app 配置请求并行

**背景**：`lowcode-page-mixin.js:391` 中 `fetchAppConfig(cfg.app_no)` 在 schema 返回后**串行 await**。

**改动文件**：
- `src/pages/lowcode/mixins/lowcode-page-mixin.js`（`fetchPageData` 方法）

**具体改动**：把 app 配置请求提前到组件构建之前并发发起：
```js
async fetchPageData(pageNo) {
  // ...现有 $selectOne 请求 schema 逻辑不变...
  const cfg = this.parsePageConfig(data);
  let list = cfg?.page_row_json_data?.component_json;
  // 提前并发发起 app 配置请求（不 await）
  const appCfgPromise = cfg?.app_no ? this.fetchAppConfig(cfg.app_no) : Promise.resolve(null);
  if (this.getPageComponents && typeof this.getPageComponents === "function") {
    list = await this.getPageComponents(list);
  }
  const components = this.buildComponentList(list);
  const appCfg = await appCfgPromise; // 此时再 await
  return { ok: true, data: cfg, components, appCfg };
}
```
（`fetchAppConfig` 内部有 `appConfigCache` 命中即同步返回，无副作用；`buildComponentList` 为同步纯函数。）

**风险与验证**：
- 风险：极低。若 `getPageComponents` 依赖 app 配置（需确认无此依赖），才需保持串行——现状代码未显示该依赖。
- 验证：Network 面板确认两个请求几乎同时发出。

### 1.5 iconify 图标库空闲加载

**背景**：`engine/view.vue` 的 mixin `lowcode-page-mixin.js` mounted 钩子加载 3 个 iconify JSON（carbon 1.09MB + ri 1.05MB + mdi-light 89KB），虽为异步但会与首屏渲染竞争主线程。

**改动文件**：
- `src/pages/lowcode/mixins/lowcode-page-mixin.js`（mounted 钩子）

**具体改动**：将图标集合加载从 mounted 改为 `requestIdleCallback` 延迟执行（保留 `isIconifyLoaded` 单例）：
```js
async mounted() {
  if (isIconifyLoaded) return;
  // 让出首屏主线程：requestIdleCallback 空闲时再加载；不支持的浏览器降级 setTimeout
  const loadIcons = async () => {
    if (isIconifyLoaded) return;
    const [carbon, mdiLight, ri] = await Promise.all([
      import(/* webpackChunkName: "iconify" */ "@iconify/json/json/carbon.json"),
      import(/* webpackChunkName: "iconify" */ "@iconify/json/json/mdi-light.json"),
      import(/* webpackChunkName: "iconify" */ "@iconify/json/json/ri.json"),
    ]);
    addCollection(carbon.default || carbon);
    addCollection(mdiLight.default || mdiLight);
    addCollection(ri.default || ri);
    isIconifyLoaded = true;
  };
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(loadIcons, { timeout: 2000 });
  } else {
    setTimeout(loadIcons, 0);
  }
}
```
（`lowcode-page-mixin-setup.js` 与 `lowcode-page-combined-mixin.js` 中相同逻辑一并处理，保持一致。）

**风险与验证**：
- 风险：首屏 `Icon` 组件在集合加载前可能显示为空/缺图标，加载完成后自动补齐（iconify/vue2 的 Icon 会响应集合注册重渲染）。验证实际页面标题图标、三角箭头等是否正常出现。
- 验证：Performance 面板确认图标解析不再阻塞首帧；页面上所有 `Icon` 图标最终正常显示。

---

## 2. 阶段二：持久化 SWR + 首屏骨架屏（✅ 已实施）

### 2.1 IndexedDB 持久化页面快照
- **背景**：现有 `pageSnapshotCache` 为模块级内存 Map，刷新页面/新开 tab 即失效。
- **改动**：新增 `src/pages/lowcode/utils/snapshot-db.js`（轻量 IndexedDB 封装，get/set/delete，按 `page_${pageNo}` 存储，总量上限如 50 条，超限淘汰最旧）；`loadPageConfig` 在内存缓存未命中时先查 IndexedDB，命中即整帧直出再走现有 `revalidatePage` 后台校验；`cacheSetPage` 同时写库。
- **关键设计**：快照 key 需区分 query 参数（`pageNo + query 摘要`），避免不同参数页面内容串用；仅缓存无登录差异的公开页面（默认全量缓存 + 后台校验保证不陈旧）。
- **风险**：IndexedDB 读取为异步（首帧需等待）；Schema 体积大时存储占用与序列化开销。可先做成"缓存不阻塞首屏"（读库与网络请求并行，先到先渲染）。

### 2.2 首屏骨架屏
- **改动**：`public/index.html` 的 `<div id="app">` 内放一段内联样式 + 占位块（与页面背景同色、居中 logo/loading 动画），Vue 挂载后自动被替换。
- **风险**：极低，纯展示。

---

## 3. 阶段三：视口水合与渲染成本削减（待确认后实施）

### 3.1 视口按需水合
- **改动**：新增 `src/pages/lowcode/components/lazy-render.vue`（IntersectionObserver，`rootMargin: "200px 0px"`，进入视口前 200px 才挂载真实组件，否则渲染占位骨架）；在 `materials/view.vue` 递归层对**业务组件**（`component === 'page-item'` 或 `float-component`）包一层 lazy 渲染。
- **风险（重要）**：本项目 `ui-scaler` 对整页做 `transform: scale()`，会改变布局盒坐标；IntersectionObserver 默认以视口为 root 计算交叉，**需要实测**缩放后的 rootMargin 补偿或改用页面容器作 root。此外懒水合会延迟"没数据时隐藏/首屏计数"等依赖 mounted 的逻辑触发时机，需逐组件核对。
- **收益**：首屏只实例化视口内组件，TBT 与请求数显著下降。

### 3.2 组件树拍平
- **改动**：`lowcode-page-mixin.js` 的 `buildComponentList` 中，把"无独立背景/边距/样式、无子组件交互"的空 `container`/`block` 拍平（跳过其 wrapper 层，子节点上提）。
- **风险（高）**：编辑器（`/lowcode/editor`）复用同一套构建逻辑，拍平会影响拖拽选中/层级展示；**必须仅在非编辑态（isView/isPreview）启用**。DOM 结构变化可能影响既有 CSS 选择器与锚点定位，需全页面回归。

### 3.3 大 JSON 非响应式化
- **改动**：`parsePageConfig` 解析出的 `*_data` 中只读的静态字段（页面样式、组件配置等）用 `Object.freeze` 冻结；`setStyle` computed 去掉每次 `cloneDeep`（改为缓存引用）。
- **风险（中）**：Vue 2 中 frozen 对象不可响应，若某处对 frozen 数据 `$set` 会静默失败。需先 grep 确认 `pageConfig` 相关字段无写操作。

---

## 4. 阶段四：后端配合（建议项，需后端排期）

1. **HTTP 缓存**：schema 接口返回 `ETag/Last-Modified` + 短时强缓存（配置不变 304）；图片接口加 `Cache-Control: max-age`；服务端启用 Brotli（比 gzip 再小 15~25%）。收益最大、成本最低。
2. **BFF 单飞接口**：一次返回 `schema + app 配置 + 首屏组件初始数据`，消灭多级瀑布流。
3. **预渲染/SSR**：发布页时用 Node + puppeteer 预渲染 `/site/:pageNo` 静态 HTML 存 CDN，访问先出静态内容再水合——最接近"静态页面"的终态（投入最高）。

---

## 5. 风险清单与回滚策略

| 风险 | 影响 | 应对/回滚 |
| :--- | :--- | :--- |
| chunk 拆分后公共模块重复打包 | 体积微增 | 可接受；必要时调整 splitChunks cacheGroups |
| 异步组件加载失败 | 该区域空白 | 组件级错误不影响整页；回滚 1.2 即恢复同步 |
| prefetch 空闲带宽占用 | 可忽略 | 恢复删除 prefetch 一行即可 |
| iconify 延迟加载 | 首帧个别图标暂缺 | 已设 timeout 兜底；回滚 1.5 |
| IndexedDB 快照误用（query 差异） | 内容串用 | key 含 query 摘要 + 后台强校验 |
| 树拍平影响编辑器/布局 | 编辑功能异常 | 仅非编辑态启用；独立开关控制 |
| 视口水合与 ui-scaler 冲突 | 首屏组件不渲染 | 先小范围验证再全量；可关停 |

**回滚总原则**：每项改动独立提交、独立可逆；出问题时 revert 对应 commit 即可。

---

## 6. 验证清单（阶段一）

- [ ] `npm run build` 成功，`lowcode-view` 与 `lowcode-editor` chunk 分离且体积合理
- [ ] 访问 `/` 首页正常渲染（含锚点/主题/缩放）
- [ ] 访问 `/site/:pageNo`、`/lowcode/view/:pageNo`、`/:pageNo` 正常
- [ ] 站内导航切换（`$route.params.pageNo` watch 链路）正常、无闪烁
- [ ] 编辑器 `/lowcode/editor/:pageNo` 正常（拖拽、属性面板、预览）
- [ ] 各业务组件类型渲染正常：卡片部件 / navBar / list / chart / form / detail / map / 视频 / swiper / 描述列表 / 控件 / cardGroup / tabs / grid / 弹窗模式
- [ ] Network 面板：schema 与 app 配置请求并发；仅实际使用组件 chunk 被下载
- [ ] 刷新页面、移动端预览（`/app/preview`）无回归
