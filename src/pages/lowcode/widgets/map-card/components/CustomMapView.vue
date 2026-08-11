<template>
  <!-- 自定义底图的地图容器 - 支持建筑物视图和普通视图 -->
  <div 
    class="map-view-container"
    ref="mapContainerRef"
    @mouseenter="showFullscreenBtn = true"
    @mouseleave="showFullscreenBtn = false"
  >
    <!-- 建筑物视图的树形数据 -->
    <BuildingTreeData
      :is-building-view="isBuildingView"
      :building-tree="buildingTree"
      :floor-info="floorInfo"
      :expanded-building-nodes="expandedBuildingNodes"
      :map-json="mapJson"
      :get-tree-item-label="getTreeItemLabel"
      @tree-data-click="tapBuildingTreeData"
      @toggle-expand="toggleExpand"
      v-if="isBuildingView"
    />

    <!-- 普通视图的侧边栏树形数据 -->
    <MapTreeSidebar
      v-if="!isBuildingView && showLeftPanel"
      :tree-data="treeData"
      :selected-tree-data="selectedTreeData"
      :expanded-nodes="expandedNodes"
      :is-collapsed="isCollapsed"
      :map-json="mapJson"
      :set-children="setChildren"
      @tree-data-click="tapTreeData"
      @toggle-expand="toggleExpand"
      @toggle-collapsed="changeCollapsed"
    />

    <!-- 自定义底图-地图视图区域 -->
    <zoom-drag-container
      :show-tips="false"
      :in-edit="inEdit"
      :ignore-scale-classes="['map-marker123','draggable-marker111']"
    >
      <!-- 使用抽离的地图视图内容组件 -->
      <MapViewContent
        :map-json="mapJson"
        :is-building-view="isBuildingView"
        :marker-list="setMarkerList"
        :current-image-src="currentImageSrc"
        :background-size="backgroundSize"
        :image-loading="imageLoading"
        :get-item-position="getItemPosition"
        :get-item-icon="getItemIcon"
        :is-active="isActive"
        :set-label-style="setLabelStyle"
        :set-label-active-style="setLabelActiveStyle"
        :allow-click="allowClick"
        :in-editor="inEdit"
        :is-edit-mode="isEditMode"
        @marker-click="handleMarkerClick"
        @marker-position-change="handleMarkerPositionChange"
      />
    </zoom-drag-container>

    <!-- 地图切换记录 - 面包屑导航 -->
    <MapBreadcrumb
      :breadcrumb-items="finallyMapUndoRedo"
      @breadcrumb-click="handleMapJsonChange"
      v-if="finallyMapUndoRedo && finallyMapUndoRedo.length"
    />

    <!-- 使用多来源标记物配置加载标记物数据 -->
    <multi-source-markers
      :map-json="mapJson"
      :source-json="mapJson.multi_src_poi_json"
      :marker-list.sync="markerList"
      :map-data="currrentMapData"
      :select-tree-data="selectedTreeData"
      :page-params-model="pageParamsModel"
      ref="multiSourceMarkersRef"
      v-if="isMultiSource"
    ></multi-source-markers>

    <!-- 地图图例 -->
    <map-legend
      :source-json="mapJson.multi_src_poi_json"
      @legend-fold-change="handleLegendFoldChange"
      v-if="showLegend"
    ></map-legend>

    <!-- 地图标记点弹窗 -->
    <map-popover
      :active-marker="activeMarker"
      :marker-element="activeMarkerElement"
      :page-item="pageItem"
      :card-unit-json="cardUnitJson"
      :is-building-view="isBuildingView"
      :position-direction="popupPosition.positionDirection"
      :position-mode="popupPosition.positionMode"
      @close="closePopup"
    />

    <!-- 地图编辑模式组件 - 放在最外层避免受缩放拖拽影响 -->
    <!-- 地图编辑模式组件 - 放在最外层避免受缩放拖拽影响 -->
    <MapEditMode
      ref="editModeRef"
      :marker-list="setMarkerList"
      :map-json="mapJson"
      @edit-mode-change="handleEditModeChange"
      @save-changes="handleSaveChanges"
      @cancel-changes="handleCancelChanges"
      v-if="showMapEditBtn"
    />

    <!-- 全屏按钮 - 鼠标悬停时显示 -->
    <div
      class="fullscreen-btn"
      :class="{ 'visible': showFullscreenBtn }"
      @click="toggleFullscreen"
      :title="isFullscreen ? '退出全屏' : '进入全屏'"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <!-- 进入全屏图标 -->
        <path
          v-if="!isFullscreen"
          d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"
        />
        <!-- 退出全屏图标 -->
        <path
          v-else
          d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"
        />
      </svg>
    </div>
  </div>
