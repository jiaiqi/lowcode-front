<template>
  <div
    v-if="isPageItemVisible"
    class="lc-content lc-layout"
    :class="[
      {
        'preview-mode': isPreview,
        'view-mode': isView,
        'edit-mode': !isPreview && !isView && !com_name,
      },
      enterAnimationClass,
    ]"
    :style="[
      contentStyle,
      {
        '--content-name': com_name || '组件容器',
      },
      enterAnimationVariables,
    ]"
    :data-allow-drop="allowDrop"
    data-drop-effect="move"
    :draggable="!isPreview && !isView && com_name"
    :data-id="id"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    @dragstart="handleDragStart($event, props)"
    ref="contentRef"
  >
    <span
      class="comp-name"
      v-if="!isPreview && !isView && props.com_type !== 'layout'"
    >
      {{ com_name || "" }}
    </span>
    <!-- 占位图 -->
    <div class="placeholder-img" v-if="props.com_preview" :style="{
      backgroundImage: `url(${getImagePath(props.com_preview)})`,
    }"></div>
    <!-- 遮罩层 -->
    <div
      class="overlay"
      @click.stop="onTap"
      :class="{
        active: isActive,
        'child-is-layout': childType === 'layout',
      }"
      v-if="!isPreview && !isView && !childIsCardPart"
    >
      <!-- 删除按钮 -->
      <div class="com-name-overlay">
        <span class="name">
          {{ com_name || "" }}
        </span>
        <i
          class="el-icon-close button close-icon"
          @click="onDelete"
          v-if="children && children.length"
        ></i>
        <!-- 编辑按钮 -->
        <i
          class="el-icon-edit button close-icon"
          @click="toEditCard"
          v-if="cardNo"
          title="用卡片单元设计器打开"
        ></i>
        <!-- tabs下的卡片单元 编辑按钮 -->
        <el-popover
          placement="right"
          width="400"
          trigger="hover"
          v-else-if="childCardList && childCardList.length"
        >
          <i
            class="el-icon-edit button close-icon"
            title="用卡片单元设计器打开"
            slot="reference"
          ></i>
          <div class="card-list">
            <div class="title">
              <i class="el-icon-edit button close-icon mx-2"></i>
              <span>选择要编辑的卡片单元 </span>
              <!-- <span class="tip">（）</span> -->
            </div>
            <div
              class="card-item"
              v-for="item in childCardList"
              :key="item.no"
              @click="toEditCard(item)"
              :title="'打开' + item.name"
            >
              <span>
                <template v-if="item.parent_name"
                  >{{ item.parent_name }}/</template
                >{{ item.name }}
              </span>
            </div>
          </div>
        </el-popover>
      </div>
    </div>
    <div
      class="overlay"
      style="z-index: -1"
      @click.stop="onTap"
      :class="{
        active: isActive,
        'child-is-layout': childType === 'layout',
      }"
      v-else-if="!isPreview && !isView && children.length"
    >
      <!-- 删除按钮 -->
      <div class="com-name-overlay">
        <span class="name">
          {{ props.com_name || "" }}
          <!-- {{ com_name || "" }} -->
        </span>
        <i
          class="el-icon-close button close-icon"
          @click="onDelete"
          v-if="children && children.length && !childIsCardPart"
        ></i>
      </div>
    </div>

    <!-- 组件标题 -->
    <ComLabel
      v-if="props.show_label === '是' && props.com_label"
      :label="props.com_label"
      :show-label="props.show_label === '是'"
      :title-style-json="props.com_title_style_json"
      :icon="props.com_icon"
      :show-more-btn="showMoreBtn"
      :more-label="props.more_label"
      :more-position="props.more_position"
      :page-item="pageItem"
      ref="comLabelRef"
    />

    <!-- 子组件插槽 未出现在屏幕可视范围内时不渲染 -->
    <slot v-if="(isVisible || !lazyLoad) && !isResizing"> </slot>

    <!-- 拖动时的占位符 -->
    <div
      class="resize-placeholder"
      v-if="isResizing"
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

    <!-- 加载遮罩层 -->
    <div class="loading-overlay" v-else-if="!isVisible && lazyLoad">
      <div class="loading-spinner">
        <i class="el-icon-loading"></i>
        <div class="loading-text">加载中...</div>
      </div>
    </div>

    <!-- 拖拽调整宽度/高度的手柄 -->
    <template v-if="!isPreview && !isView && canResize">
      <!-- 左侧宽度调整手柄（非首列） -->
      <div
        v-if="(isHorizontalLayout || isGridBothLayout) && !isFirstInRow"
        class="resize-handle-col resize-handle-col-left"
        @mousedown="startColResizeLeft"
      ></div>
      <!-- 右侧宽度调整手柄（非末列） -->
      <div
        v-if="(isHorizontalLayout || isGridBothLayout) && !isLastInRow"
        class="resize-handle-col"
        @mousedown="startColResize"
      ></div>
      <!-- 顶部高度调整手柄（非首行） -->
      <div
        v-if="(isVerticalLayout || isGridBothLayout) && !isFirstInCol"
        class="resize-handle-row resize-handle-row-top"
        @mousedown="startRowResizeTop"
      ></div>
      <!-- 底部高度调整手柄（非末行） -->
      <div
        v-if="(isVerticalLayout || isGridBothLayout) && !isLastInCol"
        class="resize-handle-row"
        @mousedown="startRowResize"
      ></div>
    </template>
  </div>
</template>

<script>
import dragStore from "../../store/dragStore";
import { formatStyleData } from "@/pages/lowcode/common/index.js";
import canvasPage from '../../../../components/common/canvas-line/canvasPage.vue'
import ComLabel from "./ComLabel.vue";
import {
  getFullBaseUrl,
  setEnterAnimationClass,
  setEnterAnimationVariables,
} from "@/common/common";
// 页面组件级 显示隐藏控制
import pageItemVisible from "@/pages/lowcode/common/params/page-item-visible-mixin.js";

const throttle = (fn, delay = 16) => {
  let lastTime = 0;
  let rafId = null;
  return function(...args) {
    const now = Date.now();
    if (now - lastTime >= delay) {
      lastTime = now;
      fn.apply(this, args);
    } else if (!rafId) {
      rafId = requestAnimationFrame(() => {
        lastTime = Date.now();
        rafId = null;
        fn.apply(this, args);
      });
    }
  };
};

