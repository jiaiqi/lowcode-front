<template>
  <div class="progress-ring-container" :style="containerStyle">
    <svg
      :viewBox="`0 0 ${viewBoxSize} ${viewBoxSize}`"
      class="progress-ring-svg"
    >
      <circle
        class="progress-ring-bg"
        :cx="viewBoxSize / 2"
        :cy="viewBoxSize / 2"
        :r="radius"
        :stroke-width="strokeWidth"
        :stroke="bgColor"
        fill="none"
      />
      <circle
        class="progress-ring-progress"
        :cx="viewBoxSize / 2"
        :cy="viewBoxSize / 2"
        :r="radius"
        :stroke-width="strokeWidth"
        :stroke="progressColor"
        fill="none"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="offset"
        stroke-linecap="round"
        transform="rotate(-90 50 50)"
      />
    </svg>
    <div
      class="progress-ring-text"
      v-if="showText"
      :style="{ color: textColor, fontSize: fontSize }"
    >
      <div class="progress-value-wrapper">
        <span class="progress-value">{{ displayValue }}</span>
        <span class="progress-unit" v-if="showUnit">{{ unit }}</span>
      </div>
      <span
        class="progress-label"
        v-if="label"
        :style="{ color: labelColor, fontSize: labelFontSize }"
        >{{ label }}</span
      >
    </div>
  </div>
</template>

<script>
export default {
  name: "ProgressRing",
  props: {
    value: {
      type: [Number, String],
      default: 0,
    },
    size: {
      type: String,
      default: "",
    },
    strokeWidth: {
      type: [Number, String],
      default: 20,
    },
    progressColor: {
      type: String,
      default: "#409eff",
    },
    bgColor: {
      type: String,
      default: "#e4e7ed",
    },
    textColor: {
      type: String,
      default: "#303133",
    },
    fontSize: {
      type: String,
      default: "16px",
    },
    showText: {
      type: Boolean,
      default: true,
    },
    showUnit: {
      type: Boolean,
      default: true,
    },
    unit: {
      type: String,
      default: "%",
    },
    maxValue: {
      type: Number,
      default: 100,
    },
    colorStops: {
      type: Array,
      default: () => [],
    },
    animation: {
      type: Boolean,
      default: true,
    },
    animationDuration: {
      type: Number,
      default: 1000,
    },
    label: {
      type: String,
      default: "",
    },
    labelColor: {
      type: String,
      default: "#909399",
    },
    labelFontSize: {
      type: String,
      default: "12px",
    },
  },
  data() {
    return {
      animatedValue: 0,
    };
  },
  computed: {
    actualSize() {
      if (this.size) {
        return this.size;
      }
      return "100%";
    },
    containerStyle() {
      const minSize = 50;
      const sizeValue = parseFloat(this.size);
      if (!this.size || (sizeValue && sizeValue < minSize)) {
        return {
          width: "100%",
          height: "100%",
          minWidth: `${minSize}px`,
          minHeight: `${minSize}px`,
        };
      }
      return {
        width: this.size,
        height: this.size,
      };
    },
    viewBoxSize() {
      return 100;
    },
    radius() {
      return (this.viewBoxSize - this.strokeWidth) / 2;
    },
    circumference() {
      return 2 * Math.PI * this.radius;
    },
    normalizedValue() {
      const val = parseFloat(this.value) || 0;
      return Math.min(this.maxValue, Math.max(0, val));
    },
    percentage() {
      return this.animatedValue / this.maxValue;
    },
    offset() {
      return this.circumference * (1 - this.percentage);
    },
    displayValue() {
      return Math.round(this.animatedValue);
    },
    computedProgressColor() {
      if (this.colorStops && this.colorStops.length > 0) {
        return `url(#gradient-${this._uid})`;
      }
      return this.progressColor;
    },
  },
  watch: {
    value: {
      immediate: false,
      handler(newVal) {
        if (this.animation) {
          this.animateValue(newVal);
        } else {
          this.animatedValue = parseFloat(newVal) || 0;
        }
      },
    },
  },
  mounted() {
    if (this.animation) {
      this.animateValue(this.value);
    } else {
      this.animatedValue = parseFloat(this.value) || 0;
    }
  },
  methods: {
    animateValue(target) {
      const start = this.animatedValue;
      const end = parseFloat(target) || 0;
      const duration = this.animationDuration;
      const startTime = performance.now();

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        this.animatedValue = start + (end - start) * easeProgress;

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    },
  },
};
</script>

<style scoped>
.progress-ring-container {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.progress-ring-svg {
  width: 100%;
  height: 100%;
}

.progress-ring-bg {
  transition: stroke 0.3s ease;
}

.progress-ring-progress {
  transition: stroke-dashoffset 0.5s ease, stroke 0.3s ease;
}

.progress-ring-text {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  top: 50%;
  transform: translateY(-50%);
  width: 100%;
  text-align: center;
}

.progress-value-wrapper {
  display: flex;
  align-items: baseline;
  justify-content: center;
}

.progress-value {
  font-weight: bold;
  line-height: 1;
  font-size: 1em;
}

.progress-unit {
  font-size: 0.6em;
  margin-left: 2px;
}

.progress-label {
  margin-top: 8px;
  line-height: 1.2;
  position: absolute;
  bottom: calc(-50% - .5em);
}
</style>