</template>

<script setup>
/**
 * 自定义底图组件 - 支持建筑物视图和普通视图的交互式地图展示组件
 *
 * @component CustomMapView
 * @description
 * 自定义底图展示组件，支持以下特性：
 *
 * @features
 * - 🗺️ 自定义图片底图支持
 * - 🔍 地图缩放功能（Ctrl + 鼠标滚轮）
 * - 🖱️ 地图拖拽功能（Space + 鼠标拖拽）
 * - 📍 标记点展示和交互
 * - 🏢 建筑物视图和楼层切换
 * - 🌳 树形数据结构展示
 * - 💬 标记点弹窗详情展示
 * - 🎨 自定义样式和图标支持
 * - 📱 响应式设计
 *
 * @example
 * <custom-map-view
 *   :page-item="pageItemConfig"
 *   :tree-req="treeRequestConfig"
 * />
 */
import cloneDeep from "lodash/cloneDeep";
import { onMounted, onUnmounted, ref, computed, watch, set } from "vue";

/**
 * 工具函数和组件导入
 */
import { $http, getImagePath } from "@/common/http.js"; // 图片路径处理工具
import { $selectList } from "@/common/http"; // HTTP 请求工具
import TreeDataItem from "./TreeDataItem.vue"; // 树形数据项组件
import ZoomDragContainer from "@/components/common/ZoomDragContainer.vue"; // 缩放拖拽容器组件
import MultiSourceMarkers from "./MultiSourceMarkers.vue";
import MapPopover from "./MapPopover.vue"; // 地图弹窗组件
import MapTreeSidebar from "./MapTreeSidebar.vue"; // 地图树形侧边栏组件
import MapBreadcrumb from "./MapBreadcrumb.vue"; // 地图面包屑导航组件
import MapViewContent from "./MapViewContent.vue"; // 地图视图内容组件
import BuildingTreeData from "./BuildingTreeData.vue"; // 建筑物树形数据组件
import MapLegend from "./MapLegend.vue"; // 地图图例组件
import MapEditMode from "./MapEditMode.vue"; // 地图编辑模式组件

import { useUtils, useRoute } from "@/common/vueApi";

import { useMarkers } from "../composables/useMarkers";

const route = useRoute();

/**
 * 组件 Props 定义
 * @typedef {Object} Props
 * @property {Object} pageItem - 页面项配置对象，包含地图配置、样式等信息
 * @property {Object} treeReq - 树形数据请求配置对象，用于获取树形结构数据
 */
const props = defineProps({
  pageItem: Object, // 页面项配置
  treeReq: Object, // 树形数据请求配置
  inEdit: Boolean, // 是否处于编辑状态
  pageParamsModel: Object, // 页面参数模型
});

const emit = defineEmits(["select"]);

/**
 * 左侧面板折叠状态管理
 */
const isCollapsed = ref(false); // 是否折叠左侧面板

/**
 * 编辑模式状态管理
 */
const isEditMode = ref(false); // 是否处于编辑模式
const editModeRef = ref(null); // 编辑模式组件引用

/**
 * 全屏模式状态管理
 */
const showFullscreenBtn = ref(false); // 是否显示全屏按钮
const isFullscreen = ref(false); // 是否处于全屏状态
const mapContainerRef = ref(null); // 地图容器引用


/**
 * 切换左侧面板折叠状态
 * @function changeCollapsed
 */
const changeCollapsed = () => {
  isCollapsed.value = !isCollapsed.value;
};


const mapUndoRedo = ref([])
const finallyMapUndoRedo = computed(() => {
  let result = []
  if (Array.isArray(mapUndoRedo.value)) {
    result = [...mapUndoRedo.value]
  }
  return result
})
const currentMapInfo = computed(() => {
  if (Array.isArray(finallyMapUndoRedo.value) && finallyMapUndoRedo.value.length) {
    return finallyMapUndoRedo.value[finallyMapUndoRedo.value.length - 1]
  }
})
const currrentMapData = computed(() => {
  if (currentMapInfo.value && currentMapInfo.value.data) {
    return currentMapInfo.value.data
  } else if (selectedTreeData.value) {
    return selectedTreeData.value
  }
})

