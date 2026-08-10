# 低代码平台 (Lowcode) 架构与组件说明文档

本文档详细介绍了 `src/pages/lowcode/` 目录下各层级模块、渲染引擎、布局物料、数据卡片部件及编辑器的职责划分、核心逻辑与数据走向。

---

## 1. 目录架构概览

```text
src/pages/lowcode/
├── engine/                         # 【渲染引擎层】低代码渲染核心控制器与生命周期混入
├── materials/                      # 【布局物料层】页面容器、布局块与递归节点
├── widgets/                        # 【业务部件库】数据卡片、图表、列表、导航等渲染部件
├── editor/                         # 【可视化编辑器域】PC 端与移动端拖拽配置面板
├── preview/                        # 【页面预览域】移动端独立预览
└── README.md                       # 架构与组件说明文档
```

---

## 2. 引擎层 (`lowcode/engine/`)

渲染引擎是低代码平台的“大脑”，负责解析后端 JSON 配置、拉取应用主题、维护组件树并处理数据更新。

### 2.1 核心文件及作用

| 文件 / 模块 | 核心职责与实现逻辑 |
| :--- | :--- |
| **`view.vue`** | **低代码页面渲染总入口**。<br>- 混入 `lowcode-page-mixin` 与 `page-params-mixin`。<br>- 负责挂载 `ui-scaler` 缩放自适应容器、页面级样式 `setStyle`。<br>- 遍历渲染顶层布局节点 `<lc-view>`。<br>- 挂载全局切换指示进度条 (`lc-page-switching`) 与锚点定位平滑滚动。 |
| **`lowcode-page-mixin.js`** | **核心生命周期与数据拉取混入**。<br>- **两阶段提交 (Two-Phase Commit)**：后台异步拉取并解析配置（Fetch Phase），无缝原子替换 state（Apply Phase），消除白屏与闪烁。<br>- **SWR 内存快照缓存 (`pageSnapshotCache`)**：支持 0ms 秒开体验并自动后台 revalidate 校验。<br>- **竞态防护 (`_switchSeq`)**：自动丢弃过期的防抖接口响应。<br>- **应用配置缓存 (`appConfigCache`)**：单例缓存应用全局样式主题。<br>- **Iconify 单例去重**：保证 SVG 图标只注册一次，消除主线程卡顿。 |
| **`page-params-mixin.js`** | **页面全局参数与路由变量混入**。<br>- 解析 URL 路由 `query` 参数并初始化 `queryOptions`。<br>- 构建基础用户参数模型 `basicParamsModel`（登录态、手机号绑定态、租户认证态）。<br>- 解析页面级参数配置 `interface_json_data` 与 `para_with_map_json_data` 并实时派发。 |

---

## 3. 布局物料层 (`lowcode/materials/`)

物料层负责构建低代码页面的 Flex / Grid 盒子模型结构，递归渲染无限层级的组件树。

### 3.1 核心文件及作用

| 组件名 | 标签名称 | 作用与逻辑 |
| :--- | :--- | :--- |
| **`materials/view.vue`** | **`<lc-view>`** | **递归节点渲染器**。<br>- 根据 `item.component` 动态渲染为 `container` / `block` / `content` 或 `PageItem`。<br>- 判断移动端/PC端展示模式。<br>- 如果包含 `childComponents`，递归遍历调用自身 `<lc-view>`。<br>- 绑定稳定 key 规则 `:key="item.com_no || item.id"` 实现跨页 DOM 复用。 |
| **`container.vue`** | **`<lc-container>`** | **页面顶级容器**。支持设置背景图、外边距、内边距、自定义 CSS Class。 |
| **`block.vue`** | **`<lc-block>`** | **布局块容器**。负责行/列栅格划分，实现多列流式布局。 |
| **`content-item.vue`** | **`<lc-content>`** | **数据卡片插槽容器**。包裹具体的数据部件。 |
| **`float-component.vue`** | **`<float-component>`** | **悬浮部件包装器**。支持悬浮拖拽与屏幕边缘吸附。 |

---

## 4. 业务数据部件库 (`lowcode/widgets/`)

部件库包含低代码平台中所有业务表现层卡片，由 `page-item.vue` 统一分发派发。

### 4.1 核心卡片部件列表

