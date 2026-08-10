<template>
  <div
    ref="containerRef"
    class="zoom-drag-container"
    :class="{
      'ctrl-pressed': isCtrlPressed,
      'space-pressed': isSpacePressed && !isDragging,
      'dragging': isDragging,
    }"
    @wheel="handleWheel"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @keydown="handleKeyDown"
    @keyup="handleKeyUp"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @focus="showTips"
    tabindex="99"
  >
    <div
      class="content-view"
      :class="{ 'no-transition': isDragging }"
      :style="{
        transform: `translate(${mapPosition.x}px, ${mapPosition.y}px) scale(${zoomScale})`,
        transformOrigin: 'center center',
      }"
    >
      <slot></slot>
    </div>

    <!-- 交互提示 -->
    <transition name="tips-fade">
      <div
        v-if="showInteractionTips && shouldShowTips"
        class="interaction-tips"
      >
        <div class="tips-item">
          <div class="tips-icon zoom-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="11"
                cy="11"
                r="8"
                stroke="currentColor"
                stroke-width="2"
              />
              <path
                d="m21 21-4.35-4.35"
                stroke="currentColor"
                stroke-width="2"
              />
              <line
                x1="8"
                y1="11"
                x2="14"
                y2="11"
                stroke="currentColor"
                stroke-width="2"
              />
              <line
                x1="11"
                y1="8"
                x2="11"
                y2="14"
                stroke="currentColor"
                stroke-width="2"
              />
            </svg>
          </div>
          <div class="tips-text">
            <kbd>Ctrl</kbd> + 滚轮缩放
          </div>
        </div>
        <div class="tips-item">
          <div class="tips-icon drag-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="m12 22l-4-4h8zm0-20l4 4H8zm0 12a2 2 0 1 1 0-4a2 2 0 0 1 0 4M2 12l4-4v8zm20 0l-4 4V8z"
              />
            </svg>
          </div>
          <div class="tips-text">
            <kbd>Space</kbd> + 拖拽移动
          </div>
        </div>
        <span
          v-if="countdown > 0"
          class="countdown-text"
        >{{ countdown }}s后自动关闭</span>

        <button
          type="button"
          class="tips-close"
          @click="hideTips"
          title="关闭提示"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
          >
            <line
              x1="18"
              y1="6"
              x2="6"
              y2="18"
              stroke="currentColor"
              stroke-width="2"
            />
            <line
              x1="6"
              y1="6"
              x2="18"
              y2="18"
              stroke="currentColor"
              stroke-width="2"
            />
          </svg>
        </button>
      </div>
    </transition>
    <!-- 重置按钮 -->
    <button
      class="reset-btn"
      v-show="!isInitialView"
      @click="resetView"
      title="恢复初始视图"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
      >
        <path
          fill="currentColor"
          d="M2 12a9 9 0 0 0 9 9c2.39 0 4.68-.94 6.4-2.6l-1.5-1.5A6.7 6.7 0 0 1 11 19c-6.24 0-9.36-7.54-4.95-11.95S18 5.77 18 12h-3l4 4h.1l3.9-4h-3a9 9 0 0 0-18 0"
        />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

// 定义事件
const emit = defineEmits(['scale-change']);

// 组件属性
const props = defineProps({
  showTips: {
    type: Boolean,
    default: false
  },
  autoHideTips: {
    type: Boolean,
    default: true
  },
  tipsDelay: {
    type: Number,
    default: 3000
  },
  // 手动关闭多少次后不再显示提示，0表示永远显示
  maxCloseCount: {
    type: Number,
    default: 1
  },
  // 本地存储的键名，用于记录关闭次数
  storageKey: {
    type: String,
    default: 'zoom-drag-tips-close-count'
  },
  // 忽略缩放的元素class名称，支持字符串或数组，将对匹配的元素进行反向缩放
  ignoreScaleClasses: {
    type: [String, Array],
    default: () => []
  },
  inEdit: { // 是否处于编辑状态
    type: Boolean,
    default: false,
  }

});

// 配置常量
const CONFIG = {
  ZOOM: {
    MIN: 0.1,
    MAX: 5,
    DEFAULT: 1,
    STEP: 0.1
  }
};

const containerRef = ref(null);
const zoomScale = ref(CONFIG.ZOOM.DEFAULT);
const minZoom = CONFIG.ZOOM.MIN;
const maxZoom = CONFIG.ZOOM.MAX;
const mapPosition = ref({ x: 0, y: 0 });
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const isSpacePressed = ref(false);
const isCtrlPressed = ref(false);
const showInteractionTips = ref(false);
let animationFrameId = null;
let tipsTimer = null;

