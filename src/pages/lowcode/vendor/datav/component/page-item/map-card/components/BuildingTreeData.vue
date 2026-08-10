<template>
  <!-- 建筑物视图的树形数据 -->
  <div
    class="building-tree-data map-tree-data"
    v-if="isBuildingView && buildingTree && buildingTree.length"
  >
    <div
      class="tree-data-item"
      v-for="item in buildingTree"
      :key="item.id"
    >
      <div
        class="tree-data-item-name"
        :class="{
          active:
            (floorInfo && item.id && floorInfo.id === item.id) ||
            (floorInfo.path && floorInfo.path.startsWith(item.path)),
        }"
        @click="handleTreeDataClick(item)"
      >
        <i
          class="tree-data-item-name-icon el-icon-caret-right"
          :class="{ expanded: expandedBuildingNodes[item.id] }"
          @click.stop="handleToggleExpand(item)"
          v-if="item.children && item.children.length"
        ></i>
        <span class="tree-data-item-name-text">
          {{ getTreeItemLabel(item) }}
        </span>
      </div>
      <transition name="tree-expand">
        <div
          class="tree-data-item-child"
          v-show="expandedBuildingNodes[item.id]"
        >
          <tree-data-item
            v-for="child in item.children"
            :key="child.id"
            :item="child"
            :selected="floorInfo"
            :level="1"
            @select="handleTreeDataClick"
          />
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
/**
 * 建筑物树形数据组件
 * @component BuildingTreeData
 * @description 负责渲染建筑物视图的树形数据结构
 */

import TreeDataItem from "./TreeDataItem.vue";

/**
 * 组件 Props 定义
 */
const props = defineProps({
  // 是否为建筑物视图
  isBuildingView: {
    type: Boolean,
    default: false
  },
  // 建筑物树形数据
  buildingTree: {
    type: Array,
    default: () => []
  },
  // 当前楼层信息
  floorInfo: {
    type: Object,
    default: () => null
  },
  // 建筑物节点展开状态
  expandedBuildingNodes: {
    type: Object,
    default: () => ({})
  },
  // 地图配置
  mapJson: {
    type: Object,
    required: true
  },
  // 获取树形数据项标签的函数
  getTreeItemLabel: {
    type: Function,
    required: true
  }
});

/**
 * 组件事件定义
 */
const emit = defineEmits(['tree-data-click', 'toggle-expand']);

/**
 * 处理树形数据项点击
 * @param {Object} item - 点击的数据项
 */
function handleTreeDataClick(item) {
  emit('tree-data-click', item);
}

/**
 * 处理节点展开/折叠切换
 * @param {Object} item - 要切换的数据项
 */
function handleToggleExpand(item) {
  emit('toggle-expand', item);
}
</script>

<style lang="scss" scoped>
.building-tree-data {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 300px;
  max-height: 400px;
  overflow-y: auto;
}

.tree-data-item {
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
}

.tree-data-item-name {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-size: 14px;
  color: #333;

  &:hover {
    background-color: #f5f5f5;
  }

  &.active {
    background-color: #e6f7ff;
    color: #1890ff;
    font-weight: 500;
  }
}

.tree-data-item-name-icon {
  margin-right: 8px;
  font-size: 12px;
  transition: transform 0.2s ease;
  color: #666;

  &.expanded {
    transform: rotate(90deg);
  }
}

.tree-data-item-name-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tree-data-item-child {
  margin-left: 16px;
  border-left: 1px solid #e8e8e8;
  padding-left: 8px;
}

/* 树形展开动画 */
.tree-expand-enter-active,
.tree-expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.tree-expand-enter-from,
.tree-expand-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
}

.tree-expand-enter-to,
.tree-expand-leave-from {
  max-height: 500px;
  opacity: 1;
  transform: translateY(0);
}

/* 滚动条样式 */
.building-tree-data::-webkit-scrollbar {
  width: 6px;
}

.building-tree-data::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.building-tree-data::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.building-tree-data::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>