/**
 * 地图配置
 */
const mapJson = ref(null)
if (props.pageItem.map_json) {
  mapJson.value = props.pageItem.map_json
  if (mapJson.value.map_option?.includes('位置编辑')) {
    if (Array.isArray(mapJson.value.multi_src_poi_json) && mapJson.value.multi_src_poi_json.length) {
      mapJson.value.multi_src_poi_json.forEach(item => {
        if (!item.marker_edit_cfg || !item.marker_edit_cfg?.update_request_json) {
          if (item.srv_req_info?.srv_req_json) {
            const reqJson = item.srv_req_info.srv_req_json
            item.marker_edit_cfg = {
              "update_request_no": item.srv_req_info.srv_req_no || new Date().getTime(),
              "update_request_json": {
                "mapp": reqJson.mapp,
                "srv_type": "update",
                "serviceName": reqJson.serviceName?.replace('_select', '_update')
              }
            }

          }
        }
      })
    }
  }
}

const showLeftPanel = computed(() => {
  return mapJson.value && mapJson.value.map_option?.includes('对象树切换')
})

const isMultiSource = computed(() => {
  return mapJson.value?.map_option?.includes('多来源标记物')
})

const showLegend = computed(() => {
  return mapJson.value?.map_option?.includes('显示图例')
})

const showMapEditBtn = computed(() => {
  if (mapJson.value?.map_option?.includes('位置编辑')) {
    return true
  }
  if (props.inEdit === false && route.query.editMap === 'true') {
    return true
  }
  return false
})

const foldLegends = ref([])
const setMarkerList = computed(() => {
  if (Array.isArray(markerList.value) && markerList.value.length) {
    return markerList.value.map(item => {
      item._visible = true
      const legendName = item._poi_info?.poi_name
      if (legendName && foldLegends.value.includes(legendName)) {
        item._visible = false
      }
      return item
    })
  } else {
    return []
  }
})
const handleLegendFoldChange = (legends) => {
  foldLegends.value = legends.filter(item => item.fold === true).map(item => item.name)
}

const { getItemPosition, getItemIcon, isActive, setLabelActiveStyle, setLabelStyle } = useMarkers(props, mapJson)


const baseIamgeByReq = ref("")


function handleMapJsonChange(item, index) {
  if (index) {
    mapUndoRedo.value.splice(index + 1, 1)
  } else if (index === 0) {
    mapUndoRedo.value = []
  }
  if (item.config) {
    getMapBaseImage(item.config.drill_down['jump_map_json'], item.config, item.data)
  }
  resetMapState()
  mapJson.value = cloneDeep(item.map_json)
  initComponents()
}

/**
 * 标记点和弹窗相关状态
 */
const markerList = ref([]); // 标记点列表
const activeMarker = ref({}); // 当前激活的标记点
const activeMarkerElement = ref(null); // 当前激活标记点的 DOM 元素引用
const popupPosition = computed(() => {
  let result = {
  }
  let direction = mapJson.value?.popup_direction
  const marker = activeMarker.value
  if (marker && marker?._poi_info?.onclick_tips?.popup_direction) {
    // 多来源标记物 弹出卡片配置在标记物配置里
    direction = marker?._poi_info?.onclick_tips?.popup_direction
  }
  if (direction === '自动计算') {
    result.positionMode = 'auto'
  } else if (['点击元素上方', '点击元素右侧', '点击元素下方', '点击元素左侧'].includes(direction)) {
    result.positionMode = 'direction'
    const directionMap = {
      '点击元素上方': 'top',
      '点击元素右侧': 'right',
      '点击元素下方': 'bottom',
      '点击元素左侧': 'left',
    }
    result.positionDirection = directionMap[direction]
  } else if ('屏幕居中' === direction) {
    result.positionMode = 'center'
  }
  return result
})
const cardUnitJson = computed(() => {
  const marker = activeMarker.value
  if (marker && marker?._poi_info?.onclick_tips?.tips_card_unit_json) {
    // 多来源标记物 弹出卡片配置在标记物配置里
    return marker?._poi_info?.onclick_tips?.tips_card_unit_json
  }
  return mapJson.value.tips_card_unit_json
}); // 卡片单元配置

