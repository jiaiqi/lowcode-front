<template>
  <div
    class="nav-sub-menu"
    v-if="label"
    :style="[navStyle, isHovered ? mixHoverStyle : {}]"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    ref="navMenu"
  >
    <!-- 站内直达（原页面、无拦截）：router-link 渲染 a 标签（支持中键新标签/链接语义）；
         站外/新窗口/先登录等场景保持 span@click 原逻辑 -->
    <router-link
      v-if="internalRoute"
      :to="internalRoute"
      class="nav-menu-label"
    >
      <img
        class="nav-icon"
        :src="getImagePath(calcNavIcon)"
        alt=""
        v-if="calcNavIcon"
        :style="[setNavIconStyle]"
      />
      <span>{{ label }}</span>
    </router-link>
    <span v-else class="nav-menu-label" @click.stop.capture="navTo(jumpJson)">
      <img
        class="nav-icon"
        :src="getImagePath(calcNavIcon)"
        alt=""
        v-if="calcNavIcon"
        :style="[setNavIconStyle]"
      />
      <span>{{ label }}</span>
    </span>
    <div
      class="nav-menu-child"
      :class="{ active: isHovered }"
      :style="[isHovered ? childPositionStyle : {}]"
      v-if="subMenu && subMenu.length"
    >
      <nav-menu-child
        v-for="(item, index) in subMenu"
        :key="index"
        :config="item"
        :parent-style="navStyle"
        :parent-hover-style="mixHoverStyle"
        :nav-icon-style="navIconStyle"
        :nav-icon-selected-style="navIconSelectedStyle"
        :parent-config="config"
      ></nav-menu-child>
    </div>
  </div>
</template>

<script>
export default {
  name: "NavMenuChild",
};
</script>

<script setup>
import { computed, getCurrentInstance, onMounted, reactive, ref } from "vue";
import { formatStyleData } from "@/pages/lowcode/common/index.js";
import { parseJumpJson, resolveInternalRoute, navToJump } from "./nav-jump";
const props = defineProps({
  config: Object,
  parentStyle: Object,
  parentHoverStyle: Object,
  navIconStyle: Object,
  navIconSelectedStyle: Object,
});
const label = computed(() => {
  return props.config.label;
});
const navStyle = computed(() => {
  let style = {};
  if (props.config?.nav_style_json) {
    style = formatStyleData(props.config.nav_style_json);
  }
  if (props.parentStyle) {
    style = { ...props.parentStyle, ...style };
  }
  return style;
});
const subMenu = computed(() => {
  let json = props.config?.sub_json;
  if (json && typeof json === "string") {
    try {
      json = JSON.parse(json);
    } catch (error) {
      console.error(error);
    }
  }
  if (!Array.isArray(json)) {
    return [];
  }
  return json.filter((item) => item.disp_flag !== "否");
});
const mixHoverStyle = computed(() => {
  let style = {};
  if (props.config?.seleted_style_json) {
    style = formatStyleData(props.config.seleted_style_json);
  }
  if (props.parentHoverStyle) {
    style = { ...props.parentHoverStyle, ...style };
  }
  return style;
});

const navIconStyle = computed(() => {
  let style = {};
  if (props.config?.nav_icon_style_json) {
    style = formatStyleData(props.config.nav_icon_style_json);
  }
  if (props.navIconStyle) {
    style = { ...props.navIconStyle, ...style };
  }
  return style;
});

const navIconSelectedStyle = computed(() => {
  let style = {};
  if (props.config?.nav_icon_selected_style_json) {
    style = formatStyleData(props.config.nav_icon_selected_style_json);
  }
  if (props.navIconSelectedStyle) {
    style = { ...props.navIconSelectedStyle, ...style };
  }
  return style;
});

const setNavIconStyle = computed(() => {
  let style = { ...navIconStyle.value };
  if (isHovered.value || props.config?.isCurrentNav) {
    style = { ...style, ...navIconSelectedStyle.value };
  }
  return style;
});

const calcNavIcon = computed(() => {
  if ((isHovered.value || props.config?.isCurrentNav) && props.config?.nav_icon_selected) {
    return props.config.nav_icon_selected;
  }
  return props.config?.nav_icon;
});

const isHovered = ref(false);

const mixNavStyle = computed(() => {
  let style = {};
  if (props.config?.nav_style_json) {
    style = formatStyleData(props.config.nav_style_json);
  }
  if (props.parentStyle) {
    style = { ...props.parentStyle, ...style };
  }
  if (isHovered.value && mixHoverStyle.value) {
    style = { ...style, ...mixHoverStyle.value };
  }
  return style;
});

const position = reactive({
  top: 0,
  left: 0,
  width: 0,
  height: 0,
});

const childPositionStyle = computed(() => {
  return {
    // top: position.top + "px",
    top: 0,
    right: 0,
    width: position.width || 150 + "px",
    // height: "unset",
  };
});

const jumpJson = computed(() => {
  return parseJumpJson(props.config);
});

/**
 * 站内直达路由目标（router-link 使用）
 * @description 仅"原页面 + 站内 + 无登录拦截"的跳转生成 router-link 目标，
 *              其余场景（外部页面/新窗口/先登录/无跳转）返回 null，保持原点击逻辑
 */
const internalRoute = computed(() => {
  return resolveInternalRoute(jumpJson.value);
});

const proxy = getCurrentInstance().proxy;

function navTo(jumpConfig) {
  // 统一走共享工具：登录拦截 → 外部页面 / 锚点 / 站内 SPA
  navToJump(proxy, jumpConfig);
}

const navMenu = ref("");
function setEleSize() {
  const ele = navMenu.value;
  if (ele) {
    const { top, left, width, height } = ele.getBoundingClientRect();
    position.top = top;
    position.left = left;
    position.width = width;
    position.height = height;
  }
}
onMounted(() => {
  setEleSize();
  setTimeout(() => {
    setEleSize();
  }, 1000);
});
</script>

<style lang="scss" scoped>
.nav-sub-menu {
  display: flex;
  justify-content: center;
  align-items: center;
  // height: 100%;
  cursor: pointer;
  z-index: 99;
  .nav-menu-label {
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    .nav-icon {
      width: 1rem;
      height: 1em;
      display: inline-block;
      color: currentColor;
    }
  }
  .nav-menu-child {
    position: absolute;
    width: 100%;
    z-index: -1;
    transition: all 0.3s ease-in-out;
    height: 0;
    transform: translateX(0);
    overflow: hidden;
    &.active {
      height: unset;
      overflow: unset;
      z-index: 99;
      transform: translateX(100%);
    }
  }
}
</style>
