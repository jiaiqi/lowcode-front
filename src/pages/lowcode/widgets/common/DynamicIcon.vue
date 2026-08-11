<template>
  <!-- 优先 unocss 内联图标（零 JS/网络开销）；safelist 未覆盖时回退 @iconify/vue2 -->
  <span
    v-if="!fallback"
    :class="iconClass"
    :style="style"
  ></span>
  <Icon
    v-else
    :icon="icon"
    :style="style"
  />
</template>

<script>
import { Icon } from "@iconify/vue2";
import { isIconSafelisted } from "./icon-safelist.js";

/**
 * 动态图标组件：统一 icon 名（"ep:close" / "ri-home-4-fill"）渲染
 * @description 优先使用 unocss presetIcons 内联 class（i- 前缀）；
 *              图标不在 safelist（如页面配置新增图标）时回退
 *              @iconify/vue2 按需加载（见 lowcode-page-mixin 的 ensureIconCollection）
 */
export default {
  name: "DynamicIcon",
  components: { Icon },
  props: {
    icon: { type: String, default: "" },
    size: { type: [String, Number], default: "" },
    color: { type: String, default: "" },
  },
  data() {
    return { fallback: false };
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
    // 图标不在 unocss safelist（运行时配置新增）→ 回退 iconify 按需加载
    if (this.icon && !isIconSafelisted(this.icon)) {
      this.fallback = true;
    }
  },
};
</script>
