<template>
  <!-- 普通视图的侧边栏树形数据 -->
  <div
    class="map-left"
    :style="{
      '--left': left + 'px',
    }"
    :class="{ collapsed: isCollapsed }"
    v-if="treeData && treeData.length"
  >
    <div
      class="map-tree-data"
      v-if="treeData.length"
    >
      <div
        class="tree-data-item"
        v-for="item in treeData"
        :key="item.id"
      >
        <div
          class="tree-data-item-name"
          :class="{
            active:
              (selectedTreeData &&
                item.id &&
                selectedTreeData.id === item.id) ||
              (selectedTreeData.path &&
                selectedTreeData.path.startsWith(item.path)),
          }"
          @click="handleTreeDataClick(item)"
        >
          <i
            class="tree-data-item-name-icon el-icon-caret-right"
            :class="{ expanded: expandedNodes[item.id] }"
            @click.stop="handleToggleExpand(item)"
          ></i>
          <span class="tree-data-item-name-text">
            {{ getTreeItemLabel(item) }}
          </span>
        </div>
        <transition name="tree-expand">
          <div
            class="tree-data-item-child"
            v-show="expandedNodes[item.id]"
          >
            <tree-data-item
              v-for="child in item.children"
              :key="child.id"
              :item="child"
              :selected="selectedTreeData"
              :level="1"
              :set-children-func="setChildren"
              @select="handleTreeDataClick"
            />
          </div>
        </transition>
      </div>
    </div>
    <div
      class="collapsed-icon"
      @click="handleToggleCollapsed"
      v-if="treeData.length"
      :title="isCollapsed ? '展开' : '收起'"
    >
      <span
        class="i-material-symbols-arrow-menu-close icon"
      ></span>
    </div>
  </div>
</template>

<script setup>
/**
 * 地图树形侧边栏组件
 * 
 * @component MapTreeSidebar
 * @description
 * 独立的树形侧边栏组件，负责展示和管理地图的树形数据结构
 * 
 * @features
 * - 🌳 树形数据展示
 * - 📁 节点展开/折叠
 * - 🎯 节点选择和高亮
 * - 📱 侧边栏折叠/展开
 * - 🔄 异步加载子节点
 */

import { ref, computed } from 'vue'
import DynamicIcon from "@/pages/lowcode/widgets/common/DynamicIcon.vue"
import TreeDataItem from './TreeDataItem.vue'

/**
 * 组件 Props 定义
 */
const props = defineProps({
  // 树形数据列表
  treeData: {
    type: Array,
    default: () => []
  },
  // 当前选中的树形数据项
  selectedTreeData: {
    type: Object,
    default: () => ({})
  },
  // 展开的节点状态映射
  expandedNodes: {
    type: Object,
    default: () => ({})
  },
  // 侧边栏是否折叠
  isCollapsed: {
    type: Boolean,
    default: false
  },
  // 地图配置对象
  mapJson: {
    type: Object,
    default: () => ({})
  },
  // 设置子节点的函数
  setChildren: {
    type: Function,
    default: () => {}
  }
})

/**
 * 组件事件定义
 */
const emit = defineEmits([
  'tree-data-click',    // 树形数据项点击事件
  'toggle-expand',      // 节点展开/折叠事件
  'toggle-collapsed'    // 侧边栏折叠/展开事件
])

/**
 * 组件配置常量
 */
const CONFIG = {
  UI: {
    SIDEBAR_WIDTH: 230, // 侧边栏宽度
    SIDEBAR_MARGIN: 15, // 侧边栏边距
  }
}

/**
 * 计算左侧面板位置
 */
const left = computed(() =>
  props.isCollapsed ? -CONFIG.UI.SIDEBAR_WIDTH : CONFIG.UI.SIDEBAR_MARGIN
)

