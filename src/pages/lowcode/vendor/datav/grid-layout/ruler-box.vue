<template>
  <fragment v-if="disabled == true">
    <slot></slot>
  </fragment>
  <div
    class="wrapper"
    id="wrapper"
    ref="wrapper"
    :class="{ 'on-ctrl': isSpacePressed === true }"
    v-else
    :style="setCanvasLeft"
  >
    <SketchRule
      :lang="lang"
      :thick="thick"
      :scale="scale"
      :width="width"
      :height="height"
      :startX="startX"
      :startY="startY"
      :shadow="shadow"
      :horLineArr="lines.h"
      :verLineArr="lines.v"
      :cornerActive="true"
      @handleLine="handleLine"
      @onCornerClick="handleCornerClick"
    >
    </SketchRule>
    <div
      ref="screensRef"
      id="screens"
      @wheel="handleWheel"
      @scroll="handleScroll"
    >
      <div ref="containerRef" class="screen-container">
        <div id="canvas" class="canvas" :style="canvasStyle">
          <slot></slot>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import Vue from "vue";
import SketchRule from "vue-sketch-ruler";
import { useSpaceDrag } from "./ruler-box-hook";
export default Vue.extend({
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
    rectWidth: {
      type: Number,
      default: 1920,
    },
    rectHeight: {
      type: Number,
      default: 1080,
    },
    thick: {
      type: Number,
      default: 40,
    },
  },
  data() {
    return {
      cursor: "default",
      scale: 1,
      startX: 0,
      startY: 0,
      lines: {
        h: [],
        v: [],
      },
      width: this.rectWidth,
      height: this.rectHeight,
      lang: "zh-CN", // 中英文
      isShowRuler: true, // 显示标尺
      isShowReferLine: true, // 显示参考线
    };
  },
  components: {
    SketchRule,
  },
  computed: {
    setCanvasLeft() {
      return `;--margin-left:-${this.rectWidth / 2}px;`;
    },
    shadow() {
      return {
        x: 0,
        y: 0,
        width: this.rectWidth,
        height: this.rectHeight,
      };
    },
    canvasStyle() {
      return {
        width: this.rectWidth + "px",
        height: this.rectHeight + "px",
        transform: `scale(${this.scale})`,
      };
    },
  },
  methods: {
    handleLine(lines) {
      this.lines = lines;
    },
    handleCornerClick() {
      return;
    },
    handleScroll() {
      const screensRect = document
        .querySelector("#screens")
        .getBoundingClientRect();
      const canvasRect = document
        .querySelector("#canvas")
        .getBoundingClientRect();

      // 标尺开始的刻度
      const startX =
        (screensRect.left + this.thick - canvasRect.left) / this.scale;
      const startY =
        (screensRect.top + this.thick - canvasRect.top) / this.scale;
      this.startX = startX >> 0;
      this.startY = startY >> 0;
    },
    // 控制缩放值
    handleWheel(e) {
      const ZOOM_STEP = 0.2;
      const MIN_ZOOM = 0.4;
      const MAX_ZOOM = 3;
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -1 : 1;
        let nextScale = this.scale + delta * ZOOM_STEP;
        nextScale = parseFloat(
          Math.min(Math.max(nextScale, MIN_ZOOM), MAX_ZOOM).toFixed(2)
        );
        if (nextScale != this.scale) {
          this.scale = nextScale;
          this.$message(`缩放比例：${this.scale}`);
          this.$emit('scale-change',this.scale)
        }
        // const nextScale = parseFloat(
        //   Math.max(0.2, this.scale - e.deltaY / 500).toFixed(2)
        // );
        // this.scale = nextScale;
      }
      this.$nextTick(() => {
        this.handleScroll();
      });
    },
    initSize() {
      const wrapperRect = this.$refs.wrapper.getBoundingClientRect();
      const borderWidth = 1;
      this.width = wrapperRect.width - this.thick - borderWidth;
      this.height = wrapperRect.height - this.thick - borderWidth;
    },
    listenCtrlMouseDown() {
      // 监听ctrl+鼠标拖拽
      const scrollElement = document.querySelector("#screens");
      let curScrollElement = null;
      scrollElement.addEventListener("mousedown", function (e) {
        if (e.ctrlKey && e.button === 0) {
          e.preventDefault();
          curScrollElement = this;
        }
      });

      addEventListener("mousemove", function (e) {
        curScrollElement?.scrollBy(-e.movementX, -e.movementY);
      });

      addEventListener("mouseup", function (e) {
        curScrollElement = null;
      });
    },
  },
  setup() {
    const { cursorValue, isSpacePressed } = useSpaceDrag();
    return { cursorValue, isSpacePressed };
  },
  mounted() {
    if (this.rectWidth > 1000) {
      // this.scale = 0.6;
    }
    if (this.disabled) {
      return;
    }
    // 滚动居中
    this.$refs.screensRef.scrollLeft =
      this.$refs.containerRef.getBoundingClientRect().width / 2 -
      this.$refs.screensRef.getBoundingClientRect().width / 2; // 300 = #screens.width / 2
    this.$nextTick(() => {
      this.initSize();
      // this.listenCtrlMouseDown();
    });
  },
});
</script>
<style lang="scss">
body {
  margin: 0;
  padding: 0;
  font-family: sans-serif;
  overflow: hidden;
}

body * {
  box-sizing: border-box;
  user-select: none;
}

.wrapper {
  background-color: #f5f5f5;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 1px solid #dadadc;
}
.wrapper.on-ctrl {
  cursor: grab;
  .canvas {
    pointer-events: none;
  }
}

#screens {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: auto;
  cursor: var(--cursor);

  &::-webkit-scrollbar {
    width: 4px; /* 设置滚动条的宽度 */
    height: 4px; /* 设置滚动条的高度 */
  }
  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2); /* 设置滚动条滑块的颜色 */
    border-radius: 4px; /* 设置滚动条滑块的圆角 */
  }
}

.screen-container {
  position: absolute;
  width: 5000px;
  height: 3000px;
}

.scale-value {
  position: absolute;
  left: 0;
  bottom: 100%;
}

.button {
  position: absolute;
  left: 100px;
  bottom: 100%;
}

.button-ch {
  position: absolute;
  left: 200px;
  bottom: 100%;
}
.button-en {
  position: absolute;
  left: 230px;
  bottom: 100%;
}

#canvas {
  position: absolute;
  top: 40px;
  left: 50%;
  margin-left: -80px;
  margin-left: var(--margin-left);
  width: 160px;
  height: 200px;
  background: lightblue;
  transform-origin: 50% 0;
}
</style>
