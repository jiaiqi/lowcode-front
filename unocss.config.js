import { defineConfig, presetIcons } from "unocss";

/**
 * 图标方案：unocss presetIcons 内联静态图标（首屏零图标 JS 下载）。
 * - 静态图标（代码中写死的 icon="ep:xxx" 等）→ 编译期生成 CSS mask，无需运行时数据
 * - 动态图标（页面配置运行时提供的图标名）unocss 无法静态扫描，
 *   仍由 @iconify/vue2 运行时按需加载单集合包（见 lowcode-page-mixin 的 ensureIconCollection）
 */
export default defineConfig({
  presets: [
    presetIcons({
      scale: 1.2,
      warn: true,
      extraProperties: {
        display: "inline-block",
        "vertical-align": "middle",
      },
    }),
  ],
  // 仅图标预设，不启用 wind/uno 工具类预设，避免与旧工程同款 tailwind preflight 样式冲突
  safelist: [],
});
