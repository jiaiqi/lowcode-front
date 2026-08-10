# 性能优化方案与验收

## 已实现（迁移即生效）

| 优化项 | 说明 | 收益 |
|---|---|---|
| Vite 构建 | webpack4 → Vite5 | 构建快 3-10 倍，dev 秒级启动（实测 595ms） |
| 渲染/编辑器 chunk 拆分 | `manualChunks`：view / page-item / editor 独立 | 渲染页不加载编辑器代码 |
| 依赖精简 | 移除 bxPlugin/routeStack/vue_init/updateChecker 及全部业务依赖 | 全局代码大幅减少 |
| 表单组件不迁入 | iframe 嵌入旧工程 | 约 200 文件表单集群不进入新工程 |
| 首屏骨架屏 | index.html 内联 | 白屏期有视觉反馈 |
| widget 异步化 | page-item 组件异步注册表（地图/视频/表单等独立 chunk） | 首屏只下载用到的组件 |
| iconify 空闲加载 | requestIdleCallback 加载 3 个 JSON（~2.2MB） | 不与首屏竞争主线程 |
| 内存 SWR 快照 | 页面切换秒开 + 后台校验 | 站内导航 0ms 内容直出 |
| 首屏图片预载 | 切换前预载前 12 张 | 避免图片逐张弹出 |
| schema/app 请求并行 | fetchAppConfig 与组件构建并发 | 消灭串行瀑布流 |

## 构建产物（当前基线）

| chunk | 体积 | gzip |
|---|---|---|
| vue-vendor | 224 kB | 78 kB |
| vendor | 292 kB | 105 kB |
| element-ui | 767 kB | 202 kB |
| view（渲染引擎） | 96 kB | 23 kB |
| page-item（业务组件） | 365 kB | 104 kB |
| echarts-vendor（异步） | 756 kB | 294 kB |
| iconify（异步，空闲加载） | 2.3 MB | 617 kB |

渲染页首屏加载：vue-vendor + vendor + element-ui + view + page-item ≈ **1.7 MB（gzip ~512 kB）**，其中 element-ui 全量占比最大。

## 后续优化项（按优先级）

### 1. element-ui 按需引入（收益最大）
当前全量引入（767 kB）。lowcode 实际只用 el-dialog/el-form/el-table/el-tree 等约 20 个组件。
方案：`babel-plugin-component` 或 `unplugin-vue-components` 按需引入，预计砍掉 400-500 kB。

### 2. IndexedDB SWR 持久化
当前 SWR 是内存缓存，刷新失效。新增 `utils/snapshot-db.js`（IndexedDB），刷新页面 0ms 秒开 + 后台 revalidate。

### 3. 视口按需水合
IntersectionObserver 对首屏外业务组件延迟挂载（rootMargin 200px）。
**风险**：需实测与 ui-scaler transform 缩放的兼容性；核对"没数据时隐藏"等依赖 mounted 的逻辑。

### 4. 组件树拍平
`buildComponentList` 拍平无样式的空 container/block，减少 Vue 实例开销。**仅非编辑态启用**。

### 5. 大 JSON 非响应式化
`parsePageConfig` 的只读 `*_json_data` 用 `Object.freeze` 冻结。

### 6. 后端配合
- schema 接口 ETag/304 + 图片 Cache-Control + Brotli（收益最大、成本最低）
- BFF 单飞接口：schema + app 配置 + 首屏组件数据一次返回
- 发布期 SSG 预渲染官网页

## 已知遗留问题

| 项 | 状态 |
|---|---|
| nav-menu 双高亮 | 主工程曾修复（激活态单一来源 + hover 解耦），**新工程需同步**（widgets/nav-menu） |
| 属性面板表单联动 | iframe 化后降级，待旧工程 postMessage 支持 |
| vendor/datav 全量保留 | 120 文件，后续可裁剪为实际引用子集 |
| engine/ 与 mixins/ 重复文件 | 同文件两份，后续合并为一份 |

## 验收清单

- [ ] `pnpm build` 通过，产物含独立 chunk（view/editor/echarts/element-ui/iconify）
- [ ] `/`、`/site/:pageNo`、`/:pageNo` 渲染正常，与旧工程视觉一致
- [ ] 组件类型全量走查：列表/图表/卡片/导航/表单(iframe)/地图/视频/轮播/公告
- [ ] 编辑器 `/lowcode/editor/:pageNo` 可打开、拖拽、保存（属性面板为 iframe 占位）
- [ ] 移动端预览 `/app/preview/:pageNo` 正常
- [ ] Network：schema 与 app 配置请求并发；首屏无编辑器 chunk
- [ ] 刷新页面、站内导航切换无回归
