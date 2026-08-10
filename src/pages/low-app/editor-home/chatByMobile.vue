<template>
  <div
    class="chat_mobile"
    :class="{ 'draggable': inEdit }"
    @click="handleChatClick"
    @mousedown="handleMouseDown"
    :style="[chatStyleJson,positionStyle]"
    ref="chatMobile"
  >
    <!-- 编辑模式下的控制按钮 -->
    <div class="control-buttons" v-if="inEdit">
      <div
        class="drag-btn"
        @mousedown.stop="handleMouseDown"
        title="拖动"
      >
        <i class="el-icon-rank"></i>
      </div>
      <div
        class="delete-btn"
        @click.stop="handleDelete"
        title="删除"
      >
        <i class="el-icon-delete"></i>
      </div>
    </div>

    <div class="chat-icon">
      <i class="el-icon-message" v-if="!chatBg"></i>
      <img :src="chatBg" alt="" v-if="chatBg">
    </div>
    <div class="chat-text" v-if="showText">在线咨询</div>
  </div>
</template>

<script>
import {formatStyleData} from "@/pages/lowcode/vendor/datav/common";
import chaImg from "@/assets/img/chat.png";

export default {
  name: "chatByMobile",
  props: {
    inEdit: {
      type: Boolean,
      default: false
    },
    pageItem: {
      type: Object,
      default: () => ({})
    },
    onDelete: {
      type: Function,
      default: null
    }
  },
  data() {
    return {
      showText: false,
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
      elementStartX: 0,
      elementStartY: 0,
      offsetX: 0, // 鼠标相对于元素的偏移
      offsetY: 0,
      currentX: null,
      currentY: null,
      chatBg:null
    }
  },
  computed: {
    positionStyle() {
      if (this.currentX !== null && this.currentY !== null) {
        return {
          position: 'absolute',
          left: `${this.currentX}px`,
          top: `${this.currentY}px`,
          right: 'auto',
          bottom: 'auto'
        }
      }
      return {}
    },
    chatStyleJson() {
      if (!this.pageItem || !this.pageItem.style_json) {
        return {};
      }
      let style = {};
      try {
        style = formatStyleData(this.pageItem.style_json);

        // 从样式对象中移除background-image属性，背景图片将单独处理
        if (style && style['background-image']) {
          delete style['background-image'];
        }
        if(style&&style['owner_no']){
          delete style['owner_no'];
        }
      } catch (error) {
        return {};
      }
      return style || {};
    },
  },
  watch: {
    pageItem: {
      handler(newPageItem) {
        if (newPageItem) {
          // 使用layout_x和layout_y作为位置信息
          this.currentX = newPageItem.layout_x !== undefined ? parseFloat(newPageItem.layout_x) : null
          this.currentY = newPageItem.layout_y !== undefined ? parseFloat(newPageItem.layout_y) : null
          // 默认使用chaImg
          this.chatBg = null;
          try {
            const style = formatStyleData(newPageItem.style_json);
            if (style && style['background-image']) {
              const backgroundImage = style['background-image'];
              const urlMatch = backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
              if (urlMatch && urlMatch[1]) {
                this.chatBg = urlMatch[1];
              }
            }
          } catch (error) {
            // 出错时保持默认值
          }
        }
      },
      deep: true,
      immediate: true
    },
  },
  mounted() {
    // 初始化位置
    if (this.pageItem) {
      this.currentX = this.pageItem.layout_x !== undefined ? parseFloat(this.pageItem.layout_x) : null
      this.currentY = this.pageItem.layout_y !== undefined ? parseFloat(this.pageItem.layout_y) : null
    }
    if (this.currentX === null || this.currentY === null) {
      this.$nextTick(() => {
        this.setDefaultPosition()
      })
    }
    document.addEventListener('mousemove', this.handleMouseMove)
    document.addEventListener('mouseup', this.handleMouseUp)
  },
  beforeDestroy() {
    document.removeEventListener('mousemove', this.handleMouseMove)
    document.removeEventListener('mouseup', this.handleMouseUp)
  },
  methods: {
    handleChatClick(event) {
      // 如果刚刚拖动过，不触发点击事件
      if (this.isDragging) {
        event.preventDefault()
        event.stopPropagation()
        return
      }
      if (!this.inEdit) {
      }
    },
    handleMouseDown(event) {
      // 只在编辑模式下允许拖动
      if (!this.inEdit) return
      const container = document.getElementById('mobile_container')
      if (!container || !this.$refs.chatMobile) return
      const containerRect = container.getBoundingClientRect()
      const elementRect = this.$refs.chatMobile.getBoundingClientRect()
      this.offsetX = event.clientX - elementRect.left
      this.offsetY = event.clientY - elementRect.top
      this.isDragging = true
      this.elementStartX = this.currentX || 0
      this.elementStartY = this.currentY || 0
      event.preventDefault()
      event.stopPropagation()
    },
    handleMouseMove(event) {
      if (!this.isDragging) return
      // 获取容器边界限制
      const container = document.getElementById('mobile_container')
      if (!container || !this.$refs.chatMobile) return
      const containerRect = container.getBoundingClientRect()
      let newX = event.clientX - this.offsetX - containerRect.left
      let newY = event.clientY - this.offsetY - containerRect.top
      const elementWidth = 56
      const elementHeight = 56
      const extraWidth = this.inEdit ? 32 : 0
      const extraHeight = this.inEdit ? 8 : 0
      // 获取容器的计算样式，考虑padding
      const containerStyle = window.getComputedStyle(container)
      const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0
      const paddingTop = parseFloat(containerStyle.paddingTop) || 0
      const paddingRight = parseFloat(containerStyle.paddingRight) || 0
      const paddingBottom = parseFloat(containerStyle.paddingBottom) || 0
      const availableWidth = containerRect.width - paddingLeft - paddingRight
      const availableHeight = containerRect.height - paddingTop - paddingBottom
      newX = Math.max(paddingLeft, Math.min(newX, paddingLeft + availableWidth - elementWidth - extraWidth))
      newY = Math.max(paddingTop, Math.min(newY, paddingTop + availableHeight - elementHeight - extraHeight))
      this.currentX = newX
      this.currentY = newY
    },
    handleMouseUp() {
      if (this.isDragging) {
        this.isDragging = false
        // 触发位置更新事件，更新layout_x和layout_y
        this.$emit('position-change', {
          layout_x: this.currentX,
          layout_y: this.currentY
        })

        // 延迟重置拖动状态，避免立即触发点击事件
        setTimeout(() => {
          this.isDragging = false
        }, 100)
      }
    },
    setDefaultPosition() {
      const container = document.getElementById('mobile_container')
      if (container && this.$refs.chatMobile) {
        const containerRect = container.getBoundingClientRect()
        const containerStyle = window.getComputedStyle(container)
        const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0
        const paddingTop = parseFloat(containerStyle.paddingTop) || 0
        const paddingRight = parseFloat(containerStyle.paddingRight) || 0
        const paddingBottom = parseFloat(containerStyle.paddingBottom) || 0
        const availableWidth = containerRect.width - paddingLeft - paddingRight
        const availableHeight = containerRect.height - paddingTop - paddingBottom
        const margin = 20
        const elementWidth = 56  // 3.5rem = 56px
        const elementHeight = 56 // 3.5rem = 56px
        const extraWidth = this.inEdit ? 32 : 0
        const extraHeight = this.inEdit ? 8 : 0
        this.currentX = paddingLeft + Math.max(0, Math.min(availableWidth - elementWidth - extraWidth - margin, availableWidth - elementWidth - extraWidth))
        this.currentY = paddingTop + Math.max(0, Math.min(availableHeight - elementHeight - extraHeight - margin, availableHeight - elementHeight - extraHeight))
        this.$emit('position-change', {
          layout_x: this.currentX,
          layout_y: this.currentY
        })
      }
    },

    // 处理删除事件
    handleDelete() {
      if (this.onDelete && typeof this.onDelete === 'function') {
        this.onDelete()
      } else {
        // 如果没有传入删除方法，触发删除事件
        this.$emit('delete')
      }
    }
  }
}
</script>