export default {
  mixins: [pageItemVisible],
  inject: ["getPageConfig"],
  components: {
    canvasPage,
    ComLabel,
  },
  props: {
    name: {
      type: String,
      default: "",
    },
    component: {
      type: String,
      default: "",
    },
    id: {
      type: [String, Number],
      default: new Date().getTime(),
    },
    com_no: {
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
    isPreview: {
      type: Boolean,
      default: false,
    },
    isView: {
      type: Boolean,
      default: false,
    },
    width: {
      type: [Number, String],
      default: null,
    },
    widthUnit: {
      type: String,
      default: "px",
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
      contentWidth: this.width || null,
      currentWidthUnit: this.widthUnit || "px",
      resizing: false,
      resizeDirection: null,
      startX: 0,
      startY: 0,
      startWidth: 0,
      startHeight: 0,
      parentWidth: 0,
      parentHeight: 0,
      isVisible: false,
      observer: null,
      lazyLoad: false,
      colResizing: false,
      rowResizing: false,
      colResizingLeft: false,
      rowResizingTop: false,
      colRatios: [],
      rowRatios: [],
      currentColIndex: 0,
      currentRowIndex: 0,
      titlePaddingTop: 0,
    };
  },
  computed: {
    isResizing() {
      return this.colResizing || this.rowResizing || this.colResizingLeft || this.rowResizingTop;
    },
    tabsComponentData() {
      return this.childComponent?.com_type === "tabs"
        ? this.childComponent?.tabs_json?.com_json
        : [];
    },
    childCardList() {
      let result = [];
      if (this.tabsComponentData?.length) {
        const list = this.tabsComponentData;
        if (Array.isArray(list) && list.length) {
          list.forEach((item) => {
            try {
              Object.keys(item).forEach((key) => {
                if (key?.includes("_json")) {
                  let _json = item[key];
                  Object.keys(_json).forEach((subKey) => {
                    if (
                      subKey?.includes("_json") &&
                      subKey?.includes("card_")
                    ) {
                      const _json2 = _json[subKey];
                      if (_json2?.card_name && _json2?.card_no) {
                        if (
                          !result?.find((data) => data.no === _json2.card_no)
                        ) {
                          result.push({
                            no: _json2.card_no,
                            name: _json2.card_name,
                            parent_name: item?.com_name,
                          });
                        }
                      }
                    }
                  });
                }
              });
            } catch (error) {
              console.error(error);
            }
          });
        }
      }
      return result;
    },
    enterAnimationClass() {
      return setEnterAnimationClass(this.pageItem);
    },
    enterAnimationVariables() {
      return setEnterAnimationVariables(this.pageItem);
    },
    showMoreBtn() {
      return (
        this.pageItem?.com_option?.includes("更多") &&
        this.pageItem?.more_jump_json && true
      );
    },
    props() {
      return { ...this.$props, ...(this.$attrs || {}) };
    },
    childIsCardPart() {
      if (Array.isArray(this.children) && this.children.length) {
        return (
          this.children[0]?.type === "cardPart" ||
          this.children[0]?.com_type === "卡片部件"
        );
      }
    },
    allowDrop() {
      // 对于cardPart类型组件，允许多个组件拖入
      // 对于其他类型组件，保持原有逻辑，只允许一个组件
      const draggedType = dragStore.getDragType();
      if (draggedType === "cardPart") {
        return this.type === "content";
      }
      return this.type === "content" && !this.children?.length;
    },
    isActive() {
      if (this.childIsCardPart) {
        return this.currentId && [this.id].includes(this.currentId);
      }
      let childId = this.children?.[0]?.id;
      if (this.props.type == "layout") {
        return this.currentId && [this.id].includes(this.currentId);
      }
      return this.currentId && [childId, this.id].includes(this.currentId);
    },
    childType() {
      if (Array.isArray(this.children) && this.children.length) {
        return this.children[0]?.type;
      }
    },
    com_name() {
      if (Array.isArray(this.children) && this.children.length) {
        return this.children[0]?.com_name;
      }
    },
    contentStyle() {
      let style = { ...this.setStyle };
      if (this.contentWidth) {
        style.width =
          this.currentWidthUnit === "px"
            ? `${this.contentWidth}px`
            : `${this.contentWidth}%`;
      }
      if (this.computedTitlePaddingTop > 0) {
        style.paddingTop = `${this.computedTitlePaddingTop}px`;
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
    childComponent() {
      if (Array.isArray(this.children) && this.children.length) {
        return this.children[0];
      }
    },
    cardNo() {
      if (this.childComponent?.com_type === "cardGroup") {
        return this.childComponent?.data?.card_group_json?.card_unit_json
          ?.card_no;
      } else if (this.childComponent?.com_type === "list") {
        return this.childComponent?.data?.list_json?.card_unit_json?.card_no;
      }
    },
    parentBlock() {
      let parent = this.$parent;
      while (parent) {
        if (parent.$options.name === "lc-block") {
          return parent;
        }
        parent = parent.$parent;
      }
      return null;
    },
    parentStyleJson() {
      const block = this.parentBlock;
      if (!block) {
        return {};
      }
      let style = {};
      const blockProps = block.props || block.$props || {};
      if (blockProps.style_json && typeof blockProps.style_json === "string") {
        try {
          style = JSON.parse(blockProps.style_json);
        } catch (e) {
          style = {};
        }
      } else if (blockProps.style_json && typeof blockProps.style_json === "object") {
        style = { ...blockProps.style_json };
      }
      if (blockProps.layout_json?.style_json && typeof blockProps.layout_json.style_json === "object") {
        style = { ...blockProps.layout_json.style_json, ...style };
      }
      if (block.$attrs?.style_json && typeof block.$attrs.style_json === "object") {
        style = { ...block.$attrs.style_json, ...style };
      }
      if (block.$attrs?.layout_json?.style_json && typeof block.$attrs.layout_json.style_json === "object") {
        style = { ...block.$attrs.layout_json.style_json, ...style };
      }
      return style;
    },
    parentGridEl() {
      const block = this.parentBlock;
      if (!block || !block.$el) return null;
      return block.$el.querySelector('.grid-content');
    },
    gridColumns() {
      const cols = this.parentStyleJson["grid-template-columns"] || 
                   this.parentStyleJson["grid_template_columns"] ||
                   this.parentStyleJson["gridTemplateColumns"] || "";
      if (cols) {
        const repeatMatch = cols.match(/repeat\s*\(\s*(\d+)/);
        if (repeatMatch) {
          return parseInt(repeatMatch[1]);
        }
        return cols.split(/\s+/).filter(c => c.trim()).length;
      }
      const gridEl = this.parentGridEl;
      if (gridEl) {
        const style = window.getComputedStyle(gridEl);
        const gridCols = style.getPropertyValue("grid-template-columns");
        if (gridCols) {
          const repeatMatch = gridCols.match(/repeat\s*\(\s*(\d+)/);
          if (repeatMatch) {
            return parseInt(repeatMatch[1]);
          }
          return gridCols.split(/\s+/).filter(c => c.trim()).length;
        }
        const display = style.getPropertyValue("display");
        if (display === "grid") {
          return 1;
        }
        if (display === "flex") {
          return this.siblingCount;
        }
      }else{
        let display = this.parentStyleJson["display"] || "";
        if (display === "grid") {
          return 1;
        }
        if (display === "flex") {
          return this.siblingCount;
        }
      }
      return 0;
    },
    gridRows() {
      const rows = this.parentStyleJson["grid-template-rows"] || 
                   this.parentStyleJson["grid_template_rows"] ||
                   this.parentStyleJson["gridTemplateRows"] || "";
      if (rows) {
        const repeatMatch = rows.match(/repeat\s*\(\s*(\d+)/);
        if (repeatMatch) {
          return parseInt(repeatMatch[1]);
        }
        return rows.split(/\s+/).filter(r => r.trim()).length;
      }
      const gridEl = this.parentGridEl;
      if (gridEl) {
        const style = window.getComputedStyle(gridEl);
        const gridRows = style.getPropertyValue("grid-template-rows");
        if (gridRows) {
          const repeatMatch = gridRows.match(/repeat\s*\(\s*(\d+)/);
          if (repeatMatch) {
            return parseInt(repeatMatch[1]);
          }
          return gridRows.split(/\s+/).filter(r => r.trim()).length;
        }
        const display = style.getPropertyValue("display");
        if (display === "grid") {
          return this.siblingCount;
        }
      }else{
        let display = this.parentStyleJson["display"] || "";
        if (display === "grid") {
          return this.siblingCount;
        }
        if (display === "flex") {
          return 1;
        }
      }
      return 0;
    },
    isGridLayout() {
      const display = this.parentStyleJson["display"] || "";
      if (display === "grid") return true;
      const gridEl = this.parentGridEl;
      if (gridEl) {
        const style = window.getComputedStyle(gridEl);
        return style.getPropertyValue("display") === "grid";
      }
      return false;
    },
    isFlexLayout() {
      const display = this.parentStyleJson["display"] || "";
      if (display === "flex") return true;
      const gridEl = this.parentGridEl;
      if (gridEl) {
        const style = window.getComputedStyle(gridEl);
        return style.getPropertyValue("display") === "flex";
      }
      return false;
    },
    isHorizontalLayout() {
      if (this.isFlexLayout) return true;
      if (!this.isGridLayout) return false;
      return this.gridColumns > 1 && this.gridRows <= 1;
    },
    isVerticalLayout() {
      if (!this.isGridLayout) return false;
      return this.gridRows > 1 && this.gridColumns <= 1;
    },
    isGridBothLayout() {
      if (!this.isGridLayout) return false;
      return this.gridColumns > 1 && this.gridRows > 1;
    },
    isParentBlockActive() {
      const block = this.parentBlock;
      if (!block) return false;
      return true;
    },
    isContentActive() {
      return this.isActive;
    },
    canResize() {
      return (this.isHorizontalLayout || this.isVerticalLayout || this.isGridBothLayout) && 
             this.siblingCount > 1 && 
             this.isContentActive;
    },
    siblingCount() {
      const block = this.parentBlock;
      if (!block || !block.children) return 1;
      return block.children.length;
    },
    siblingIndex() {
      const block = this.parentBlock;
      if (!block || !block.children) return 0;
      return block.children.findIndex((child) => child.id === this.id);
    },
    isLastSibling() {
      return this.siblingIndex === this.siblingCount - 1;
    },
    isLastInRow() {
      if (this.gridColumns <= 1) return this.isLastSibling;
      return (this.siblingIndex + 1) % this.gridColumns === 0;
    },
    isFirstInRow() {
      return this.siblingIndex % this.gridColumns === 0;
    },
    isLastInCol() {
      if (this.gridRows <= 1) return this.isLastSibling;
      const totalRows = Math.ceil(this.siblingCount / this.gridColumns);
      const currentRow = Math.floor(this.siblingIndex / this.gridColumns);
      return currentRow === totalRows - 1;
    },
    isFirstInCol() {
      return this.siblingIndex < this.gridColumns;
    },
    nextSibling() {
      if (this.isLastSibling) return null;
      const block = this.parentBlock;
      if (!block || !block.children) return null;
      return block.children[this.siblingIndex + 1];
    },
    nextColSibling() {
      if (this.isLastInRow) return null;
      const block = this.parentBlock;
      if (!block || !block.children) return null;
      return block.children[this.siblingIndex + 1];
    },
    nextRowSibling() {
      const block = this.parentBlock;
      if (!block || !block.children) return null;
      const nextRowIndex = this.siblingIndex + this.gridColumns;
      if (nextRowIndex >= block.children.length) return null;
      return block.children[nextRowIndex];
    },
    nextColSiblingEl() {
      if (this.isLastInRow) return null;
      const parentEl = this.$el.parentElement;
      if (!parentEl) return null;
      const siblings = parentEl.querySelectorAll('.lc-content');
      const currentIndex = Array.from(siblings).findIndex(el => el === this.$el);
      if (currentIndex === -1 || currentIndex + 1 >= siblings.length) return null;
      return siblings[currentIndex + 1];
    },
    nextRowSiblingEl() {
      const parentEl = this.$el.parentElement;
      if (!parentEl) return null;
      const siblings = parentEl.querySelectorAll('.lc-content');
      const currentIndex = Array.from(siblings).findIndex(el => el === this.$el);
      const nextRowIndex = currentIndex + this.gridColumns;
      if (nextRowIndex >= siblings.length) return null;
      return siblings[nextRowIndex];
    },
    prevColSiblingEl() {
      if (this.isFirstInRow) return null;
      const parentEl = this.$el.parentElement;
      if (!parentEl) return null;
      const siblings = parentEl.querySelectorAll('.lc-content');
      const currentIndex = Array.from(siblings).findIndex(el => el === this.$el);
      if (currentIndex <= 0) return null;
      return siblings[currentIndex - 1];
    },
    prevRowSiblingEl() {
      if (this.isFirstInCol) return null;
      const parentEl = this.$el.parentElement;
      if (!parentEl) return null;
      const siblings = parentEl.querySelectorAll('.lc-content');
      const currentIndex = Array.from(siblings).findIndex(el => el === this.$el);
      const prevRowIndex = currentIndex - this.gridColumns;
      if (prevRowIndex < 0) return null;
      return siblings[prevRowIndex];
    },
    computedTitlePaddingTop() {
      return this.titlePaddingTop;
    },
  },
  watch: {
    width(newVal) {
      if (newVal !== undefined && newVal !== null) {
        this.contentWidth = newVal;
      }
    },
    widthUnit(newVal) {
      if (newVal) {
        this.currentWidthUnit = newVal;
      }
    },
  },
  created() {
    this._onColResize = throttle(this._onColResizeRaw, 16);
    this._onColResizeLeft = throttle(this._onColResizeLeftRaw, 16);
    this._onRowResize = throttle(this._onRowResizeRaw, 16);
    this._onRowResizeTop = throttle(this._onRowResizeTopRaw, 16);
  },
  mounted() {
    // 添加全局事件监听
    document.addEventListener("mousemove", this.onResize, {
      passive: true, // 事件处理程序不会调用 preventDefault()
    });
    document.addEventListener("mouseup", this.stopResize, {
      passive: true, // 事件处理程序不会调用 preventDefault()
    });
    const pageConfig = this.pageConfig?.();
    if (pageConfig?.page_options?.includes("懒加载")) {
      this.lazyLoad = true;
    }
    if (this.lazyLoad) {
      // 创建Intersection Observer来监测组件是否在可视区域内
      this.observer = new IntersectionObserver(
        (entries) => {
          // 如果组件进入可视区域，则设置isVisible为true
          if (entries[0].isIntersecting) {
            this.isVisible = true;
            // 一旦组件被渲染，可以停止观察
            this.observer.disconnect();
          }
        },
        {
          // 设置阈值，当组件有10%进入视口时触发回调
          threshold: 0.1,
          rootMargin: "50px", // 添加根边距，提前加载
        }
      );

      // 开始观察当前组件元素
      this.observer.observe(this.$el);
    }

    this.$nextTick(() => {
      this.titlePaddingTop = this.getTitlePaddingTop();
    });
  },
  beforeDestroy() {
    // 移除全局事件监听
    document.removeEventListener("mousemove", this.onResize);
    document.removeEventListener("mouseup", this.stopResize);

    // 清理Intersection Observer
    if (this.observer) {
      this.observer.disconnect();
    }
  },
  methods: {
    getTitlePaddingTop() {
      if (this.props.show_label !== '是' || !this.props.com_label) {
        return 0;
      }
      const comLabelRef = this.$refs.comLabelRef;
      if (!comLabelRef) {
        return 0;
      }
      return comLabelRef.$el?.offsetHeight || comLabelRef.$el?.getBoundingClientRect?.()?.height || 0;
    },
    startColResizeLeft(e) {
      if (this.isPreview || this.isView) return;
      e.preventDefault();
      e.stopPropagation();
      this.colResizingLeft = true;
      this.startX = e.clientX;
      const parentEl = this.$el.parentElement;
      if (!parentEl) {
        console.warn('Parent element not found');
        return;
      }
      this.parentWidth = parentEl.offsetWidth;
      const siblings = Array.from(parentEl.querySelectorAll('.lc-content'));
      const totalSiblings = siblings.length;
      const gridCols = this.gridColumns || 1;
      const currentRowIndex = Math.floor(siblings.findIndex(el => el === this.$el) / gridCols);
      const currentColIndex = siblings.findIndex(el => el === this.$el) % gridCols;
      this.currentColIndex = currentColIndex;
      this.colRatios = [];
      for (let col = 0; col < gridCols; col++) {
        const siblingIndex = currentRowIndex * gridCols + col;
        if (siblingIndex < totalSiblings) {
          const width = siblings[siblingIndex].offsetWidth;
          this.colRatios.push(parseFloat(((width / this.parentWidth) * 100).toFixed(2)));
        }
      }
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", this._onColResizeLeft);
      document.addEventListener("mouseup", this.stopColResizeLeft);
    },
    _onColResizeLeftRaw(e) {
      if (!this.colResizingLeft) return;
      const deltaX = e.clientX - this.startX;
      const deltaPercent = (deltaX / this.parentWidth) * 100;
      const currentIndex = this.currentColIndex;
      const prevIndex = currentIndex - 1;
      if (prevIndex < 0) return;
      let newCurrentRatio = this.colRatios[currentIndex] - deltaPercent;
      let newPrevRatio = this.colRatios[prevIndex] + deltaPercent;
      const minRatioPercent = 5;
      const maxRatioPercent = 95;
      if (newCurrentRatio < minRatioPercent || newPrevRatio < minRatioPercent) {
        return;
      }
      if (newCurrentRatio > maxRatioPercent || newPrevRatio > maxRatioPercent) {
        return;
      }
      newCurrentRatio = parseFloat(newCurrentRatio.toFixed(2));
      newPrevRatio = parseFloat(newPrevRatio.toFixed(2));
      const newRatios = [...this.colRatios];
      newRatios[currentIndex] = newCurrentRatio;
      newRatios[prevIndex] = newPrevRatio;
      const parentEl = this.$el.parentElement;
      const minVal = Math.min(...newRatios.filter(r => r > 0));
      const normalizedRatios = newRatios.map(r => parseFloat((r / minVal).toFixed(2)));
      const gridColsStyle = normalizedRatios.map(r => `${r}fr`).join(' ');
      parentEl.style.gridTemplateColumns = gridColsStyle;
    },
    stopColResizeLeft() {
      if (!this.colResizingLeft) return;
      this.colResizingLeft = false;
      dragStore.stopResize();
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", this._onColResizeLeft);
      document.removeEventListener("mouseup", this.stopColResizeLeft);
      try {
        const parentEl = this.$el.parentElement;
        if (!parentEl) {
          console.warn('Parent element not found');
          return;
        }
        const siblings = Array.from(parentEl.querySelectorAll('.lc-content'));
        const gridCols = this.gridColumns || 1;
        const currentRowIndex = Math.floor(siblings.findIndex(el => el === this.$el) / gridCols);
        const colRatios = [];
        for (let col = 0; col < gridCols; col++) {
          const siblingIndex = currentRowIndex * gridCols + col;
          if (siblings[siblingIndex]) {
            const width = siblings[siblingIndex].offsetWidth;
            colRatios.push(parseFloat(((width / this.parentWidth) * 100).toFixed(2)));
          }
        }
        const minVal = Math.min(...colRatios.filter(r => r > 0));
        const normalizedRatios = colRatios.map(r => parseFloat((r / minVal).toFixed(2)));
        const gridColsStyleFr = normalizedRatios.map(r => `${r}fr`).join(' ');
        const currentStyleJson = this.parentStyleJson || {};
        const newStyleJson = {
          ...currentStyleJson,
          display: "grid",
          "grid-template-columns": gridColsStyleFr,
        };
        this.$emit("resize", {
          id: this.id,
          resizeType: "col",
          isFinal: true,
          styleJson: newStyleJson,
          colRatios: normalizedRatios,
        });
      } catch (error) {
        console.error('stopColResizeLeft error:', error);
      }
    },
    startColResize(e) {
      if (this.isPreview || this.isView) return;
      e.preventDefault();
      e.stopPropagation();
      this.colResizing = true;
      this.startX = e.clientX;
      const parentEl = this.$el.parentElement;
      this.parentWidth = parentEl.offsetWidth;
      const siblings = Array.from(parentEl.querySelectorAll('.lc-content'));
      const totalSiblings = siblings.length;
      const gridCols = this.gridColumns || 1;
      const currentRowIndex = Math.floor(siblings.findIndex(el => el === this.$el) / gridCols);
      const currentColIndex = siblings.findIndex(el => el === this.$el) % gridCols;
      this.currentColIndex = currentColIndex;
      this.colRatios = [];
      for (let col = 0; col < gridCols; col++) {
        const siblingIndex = currentRowIndex * gridCols + col;
        if (siblingIndex < totalSiblings) {
          const width = siblings[siblingIndex].offsetWidth;
          this.colRatios.push(parseFloat(((width / this.parentWidth) * 100).toFixed(2)));
        }
      }
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", this._onColResize);
      document.addEventListener("mouseup", this.stopColResize);
    },
    _onColResizeRaw(e) {
      if (!this.colResizing) return;
      const deltaX = e.clientX - this.startX;
      const deltaPercent = (deltaX / this.parentWidth) * 100;
      const currentIndex = this.currentColIndex;
      const nextIndex = currentIndex + 1;
      if (nextIndex >= this.colRatios.length) return;
      let newCurrentRatio = this.colRatios[currentIndex] + deltaPercent;
      let newNextRatio = this.colRatios[nextIndex] - deltaPercent;
      const minRatioPercent = 5;
      const maxRatioPercent = 95;
      if (newCurrentRatio < minRatioPercent || newNextRatio < minRatioPercent) {
        return;
      }
      if (newCurrentRatio > maxRatioPercent || newNextRatio > maxRatioPercent) {
        return;
      }
      newCurrentRatio = parseFloat(newCurrentRatio.toFixed(2));
      newNextRatio = parseFloat(newNextRatio.toFixed(2));
      const newRatios = [...this.colRatios];
      newRatios[currentIndex] = newCurrentRatio;
      newRatios[nextIndex] = newNextRatio;
      const parentEl = this.$el.parentElement;
      const minVal = Math.min(...newRatios.filter(r => r > 0));
      const normalizedRatios = newRatios.map(r => parseFloat((r / minVal).toFixed(2)));
      const gridColsStyle = normalizedRatios.map(r => `${r}fr`).join(' ');
      parentEl.style.gridTemplateColumns = gridColsStyle;
    },
    stopColResize() {
      if (!this.colResizing) return;
      this.colResizing = false;
      dragStore.stopResize();
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", this._onColResize);
      document.removeEventListener("mouseup", this.stopColResize);
      try {
        const parentEl = this.$el.parentElement;
        if (!parentEl) {
          console.warn('Parent element not found');
          return;
        }
        const siblings = Array.from(parentEl.querySelectorAll('.lc-content'));
        const totalSiblings = siblings.length;
        const gridCols = this.gridColumns || 1;
        const currentRowIndex = Math.floor(siblings.findIndex(el => el === this.$el) / gridCols);
        const colRatios = [];
        for (let col = 0; col < gridCols; col++) {
          const siblingIndex = currentRowIndex * gridCols + col;
          if (siblingIndex < totalSiblings) {
            const width = siblings[siblingIndex].offsetWidth;
            colRatios.push(parseFloat(((width / this.parentWidth) * 100).toFixed(2)));
          }
        }
        const minVal = Math.min(...colRatios.filter(r => r > 0));
        const normalizedRatios = colRatios.map(r => parseFloat((r / minVal).toFixed(2)));
        const gridColsStyleFr = normalizedRatios.map(r => `${r}fr`).join(' ');
        const currentStyleJson = this.parentStyleJson || {};
        const newStyleJson = {
          ...currentStyleJson,
          display: "grid",
          "grid-template-columns": gridColsStyleFr,
        };
        this.$emit("resize", {
          id: this.id,
          resizeType: "col",
          isFinal: true,
          styleJson: newStyleJson,
          colRatios: normalizedRatios,
        });
      } catch (error) {
        console.error('stopColResize error:', error);
      }
    },
    startRowResize(e) {
      if (this.isPreview || this.isView) return;
      e.preventDefault();
      e.stopPropagation();
      this.rowResizing = true;
      dragStore.startResize();
      this.startY = e.clientY;
      const parentEl = this.$el.parentElement;
      if (!parentEl) {
        console.warn('Parent element not found');
        return;
      }
      this.parentHeight = parentEl.offsetHeight;
      const gridCols = this.gridColumns || 1;
      const siblings = Array.from(parentEl.querySelectorAll('.lc-content'));
      const totalRows = Math.ceil(siblings.length / gridCols);
      this.rowRatios = [];
      for (let row = 0; row < totalRows; row++) {
        const rowIndex = row * gridCols;
        if (siblings[rowIndex]) {
          const height = siblings[rowIndex].offsetHeight;
          this.rowRatios.push(parseFloat(((height / this.parentHeight) * 100).toFixed(2)));
        }
      }
      const currentIndex = siblings.findIndex(el => el === this.$el);
      this.currentRowIndex = Math.floor(currentIndex / gridCols);
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", this._onRowResize);
      document.addEventListener("mouseup", this.stopRowResize);
    },
    _onRowResizeRaw(e) {
      if (!this.rowResizing) return;
      const deltaY = e.clientY - this.startY;
      const deltaPercent = (deltaY / this.parentHeight) * 100;
      const currentRowIndex = this.currentRowIndex;
      const nextRowIndex = currentRowIndex + 1;
      if (nextRowIndex >= this.rowRatios.length) return;
      let newCurrentRatio = this.rowRatios[currentRowIndex] + deltaPercent;
      let newNextRatio = this.rowRatios[nextRowIndex] - deltaPercent;
      const minRatioPercent = 5;
      const maxRatioPercent = 95;
      if (newCurrentRatio < minRatioPercent || newNextRatio < minRatioPercent) {
        return;
      }
      if (newCurrentRatio > maxRatioPercent || newNextRatio > maxRatioPercent) {
        return;
      }
      newCurrentRatio = parseFloat(newCurrentRatio.toFixed(2));
      newNextRatio = parseFloat(newNextRatio.toFixed(2));
      const newRatios = [...this.rowRatios];
      newRatios[currentRowIndex] = newCurrentRatio;
      newRatios[nextRowIndex] = newNextRatio;
      const parentEl = this.$el.parentElement;
      const minVal = Math.min(...newRatios.filter(r => r > 0));
      const normalizedRatios = newRatios.map(r => parseFloat((r / minVal).toFixed(2)));
      const gridRowsStyle = normalizedRatios.map(r => `${r}fr`).join(' ');
      parentEl.style.gridTemplateRows = gridRowsStyle;
    },
    stopRowResize() {
      if (!this.rowResizing) return;
      this.rowResizing = false;
      dragStore.stopResize();
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", this._onRowResize);
      document.removeEventListener("mouseup", this.stopRowResize);
      try {
        const parentEl = this.$el.parentElement;
        if (!parentEl) {
          console.warn('Parent element not found');
          return;
        }
        const gridCols = this.gridColumns || 1;
        const siblings = Array.from(parentEl.querySelectorAll('.lc-content'));
        const totalRows = Math.ceil(siblings.length / gridCols);
        const rowRatios = [];
        for (let row = 0; row < totalRows; row++) {
          const rowIndex = row * gridCols;
          if (siblings[rowIndex]) {
            const height = siblings[rowIndex].offsetHeight;
            rowRatios.push(parseFloat(((height / this.parentHeight) * 100).toFixed(2)));
          }
        }
        const minVal = Math.min(...rowRatios.filter(r => r > 0));
        const normalizedRatios = rowRatios.map(r => parseFloat((r / minVal).toFixed(2)));
        const gridRowsStyleFr = normalizedRatios.map(r => `${r}fr`).join(' ');
        const currentStyleJson = this.parentStyleJson || {};
        const newStyleJson = {
          ...currentStyleJson,
          display: "grid",
          "grid-template-rows": gridRowsStyleFr,
        };
        this.$emit("resize", {
          id: this.id,
          resizeType: "row",
          isFinal: true,
          styleJson: newStyleJson,
          rowRatios: normalizedRatios,
        });
      } catch (error) {
        console.error('stopRowResize error:', error);
      }
    },
    startRowResizeTop(e) {
      if (this.isPreview || this.isView) return;
      e.preventDefault();
      e.stopPropagation();
      this.rowResizingTop = true;
      dragStore.startResize();
      this.startY = e.clientY;
      const parentEl = this.$el.parentElement;
      if (!parentEl) {
        console.warn('Parent element not found');
        return;
      }
      this.parentHeight = parentEl.offsetHeight;
      const gridCols = this.gridColumns || 1;
      const siblings = Array.from(parentEl.querySelectorAll('.lc-content'));
      const totalRows = Math.ceil(siblings.length / gridCols);
      this.currentRowIndex = Math.floor(siblings.findIndex(el => el === this.$el) / gridCols);
      this.rowRatios = [];
      for (let row = 0; row < totalRows; row++) {
        const rowIndex = row * gridCols;
        if (siblings[rowIndex]) {
          const height = siblings[rowIndex].offsetHeight;
          this.rowRatios.push(parseFloat(((height / this.parentHeight) * 100).toFixed(2)));
        }
      }
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", this._onRowResizeTop);
      document.addEventListener("mouseup", this.stopRowResizeTop);
    },
    _onRowResizeTopRaw(e) {
      if (!this.rowResizingTop) return;
      const deltaY = e.clientY - this.startY;
      const deltaPercent = (deltaY / this.parentHeight) * 100;
      const currentRowIndex = this.currentRowIndex;
      const prevRowIndex = currentRowIndex - 1;
      if (prevRowIndex < 0) return;
      let newCurrentRatio = this.rowRatios[currentRowIndex] - deltaPercent;
      let newPrevRatio = this.rowRatios[prevRowIndex] + deltaPercent;
      const minRatioPercent = 5;
      const maxRatioPercent = 95;
      if (newCurrentRatio < minRatioPercent || newPrevRatio < minRatioPercent) {
        return;
      }
      if (newCurrentRatio > maxRatioPercent || newPrevRatio > maxRatioPercent) {
        return;
      }
      newCurrentRatio = parseFloat(newCurrentRatio.toFixed(2));
      newPrevRatio = parseFloat(newPrevRatio.toFixed(2));
      const newRatios = [...this.rowRatios];
      newRatios[currentRowIndex] = newCurrentRatio;
      newRatios[prevRowIndex] = newPrevRatio;
      const parentEl = this.$el.parentElement;
      const minVal = Math.min(...newRatios.filter(r => r > 0));
      const normalizedRatios = newRatios.map(r => parseFloat((r / minVal).toFixed(2)));
      const gridRowsStyle = normalizedRatios.map(r => `${r}fr`).join(' ');
      parentEl.style.gridTemplateRows = gridRowsStyle;
    },
    stopRowResizeTop() {
      if (!this.rowResizingTop) return;
      this.rowResizingTop = false;
      dragStore.stopResize();
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", this._onRowResizeTop);
      document.removeEventListener("mouseup", this.stopRowResizeTop);
      try {
        const parentEl = this.$el.parentElement;
        if (!parentEl) {
          console.warn('Parent element not found');
          return;
        }
        const gridCols = this.gridColumns || 1;
        const siblings = Array.from(parentEl.querySelectorAll('.lc-content'));
        const totalRows = Math.ceil(siblings.length / gridCols);
        const rowRatios = [];
        for (let row = 0; row < totalRows; row++) {
          const rowIndex = row * gridCols;
          if (siblings[rowIndex]) {
            const height = siblings[rowIndex].offsetHeight;
            rowRatios.push(parseFloat(((height / this.parentHeight) * 100).toFixed(2)));
          }
        }
        const minVal = Math.min(...rowRatios.filter(r => r > 0));
        const normalizedRatios = rowRatios.map(r => parseFloat((r / minVal).toFixed(2)));
        const gridRowsStyleFr = normalizedRatios.map(r => `${r}fr`).join(' ');
        const currentStyleJson = this.parentStyleJson || {};
        const newStyleJson = {
          ...currentStyleJson,
          display: "grid",
          "grid-template-rows": gridRowsStyleFr,
        };
        this.$emit("resize", {
          id: this.id,
          resizeType: "row",
          isFinal: true,
          styleJson: newStyleJson,
          rowRatios: normalizedRatios,
        });
      } catch (error) {
        console.error('stopRowResizeTop error:', error);
      }
    },
    toEditCard(item) {
      try {
        const cardNo = this.cardNo || item?.no;
        if (!cardNo) {
          this.$message.warning("未找到卡片编号");
          return;
        }
        open(`${getFullBaseUrl()}/card-cell-editor/${cardNo}?srvApp=config`);
      } catch (error) {
        console.error("打开卡片编辑器失败:", error);
        this.$message.error("打开编辑器失败");
      }
    },
    onTap() {
      if (this.isPreview) return;
      // let val = this.children?.[0]?.id ? this.children?.[0] : this.props;
      let val = this.props;
      if (!this.childIsCardPart) {
        val = this.children?.[0]?.id ? this.children?.[0] : this.props;
      }
      if (this.childType === "layout") {
        val = this.props;
      }
      this.$emit("click", val);
    },
    onDelete() {
      if (Array.isArray(this.children) && this.children.length) {
        this.$emit("delete", this.children[0]);
      }
    },
    // 切换宽度单位
    toggleWidthUnit() {
      // 在px和%之间切换
      const newUnit = this.currentWidthUnit === "px" ? "%" : "px";

      // 转换宽度值
      if (this.contentWidth) {
        if (newUnit === "%") {
          // 从px转换为%
          const parentWidth = this.$el.parentElement.offsetWidth;
          this.contentWidth = Math.round(
            (this.contentWidth / parentWidth) * 100
          );
        } else {
          // 从%转换为px
          const parentWidth = this.$el.parentElement.offsetWidth;
          this.contentWidth = Math.round(
            (this.contentWidth / 100) * parentWidth
          );
        }
      } else {
        // 如果没有设置宽度，设置一个默认值
        this.contentWidth = newUnit === "px" ? 200 : 50;
      }

      this.currentWidthUnit = newUnit;

      // 触发宽度变化事件
      this.$emit("resize", {
        id: this.id,
        width: this.contentWidth,
        widthUnit: this.currentWidthUnit,
      });

      this.$emit("resize-end", {
        id: this.id,
        width: this.contentWidth,
        widthUnit: this.currentWidthUnit,
      });
    },

    // 开始调整宽度
    startResize(e, direction) {
      if (this.isPreview) return;

      e.preventDefault();
      e.stopPropagation();

      this.resizing = true;
      this.resizeDirection = direction;
      this.startX = e.clientX;

      // 获取当前元素的宽度和父元素的宽度
      const rect = this.$el.getBoundingClientRect();
      this.startWidth =
        this.contentWidth ||
        (this.currentWidthUnit === "px" ? rect.width : 100);
      this.parentWidth = this.$el.parentElement.offsetWidth;

      // 添加调整大小时的样式
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    },

    // 调整宽度过程
    onResize(e) {
      if (!this.resizing || !this.$el) return;

      const deltaX = e.clientX - this.startX;
      let newWidth;

      // 根据拖拽方向计算新宽度
      if (this.resizeDirection === "e") {
        // 向右拖拽增加宽度
        newWidth = this.startWidth + deltaX;
      } else if (this.resizeDirection === "w") {
        // 向左拖拽减少宽度
        newWidth = this.startWidth - deltaX;
      }

      // 根据单位类型调整粒度
      if (this.currentWidthUnit === "px") {
        // 按20px的粒度调整
        newWidth = Math.round(newWidth / 20) * 20;
        // 最小宽度为60px
        newWidth = Math.max(60, newWidth);
      } else {
        // 转换为百分比
        const percentWidth = (newWidth / this.parentWidth) * 100;
        // 按1%的粒度调整
        newWidth = Math.round(percentWidth);
        // 最小宽度为10%，最大为100%
        newWidth = Math.max(10, Math.min(100, newWidth));
      }

      // 更新宽度
      if (newWidth !== this.contentWidth) {
        this.contentWidth = newWidth;

        // 触发宽度变化事件
        this.$emit("resize", {
          id: this.id,
          width: this.contentWidth,
          widthUnit: this.currentWidthUnit,
        });
      }
    },

    // 停止调整宽度
    stopResize() {
      if (!this.resizing) return;

      this.resizing = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      // 触发宽度变化完成事件
      this.$emit("resize-end", {
        id: this.id,
        width: this.contentWidth,
        widthUnit: this.currentWidthUnit,
      });
    },

    handleDragStart(e, item) {
      if (this.isPreview || this.isView) return;
      // 如果是内容组件且有子组件，则设置拖拽数据为子组件
      let dragData;
      if (
        this.type === "content" &&
        this.children &&
        this.children.length > 0
      ) {
        dragData = { ...this.children[0] };
        // 添加源容器ID，用于后续交换逻辑
        dragData.sourceContentId = this.id;
      } else {
        dragData = { ...item };
        // 确保布局组件有children属性
        if (item.type === "layout" && !dragData.children) {
          dragData.children = [];
        }
      }
      // 只有ui组件可以被拖拽
      if (dragData.component !== "page-item") {
        return;
      }
      e.dataTransfer.setData("text/plain", JSON.stringify(dragData));
      dragStore.setDraggingElement(dragData);

      // 设置组件类型到全局状态
      dragStore.setDragType(dragData.type);
      if (
        this.type === "content" &&
        this.children &&
        this.children.length > 0
      ) {
        // 如果是内容组件的子组件被拖拽，设置一个特殊标记
        dragStore.setDragType("content-component");
      }

      // 设置拖拽效果
      e.dataTransfer.effectAllowed = "move";
      // 创建自定义拖拽图像（可选）
      const dragIcon = document.createElement("div");
      dragIcon.innerHTML =
        dragData.name || dragData.com_name || dragData.comp_label;
      dragIcon.className = "drag-icon";
      document.body.appendChild(dragIcon);
      e.dataTransfer.setDragImage(dragIcon, 0, 0);

      // 延迟移除拖拽图像
      setTimeout(() => {
        document.body.removeChild(dragIcon);
      }, 0);
    },
    handleDragLeave(e) {
      if (this.isPreview || this.isView) return;
      // 阻止事件冒泡
      e.stopPropagation();
      e.target.classList.remove("drag-over");
      e.target.classList.remove("drag-not-allowed");
      e.target.classList.remove("drag-swap");
      e.target.classList.remove("drag-move");
      e.target.classList.remove("drag-move");
    },

    handleDragOver(e) {
      if (this.isPreview || this.isView) return;
      // 阻止事件冒泡
      e.stopPropagation();

      // 阻止默认行为以允许放置
      e.preventDefault();
      // 获取拖拽元素的类型
      const draggedType = dragStore.getDragType();
      const data = dragStore.getDraggingElement();
      if (this.children && this.children.length) {
        const existingComponent = this.children[0];
        if (data && existingComponent.id && existingComponent.id === data.id) {
          e.dataTransfer.dropEffect = "none";
          e.target.classList.remove("drag-over");
          // e.target.classList.add("drag-not-allowed");
          return;
        }
      }
      // 处理content-component类型（从一个content-item拖到另一个）
      if (draggedType === "content-component") {
        // 允许放置到其他content-item中
        e.dataTransfer.dropEffect = "move";

        // 根据目标容器是否有子组件，显示不同的提示
        if (this.children && this.children.length > 0) {
          // 目标容器有组件，显示交换提示
          e.target.classList.add("drag-swap");
          e.target.classList.remove("drag-move");
        } else {
          // 目标容器没有组件，显示移动提示
          e.target.classList.add("drag-move");
          e.target.classList.remove("drag-swap");
        }
        e.target.classList.remove("drag-not-allowed");
        return;
      }

      // 处理其他类型组件
      if (e.target && this.allowDrop && draggedType) {
        if (
          draggedType === "component" ||
          draggedType === "cardPart" ||
          draggedType === "layout"
        ) {
          // 允许放置非容器和非布局组件且非 content 组件
          e.dataTransfer.dropEffect = "copy";
          e.target.classList.add("drag-over");
          e.target.classList.remove("drag-not-allowed");
        } else {
          // 不允许放置容器和布局组件
          e.dataTransfer.dropEffect = "none";
          e.target.classList.remove("drag-over");
          e.target.classList.add("drag-not-allowed");
        }
      }
    },
    handleDrop(e) {
      if (this.isPreview || this.isView) return;
      // 阻止事件冒泡
      e.stopPropagation();
      e.preventDefault();
      e.target.classList.remove("drag-over");
      e.target.classList.remove("drag-not-allowed");
      e.target.classList.remove("drag-swap");
      e.target.classList.remove("drag-move");

      // 获取拖拽元素的类型
      const draggedType = dragStore.getDragType();

      // 处理组件交换逻辑
      if (draggedType === "content-component") {
        const data = e.dataTransfer.getData("text/plain");
        if (data) {
          try {
            const draggedComponent = JSON.parse(data);
            const sourceContentId = draggedComponent.sourceContentId;

            // 如果目标容器有组件且不是cardPart类型，则交换组件
            // 如果是cardPart类型，则直接添加到容器中
            if (
              this.children &&
              this.children.length > 0 &&
              draggedComponent.type !== "cardPart"
            ) {
              // 获取目标组件
              const targetComponent = { ...this.children[0] };

              // 发出交换事件
              this.$emit("swap-components", {
                sourceContentId,
                targetContentId: this.id,
                draggedComponent,
                targetComponent,
              });
            } else {
              // 如果目标容器没有组件，则直接移动
              draggedComponent.parentId = this.id;
              draggedComponent.parent_no = this.props.com_no;

              // 发出移动事件
              this.$emit("move-component", {
                sourceContentId,
                targetContentId: this.id,
                component: draggedComponent,
              });
            }
            return;
          } catch (err) {
            console.error("解析拖拽数据失败:", err);
          }
        }
      }

      // 验证目标元素是否为允许的容器
      if (this.allowDrop) {
        const data = e.dataTransfer.getData("text/plain");
        if (data) {
          try {
            const draggedElement = JSON.parse(data);
            // 对于cardPart类型组件，允许多个组件拖入
            // 对于其他类型组件，保持原有逻辑，只允许一个组件
            if (
              draggedElement.type === "cardPart" &&
              this.children &&
              this.children.length > 0
            ) {
              // cardPart类型组件可以多个添加
              draggedElement.parentId = this.id;
              draggedElement.parent_no = this.props.com_no;
              draggedElement.com_seq = (this.props.children.length + 1) * 100;
              draggedElement._seq = draggedElement.com_seq;
              draggedElement.com_name =
                draggedElement.comp_label ||
                draggedElement.chart_name ||
                draggedElement.label;
              if (!draggedElement._editType) {
                draggedElement.id = `${this.id}${new Date().getTime()}`;
                draggedElement._editType = "add";
              }
              // 设置卡片部件特有属性
              draggedElement.com_type = "卡片部件";
              draggedElement.data = {
                com_type: "卡片部件",
                card_parts_name: draggedElement.com_name,
                parts_text: draggedElement.com_name,
                parts_type: draggedElement.parts_type,
              };

              Object.keys(draggedElement).forEach((key) => {
                if (key.startsWith("_default_")) {
                  draggedElement.data[key.replace("_default_", "")] =
                    draggedElement[key];
                }
              });
              draggedElement._type = "component";

              // 发出添加事件，将新组件添加到children数组中
              this.$emit("add", draggedElement);
              return;
            }
            // 只处理非container和非layout类型的组件
            else if (draggedElement.type === "layout") {
              // 处理layout类型的组件
              if (!draggedElement._editType) {
                draggedElement.id = `${this.id}_layout_${new Date().getTime()}`;
                draggedElement._editType = "add";
              }
              draggedElement.parentId = this.id;
              draggedElement.parent_no = this.com_no;
              draggedElement.com_seq = (this.props.children.length + 1) * 100;
              // 根据布局类型创建对应数量的内容组件
              let columnCount = 1; // 默认一列
              if (
                draggedElement.child_num &&
                typeof draggedElement.child_num === "number"
              ) {
                columnCount = draggedElement.child_num;
              }
              // 创建子内容组件
              if (!draggedElement.children) {
                draggedElement.children = [];
              }
              for (let i = 0; i < columnCount; i++) {
                const contentItem = {
                  id: `${
                    draggedElement.id
                  }_content_${i}_${new Date().getTime()}`,
                  type: "content",
                  component: "lc-content",
                  com_type: "layout",
                  name: `可放置组件区域${i + 1}`,
                  com_name: `组件容器${i + 1}`,
                  parentId: draggedElement.id,
                  layout_party: "组件",
                  _editType: "add",
                };
                draggedElement.children.push(contentItem);
              }
              this.$emit("add", draggedElement);
            } else if (
              draggedElement.type !== "container"
              // &&draggedElement.type !== "layout"
            ) {
              draggedElement.parentId = this.id;
              draggedElement.parent_no = this.props.com_no;
              draggedElement.com_seq = (this.props.children.length + 1) * 100;
              draggedElement._seq = draggedElement.com_seq;
              draggedElement.com_name =
                draggedElement.comp_label ||
                draggedElement.chart_name ||
                draggedElement.label;
              if (draggedElement.id) {
                draggedElement._duplicate_id = draggedElement.id;
              }
              if (!draggedElement._editType) {
                draggedElement.id = `${this.id}${new Date().getTime()}`;
                draggedElement._editType = "add";
              }
               if(draggedElement.value==='详情组件'){
                 draggedElement.com_type = "detail";
                 draggedElement.data = {
                   // ...draggedElement,
                   com_type: "detail",
                 };

                 Object.keys(draggedElement).forEach((key) => {
                   if (key.startsWith("_default_")) {
                     draggedElement.data[key.replace("_default_", "")] =
                         draggedElement[key];
                   }
                 });
                 draggedElement._type = "component";
               }
               if(draggedElement.value==='大华视频监控'){
                 draggedElement.com_type = "大华视频监控";
                 draggedElement.data = {
                   // ...draggedElement,
                   com_type: "大华视频监控",
                 };

                 Object.keys(draggedElement).forEach((key) => {
                   if (key.startsWith("_default_")) {
                     draggedElement.data[key.replace("_default_", "")] =
                         draggedElement[key];
                   }
                 });
                 draggedElement._type = "component";
               }
               

              if(draggedElement.value==='咨询入口'){
                draggedElement.com_type = "咨询入口";
                draggedElement.data = {
                  com_type: "咨询入口",
                };
                Object.keys(draggedElement).forEach((key) => {
                  if (key.startsWith("_default_")) {
                    draggedElement.data[key.replace("_default_", "")] =
                        draggedElement[key];
                  }
                });
                draggedElement._type = "component";
              }
              if (draggedElement.type === "cardPart") {
                draggedElement.com_type = "卡片部件";
                draggedElement.data = {
                  // ...draggedElement,
                  com_type: "卡片部件",
                  card_parts_name: draggedElement.com_name,
                  parts_text: draggedElement.com_name,
                  parts_type: draggedElement.parts_type,
                };

                Object.keys(draggedElement).forEach((key) => {
                  if (key.startsWith("_default_")) {
                    draggedElement.data[key.replace("_default_", "")] =
                      draggedElement[key];
                  }
                });
                draggedElement._type = "component";
              }
              if (draggedElement?.mock_data_json) {
                try {
                  // const mock_data_json = JSON.parse(
                  //   draggedElement?.mock_data_json
                  // );
                  // if (Array.isArray(mock_data_json)) {
                  //   draggedElement.mock_srv_data_json = draggedElement.mock_data_json;
                  //   draggedElement.srv_req_type === "模拟数据";
                  //   draggedElement.data.mock_srv_data_json = draggedElement.mock_data_json;
                  //   draggedElement.data.srv_req_type === "模拟数据";
                  // }
                } catch (error) {
                  console.error(error);
                }
              }
              this.$emit("add", draggedElement);
            } else {
              // 不允许放置container和layout类型的组件
              e.target.classList.add("drag-not-allowed");
              setTimeout(() => {
                e.target.classList.remove("drag-not-allowed");
              }, 1500);
            }
          } catch (err) {
            console.error("解析拖拽数据失败:", err);
          }
        }
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@use "../../styles/layout.common.scss" as layout;
.card-list {
  .title {
    font-weight: bold;
    font-size: 14px;
    margin-bottom: 10px;
    .tip {
      font-size: 12px;
      font-weight: normal;
      color: #999;
    }
  }
  .card-item {
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    width: 100%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    &:hover {
      background-color: rgba($color: #17d57e, $alpha: 0.1);
    }
  }
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
.overlay {
  @include layout.overlay;
  z-index: 99;
  $primary-color: #17d57e;
  &.child-is-layout {
    z-index: 0;
  }
  .name {
    background-color: rgba($color: $primary-color, $alpha: 0.7);
  }
  .close-icon {
    height: 28px;
    width: 28px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba($color: $primary-color, $alpha: 0.7);
    cursor: pointer;
    &:hover {
      font-size: 1.2em;
    }
  }
}

.lc-content {
  width: 100%;
  height: 100%;
  min-height: 30px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  $primary-color: #17d57e;
  overflow: auto;
  &::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
  // &::-webkit-scrollbar-track {
  //   background-color: transparent;
  // }
  // &::-webkit-scrollbar-thumb {
  //   background-color: transparent;
  // }

  &.edit-mode {
    background-color: rgba($color: #f0f0f0, $alpha: 0.3);
    overflow: unset;
  }

  /* 加载遮罩层样式 */
  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.1);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;

    .loading-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;

      i.el-icon-loading {
        font-size: 24px;
        color: rgba($color: #fff, $alpha: 0.3);
        margin-bottom: 8px;
      }

      .loading-text {
        font-size: 14px;
        color: rgba($color: #fff, $alpha: 0.3);
      }
    }
  }

  /* 添加浅色虚线边框 */
  :deep(.page-item) {
    overflow: unset;
  }

  .comp-name {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: -1;
    font-size: 18px;
  }

  .overlay {
    // border: 1px dashed rgba($color: $primary-color, $alpha: 0.3);
    &:hover {
      border: 2px dashed rgba($color: $primary-color, $alpha: 1);
      background-color: rgba($color: $primary-color, $alpha: 0.1);
    }

    // &.drag-over {
    //   // cursor: pointer;
    //   border: 1px dashed $primary-color;

    //   &::before {
    //     content: "组件容器";
    //     position: absolute;
    //     top: 0;
    //     left: 0;
    //     padding: 2px 5px;
    //     background-color: $primary-color;
    //     color: #fff;
    //     transform: translateY(-100%);
    //   }
    // }

    &.active {
      border: 2px solid $primary-color;
    }

    &.drag-over {
      border: 2px dashed $primary-color;
      background-color: rgba($color: $primary-color, $alpha: 0.3);

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

    &.drag-swap {
      border: 2px dashed #ff740e;
      background-color: rgba(255, 116, 14, 0.2);

      &::before {
        content: "交换组件位置";
        position: absolute;
        top: 0;
        left: 0;
        padding: 2px 5px;
        background-color: #ff740e;
        color: #fff;
        transform: translateY(-100%);
        z-index: 10;
      }
    }

    &.drag-move {
      border: 2px dashed #1890ff;
      background-color: rgba(24, 144, 255, 0.05);

      &::before {
        content: "移动组件到此处";
        position: absolute;
        top: 10px;
        left: 10px;
        padding: 5px 10px;
        background-color: #1890ff;
        color: #fff;
        z-index: 100;
        border-radius: 4px;
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
  }

  // 调整宽度的手柄样式
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
    background-color: $primary-color;
    pointer-events: auto;
    z-index: 11;

    &:hover {
      background-color: $primary-color;
    }

    &.resize-handle-e {
      top: 50%;
      right: 0;
      width: 6px;
      height: 20px;
      transform: translateY(-50%);
      cursor: ew-resize;
    }

    &.resize-handle-w {
      top: 50%;
      left: 0;
      width: 6px;
      height: 20px;
      transform: translateY(-50%);
      cursor: ew-resize;
    }
  }

  .resize-unit-switch {
    position: absolute;
    top: 0;
    right: 0;
    padding: 2px 5px;
    background-color: $primary-color;
    color: #fff;
    font-size: 12px;
    cursor: pointer;
    pointer-events: auto;
    z-index: 11;

    &:hover {
      background-color: $primary-color;
    }
  }

  .resize-handle-col {
    position: absolute;
    top: 0;
    right: 0;
    width: 6px;
    height: 100%;
    background-color: transparent;
    cursor: col-resize;
    z-index: 100;

    &:hover,
    &:active {
      background-color: rgba($primary-color, 0.3);
    }

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

    &.resize-handle-col-left {
      right: auto;
      left: 0;

      &::after {
        right: auto;
        left: 2px;
      }
    }
  }

  .resize-handle-row {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 6px;
    background-color: transparent;
    cursor: row-resize;
    z-index: 100;

    &:hover,
    &:active {
      background-color: rgba($primary-color, 0.3);
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

    &.resize-handle-row-top {
      bottom: auto;
      top: 0;

      &::after {
        bottom: auto;
        top: 2px;
      }
    }
  }

  // &.preview-mode {
  //   border-color: transparent;

  //   .resize-handles {
  //     display: none;
  //   }
  // }
}
</style>
