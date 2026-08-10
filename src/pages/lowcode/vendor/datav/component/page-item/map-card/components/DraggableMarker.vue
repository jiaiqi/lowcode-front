<template>
  <div
    class="draggable-marker"
    :class="{
      'is-dragging': isDragging,
      'is-editable': isEditable && isEditMode,
      'is-not-editable': !isEditable && isEditMode
    }"
    :style="[
      markerStyle,
      getItemPosition(item),
      isDragging ? { zIndex: 9999 } : {}
    ]"
    @mousedown="handleMouseDown"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- 复用MapMarker组件 -->
    <MapMarker
      :item="item"
      :map-json="mapJson"
      @marker-click="handleMarkerClick"
      class="marker-content"
      :in-drag="true"
    />

    <!-- 编辑模式下的标题提示 -->
    <div
      v-if="isEditMode && showTitle"
      class="marker-title-tooltip"
    >
      <div class="tooltip-content">
        {{ getMarkerTitle() }}
      </div>
    </div>

    <!-- 编辑模式下的拖拽指示器 -->
    <div
      v-if="isEditable && isEditMode"
      class="drag-indicator"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path
          d="M13,6V11H18V7.75L22.25,12L18,16.25V13H13V18H16.25L12,22.25L7.75,18H11V13H6V16.25L1.75,12L6,7.75V11H11V6H7.75L12,1.75L16.25,6H13Z"
        />
      </svg>
    </div>

    <!-- 不可编辑提示 -->
    <div
      v-if="!isEditable && isEditMode"
      class="not-editable-tooltip"
    >
      <div class="tooltip-content">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="currentColor"
          class="warning-icon"
        >
          <path
            d="M12,2L13.09,8.26L22,9L13.09,9.74L12,16L10.91,9.74L2,9L10.91,8.26L12,2M12,7A2,2 0 0,0 10,9A2,2 0 0,0 12,11A2,2 0 0,0 14,9A2,2 0 0,0 12,7Z"
          />
        </svg>
        <span>请配置编辑服务</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import MapMarker from './MapMarker.vue'

/**
 * 可拖拽标记点组件
 * @component DraggableMarker
 * @description 支持拖拽编辑的地图标记点组件，复用MapMarker组件
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
  // 是否处于编辑模式
  isEditMode: {
    type: Boolean,
    default: false
  },
  // 标记点样式
  markerStyle: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits([
  'marker-click',
  'position-change',
  'drag-start',
  'drag-end'
])

// 拖拽状态
const isDragging = ref(false)
const dragStartPos = ref({ x: 0, y: 0 })
const markerStartPos = ref({ x: 0, y: 0 })

// 标题显示状态
const showTitle = ref(false)

/**
 * 检查标记点是否可编辑
 */
const isEditable = computed(() => {
  return props.item._poi_info?.marker_edit_cfg?.update_request_no
})

/**
 * 获取标记点标题
 */
function getMarkerTitle() {
  // 优先使用标签字段
  const labelCol = props.item._col_map?.col_label
  if (labelCol && props.item[labelCol]) {
    return props.item[labelCol]
  }

  // 其次使用POI名称
  if (props.item._poi_info?.poi_name) {
    return props.item._poi_info.poi_name
  }

  // 使用ID或默认文本
  return props.item.id || props.item.name || '标记点'
}

/**
 * 处理鼠标进入事件
 */
function handleMouseEnter() {
  if (props.isEditMode && !isDragging.value) {
    showTitle.value = true
  }
}

/**
 * 处理鼠标离开事件
 */
function handleMouseLeave() {
  showTitle.value = false
}

/**
 * 处理鼠标按下事件
 */
function handleMouseDown(event) {
  // 隐藏标题
  showTitle.value = false

  // 只有在编辑模式下且标记点可编辑时才允许拖拽
  if (!props.isEditMode || !isEditable.value) {
    return
  }

  event.preventDefault()
  event.stopPropagation()

  // 记录拖拽开始位置
  dragStartPos.value = {
    x: event.clientX,
    y: event.clientY
  }

  // 记录标记点初始位置
  const xCol = props.item._col_map?.col_x || props.mapJson.x_col
  const yCol = props.item._col_map?.col_y || props.mapJson.y_col

  if (xCol && yCol) {
    markerStartPos.value = {
      x: props.item[xCol],
      y: props.item[yCol]
    }
  }

  isDragging.value = true
  emit('drag-start', props.item)

  // 添加全局事件监听
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)

  // 防止页面选择文本
  document.body.style.userSelect = 'none'
}

/**
 * 处理鼠标移动事件
 */
