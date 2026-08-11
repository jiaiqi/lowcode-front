<script setup>
import * as echarts from "echarts";
import { computed, onMounted, onUnmounted, ref } from "vue";
const props = defineProps({
  pageItem: {
    type: Object,
  },
  chartOption: {
    type: Object,
  },
  index: {
    type: [Number, String],
  },
});

let myChart = null;
let resizeTimer = null;
// ref 绑定 DOM，避免多实例下使用 document.getElementById(props.index) 的 id 冲突
const domRef = ref(null);

// 无图表配置（或 series 为空）时显示空状态，避免渲染默认示例数据
const isEmptyChart = computed(() => {
  const opt = props.chartOption;
  if (!opt || typeof opt !== "object") return true;
  if (Object.keys(opt).length === 0) return true;
  if (Array.isArray(opt.series) && opt.series.length === 0) return true;
  return false;
});

const setChartOption = (chartOption, chart) => {
  // 指定图表的配置项和数据
  const option = {
    title: {
      text: "ECharts 入门示例",
    },
    tooltip: {},
    legend: {
      data: ["销量"],
    },
    xAxis: {
      data: ["衬衫", "羊毛衫", "雪纺衫", "裤子", "高跟鞋", "袜子"],
    },
    yAxis: {},
    series: [
      {
        name: "销量",
        type: "bar",
        data: [5, 20, 36, 10, 10, 20],
      },
    ],
    ...chartOption,
  };
  // 使用刚指定的配置项和数据显示图表。
  chart.setOption(option);
};

onMounted(() => {
  // 基于 ref 绑定的 dom，初始化echarts实例
  if (!domRef.value) return;
  myChart = echarts.init(domRef.value);
  setChartOption(props.chartOption, myChart);
  resizeTimer = setTimeout(() => {
    myChart.resize();
  }, 500);
});

onUnmounted(() => {
  // 销毁时清理定时器并释放 echarts 实例，避免内存泄漏
  if (resizeTimer) {
    clearTimeout(resizeTimer);
    resizeTimer = null;
  }
  if (myChart) {
    myChart.dispose();
    myChart = null;
  }
});

const onResize = () => {
  myChart && myChart.resize();
};

defineExpose({
  onResize,
});
</script>

<template>
  <!-- 无数据时显示空状态 -->
  <div v-if="isEmptyChart" class="empty-wrap">
    <el-empty description="暂无数据"></el-empty>
  </div>
  <!-- 为 ECharts 准备一个定义了宽高的 DOM -->
  <div v-else ref="domRef" style="width: 100%; height: 100%"></div>
</template>

<style lang="scss" scoped>
.empty-wrap {
  padding: 20px 0;
}
</style>
