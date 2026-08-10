<template>
  <div class="edit-mode-example">
    <h3>地图标记点编辑模式示例</h3>
    
    <!-- 示例说明 -->
    <div class="example-info">
      <p>此示例展示了如何使用地图标记点编辑模式：</p>
      <ul>
        <li>点击右下角编辑图标进入编辑模式</li>
        <li>只有配置了 update_request_no 的标记点可以拖拽</li>
        <li>拖拽移动标记点位置</li>
        <li>保存更改会按 update_request_no 分组</li>
      </ul>
    </div>

    <!-- 地图容器 -->
    <div class="map-container">
      <MapViewContent
        :map-json="mapConfig"
        :is-building-view="false"
        :marker-list="markerList"
        :current-image-src="baseImageSrc"
        :background-size="'100% 100%'"
        :image-loading="false"
        :image-loaded="true"
        :is-active="isActiveMarker"
        :allow-click="allowMarkerClick"
        :get-marker-title="getMarkerTitle"
        @marker-click="handleMarkerClick"
        @edit-mode-change="handleEditModeChange"
        @marker-position-change="handleMarkerPositionChange"
        @save-changes="handleSaveChanges"
        @cancel-changes="handleCancelChanges"
      />
    </div>

    <!-- 操作日志 -->
    <div class="operation-log">
      <h4>操作日志</h4>
      <div class="log-content">
        <div 
          v-for="(log, index) in operationLogs" 
          :key="index"
          class="log-item"
          :class="log.type"
        >
          <span class="log-time">{{ log.time }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>

    <!-- 当前标记点数据 -->
    <div class="marker-data">
      <h4>当前标记点数据</h4>
      <pre>{{ JSON.stringify(markerList, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import MapViewContent from './MapViewContent.vue'

/**
 * 编辑模式示例组件
 * @component EditModeExample
 * @description 展示地图标记点编辑模式的使用方法
 */

// 地图配置
const mapConfig = reactive({
  map_type: '图标',
  x_col: 'x_position',
  y_col: 'y_position',
  base_image: '/example-map.jpg',
  onclick: '弹出卡片'
})

// 基础地图图片
const baseImageSrc = ref('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmOGZmIi8+CiAgPGcgZmlsbD0iIzAwN2FmZiIgZmlsbC1vcGFjaXR5PSIwLjEiPgogICAgPGNpcmNsZSBjeD0iMjAwIiBjeT0iMTUwIiByPSI1MCIvPgogICAgPGNpcmNsZSBjeD0iNjAwIiBjeT0iMzAwIiByPSI4MCIvPgogICAgPGNpcmNsZSBjeD0iNDAwIiBjeT0iNDUwIiByPSI2MCIvPgogIDwvZz4KICA8dGV4dCB4PSI0MDAiIHk9IjMwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSIjNjY2Ij7npLrkvovlnLDlm748L3RleHQ+Cjwvc3ZnPg==')

// 标记点列表
const markerList = ref([
  {
    id: 'marker_1',
    x_position: 25,
    y_position: 30,
    name: '可编辑标记点1',
    _poi_info: {
      poi_type_icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzAwN2FmZiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBkPSJNMTIgMkM4LjEzIDIgNSA1LjEzIDUgOWMwIDUuMjUgNyAxMyA3IDEzczctNy43NSA3LTEzYzAtMy44Ny0zLjEzLTctNy03eiIvPgogIDxjaXJjbGUgY3g9IjEyIiBjeT0iOSIgcj0iMi41IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=',
      marker_edit_cfg: {
        update_request_no: 'building_markers',
        api_endpoint: '/api/update-building-markers',
        batch_size: 10
      }
    }
  },
  {
    id: 'marker_2',
    x_position: 60,
    y_position: 45,
    name: '可编辑标记点2',
    _poi_info: {
      poi_type_icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzI4YTc0NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBkPSJNMTIgMkM4LjEzIDIgNSA1LjEzIDUgOWMwIDUuMjUgNyAxMyA3IDEzczctNy43NSA3LTEzYzAtMy44Ny0zLjEzLTctNy03eiIvPgogIDxjaXJjbGUgY3g9IjEyIiBjeT0iOSIgcj0iMi41IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=',
      marker_edit_cfg: {
        update_request_no: 'building_markers',
        api_endpoint: '/api/update-building-markers',
        batch_size: 10
      }
    }
  },
  {
    id: 'marker_3',
    x_position: 80,
    y_position: 20,
    name: '设备标记点',
    _poi_info: {
      poi_type_icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ZmNjkwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBkPSJNMTIgMkM4LjEzIDIgNSA1LjEzIDUgOWMwIDUuMjUgNyAxMyA3IDEzczctNy43NSA3LTEzYzAtMy44Ny0zLjEzLTctNy03eiIvPgogIDxjaXJjbGUgY3g9IjEyIiBjeT0iOSIgcj0iMi41IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=',
      marker_edit_cfg: {
        update_request_no: 'device_markers',
        api_endpoint: '/api/update-device-markers',
        batch_size: 5
      }
    }
  },
  {
    id: 'marker_4',
    x_position: 40,
    y_position: 70,
    name: '不可编辑标记点',
    _poi_info: {
      poi_type_icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzk5OTk5OSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBkPSJNMTIgMkM4LjEzIDIgNSA1LjEzIDUgOWMwIDUuMjUgNyAxMyA3IDEzczctNy43NSA3LTEzYzAtMy44Ny0zLjEzLTctNy03eiIvPgogIDxjaXJjbGUgY3g9IjEyIiBjeT0iOSIgcj0iMi41IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4='
      // 注意：这个标记点没有 marker_edit_cfg，所以不可编辑
    }
  }
])

// 操作日志
const operationLogs = ref([
  {
    time: new Date().toLocaleTimeString(),
    message: '示例初始化完成',
    type: 'info'
  }
])

/**
 * 添加操作日志
 */
function addLog(message, type = 'info') {
  operationLogs.value.unshift({
    time: new Date().toLocaleTimeString(),
    message,
    type
  })
  
  // 限制日志数量
  if (operationLogs.value.length > 20) {
    operationLogs.value = operationLogs.value.slice(0, 20)
  }
}

/**
 * 检查标记点是否激活
 */
function isActiveMarker(marker) {
  return false // 示例中不需要激活状态
}

/**
 * 检查标记点是否允许点击
 */
function allowMarkerClick(marker) {
  return true
}

/**
 * 获取标记点标题
 */
function getMarkerTitle(marker) {
  return marker.name || `标记点 ${marker.id}`
}

/**
 * 处理标记点点击
 */
function handleMarkerClick(marker, event) {
  addLog(`点击标记点: ${marker.name}`, 'info')
}

/**
 * 处理编辑模式切换
 */
function handleEditModeChange(editMode) {
  addLog(`编辑模式${editMode ? '开启' : '关闭'}`, editMode ? 'success' : 'warning')
}

/**
 * 处理标记点位置变更
 */
function handleMarkerPositionChange(marker, newX, newY) {
  addLog(`标记点 ${marker.name} 位置更新: (${newX.toFixed(1)}, ${newY.toFixed(1)})`, 'info')
}

/**
 * 处理保存更改
 */
function handleSaveChanges(changesArray) {
  addLog(`保存 ${changesArray.length} 组标记点更改`, 'success')
  
  // 显示详细的保存信息
  changesArray.forEach((group, index) => {
    addLog(`分组 ${index + 1}: ${group.update_request_no} (${group.markers.length} 个标记点)`, 'success')
  })
  
  // 模拟API调用
  setTimeout(() => {
    addLog('所有更改已成功保存到服务器', 'success')
  }, 1000)
}

/**
 * 处理取消更改
 */
function handleCancelChanges() {
  addLog('取消所有标记点位置更改', 'warning')
}
</script>

<style lang="scss" scoped>
.edit-mode-example {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;

  h3 {
    color: #333;
    margin-bottom: 20px;
  }
}

.example-info {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  border-left: 4px solid #007aff;

  p {
    margin: 0 0 12px 0;
    color: #555;
  }

  ul {
    margin: 0;
    padding-left: 20px;
    color: #666;

    li {
      margin-bottom: 8px;
    }
  }
}

.map-container {
  width: 100%;
  height: 500px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
  position: relative;
}

.operation-log {
  background: #fff;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  margin-bottom: 20px;

  h4 {
    margin: 0;
    padding: 12px 16px;
    background: #f8f9fa;
    border-bottom: 1px solid #e1e5e9;
    color: #333;
  }

  .log-content {
    max-height: 200px;
    overflow-y: auto;
    padding: 8px;
  }

  .log-item {
    display: flex;
    align-items: center;
    padding: 6px 8px;
    border-radius: 4px;
    margin-bottom: 4px;
    font-size: 13px;

    &.info {
      background: #e3f2fd;
      color: #1976d2;
    }

    &.success {
      background: #e8f5e8;
      color: #2e7d32;
    }

    &.warning {
      background: #fff3e0;
      color: #f57c00;
    }

    &.error {
      background: #ffebee;
      color: #d32f2f;
    }

    .log-time {
      font-weight: 500;
      margin-right: 12px;
      min-width: 80px;
    }

    .log-message {
      flex: 1;
    }
  }
}

.marker-data {
  background: #fff;
  border: 1px solid #e1e5e9;
  border-radius: 8px;

  h4 {
    margin: 0;
    padding: 12px 16px;
    background: #f8f9fa;
    border-bottom: 1px solid #e1e5e9;
    color: #333;
  }

  pre {
    margin: 0;
    padding: 16px;
    background: #f8f9fa;
    font-size: 12px;
    line-height: 1.4;
    overflow-x: auto;
    color: #555;
  }
}
</style>