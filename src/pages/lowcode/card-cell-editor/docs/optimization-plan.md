# 卡片单元编辑器优化方案

> 文档版本：v1.0  
> 创建日期：2026-04-21  
> 适用范围：`src/pages/lowcode/card-cell-editor`

---

## 一、现状诊断

### 1.1 技术栈

| 技术项 | 版本 | 说明 |
|--------|------|------|
| Vue | 2.7.16 | 支持 Composition API |
| Element UI | 2.15.14 | Vue 2 配套组件库 |
| Vue CLI | 3.12.1 | 构建工具（Webpack 4 底层）|
| Vuex | 3.x | 状态管理 |
| Node | 18.20.8 | 运行时 |

### 1.2 核心问题

1. **上帝组件**：`card-cell-editor.vue` 单文件 2685 行，包含业务逻辑、工具函数、常量、样式
2. **数据同步隐患**：`outlineTree` 使用 `cloneDeep(partsList)`，导致大纲与编辑器引用不一致（已产生 Bug）
3. **渲染 key 不合法**：`v-for` 使用 `index` 作为 `key`，增删排序时组件状态错乱
4. **无撤销重做**：误操作（粘贴、删除、拖拽）不可恢复
5. **工具函数散落**：`findParentNode`、`processPartData`、`generatePartData` 等工具直接内联在组件文件中
6. **剪贴板逻辑臃肿**：ClipboardService 外，还有 200+ 行的 copy/paste/validate/clear 逻辑在主文件
7. **API 风格不统一**：Options API 和箭头函数混用，`this` 指向依赖复杂

---

## 二、总体策略：三步走

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  第一步：Composition API 重构（当前工程内，零风险）                            │
│  ────────────────────────────────────────────────────────────               │
│  目标：代码质量优化，不改变技术栈和外部依赖                                      │
│  时间：2-3 天                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  第二步：状态管理升级 + 功能增强（当前工程内，低风险）                           │
│  ────────────────────────────────────────────────────────────               │
│  目标：引入 Pinia，增强编辑器核心能力（撤销、大纲拖拽、标尺）                     │
│  时间：1-2 周                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  第三步：微前端拆分（仅在明确业务需求时执行）                                    │
│  ────────────────────────────────────────────────────────────               │
│  目标：对外输出编辑器能力，或供多系统复用                                        │
│  时间：1-2 月                                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 为什么不直接升级到 Vue 3？

| 因素 | 分析 |
|------|------|
| 组件库迁移成本 | Element UI 2 → Element Plus，模板语法差异大（`visible.sync` → `v-model`、`size="mini"` → `size="small"`），需全量重写 UI 层 |
| 跨工程依赖 | `card-cell-editor` 深度依赖 `src/pages/datav/`、`src/components/common/`（如 `simple-update`、`CardCellPartWithoutCardGroup`），拆分意味着维护两套公共库 |
| 构建工具差异 | Vue CLI 3（Webpack 4）→ Vite，构建配置、环境变量、代理规则、插件生态全不同 |
| 团队成本 | 同时维护 Vue 2 主工程和 Vue 3 独立工程，人力投入翻倍 |
| Vue 2.7 红利 | Vue 2.7 已内置 Composition API，可以覆盖 80% 的代码质量优化需求，无需升级 Vue 3 |

**结论**：Vue 2.7 的 Composition API 已足够支撑第一步和第二步的所有优化目标。只有在"对外输出编辑器"或"多系统复用"的明确战略需求下，才考虑第三步的微前端拆分。

---

## 三、第一步：Composition API 重构（详细方案）

### 3.1 目标

- 将 `card-cell-editor.vue` 从 2685 行精简到 800 行以内
- 提取 3 个 Composable（可复用逻辑单元）
- 子组件全面改用 `<script setup>`
- 修复已知的渲染和同步 Bug

### 3.2 文件结构调整

```
card-cell-editor/
├── card-cell-editor.vue          # 精简后的主组件（~800 行）
├── components/
│   ├── CardPart.vue              # <script setup> 重构
│   ├── propertyEditor.vue        # <script setup> 重构
│   └── CardCell.vue              # 无需改动
├── composables/                  # 【新增】可复用逻辑
│   ├── useClipboard.js           # 剪贴板操作（复制/粘贴/校验）
│   ├── usePartTree.js            # 部件树操作（查找/处理/生成）
│   └── useHistory.js             # 撤销重做（快照栈）
├── services/
│   └── ClipboardService.js       # 已有，保持不变
├── docs/
│   └── optimization-plan.md      # 本文档
└── utils/                        # 【新增】纯工具函数
    └── index.js                  # deepClone、generateUniqueId 等
```

