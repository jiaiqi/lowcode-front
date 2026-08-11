<template>
  <div
    class="float-component"
    :style="[setPosition, setSize]"
    @click.stop="onTap"
    ref="floatComponentRef"
  >
    <!-- 遮罩层 -->
    <div
      class="overlay"
      @click.stop="onTap"
      :class="{
        active: isActive,
      }"
      v-if="!isPreview && !isView"
      @mousedown.stop="startDrag($event, 'move')"
    >
      <!-- 删除按钮 -->
      <div class="com-name-overlay">
        <i class="el-icon-close button close-icon" @click.stop="onDelete"></i>
      </div>

      <!-- 拖拽调整大小的手柄 -->
      <template v-if="isActive">
        <div
          class="resize-handle top-left"
          @mousedown.stop="startDrag($event, 'resize-tl')"
        ></div>
        <div
          class="resize-handle top-right"
          @mousedown.stop="startDrag($event, 'resize-tr')"
        ></div>
        <div
          class="resize-handle bottom-left"
          @mousedown.stop="startDrag($event, 'resize-bl')"
        ></div>
        <div
          class="resize-handle bottom-right"
          @mousedown.stop="startDrag($event, 'resize-br')"
        ></div>
        <div
          class="resize-handle top"
          @mousedown.stop="startDrag($event, 'resize-t')"
        ></div>
        <div
          class="resize-handle right"
          @mousedown.stop="startDrag($event, 'resize-r')"
        ></div>
        <div
          class="resize-handle bottom"
          @mousedown.stop="startDrag($event, 'resize-b')"
        ></div>
        <div
          class="resize-handle left"
          @mousedown.stop="startDrag($event, 'resize-l')"
        ></div>
      </template>
    </div>
    <page-item v-bind="props" v-if="props.data"></page-item>
    <span v-else>悬浮组件</span>
  </div>
</template>

<script>
import pageItem from "@/pages/lowcode/widgets/page-item.vue";

