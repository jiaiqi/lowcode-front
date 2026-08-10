<template>
  <Teleport to="body">
    <!-- 全屏模式的背景遮罩 -->
    <div
      v-if="placement === '全屏居中'"
      class="card-popup-backdrop"
      @click="emit('close')"
    ></div>
    
    <div
      class="card-popup-container"
      :style="popupStyle"
      ref="popupContainer"
    >
      <!-- 全屏模式的关闭按钮 -->
      <div
        v-if="placement === '全屏居中'"
        class="card-popup-close"
        @click="emit('close')"
      >
        ×
      </div>
      
      <!-- 小三角箭头 -->
      <!-- <div
        class="card-popup-arrow"
        :class="arrowClass"
        :style="arrowStyle"
      ></div> -->

      <card-group-cell
        :page-item="{}"
        :cellsLayout="[cardUnitJson]"
        :cell-data="[data]"
      ></card-group-cell>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import cardGroupCell from "../card-group-cell/card-group-cell.vue";
import Teleport from "vue2-teleport";

const props = defineProps({
  cardUnitJson: {
    type: Object,
    default: () => { },
  },
  data: {
    type: Object,
    default: () => { },
  },
  clickEvent: {
    type: Object,
    default: () => { },
  },
  clickedElement: {
    type: [Element, null],
    default: null,
  },
  placement: {
    type: String,
    default: '下',
  },
});

const { cardUnitJson, data, clickedElement, clickEvent, placement } = props;
const popupContainer = ref(null);
const forceUpdate = ref(0);

// 定义事件
const emit = defineEmits(['close']);

// 强制重新计算位置
const updatePosition = () => {
  forceUpdate.value++;
};

// 获取点击位置的坐标信息
const getClickPosition = () => {
  // 优先使用clickEvent
  if (clickEvent && (clickEvent.clientX !== undefined || clickEvent.pageX !== undefined)) {
    return {
      x: clickEvent.clientX || clickEvent.pageX,
      y: clickEvent.clientY || clickEvent.pageY,
      type: 'event'
    };
  }
  
  // 回退到使用clickedElement
  if (clickedElement) {
    const rect = clickedElement.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      type: 'element',
      rect
    };
  }
  
  return null;
};

// 计算箭头的CSS类名
const arrowClass = computed(() => {
  return `arrow-${placement}`;
});

// 计算箭头的样式
const arrowStyle = computed(() => {
  const clickPos = getClickPosition();
  
  // 如果没有位置信息，则不显示箭头
  if (!clickPos) {
    return { display: 'none' };
  }

  const baseStyle = {
    position: 'absolute',
    width: '0',
    height: '0',
    borderStyle: 'solid',
  };

  // 根据placement设置箭头位置和方向
  switch (placement) {
    case '全屏居中':
      return { display: 'none' };
    case '上':
      return {
        ...baseStyle,
        bottom: '-8px',
        left: '50%',
        transform: 'translateX(-50%)',
        borderWidth: '8px 8px 0 8px',
        borderColor: '#fff transparent transparent transparent',
      };
    case '上左':
      return {
        ...baseStyle,
        bottom: '-8px',
        left: '20px',
        borderWidth: '8px 8px 0 8px',
        borderColor: '#fff transparent transparent transparent',
      };
    case '上右':
      return {
        ...baseStyle,
        bottom: '-8px',
        right: '20px',
        borderWidth: '8px 8px 0 8px',
        borderColor: '#fff transparent transparent transparent',
      };
    case '下':
      return {
        ...baseStyle,
        top: '-8px',
        left: '50%',
        transform: 'translateX(-50%)',
        borderWidth: '0 8px 8px 8px',
        borderColor: 'transparent transparent #fff transparent',
      };
    case '下左':
      return {
        ...baseStyle,
        top: '-8px',
        left: '20px',
        borderWidth: '0 8px 8px 8px',
        borderColor: 'transparent transparent #fff transparent',
      };
    case '下右':
      return {
        ...baseStyle,
        top: '-8px',
        right: '20px',
        borderWidth: '0 8px 8px 8px',
        borderColor: 'transparent transparent #fff transparent',
      };
    case '左':
      return {
        ...baseStyle,
        right: '-8px',
        top: '50%',
        transform: 'translateY(-50%)',
        borderWidth: '8px 0 8px 8px',
        borderColor: 'transparent transparent transparent #fff',
      };
    case '左上':
      return {
        ...baseStyle,
        right: '-8px',
        top: '20px',
        borderWidth: '8px 0 8px 8px',
        borderColor: 'transparent transparent transparent #fff',
      };
    case '左下':
      return {
        ...baseStyle,
        right: '-8px',
        bottom: '20px',
        borderWidth: '8px 0 8px 8px',
        borderColor: 'transparent transparent transparent #fff',
      };
    case '右':
      return {
        ...baseStyle,
        left: '-8px',
        top: '50%',
        transform: 'translateY(-50%)',
        borderWidth: '8px 8px 8px 0',
        borderColor: 'transparent #fff transparent transparent',
      };
    case '右上':
      return {
        ...baseStyle,
        left: '-8px',
        top: '20px',
        borderWidth: '8px 8px 8px 0',
        borderColor: 'transparent #fff transparent transparent',
      };
    case '右下':
      return {
        ...baseStyle,
        left: '-8px',
        bottom: '20px',
        borderWidth: '8px 8px 8px 0',
        borderColor: 'transparent #fff transparent transparent',
      };
    default:
      return {
        ...baseStyle,
        top: '-8px',
        left: '50%',
        transform: 'translateX(-50%)',
        borderWidth: '0 8px 8px 8px',
        borderColor: 'transparent transparent #fff transparent',
      };
  }
});