### 3.3 提取 `useClipboard`（剪贴板 Composable）

#### 3.3.1 职责范围

| 方法 | 说明 | 来源 |
|------|------|------|
| `copyPart(part)` | 复制单个部件到剪贴板 | `handleCopyPart` 后半段 |
| `copyAllParts(partsList)` | 复制全部部件 | `handleCopyPart` 前半段 |
| `getClipboardData()` | 读取并校验剪贴板 | `getClipboardData` |
| `validateClipboardData(data)` | 校验 _isCardPart 标记 | `_validateClipboardData` |
| `clearClipboardMarkers(data)` | 清除校验标记 | `_clearClipboardMarkers` |
| `filterStyleNo(data)` | 递归过滤 style_no | `_filterStyleNo` |
| `hasContent` (ref) | 是否有可粘贴内容（响应式）| `hasClipboardContent` |

#### 3.3.2 接口设计

```javascript
// composables/useClipboard.js
import { ref } from 'vue'
import clipboardService from '../services/ClipboardService'

export function useClipboard() {
  const hasContent = ref(false)

  async function copyPart(part) { ... }
  async function copyAllParts(partsList) { ... }
  async function getClipboardData() { ... }
  function validateClipboardData(data) { ... }
  function clearClipboardMarkers(data) { ... }
  function filterStyleNo(data) { ... }
  function syncHasContent() { ... }

  return {
    hasContent,
    copyPart,
    copyAllParts,
    getClipboardData,
    validateClipboardData,
    clearClipboardMarkers,
    filterStyleNo,
    syncHasContent,
  }
}
```

### 3.4 提取 `usePartTree`（部件树 Composable）

#### 3.4.1 职责范围

| 方法 | 说明 |
|------|------|
| `findParentNode(list, target)` | 查找父节点 |
| `findOriginalPart(partsList, target)` | 从原始列表中查找引用 |
| `processPartData(part)` | 处理部件数据（复制/新增）|
| `generatePartData(part)` | 生成新部件（打 _editType/add 标记）|
| `setupPartInfo(part, parent, index)` | 设置 seq 和 parent_no |
| `isSamePart(part1, part2)` | 判断是否为同一部件 |
| `processChildren(children, processFn)` | 递归处理子部件 |

#### 3.4.2 接口设计

```javascript
// composables/usePartTree.js
export function usePartTree() {
  function findParentNode(list, targetPart) { ... }
  function findOriginalPart(partsList, target) { ... }
  function processPartData(part) { ... }
  function generatePartData(part) { ... }
  function setupPartInfo(part, parent, index) { ... }
  function isSamePart(part1, part2) { ... }
  function processChildren(children, processFn) { ... }

  return {
    findParentNode,
    findOriginalPart,
    processPartData,
    generatePartData,
    setupPartInfo,
    isSamePart,
    processChildren,
  }
}
```

### 3.5 提取 `useHistory`（撤销重做 Composable）

#### 3.5.1 职责范围

| 方法 | 说明 |
|------|------|
| `push(partsList, selectedPartId)` | 压入快照 |
| `undo()` | 撤销一步，返回上一状态 |
| `redo()` | 重做一步 |
| `canUndo` (computed) | 是否可以撤销 |
| `canRedo` (computed) | 是否可以重做 |
| `clear()` | 清空历史 |

#### 3.5.2 接口设计

```javascript
// composables/useHistory.js
import { ref, computed } from 'vue'
import cloneDeep from 'lodash/cloneDeep'

const MAX_HISTORY = 50

export function useHistory() {
  const stack = ref([])
  const index = ref(-1)

  const canUndo = computed(() => index.value > 0)
  const canRedo = computed(() => index.value < stack.value.length - 1)

  function push(partsList, selectedPartId) { ... }
  function undo() { ... }
  function redo() { ... }
  function clear() { ... }

  return {
    stack,
    index,
    canUndo,
    canRedo,
    push,
    undo,
    redo,
    clear,
  }
}
```

#### 3.5.3 集成方式

在主组件中，每次对 `partsList` 做 mutation 前自动 `push`：

```javascript
// 关键 mutation 点：
// 1. 拖拽添加部件
// 2. 复制/粘贴部件
// 3. 删除部件
// 4. 移动部件

function addPart(newPart) {
  history.push(partsList.value, selectedPartId.value)
  partsList.value.push(newPart)
}
```

绑定快捷键：`Ctrl+Z` / `Ctrl+Y`（或 `Ctrl+Shift+Z`）。

### 3.6 `CardPart.vue` 重构为 `<script setup>`

