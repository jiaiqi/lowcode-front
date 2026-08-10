<!--
  进度环图组件 (ProgressRingChart.vue)
  
  配置参数说明 (chart_json):
  {
    // 进度值配置
    progress_value: 80,              // 进度值 (0-100)
    progress_value_col: "value",     // 进度值字段名（从数据中获取）
    
    // 中心文字配置
    progress_show_text: true,        // 是否显示中心文字
    progress_text: "80%",            // 中心文字内容（支持模板 ${value}%）
    progress_text_color: "#0580f2",  // 中心文字颜色
    progress_text_size: 48,          // 中心文字大小
    
    // 环形样式配置
    progress_radius_inner: "50%",    // 内半径
    progress_radius_outer: "66%",    // 外半径
    
    // 进度条颜色配置（渐变色）
    progress_color_start: "#00cefc", // 渐变起始颜色
    progress_color_end: "#367bec",   // 渐变结束颜色
    
    // 背景环颜色
    progress_bg_color: "rgba(176, 212, 251, 1)", // 背景环颜色
    
    // 图例配置
    progress_show_legend: false,     // 是否显示图例
  }
-->
<template>
  <div
    ref="domRef"
    class="echarts-item"
    :style="{ width, height }"
  ></div>
</template>

<script>
import { initChart } from "../use-functions/buildOption";

export default {
  name: "ProgressRingChart",
  props: {
    options: {
      type: Object,
    },
    width: {
      type: String,
      default: "100%",
    },
    height: {
      type: String,
      default: "100%",
    },
    chartType: {
      type: String,
    },
    cellData: {
      type: [Object, Array],
    },
  },
  data() {
    return {
      chartObj: null,
      objResizeObserver: null,
    };
  },
  watch: {
    options: {
      handler() {
        setTimeout(() => {
          this.drawOption();
        }, 200);
      },
      immediate: true,
    },
  },
  mounted() {
    if (!this.$refs.domRef) return;
    this.chartObj = initChart(this.$refs.domRef);

    this.objResizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry?.target === this.$refs.domRef) {
        this.chartObj?.resize();
      }
    });

    this.objResizeObserver.observe(this.$refs.domRef);

    this.$nextTick(() => {
      setTimeout(() => {
        this.chartObj && this.chartObj.resize();
      }, 500);
    });
  },
  beforeDestroy() {
    if (this.chartObj) {
      this.chartObj.dispose();
      this.chartObj = null;
    }
    this.$refs.domRef && this.objResizeObserver?.unobserve(this.$refs.domRef);
  },
  methods: {
    drawOption() {
      if (!this.chartObj) return;
      this.chartObj.showLoading({
        text: "加载中...",
        color: "#333",
        textColor: "#333",
        maskColor: "rgba(255, 255, 255, 0.1)",
        spinnerRadius: 20,
      });

      const options = this.buildProgressRingOption(this.options);

      setTimeout(() => {
        this.$nextTick(() => {
          this.chartObj.setOption(options);
          this.chartObj.hideLoading();
        });
      }, 500);
    },

    buildProgressRingOption(config) {
      const chartJson = config?.chartJson || {};
      const cellData = this.cellData || [];

      let progressValue = chartJson.progress_value || 0;
      if (chartJson.progress_value_col && cellData.length > 0) {
        const val = cellData[0][chartJson.progress_value_col];
        progressValue = typeof val === "number" ? val : parseFloat(val) || 0;
      }
      progressValue = Math.min(100, Math.max(0, progressValue));

      const remainingValue = 100 - progressValue;

      const showText = chartJson.progress_show_text !== false;
      const textColor = chartJson.progress_text_color || "#0580f2";
      const textSize = chartJson.progress_text_size || 48;
      const textTemplate = chartJson.progress_text || "${value}%";
      const centerText = textTemplate.replace("${value}", progressValue);

      const radiusInner = chartJson.progress_radius_inner || "50%";
      const radiusOuter = chartJson.progress_radius_outer || "66%";

      const colorStart = chartJson.progress_color_start || "#00cefc";
      const colorEnd = chartJson.progress_color_end || "#367bec";
      const bgColor = chartJson.progress_bg_color || "rgba(176, 212, 251, 1)";

      const showLegend = chartJson.progress_show_legend === true;

      const option = {
        title: {
          text: showText ? centerText : "",
          x: "center",
          y: "center",
          textStyle: {
            fontWeight: "normal",
            color: textColor,
            fontSize: textSize,
          },
        },
        color: [bgColor],
        legend: {
          show: showLegend,
          itemGap: 12,
          data: ["progress", "remaining"],
        },
        series: [
          {
            name: "progress",
            type: "pie",
            clockWise: true,
            radius: [radiusInner, radiusOuter],
            itemStyle: {
              normal: {
                label: {
                  show: false,
                },
                labelLine: {
                  show: false,
                },
              },
            },
            hoverAnimation: false,
            data: [
              {
                value: progressValue,
                name: "progress",
                itemStyle: {
                  normal: {
                    color: {
                      colorStops: [
                        {
                          offset: 0,
                          color: colorStart,
                        },
                        {
                          offset: 1,
                          color: colorEnd,
                        },
                      ],
                    },
                    label: {
                      show: false,
                    },
                    labelLine: {
                      show: false,
                    },
                  },
                },
              },
              {
                value: remainingValue,
                name: "remaining",
                itemStyle: {
                  normal: {
                    color: bgColor,
                    label: {
                      show: false,
                    },
                    labelLine: {
                      show: false,
                    },
                  },
                },
              },
            ],
          },
        ],
      };

      return option;
    },
  },
};
</script>

<style scoped>
.echarts-item {
  width: 100%;
  height: 100%;
}
</style>