// 计算弹窗位置
const popupStyle = computed(() => {
  // 触发响应式更新
  forceUpdate.value;

  const clickPos = getClickPosition();
  console.log('clickPos:', clickPos);
  
  // 如果没有任何位置信息，则居中显示
  if (!clickPos) {
    return {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      // backgroundColor: '#fff',
      borderRadius: '8px',
      // boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      zIndex: 10000,
    };
  }

  let top = 0;
  let left = 0;
  let transform = '';

  // 箭头尺寸
  const arrowSize = 8;

  // 如果是事件坐标，使用事件位置计算
  if (clickPos.type === 'event') {
    const { x, y } = clickPos;
    
    switch (placement) {
      case '全屏居中':
        top = window.innerHeight / 2;
        left = window.innerWidth / 2;
        transform = 'translate(-50%, -50%)';
        break;
      case '上':
        top = y - arrowSize;
        left = x;
        transform = 'translate(-50%, -100%)';
        break;
      case '上左':
        top = y - arrowSize;
        left = x;
        transform = 'translate(0, -100%)';
        break;
      case '上右':
        top = y - arrowSize;
        left = x;
        transform = 'translate(-100%, -100%)';
        break;
      case '下':
        top = y + arrowSize;
        left = x;
        transform = 'translate(-50%, 0)';
        break;
      case '下左':
        top = y + arrowSize;
        left = x;
        transform = 'translate(0, 0)';
        break;
      case '下右':
        top = y + arrowSize;
        left = x;
        transform = 'translate(-100%, 0)';
        break;
      case '左':
        top = y;
        left = x - arrowSize;
        transform = 'translate(-100%, -50%)';
        break;
      case '左上':
        top = y;
        left = x - arrowSize;
        transform = 'translate(-100%, 0)';
        break;
      case '左下':
        top = y;
        left = x - arrowSize;
        transform = 'translate(-100%, -100%)';
        break;
      case '右':
        top = y;
        left = x + arrowSize;
        transform = 'translate(0, -50%)';
        break;
      case '右上':
        top = y;
        left = x + arrowSize;
        transform = 'translate(0, 0)';
        break;
      case '右下':
        top = y;
        left = x + arrowSize;
        transform = 'translate(0, -100%)';
        break;
      default:
        top = y + arrowSize;
        left = x;
        transform = 'translate(-50%, 0)';
    }
  } else {
    // 如果是元素坐标，使用原来的逻辑
    const rect = clickPos.rect;

    switch (placement) {
      case '全屏居中':
        top = window.innerHeight / 2;
        left = window.innerWidth / 2;
        transform = 'translate(-50%, -50%)';
        break;
      case '上':
        top = rect.top - arrowSize;
        left = rect.left + rect.width / 2;
        transform = 'translate(-50%, -100%)';
        break;
      case '上左':
        top = rect.top - arrowSize;
        left = rect.left;
        transform = 'translate(0, -100%)';
        break;
      case '上右':
        top = rect.top - arrowSize;
        left = rect.right;
        transform = 'translate(-100%, -100%)';
        break;
      case '下':
        top = rect.bottom + arrowSize;
        left = rect.left + rect.width / 2;
        transform = 'translate(-50%, 0)';
        break;
      case '下左':
        top = rect.bottom + arrowSize;
        left = rect.left;
        transform = 'translate(0, 0)';
        break;
      case '下右':
        top = rect.bottom + arrowSize;
        left = rect.right;
        transform = 'translate(-100%, 0)';
        break;
      case '左':
        top = rect.top + rect.height / 2;
        left = rect.left - arrowSize;
        transform = 'translate(-100%, -50%)';
        break;
      case '左上':
        top = rect.top;
        left = rect.left - arrowSize;
        transform = 'translate(-100%, 0)';
        break;
      case '左下':
        top = rect.bottom;
        left = rect.left - arrowSize;
        transform = 'translate(-100%, -100%)';
        break;
      case '右':
        top = rect.top + rect.height / 2;
        left = rect.right + arrowSize;
        transform = 'translate(0, -50%)';
        break;
      case '右上':
        top = rect.top;
        left = rect.right + arrowSize;
        transform = 'translate(0, 0)';
        break;
      case '右下':
        top = rect.bottom;
        left = rect.right + arrowSize;
        transform = 'translate(0, -100%)';
        break;
      default:
        top = rect.bottom + arrowSize;
        left = rect.left + rect.width / 2;
        transform = 'translate(-50%, 0)';
    }
  }

  const baseStyle = {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
    transform,
    // backgroundColor: '#fff',
    borderRadius: '8px',
    // boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 1000,
  };

  // 全屏居中模式的特殊样式
  if (placement === '全屏居中') {
    return {
      ...baseStyle,
      width: '90vw',
      height: '90vh',
      maxWidth: '1200px',
      maxHeight: '800px',
      minWidth: '600px',
      minHeight: '400px',
      overflow: 'auto',
    };
  }

  // 其他模式的默认样式
  return {
    ...baseStyle,
    maxWidth: '400px',
    minWidth: '200px',
  };
});

