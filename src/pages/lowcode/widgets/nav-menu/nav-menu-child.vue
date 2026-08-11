<template>
  <div
    class="nav-sub-menu"
    v-if="label"
    :style="[navStyle, isHovered ? mixHoverStyle : {}]"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    ref="navMenu"
  >
    <span class="nav-menu-label" @click.stop.capture="navTo(jumpJson)">
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
import { computed, onMounted, reactive, ref } from "vue";
import { formatStyleData } from "@/pages/lowcode/common/index.js";
import { getFullBaseUrl, normalizeJumpFilePath, getRouterPath } from "@/common/common";
import router from "@/router";
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
  if (props.config.jump_json) {
    try {
      return JSON.parse(props.config.jump_json);
    } catch (error) {
      console.error(error);
    }
  }
});

function navTo(jumpConfig) {
  if (jumpConfig?.click_jump_option?.includes("先登录")) {
    if (this.$store.state?.loginInfo?.logined !== true) {
      // 您还未登录,需要登录才能进入,点击确认前往登录
      this.$confirm("您还未登录,需要登录才能进入,点击确认前往登录", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        })
        .then(() => {
          const currentUrl = window.location.pathname + window.location.hash;
          sessionStorage.setItem("login_redirect_url", currentUrl);
          const loginUrl = window.location.origin + "/main/login.html";
          window.location.href = loginUrl;
        });
      return;
    }
  }
  if (jumpConfig?.obj_type) {
    switch (jumpConfig.obj_type) {
      case "外部页面":
        if (jumpConfig.outer_url) {
          if (jumpConfig.target_type == "原页面") {
            window.location.href = jumpConfig.outer_url;
          } else {
            window.open(jumpConfig.outer_url);
          }
        }
        break;
      default:
        if (jumpConfig.dest_page_no) {
          navToPath(jumpConfig);
        }
        break;
    }
  }
}
function navToPath(jump_json) {
  let pageNo = jump_json?.dest_page_no;
  let path = "";
  if (jump_json?.click_jump_option?.includes("先登录")) {
    if (this.$store.state?.loginInfo?.logined !== true) {
      // 您还未登录,需要登录才能进入,点击确认前往登录
      this.$confirm("您还未登录,需要登录才能进入,点击确认前往登录", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        })
        .then(() => {
          const currentUrl = window.location.pathname + window.location.hash;
          sessionStorage.setItem("login_redirect_url", currentUrl);
          const loginUrl = window.location.origin + "/main/login.html";
          window.location.href = loginUrl;
        });
      return;
    }
  }
  if (jump_json?.tmpl_page_json.file_path) {
    path = normalizeJumpFilePath(
      jump_json?.tmpl_page_json.file_path
    ).replace(":pageNo", pageNo);
  } else {
    path = `${getFullBaseUrl()}/lowcode-grid/view/${pageNo}?srvApp=config`;
  }
  if (pageNo) {
    if (jump_json.target_type == "原页面") {
      // 站内路径走 SPA 无刷新跳转；外部链接保持整页跳转
      const routerPath = getRouterPath(path);
      if (routerPath) {
        router.push(routerPath);
      } else {
        window.location.href = path;
      }
    } else {
      window.open(path);
    }
  }
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