#### 3.6.1 改动点

- `props` → `defineProps`
- `$emit` → `defineEmits`
- `computed` → `computed()`
- `methods` → 普通函数
- 去掉 `this.` 引用

#### 3.6.2 模板层优化

- `v-for` 的 `key` 改用 `childPart._id || childPart.id`（不再用 `childIndex`）
- `contextMenuItems` computed 保留，但简化为纯函数

### 3.7 `propertyEditor.vue` 重构为 `<script setup>`

#### 3.7.1 改动点

- `props` → `defineProps`
- `$emit` → `defineEmits`
- `data` → `ref`/`reactive`
- `computed` → `computed()`
- `methods` → 普通函数

#### 3.7.2 模板层优化

- 移除 `:key="card_parts_no"` 强制重建，改为 `watch(currentCell)` 平滑切换
- 添加未保存修改提示（可选）

### 3.8 主文件 `card-cell-editor.vue` 精简

#### 3.8.1 删除/迁移的内容

| 内容 | 迁移目标 |
|------|----------|
| `CONSTANTS` | 保留在文件顶部（常量不需提取）|
| `utils.deepClone` | `utils/index.js` |
| `utils.generateUniqueId` | `utils/index.js` |
| `utils.processChildren` | `usePartTree.processChildren` |
| `utils.findParentNode` | `usePartTree.findParentNode` |
| `utils.processPartData` | `usePartTree.processPartData` |
| `utils.generatePartData` | `usePartTree.generatePartData` |
| `utils.setupPartInfo` | `usePartTree.setupPartInfo` |
| `handleCopyPart` | `useClipboard.copyPart` / `copyAllParts` |
| `handlePastePart` | `useClipboard.getClipboardData` + 本地逻辑 |
| `getClipboardData` | `useClipboard.getClipboardData` |
| `_validateClipboardData` | `useClipboard.validateClipboardData` |
| `_clearClipboardMarkers` | `useClipboard.clearClipboardMarkers` |
| `_filterStyleNo` | `useClipboard.filterStyleNo` |
| `isSamePart` | `usePartTree.isSamePart` |
| `findOriginalPart` | `usePartTree.findOriginalPart` |
| `handleKeyDown` 中的 delete 逻辑 | 保留在主文件中（涉及 UI 交互）|

#### 3.8.2 保留在主文件中的内容

- 生命周期钩子（`created`、`mounted`、`beforeDestroy`）
- DOM 事件监听（`keydown`、`storage`）
- `selectPart`、`deletePart` 等直接操作 UI 的方法
- 主题切换、预览等 UI 层逻辑
- 拖拽相关逻辑（`onDragStart`、`onDrop` 等）

#### 3.8.3 Bug 修复

| Bug | 修复方式 |
|-----|----------|
| `outlineTree` 深拷贝导致引用不一致 | `outlineTree` 直接 `return this.partsList`（el-tree 只读渲染，不需要深拷贝）|
| `v-for key="index"` | 改为 `:key="part._id || part.id"` |
| 保存后 `selectedPart` 引用失效 | 保存后根据 `card_parts_no` 重新定位选中部件 |

### 3.9 验收标准

- [ ] `card-cell-editor.vue` 行数 < 800
- [ ] `composables/` 目录下存在 3 个文件
- [ ] `CardPart.vue` 和 `propertyEditor.vue` 使用 `<script setup>`
- [ ] `outlineTree` 不再使用 `cloneDeep`
- [ ] `v-for` 使用唯一标识作为 `key`
- [ ] 复制/粘贴/删除/拖拽功能正常
- [ ] 大纲选中、删除、粘贴功能正常（引用一致）

---

## 四、第二步：状态管理升级 + 功能增强（详细方案）

### 4.1 目标

- 引入 Pinia 替代 Vuex 3 管理编辑器状态
- 实现撤销重做（Undo/Redo）
- 大纲支持拖拽排序
- 接入画布标尺
- 路由懒加载减少主包体积

### 4.2 引入 Pinia

#### 4.2.1 安装

```bash
npm install pinia@2
# Pinia 2 兼容 Vue 2.7
```

#### 4.2.2 主入口注册

```javascript
// main.js
import { createPinia } from 'pinia'

Vue.use(createPinia())
```

#### 4.2.3 Store 设计