export default {
  components: {
    pageItem,
  },
  props: {
    id: {
      type: [String, Number],
      default: "",
    },
    currentId: {
      type: [String, Number],
      default: "",
    },
    position: {
      type: Object,
      default: () => ({
        x: 0,
        y: 0,
      }),
    },
    isPreview: {
      type: Boolean,
      default: false,
    },
    isView: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      isDragging: false,
      dragType: null,
      startX: 0,
      startY: 0,
      startWidth: 0,
      startHeight: 0,
      startLeft: 0,
      startTop: 0,
      width: 100,
      height: 100,
      left: this.position.x || 0,
      top: this.position.y || 0,
    };
  },
  computed: {
    isActive() {
      return this.currentId && this.id === this.currentId;
    },
    setPosition() {
      return {
        position: "absolute",
        left: this.left + "%",
        top: this.top + "%",
      };
    },
    setSize() {
      return {
        width: this.width + "px",
        height: this.height + "px",
      };
    },
    props() {
      return { ...this.$props, ...(this.$attrs || {}) };
    },
  },
  mounted() {
    // 初始化组件尺寸和位置
    const props = { ...this.$props, ...(this.$attrs || {}) };

    if (props.layout_width) {
      this.width = parseInt(props.layout_width);
    }
    if (props.layout_height) {
      this.height = parseInt(props.layout_height);
    }
    if (props.layout_x) {
      this.left = parseFloat(props.layout_x);
    }
    if (props.layout_y) {
      this.top = parseFloat(props.layout_y);
    }

    // 添加全局事件监听
    window.addEventListener("mousemove", this.onDrag);
    window.addEventListener("mouseup", this.stopDrag);
  },
  beforeDestroy() {
    // 移除全局事件监听
    window.removeEventListener("mousemove", this.onDrag);
    window.removeEventListener("mouseup", this.stopDrag);
  },
  methods: {
    onTap() {
      if (this.isPreview || this.isView) return;
      let val = this.props;
      this.$emit("click", val);
    },
    onDelete() {
      this.$emit("delete", this.props);
    },
    startDrag(event, type) {
      if (this.isPreview || this.isView) return;
      if (!this.isActive) return;
      this.isDragging = true;
      this.dragType = type;
      this.startX = event.clientX;
      this.startY = event.clientY;
      this.startWidth = this.width;
      this.startHeight = this.height;
      this.startLeft = this.left;
      this.startTop = this.top;

      event.preventDefault();
    },
    onDrag(event) {
      if (!this.isDragging) return;

      const deltaX = event.clientX - this.startX;
      const deltaY = event.clientY - this.startY;
      const parentElement = this.$el.parentElement;
      const parentRect = parentElement
        ? parentElement.getBoundingClientRect()
        : { width: window.innerWidth, height: window.innerHeight };

      // 计算百分比变化（相对于父容器）
      const percentX = (deltaX / parentRect.width) * 100;
      const percentY = (deltaY / parentRect.height) * 100;

      // 根据拖拽类型处理不同的调整
      switch (this.dragType) {
        case "move":
          this.left = this.startLeft + percentX;
          this.top = this.startTop + percentY;
          break;

        case "resize-br": // 右下角
          this.width = Math.max(20, this.startWidth + deltaX);
          this.height = Math.max(20, this.startHeight + deltaY);
          break;

        case "resize-bl": // 左下角
          this.width = Math.max(20, this.startWidth - deltaX);
          this.left = this.startLeft + percentX / 2;
          this.height = Math.max(20, this.startHeight + deltaY);
          break;

        case "resize-tr": // 右上角
          this.width = Math.max(20, this.startWidth + deltaX);
          this.height = Math.max(20, this.startHeight - deltaY);
          this.top = this.startTop + percentY / 2;
          break;

        case "resize-tl": // 左上角
          this.width = Math.max(20, this.startWidth - deltaX);
          this.height = Math.max(20, this.startHeight - deltaY);
          this.left = this.startLeft + percentX / 2;
          this.top = this.startTop + percentY / 2;
          break;

        case "resize-t": // 上边
          this.height = Math.max(20, this.startHeight - deltaY);
          this.top = this.startTop + percentY / 2;
          break;

        case "resize-r": // 右边
          this.width = Math.max(20, this.startWidth + deltaX);
          break;

        case "resize-b": // 下边
          this.height = Math.max(20, this.startHeight + deltaY);
          break;

        case "resize-l": // 左边
          this.width = Math.max(20, this.startWidth - deltaX);
          this.left = this.startLeft + percentX / 2;
          break;
      }

      // 更新组件属性
      this.updateComponentProps();
    },
    stopDrag() {
      if (!this.isDragging) return;

      this.isDragging = false;
      this.dragType = null;

      // 确保更新最终属性
      this.updateComponentProps();
    },
    updateComponentProps() {
      // 更新组件的属性，触发事件通知父组件
      const updatedProps = {
        ...this.props,
        layout_width: Math.round(this.width),
        width: Math.round(this.width),
        layout_height: Math.round(this.height),
        height: Math.round(this.height),
        layout_x: parseFloat(this.left.toFixed(2)),
        x: parseFloat(this.left.toFixed(2)),
        layout_y: parseFloat(this.top.toFixed(2)),
        y: parseFloat(this.top.toFixed(2)),
      };

      // 触发resize事件，将更新后的属性传递给父组件
      this.$emit("resize", updatedProps);
      // 同时触发click事件，确保当前组件被选中
      this.$emit("click", updatedProps);
    },
  },
};
</script>

<style lang="scss" scoped>
@use "../../styles/layout.common.scss" as layout;

.float-component {
  position: absolute;
  z-index: 999;

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
    &:hover {
      border: 2px dashed rgba($color: $primary-color, $alpha: 1);
      background-color: rgba($color: $primary-color, $alpha: 0.1);
    }
    &.active {
      border: 2px solid $primary-color;
    }

    // 调整大小的手柄样式
    .resize-handle {
      position: absolute;
      background-color: $primary-color;
      border: 1px solid white;
      width: 8px;
      height: 8px;
      z-index: 100;

      &.top-left {
        top: -4px;
        left: -4px;
        cursor: nwse-resize;
      }

      &.top-right {
        top: -4px;
        right: -4px;
        cursor: nesw-resize;
      }

      &.bottom-left {
        bottom: -4px;
        left: -4px;
        cursor: nesw-resize;
      }

      &.bottom-right {
        bottom: -4px;
        right: -4px;
        cursor: nwse-resize;
      }

      &.top {
        top: -4px;
        left: 50%;
        transform: translateX(-50%);
        cursor: ns-resize;
      }

      &.right {
        top: 50%;
        right: -4px;
        transform: translateY(-50%);
        cursor: ew-resize;
      }

      &.bottom {
        bottom: -4px;
        left: 50%;
        transform: translateX(-50%);
        cursor: ns-resize;
      }

      &.left {
        top: 50%;
        left: -4px;
        transform: translateY(-50%);
        cursor: ew-resize;
      }
    }
  }
}
</style>