/**
 * 树形数据相关状态
 */
const treeData = ref([]); // 树形数据列表
const selectedTreeData = ref({}); // 当前选中的树形数据项
const expandedNodes = ref({}); // 展开的节点状态映射

/**
 * 建筑物视图相关状态
 */
const isBuildingView = ref(false); // 是否为建筑物视图模式
const buildingInfo = ref({}); // 当前建筑物信息
const buildingTree = ref([]); // 建筑物树形数据
const floorInfo = ref(null); // 当前楼层信息
const expandedBuildingNodes = ref({}); // 建筑物节点展开状态


/**
 * 图片加载状态管理
 */
const imageLoading = ref(false); // 图片是否正在加载
const imageLoaded = ref(true); // 图片是否已加载完成
const currentImageSrc = ref(''); // 当前显示的图片路径

const backgroundSize = computed(() => {
  return mapJson.value?.base_image_fill_method || '100% 100%'
})

/**
 * 递归查找具有底图的父级节点
 * 用于在当前节点没有底图时，向上查找父级节点的底图
 *
 * @function findParentWithBaseImage
 * @param {Object} data - 当前数据节点
 * @param {Array} list - 树形数据列表
 * @returns {Object|null} 找到的父级节点或 null
 */
function findParentWithBaseImage(data, list) {
  if (!data?.parent_no || !list?.length) return null; // 检查参数有效性
  const valCol = mapJson.value?.map_filter_val_field; // 获取值字段配置
  if (!valCol) return null;

  // 遍历列表查找匹配的父级节点
  for (const item of list) {
    if (item[valCol] && item[valCol] === data.parent_no) {
      return item;
    }
    // 递归查找子节点
    if (item.children?.length) {
      const found = findParentWithBaseImage(data, item.children);
      if (found) return found;
    }
  }
  return null;
}

/**
 * 底图计算属性
 * 根据地图配置和当前选中状态，动态计算要显示的底图
 *
 * @computed baseImage
 * @returns {string} 底图图片路径
 * @description
 * 底图选择优先级：
 * 1. 建筑物视图的底图
 * 2. 当前选中项的底图（非叶子节点）
 * 3. 递归查找父级节点的底图
 * 4. 默认底图
 */
const baseImage = computed(() => {
  if (baseIamgeByReq.value) {
    return getImagePath(baseIamgeByReq.value)
  }
  const baseImageCol = mapJson.value.map_base_col; // 底图字段配置
  if (!baseImageCol) {
    // 如果没有配置底图字段，检查楼层信息
    if (floorInfo.value?.[baseImageCol]) {
      return getImagePath(floorInfo.value[baseImageCol]);
    }
    return getImagePath(mapJson.value.base_image); // 返回默认底图
  }

  // 楼视图优先
  if (buildingInfo.value?.[baseImageCol]) {
    return getImagePath(buildingInfo.value[baseImageCol]);
  }

  // 检查当前选中项是否为叶子节点(没有子节点)
  // if (selectedTreeData.value?.is_leaf !== "是") {
  // 检查当前选中项的底图
  if (selectedTreeData.value?.[baseImageCol]) {
    return getImagePath(selectedTreeData.value[baseImageCol]);
  }
  // }

  // 递归查找父级节点的底图
  let parent = findParentWithBaseImage(selectedTreeData.value, treeData.value);
  while (parent) {
    if (parent[baseImageCol]) {
      return getImagePath(parent[baseImageCol]);
    }
    parent = findParentWithBaseImage(parent, treeData.value);
  }

  // 如果都没有找到，使用默认底图
  return getImagePath(mapJson.value.base_image);
});

/**
 * 预加载图片并处理过渡效果
 * @param {string} imageSrc - 图片路径
 * @returns {Promise} 图片加载Promise
 */