<style scoped lang="scss">
.chat_mobile {
  width: 3.5rem;
  height: 3.5rem;
  background:#0e77ea;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 0.25rem 0.75rem rgba(14, 119, 234, 0.4);
  position: relative;
  overflow: visible;
  user-select: none;
  .control-buttons {
    position: absolute;
    top: -0.5rem;
    right: -0.5rem;
    display: flex;
    gap: 0.25rem;
    z-index: 10;

    .drag-btn,
    .delete-btn {
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 0.75rem;
      transition: all 0.2s ease;
      box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.2);
    }

    .drag-btn {
      background: #409eff;
      color: white;
      cursor: move;

      &:hover {
        background: #66b1ff;
        transform: scale(1.1);
      }

      &:active {
        cursor: grabbing;
        transform: scale(0.95);
      }
    }

    .delete-btn {
      background: #f56c6c;
      color: white;

      &:hover {
        background: #f78989;
        transform: scale(1.1);
      }

      &:active {
        transform: scale(0.95);
      }
    }
  }

  &.draggable {
    cursor: move;
  }

  .chat-icon {
    color: white;
    font-size: 1.5rem; /* 24px */
    line-height: 1;

    i {
      display: block;
    }
    img{
      display: block;
      width:2.1875rem;
      height:2.1875rem;
    }
  }

  .chat-text {
    position: absolute;
    bottom: -2rem;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;

    &::before {
      content: '';
      position: absolute;
      top: -0.25rem;
      left: 50%;
      transform: translateX(-50%);
      border-left: 0.25rem solid transparent;
      border-right: 0.25rem solid transparent;
      border-bottom: 0.25rem solid rgba(0, 0, 0, 0.8);
    }
  }
}
</style>