// 倒计时相关
const countdown = ref(0);
let countdownTimer = null;

// 关闭次数管理
const closeCount = ref(0);

// 从本地存储获取关闭次数
const getCloseCount = () => {
  try {
    const stored = localStorage.getItem(props.storageKey);
    return stored ? parseInt(stored, 10) : 0;
  } catch (error) {
    console.warn('无法读取本地存储:', error);
    return 0;
  }
};

// 保存关闭次数到本地存储
const saveCloseCount = (count) => {
  try {
    localStorage.setItem(props.storageKey, count.toString());
  } catch (error) {
    console.warn('无法保存到本地存储:', error);
  }
};

// 检查是否应该显示提示
const shouldShowTips = computed(() => {
  if (!props.showTips) return false;
  if (props.maxCloseCount === 0) return true; // 0表示永远显示
  return closeCount.value < props.maxCloseCount;
});

const isInitialView = computed(() => zoomScale.value === 1 && mapPosition.value.x === 0 && mapPosition.value.y === 0);

const scale = computed(() => zoomScale.value);
const position = computed(() => mapPosition.value);

const handleWheel = (event) => {
  if (!isCtrlPressed.value) return;

  event.preventDefault();

  const delta = event.deltaY > 0 ? -CONFIG.ZOOM.STEP : CONFIG.ZOOM.STEP;
  const newScale = Math.max(minZoom, Math.min(maxZoom, zoomScale.value + delta));

  if (newScale !== zoomScale.value) {
    zoomScale.value = newScale;
    // 发射缩放变化事件
    emit('scale-change', newScale);
  }
};

const handleMouseDown = (event) => {
  if (!isSpacePressed.value || event.button !== 0) return;

  event.preventDefault();
  isDragging.value = true;
  dragStart.value = {
    x: event.clientX - mapPosition.value.x,
    y: event.clientY - mapPosition.value.y
  };
};

const handleMouseMove = (event) => {
  if (!isDragging.value || !isSpacePressed.value) return;

  event.preventDefault();

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  animationFrameId = requestAnimationFrame(() => {
    mapPosition.value = {
      x: event.clientX - dragStart.value.x,
      y: event.clientY - dragStart.value.y
    };
  });
};

const handleMouseUp = () => {
  isDragging.value = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
};

const handleKeyDown = (event) => {
  if (event.code === 'Space') {
    event.preventDefault();
    isSpacePressed.value = true;
  } else if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
    isCtrlPressed.value = true;
  }
};

const handleKeyUp = (event) => {
  if (event.code === 'Space') {
    isSpacePressed.value = false;
    isDragging.value = false;
  } else if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
    isCtrlPressed.value = false;
  }
};

const resetView = () => {
  zoomScale.value = CONFIG.ZOOM.DEFAULT;
  mapPosition.value = { x: 0, y: 0 };
  // 发射缩放变化事件
  emit('scale-change', CONFIG.ZOOM.DEFAULT);
};

const showTips = () => {
  if (!shouldShowTips.value) return;

  if (tipsTimer) clearTimeout(tipsTimer);
  if (countdownTimer) clearInterval(countdownTimer);

  showInteractionTips.value = true;

  if (props.autoHideTips) {
    // 初始化倒计时
    countdown.value = Math.ceil(props.tipsDelay / 1000);

    // 启动倒计时
    countdownTimer = setInterval(() => {
      countdown.value -= 1;
      if (countdown.value <= 0) {
        clearInterval(countdownTimer);
        showInteractionTips.value = false;
        countdown.value = 0;
      }
    }, 1000);
  }
};

// 鼠标进入组件时添加键盘监听器
const handleMouseEnter = () => {
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  showTips();
};

// 鼠标离开组件时移除键盘监听器
const handleMouseLeave = () => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
  // 重置按键状态
  isSpacePressed.value = false;
  isCtrlPressed.value = false;
  // 调用原有的鼠标抬起处理逻辑
  handleMouseUp();
};

const hideTips = () => {
  if (tipsTimer) clearTimeout(tipsTimer);
  if (countdownTimer) clearInterval(countdownTimer);

  showInteractionTips.value = false;
  countdown.value = 0;

  // 增加关闭次数
  closeCount.value += 1;
  saveCloseCount(closeCount.value);
};

// 重置关闭次数，重新允许显示提示
const resetCloseCount = () => {
  closeCount.value = 0;
  saveCloseCount(0);
};

/**
 * 反向缩放功能
 * 根据传入的class名称，对指定元素进行反向缩放处理
 */