function handleMouseMove(event) {
  if (!isDragging.value) return

  event.preventDefault()

  // 计算鼠标移动距离
  const deltaX = event.clientX - dragStartPos.value.x
  const deltaY = event.clientY - dragStartPos.value.y

  // 获取地图容器元素
  const mapContainer = event.target.closest('.map-view')
  if (!mapContainer) return

  const containerRect = mapContainer.getBoundingClientRect()

  // 将像素移动距离转换为百分比
  const deltaXPercent = (deltaX / containerRect.width) * 100
  const deltaYPercent = (deltaY / containerRect.height) * 100

  // 计算新位置
  const newX = Math.max(0, Math.min(100, markerStartPos.value.x + deltaXPercent))
  const newY = Math.max(0, Math.min(100, markerStartPos.value.y + deltaYPercent))

  // 更新标记点位置
  updateMarkerPosition(newX, newY)
}

/**
 * 处理鼠标释放事件
 */
function handleMouseUp(event) {
  if (!isDragging.value) return

  event.preventDefault()

  isDragging.value = false
  emit('drag-end', props.item)

  // 移除全局事件监听
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)

  // 恢复页面文本选择
  document.body.style.userSelect = ''
}

/**
 * 更新标记点位置
 */
function updateMarkerPosition(newX, newY) {
  const xCol = props.item._col_map?.col_x || props.mapJson.x_col
  const yCol = props.item._col_map?.col_y || props.mapJson.y_col

  if (xCol && yCol) {
    // 直接修改标记点数据
    props.item[xCol] = newX
    props.item[yCol] = newY

    // 通知父组件位置变更
    emit('position-change', props.item, newX, newY)
  }
}

/**
 * 处理标记点点击事件
 */
function handleMarkerClick(item, event) {
  // 如果正在拖拽或处于编辑模式，不触发点击事件
  if (isDragging.value || (props.isEditMode && isEditable.value)) {
    event.preventDefault()
    event.stopPropagation()
    return
  }

  emit('marker-click', item, event)
}

/**
 * 获取标记点位置
 * @param {Object} item - 标记点数据
 * @returns {Object} 位置样式对象
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
      pos.width = col_x_width + 'px'
    }
    if (col_y_width) {
      pos.height = col_y_width + 'px'
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
.draggable-marker {
  position: absolute;
  transform: translate(-50%, -50%);
  transition: all 0.2s ease;

  &.is-editable {
    cursor: grab;

    &:hover {
      transform: translate(-50%, -50%) scale(1.05);

      .marker-content {
        position: relative;

        &::after {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          border: 2px solid #007aff;
          background: rgba(0, 122, 255, 0.1);
          border-radius: 4px;
          animation: pulseBlue 1.5s infinite;
        }
      }
    }
  }

  &.is-not-editable {
    cursor: not-allowed;

    &:hover {
      .marker-content {
        position: relative;
        opacity: 0.7;

        &::after {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          border: 2px solid #ff6b6b;
          background: rgba(255, 107, 107, 0.1);
          border-radius: 4px;
          animation: pulseRed 1.5s infinite;
        }
      }

      .not-editable-tooltip {
        opacity: 1;
        visibility: visible;
        transform: translate(-50%, -5px);
      }
    }
  }

  &.is-dragging {
    cursor: grabbing;
    transform: translate(-50%, -50%) scale(1.1);
    transition: none;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));

    .marker-content::after {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      border: 2px solid #007aff;
      background: rgba(0, 122, 255, 0.2);
      border-radius: 4px;
    }
  }

  .marker-content {
    position: relative;
    pointer-events: none; // 防止内部元素干扰拖拽
    transform: translate(0, 0);
    left: unset;
    top: unset;
  }

  // 标题提示框样式
  .marker-title-tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-bottom: 8px;
    z-index: 10001;
    pointer-events: none;
    animation: fadeInUp 0.2s ease;

    .tooltip-content {
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 12px;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      backdrop-filter: blur(4px);
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;

      &::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 5px solid transparent;
        border-top-color: rgba(0, 0, 0, 0.8);
      }
    }
  }

  .drag-indicator {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 16px;
    height: 16px;
    background: #007aff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 10px;
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  &.is-editable:hover .drag-indicator,
  &.is-dragging .drag-indicator {
    opacity: 1;
  }

  .not-editable-tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-bottom: 8px;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    pointer-events: none;
    z-index: 10000;

    .tooltip-content {
      background: rgba(255, 107, 107, 0.95);
      color: white;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 12px;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      backdrop-filter: blur(4px);

      .warning-icon {
        flex-shrink: 0;
      }

      &::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 5px solid transparent;
        border-top-color: rgba(255, 107, 107, 0.95);
      }
    }
  }
}

// 标题提示框动画
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

// 蓝色边框脉冲动画
@keyframes pulseBlue {
  0% {
    box-shadow: 0 0 0 0 rgba(0, 122, 255, 0.4);
  }

  70% {
    box-shadow: 0 0 0 8px rgba(0, 122, 255, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(0, 122, 255, 0);
  }
}

// 红色边框脉冲动画
@keyframes pulseRed {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.4);
  }

  70% {
    box-shadow: 0 0 0 8px rgba(255, 107, 107, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(255, 107, 107, 0);
  }
}
</style>