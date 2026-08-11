<template>
  <!-- 地图切换记录 - 面包屑导航 -->
  <div
    class="map-switch-record-container"
    v-if="breadcrumbItems && breadcrumbItems.length > 1"
  >
    <div class="map-switch-record">
      <div class="breadcrumb-container">
        <div
          class="map-switch-record-item"
          v-for="(item, index) in breadcrumbItems"
          @click="handleBreadcrumbClick(item, index)"
          :key="index"
        >
          <span
            class="i-material-symbols-home home-icon"
            v-if="index === 0"
          ></span>
          <!-- 分隔符 -->
          <span
            class="i-material-symbols-chevron-right breadcrumb-separator"
            v-if="index > 0"
          ></span>
          <!-- 面包屑项 -->
          <span
            class="breadcrumb-text"
            :title="getBreadLabel(item)"
            :class="{ 'is-current': index === breadcrumbItems.length - 1 }"
          >
            {{ getBreadLabel(item) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import DynamicIcon from "@/pages/lowcode/widgets/common/DynamicIcon.vue";

/**
 * Props定义
 */
const props = defineProps({
  // 面包屑数据列表
  breadcrumbItems: {
    type: Array,
    default: () => []
  }
});

/**
 * 事件定义
 */
const emit = defineEmits(['breadcrumb-click']);

/**
 * 处理面包屑点击事件
 * @param {Object} item - 点击的面包屑项
 * @param {number} index - 点击项的索引
 */
function handleBreadcrumbClick(item, index) {
  emit('breadcrumb-click', item, index);
}

function getBreadLabel(item) {
  const { map_json, data } = item;
  if (data && data?._col_map?.col_label && data[data?._col_map?.col_label]) {
    return data[data?._col_map?.col_label]
  }
  return map_json?.map_label || map_json?.map_name
}
</script>

<style lang="scss" scoped>
.map-switch-record-container {
  position: absolute;
  bottom: 20px;
  padding: 20px;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  // background-color: rgba(0, 0, 0, 0.1);
  z-index: 200;
  width: 100%;
  display: flex;
  justify-content: center;
  animation: slideUp 0.3s ease-out;
  pointer-events: none;
  // cursor: pointer;

  // &:hover {
  //   .map-switch-record {
  //     bottom: 0;
  //   }
  // }
}

.map-switch-record {
  position: relative;
  // bottom: -150px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.9));
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  padding: 12px 20px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.05);
  transition: bottom 0.3s ease-out;
  pointer-events: auto;
}

.breadcrumb-container {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  line-height: 1.4;
}

.home-icon {
  color: #007aff;
  font-size: 16px;
  margin-right: 4px;
  opacity: 0.8;
  transition: all 0.2s ease;

  &:hover {
    opacity: 1;
    transform: scale(1.1);
  }
}

.map-switch-record-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.breadcrumb-separator {
  color: #94a3b8;
  font-size: 14px;
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.breadcrumb-text {
  color: #475569;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
  white-space: nowrap;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
    transform: translateY(-1px);
  }

  &.is-current {
    background: linear-gradient(135deg, #007aff, #4a90e2);
    color: white;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);

    &:hover {
      background: linear-gradient(135deg, #0056cc, #357abd);
      transform: translateY(-1px);
    }
  }
}

/* 动画效果 */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>