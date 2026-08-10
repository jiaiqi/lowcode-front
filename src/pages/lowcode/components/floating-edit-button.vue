<template>
  <div
    class="floating-edit-container"
    @click="handleContainerClick"
  >
    <!-- 编辑按钮 -->
    <transition name="fall-down">
      <div
        v-if="showEditButton"
        class="floating-edit-button"
        @click.stop="handleEditClick"
        @mouseenter="clearHideCountdown"
        @mouseleave="startHideCountdown"
      >
        <i class="el-icon-edit"></i>
        <span>编辑</span>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: "FloatingEditButton",
  data() {
    return {
      showEditButton: false,
      hideTimer: null,
    };
  },
  mounted() {
    // 监听全局点击事件（仅用来判断点击是否发生在右上角区域，并读取修饰键）
    document.addEventListener('click', this.handleGlobalClick);
  },
  beforeDestroy() {
    // 清理事件监听
    document.removeEventListener('click', this.handleGlobalClick);
    this.clearHideCountdown();
  },
  methods: {
    startHideCountdown() {
      this.clearHideCountdown();
      this.hideTimer = setTimeout(() => {
        this.showEditButton = false;
        this.hideTimer = null;
      }, 3000);
    },
    clearHideCountdown() {
      if (this.hideTimer) {
        clearTimeout(this.hideTimer);
        this.hideTimer = null;
      }
    },
    handleGlobalClick(event) {
      // 使用事件本身的修饰键属性，不维护“按住状态”
      const isCtrl = event.ctrlKey || event.metaKey;

      // 检查是否在右上角区域点击
      const rect = this.$el.getBoundingClientRect();
      const clickX = event.clientX;
      const clickY = event.clientY;
      
      // 定义右上角区域（右上角100x100像素区域）
      const topRightArea = {
        left: rect.right - 100,
        right: rect.right,
        top: rect.top,
        bottom: rect.top + 100
      };
      
      const isInTopRightArea = 
        clickX >= topRightArea.left && 
        clickX <= topRightArea.right &&
        clickY >= topRightArea.top && 
        clickY <= topRightArea.bottom;
      
      if (isCtrl && isInTopRightArea) {
        this.showEditButton = true;
        this.startHideCountdown();
      }
    },
    handleContainerClick() {
      // 点击容器其他区域时隐藏按钮
      if (this.showEditButton) {
        this.clearHideCountdown();
        this.showEditButton = false;
      }
    },
    handleEditClick() {
      let url = location.href
      if(url?.includes('site')){
        url = url.replace('site','edit')
      } else if(url?.includes('lowcode/view')){
        url = url.replace('lowcode/view','edit')
      }
      window.open(url, '_blank')
      // 点击后隐藏按钮
      this.clearHideCountdown();
      this.showEditButton = false;
    }
  }
};
</script>

<style lang="scss" scoped>
.floating-edit-container {
  position: fixed;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  z-index: 9999;
  pointer-events: auto;
  cursor: pointer;
}

.floating-edit-button {
  position: absolute;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 25px;
  padding: 12px;
  width: 80px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  user-select: none;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  i {
    font-size: 16px;
  }
}

// 下落动画
.fall-down-enter-active {
  animation: fallDown 0.6s ease-out;
}

.fall-down-leave-active {
  animation: fadeOut 0.3s ease-in;
}

@keyframes fallDown {
  0% {
    opacity: 0;
    transform: translateY(-50px) scale(0.8);
  }
  50% {
    opacity: 0.8;
    transform: translateY(-10px) scale(1.05);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes fadeOut {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-20px) scale(0.9);
  }
}
</style>
