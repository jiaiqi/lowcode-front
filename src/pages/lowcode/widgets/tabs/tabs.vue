<template>
  <page-item-group
    v-if="relatePages && relatePages.length"
    :page-item="pageItem"
    :pageParamsModel="pageParamsModel"
    :queryOptions="queryOptions"
  ></page-item-group>
  <div class="tabs" :class="{ 'vertical-tabs': vertical }" v-else :style="{ '--border-color': tabsJson?.underline_color || '#bbb', '--active-bottom-color': tabsJson?.underline_high==='是' ? tabsJson?.act_color : 'transparent' }">
    <div
      class="tab-name-box"
      :class="{
        'justify-start': !vertical && leftTab,
        'justify-end': !vertical && rightTab,
        'justify-center': !vertical && !leftTab && !rightTab,
        'button-mode': buttonMode,
      }"
      :style="[buildTabsTitleStyle]"
    >
      <div
        class="tab-name"
        v-for="item in components"
        :key="item.id"
        :style="[
          activeName === item.com_name ? setActiveStyle : setNormalStyle,
        ]"
        :class="{
          active: activeName === item.com_name,
          'button-mode': buttonMode,
        }"
        @click="activeName = item.com_name"
        ref="tabItems"
      >
        {{ item.com_label || item.com_name || "xxx" }}
      </div>
      <!-- 添加动态下划线 -->
      <div
        class="tab-underline"
        :style="[underlineStyle]"
        v-if="!buttonMode"
      ></div>
    </div>
    <div class="tab-content">
      <div
        v-for="item in components"
        :key="item.id"
        class="tab-item"
        v-if="activeName === item.com_name"
      >
        <page-item
          use-layout="false"
          ref="pageItem"
          :page-item="item"
          :in-tabs="true"
          :pageParamsModel="pageParamsModel"
          :queryOptions="queryOptions"
        ></page-item>
      </div>
    </div>
  </div>
</template>

