import { defineConfig, presetIcons } from "unocss";
import { ICON_SAFELIST } from "./src/pages/lowcode/widgets/common/icon-safelist.js";

/**
 * 图标方案：unocss presetIcons 内联（首屏零图标 JS 下载）。
 * - 静态图标（代码中写死的 class）→ 编译期扫描自动生成
 * - 动态/数据驱动图标 → safelist 显式声明（与 DynamicIcon 共享 icon-safelist.js）
 * - safelist 未覆盖的图标由 DynamicIcon 回退 @iconify/vue2 按需加载
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
  safelist: ICON_SAFELIST.map((name) => "i-" + name),
});
