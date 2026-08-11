<template>
  <div
    class="map-view base-image"
    :class="{
      'building-view': isBuildingView,
      'custom-map': !isBuildingView,
      'image-loading': imageLoading,
      'edit-mode': isEditMode,
    }"
    :style="{
      backgroundImage: `url(${currentImageSrc})`,
      backgroundSize: backgroundSize,
    }"
    ref="mapViewContentRef"
  >
    <!-- 图片加载动画 -->
    <div
      class="image-loading-overlay"
      v-if="imageLoading"
    >
      <div class="loading-spinner">
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="loading-text">底图加载中...</div>
      </div>
    </div>

    <!-- 建筑物视图内容 -->
    <template v-if="isBuildingView">
      <!-- building-view 的标记点内容可以在这里添加 -->
    </template>

    <!-- 普通视图的标记点内容 -->
    <template v-else>
      <!-- 标签类型的标记点 -->
      <template v-if="!mapJson.multi_src_poi_json && mapJson && mapJson.map_type === '标签' && markerList.length">
        <div
          class="map-marker"
          :style="[
            {
              ...setLabelStyle,
            },
            getItemPosition(marker),
          ]"
          v-for="marker in markerList"
          :key="marker.id"
          @click="handleMarkerClick(marker, $event)"
        >
          <div class="map-marker-content">
            {{ getItemLabel(marker) || "" }}
          </div>
        </div>
      </template>

      <!-- 图标类型的标记点 -->
      <template v-else-if="markerList.length">
        <!-- 编辑模式下使用可拖拽标记点 -->
        <template v-if="isEditMode">
          <DraggableMarker
            v-for="item in markerList"
            :key="item.id"
            v-show="item._visible !== false"
            :item="item"
            :map-json="mapJson"
            :is-edit-mode="isEditMode"
            :get-item-position="getItemPosition"
            @marker-click="handleMarkerClick"
            @position-change="handleMarkerPositionChange"
            @drag-start="handleMarkerDragStart"
            @drag-end="handleMarkerDragEnd"
          >
            <div class="drag-handle"></div> <!-- 添加拖拽手柄 -->
          </DraggableMarker>
        </template>
        <!-- 普通模式下使用原有标记点 -->
        <template v-else>
          <MapMarker
            v-for="item in markerList"
            :key="item.id"
            v-show="item._visible !== false"
            :item="item"
            :map-json="mapJson"
            @marker-click="handleMarkerClick"
          />
        </template>
      </template>
    </template>

  </div>
</template>

<script setup>
import { getImagePath } from '@/common/http.js'
import { formatStyleData } from '@/pages/lowcode/common'
import { computed, ref, onMounted, onUnmounted } from 'vue'
import MapMarker from './MapMarker.vue'
import DraggableMarker from './DraggableMarker.vue'
import { useRoute } from '@/common/vueApi'
/**
 * 地图视图内容组件
 * @component MapViewContent
 * @description 负责渲染地图底图、加载动画和标记点，支持编辑模式
 */

/**
 * 组件 Props 定义
 */
const props = defineProps({
  // 地图配置
  mapJson: {
    type: Object,
    required: true
  },
  // 是否为建筑物视图
  isBuildingView: {
    type: Boolean,
    default: false
  },
  // 标记点列表
  markerList: {
    type: Array,
    default: () => []
  },
  // 当前图片路径
  currentImageSrc: {
    type: String,
    default: ''
  },
  // 背景尺寸
  backgroundSize: {
    type: String,
    default: 'auto'
  },
  // 图片加载状态
  imageLoading: {
    type: Boolean,
    default: false
  },
  inEditor: { //处于可视化编辑器中
    type: Boolean,
    default: false
  },
  // 是否处于编辑模式
  isEditMode: {
    type: Boolean,
    default: false
  },
});

/**
 * 组件事件定义
 */
const emit = defineEmits([
  'marker-click',
  'marker-position-change'
]);