| 组件 / 目录 | 核心作用与渲染逻辑 |
| :--- | :--- |
| **`page-item.vue`** | **部件总派发分发器**。<br>- 拦截弹窗模式（基于 `<teleport>` 挂载至 body）。<br>- 渲染统一的标题栏、图标、更多按钮、折叠/展开动画与进入动画 (`enterAnimationClass`)。<br>- 根据 `pageItemData.com_type` 分发到下述具体卡片。 |
| **`card-group-cell/`** | **基础卡片与原子单元库**。<br>- **`card-cell-part.vue`**：渲染文本、数字、标签、图片、评分、倒计时、附件等。<br>- **图片组件优化**：采用原生 `<img>` 标签结合 `object-fit: setScaleMode` 与 `decoding="async"`，避免 `<el-image>` 初始化占位闪烁。 |
| **`card-group/`** | **卡片组部件**。支持多卡片并行展示、手风琴切换、跑马灯自动轮播。 |
| **`nav-menu/`** | **导航菜单部件**。渲染官网顶部 Header、二级下拉菜单、侧边树形栏目及面包屑导航。 |
| **`list/`** | **列表与高级表格部件**。<br>- **`list.vue`**：网格列表、卡片列表、带有分页/加载更多的响应式列表。<br>- **`BxTable.vue`**：包含动态列、表头合并、合并单元格高级数据表格。 |
| **`map-card/`** | **地图卡片部件**。<br>- **`CustomMapView.vue`**：基于 `ResizeObserver` 动态计算底图实际渲染像素区域，确保标点（Marker）在各种分辨率下绝对无偏移。 |
| **`chart/` & `chart-basic.vue`** | **动态图表部件**。整合 ECharts 渲染饼图、折线图、柱状图、仪表盘、水球图等可视化图表。 |
| **`form/add.vue`** | **动态新增表单部件**。根据后端 `form_json` 自动生成输入框、下拉框、日期选择器及提交逻辑。 |
| **`info-details.vue`** | **详情描述部件**。渲染单条记录的详细字段布局。 |
| **`chat/`** | **在线咨询入口与弹窗**。提供客服/在线咨询悬浮入口与 Chat 交互框。 |
| **`slide-list.vue`** | **轮播/滑动列表**。响应式大图轮播，`<img>` 已配置 `decoding="async"` 异步解码。 |

---

## 5. 编辑器与预览域 (`lowcode/editor/` & `preview/`)

提供低代码可视化拖拽与实时预览能力。

| 模块 | 路径 | 功能说明 |
| :--- | :--- | :--- |
| **PC端编辑器** | `lowcode/editor/pc/` | PC 端低代码画布拖拽、属性配置面板、样式树修改、组件物料库选择。 |
| **移动端编辑器** | `lowcode/editor/mobile/` | 移动端 H5 / 小程序画布拖拽、卡片微调与模拟器预览（原 `low-app`）。 |
| **移动端预览** | `lowcode/preview/mobile/` | 移动端独立预览页面（原 `low-app/app-preview`）。 |

---

## 6. 数据流转与通信机制

1. **配置流向**：后端 JSON $\rightarrow$ `lowcode-page-mixin`（反序列化与树构建） $\rightarrow$ `view.vue` $\rightarrow$ `materials/view.vue` 递归渲染 $\rightarrow$ `widgets/page-item.vue` 条件分发 $\rightarrow$ 具体部件展示。
2. **全局参数共享**：路由 `query` 参数更新后触发 `page-params-mixin` 中的 `queryOptions` 更新，通过 `provide` 向全子孙部件响应式广播。
3. **事件驱动**：卡片交互或表单提交完成后，向上 `$emit('executor-complete')` 或向 Vuex `pageEvent` 派发全局消息，驱动其他依赖卡片无缝刷新。

---

## 7. 手动回归测试用例

详细的回归测试用例已输出至当前目录下的 **[TEST_CASES.md](./TEST_CASES.md)**，包含环境准备、登录鉴权、官网渲染、旧路径兼容、PC 编辑器及移动端预览的完整测试步骤与预期检查项。

---

## 8. 极致性能优化与秒开架构方案书

关于如何让低代码渲染速度接近物理静态页或 SSR 秒开体验的 5 大深度架构优化方案（SSG 预渲染、Single-Flight BFF 单飞拼装、SWR 本地快照、视口按需水合、组件树拍平），请参阅详细方案书 **[PERFORMANCE_OPTIMIZATION_PLAN.md](./PERFORMANCE_OPTIMIZATION_PLAN.md)**。