```javascript
// stores/cardEditor.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import cloneDeep from 'lodash/cloneDeep'

export const useCardEditorStore = defineStore('cardEditor', () => {
  // State
  const partsList = ref([])
  const selectedPartId = ref(null)
  const cardInfo = ref(null)
  const cardNo = ref('')
  const isDarkMode = ref(false)

  // Getters
  const selectedPart = computed(() => findPartById(partsList.value, selectedPartId.value))
  const partMap = computed(() => buildPartMap(partsList.value))
  const outlineTree = computed(() => partsList.value)

  // Actions
  function init(cardNoValue) { ... }
  function selectPart(part) { ... }
  function addPart(newPart, parentId = null) { ... }
  function removePart(part) { ... }
  function movePart(part, direction) { ... }
  function updatePart(partId, updates) { ... }
  function setPartsList(list) { ... }
  function toggleDarkMode() { ... }

  return {
    partsList, selectedPartId, selectedPart, cardInfo, cardNo, isDarkMode,
    partMap, outlineTree,
    init, selectPart, addPart, removePart, movePart, updatePart,
    setPartsList, toggleDarkMode,
  }
})
```

### 4.3 撤销重做深度集成

#### 4.3.1 与 Pinia 集成

在 Store 的每个 mutation Action 中自动 `pushHistory`：

```javascript
function addPart(newPart, parentId = null) {
  history.push(cloneDeep(partsList.value), selectedPartId.value)
  // ... 实际添加逻辑
}

function undo() {
  const snapshot = history.undo()
  if (snapshot) {
    partsList.value = snapshot.partsList
    selectedPartId.value = snapshot.selectedPartId
  }
}

function redo() {
  const snapshot = history.redo()
  if (snapshot) {
    partsList.value = snapshot.partsList
    selectedPartId.value = snapshot.selectedPartId
  }
}
```

#### 4.3.2 UI 反馈

- 撤销/重做按钮添加到顶部工具栏（disabled 状态根据 `canUndo`/`canRedo`）
- `Ctrl+Z` / `Ctrl+Shift+Z` 绑定到编辑器容器

### 4.4 大纲拖拽排序

#### 4.4.1 方案

利用已安装的 `vuedraggable`：

```vue
<!-- card-cell-editor.vue -->
<el-tree ...>
  <template #default="{ node, data }">
    <draggable 
      :list="node.childNodes" 
      :group="{ name: 'outline-parts' }"
      @end="onOutlineDrop($event, data)"
    >
      <!-- 树节点内容 -->
    </draggable>
  </template>
</el-tree>
```

#### 4.4.2 拖拽后更新

```javascript
function onOutlineDrop(event, parentData) {
  // 更新 seq 值
  const children = parentData.children || partsList.value
  children.forEach((child, index) => {
    child.seq = (index + 1) * 100
  })
  history.push(cloneDeep(partsList.value), selectedPartId.value)
}
```

### 4.5 画布标尺（vue-sketch-ruler）

已安装但未使用，接入方式：

```vue
<template>
  <sketch-rule
    :scale="scale"
    :width="editorWidth"
    :height="editorHeight"
  >
    <div class="editor-content">...</div>
  </sketch-rule>
</template>
```

配合缩放控制（`Ctrl+滚轮`、`Ctrl++/-`）。

### 4.6 路由懒加载

```javascript
// router/index.js
{
  path: '/card-cell-editor/:cardNo',
  name: 'cardCellEditor',
  component: () => import('@/pages/lowcode/card-cell-editor/card-cell-editor.vue'),
  meta: { title: '卡片单元编辑器' }
}
```

### 4.7 验收标准

- [ ] Pinia Store 正常工作，状态响应式
- [ ] 撤销重做支持所有 mutation 操作
- [ ] 大纲支持拖拽调整顺序和层级
- [ ] 画布显示标尺，支持缩放
- [ ] 路由懒加载生效，首屏 chunk 减小

---

## 五、第三步：微前端拆分（仅在明确需求时执行）

### 5.1 触发条件

以下任一条件满足时，启动第三步：

1. **对外输出**：需要将卡片编辑器作为独立 SaaS 产品对外提供
2. **多系统复用**：其他业务系统（如小程序编辑器、H5 编辑器）需要复用卡片编辑器
3. **团队规模扩大**：有专职团队维护编辑器，与主工程团队分离

### 5.2 技术方案：微前端（qiankun）