const mapViewContentRef = ref(null)


/**
 * 标记点点击处理
 * @param {Object} marker - 标记点数据
 * @param {Event} event - 点击事件
 */
function handleMarkerClick(marker, event) {
  emit('marker-click', marker, event);
}

/**
 * 标记点位置变更处理
 * @param {Object} marker - 标记点数据
 * @param {number} newX - 新的X坐标
 * @param {number} newY - 新的Y坐标
 */
function handleMarkerPositionChange(marker, newX, newY) {
  emit('marker-position-change', marker, newX, newY)
}

/**
 * 标记点拖拽开始处理
 * @param {Object} marker - 标记点数据
 */
function handleMarkerDragStart(marker) {
  console.log('开始拖拽标记点:', marker)
}

/**
 * 标记点拖拽结束处理
 * @param {Object} marker - 标记点数据
 */
function handleMarkerDragEnd(marker) {
  console.log('结束拖拽标记点:', marker)
}


function getItemLabel(item) {
  if (item._col_map && item._col_map.col_label && item[item._col_map.col_label]) {
    return item[item._col_map.col_label]
  }
  if (props.mapJson.col_label && item[props.mapJson.col_label]) {
    return item[props.mapJson.col_label]
  }
}

function getLabelStyle(item) {
  if (item._poi_info?.label_style_json) {
    return formatStyleData(item._poi_info?.label_style_json)
  }
  return {}
}

function getIconStyle(item) {
  if (item._poi_info?.icon_style_json) {
    return formatStyleData(item._poi_info?.icon_style_json)
  }
  return {}
}
const route = useRoute()

/**
 * 标签样式计算属性
 */
const setLabelStyle = computed(() => {
  if (
    props.mapJson?.map_type === "标签" &&
    props.mapJson?.col_label_style_json
  ) {
    return formatStyleData(props.mapJson?.col_label_style_json)
  }
  return {}
})

/**
 * 标签激活状态样式计算属性
 */
const setLabelActiveStyle = computed(() => {
  if (
    props.mapJson?.map_type === "标签" &&
    props.mapJson?.label_active_style_json
  ) {
    return formatStyleData(props.mapJson?.label_active_style_json)
  }
})

/**
 * 获取标记点图标
 */
function getItemIcon(item = {}) {
  if (!item || typeof item !== "object") {
    console.warn("getItemIcon: 无效的item参数", item)
    item = {}
  }

  if (item?.col_map?.customized_icon) {
    return getImagePath(item[item.col_map.customized_icon])
  } else if (item?._poi_info?.poi_type_icon) {
    return getImagePath(item._poi_info.poi_type_icon)
  } else if (item?._poi_info?.icon) {
    return getImagePath(item._poi_info.icon)
  }

  const mapConfig = props.mapJson
  if (!mapConfig) {
    console.warn("getItemIcon: 地图配置不存在")
    return ""
  }

  try {
    const iconCol = mapConfig.marker_icon_col
    if (iconCol && item[iconCol]) {
      return getImagePath(item[iconCol])
    }

    if (mapConfig.icon_default) {
      return getImagePath(mapConfig.icon_default)
    }
  } catch (error) {
    console.error("getItemIcon: 获取图标路径失败", error)
  }

  return ""
}

/**
 * 获取标记点位置
 */
function getItemPosition(item = {}) {
  let pos = {
    left: 0,
    top: 0,
  }

  if (item?._col_map) {
    const { col_label, col_no, col_x, col_x_width, col_y, col_y_width, customized_icon } = item._col_map || {}

    pos.label = item[col_label]
    pos.left = item[col_x] + "%"
    pos.top = item[col_y] + "%"
    if (col_x_width) {
      pos.width = col_x_width + '%'
    }
    if (col_y_width) {
      pos.height = col_y_width + '%'
    }
    pos.icon = customized_icon
    pos.value = item[col_no]
  } else if (props.mapJson?.x_col && props.mapJson?.y_col) {
    if (item[props.mapJson?.x_col]) {
      pos.left = item[props.mapJson?.x_col] + "%"
    }
    if (item[props.mapJson?.y_col]) {
      pos.top = item[props.mapJson?.y_col] + "%"
    }
  }

  return pos
}


