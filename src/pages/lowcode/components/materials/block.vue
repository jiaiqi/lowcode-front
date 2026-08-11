<template>
  <div
    v-if="isPageItemVisible"
    class="lc-block lc-layout"
    :id="com_name"
    ref="blockRef"
    :style="[
      blockHeightStyle,
      blockWidthStyle,
      setParentStyle,
      {
        '--content-width': (useContentWidth && contentWidth) || '',
      },
      enterAnimationVariables,
    ]"
    :class="[
      subType,
      {
        'use-content-width': useContentWidth,
        'show-label': props.show_label === '是' && props.com_label,
      },
      enterAnimationClass,
    ]"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    @dragend="handleDragEnd"
  >
    <!-- 占位图 -->
    <div 
      class="placeholder-img" 
      v-if="props.com_preview" 
      :style="{
        backgroundImage: `url(${getImagePath(props.com_preview)})`,
      }"
    >
    </div>
    <!-- 遮罩层 -->
    <div
      class="overlay"
      :class="{ active: currentId && currentId === id }"
      v-if="!isPreview && !isView"
      @click.stop="$emit('click', props)"
    >
      <!-- 删除按钮 -->
      <i class="el-icon-close" @click="$emit('delete', props)"></i>
    </div>

    <!-- 子组件 -->
    <ComLabel
      v-if="props.show_label === '是' && props.com_label"
      :label="props.com_label"
      :show-label="props.show_label === '是'"
      :title-style-json="mixTitleStyle"
      :title-icon-style-json="mixTitleIconStyle"
      :icon="mixTitleIcon"
      :show-more-btn="showMoreBtn && pageItem.more_position !== '数据项后'"
      :more-label="pageItem.more_label"
      :more-position="pageItem.more_position"
      ref="comLabelRef"
    />
    <div class="grid-content" :style="[setGridStyle]">
      <!-- 拖动时的占位符 -->
      <div
        v-if="isResizing"
        class="resize-placeholder"
        :style="{
          width: '100%',
          height: '100%',
          minHeight: '50px',
          background: 'rgba(23, 213, 126, 0.1)',
          border: '2px dashed rgba(23, 213, 126, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#17d57e',
          fontSize: '14px',
        }"
      >
        <i class="el-icon-loading" style="margin-right: 8px;"></i>
        拖动调整中...
      </div>
      <slot v-else></slot>
    </div>

    <!-- 高度调整手柄 -->
    <div
      v-if="!isPreview && !isView && currentId && currentId === id"
      class="resize-handle-s"
      title="调整高度"
      @mousedown="startResizeHeight"
    ></div>

    <!-- 宽度调整手柄 -->
    <!-- <div v-if="!isPreview && currentId && currentId === id" class="resize-handles">
      <div class="resize-handle resize-handle-e" @mousedown="startResizeWidth($event, 'e')"></div>
      <div class="resize-handle resize-handle-w" @mousedown="startResizeWidth($event, 'w')"></div>
    </div> -->
  </div>
</template>

<script>
import { formatStyleData } from "@/pages/lowcode/common/index.js";
import {
  setEnterAnimationClass,
  setEnterAnimationVariables,
} from "@/common/common";
import DynamicIcon from "@/pages/lowcode/widgets/common/DynamicIcon.vue";
import dragStore from "../../store/dragStore";
import ComLabel from "./ComLabel.vue";
// 页面组件级 显示隐藏控制
import pageItemVisible from "@/pages/lowcode/common/params/page-item-visible-mixin.js";
const layoutKeys = [
  "grid-template-columns",
  "grid-template-rows",
  "grid-template-areas",
  "grid-auto-columns",
  "grid-auto-rows",
  "grid-auto-flow",
  "grid-gap",
  "grid-row-gap",
  "grid-column-gap",
  "grid-template",
  "grid",
  "display",
  "flex-direction",
  "flex-wrap",
  "justify-content",
  "align-items",
  "gap",
];
// 页面组件级 显示隐藏控制