// 获取需要反向缩放的class列表
const getInverseScaleClasses = () => {
  if (!props.ignoreScaleClasses) return [];

  if (typeof props.ignoreScaleClasses === 'string') {
    return [props.ignoreScaleClasses];
  }

  if (Array.isArray(props.ignoreScaleClasses)) {
    return props.ignoreScaleClasses;
  }

  return [];
};

// 应用反向缩放样式
const applyInverseScale = (scale) => {
  const classes = getInverseScaleClasses();
  if (classes.length === 0) return;

  const inverseScale = 1 / scale;

  classes.forEach(className => {
    const elements = containerRef.value?.querySelectorAll(`.${className}`);
    if (elements) {
      elements.forEach(element => {
        // 保存原始transform，避免覆盖其他transform属性
        const currentTransform = element.style.transform || '';
        const scaleRegex = /scale\([^)]*\)/g;
        const otherTransforms = currentTransform.replace(scaleRegex, '').trim();

        // 应用反向缩放，保持其他transform属性
        const newTransform = otherTransforms
          ? `${otherTransforms} scale(${inverseScale})`
          : `scale(${inverseScale})`;

        element.style.transform = newTransform;
        element.style.transformOrigin = 'center center';
      });
    }
  });
};

// 监听缩放变化，自动应用反向缩放
watch(zoomScale, (newScale) => {
  applyInverseScale(newScale);
}, { immediate: true });

// 暴露方法给父组件
defineExpose({
  resetView,
  resetCloseCount,
  scale,
  position
});

onMounted(() => {
  // 初始化关闭次数
  closeCount.value = getCloseCount();
});

onUnmounted(() => {
  // 确保清理键盘事件监听器
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
  if (tipsTimer) clearTimeout(tipsTimer);
  if (countdownTimer) clearInterval(countdownTimer);
});
</script>

<style lang="scss" scoped>
.zoom-drag-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  outline: none;
  user-select: none;
  scrollbar-width: none;

  // 可视化编辑器画布背景 - 点状网格
  background-color: transparent;
  background-image: radial-gradient(circle at center,
      rgba(0, 0, 0, 0.15) 1px,
      transparent 1px);
  background-size: 20px 20px;
  background-position: 0 0;

  &:focus {
    outline: none;
  }

  // Ctrl键按下时的缩放光标样式
  &.ctrl-pressed {
    cursor: zoom-in !important;

    * {
      cursor: zoom-in !important;
    }
  }

  // 空格键按下时的拖拽光标样式
  &.space-pressed {
    cursor: grab !important;

    * {
      cursor: grab !important;
    }
  }

  // 拖拽中的光标样式
  &.dragging {
    cursor: grabbing !important;

    * {
      cursor: grabbing !important;
    }
  }
}

.content-view {
  width: 100%;
  height: 100%;
  transition: transform 0.2s ease-out;
  // background-color: rgba(0, 0, 0, 0.1);
  // backdrop-filter: blur(2px);
  position: relative;

  // 拖拽时禁用过渡动画以提升性能
  &.no-transition {
    transition: none !important;
  }
}

// 交互提示样式
.interaction-tips {
  position: absolute;
  bottom: 20px;
  right: 20px;
  /* transform: translate(0, -100%); */
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 200px;

  .tips-item {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #333;
    font-size: 14px;

    .tips-icon {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #666;
      flex-shrink: 0;
    }

    .tips-text {
      display: flex;
      align-items: center;
      gap: 6px;

      kbd {
        background: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 2px 6px;
        font-size: 12px;
        font-family: monospace;
        color: #333;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }
    }
  }

  .countdown-text {
    display: inline-block;
    position: absolute;
    bottom: 0;
    left: 50%;
    translate: -50% 0;
    background: rgba(255, 255, 255, 0.9);
    color: #666;
    font-size: 10px;
    scale: 0.8;
    padding: 2px 4px;
    border-radius: 4px 4px 0 0;
    min-width: 20px;
    text-align: center;
    line-height: 1;
    /* box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2); */
    /* animation: countdown-pulse 1s ease-in-out infinite; */
  }

  .tips-close {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
    transition: all 0.2s ease;



    &:hover {
      background: rgba(0, 0, 0, 0.05);
      color: #666;
    }
  }
}

// 提示动画
.tips-fade-enter-active,
.tips-fade-leave-active {
  transition: all 0.3s ease;
}

.tips-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.tips-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

// 倒计时脉冲动画
@keyframes countdown-pulse {

  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }

  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

// 一键恢复按钮样式
.reset-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }

  :deep(.reset-icon) {
    font-size: 18px;
    color: #666;
    transition: color 0.2s ease;
  }

  &:hover :deep(.reset-icon) {
    color: #333;
  }
}
</style>