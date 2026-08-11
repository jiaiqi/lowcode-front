<template>
  <div
    class="nav-menu-child"
    :class="{ active: isHovered }"
    :style="[isHovered ? childPositionStyle : {}]"
    v-if="subMenu && subMenu.length"
    @mouseleave="hideSubMenu"
    v-clickoutside="hideSubMenu"
  >
    <nav-sub-menu
      v-for="(item, index) in subMenu"
      :key="index"
      :config="item"
      :parent-style="mixNavStyle"
      :parent-hover-style="mixHoverStyle"
      :nav-icon-style="navIconStyle"
      :nav-icon-selected-style="navIconSelectedStyle"
    ></nav-sub-menu>
  </div>
</template>

<script>
import { formatStyleData } from "@/pages/lowcode/common/index.js";
// import NavSubMenu from "./nav-menu-child.vue";
// import NavMenu from "./nav-menu.vue";
import clickoutside from "@/pages/lowcode/common/clickoutside.js";
import { parseJumpJson, navToJump } from "./nav-jump";
export default {
  name: "NavMenuChild",
  components: {
    NavSubMenu:()=>import("./nav-menu-child.vue"),
    // NavSubMenu:()=>import("./nav-menu.vue"),
    // NavMenu,
  },
  directives: {
    clickoutside: clickoutside,
  },
  props: {
    config: Object,
    parentConfig: Object,
    pageConfig: Object,
    parentStyle: Object,
    isHovered: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      position: {
        top: 0,
        left: 0,
        width: 0,
        height: 0,
      },
    };
  },
  computed: {
    contentWidth() {
      let width = this.pageConfig?.content_area_width;
      if (width) {
        if (!isNaN(Number(width))) {
          return Number(width) + "px";
        } else {
          return width;
        }
      }
    },
    viewMode() {
      return this.config?.view_mode;
    },
    label() {
      return this.config.label;
    },
    navStyle() {
      let style = {};
      if (this.config?.nav_style_json) {
        style = formatStyleData(this.config.nav_style_json);
      }
      return style;
    },
    subMenu() {
      let json = this.config?.sub_json;
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
    },
    mixHoverStyle() {
      let style = {};
      if (this.config?.seleted_style_json) {
        style = formatStyleData(this.config.seleted_style_json);
      }
      return style;
    },
    mixNavStyle() {
      let style = {};
      if (this.config?.nav_style_json) {
        style = formatStyleData(this.config.nav_style_json);
      }
      if (this.parentStyle) {
        style = { ...this.parentStyle, ...style };
      }
      if (this.isHovered && this.mixHoverStyle) {
        style = { ...style, ...this.mixHoverStyle };
      }
      return style;
    },
    navIconStyle() {
      let style = {};
      if (this.config?.nav_icon_style_json) {
        style = formatStyleData(this.config.nav_icon_style_json);
      }
      return style;
    },
    navIconSelectedStyle() {
      let style = {};
      if (this.config?.nav_icon_selected_style_json) {
        style = formatStyleData(this.config.nav_icon_selected_style_json);
      }
      return style;
    },
    setLabelStyle() {
      if (typeof this.mixNavStyle === "object") {
        let style = { ...this.mixNavStyle };
        if (style["height"]) {
          delete style["height"];
        }
        return style;
      }
    },
    childPositionStyle() {
      return {
        // top: this.position.height + this.position.top + "px",
        // left: this.position.left + "px",
        // width: this.position.width + "px",
      };
    },
    jumpJson() {
      return parseJumpJson(this.config);
    },
  },
  mounted() {
    // document.body.querySelector('#content').appendChild(this.$el);
    this.setEleSize();
    setTimeout(() => {
      this.setEleSize();
    }, 1000);
    window.addEventListener("scroll", this.listenOnScroll);
  },
  beforeDestroy() {
    // document.body.querySelector('#content').removeChild(this.$el);
    window.removeEventListener("scroll", this.listenOnScroll);
  },
  methods: {
    listenOnScroll() {
      this.hideSubMenu()
    },
    hideSubMenu() {
      this.$emit("leave", false);
    },
    navTo(jumpConfig) {
      // 统一走共享工具：登录拦截 → 外部页面 / 锚点 / 站内 SPA
      navToJump(this, jumpConfig);
    },
    setEleSize() {
      const ele = this.$parent.$refs?.navMenu;
      if (ele) {
        const { top, left, width, height } = ele.getBoundingClientRect();
        this.position.top = top;
        this.position.left = left;
        this.position.width = width;
        this.position.height = height;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.nav-menu-child {
  // position: absolute;
  transition: all 0.3s ease-in-out;
  height: 0;
  overflow: hidden;
  z-index: -1;
  width: 100%;
  
  &.active {
    height: auto;
    overflow: unset;
    z-index: 999;
  }
}
</style>
