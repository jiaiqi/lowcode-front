<template>
  <div
    class="float-component"
    :class="{ 'draggable': !isPreview && !isView }"
    :style="[setPosition, setSize]"
    @mouseover="!isPreview && !isView && setHovering(true)"
    @mouseleave="!isPreview && !isView && setHovering(false)"
    ref="floatComponentRef"
  >
    <!-- 遮罩层 -->
    <div
      class="overlay"
      :class="{
        active: isActive,
        hovering: isHovering
      }"
      :style="[setSize]"
      v-if="!isPreview && !isView"
      @mousedown.stop="handleMouseDown"
    >
      <!-- 删除按钮和拖拽按钮 -->
      <div class="com-name-overlay">
        <i
          class="el-icon-rank button drag-icon"
          @mousedown.stop="startDragging"
        ></i>
        <i
          class="el-icon-close button close-icon"
          @click.stop="onDelete"
        ></i>
      </div>

      <!-- 移除拖拽调整大小的手柄 -->
    </div>
    <page-item
      v-bind="props"
      v-if="props.data&&props.pageItem&&props.pageItem.card_group_json"
    ></page-item>
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
      width: 50,
      height: 50,
      left: this.position.x || 0,
      top: this.position.y || 0,
      offsetX: 0, // 鼠标相对于元素的偏移
      offsetY: 0,
      isHovering: false, // 鼠标是否悬停在组件上
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
        minWidth: this.width + "px",
        minHeight: this.height + "px",
      };
    },
    props() {
      return { ...this.$props, ...(this.$attrs || {}) };
    },
  },
  mounted() {
    // 初始化组件尺寸和位置
    const props = { ...this.$props, ...(this.$attrs || {}) };

    // if (props.layout_width) {
    //   this.width = parseInt(props.layout_width);
    // }
    // if (props.layout_height) {
    //   this.height = parseInt(props.layout_height);
    // }
    if (props.layout_x) {
      this.left = parseFloat(props.layout_x);
    }
    if (props.layout_y) {
      this.top = parseFloat(props.layout_y);
    }

    // 如果没有位置信息，设置默认位置
    if (this.left === 0 && this.top === 0) {
      this.$nextTick(() => {
        this.setDefaultPosition();
      });
    }

    // // 添加全局事件监听
    // document.addEventListener("mousemove", this.onDrag);
    // document.addEventListener("mouseup", this.stopDrag);
  },
  // beforeDestroy() {
  //   // 移除全局事件监听
  //   document.removeEventListener("mousemove", this.onDrag);
  //   document.removeEventListener("mouseup", this.stopDrag);
  // },
  methods: {
    onTap() {
      if (this.isPreview || this.isView) return;
      let val = this.props;
      this.$emit("click", val);
    },
    onDelete() {
      this.$emit("delete", this.props);
    },
    handleMouseDown(event) {
      if (this.isPreview || this.isView) return;

      // 只激活组件，不启动拖拽
      this.onTap();

      event.preventDefault();
      event.stopPropagation();
    },

    // 开始拖拽（只有通过拖拽按钮触发）
    startDragging(event) {
      if (this.isPreview || this.isView) return;

      // 获取容器和元素位置信息
      const container = document.getElementById('mobile_container');
      if (!container || !this.$refs.floatComponentRef) return;

      const containerRect = container.getBoundingClientRect();
      const elementRect = this.$refs.floatComponentRef.getBoundingClientRect();

      // 计算鼠标相对于元素的偏移
      this.offsetX = event.clientX - elementRect.left;
      this.offsetY = event.clientY - elementRect.top;

      // 设置拖动状态 - 只支持移动功能
      this.isDragging = true;
      this.dragType = 'move';
      this.startLeft = this.left;
      this.startTop = this.top;

      // 自动激活当前组件
      // this.onTap();
      
      // 添加全局事件监听，确保拖拽过程流畅
      document.addEventListener('mousemove', this.onDrag);
      document.addEventListener('mouseup', this.stopDrag);

      event.preventDefault();
      event.stopPropagation();
    },

    // 设置悬停状态
    setHovering(value) {
      this.isHovering = value;
    },
    onDrag(event) {
      if (!this.isDragging) return;

      // 获取容器
      const container = document.getElementById('mobile_container');
      if (!container || !this.$refs.floatComponentRef) return;

      const containerRect = container.getBoundingClientRect();

      // 只处理移动位置的情况
      if (this.dragType === 'move') {
        // 计算新位置（像素）
        let newX = event.clientX - this.offsetX - containerRect.left;
        let newY = event.clientY - this.offsetY - containerRect.top;

        // 获取元素和容器尺寸
        const elementWidth = this.$refs.floatComponentRef.offsetWidth;
        const elementHeight = this.$refs.floatComponentRef.offsetHeight;

        // 获取容器的计算样式，考虑padding
        const containerStyle = window.getComputedStyle(container);
        const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
        const paddingTop = parseFloat(containerStyle.paddingTop) || 0;
        const paddingRight = parseFloat(containerStyle.paddingRight) || 0;
        const paddingBottom = parseFloat(containerStyle.paddingBottom) || 0;

        const availableWidth = containerRect.width - paddingLeft - paddingRight;
        const availableHeight = containerRect.height - paddingTop - paddingBottom;

        // 限制在容器内
        newX = Math.max(paddingLeft, Math.min(newX, paddingLeft + availableWidth - elementWidth));
        newY = Math.max(paddingTop, Math.min(newY, paddingTop + availableHeight - elementHeight));

        // 转换为百分比
        this.left = (newX / containerRect.width) * 100;
        this.top = (newY / containerRect.height) * 100;
      }

      // 更新组件属性
      this.updateComponentProps();
    },
    stopDrag() {
      if (!this.isDragging) return;

      this.isDragging = false;
      this.dragType = null;
      
      // 移除全局事件监听
      document.removeEventListener('mousemove', this.onDrag);
      document.removeEventListener('mouseup', this.stopDrag);

      // 确保更新最终属性
      this.updateComponentProps();

      // 触发位置更新事件
      this.$emit('position-change', {
        layout_x: this.left,
        layout_y: this.top
      });
    },
    updateComponentProps() {
      // 更新组件的属性，触发事件通知父组件
      const updatedProps = {
        ...this.props,
        // 只更新位置相关属性，不更新宽高
        layout_x: parseFloat(this.left.toFixed(2)),
        x: parseFloat(this.left.toFixed(2)),
        layout_y: parseFloat(this.top.toFixed(2)),
        y: parseFloat(this.top.toFixed(2)),
      };

      // 触发resize事件，将更新后的属性传递给父组件
      this.$emit("resize", updatedProps);
    },

    setDefaultPosition() {
      const container = document.getElementById('mobile_container');
      if (container && this.$refs.floatComponentRef) {
        const containerRect = container.getBoundingClientRect();
        const containerStyle = window.getComputedStyle(container);
        const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
        const paddingTop = parseFloat(containerStyle.paddingTop) || 0;
        const paddingRight = parseFloat(containerStyle.paddingRight) || 0;
        const paddingBottom = parseFloat(containerStyle.paddingBottom) || 0;

        const availableWidth = containerRect.width - paddingLeft - paddingRight;
        const availableHeight = containerRect.height - paddingTop - paddingBottom;

        const margin = 20;
        const elementWidth = this.width;
        const elementHeight = this.height;

        // 计算默认位置（像素）
        const defaultX = paddingLeft + Math.max(0, availableWidth - elementWidth - margin);
        const defaultY = paddingTop + Math.max(0, availableHeight - elementHeight - margin);

        // 转换为百分比
        this.left = (defaultX / containerRect.width) * 100;
        this.top = (defaultY / containerRect.height) * 100;

        // 触发位置更新事件
        this.$emit('position-change', {
          layout_x: this.left,
          layout_y: this.top
        });
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@use "../styles/layout.common.scss" as layout;

.float-component {
  position: absolute;
  z-index: 999;

  /* 移除整体悬停时的移动光标，只允许通过拖拽按钮拖拽 */

  .overlay {
    @include layout.overlay;
    z-index: 99;
    $primary-color: #17d57e;

    &.child-is-layout {
      z-index: 0;
    }

    .com-name-overlay {
      inset: 0;
    }

    .name {
      background-color: rgba($color: $primary-color, $alpha: 0.7);
    }

    .close-icon,
    .drag-icon {
      height: 28px;
      width: 28px;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: rgba($color: $primary-color, $alpha: 0.7);
      position: absolute;
      top: 0;
      transform: translate(-50%, -100%);
      color: #fff;
      &:hover {
        font-size: 1.2em;
      }
    }

    .close-icon {
      cursor: pointer;
      right: 0;
    }

    .drag-icon {
      cursor: move;
      right: 30px;
    }

    &:hover,
    &.hovering {
      border: 2px dashed rgba($color: $primary-color, $alpha: 1);
      background-color: rgba($color: $primary-color, $alpha: 0.1);
    }

    &.active {
      border: 2px solid $primary-color;
    }

    // 移除调整大小的手柄样式
  }
}
</style>