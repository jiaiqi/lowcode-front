<template>
  <div class="map-edit-mode">
    <!-- 编辑模式切换按钮 -->
    <div
      class="edit-toggle-btn"
      :class="{ 'active': isEditMode }"
      @click="toggleEditMode"
      :title="isEditMode ? '退出编辑模式' : '进入编辑模式'"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path
          d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
        />
      </svg>
    </div>

    <!-- 编辑模式提示 -->
    <div
      v-if="isEditMode"
      class="edit-mode-tips"
    >
      <div class="tips-content">
        <span class="tips-text">编辑模式已开启，可拖拽移动标记点</span>
        <div class="tips-actions">
          <button
            class="save-btn"
            @click="saveChanges"
            :disabled="!hasChanges"
            type="button"
          >
            保存更改
          </button>
          <button
            type="button"
            class="cancel-btn"
            @click="cancelChanges"
          >
            取消
          </button>
        </div>
      </div>
    </div>

    <!-- 编辑状态指示器 -->
    <div
      v-if="isEditMode && editableMarkers.length > 0"
      class="edit-status"
    >
      <span class="status-text">
        可编辑标记点: {{ editableMarkers.length }} 个
      </span>
      <span
        v-if="hasChanges"
        class="changes-indicator"
      >
        已修改: {{ Object.keys(markerChanges).length }} 个
      </span>
    </div>

    <!-- 自定义确认对话框 -->
    <div
      v-if="showConfirmDialog"
      class="confirm-dialog-overlay"
      @click="closeConfirmDialog"
    >
      <div
        class="confirm-dialog"
        @click.stop
      >
        <div class="dialog-header">
          <h3 class="dialog-title">{{ confirmDialog.title }}</h3>
        </div>
        <div class="dialog-content">
          <div class="dialog-icon">
            <svg
              v-if="confirmDialog.type === 'warning'"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="#ff9500"
            >
              <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2v-2zm0-6h2v4h-2v-4z" />
            </svg>
            <svg
              v-else-if="confirmDialog.type === 'success'"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="#34c759"
            >
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
            <svg
              v-else
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="#007aff"
            >
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
              />
            </svg>
          </div>
          <p class="dialog-message">{{ confirmDialog.message }}</p>
          <div
            v-if="confirmDialog.details"
            class="dialog-details"
          >
            <ul>
              <li
                v-for="detail in confirmDialog.details"
                :key="detail"
              >{{ detail }}</li>
            </ul>
          </div>
        </div>
        <div class="dialog-actions">
          <button
            v-if="confirmDialog.showCancel"
            class="dialog-btn cancel-btn"
            @click="handleConfirmCancel"
          >
            {{ confirmDialog.cancelText || '取消' }}
          </button>
          <button
            class="dialog-btn confirm-btn"
            :class="{ 'danger': confirmDialog.type === 'warning' }"
            @click="handleConfirmOk"
          >
            {{ confirmDialog.confirmText || '确定' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 保存成功提示 -->
    <div
      v-if="showSuccessToast"
      class="success-toast"
    >
      <div class="toast-content">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="#34c759"
        >
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
        </svg>
        <span>保存成功！</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, set, del } from 'vue'

/**
 * 地图编辑模式组件
 * @component MapEditMode
 * @description 提供地图标记点编辑功能，支持拖拽移动标记点位置
 */

const props = defineProps({
  // 标记点列表
  markerList: {
    type: Array,
    default: () => []
  },
  // 地图配置
  mapJson: {
    type: Object,
    required: true
  }
})

const emit = defineEmits([
  'edit-mode-change',
  'marker-position-change',
  'save-changes',
  'cancel-changes'
])

// 编辑模式状态
const isEditMode = ref(false)
const markerChanges = ref({}) // 存储标记点位置变更
const originalPositions = ref({}) // 存储原始位置

// 确认对话框状态
const showConfirmDialog = ref(false)
const confirmDialog = ref({
  title: '',
  message: '',
  details: null,
  type: 'info', // 'info', 'warning', 'success'
  showCancel: true,
  confirmText: '确定',
  cancelText: '取消',
  onConfirm: null,
  onCancel: null
})

// 成功提示状态
const showSuccessToast = ref(false)

/**
 * 计算可编辑的标记点
 * 只有配置了 _poi_info.marker_edit_cfg.update_request_no 的标记点才可编辑
 */
const editableMarkers = computed(() => {
  return props.markerList.filter(marker =>
    marker._poi_info?.marker_edit_cfg?.update_request_no
  )
})

/**
 * 检查是否有未保存的更改
 */
const hasChanges = computed(() => {
  return Object.keys(markerChanges.value).length > 0
})

/**
 * 显示确认对话框
 */
function showConfirm(options) {
  confirmDialog.value = {
    title: options.title || '确认操作',
    message: options.message || '确定要执行此操作吗？',
    details: options.details || null,
    type: options.type || 'info',
    showCancel: options.showCancel !== false,
    confirmText: options.confirmText || '确定',
    cancelText: options.cancelText || '取消',
    onConfirm: options.onConfirm || null,
    onCancel: options.onCancel || null
  }
  showConfirmDialog.value = true
}

/**
 * 关闭确认对话框
 */
function closeConfirmDialog() {
  showConfirmDialog.value = false
}

/**
 * 处理确认对话框的确定按钮
 */
function handleConfirmOk() {
  if (confirmDialog.value.onConfirm) {
    confirmDialog.value.onConfirm()
  }
  closeConfirmDialog()
}

/**
 * 处理确认对话框的取消按钮
 */
function handleConfirmCancel() {
  if (confirmDialog.value.onCancel) {
    confirmDialog.value.onCancel()
  }
  closeConfirmDialog()
}

/**
 * 显示成功提示
 */
function showSuccessMessage() {
  showSuccessToast.value = true
  setTimeout(() => {
    showSuccessToast.value = false
  }, 3000)
}

/**
 * 切换编辑模式
 */
function toggleEditMode() {
  if (isEditMode.value) {
    // 退出编辑模式前检查是否有未保存的更改
    if (hasChanges.value) {
      const changedCount = Object.keys(markerChanges.value).length
      showConfirm({
        title: '退出编辑模式',
        message: `您有 ${changedCount} 个标记点的位置已修改但未保存，确定要退出编辑模式吗？`,
        details: ['退出后所有未保存的更改将丢失', '建议先保存更改再退出'],
        type: 'warning',
        confirmText: '仍要退出',
        cancelText: '继续编辑',
        onConfirm: () => {
          exitEditMode()
        }
      })
    } else {
      exitEditMode()
    }
  } else {
    enterEditMode()
  }
}

/**
 * 进入编辑模式
 */
function enterEditMode() {
  isEditMode.value = true

  // 保存所有可编辑标记点的原始位置
  editableMarkers.value.forEach(marker => {
    const xCol = marker._col_map?.col_x || props.mapJson.x_col
    const yCol = marker._col_map?.col_y || props.mapJson.y_col

    if (xCol && yCol && marker.id) {
      originalPositions.value[marker.id] = {
        x: marker[xCol],
        y: marker[yCol]
      }
    }
  })

  emit('edit-mode-change', true)
}

/**
 * 退出编辑模式
 */
function exitEditMode() {
  isEditMode.value = false
  markerChanges.value = {}
  originalPositions.value = {}
  emit('edit-mode-change', false)
}

/**
 * 记录标记点位置变更
 * @param {Object} marker - 标记点数据
 * @param {number} newX - 新的X坐标
 * @param {number} newY - 新的Y坐标
 */
function recordMarkerChange(marker, newX, newY) {
  if (!marker.id) return

  const xCol = marker._col_map?.col_x || props.mapJson.x_col
  const yCol = marker._col_map?.col_y || props.mapJson.y_col

  if (!xCol || !yCol) return

  // 检查位置是否真的发生了变化
  const originalPos = originalPositions.value[marker.id]
  if (originalPos && (originalPos.x !== newX || originalPos.y !== newY)) {
    // 使用 Vue.set 或 set 来确保响应式
    set(markerChanges.value, marker.id, {
      marker,
      originalPosition: originalPos,
      newPosition: { x: newX, y: newY },
      updateRequestNo: marker._poi_info.marker_edit_cfg.update_request_no,
      markerEditCfg: marker._poi_info.marker_edit_cfg
    })
  } else {
    // 使用 Vue.delete 或 del 来确保响应式
    if (markerChanges.value[marker.id]) {
      del(markerChanges.value, marker.id)
    }
  }
}

/**
 * 保存更改
 */
function saveChanges() {
  if (!hasChanges.value) return

  const changedCount = Object.keys(markerChanges.value).length

  const changedMarkers = Object.values(markerChanges.value).map(change =>
    change.marker[change.marker?._col_map?.col_label] || change.marker.id || '未命名标记点'
  )

  showConfirm({
    title: '保存更改',
    message: `确定要保存 ${changedCount} 个标记点的位置更改吗？`,
    details: changedMarkers.length <= 5 ? changedMarkers : [
      ...changedMarkers.slice(0, 3),
      `...等共${changedCount}个标记点`
    ],
    type: 'info',
    confirmText: '保存',
    cancelText: '取消',
    onConfirm: () => {
      performSave()
    }
  })
}

/**
 * 执行保存操作
 */
function performSave() {
  // 按 update_request_no 分组整理数据
  const groupedChanges = {}

  Object.values(markerChanges.value).forEach(change => {
    const requestNo = change.updateRequestNo
    if (!groupedChanges[requestNo]) {
      groupedChanges[requestNo] = {
        update_request_no: requestNo,
        marker_edit_cfg: change.markerEditCfg,
        markers: []
      }
    }

    groupedChanges[requestNo].markers.push({
      id: change.marker.id,
      originalPosition: change.originalPosition,
      newPosition: change.newPosition,
      markerData: change.marker
    })
  })

  // 转换为数组格式
  const changesArray = Object.values(groupedChanges)

  emit('save-changes', changesArray)

  // 更新原始位置记录（在清空变更记录之前）
  Object.values(markerChanges.value).forEach(change => {
    if (change.marker.id) {
      originalPositions.value[change.marker.id] = change.newPosition
    }
  })

  // 清空变更记录
  markerChanges.value = {}

  // 显示保存成功提示
  showSuccessMessage()
}

/**
 * 取消更改
 */
function cancelChanges() {
  if (!hasChanges.value) {
    exitEditMode()
    return
  }

  const changedCount = Object.keys(markerChanges.value).length
  showConfirm({
    title: '取消更改',
    message: `确定要取消 ${changedCount} 个标记点的位置更改吗？`,
    details: ['所有未保存的位置更改将被撤销', '标记点将恢复到编辑前的位置'],
    type: 'warning',
    confirmText: '确定取消',
    cancelText: '继续编辑',
    onConfirm: () => {
      performCancel()
    }
  })
}

/**
 * 执行取消操作
 */
function performCancel() {
  // 恢复所有标记点到原始位置
  Object.values(markerChanges.value).forEach(change => {
    const marker = change.marker
    const originalPos = change.originalPosition
    const xCol = marker._col_map?.col_x || props.mapJson.x_col
    const yCol = marker._col_map?.col_y || props.mapJson.y_col

    if (xCol && yCol) {
      marker[xCol] = originalPos.x
      marker[yCol] = originalPos.y
    }
  })

  emit('cancel-changes')
  exitEditMode()
}

/**
 * 暴露给父组件的方法
 */
defineExpose({
  isEditMode: () => isEditMode.value,
  editableMarkers,
  recordMarkerChange,
  hasChanges: () => hasChanges.value,
  saveChanges,
  cancelChanges
})
</script>

<style lang="scss" scoped>
.map-edit-mode {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1000;
}

.edit-toggle-btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #ddd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  pointer-events: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    background: rgba(255, 255, 255, 1);
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &.active {
    background: #007aff;
    color: white;
    border-color: #007aff;

    &:hover {
      background: #0056cc;
    }
  }

  svg {
    transition: transform 0.2s ease;
  }

  &:active svg {
    transform: scale(0.9);
  }
}

