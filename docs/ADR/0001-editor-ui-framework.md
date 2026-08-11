# ADR 0001：编辑器 UI 组件库选型（naive-ui）

- **状态**：已接受（2026-08-11）
- **关联**：`docs/NUXT_MIGRATION_PLAN.md` §3.1、§6
- **决策者**：项目负责人（用户拍板）

## 背景

新工程（Nuxt 4 monorepo）的 studio 编辑器需要一套 Vue 3 组件库。渲染层为自研 `runtime-ui`（视觉复刻 element-ui，金标准约束），**不受本决策影响**——本决策仅作用于编辑器外壳（属性面板/材料面板/图层树/弹窗等）。

约束条件：TS strict 全量、schema 驱动属性面板（动态表单为核心高频场景）、3-5 人团队、样式体系已有 SCSS token + unocss、SPA 模式（无 SSR 需求）。

## 决策

- ✅ **studio 编辑器层采用 naive-ui**
- element-plus 作为保守备选（不采用）
- ❌ **否决 shadcn-vue**

## 理由

### 采用 naive-ui

1. **TS 类型质量最佳**：全面泛型、TypeDoc 文档，与"TS strict + 契约先行"工程直接咬合；schema 驱动动态表单场景下类型提示减少返工
2. **现代视觉**：编辑器外观自由（方案 §6 明确），naive-ui 设计语言契合"新工程焕新"目标
3. **天然 tree-shaking**：零配置按需，无样式体系冲突（不引入 CSS-in-JS 或 Tailwind）
4. **控件全覆盖**：n-form/n-table/n-tree/n-color-picker 等编辑器刚需齐备

### 否决 shadcn-vue

1. 强制引入 Tailwind CSS，与现有 unocss 构成双样式体系，增加维护负担
2. 树形组件缺失、日期/颜色选择器薄弱——编辑器刚需需要自建或引三方，违背"简单"原则
3. 组件以源码形式复制进仓库，上游更新需手动合并跟踪（3-5 人团队成本）
4. 其核心优势（代码完全可控、外观极致定制）对**内部工具**价值低；该模式更适合面向用户的产品级设计系统

### 不采用 element-plus（备选）

API 迁移最平滑（element 系惯性），但类型与视觉均为短板；不构成采用理由。若 naive-ui 出现不可控风险（如停止维护），回退路径为 element-plus。

## 后果

**积极**：编辑器开发类型安全；视觉现代化；渲染层金标准不受影响（`runtime-ui` 与 naive-ui 完全隔离）。

**消极/注意**：

- naive-ui 官方 Nuxt 模块（`nuxtjs-naive-ui`，作者 07akioni 维护）面向 **Nuxt 3 + SSR**：核心是 css-render SSR 样式收集，依赖 `@nuxt/kit ^3.11.2`，2024-05 后未更新、未适配 Nuxt 4。本工程为 Nuxt 4 SPA，SSR 分支不生效，模块实际只剩 `build.transpile: ["naive-ui"]` 的价值 → 手动配置 + plugin 注册即可（详见方案 §3.1）
- 团队 element 系经验不能平移，需学习 naive-ui API（中文文档 + TypeDoc 质量高，成本可控）
- 渲染层（`runtime`/`runtime-ui`/`widgets`）禁止依赖 naive-ui，以 lint 规则强制（方案 §11 风险表）

## 复盘触发条件

当出现以下任一情况时重新评估本决策：

- naive-ui 停止维护或发布破坏性大版本
- studio 需要 SSR（当前 SPA 模式不涉及；届时重新评估官方模块 `nuxtjs-naive-ui` 对 Nuxt 4 的适配情况）
- 团队评估"组件源码可控"成为硬需求（内部工具暂不成立）
