<template>
  <teleport to="body">
    <transition
      name="dialog"
      @enter="onEnter"
      @leave="onLeave"
    >
      <!-- 遮罩层 -->
      <div
        v-if="visible"
        class="custom-dialog-overlay"
        @click="handleOverlayClick"
      >
        <!-- 弹窗内容 -->
        <div
          class="custom-dialog-content"
          @click.stop
          ref="dialogContent"
        >
          <!-- 关闭按钮 -->
          <button
            class="custom-dialog-close"
            @click="handleClose"
            type="button"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path
                d="M8 6.586L13.657 1 15 2.343 9.414 8 15 13.657 13.657 15 8 9.414 2.343 15 1 13.657 6.586 8 1 2.343 2.343 1 8 6.586z"
              />
            </svg>
          </button>

          <!-- 插槽内容 -->
          <div>
            <slot></slot>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script>
import Teleport from "vue2-teleport";

export default {
  name: "CustomDialog",
  components: {
    Teleport
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    closeOnClickModal: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    handleClose() {
      this.$emit('update:visible', false);
      this.$emit('close');
    },
    handleOverlayClick() {
      if (this.closeOnClickModal) {
        this.handleClose();
      }
    },
    handleEscKey(event) {
      if (event.key === 'Escape' && this.visible) {
        this.handleClose();
      }
    },
    onEnter(el) {
      // 进入动画开始时的回调
      this.$emit('opened');
    },
    onLeave(el) {
      // 离开动画结束时的回调
      this.$emit('closed');
    }
  },
  // mounted() {
  //   document.addEventListener('keydown', this.handleEscKey);
  // },
  // beforeDestroy() {
  //   document.removeEventListener('keydown', this.handleEscKey);
  // },
  watch: {
    visible(newVal) {
      if (newVal) {
        // 弹窗打开时禁止body滚动
        document.body.style.overflow = 'hidden';
        // 弹窗打开时禁止body滚动
        document.body.style.pointerEvents = 'none';
      } else {
        // 弹窗关闭时恢复body滚动
        document.body.style.overflow = '';
        // 弹窗关闭时恢复body滚动
        document.body.style.pointerEvents = '';
      }
    }
  }
};
</script>

<style scoped>
.custom-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(5px);
  overflow: hidden;
}

.custom-dialog-content {
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  /* padding: clamp(20px, 2vh, 40px); */
  position: relative;
  width: min-content;
  height: min-content;
  max-width: 100%;
  max-height: 100%;
  overflow: auto;
  transform-origin: center center;
  overflow: hidden;
}

.custom-dialog-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fefefe;
  transition: all 0.2s ease;
  z-index: 99;
}

.custom-dialog-close:hover {
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  transform: scale(1.1);
  z-index: 9;
}


/* Vue Transition 动画效果 */
.dialog-enter-active {
  transition: all 0.3s ease-out;
}

.dialog-leave-active {
  transition: all 0.25s ease-in;
}

.dialog-enter-from {
  opacity: 0;
  transform: scale(0);
}

.dialog-enter-to {
  opacity: 1;
  transform: scale(1);
}

.dialog-leave-from {
  opacity: 1;
  transform: scale(1);
}

.dialog-leave-to {
  opacity: 0;
  transform: scale(0);
}

/* 弹窗内容的动画 */
.dialog-enter-active .custom-dialog-content {
  transition: all 0.3s ease-out;
}

.dialog-leave-active .custom-dialog-content {
  transition: all 0.25s ease-in;
}

.dialog-enter-from .custom-dialog-content {
  opacity: 0;
  transform: scale(0.9) translateY(-20px);
}

.dialog-enter-to .custom-dialog-content {
  opacity: 1;
  transform: scale(1) translateY(0);
}

.dialog-leave-from .custom-dialog-content {
  opacity: 1;
  transform: scale(1) translateY(0);
}

.dialog-leave-to .custom-dialog-content {
  opacity: 0;
  transform: scale(0.9) translateY(-20px);
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .custom-dialog-content {
    background: #2d2d2d;
    color: #fff;
  }

  .custom-dialog-close {
    background: rgba(255, 255, 255, 0.1);
    color: #ccc;
  }

  .custom-dialog-close:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .custom-dialog-content {
    max-width: 95vw;
    max-height: 90vh;
    margin: 20px;
  }

}
</style>