function preloadImage(imageSrc) {
  return new Promise((resolve, reject) => {
    if (!imageSrc) {
      resolve();
      return;
    }

    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${imageSrc}`));
    img.src = imageSrc;
  });
}

/**
 * 处理图片切换的平滑过渡
 * @param {string} newImageSrc - 新的图片路径
 */
async function handleImageTransition(newImageSrc) {
  // 如果新图片路径与当前相同，不需要切换
  if (newImageSrc === currentImageSrc.value) {
    return;
  }

  try {
    // 设置加载状态
    imageLoading.value = true;
    imageLoaded.value = false
    // 预加载新图片
    preloadImage(newImageSrc);
    setTimeout(() => {
      currentImageSrc.value = newImageSrc;
      imageLoaded.value = true;
      imageLoading.value = false;
    }, 100);

  } catch (error) {
    console.warn('图片加载失败:', error);
    // 即使加载失败也要更新状态
    currentImageSrc.value = newImageSrc;
    imageLoaded.value = true;
    imageLoading.value = false;
  }
}


/**
 * 初始化自定义地图数据
 * 根据配置获取自定义地图的标记点数据
 *
 * @async
 * @function initCustomMap
 * @returns {Promise<Array>} 标记点数据列表
 */
async function initCustomMap() {
  let list = [];
  try {
    // 处理请求数据类型
    if (
      props.pageItem.srv_req_type === "请求数据" &&
      props.pageItem.srv_req_json
    ) {
      const reqJson = props.pageItem.srv_req_json;
      const req = props.pageItem.srv_req_json;
      const url = `/${reqJson.mapp}/select/${reqJson.serviceName}`;

      const res = await $selectList(url, req); // 发起 API 请求

      if (res.ok) {
        list = res.data || []; // 获取响应数据，确保返回数组
      } else {
        console.warn("API请求失败:", res.message || "未知错误");
        list = []; // 请求失败时返回空数组
      }
    }
    // 处理模拟数据类型
    else if (props.pageItem.srv_req_type === "模拟数据") {
      list = props.pageItem.mock_data_json || []; // 使用模拟数据，确保返回数组
    } else {
      console.warn("未配置有效的数据源类型:", props.pageItem.srv_req_type);
    }
  } catch (error) {
    console.error("初始化自定义地图数据失败:", error);
    list = []; // 发生错误时返回空数组
  }

  return list;
}


function allowClick(marker) {
  if (marker?._poi_info?.onclick) {
    return true
  } else if (marker && cardUnitJson.value && mapJson.value.onclick === '弹出卡片') {
    return true
  }
}

function setActiveMarker(marker, event) {
  // 检查是否需要显示弹窗
  // 如果点击的是当前激活的标记点，隐藏弹窗
  if (marker?.id && marker?.id === activeMarker.value?.id) {
    activeMarker.value = null;
    activeMarkerElement.value = null;
  } else {
    activeMarker.value = marker; // 设置新的激活标记点
    // 记录标记点元素引用
    if (event && event.currentTarget) {
      activeMarkerElement.value = event.currentTarget; // 保存元素引用
    }
  }
}

/**
 * 统一的标记点点击处理函数
 * 处理所有类型标记点的点击事件，包括弹窗显示和建筑物视图切换
 *
 * @function handleMarkerClick
 * @param {Object} marker - 标记点数据对象
 * @param {Event} event - 点击事件对象
 */
function handleMarkerClick(marker, event) {
  if (marker?._poi_info?.onclick) {
    // 多标记物点击事件处理
    switch (marker._poi_info.onclick) {
      case '弹出卡片':
        if (marker?._poi_info?.onclick_tips?.tips_card_unit_json) {
          // 设置激活标记点
          setActiveMarker(marker, event)
        }
        break;
      case '跳转':

        break;

      case '下钻':
        drillDown(marker._poi_info, marker)
        break;
      case '设置变量':

        break;
    }
    return
  } else if (mapJson.value?.building_view_val && mapJson.value.building_view_col) {
    // 检查是否配置了建筑物视图切换条件
    const val = marker[mapJson.value?.building_view_col]; // 获取标记点的建筑物视图字段值
    // 如果值匹配建筑物视图条件，切换到建筑物视图
    if (val && mapJson.value?.building_view_val?.includes(val)) {
      switchToBuildingView(marker);
      return; // 切换到建筑物视图后直接返回
    }
  } else if (marker && cardUnitJson.value) {
    // 检查是否需要显示弹窗
    const shouldShowPopover = mapJson.value.onclick === '弹出卡片';
    if (shouldShowPopover) {
      setActiveMarker(marker, event)
    }
  }


}

async function getMapBaseImage(map_json, config, data = {}) {
  if (map_json?.image_source_type === '接口请求') {
    // 底图从接口请求查找
    if (map_json.base_image_srv_req_json) {
      if (config?.col_map?.col_no) {
        data.noVal = data[config.col_map.col_no]
      }
      const baseImageData = await getMapBaseImageWithReq(map_json.base_image_srv_req_json, data)
      if (map_json?.map_base_col) {
        const baseImageNo = baseImageData[map_json.map_base_col]
        baseIamgeByReq.value = baseImageNo
      }
    }
  }
}

/**
 * 地图下钻
 * @param params 
 */
async function drillDown(config, data) {
  const { drill_down } = config
  if (drill_down['jump_map_json']) {
    if (!mapUndoRedo.value.length) {
      // 下钻前先保存原始地图配置
      mapUndoRedo.value.push({
        map_json: cloneDeep(mapJson.value),
        markerList: cloneDeep(markerList.value),
      })
    }

    handleMapJsonChange({
      map_json: drill_down['jump_map_json']
    })
    getMapBaseImage(drill_down['jump_map_json'], config, data)
    // 下钻后保存新地图配置
    mapUndoRedo.value.push({
      map_json: cloneDeep(drill_down['jump_map_json']),
      data: data,
      config: config,
    })
  }
}
const { renderStr } = useUtils()
async function getMapBaseImageWithReq(reqJson, data) {
  let req = {}
  if (reqJson) {
    req = { ...reqJson }
    if (Array.isArray(reqJson?.condition) && reqJson.condition.length) {
      req.condition = reqJson.condition.map(item => {
        return {
          ...item,
          value: renderStr(item.value, data)
        }
      })
    }
    const url = `${req.mapp}/select/${req.serviceName}`
    const res = await $http.post(url, req)
    if (res.data.data?.length) {
      const baseImageInfo = res.data.data[0]
      return baseImageInfo
    }
  }
}

/**
 * 编辑模式切换处理
 * @param {boolean} editMode - 是否进入编辑模式
 */
function handleEditModeChange(editMode) {
  isEditMode.value = editMode
  // 可以在这里添加编辑模式切换时的额外逻辑
}

/**
 * 标记点位置变更处理
 * @param {Object} marker - 标记点数据
 * @param {number} newX - 新的X坐标
 * @param {number} newY - 新的Y坐标
 */
function handleMarkerPositionChange(marker, newX, newY) {
  // 直接记录到编辑模式组件
  if (editModeRef.value && typeof editModeRef.value.recordMarkerChange === 'function') {
    editModeRef.value.recordMarkerChange(marker, newX, newY)
  }
}
const multiSourceMarkersRef = ref(null)
/**
 * 保存标记点位置更改
 * @param {Array} changesArray - 按update_request_no分组的更改数据
 */
function handleSaveChanges(changesArray) {
  // 调用API保存更改到后端
  let successCount = 0
  changesArray.forEach(async (group) => {
    const { update_request_no, marker_edit_cfg, markers } = group
    const { update_request_json: reqJson } = marker_edit_cfg
    const url = `/${reqJson.mapp}/operate/${reqJson.serviceName}`
    if (Array.isArray(group.markers) && group.markers.length) {
      let reqs = []
      group.markers.forEach(item => {
        const markerData = item.markerData
        const { col_x, col_y } = markerData._col_map
        const { x: oldX, y: oldY } = item.originalPosition
        const { x: newX, y: newY } = item.newPosition
        if (oldX !== newX || oldY !== newY) {
          let data = {}
          if (oldX !== newX) {
            data[col_x] = Number(newX.toFixed(4))
          }
          if (oldY !== newY) {
            data[col_y] = Number(newY.toFixed(4))
          }
          reqs.push({
            "serviceName": reqJson.serviceName,
            "condition": [
              {
                "colName": "id",
                "ruleType": "eq",
                "value": markerData.id
              }
            ],
            "data": [data]
          })
        }
      })
      if (Array.isArray(reqs) && reqs.length) {
        try {
          const res = await $http.post(url, reqs)
          // 更新点位
          if (res.data.state === 'SUCCESS') {
            multiSourceMarkersRef.value.fetchAllMarkers()
            successCount++
          }
        } catch (error) {
          console.error(`保存 ${update_request_no} 的标记点位置失败:`, error)
        }
      }
    }
  })

  if (successCount === changesArray.length) {
    Message.success('保存成功')
  }
}

/**
/**
 * 取消标记点位置更改
 */
function handleCancelChanges() {
  // 标记点位置已在MapEditMode组件中恢复
}

/**
 * 切换全屏模式
 */
function toggleFullscreen() {
  if (!mapContainerRef.value) return;

  if (!isFullscreen.value) {
    // 进入全屏
    enterFullscreen();
  } else {
    // 退出全屏
    exitFullscreen();
  }
}

/**
 * 进入全屏模式
 */
function enterFullscreen() {
  const element = mapContainerRef.value;
  
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
}

/**
 * 退出全屏模式
 */
function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
}

/**
 * 监听全屏状态变化
 */
function handleFullscreenChange() {
  isFullscreen.value = !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
}

/**
 * 重置地图状态
 * 重置地图配置、标记点列表、激活标记点等状态
 *
 * @function resetMapState
 */
async function resetMapState() {
  isCollapsed.value = false;
  mapJson.value = null
  markerList.value = []
  activeMarker.value = null
  activeMarkerElement.value = null

  treeData.value = []
  selectedTreeData.value = null
  expandedNodes.value = {}

  isBuildingView.value = false;
  buildingInfo.value = null
  buildingTree.value = []
  floorInfo.value = null
  expandedBuildingNodes.value = {}

  imageLoading.value = false;
  imageLoaded.value = true;
  currentImageSrc.value = ""
  baseIamgeByReq.value = ""
  
  // 重置编辑模式状态
  isEditMode.value = false;
}

/**
 * 关闭弹窗
 * 隐藏当前激活的标记点弹窗
 *
 * @function closePopup
 */
function closePopup() {
  activeMarker.value = null;
  activeMarkerElement.value = null;
}


/**
 * 切换树形节点展开/折叠状态
 *
 * @function toggleExpand
 * @param {Object} item - 树形数据项
 */
async function toggleExpand(item) {
  if (!item || !item.id) return; // 检查参数有效性

  // 切换展开状态
  set(expandedNodes.value, item.id, !expandedNodes.value[item.id]);

  // if (mapJson.value?.map_option?.includes('多来源标记物')) {
  //   return
  // }
  await setChildren(item);

}

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
  if (item?.[mapJson.value?.map_filter_label_field]) {
    return item[mapJson.value?.map_filter_label_field];
  }
  // 备用字段：area_name 或 name
  return item?.area_name || item?.name || "";
}


/**
 * 监听选中树形数据的变化
 * 当选中项变化时，更新标记点列表
 */
watch(
  () => selectedTreeData.value,
  (newVal) => {
    // 如果选中项有子节点且配置了坐标字段，过滤出有坐标的子项作为标记点
    if (mapJson.value?.map_option?.includes('多来源标记物')) {

    } else if (
      newVal?.children?.length &&
      mapJson.value?.x_col &&
      mapJson.value?.y_col
    ) {
      markerList.value = newVal.children.filter(
        (item) => item[mapJson.value?.x_col] && item[mapJson.value?.y_col]
      ).map(item => {
        return {
          ...item,
          _type: '标签'
        }
      })
    }
  }
);

/**
 * 树形数据项点击处理函数
 *
 * @function tapTreeData
 * @param {Object} item - 点击的树形数据项
 */
async function tapTreeData(item) {
  await setChildren(item);
  selectedTreeData.value = item; // 设置选中项
  emit("select", item); // 发射选择事件
  // 切换展开状态
  if (item?.id) {
    set(expandedNodes.value, item.id, !expandedNodes.value[item.id]);
  }
}

/**
 * 初始化地图树形数据
 * 从服务器获取树形结构数据并初始化
 *
 * @async
 * @function initMapTreeData
 */
async function initMapTreeData() {
  const req = setTreeReq.value; // 获取请求配置
  if (!req) {
    return;
  }

  // req.treeData = true; // 标记为树形数据请求
  const url = `/${req.mapp}/select/${req.serviceName}`;
  const res = await $selectList(url, req); // 发起 API 请求

  if (res.ok) {
    if (res.data.length) {
      await setChildren(res.data[0]);
      selectedTreeData.value = res.data[0]; // 默认选中第一项
    }
    treeData.value = res.data;
  }
}

async function getChildrenData(parent_no) {
  const req = cloneDeep(props.treeReq || mapJson.value?.map_tree_req_json); // 获取请求配置
  if (!req) {
    return;
  }
  if (!parent_no) {
    return;
  }

  if (!req.condition) {
    req.condition = [];
  }
  let condition = req.condition.filter((item) => item.colName !== "parent_no");
  req.condition = [
    ...condition,
    {
      colName: "parent_no",
      ruleType: "eq",
      value: parent_no,
    },
  ];
  const url = `/${req.mapp}/select/${req.serviceName}`;
  const res = await $selectList(url, req);
  if (res.ok) {
    return res.data;
  } else if (res.msg) {
    // ElMessage.error(res.msg);
  }
  return [];
}

async function setChildren(item) {
  const noCol = mapJson.value?.["map_filter_val_field"];
  if (item.is_leaf !== "是" && !item.children?.length) {
    const children = await getChildrenData(item[noCol]);
    set(item, "children", children);
  }
  return item;
}

/**
 * 建筑物树形数据项点击处理函数
 *
 * @function tapBuildingTreeData
 * @param {Object} item - 点击的建筑物数据项
 */
async function tapBuildingTreeData(item) {
  await setChildren(item);

  floorInfo.value = item; // 设置当前楼层信息
  // 切换展开状态
  if (item?.id) {
    set(
      expandedBuildingNodes.value,
      item.id,
      !expandedBuildingNodes.value[item.id]
    );
  }
  emit("select", item); // 发射选择事件
}

/**
 * 切换到建筑物视图
 *
 * @function switchToBuildingView
 * @param {Object} marker - 建筑物标记点数据
 */
function switchToBuildingView(marker) {
  isBuildingView.value = true; // 启用建筑物视图模式
  buildingInfo.value = marker; // 设置建筑物信息
  buildingTree.value = getBuildingTree(marker); // 获取建筑物树形数据
  // 默认选中第一个楼层
  if (buildingTree.value?.length) {
    floorInfo.value = buildingTree.value[0];
  }
}

/**
 * 获取建筑物树形数据
 * 从标记点的子数据中筛选出建筑物相关数据
 *
 * @function getBuildingTree
 * @param {Object} marker - 建筑物标记点数据
 * @returns {Array} 建筑物树形数据列表
 */
function getBuildingTree(marker) {
  let list = marker?.children || []; // 获取子数据列表
  let res = [];

  // 筛选包含建筑物视图字段的数据项
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (item?.[mapJson.value?.building_view_col]) {
      res.push(item);
    }
  }

  return res;
}

const setTreeReq = computed(() => {
  let result = false;
  if (props.treeReq?.serviceName) {
    result = props.treeReq;
  } else if (mapJson.value?.map_tree_req_json?.serviceName) {
    result = mapJson.value?.map_tree_req_json;
  }
  return result;
});

/**
 * 监听baseImage变化，触发平滑过渡
 */
watch(
  () => baseImage.value,
  (newImageSrc) => {
    handleImageTransition(newImageSrc);
  },
  { immediate: true }
);


function initComponents() {
  // 检查是否有树形数据配置
  if (setTreeReq.value && showLeftPanel.value) {
    initMapTreeData(); // 初始化树形数据
  } else if (!isMultiSource.value) {
    // 初始化自定义地图数据
    initCustomMap().then((res) => {
      markerList.value = res;
    });
  }
}

/**
/**
 * 组件挂载生命周期钩子
 * 初始化地图
 */
onMounted(() => {
  initComponents();
  
  // 添加全屏状态变化监听器
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('mozfullscreenchange', handleFullscreenChange);
  document.addEventListener('MSFullscreenChange', handleFullscreenChange);
});

/**
 * 组件卸载生命周期钩子
 * 清理事件监听器
 */
onUnmounted(() => {
  // 移除全屏状态变化监听器
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
  document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
});

</script>

<style lang="scss" scoped>
.map-view-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  outline: none;
  user-select: none;
  scrollbar-width: none;
}

/* 全屏按钮样式 */
.fullscreen-btn {
  position: absolute;
  top: 60px;
  right: 15px;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 1001;
  color: #333;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

  &:hover {
    background: rgba(255, 255, 255, 1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    transform: translateY(-1px);
  }

  &.visible {
    opacity: 1;
    visibility: visible;
  }

  svg {
    transition: transform 0.2s ease;
  }

  &:hover svg {
    transform: scale(1.1);
  }
}

// 移除原有的地图视图相关样式，这些样式已移动到 MapViewContent 组件中</style>