/**
 * 获取树形数据项的显示标签
 * 根据配置字段获取数据项的显示文本
 * 
 * @function getTreeItemLabel
 * @param {Object} item - 树形数据项
 * @returns {string} 显示标签文本
 */
function getTreeItemLabel(item) {
  // 优先使用配置的标签字段
  if (item?.[props.mapJson?.map_filter_label_field]) {
    return item[props.mapJson?.map_filter_label_field]
  }
  // 备用字段：area_name 或 name
  return item?.area_name || item?.name || ''
}

/**
 * 处理树形数据项点击事件
 * 
 * @function handleTreeDataClick
 * @param {Object} item - 点击的树形数据项
 */
function handleTreeDataClick(item) {
  emit('tree-data-click', item)
}

/**
 * 处理节点展开/折叠事件
 * 
 * @function handleToggleExpand
 * @param {Object} item - 要展开/折叠的节点
 */
function handleToggleExpand(item) {
  emit('toggle-expand', item)
}

/**
 * 处理侧边栏折叠/展开事件
 * 
 * @function handleToggleCollapsed
 */
function handleToggleCollapsed() {
  emit('toggle-collapsed')
}
</script>

<style lang="scss" scoped>
.map-left {
  z-index: 100;
  max-height: 80%;
  top: 15px;
  left: var(--left, 15px);
  display: flex;
  position: absolute;
  transition: left cubic-bezier(0.5, -0.5, 0.5, 1) 0.3s;

  .map-tree-data {
    position: relative;
    width: 220px;
    transform: scale(1);
    transition: transform cubic-bezier(0.5, -0.5, 0.5, 1) 0.3s;
  }

  &.collapsed {
    .map-tree-data {
      transform: scale(0);
    }

    .collapsed-icon {
      .icon {
        rotate: 180deg;
      }
    }
  }

  .collapsed-icon {
    position: absolute;
    cursor: pointer;
    text-align: center;
    width: 50px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 24px;
    right: 0;
    transform: translateX(100%);

    .icon {
      transform: scale(0);
      rotate: 0;
    }

    &:hover {
      backdrop-filter: blur(1px);

      .icon {
        transform: scale(1);
      }
    }
  }
}

.map-tree-data {
  position: absolute;
  top: 15px;
  left: 15px;
  z-index: 100;
  background: #fff;
  max-height: 80%;
  overflow-y: auto;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: #ccc #f5f5f5;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #ccc;
    border-radius: 3px;
  }

  .tree-data-item {
    border-top: 1px solid #e5e5e5;

    &:first-child {
      border-top: none;
    }

    .tree-data-item-name {
      border-bottom: 1px solid #e5e5e5;

      &:last-child {
        border-bottom: none;
      }

      width: 100%;
      padding: 0px 30px;
      line-height: 46px;
      min-width: 175px;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
      text-align: center;
      cursor: pointer;

      .tree-data-item-name-icon {
        position: absolute;
        left: 10px;
        top: 50%;
        transform: translate(0, -50%);
        font-size: 16px;
        transition: transform 0.3s ease;
        cursor: pointer;

        &.expanded {
          transform: translate(0, -50%) rotate(90deg);
        }
      }

      &.active {
        background: linear-gradient(151.99deg,
            rgba(0, 122, 255, 1) 29.59%,
            rgba(4, 71, 171, 1) 294.82%);
        color: #fff;
      }
    }

    .tree-data-item-child {
      .tree-data-item-child-item {
        .tree-data-item-child-item-name {
          border-left: 2px solid transparent;
          width: 100%;
          padding: 5px 30px;
          line-height: 46px;
          cursor: pointer;
        }
      }
    }
  }
}

.tree-expand-enter-active,
.tree-expand-leave-active {
  transition: all 0.3s ease;
  max-height: 1000px;
  overflow: hidden;
}

.tree-expand-enter-from,
.tree-expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.tree-expand-enter-to,
.tree-expand-leave-from {
  max-height: 1000px;
  opacity: 1;
}
</style>