<script>
// import pageItem from "@/pages/lowcode/widgets/page-item.vue";
import List from "../list/list.vue";
import { formatStyleData } from "@/pages/lowcode/common/index.js";
// import pageItem from "@/pages/lowcode/widgets/page-item.vue";
export default {
  components: {
    pageItem: () => import("@/pages/lowcode/widgets/page-item.vue"),
    pageItemGroup: () =>
      import("@/pages/lowcode/widgets/page-item-group/page-item-group.vue"),
    List,
  },
  data() {
    return {
      activeName: "",
      tabs: [],
      // 添加下划线样式数据
      underlineStyle: {
        "--primary-color": this.tabsJson?.act_color,
        "--border-color": this.tabsJson?.underline_color,
        "--active-bottom-color":this.tabsJson?.underline_high==="是" ? this.tabsJson?.act_color : "transparent",
        width: "0px",
        transform: "translateX(0px)",
      },
    };
  },
  props: {
    pageItem: {
      type: Object,
    },
    pageParamsModel: {
      type: Object,
    },
    queryOptions: {
      type: Object,
    },
  },
  computed: {
    relatePages() {
      if (Array.isArray(this.tabsJson?.relate_pages_json)) {
        return this.tabsJson.relate_pages_json;
      }
      return [];
    },
    buildTabsTitleStyle() {
      return formatStyleData(this.tabsJson?.tabs_title_style_json || "");
    },
    // 获取tabs中所有卡片单元编号+名称的键值对
    getTabsCardList() {
      let list = this.components;
      let result = [];
      if (Array.isArray(list) && list.length) {
        list.forEach((item) => {
          Object.keys(item).forEach((key) => {
            if (key?.includes("_json")) {
              let _json = item[key];
              Object.keys(_json).forEach((subKey) => {
                if (subKey?.includes("_json") && subKey?.includes("card_")) {
                  const _json2 = _json[subKey];
                  if (_json2?.card_name && _json2?.card_no) {
                    result.push({
                      no: _json2.card_no,
                      name: _json2.card_name,
                    });
                  }
                }
              });
            }
          });
        });
      }
      return result;
    },
    tabsJson() {
      return this.pageItem.tabs_json;
    },
    componentsTab() {
      return (
        Array.isArray(this.tabsJson?.com_json) && this.tabsJson?.com_json.length
      );
    },
    components() {
      return this.tabsJson.com_json || [];
    },
    setNormalStyle() {
      let style = {
        ...(this.tabsJson?.style_json || {}),
      };
      return formatStyleData(style);
    },
    setActiveStyle() {
      let style = {};
      if (this.buttonMode) {
        style = {
          background_color: this.tabsJson?.act_color,
          border_color: this.tabsJson?.act_color,
        };
      }
      style = {
        ...style,
        ...(this.tabsJson?.active_style_json || {}),
      };
      return formatStyleData(style);
    },
    buttonMode() {
      return this.tabsJson?.tabs_options?.includes("按钮样式");
    },
    vertical() {
      return this.tabsJson?.tabs_options?.includes("垂直方向");
    },
    leftTab() {
      return this.tabsJson?.tabs_options?.includes("靠左");
    },
    rightTab() {
      return this.tabsJson?.tabs_options?.includes("靠右");
    },
  },
  created() {
    if (this.pageItem?.srv_req_type === "模拟数据") {
      this.tabs = this.pageItem.mock_srv_data_json || [];
      if (this.tabs.length > 0) {
        this.activeName = this.tabs[0].name;
      }
    }
    if (this.components.length) {
      this.activeName = this.components[0].com_name;
    }
  },
  watch: {
    // 监听选中标签变化，更新下划线位置
    activeName: {
      handler() {
        this.$nextTick(() => {
          this.updateUnderlinePosition();
        });
      },
      immediate: true,
    },
  },
  mounted() {
    // 初始化下划线位置
    this.$nextTick(() => {
      this.updateUnderlinePosition();
    });
  },
  methods: {
    // 更新下划线位置
    updateUnderlinePosition() {
      if (this.buttonMode) {
        return;
      }
      if (!this.$refs.tabItems || !this.$refs.tabItems.length) return;

      const activeIndex = this.components.findIndex(
        (item) => item.com_name === this.activeName,
      );
      if (activeIndex === -1) return;

      const activeTab = this.$refs.tabItems[activeIndex];
      if (!activeTab) return;

      // 使用offsetLeft和offsetWidth来获取相对于父元素的位置和宽度
      const width = activeTab.offsetWidth;
      const left = activeTab.offsetLeft;

      // 计算下划线位置
      this.underlineStyle = {
        "--primary-color": this.tabsJson?.act_color,
        "--border-color": this.tabsJson?.underline_color,
        "--active-bottom-color":this.tabsJson?.underline_high==="是" ? this.tabsJson?.act_color : "transparent",
        width: `${width}px`,
        transform: `translateX(${left}px)`,
      };
    },
  },
};
</script>

<style lang="scss" scoped>
.tabs {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;

  &.vertical-tabs {
    flex-direction: row;

    .tab-name-box {
      flex-direction: column;
      gap: 10px;

      .tab-name {
        min-width: 200px;
        text-align: center;
      }
    }
  }

  .tab-content {
    flex: 1;

    .tab-item {
      height: 100%;
      width: 100%;
    }
  }
}

.tab-name-box {
  display: flex;
  align-items: center;
  position: relative; // 添加相对定位
  margin-bottom: 5px;
  border-bottom: 1px solid var(--border-color, #bbb);

  &.button-mode {
    border-bottom: none;
  }

  .tab-name {
    cursor: pointer;
    padding: 0 4px 8px; // 添加底部内边距，为下划线留出空间
    position: relative; // 添加相对定位
    margin-right: 80px;

    &:not(.button-mode) {
      margin-right: 20px;
    }

    &.active:not(.button-mode) {
      color: var(--primary-color, #409eff);
    }

    &.button-mode {
      color: #333;
      border: 1px solid #eee;
      border-radius: 0;
      padding: 4px 16px;
      margin-right: 10px;
    }

    &.active.button-mode {
      color: #fff;
      background-color: var(--primary-color, #409eff);
    }
  }

  // 添加下划线样式
  .tab-underline {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;

    background-color: var(--active-bottom-color, transparent); // 默认颜色
    // background-color: var(--primary-color, #409eff); // 默认颜色
    transition: transform 0.3s ease, width 0.3s ease; // 添加过渡动画
    border-radius: 4px;

    &::after {
      content: "";
      position: absolute;
      bottom: 3px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border: 5px solid transparent;
      border-bottom-color: var(--primary-color, #409eff);
      z-index: -1;
    }
  }
}
</style>
