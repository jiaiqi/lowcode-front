<template>
  <div class="liquid-chart-container">
    <div ref="chart" class="chart"></div>
  </div>
</template>

<script>
import * as echarts from "echarts";
import "echarts-liquidfill";
import { convertColorWithOpacity } from "@/common/common.js";
export default {
  props: {
    value: {
      type: Number | String,
      default: 0.5,
    },
    title: {
      type: String,
      default: "",
    },
    amount: {
      type: String,
      default: "",
    },
    color: {
      type: String,
      default: "",
    },
    waveColor: {
      type: String,
      default: "#1890FF",
    },
    waveOutlineColor: {
      type: String,
      default: "#1890FF",
    },
    waveBgColor: {
      type: String,
      default: "",
    },
    waveFontSize: {
      type: String,
      default: "16",
    },
  },
  data() {
    return {
      chart: null,
    };
  },
  mounted() {
    setTimeout(() => {
      this.initChart();
    }, 200);
  },
  methods: {
    initChart() {
      this.chart = echarts.init(this.$refs.chart);
      const option = {
        series: [
          {
            type: "liquidFill",
            radius: "80%",
            center: ["50%", "50%"],
            data: [this.value, this.value - 0.1, this.value - 0.2],
            backgroundStyle: {
              color: this.waveBgColor || "transparent",
            },
            outline: {
              show: true,
              borderDistance: 0,
              itemStyle: {
                borderWidth: 2,
                borderColor: {
                  type: "linear",
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    {
                      offset: 0,
                      color: convertColorWithOpacity(
                        `${
                          this.waveOutlineColor || this.waveColor || this.color
                        }`,
                        0.3
                      ), // 30% opacity
                    },
                    {
                      offset: 1,
                      color: convertColorWithOpacity(
                        `${
                          this.waveOutlineColor || this.waveColor || this.color
                        }`,
                        0.6
                      ), // 60% opacity
                    },
                  ],
                },
              },
            },
            color: [
              {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops:
                  this.waveColor && this.waveColor.includes(",")
                    ? this.waveColor.split(",").map((item, index) => {
                        return {
                          offset:
                            index / (this.waveColor.split(",").length - 1),
                          color: item,
                        };
                      })
                    : [
                        {
                          offset: 0,
                          color: convertColorWithOpacity(this.waveColor, 1), // 100% opacity
                        },
                        {
                          offset: 1,
                          color: convertColorWithOpacity(this.waveColor, 0.6), // 60% opacity
                        },
                      ],
              },
            ],
            label: {
              normal: {
                formatter: Number((this.value * 100).toFixed(2)) + "%",
                textStyle: {
                  fontSize: Number(this.waveFontSize) || 16,
                  // color: this.color || undefined,
                },
              },
              // rich: {
              //   // title: {
              //   //   fontSize: 14,
              //   //   color: "#666",
              //   //   align: "left",
              //   //   lineHeight: 20,
              //   // },
              //   value: {
              //     fontSize: 24,
              //     color: this.color,
              //     fontWeight: "bold",
              //     align: "center",
              //     lineHeight: 30,
              //   },
              //   // amount: {
              //   //   fontSize: 12,
              //   //   color: "#999",
              //   //   align: "center",
              //   //   lineHeight: 18,
              //   // },
              // },
              position: ["50%", "50%"],
            },
            amplitude: 6,
            waveAnimation: true,
            animationDuration: 2000,
            animationEasing: "linear",
            animationDurationUpdate: 2000,
          },
        ],
      };
      console.log("liquidFillChartOption:", option);

      this.chart.setOption(option);
    },
  },
  watch: {
    value() {
      setTimeout(() => {
        this.$nextTick(() => {
          this.initChart();
        });
      }, 200);
    },
  },
  beforeDestroy() {
    if (this.chart) {
      this.chart.dispose();
    }
  },
};
</script>

<style scoped lang="scss">
.liquid-chart-container {
  width: 100%;
  height: 100%;
  position: relative;
  .chart {
    width: 100%;
    height: 100%;
    min-width: 50px;
    min-height: 50px;
  }
}
</style>