.edit-mode-tips {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 122, 255, 0.95);
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
  backdrop-filter: blur(10px);
  animation: slideDown 0.3s ease;

  .tips-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .tips-text {
    font-size: 14px;
    font-weight: 500;
  }

  .tips-actions {
    display: flex;
    gap: 8px;
  }

  .save-btn,
  .cancel-btn {
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .save-btn {
    background: rgba(255, 255, 255, 0.2);
    color: white;

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.3);
    }
  }

  .cancel-btn {
    background: rgba(255, 255, 255, 0.1);
    color: white;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }
}

.edit-status {
  position: absolute;
  bottom: 80px;
  right: 20px;
  background: rgba(255, 255, 255, 0.9);
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  color: #666;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  pointer-events: auto;
  backdrop-filter: blur(10px);

  .status-text {
    display: block;
    margin-bottom: 4px;
  }

  .changes-indicator {
    color: #007aff;
    font-weight: 500;
  }
}

/* 确认对话框样式 */
.confirm-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  pointer-events: auto;
  animation: fadeIn 0.2s ease;
}

.confirm-dialog {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  animation: scaleIn 0.2s ease;
}

.dialog-header {
  padding: 20px 20px 0;

  .dialog-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }
}

.dialog-content {
  padding: 16px 20px;
  display: flex;
  align-items: flex-start;
  gap: 12px;

  .dialog-icon {
    flex-shrink: 0;
    margin-top: 2px;
  }

  .dialog-message {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    color: #666;
    flex: 1;
  }

  .dialog-details {
    margin-top: 12px;

    ul {
      margin: 0;
      padding-left: 16px;

      li {
        font-size: 13px;
        color: #888;
        margin-bottom: 4px;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
}

.dialog-actions {
  padding: 0 20px 20px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.dialog-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;

  &.cancel-btn {
    background: #f5f5f5;
    color: #666;

    &:hover {
      background: #e8e8e8;
    }
  }

  &.confirm-btn {
    background: #007aff;
    color: white;

    &:hover {
      background: #0056cc;
    }

    &.danger {
      background: #ff3b30;

      &:hover {
        background: #d70015;
      }
    }
  }
}

/* 成功提示样式 */
.success-toast {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(52, 199, 89, 0.95);
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
  backdrop-filter: blur(10px);
  animation: slideDown 0.3s ease;
  z-index: 1001;

  .toast-content {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
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

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>