export default {
  name: "lc-block",
  mixins: [pageItemVisible],
  components: { Icon: DynamicIcon, ComLabel },
  props: {
    id: {
      type: [String, Number],
      default: "",
    },
    com_no: {
      type: String,
      default: "",
    },
    name: {
      type: String,
      default: "",
    },
    component: {
      type: String,
      default: "",
    },
    currentId: {
      type: [String, Number],
      default: "",
    },
    children: {
      type: Array,
      default: () => [],
    },
    type: {
      type: String,
      default: "",
    },
    subType: {
      type: String,
      default: "",
    },
    isPreview: {
      type: Boolean,
      default: false,
    },
    isView: {
      type: Boolean,
      default: false,
    },
    height: {
      type: [Number, String],
      default: null,
    },
    width: {
      type: [Number, String],
      default: null,
    },
    contentWidth: {
      type: String,
      default: "",
    },
    com_name: {
      type: String,
      default: "",
    },
    pageItem: Object,
    // 显式声明以下两个 prop 让 mixin（page-item-visible-mixin）能稳定读取，
    // 否则 Vue 默认会把它们 inherit 到根 <div> 的 attribute 上，$attrs 拿不到。
    pageParamsModel: {
      type: Object,
      default: () => ({}),
    },
    inEdit: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      blockHeight: this.height || 2,
      blockWidth: this.width || null,
      resizingHeight: false,
      resizingWidth: false,
      resizeDirection: null,
      startY: 0,
      startX: 0,
      startHeight: 0,
      startWidth: 0,
      parentWidth: 0,
      dynamicColRatios: null,
      dynamicRowRatios: null,
      titlePaddingTop: 0,
    };
  },
  computed: {
    isResizing() {
      return this.resizingHeight || this.resizingWidth;
    },
 
    moreBtnStyle() {
      if (typeof this.pageItem?.more_style_json === "object") {
        return formatStyleData(this.pageItem?.more_style_json);
      }
    },
    showMoreBtn() {
      return (
        this.pageItem?.com_option?.includes("更多") &&
        this.pageItem?.more_jump_json
      );
    },
    useContentWidth() {
      // 只有当父组件是页面容器的布局容器时，才可以使用contentWidth
      return this.$parent?.$parent?.$options?.name === "lc-container";
    },
    props() {
      return { ...this.$props, ...(this.$attrs || {}) };
    },
    setGridStyle() {
      let style = {};
      const display = this.setStyle?.display || "";
      const gridCols = this.setStyle?.["grid-template-columns"] || 
                       this.setStyle?.["grid_template_columns"] ||
                       this.setStyle?.["gridTemplateColumns"] || "";
      const gridRows = this.setStyle?.["grid-template-rows"] || 
                       this.setStyle?.["grid_template_rows"] ||
                       this.setStyle?.["gridTemplateRows"] || "";
      
      if (display === "grid") {
        style.display = "grid";
        if (gridCols) {
          const colCount = gridCols.split(/\s+/).filter(c => c.trim()).length;
          if (this.dynamicColRatios && this.dynamicColRatios.length === colCount) {
            style["grid-template-columns"] = this.dynamicColRatios.map((r) => `${r}fr`).join(" ");
          } else {
            style["grid-template-columns"] = gridCols;
          }
        }
        if (gridRows) {
          const rowCount = gridRows.split(/\s+/).filter(r => r.trim()).length;
          if (this.dynamicRowRatios && this.dynamicRowRatios.length === rowCount) {
            style["grid-template-rows"] = this.dynamicRowRatios.map((r) => `${r}fr`).join(" ");
          } else {
            style["grid-template-rows"] = gridRows;
          }
        }
        if (!gridCols && !gridRows && this.children && this.children.length > 0) {
          style["grid-template-rows"] = `repeat(${this.children.length}, auto)`;
        }
      }
      
      if (this.titlePaddingTop > 0) {
        style.paddingTop = `calc(${this.titlePaddingTop}px)`;
        // style.paddingTop = `calc(${this.titlePaddingTop}px * var(--originalY--,1))`;
      }
      
      if (
        typeof this.setStyle === "object" &&
        Object.keys(this.setStyle).length > 0
      ) {
        Object.keys(this.setStyle).forEach((key) => {
          if (layoutKeys.includes(key) && key !== "display" && 
              key !== "grid-template-columns" && key !== "grid-template-rows" &&
              key !== "gridTemplateColumns" && key !== "gridTemplateRows" &&
              key !== "grid_template_columns" && key !== "grid_template_rows") {
            style[key] = this.setStyle[key];
          }
        });
      }
      return style;
    },
    setParentStyle() {
      let style = {};
      if (
        typeof this.setStyle === "object" &&
        Object.keys(this.setStyle).length > 0
      ) {
        Object.keys(this.setStyle).forEach((key) => {
          if (!layoutKeys.includes(key)) {
            style[key] = this.setStyle[key];
          }
        });
      }
      return style;
    },
    setStyle() {
      let style = {};
      if (this.props.style_json && typeof this.props.style_json === "string") {
        style = JSON.parse(this.props.style_json);
      } else if (
        this.props.style_json &&
        typeof this.props.style_json === "object"
      ) {
        style = this.props.style_json;
      }
      if (
        this.props.layout_json?.style_json &&
        typeof this.props.layout_json.style_json === "object"
      ) {
        style = { ...this.props.layout_json.style_json, ...style };
      }
      return formatStyleData(style);
    },
    mixTitleIcon() {
      return this.props?.com_icon || this.pageConfig?.dv_com_icon;
    },
    mixTitleStyle() {
      if (this.props?.com_title_style_json) {
        return this.props?.com_title_style_json;
      } else if (this.pageConfig?.dv_com_title_style_json_data) {
        return this.pageConfig?.dv_com_title_style_json_data;
      }
      return {};
    },
    mixTitleIconStyle() {
      if (this.props?.title_icon_style_json) {
        return this.props?.title_icon_style_json;
      }
      return {};
    },
    blockHeightStyle() {
      const heightValue = this.blockHeight ? `${this.blockHeight * 10}px` : null;
      const isFixedHeight = this.pageItem?.com_option?.includes("固定高度");
      if (isFixedHeight && heightValue) {
        return {
          height: heightValue,
        };
      }
      return {
        minHeight: heightValue,
      };
    },
    blockWidthStyle() {
      return this.blockWidth ? { width: `${this.blockWidth}%` } : {};
    },
    enterAnimationClass() {
      return setEnterAnimationClass(this.pageItem);
    },
    enterAnimationVariables() {
      return setEnterAnimationVariables(this.pageItem);
    },
  },
  watch: {
    "props.layout_height": {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.blockHeight = newVal;
        }
      },
    },
    height(newVal) {
      if (newVal) {
        this.blockHeight = newVal;
      }
    },
    width(newVal) {
      if (newVal !== undefined && newVal !== null) {
        this.blockWidth = newVal;
      }
    },
  },
  mounted() {
    document.addEventListener("mousemove", this.onResize, {
      passive: true,
    });
    document.addEventListener("mouseup", this.stopResize, {
      passive: true,
    });
    this.$el.addEventListener("content-resize", this.onContentResize);

    this.$nextTick(() => {
      this.titlePaddingTop = this.getTitlePaddingTop();
    })
  },
  beforeDestroy() {
    document.removeEventListener("mousemove", this.onResize);
    document.removeEventListener("mouseup", this.stopResize);
    this.$el.removeEventListener("content-resize", this.onContentResize);
  },
  methods: {
    getTitlePaddingTop() {
      if (this.props.show_label !== '是' || !this.props.com_label) {
        return 0;
      }
      const comLabelRef = this.$refs.comLabelRef;
      if(!comLabelRef) {
        return 0;
      }
      // return comLabelRef.$el?.getBoundingClientRect?.()?.height || 0;
      return comLabelRef.$el?.offsetHeight || comLabelRef.$el?.getBoundingClientRect?.()?.height || 0;
      // const titleStyleJson = this.mixTitleStyle || {};
      // const fontSize = titleStyleJson['font-size'] || titleStyleJson['fontSize'] || '14px';
      // const lineHeight = titleStyleJson['line-height'] || titleStyleJson['lineHeight'] || '1.5';
      // const fontSizeNum = parseFloat(fontSize);
      // const lineHeightNum = typeof lineHeight === 'string' && lineHeight.includes('%') 
      //   ? parseFloat(lineHeight) / 100 
      //   : parseFloat(lineHeight);
      // return fontSizeNum * lineHeightNum + 10;
    },
    // 开始调整高度
    startResizeHeight(e) {
      if (this.isPreview) return;
      const rect = this.$el.getBoundingClientRect();
      if (this.blockHeight * 10 < rect.height) {
        this.blockHeight = Math.round(rect.height / 10);
      }
      e.preventDefault();
      e.stopPropagation();

      this.resizingHeight = true;
      this.startY = e.clientY;
      this.startHeight = this.blockHeight;

      // 添加调整大小时的样式
      document.body.style.cursor = "ns-resize";
      document.body.style.userSelect = "none";
    },

    // 开始调整宽度
    startResizeWidth(e, direction) {
      if (this.isPreview) return;

      e.preventDefault();
      e.stopPropagation();

      this.resizingWidth = true;
      this.resizeDirection = direction;
      this.startX = e.clientX;

      this.startWidth = this.blockWidth || 100;
      this.parentWidth = this.$el.parentElement.offsetWidth;

      // 添加调整大小时的样式
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    },

    // 调整尺寸过程
    onResize(e) {
      // 处理高度调整
      if (this.resizingHeight) {
        // 计算移动的距离，转换为vh单位
        // 视口高度的1%对应的像素值
        // const vh = window.innerHeight / 100;
        const vh = 10;
        // 移动的vh值，向上取整到最接近的整数
        const deltaVh = Math.round((e.clientY - this.startY) / vh);

        // 设置新高度，最小为2vh
        const newHeight = Math.max(2, this.startHeight + deltaVh);

        // 只有当高度变化为整数vh时才更新
        if (newHeight !== this.blockHeight) {
          this.blockHeight = newHeight;

          // 触发高度变化事件
          this.$emit("resize", {
            id: this.id,
            height: this.blockHeight,
          });
        }
      }

      // 处理宽度调整
      if (this.resizingWidth) {
        const deltaX = e.clientX - this.startX;
        let deltaPercent = (deltaX / this.parentWidth) * 100;

        // 根据拖拽方向计算新宽度
        let newWidth;
        if (this.resizeDirection === "e") {
          // 向右拖拽增加宽度
          newWidth = this.startWidth + deltaPercent;
        } else if (this.resizeDirection === "w") {
          // 向左拖拽减少宽度
          newWidth = this.startWidth - deltaPercent;
        }

        // 按1%的粒度调整
        newWidth = Math.round(newWidth);

        // 限制最小宽度为10%，最大为100%
        newWidth = Math.max(10, Math.min(100, newWidth));

        // 更新宽度
        if (newWidth !== this.blockWidth) {
          this.blockWidth = newWidth;

          // 触发宽度变化事件
          this.$emit("resize", {
            id: this.id,
            width: this.blockWidth,
          });
        }
      }
    },

    // 停止调整尺寸
    stopResize() {
      if (this.resizingHeight) {
        this.resizingHeight = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";

        // 触发高度变化完成事件，并通知保存
        this.$emit("resize-end", {
          id: this.id,
          height: this.blockHeight,
        });
        this.$emit("layout-resize", {
          id: this.id,
          resizeType: "height",
          layoutHeight: this.blockHeight,
        });
      }

      if (this.resizingWidth) {
        this.resizingWidth = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";

        // 触发宽度变化完成事件
        this.$emit("resize-end", {
          id: this.id,
          width: this.blockWidth,
        });
      }
    },

    // 修改拖拽相关的事件处理
    handleDragOver(e) {
      if (this.isPreview) return;
      // 阻止事件冒泡
      e.stopPropagation();
      // 阻止默认行为以允许放置
      e.preventDefault();
      // 获取当前拖拽的组件类型
      const draggedType = dragStore.getDragType();

      if (e.currentTarget) {
        if (draggedType === "content") {
          // 只允许放置内容组件或者布局组件
          e.dataTransfer.dropEffect = "copy";
          e.currentTarget.classList.add("drag-over");
          e.currentTarget.classList.remove("drag-not-allowed");
        } else {
          // 不允许放置布局和容器组件
          e.dataTransfer.dropEffect = "none";
          e.currentTarget.classList.remove("drag-over");
          e.currentTarget.classList.add("drag-not-allowed");
        }
      }
    },

    handleDragLeave(e) {
      if (this.isPreview) return;
      // 阻止事件冒泡
      e.stopPropagation();
      e.currentTarget.classList.remove("drag-over");
      e.currentTarget.classList.remove("drag-not-allowed");
    },

    handleDrop(e) {
      if (this.isPreview) return;
      // 阻止事件冒泡
      e.stopPropagation();
      e.preventDefault();
      e.currentTarget.classList.remove("drag-over");
      e.currentTarget.classList.remove("drag-not-allowed");

      // 获取拖拽数据
      const data = e.dataTransfer.getData("text/plain");

      if (data) {
        try {
          const draggedElement = JSON.parse(data);

          // 只处理非layout和非container类型的组件
          if (!["layout", "container"].includes(draggedElement.type)) {
            draggedElement.parentId = this.id;
            if (!draggedElement._editType) {
              draggedElement.id = `${
                this.id
              }_component_${new Date().getTime()}`;
              draggedElement._editType = "add";
              draggedElement.parent_no = this.com_no;
              this.$emit("add", draggedElement);
            }
          } else {
            // 不允许放置layout和container类型的组件
            e.currentTarget.classList.add("drag-not-allowed");
            setTimeout(() => {
              e.currentTarget.classList.remove("drag-not-allowed");
            }, 1500);
          }
        } catch (err) {
          console.error("解析拖拽数据失败:", err);
        }
      }
    },

    handleDragEnd() {
      if (this.isPreview) return;
      // 清除拖拽类型
      dragStore.clearDragType();
    },

    onContentResize(event) {
      const target = event.target;
      const gridContent = this.$el.querySelector('.grid-content');
      if (!gridContent) {
        return;
      }
      const directChildren = Array.from(gridContent.children);
      const isDirectChild = directChildren.some(child => child === target);
      if (!isDirectChild) {
        return;
      }
      event.stopPropagation();
      const data = event.detail || event;
      if (data.resizeType === "col") {
        this.dynamicColRatios = data.colRatios;
      } else if (data.resizeType === "row") {
        this.dynamicRowRatios = data.rowRatios;
      }
      if (data.isFinal) {
        this.$emit("layout-resize", {
          id: this.id,
          resizeType: data.resizeType,
          styleJson: data.styleJson,
          colRatios: data.colRatios,
          rowRatios: data.rowRatios,
        });
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@use "../../styles/layout.common.scss" as layout;

.overlay {
  @include layout.overlay;
}

.placeholder-img{
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: 100% 100%;
  background-position: center;
  z-index: 2;
}

.lc-block {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  // display: grid;
  // grid-template-rows: auto 1fr;
  &.use-content-width {
    width: var(--content-width, 100%);
  }
  .grid-content {
    gap: 10px;
    height: inherit;
    width: inherit;
    min-height: inherit;
    box-sizing: border-box;
    // overflow: hidden;
  }
  // height: 100%;
  position: relative;
  // padding: 10px;
  $primary-color: #2c48ff;

  .lc-layout__label {
    display: flex;
  }

  .lc-layout__label-text {
    display: flex;
    flex-direction: column;
    position: relative;

    .icon1 {
      left: 0;
      width: 4px;
      height: 50%;
      position: absolute;
      top: 25%;
      border-radius: 2px;
      background: currentColor;
    }

    .icon2 {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      position: absolute;
      background: currentColor;
      left: 0;
      top: 25%;
      // transform: translateY(-50%);
    }

    .icon3 {
      width: 8px;
      height: 8px;
      border-radius: 2px;
      position: absolute;
      background: currentColor;
      left: 0;
      top: 25%;
      // transform: translateY(-50%);
    }

    .under-line {
      position: relative;
      display: flex;
      bottom: 0;
      left: 0;
      width: 100%;
      display: inline-block;
      height: 4px;
      border-radius: 2px;
      background: currentColor;
      // padding: inherit;
    }
  }

  // 高度调整手柄样式
  .resize-handle-s {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 6px;
    background-color: transparent;
    cursor: ns-resize;
    z-index: 10;

    &:hover,
    &:active {
      background-color: rgba($color: $primary-color, $alpha: 0.3);
    }

    &::after {
      content: "";
      position: absolute;
      bottom: 2px;
      left: 50%;
      transform: translateX(-50%);
      width: 30px;
      height: 2px;
      background-color: $primary-color;
    }
  }

  // 宽度调整手柄样式
  .resize-handles {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 10;
  }

  .resize-handle {
    position: absolute;
    background-color: transparent;
    pointer-events: auto;
    z-index: 11;

    &:hover,
    &:active {
      background-color: rgba(44, 72, 255, 0.3);
    }

    &.resize-handle-e {
      top: 0;
      right: 0;
      width: 6px;
      height: 100%;
      cursor: ew-resize;

      &::after {
        content: "";
        position: absolute;
        right: 2px;
        top: 50%;
        transform: translateY(-50%);
        width: 2px;
        height: 30px;
        background-color: $primary-color;
      }
    }

    &.resize-handle-w {
      top: 0;
      left: 0;
      width: 6px;
      height: 100%;
      cursor: ew-resize;

      &::after {
        content: "";
        position: absolute;
        left: 2px;
        top: 50%;
        transform: translateY(-50%);
        width: 2px;
        height: 30px;
        background-color: $primary-color;
      }
    }
  }

  &.drag-over {
    border: 2px dashed $primary-color;
    background-color: rgba($color: $primary-color, $alpha: 0.05);

    &::before {
      content: "可放置组件";
      position: absolute;
      top: 0;
      left: 0;
      padding: 2px 5px;
      background-color: $primary-color;
      color: #fff;
      transform: translateY(-100%);
      z-index: 10;
    }
  }

  &.drag-not-allowed {
    border: 2px dashed #ff0000;
    background-color: rgba(255, 0, 0, 0.05);

    &::before {
      content: "不可放置此组件";
      position: absolute;
      top: 0;
      left: 0;
      padding: 2px 5px;
      background-color: #ff0000;
      color: #fff;
      transform: translateY(-100%);
      z-index: 10;
    }
  }

  > .overlay {
    > .handle {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      z-index: 10;
      right: 0;
      display: none;
    }

    &:hover {
      .handle {
        display: block;
        cursor: move;
      }
    }

    &:hover {
      border: 1px dashed $primary-color;
      background-color: rgba($color: $primary-color, $alpha: 0.1);

      &::before {
        content: "布局容器";
        position: absolute;
        top: 0;
        left: 0;
        padding: 2px 5px;
        background-color: $primary-color;
        color: #fff;
        transform: translateY(-100%);
      }
    }

    &.active {
      border: 2px solid $primary-color;
      background-color: rgba($color: $primary-color, $alpha: 0.1);

      &::before {
        content: "布局容器";
        position: absolute;
        top: 0;
        left: 0;
        padding: 2px 5px;
        background-color: $primary-color;
        color: #fff;
        transform: translateY(-100%);
      }

      & > .handle {
        display: block;
      }
    }
  }
}
</style>
