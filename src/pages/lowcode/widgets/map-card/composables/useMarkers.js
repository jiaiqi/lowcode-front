/**
 * 标记点相关的组合式函数
 * 负责处理标记点的数据获取、位置计算、图标处理等逻辑
 */
import { ref, computed } from 'vue'
import { getImagePath } from '@/common/http.js'
import { $selectList } from '@/common/http'
import { formatStyleData } from '@/pages/lowcode/common'

export function useMarkers(props, mapJson) {
  // 标记点相关状态
  const markerList = ref([])

  /**
   * 标签样式计算属性
   */
  const setLabelStyle = computed(() => {
    if (
      mapJson.value?.map_type === "标签" &&
      mapJson.value?.col_label_style_json
    ) {
      return formatStyleData(mapJson.value?.col_label_style_json)
    }
  })

  /**
   * 标签激活状态样式计算属性
   */
  const setLabelActiveStyle = computed(() => {
    if (
      mapJson.value?.map_type === "标签" &&
      mapJson.value?.label_active_style_json
    ) {
      return formatStyleData(mapJson.value?.label_active_style_json)
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

    const mapConfig = mapJson.value
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

    if (mapJson.value?.x_col && mapJson.value?.y_col) {
      if (item[mapJson.value?.x_col]) {
        pos.left = item[mapJson.value?.x_col] + "%"
      }
      if (item[mapJson.value?.y_col]) {
        pos.top = item[mapJson.value?.y_col] + "%"
      }
    } else if (item?._col_map) {
      const { col_label, col_no, col_x, col_x_width, col_y, col_y_width, customized_icon } = item._col_map || {}
      pos.label = item[col_label]
      pos.left = item[col_x] + "%"
      pos.top = item[col_y] + "%"
      pos.width = (col_x_width || 30) + 'px'
      pos.height = (col_y_width || 30) + 'px'
      pos.icon = customized_icon
      pos.value = item[col_no]
    }

    return pos
  }

  /**
   * 判断标记点是否激活
   */
  function isActive(marker, selectedTreeData) {
    if (selectedTreeData && marker?.id) {
      return selectedTreeData?.id === marker.id
    }
    return false
  }

  return {
    // 状态
    markerList,

    // 计算属性
    setLabelStyle,
    setLabelActiveStyle,

    // 方法
    getItemIcon,
    getItemPosition,
    isActive,
  }
}