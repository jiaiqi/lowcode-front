<template>
  <div
    v-if="viewMode === '文章栏目'"
    class="catalog"
  >
    <div
      v-if="catalogInfo && catalogInfo.name"
      class="catalog-wrap"
    >
      <div
        class="catalog-name"
        :style="[setTitleStyle]"
      >
        <Icon
          :icon="titleIcon"
          v-if="titleIcon"
          class="mr-2"
        ></Icon>
        <span class="">
          {{ catalogInfo.name }}
        </span>
      </div>
      <div class="catalog-list">
        <div
          :class="{ active: isActiveCatalog(item) }"
          v-for="(item, index) in catalogInfo.children"
          :key="item.no || item.id || index"
          class="catalog-item"
          @click="onTapCatalog(item)"
        >
          <div class="catalog-item-box">
            <div class="catalog-item-name">
              <span>
                {{ item.name }}
              </span>
              <span
                class="right-icon"
                :class="{ unfold: currentUnfold }"
              >
                <i
                  class="el-icon-arrow-right"
                  v-if="
                    item.is_leaf !== '是' && item.child_view_mode !== 'tabs'
                  "
                ></i>
              </span>
            </div>
            <catalog-tree
              class="catalog-tree"
              :unfold="currentUnfold"
              :class="{ unfold: currentUnfold }"
              :data="item.children"
              ref="catalogTree"
              @node-click="onTapCatalog($event, false)"
              v-if="
                item.children &&
                item.children.length &&
                item.child_view_mode === '树形'
              "
            ></catalog-tree>
          </div>
        </div>
      </div>
    </div>
    <content-wrap
      :data="current"
      v-if="current"
      :key="current.no"
      @tap="onTapContentItem"
    ></content-wrap>
  </div>
  <div
    v-else-if="viewMode === '面包屑导航'"
    class="breadcrumb-wrap"
  >
    <div class="home-icon">
      <router-link
        :to="homePath"
        class="link"
      >
        <span class="i-ri-home-4-fill"></span>
      </router-link>
    </div>
    <div class="breadcrumb-list">
      <!-- <div class="breadcrumb-item">
        <router-link :to="homePath" class="link"> 首页 </router-link>
      </div> -->
      <div
        class="breadcrumb-item"
        v-for="(item, index) in breadcrumb"
        :key="item.path || index"
      >
        <i
          class="breadcrumb-separator el-icon-d-arrow-right"
          v-if="index !== 0"
        ></i>
        <router-link
          :to="item.path"
          v-if="item.path"
          class="link"
        >
          {{ item.label || "" }}
        </router-link>
        <span v-else>{{ item.label || "" }}</span>
      </div>
    </div>
  </div>
  <div
    v-else-if="viewMode === '展开子导航'"
    class="nav-menu-wrap"
  >
    <div
      class="nav-menu"
      :class="{ 'follow-theme-color': followThemeColor }"
      :style="{ '--min-height': minHeight + 'px' }"
      ref="navMenu"
    >
      <!-- <div class="nav-menu" v-for="(item, key) in setSubMenu" :key="key" @click="onTap(item, $event)" ref="navMenuItem">
        <div class="nav-menu-label" :style="[formatStyleData(item.nav_style_json)]">
          {{ item.label }}
        </div>
      </div> -->
      <nav-menu-item
        v-for="(item, index) in setSubMenu"
        :key="index"
        :data="item"
        :isActive="isActive(item)"
        :current-nav="getCurrentNav"
        :followThemeColor="followThemeColor"
        :nav-style="mixNavStyle"
        :nav-icon-style="navIconStyle"
        :nav-icon-selected-style="navIconSelectedStyle"
        :selected-style="mixHoverStyle"
        @change="onMenuChange"
        @on-nav="navTo"
      ></nav-menu-item>
    </div>
    <div
      class="nav-menu-child-wrap"
      v-if="current && setCurrentSubMenu && setCurrentSubMenu.length"
      :class="{
        active: current && setCurrentSubMenu && setCurrentSubMenu.length,
      }"
    >
      <div class="child-menu-list">
        <div
          class="child-menu"
          v-for="(item, index) in setCurrentSubMenu"
          :key="item.nav_no || item.id || index"
        >
          <div
            class="child-menu-label"
            @click.stop.capture="navTo(item.jump_json, item)"
          >
            <span>{{ item.label || item._label }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div
    class="nav-menu"
    :class="{ isHovered: isHovered }"
    v-else-if="label"
    @mouseenter="
      isHovered = true;
    showChild = true;
    "
    @mouseleave="isHovered = false"
    ref="navMenu"
  >
    <div
      class="nav-menu-label"
      :style="[setLabelStyle, mixNavStyle]"
      @click.stop.capture="navTo(jumpJson)"
    >
      <img
        class="nav-icon"
        :src="getImagePath(calcNavIcon)"
        alt=""
        v-if="calcNavIcon"
        :style="[setNavIconStyle]"
      />
      <span>{{ label }}</span>
    </div>
    <!-- <Teleport to="#content"> -->
    <nav-menu-child
      :config="config"
      :parent-config="parentConfig"
      :pageConfig="pageConfig"
      :isHovered="showChild"
      :parent-style="parentStyle"
      @leave="showChild = false"
    ></nav-menu-child>
    <!-- </Teleport> -->

    <!-- <div
      class="nav-menu-child"
      :class="{ active: isHovered }"
      :style="[isHovered ? childPositionStyle : {}]"
      v-if="setSubMenu && setSubMenu.length"
    >
      <nav-menu-child
        v-for="(item, index) in setSubMenu"
        :key="index"
        :config="item"
        :parent-style="navStyle"
        :parent-hover-style="mixHoverStyle"
      ></nav-menu-child>
    </div> -->
  </div>
</template>

<script>
import { formatStyleData } from "@/pages/lowcode/common/index.js";
import NavMenuChild from "./nav-menu-list.vue";
import Teleport from "vue2-teleport";
import NavMenuItem from "./nav-menu-item.vue";
import DynamicIcon from "@/pages/lowcode/widgets/common/DynamicIcon.vue";
import { $selectList } from "@/common/http";
import catalogTabs from "./catalog/tabs.vue";
import ContentWrap from "./catalog/content-wrap.vue";
import catalogTree from "./catalog/tree.vue";
import { getFullBaseUrl, normalizeJumpFilePath } from "@/common/common";
import { parseJumpJson, requireLogin, jumpToSite } from "./nav-jump";
export default {
  name: "NavMenu",
  components: {
    NavMenuChild,
    NavMenuItem,
    Teleport,
    Icon: DynamicIcon,
    catalogTabs,
    ContentWrap,
    catalogTree,
  },
  props: {
    config: Object,
    parentConfig: Object,
    // pageConfig: Object,
    parentStyle: Object,
    followThemeColor: Boolean,
    titleStyle: Object,
    titleIcon: String,
  },
  inject: ["getPageConfig"],
  data() {
    return {
      isHovered: false,
      showChild: false,
      current: null,
      currentUnfold: false, //是否展开
      navMenuWidth: 0,
      position: {
        top: 0,
        left: 0,
        width: 0,
        height: 0,
      },
      formatStyleData: formatStyleData,
      minHeight: "20",
      subMenu: [],
      requestSubMenuMap: {},
      menuChildren: [],
      currentSubMenu: null,
      catalogNo: "",
      catalogInfo: null,
      contentViewMode: "",
      contentList: [],
    };
  },
  computed: {
    setTitleStyle() {
      let style = {};
      if (this.titleStyle) {
        style = formatStyleData(this.titleStyle);
      }
      return style;
    },
    pageConfig() {
      const pageConfig = this.getPageConfig();
      return pageConfig || {};
    },
    appConfig() {
      return this.pageConfig?.app_json_data || {};
    },
    homePath() {
      const home_page_no = this.appConfig?.home_page_no || "";
      if (home_page_no) {
        return `/lowcode/view/${home_page_no}`;
      }
    },
    breadcrumb() {
      const { path, name_path } = this.pageConfig || {};
      let res = [];
      if (path?.includes("/")) {
        let arr = path.split("/");
        let nameArr = name_path.split("/");
        arr.forEach((item, index) => {
          if (item === "") {
            return;
          }
          res.push({
            label: nameArr[index],
            value: item,
            path:
              item && item !== this.pageConfig.page_no
                ? `/lowcode/view/${item}`
                : "",
          });
        });
      }
      return res;
    },
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
    setCurrentSubMenu() {
      if (this.current?.link_type) {
        return this.menuChildren;
      }
      if (
        this.current?.child_source === "接口请求" &&
        this.menuChildren?.length
      ) {
        return this.menuChildren;
      }
      let json = this.current?.sub_json;
      if (typeof json === "string") {
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
    setSubMenu() {
      if (this.config?.child_source === "接口请求") {
        return this.subMenu;
      }
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
    calcNavIcon() {
      if (this.isHovered && this.config?.nav_icon_selected) {
        return this.config.nav_icon_selected;
      }
      return this.config?.nav_icon;
    },
    setNavIconStyle() {
      let style = { ...this.navIconStyle };
      if (this.isHovered) {
        style = { ...style, ...this.navIconSelectedStyle };
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
    getCurrentNav() {
      let pageNo = this.$route.params?.pageNo || this.$parent.pageNo;
      if (pageNo) {
        let currentNav = this.setSubMenu.find(
          (item) => item.page_no === pageNo
        );
        return currentNav;
      }
    },
    childPositionStyle() {
      return {
        top: this.position.height + "px",
        left: 0,
        width: this.position.width + "px",
      };
    },
    jumpJson() {
      return parseJumpJson(this.config);
    },
    reqJson() {
      if (this.config.request_json) {
        if (typeof this.config.request_json === "string") {
          try {
            return JSON.parse(this.config.request_json);
          } catch (error) {
            console.error(error);
          }
        } else if (typeof this.config.request_json === "object") {
          return this.config.request_json;
        }
      }
    },
  },
  created() {
    if (this.viewMode === "文章栏目") {
      this.catalogNo = this.config?.catalog;
      if (this.catalogNo) {
        return this.fetchCatalogList(this.catalogNo);
      }
    }
    if (this.config?.child_source === "接口请求") {
      this.fetchChildData(this.reqJson).then((res) => {
        if (res.data?.state === "SUCCESS") {
          this.subMenu = res.data.data.map((data) => {
            return {
              ...data,
              _label: data[this.config.label_field],
              _url: data[this.config.link_field],
            };
          });
        }
      });
    }
    if (this.viewMode === "文章栏目") {
    }
  },
  mounted() {
    // this.setEleSize();
    // setTimeout(() => {
    //   this.setEleSize();
    // }, 1000);
  },
  methods: {
    onTapContentItem(item) {
      if (this.config.jump_json) {
        this.navTo(this.config.jump_json, item);
      }
    },
    onTapCatalog(item, changeUnfold = true) {
      if (
        item.children &&
        item.children.length &&
        item.child_view_mode === "树形" &&
        changeUnfold
      ) {
        if (
          (this.currentUnfold && this.current.no == item.no) ||
          this.current.parent_no == item.no
        ) {
          this.currentUnfold = false;
        } else {
          this.currentUnfold = true;
        }
      }
      // if (this.currentUnfold === false) {
      //   var nodes = this.$refs.catalogTree?.[0]?.$refs?.elTree?.store?.nodesMap||[];
      //   for (var i in nodes) {
      //     nodes[i].expanded = false;
      //   }
      // }
      this.current = item;
    },
    async fetchContentData(catalogNo, pageSize) {
      const url = `/daq/select/srvdaq_pc_website_content_select`;
      const req = {
        serviceName: "srvdaq_pc_website_content_select",
        colNames: ["*"],
        condition: [
          { colName: "category_no", ruleType: "like]", value: catalogNo },
        ],
        page: { pageNo: 1, rownumber: pageSize || 1 },
        order: [],
      };
      const { data, ok, msg } = await $selectList(url, req);
      if (ok) {
        this.contentList = data;
      } else {
        this.$message.error(msg);
      }
    },
    fetchCatalogList() {
      const url = `/daq/select/srvdaq_pc_website_category_select`;
      const req = {
        serviceName: "srvdaq_pc_website_category_select",
        colNames: ["*"],
        condition: [
          { colName: "path", ruleType: "like]", value: `/${this.catalogNo}/` },
          { colName: "is_view", ruleType: "ne", value: "否" },
        ],
        treeData: true,
        // relation_condition: {},
        page: { pageNo: 1, rownumber: 50 },
        // relation_condition: {
        //   relation: "OR",
        //   data: [
        //     {
        //       colName: "parent_no",
        //       ruleType: "eq",
        //       value: this.catalogNo,
        //     },
        //     { colName: "no", ruleType: "eq", value: this.catalogNo },
        //   ],
        // },
        // use_type: "treelist",
      };
      return this.$http.post(url, req).then((res) => {
        if (res.data?.state === "SUCCESS") {
          if (res.data.data.length) {
            this.catalogInfo = res.data.data[0];
            if (this.catalogInfo?.children?.length) {
              setTimeout(() => {
                this.$nextTick(() => {
                  this.onTapCatalog(this.catalogInfo.children[0]);
                });
              }, 500);
            }
          }
          // this.subMenu = res.data.data.map((item)=>{
          //   return {
          //     ...item,
          //     _label: item.name,
          //     _url: item.link_url,
          //   }
          // })
        }
      });
    },
    isActive(item) {
      if (this.current) {
        if (item.nav_no && this.current?.nav_no === item.nav_no) {
          return true;
        } else if (item.id && this.current?.id === item.id) {
          return true;
        }
      }
      return false;
    },
    isActiveCatalog(item) {
      if (this.current) {
        if (this.current?.no === item?.no) {
          return true;
        } else if (this.current?.path?.startsWith(item.path)) {
          return true;
        }
      }
      return false;
    },
    onMenuChange(data) {
      const { children, current, event } = data;
      const eleRect = this.$refs.navMenu?.getBoundingClientRect?.();
      if (eleRect.height) {
        this.minHeight = eleRect.height;
      }
      if (this.current?.nav_no && this.current?.nav_no === current?.nav_no) {
        this.current = null;
        this.menuChildren = [];
      } else if (this.current?.id && this.current.id === current?.id) {
        this.current = null;
        this.menuChildren = [];
      } else if (children && children.length > 0) {
        this.menuChildren = children;
        this.current = current;
      }
    },
    async fetchChildData(config) {
      let requestJson = config;
      if (typeof config === "string") {
        requestJson = JSON.parse(config);
      }
      if (requestJson?.serviceName) {
        const req = {
          colNames: requestJson.colNames || ["*"],
          condition: requestJson.condition || [],
          serviceName: requestJson.serviceName,
          page: requestJson.page || { pageNo: 1, rownumber: 100 },
        };
        const url = `${requestJson.mapp}/${requestJson.srv_type || "select"}/${req.serviceName
          }`;
        return await this.$http.post(url, req);
      }
    },
    onTap(item, event) {
      if (item.child_source === "接口请求") {
        this.fetchChildData(item.request_json).then((res) => {
          if (res.data?.state === "SUCCESS") {
            this.$set(
              this.requestSubMenuMap,
              item.nav_no,
              res.data.data.map((data) => {
                return {
                  ...data,
                  _label: data[item.label_field],
                  _url: data[item.link_field],
                };
              })
            );
          }
        });
        return;
      }
      if (item?.jump_json) {
        this.navTo(item.jump_json);
        return;
      }
      const ele = event.target.getBoundingClientRect();
      this.minHeight = ele.height;
      if (this.current?.nav_no && this.current?.nav_no === item?.nav_no) {
        this.current = null;
      } else {
        if (item?.sub_json && typeof item.sub_json === "string") {
          item.sub_json = JSON.parse(item.sub_json);
        }
        this.current = item;
      }
      // 获取当前点击的nav-menu宽度
      if (event && event.currentTarget) {
        this.navMenuWidth = event.currentTarget.offsetWidth;
      }
    },
    navTo(jumpJson, data) {
      if (data?._url && !jumpJson) {
        if (data?.jump_option?.includes("先登录")) {
          requireLogin(this);
          return;
        }
        return window.open(data._url);
      }
      if (typeof jumpJson === "string") {
        try {
          jumpJson = JSON.parse(jumpJson);
        } catch (error) {
          console.error(error);
        }
      }
      if (jumpJson?.obj_type) {
        if (jumpJson?.click_jump_option?.includes("先登录")) {
          requireLogin(this);
          return;
        }
        switch (jumpJson.obj_type) {
          case "外部页面":
            if (jumpJson.outer_url) {
              if (jumpJson.target_type == "原页面") {
                window.location.href = jumpJson.outer_url;
              } else {
                window.open(jumpJson.outer_url);
              }
            }
          case "当前页锚点":
          case "当前页面锚点":
            if (jumpJson.anchor_com_name) {
              if (jumpJson.target_type === "新页面" && jumpJson.dest_page_no) {
                this.navToPath(jumpJson);
              } else {
                let ele = document.getElementById(jumpJson.anchor_com_name);
                if (ele) {
                  ele.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                    inline: "nearest",
                  });
                }
              }
            }
            break;
          default:
            if (jumpJson.dest_page_no) {
              this.jumpAction(jumpJson, data);
            }
            break;
        }
      }
    },
    navToPath(jump_json) {
      // 统一站内跳转（登录拦截 + 原页面 SPA / 新窗口），见 nav-jump.js
      if (jump_json?.click_jump_option?.includes("先登录")) {
        requireLogin(this);
        return;
      }
      jumpToSite(this, jump_json);
    },
  },
};
</script>

<style lang="scss" scoped>
.catalog {
  display: flex;
  gap: 30px;

  .catalog-wrap {
    line-height: 54px;
    text-align: center;

    .catalog-name {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 600;
    }

    .catalog-list {
      min-width: 250px;
      border: 1px solid #d5d9e4;
      background-color: #f8f8f8;

      .catalog-item {
        border-top: 1px solid #d5d9e4;
        border-left: 4px transparent solid;
        // border-right: 4px transparent solid;
        cursor: pointer;
        position: relative;

        .catalog-tree {
          display: grid;
          grid-template-rows: 0fr;
          transition: all 0.3s ease;
          overflow: hidden;
          min-height: 0;

          &.unfold {
            min-height: 40px;
            grid-template-rows: 1fr;
          }
        }

        .catalog-item-name {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          position: relative;
        }

        .right-icon {
          position: absolute;
          right: 5px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 12px;
          color: #999;
          transition: all 0.3s ease;

          &.unfold {
            transform: translateY(-50%) rotate(90deg);
          }
        }

        &:first-child {
          border-top: unset;
        }

        &:hover,
        &.active {
          background-color: #fff;
          font-weight: bold;
        }

        &.active {
          border-left-color: var(--primary-color, #007aff);
        }
      }
    }
  }
}

.breadcrumb-wrap {
  background-color: transparent;
  margin: unset;
  padding: unset;
  display: flex;

  .home-icon {
    font-size: 24px;
    width: 42.94px;
    height: 38px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--primary_color, linear-gradient(151.99deg,
          rgba(0, 122, 255, 1) 29.59%,
          rgba(4, 71, 171, 1) 294.82%));
    color: #fff;
    clip-path: polygon(0 0, 100% 0, 74% 99%, 0% 100%);
    padding-right: 5px;
  }

  .link {
    color: inherit;

    &:hover {
      text-decoration: none;
    }
  }

  .breadcrumb-list {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0 10px;
    background: linear-gradient(88.74deg,
        rgba(241, 246, 255, 1) 1.25%,
        rgba(241, 246, 246, 0) 90.23%);
    padding-left: 50px;
    margin-left: -40px;
    margin-top: 4px;

    .breadcrumb-separator {
      margin-right: 6px;
    }

    .breadcrumb-item {
      a {
        color: inherit;

        &:hover {
          text-decoration: none;
        }
      }
    }

    .breadcrumb-item+.breadcrumb-item {
      padding-left: 6px;
    }

    .breadcrumb-item+.breadcrumb-item::before {
      content: "";
    }
  }
}

.nav-menu-wrap {
  display: grid;
  min-height: 100%;
}

:deep(.nav-menu) {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: var(--min-height, 30px);
  cursor: pointer;
  z-index: 99;
  flex: 1;

  .nav-menu-label {
    z-index: 100;
    width: 100%;
    height: 100%;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      font-weight: bold;
    }

    .nav-icon {
      width: 1rem;
      height: 1em;
      display: inline-block;
      color: currentColor;
    }
  }

  &.follow-theme-color {
    .nav-menu-label {
      background-color: var(--menu-bg-color);
      color: var(--menu-text-color);

      &:hover {
        background-color: var(--menu-hover-bg-color);
        color: var(--menu-hover-text-color, inherit);
      }

      &.active {
        background-color: var(--menu-active-bg-color);
        color: var(--menu-hover-active-color, inherit);
      }
    }

    &.active-nav-menu {
      .nav-menu-label {
        background-color: var(--menu-active-bg-color);
        color: var(--menu-active-text-color, inherit);
      }
    }
  }

  .nav-menu-child {
    position: absolute;
    min-width: 100%;
    transition: all 0.3s ease-in-out;
    height: 0;
    overflow: hidden;
    z-index: -1;

    &.active {
      height: auto;
      overflow: unset;
      z-index: 99;
    }
  }

  .nav-menu-child-container {
    position: absolute;
    left: 0;
    top: 100%;
    z-index: 200;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    min-width: 100%;
    padding: 0;
  }
}

.nav-menu-child-wrap {
  background-color: #f1f1f1;
  color: #333;
  width: 100%;
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s ease-in-out;
  overflow: hidden;

  &.active {
    grid-template-rows: 1fr;
  }

  .child-menu-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    padding: 10px;
  }

  .child-menu {
    padding: 2px 10px;
    min-width: 100px;
    text-align: center;
    border-radius: 4px;
    cursor: pointer;

    &:hover {
      background: var(--menu-hover-bg-color, #f1f1f1);
      color: var(--menu-hover-text-color, inherit);
    }
  }
}
</style>