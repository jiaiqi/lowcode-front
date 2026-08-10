<template>
  <div
    class="map-legend"
    :class="legendPositionClass"
  >
    <div class="legend-container">
      <div
        v-for="(legend, index) in legends"
        :key="index"
        class="legend-item"
        :class="{ 'legend-item-fold': legend.fold }"
        @click="handleLegendClick(index)"
      >
        <!-- 有图标时显示图标 -->
        <div
          v-if="legend.icon"
          class="legend-icon"
        >
          <img loading="lazy"
            :src="legend.icon"
            :alt="legend.name"
          />
        </div>
        <!-- 没有图标时显示颜色方块 -->
        <div
          v-else
          class="legend-symbol"
          :style="{ backgroundColor: legend.color }"
        ></div>

        <span class="legend-text">{{ legend.name }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { getImagePath } from '@/common/http';

export default {
  name: "MapLegend",
  data() {
    return {
      legends: []
    }
  },
  props: {
    sourceJson: {
      type: Array,
      default: () => []
    },
    position: {
      type: Object,
      default: () => ({
        positionDirection: 'top-right',//top top-right top-left bottom bottom-right bottom-left
        positionMode: 'absolute'
      })
    }
  },
  computed: {
    legendPositionClass() {
      const { positionDirection, positionMode } = this.position;
      return [
        `legend-${positionMode}`,
        `legend-${positionDirection}`
      ];
    }
  },
  watch: {
    sourceJson: {
      immediate: true,
      deep: true,
      handler(newValue, oldValue) {
        this.initLegends();
      }
    }
  },
  methods: {
    handleLegendClick(index) {
      this.legends.forEach((item, i) => {
        if (i === index) {
          item.fold = !item.fold;
        }
      })
      this.$emit('legend-fold-change', this.legends);
    },
    initLegends() {
      if (Array.isArray(this.sourceJson) && this.sourceJson.length) {
        const colors = [
          '#5470c6', // ECharts 默认蓝色
          '#91cc75', // ECharts 默认绿色
          '#fac858', // ECharts 默认黄色
          '#ee6666', // ECharts 默认红色
          '#73c0de', // ECharts 默认青色
          '#3ba272', // ECharts 默认深绿
          '#fc8452'  // ECharts 默认橙色
        ]
        this.legends = this.sourceJson.map((item, index) => {
          return {
            name: item.poi_name,
            icon: item.poi_type_icon ? getImagePath(item.poi_type_icon) : '',
            color: colors[index % colors.length],
            fold: false
          }
        })
      }
    }
  },
  created() {
    this.initLegends();
  },
}
</script>

<style lang="scss" scoped>
.map-legend {
  z-index: 1000;
  font-family: 'Microsoft YaHei', Arial, sans-serif;

  &.legend-absolute {
    position: absolute;
  }

  &.legend-relative {
    position: relative;
  }

  // 位置定位
  &.legend-top {
    top: 15px;
    left: 50%;
    transform: translateX(-50%);
  }

  &.legend-top-right {
    top: 20px;
    right: 60px;
  }

  &.legend-top-left {
    top: 15px;
    left: 15px;
  }

  &.legend-bottom {
    bottom: 15px;
    left: 50%;
    transform: translateX(-50%);
  }

  &.legend-bottom-right {
    bottom: 15px;
    right: 15px;
  }

  &.legend-bottom-left {
    bottom: 15px;
    left: 15px;
  }
}

.legend-container {
  border-radius: 4px;
  padding: 8px 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  min-width: 80px;
  max-width: 300px; // 限制最大宽度
  backdrop-filter: blur(2px);
  color: #fff;
  background-color: rgba(0, 0, 0, 0.2);
}

.legend-item {
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 0 0 calc(33.333% - 8px); // 每行最多3列，减去gap的影响
  min-width: 60px; // 最小宽度保证内容可读
  max-width: 120px; // 最大宽度避免过长

  &.legend-item-fold {
    opacity: 0.4;
  }

  &:hover {
    transform: scale(1.05);
  }

  &:active {
    opacity: 0.6;
    transform: scale(0.95);
  }
}

.legend-icon,
.legend-symbol {
  width: 24px;
  height: 24px;
  margin-right: 6px;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.legend-symbol {
  width: 16px;
  height: 16px;
  margin-right: 10px;
  margin-left: 6px;
  border-radius: 2px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.legend-text {
  font-size: 16px;
  line-height: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  user-select: none;
}

// 水平布局（当图例项较少时）
@media (min-width: 768px) {
  .legend-container {
    // 保持flex-wrap: wrap，确保超过3列时换行
    flex-direction: column;
    flex-wrap: wrap;
    gap: 8px 16px;
  }

  .legend-item {
    min-width: 60px;
    max-width: 130px;
  }

  // 顶部和底部位置时使用水平布局
  .legend-top .legend-container,
  .legend-bottom .legend-container {
    flex-direction: row;
    flex-wrap: wrap;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .map-legend {

    &.legend-top-right,
    &.legend-bottom-right {
      right: 10px;
    }

    &.legend-top-left,
    &.legend-bottom-left {
      left: 10px;
    }

    &.legend-top,
    &.legend-bottom {
      left: 10px;
      right: 10px;
      transform: none;
    }
  }

  .legend-container {
    max-width: none;
    padding: 6px 8px;
    gap: 4px 8px;
  }

  .legend-item {
    flex: 0 0 calc(50% - 4px); // 移动端每行2列
    min-width: 70px;
    max-width: none;
  }

  .legend-text {
    font-size: 11px;
  }
}

// 暗色主题
@media (prefers-color-scheme: dark) {
  .legend-container {
    background: rgba(40, 40, 40, 0.95);
    border-color: #555;
  }

  .legend-text {
    color: #e0e0e0;
  }

  .legend-symbol {
    border-color: rgba(255, 255, 255, 0.2);
  }
}
</style>