// 监听窗口滚动和大小变化
onMounted(() => {
  window.addEventListener('scroll', updatePosition, true);
  window.addEventListener('resize', updatePosition);
});

onUnmounted(() => {
  window.removeEventListener('scroll', updatePosition, true);
  window.removeEventListener('resize', updatePosition);
});
</script>

<style lang="scss" scoped>
.card-popup-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.card-popup-container {
  // 基础样式已在computed中定义
  position: relative;
}

.card-popup-close {
  position: absolute;
  top: 10px;
  right: 15px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  cursor: pointer;
  font-size: 20px;
  font-weight: bold;
  color: #666;
  z-index: 1;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 0, 0, 0.2);
    color: #333;
    transform: scale(1.1);
  }
}

.card-popup-arrow {
  z-index: 1;

  // // 为箭头添加阴影效果
  // &::before {
  //   content: '';
  //   position: absolute;
  //   width: 0;
  //   height: 0;
  //   border-style: solid;
  // }

  // // 上方向箭头的阴影
  // &.arrow-上::before,
  // &.arrow-上左::before,
  // &.arrow-上右::before {
  //   bottom: -9px;
  //   left: 50%;
  //   transform: translateX(-50%);
  //   border-width: 9px 9px 0 9px;
  //   border-color: rgba(0, 0, 0, 0.1) transparent transparent transparent;
  //   z-index: -1;
  // }

  &.arrow-上左::before {
    left: -1px;
    transform: none;
  }

  &.arrow-上右::before {
    left: auto;
    right: -1px;
    transform: none;
  }

  // 下方向箭头的阴影
  &.arrow-下::before,
  &.arrow-下左::before,
  &.arrow-下右::before {
    top: -9px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 0 9px 9px 9px;
    border-color: transparent transparent rgba(0, 0, 0, 0.1) transparent;
    z-index: -1;
  }

  &.arrow-下左::before {
    left: -1px;
    transform: none;
  }

  &.arrow-下右::before {
    left: auto;
    right: -1px;
    transform: none;
  }

  // 左方向箭头的阴影
  &.arrow-左::before,
  &.arrow-左上::before,
  &.arrow-左下::before {
    right: -9px;
    top: 50%;
    transform: translateY(-50%);
    border-width: 9px 0 9px 9px;
    border-color: transparent transparent transparent rgba(0, 0, 0, 0.1);
    z-index: -1;
  }

  &.arrow-左上::before {
    top: -1px;
    transform: none;
  }

  &.arrow-左下::before {
    top: auto;
    bottom: -1px;
    transform: none;
  }

  // 右方向箭头的阴影
  &.arrow-右::before,
  &.arrow-右上::before,
  &.arrow-右下::before {
    left: -9px;
    top: 50%;
    transform: translateY(-50%);
    border-width: 9px 9px 9px 0;
    border-color: transparent rgba(0, 0, 0, 0.1) transparent transparent;
    z-index: -1;
  }

  &.arrow-右上::before {
    top: -1px;
    transform: none;
  }

  &.arrow-右下::before {
    top: auto;
    bottom: -1px;
    transform: none;
  }
}
</style>