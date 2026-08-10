<template>
  <div
    class="bx-card-cell"
    :class="dynamicClasses"
    :style="dynamicStyles"
    @click="onClickCell(cellItemData, cellLayoutJson)"
    @mouseenter="mouseEnter"
    @mouseleave="mouseLeave"
  >
    <card-cell-part
      :pageItem="pageItem"
      :comColMap="comColMap"
      :cellItem="item"
      :cellItemData="cellItemData"
      :cell-data="cellData"
      :readOnly="readOnly"
      :query-options="queryOptions"
      :page-params-model="pageParamsModel"
      :cellLayoutJson="item"
      :parent-part="cellLayoutJson"
      :accordion="isAccordionMode"
      :accordion-seq="n"
      :active-accordion-seq.sync="activeAccordionSeq"
      @on-click-cell="onClickCell"
      @show-dialog="showDialog"
      @on-click-row="changeActiveAccordionSeq(n)"
      @mouse-enter="changeActiveAccordionSeq(n)"
      @refresh-component="$emit('refresh-component')"
      v-for="(item, n) in cellLayoutJson?.parts_json"
      :key="item.id || `part-${n}`"
    ></card-cell-part>
    <slot name="footer"></slot>
  </div>
</template>

<script setup>
import { computed } from "vue";
import cardCellPart from "./card-cell-part.vue";
import { useCardCell } from "./composables";

// Props 定义
const props = defineProps({
  item: {
    type: Object,
    default: () => {},
  },
  cellLayoutJson: {
    type: Object,
    default: () => {},
  },
  pageItem: {
    type: Object,
    default: () => {},
  },
  currentRadio: {
    type: String,
    default: "",
  },
  cellItemData: {
    type: [Object, String],
    default: () => {},
  },
  cellData: {
    type: [Array],
    default: () => [],
  },

  comColMap: {
    type: Object,
    default: () => {},
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
  pageParamsModel: {
    type: Object,
    default: () => {},
  },
  queryOptions: {
    type: Object,
    default: () => {},
  },
  showActiveCard: {
    type: Boolean,
    default: false,
  },
  inList: {
    type: Boolean,
    default: false,
  },
});

// Emits 定义
const emits = defineEmits([
  "on-click-cell",
  "show-dialog",
  "mouse-enter",
  "mouse-leave",
]);
// jumpJson() {
//     return JSON.stringify(this.cellLayoutJson?.jump_json || null);
//   },
//   itemDataStr(){
//     return JSON.stringify(this.cellItemData || null)
//   },

// 使用组合式函数
const {
  // 手风琴相关
  activeAccordionSeq,
  isAccordionMode,
  changeActiveAccordionSeq,
  pauseAutoPlay,
  resumeAutoPlay,

  // 样式构建相关
  buildDynamicClasses,
  buildDynamicStyles,

  // 事件处理相关
  onClickCell,
} = useCardCell(props, emits);

// 模板中使用的计算属性
const dynamicClasses = computed(() =>
  buildDynamicClasses(props, { isAccordionMode })
);
const dynamicStyles = computed(() => buildDynamicStyles(props));

const mouseEnter = (event) => {
  pauseAutoPlay(event);
  emits("mouse-enter");
};
const mouseLeave = (event) => {
  resumeAutoPlay(event);
  emits("mouse-leave");
};

const showDialog = (event) => {
  emits("show-dialog", event);
};
</script>

<style lang="scss" scoped>
// CSS 变量定义
.bx-card-cell {
  --transition-duration: 0.3s;
  --transition-fast: 0.1s;
  --hover-bg-opacity: 0.1;
  --border-radius: 4px;
  --scrollbar-width: 4px;
  --scrollbar-thumb-color: rgba(0, 0, 0, 0.2);
  --checked-border-color: #007aff;
  --scale-hover: 0.99;
  --blur-effect: 2px;

  height: 100%;
  position: relative;

  // 手风琴模式样式
  &.accordion-mode {
    cursor: pointer;
    outline: none; // 移除默认焦点样式

    // 焦点样式
    &:focus-visible {
      outline: 2px solid var(--checked-border-color);
      outline-offset: 2px;
    }

    :deep(.bx-cell-row) {
      transition: all var(--transition-duration) ease-in-out;

      &:hover {
        background-color: rgba(0, 0, 0, var(--hover-bg-opacity));
        transform: translateY(-1px);
      }
    }
  }

  // 链接模式样式
  &.is-link {
    cursor: pointer;
    transition: all var(--transition-fast) ease-in-out;

    &:hover {
      scale: var(--scale-hover);
      backdrop-filter: blur(var(--blur-effect));
    }
  }

  // 列表项样式
  &.list-item {
    border: 1px solid transparent;
    transition: border-color var(--transition-duration) ease;

    &::marker {
      display: none;
      content: "";
    }

    &:hover {
      border-color: #ebeef5;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    }
  }

  // 滚动条样式
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    width: var(--scrollbar-width);
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--scrollbar-thumb-color);
    border-radius: var(--border-radius);

    &:hover {
      background-color: rgba(0, 0, 0, 0.3);
    }
  }

  // 选中状态
  &.checked {
    border: 2px solid transparent;
    border-color: var(--checked-border-color);
    box-shadow: 0 0 0 1px var(--checked-border-color);
  }

  .radio-box {
    position: absolute;
    right: 0;
    top: 0;
    transform: scale(0.7);
    transition: transform var(--transition-duration) ease;

    &:hover {
      transform: scale(0.75);
    }
  }

  // 文本内容样式
  .bx-cell-string {
    text-align: justify;
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-all;
    transition: color var(--transition-duration) ease;

    &:hover {
      color: var(--primary-color, var(--checked-border-color));
    }
  }

  // 响应式设计
  @media (max-width: 768px) {
    --transition-duration: 0.2s;
    --scale-hover: 0.98;

    &.accordion-mode {
      :deep(.bx-cell-row) {
        &:hover {
          transform: none; // 移动端不使用 transform
        }
      }
    }
  }

  // 减少动画的用户偏好
  @media (prefers-reduced-motion: reduce) {
    --transition-duration: 0s;
    --transition-fast: 0s;

    * {
      transition: none !important;
      animation: none !important;
    }
  }
}
</style>
