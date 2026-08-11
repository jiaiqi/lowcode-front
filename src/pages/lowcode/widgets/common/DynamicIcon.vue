<template>
  <!-- 优先 unocss 内联图标（零 JS/网络开销）；safelist 未覆盖时本地 SVG 渲染 -->
  <span
    v-if="!fallback"
    :class="iconClass"
    :style="style"
  ></span>
  <svg
    v-else-if="iconData"
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="`0 0 ${iconData.width} ${iconData.height}`"
    fill="currentColor"
    :style="style"
  >
    <path :d="iconData.body"></path>
  </svg>
</template>

<script>
import { isIconSafelisted } from "./icon-safelist.js";
import { ensureCollection, parseIconName, getIconData } from "./icon-store.js";

/**
 * 动态图标组件：统一 icon 名（"ep:close" / "ri-home-4-fill"）渲染
 * @description 优先 unocss presetIcons 内联 class（i- 前缀，编译期生成）；
 *              不在 safelist 时从本地集合 JSON 取 SVG body 直接渲染
 *              （icon-store，零网络请求，离线可用）
 */
export default {
  name: "DynamicIcon",
  props: {
    icon: { type: String, default: "" },
    size: { type: [String, Number], default: "" },
    color: { type: String, default: "" },
  },
  data() {
    return { fallback: false, iconData: null };
  },
  computed: {
    /** "ep:close" / "ri-bar-chart-fill" → "i-ep-close" / "i-ri-bar-chart-fill"（unocss class 命名规则） */
    iconClass() {
      const name = String(this.icon || "").trim();
      if (!name) return "";
      // 带冒号格式：ep:close → i-ep-close
      if (name.includes(":")) {
        return "i-" + name.replace(/:/g, "-");
      }
      // 无冒号格式（ri-xxx / ep-xxx 等）：直接拼 i- 前缀；
      // 非已知图标集合名（如"竖线"/组件名等非图标值）返回空
      if (!/^(ri|ep|mdi|mdi-light|carbon|material-symbols|ph|tabler|solar|fluent)-/i.test(name)) {
        return "";
      }
      return "i-" + name;
    },
    style() {
      const s = {};
      if (this.size) {
        const px = /^\d+$/.test(String(this.size)) ? this.size + "px" : this.size;
        s.fontSize = px;
        s.width = px;
        s.height = px;
      }
      if (this.color) s.color = this.color;
      return s;
    },
  },
  mounted() {
    // 不在 unocss safelist（运行时配置新增）→ 本地集合加载 + SVG 渲染
    if (this.icon && !isIconSafelisted(this.icon)) {
      this.fallback = true;
      const parsed = parseIconName(this.icon);
      if (parsed) {
        ensureCollection(parsed.prefix).then(() => {
          this.iconData = getIconData(this.icon);
        });
      }
    }
  },
};
</script>
