/**
 * unocss 图标 safelist 共享数据
 * @description 构建期（unocss.config.js）与运行时（DynamicIcon）共用：
 *  - unocss 据此生成 safelist 图标的 CSS
 *  - DynamicIcon 据此判断图标是否已内联（命中渲染 class，未命中走 icon-store 本地 SVG）
 * 新增页面配置/编辑器图标时在此补充（格式：无 i- 前缀的图标名，如 "ri-home-4-fill"）
 */
export const ICON_SAFELIST = [
  // 渲染路径静态图标（扫描可覆盖，此处兜底）
  "ep-close",
  "ep-document",
  "ep-download",
  "ri-arrow-drop-right-fill",
  "ri-arrow-up-s-line",
  "ri-arrow-down-s-line",
  "ri-question-line",
  "ri-home-4-fill",
  "ri-arrow-right-s-fill",
  "material-symbols-arrow-menu-close",
  "material-symbols-chevron-right",
  "material-symbols-home",
  // materials.js 组件面板图标
  "ri-bar-chart-fill",
  "ri-function-fill",
  "ri-image-fill",
  "ri-layout-grid-fill",
  "ri-layout-masonry-fill",
  "ri-pencil-fill",
  "ri-radio-button-fill",
  "ri-star-smile-fill",
  "ri-sun-fill",
  "ri-video-on-fill",
  "ri-rectangle-line",
  // OutlineTree 组件类型图标
  "ri-layout-bottom-2-line",
  "ri-layout-4-line",
  "ri-layout-right-2-line",
  "ri-folder-line",
  "ri-slideshow-line",
  "ri-image-line",
  "ri-text",
  "ri-button",
  "ri-input-field",
  "ri-list-check",
  "ri-checkbox-line",
  "ri-radio-button-line",
  "ri-toggle-line",
  "ri-calendar-line",
  "ri-time-line",
  "ri-table-line",
  "ri-pie-chart-line",
  "ri-map-pin-line",
  "ri-video-line",
  "ri-volume-up-line",
  // 编辑器静态/三元图标
  "ri-sun-line",
  "ri-moon-line",
  "ri-moon-fill",
  "ri-arrow-down-s-fill",
  "ri-arrow-right-s-fill",
  // 编辑器布局/工具图标（HeaderView/OutlineTree 等）
  "ri-terminal-box-line",
  "ri-node-tree",
  "ri-dashboard-horizontal-line",
  "ri-external-link-line",
  "ri-computer-line",
  "ri-smartphone-line",
  "mdi-light-eye",
];

/** 图标名（"ep:close" / "ri-home-4-fill"）是否在 safelist 内 */
export function isIconSafelisted(iconName) {
  if (typeof iconName !== "string" || !iconName.trim()) return false;
  const name = iconName.trim();
  // 带冒号格式转无冒号（"ep:close" → "ep-close"）
  const key = name.includes(":") ? name.replace(/:/g, "-") : name;
  return ICON_SAFELIST.includes(key);
}