</script>

<style lang="scss" scoped>
.map-view {
  width: 100%;
  height: 100%;
  position: relative;

  // 编辑模式样式
  &.edit-mode {
    .map-marker {
      transition: all 0.2s ease;
      cursor: move;

      &:hover {
        transform: translate(-50%, -50%) scale(1.1);
        box-shadow: 0 0 10px rgba(0, 122, 255, 0.5);
      }

      &.dragging {
        opacity: 0.8;
        box-shadow: 0 0 15px rgba(0, 122, 255, 0.8);
      }
    }

    .drag-handle {
      width: 20px;
      height: 20px;
      background: #007aff;
      border-radius: 50%;
      position: absolute;
      bottom: -10px;
      right: -10px;
      cursor: move;
    }
  }
}

.base-image {
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
  transition: opacity 0.3s ease-in-out;
  opacity: 1;

  /* 图片加载状态样式 */
  &.image-loading {
    opacity: 0.7;
    backdrop-filter: blur(20px);
  }
}

/* 图片加载动画样式 */
.image-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-in-out;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.spinner-ring {
  width: 40px;
  height: 40px;
  border: 3px solid transparent;
  border-top: 3px solid #007aff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  position: absolute;
}

.spinner-ring:nth-child(1) {
  width: 40px;
  height: 40px;
  animation-delay: 0s;
}

.spinner-ring:nth-child(2) {
  width: 60px;
  height: 60px;
  border-top-color: #4a90e2;
  animation-delay: -0.3s;
  animation-duration: 1.5s;
}

.spinner-ring:nth-child(3) {
  width: 80px;
  height: 80px;
  border-top-color: #87ceeb;
  animation-delay: -0.6s;
  animation-duration: 2s;
}

.loading-text {
  margin-top: 120px;
  font-size: 14px;
  color: #666;
  font-weight: 500;
  animation: pulse 1.5s ease-in-out infinite;
}

/* 动画关键帧 */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes pulse {

  0%,
  100% {
    opacity: 0.6;
  }

  50% {
    opacity: 1;
  }
}

.building-view {
  display: grid;
  grid-template-columns: 150px 1fr;
  grid-template-rows: 1fr;

  .building-tree-data {
    position: unset;
    height: 100%;
    overflow-y: auto;
    display: inline-block;
  }

  .map-bg {
    display: inline-block;
    flex: 1;
    background-color: rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
    position: relative;
    z-index: 10;
    height: 100%;
    width: 100%;
  }
}

.custom-map {
  position: relative;
  width: 100%;
  height: 100%;

  .map-marker {
    position: absolute;
    transform: translate(-50%, -50%);

    .marker-icon {
      width: 30px;
      transition: all 0.3s ease-in-out;

      &.cursor-pointer {
        cursor: pointer;

        &:hover {
          transform: scale(1.1);
          z-index: 20;
        }

        &:active {
          transform: scale(0.95);
        }
      }
    }

    .marker-label {
      position: absolute;
      bottom: -10px;
      left: 50%;
      width: 100px;
      transform: translate(-50%, 100%);
    }
  }
}

.building-view {
  background-color: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.2s ease-out;

  // 拖拽时禁用过渡动画以提升性能
  &.no-transition {
    transition: none !important;
  }

  // 可以在这里添加building-view特有的样式
  .building-marker {
    position: absolute;
    transform: translate(-50%, -50%);

    &.cursor-pointer {
      cursor: pointer;
    }

    .marker-icon {
      width: 30px;
    }
  }
}
</style>