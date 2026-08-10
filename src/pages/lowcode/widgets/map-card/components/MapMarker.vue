<template>
  <div
    class="map-marker"
    :style="[
      getItemPosition(item)
    ]"
    :title="getItemLabel(item)"
    :class="{ 'cursor-pointer': allowClick(item) }"
    @click.stop="handleMarkerClick(item, $event)"
  >
    <img loading="lazy"
      :src="getItemIcon(item)"
      class="marker-icon"
      :style="getIconStyle(item)"
      v-if="!onlyShowLabel && getItemIcon(item)"
    />
    <span
      v-if="shouldShowLabel && getItemLabel(item)"
      :style="getLabelStyle(item)"
      class="marker-label"
      :class="{
        'only-show-label': onlyShowLabel
      }"
    >{{ getItemLabel(item) }}</span>
  </div>
</template>

<script setup>
import { getImagePath } from '@/common/http.js'
import { formatStyleData } from '@/pages/lowcode/vendor/datav/common/index.js'
import { computed } from 'vue';

/**
 * 地图标记组件
 * @component MapMarker
 * @description 负责渲染单个地图标记点，包括图标和标签
 */

/**
 * 组件 Props 定义
 */
const props = defineProps({
  // 标记点数据
  item: {
    type: Object,
    required: true
  },
  // 地图配置
  mapJson: {
    type: Object,
    required: true
  },
  // 是否在拖拽组件中
  inDrag: {
    type: Boolean,
    default: false
  }
});

const onlyShowLabel = computed(() => {
  return props.item._poi_info?.display_label === '仅显示标签'
})

/**
 * 判断是否应该显示标签
 */
const shouldShowLabel = computed(() => {
  const displayLabel = props.item._poi_info?.display_label
  // 当display_label为空、null、undefined或者为"否"时，不显示标签
  if (!displayLabel || displayLabel === '否') {
    return false
  }
  // 当display_label为"仅显示标签"或"是"时，显示标签
  return displayLabel === '仅显示标签' || displayLabel === '是'
})

/**
 * 组件事件定义
 */
const emit = defineEmits(['marker-click']);

/**
 * 标记点点击处理
 * @param {Object} item - 标记点数据
 * @param {Event} event - 点击事件
 */
function handleMarkerClick(item, event) {
  if (allowClick(item)) {
    emit('marker-click', item, event);
  }
}

/**
 * 判断是否允许点击
 * @param marker 标记点数据
 * @returns {boolean} 是否允许点击
 */
function allowClick(marker) {
  if (props.mapJson?.map_option?.includes('多来源标记物')) {
    if (marker?._poi_info?.onclick) {
      return true
    }
  } else {
    if (props.mapJson.onclick) {
      return true
    }
  }
}

/**
 * 获取标记点标签文本
 * @param {Object} item - 标记点数据
 * @returns {string} 标签文本
 */
function getItemLabel(item) {
  if (item._col_map && item._col_map.col_label && item[item._col_map.col_label]) {
    return item[item._col_map.col_label]
  }
  if (props.mapJson.col_label && item[props.mapJson.col_label]) {
    return item[props.mapJson.col_label]
  }
  return ''
}

/**
 * 获取标签样式
 * @param {Object} item - 标记点数据
 * @returns {Object} 样式对象
 */
function getLabelStyle(item) {
  if (item._poi_info?.label_style_json) {
    return formatStyleData(item._poi_info?.label_style_json)
  }
  return {}
}

/**
 * 获取图标样式
 * @param {Object} item - 标记点数据
 * @returns {Object} 样式对象
 */
function getIconStyle(item) {
  if (item._poi_info?.icon_style_json) {
    return formatStyleData(item._poi_info?.icon_style_json)
  }
  return {}
}

/**
 * 获取标记点图标
 * @param {Object} item - 标记点数据
 * @returns {string} 图标路径
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
 * @param {Object} item - 标记点数据
 * @returns {Object} 位置样式对象
 */
function getItemPosition(item = {}) {
  if (props.inDrag) {
    return {
    }
  }
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

  // 检查最终的left和top值，如果都为0则给随机值
  const leftValue = parseFloat(pos.left) || 0
  const topValue = parseFloat(pos.top) || 0

  if (leftValue === 0 && topValue === 0) {
    // 生成5-15%之间的随机值，避免太靠边或重叠
    const randomLeft = Math.random() * 10 + 5 // 5-15%
    const randomTop = Math.random() * 10 + 5  // 5-15%

    pos.left = randomLeft + "%"
    pos.top = randomTop + "%"
  }

  return pos
}
</script>

<style lang="scss" scoped>
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
    min-width: 50px;
    text-align: center;
    white-space: nowrap;
    transform: translate(-50%, 100%);

    &.only-show-label {
      position: relative;
      left: unset;
      bottom: unset;
      transform: translate(-50%, 0);
    }
  }
}
</style>