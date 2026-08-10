# 旧工程表单 iframe 嵌入方案

新工程**不引入**旧工程的表单组件（`simple-add` / `simple-update` / `add` / `update` 及其依赖集群），需要表单的场景统一通过 iframe 嵌入旧工程路由页面。

## URL 规则

旧工程为 hash 路由，表单页路由：

| 模式 | URL |
|---|---|
| 新增 | `{legacyFormHost}/#/simple-add/{service}?app={srvApp}` |
| 更新 | `{legacyFormHost}/#/simple-update/{service}/{pk}?app={srvApp}` |
| 通用 | `{legacyFormHost}/#/{mode}/{service}[/{pk}]?app={srvApp}` |

`legacyFormHost` 在 `public/config/config_dev.js` 的 `APP_CONFIG.legacyFormHost` 配置：

```js
window.APP_CONFIG = {
  // ...
  legacyFormHost: "http://localhost:8080", // 旧工程前端入口
};
```

## 组件：LegacyForm

`src/components/common/legacy-form.vue` —— 统一 iframe 包装组件：

```vue
<legacy-form
  mode="simple-add"              <!-- simple-add / simple-update / add / update -->
  service="srvpage_cfg_com_add"  <!-- serviceName -->
  srv-app="config"               <!-- mapp -->
  pk="123"                       <!-- 更新模式的主键 -->
  @form-loaded="..."             <!-- iframe 加载完成 -->
  @executor-complete="..."       <!-- postMessage 提交结果 -->
/>
```

## 事件协议（提交结果通知）

旧工程表单**提交成功后**向父窗口 postMessage：

```js
// 旧工程表单组件提交成功回调中
window.parent.postMessage(
  {
    type: "LEGACY_FORM_DONE",
    success: true,
    data: { /* 提交结果 */ },
  },
  "*" // 生产建议指定目标 origin
);
```

新工程 `legacy-form.vue` 监听该事件并转发 `executor-complete`。

> **当前状态**：旧工程尚未加 postMessage 支持，`executor-complete` 不会触发；父级联动（如列表刷新）依赖 `form-loaded`（iframe 加载完成）或手动刷新。后续在旧工程表单组件提交成功后补发 postMessage 即可接通。

## 已改造的引用点

| 文件 | 原组件 | 现状 |
|---|---|---|
| `widgets/form/add.vue` | simple-add（动态表单 widget） | LegacyForm（渲染页表单） |
| `widgets/list/list.vue` | simple-add（新增弹窗） | LegacyForm |
| `components/property/index.vue` | simple-update/add × 3（属性面板） | LegacyForm（占位，联动降级） |
| `card-cell-editor/components/propertyEditor.vue` | simple-update × 2 | LegacyForm |
| `editor/mobile/app-materials/property/index.vue` | simple-update × 3 | LegacyForm |
| `low-app/app-materials/property/index.vue` | simple-update × 3 | LegacyForm |

## 降级说明（属性面板）

属性面板（编辑器）原表单与面板深度联动（字段值变化实时更新画布）。改为 iframe 后：

- `form-loaded` → iframe 加载完成触发，面板加载态正常
- `field-value-changed` / `action-complete` → 不触发（旧工程未通知），样式列联动等高级功能降级
- 保存后刷新：`executor-complete` 接通 postMessage 后恢复

后续如需完整联动，可在旧工程表单加 postMessage 上报字段变更事件。