```
┌─────────────────────────────────────────────────────────────┐
│                    主应用（Vue 2 + Element UI）               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ 低代码设计器 │  │ 报表设计器   │  │ card-cell-editor   │  │
│  │             │  │             │  │ (iframe / 微前端)   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                      ↓
              ┌─────────────────┐
              │ 微前端容器        │
              │ (qiankun)        │
              └─────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│                子应用（Vue 3 + Element Plus + Vite）         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │            卡片单元编辑器（独立仓库）                   │    │
│  │  Vue 3 · Vite · Pinia · Element Plus · TypeScript   │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 子应用技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.4+ | 最新稳定版 |
| Vite | 5.x | 构建工具 |
| Element Plus | 2.x | Vue 3 配套组件库 |
| Pinia | 2.x | 状态管理 |
| TypeScript | 5.x | 类型安全 |
| Vitest | 1.x | 单元测试 |
| vue-sketch-ruler | 最新 | 画布标尺 |
| vuedraggable | 4.x (Vue 3 版) | 拖拽排序 |

### 5.4 通信协议

主应用通过 `props` 传入：

```javascript
// 主应用
<micro-app
  name="cardCellEditor"
  url="//card-editor.example.com"
  :data="{ cardNo: 'CARD001', token: authToken }"
  @datachange="onEditorSave"
/>
```

子应用通过 `window.microApp.dispatch` 回调：

```javascript
// 子应用
window.microApp.dispatch({ type: 'save', cardNo, partsList })
window.microApp.dispatch({ type: 'close' })
```

### 5.5 公共组件共享

| 方案 | 说明 |
|------|------|
| npm 包 | 将 `simple-update`、`CardCellPartWithoutCardGroup` 等封装为 `@bx/common-components`，主/子应用都依赖 |
| git submodule | 公共组件放在独立仓库，子应用通过 submodule 引用 |
| 接口代理 | 子应用不依赖公共组件，而是通过 REST/GraphQL 调用主应用的服务接口 |

推荐 **npm 包** 方案，版本管理清晰。

### 5.6 迁移步骤

| 阶段 | 任务 | 时间 |
|------|------|------|
| 准备期 | 提取公共组件为 npm 包；搭建子应用脚手架 | 2 周 |
| 开发期 | 重写子应用（Vue 3 + Element Plus）；功能对齐 | 4-6 周 |
| 联调期 | 微前端接入；通信协议联调；主题同步 | 2 周 |
| 灰度期 | A/B 测试；部分流量切到子应用 | 1 周 |
| 全量期 | 主应用移除旧代码；子应用独立部署 | 1 周 |

### 5.7 验收标准

- [ ] 子应用可独立运行、独立部署
- [ ] 主应用通过微前端无缝嵌入子应用
- [ ] 通信协议（props 传入、事件回调）稳定
- [ ] 主题（暗黑/亮色）同步
- [ ] 性能不低于旧版本（LCP < 2s）

---

## 六、风险与应对

| 风险 | 概率 | 影响 | 应对 |
|------|------|------|------|
| Composition API 重构引入 Bug | 中 | 高 | 每改动一个模块就完整测试对应功能；保持 git commit 粒度小 |
| Pinia 与 Vuex 3 共存冲突 | 低 | 中 | Pinia 和 Vuex 可以共存，但建议新模块用 Pinia，旧模块逐步迁移 |
| Element UI 2 组件与 `<script setup>` 兼容问题 | 低 | 中 | Vue 2.7 完全兼容 `<script setup>`，Element UI 无需改动 |
| 撤销重做占用内存过大 | 中 | 中 | 限制历史栈深度（MAX_HISTORY = 50）；只保存 partsList 的 diff |
| 团队成员不熟悉 Composition API | 中 | 低 | 提供 Code Review 模板；编写 composable 使用文档 |

---

## 七、附录

### 7.1 相关文件清单

| 文件 | 角色 | 第一步改动 |
|------|------|-----------|
| `card-cell-editor.vue` | 主组件 | 精简，提取逻辑到 composables |
| `components/CardPart.vue` | 部件渲染 | `<script setup>` 重构 |
| `components/propertyEditor.vue` | 属性面板 | `<script setup>` 重构 |
| `components/CardCell.vue` | 预览组件 | 无需改动 |
| `services/ClipboardService.js` | 剪贴板服务 | 无需改动 |
| `composables/useClipboard.js` | 【新增】剪贴板逻辑 | 新建 |
| `composables/usePartTree.js` | 【新增】部件树逻辑 | 新建 |
| `composables/useHistory.js` | 【新增】撤销重做 | 新建 |
| `utils/index.js` | 【新增】纯工具函数 | 新建 |

### 7.2 参考资源

- [Vue 2.7 Composition API 文档](https://v2.vuejs.org/v2/guide/composition-api-introduction.html)
- [Pinia 2 for Vue 2](https://pinia.vuejs.org/zh/introduction.html)
- [qiankun 微前端框架](https://qiankun.umijs.org/)
- [Element Plus 迁移指南](https://element-plus.org/zh-CN/guide/migration.html)

---

> 文档维护：每次代码变更后同步更新本文档的"验收标准"和"附录"部分。
