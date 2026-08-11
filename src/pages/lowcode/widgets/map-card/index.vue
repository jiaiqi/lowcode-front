<template>
  <!-- 自定义底图组件 -->
  <custom-map-view
    v-if="mapBaseSupplier === '自定义底图'"
    :page-item="pageItem"
    :tree-req="treeReq"
    :in-edit="inEdit"
    :page-params-model="pageParamsModel"
    @select="handleMapSelect"
  />

  <!-- 在线地图组件 -->
  <online-map-view
    v-else
    :map-json="mapJson"
    :com-no="pageItem.com_no"
    :page-item="pageItem"
    :in-edit="inEdit"
    :page-params-model="pageParamsModel"
    @select="handleMapSelect"
  />
</template>

<script setup>
/**
 * 地图卡片组件 - 支持自定义底图和在线地图的交互式地图展示组件
 *
 * @component MapCard
 * @description
 * 地图展示组件，支持以下特性：
 *
 * @features
 * - 🗺️ 多种地图底图支持（自定义图片、腾讯地图、百度地图等）
 * - 📍 标记点展示和交互
 * - 🏢 建筑物视图和楼层切换
 * - 🌳 树形数据结构展示
 * - 💬 标记点弹窗详情展示
 * - 🎨 自定义样式和图标支持
 * - 📱 响应式设计
 *
 * @example
 * <map-card
 *   :page-item="pageItemConfig"
 *   :tree-req="treeRequestConfig"
 *   @select="handleSelect"
 * />
 */

import { computed } from "vue";
import CustomMapView from "./components/CustomMapView.vue"; // 自定义底图组件
import OnlineMapView from "./components/OnlineMapView.vue"; // 在线地图组件

/**
 * 组件 Props 定义
 * @typedef {Object} Props
 * @property {Object} pageItem - 页面项配置对象，包含地图配置、样式等信息
 * @property {Object} treeReq - 树形数据请求配置对象，用于获取树形结构数据
 */
const props = defineProps({
  pageItem: {
    type: Object,
    required: true,
    default: () => ({}),
  },
  pageParamsModel: {
    type: Object,
    default: () => ({})
  },
  treeReq: {
    type: Object,
  },
  inEdit: { //处于可视化编辑状态
    type: Boolean,
    default: false,
  }
});

/**
 * 组件事件定义
 */
const emit = defineEmits(['select']);

/**
 * 地图配置计算属性
 */
const mapJson = computed(() => {
  return props.pageItem.map_json || {};
});

const mapBaseSupplier = computed(() => {
  return mapJson.value.map_base_supplier || "";
});

/**
 * 处理地图组件的选择事件
 * 统一处理自定义地图和在线地图的选择事件
 * 
 * @function handleMapSelect
 * @param {Object} item - 选中的数据项
 */
const handleMapSelect = (item) => {
  emit('select', item);
};
</script>

<style lang="scss" scoped></style>