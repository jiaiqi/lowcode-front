<template>
  <div :style="[tagStylefn(pageItem.style_json)]">
    <!-- 自定义 tabs 切换 - 居中或靠右 -->
    <div
      class="custom-tabs"
      v-if="pageItem && !tabAlignLeft && tabs.length > 0"
    >
      <div
        v-for="(item, index) in tabs"
        :class="['custom-tab', { active: tabsCurrent === index }]"
        @click="tabsChange(index)"
        :key="index"
      >
        {{ item.name }}
      </div>
    </div>
    
    <!-- 自定义 tabs 切换 - 靠左 -->
    <div
      class="my-tabs"
      v-if="tabAlignLeft && tabs.length > 0"
      :style="[getTitleStyle]"
    >
      <div
        v-for="(item, index) in tabs"
        :class="tabsCurrent == index ? 'my-tab active' : 'my-tab'"
        @click="tabsChange(index)"
        :key="index"
      >
        <span>{{ item.name }}</span>
        <div
          v-if="tabsCurrent == index"
          class="active-line"
        ></div>
      </div>
    </div>
    
    <!-- tabs 内容区域 -->
    <div
      class="page-item-list"
      v-for="(page, index) in tabs"
      :key="index"
    >
      <template v-if="index === tabsCurrent">
        <PageItemCom
          v-for="pageItem in page.component_json"
          :key="pageItem.com_no"
          :on-hidden="index !== tabsCurrent"
          :query-options="queryOptions"
          :pageItem="pageItem"
          :pageNo="pageItem['_page_no']"
          :pageParams="pageParams"
          :no-permission="noPermission"
          :pageParamsModel="pageParamsModel"
          @setPageParams="setPageParams"
          ref="pageItem"
          :modelLevelType="'pageComp'"
          @setPageInstance="setPageInstance"
          @permission-checked="permissionChecked"
          @tenant-change="tenantChange"
        >
        </PageItemCom>
      </template>
    </div>
  </div>
</template>

<script>
import PageItemCom from '../page-item/page-item.vue';
import PageItemGroupMixin from '@/pages/lowcode/mixins/page-item-group.mixin.js';
import { formatStyleData } from "@/pages/lowcode/vendor/datav/common/index.js";

export default {
  components: {
    PageItemCom
  },
  props: {
    noPermission: {
      type: Boolean,
      default: false
    },
  },
  mixins: [PageItemGroupMixin],
  data() {
    return {};
  },
  computed: {
    getTitleStyle() {
      if (this.pageItem?.com_title_style_json) {
        return formatStyleData(this.pageItem?.com_title_style_json)
      }
    },
    tabAlignLeft() {
      let val = false
      if (this.pageItem?.tabs_json?.tabs_options) {
        if (this.pageItem?.tabs_json?.tabs_options.indexOf('靠左') !== -1) {
          val = true
        }
      }
      return val
    },
    pageItemList() {
      if (Array.isArray(this.pageInfo?.component_json_data)) {
        return this.pageInfo.component_json_data.map(item => {
          return item
        })
      }
    },
    pageTitle() {
      return this.pageInfo?.page_title || ''
    },
    currentTab() {
      if (!this.pageNo) {
        return 0
      }
      if (Array.isArray(this.tabbarList) && this.tabbarList.length > 0) {
        return this.tabbarList.findIndex(item => item.link_page_no === this.pageNo);
      }
    },
  },
  methods: {
    tenantChange(tenant_no) {
      this.$emit('tenant-change', tenant_no)
    },
    permissionChecked(event) {
      this.$emit('permission-checked', event)
    },
    setPageInstance(val, dimInfo) {
      this.$emit('setPageInstance', val, dimInfo)
    },
    tagStylefn(style) {
      if (style) {
        return formatStyleData(style)
      }
    }
  },
};
</script>

<style lang="scss" scoped>
// 自定义 tabs - 居中或靠右
.custom-tabs {
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 20px;

  .custom-tab {
    padding: 12px 24px;
    cursor: pointer;
    color: #606266;
    font-size: 14px;
    transition: all 0.3s;
    position: relative;

    &:hover {
      color: #409eff;
    }

    &.active {
      color: #409eff;
      font-weight: 600;

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background-color: #409eff;
      }
    }
  }
}

// 自定义 tabs - 靠左
.my-tabs {
  line-height: 60px;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 20px;

  .my-tab {
    color: #999999;
    font-size: 14px;
    text-align: center;
    padding: 0 12px;
    display: inline-block;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      color: #409eff;
    }

    &.active {
      font-size: 16px;
      color: #101010;
      font-weight: bold;
    }
  }

  .active-line {
    height: 3px;
    margin: 0 auto;
    background: #007AFF;
    width: 40px;
    position: relative;
    top: -8px;
  }
}

// 自定义样式
.shadow-view {
  width: 100vw;
  height: 100vh;
  position: fixed;
  z-index: 999;
  top: 0;
  left: 0;
  background: transparent;
}

.page-wrap {
  background-color: var(--home-background_color);
  background: var(--home-bg);
  color: var(--home-text-color);
  font-size: var(--home-text-size);
  max-width: 960px;
  margin: 0 auto;
  height: auto;
  overflow: hidden;
  min-height: calc(100vh - var(--window-top));

  .page-body {
    .custom-background {
      position: absolute;
      width: 100%;
      max-width: 960px;
      z-index: -1;
    }

    .page-item-list {
      overflow: auto;
    }
  }
}

.home-name {
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.copyright-box {
  padding: 20px;
  text-align: center;

  .row {
    min-width: 300px;
    margin: 0 auto;
    font-size: 12px;
    font-weight: normal;
    line-height: 22px;
    color: #D8D9DF;
    opacity: 1;
    margin-bottom: 5px;
  }
}
</style>