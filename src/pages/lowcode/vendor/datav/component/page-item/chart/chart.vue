<script setup>
import { initChart, startPieAutoPlay } from "../use-functions/buildOption";
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";
const props = defineProps({
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
  customStyle: {
    type: Object,
    default: () => ({}),
  },
});
const domRef = ref(null);

let chartObj = ref(null);
let objResizeObserver;
let autoPlayTimer = null;

// 当前图表的 px 内边距布局配置（mode 为 'pixel' 时有效，由 buildOption.js 挂载到 options.__pieGrid）
let currentPieGrid = null;

/**
 * 根据容器实际尺寸应用饼图/环图的 px 内边距布局
 * 说明：饼图/环图没有 xAxis/yAxis，echarts 的 grid 配置对其不生效，
 * 只能通过 series 的 center（圆心）与 radius（半径）将图表限定在
 * grid_top / grid_left / grid_right / grid_bottom 围成的可用区域内。
 * 由于 px 单位需要知道容器宽高才能换算，故在图表渲染及容器尺寸变化时，
 * 依据 dom 元素的实际宽高计算并覆写 center/radius。
 * @param {object} options echarts 配置对象（会被就地修改 series[0] 的 center/radius）
 * @param {number} containerWidth 容器当前宽度（px）
 * @param {number} containerHeight 容器当前高度（px）
 */
const applyPieGrid = (options, containerWidth, containerHeight) => {
  const pieGrid = currentPieGrid;
  // 非 px 模式（纯百分比可直接静态计算）或容器尺寸不可用时无需处理
  if (!pieGrid || pieGrid.mode !== 'pixel' || !containerWidth || !containerHeight) return;
  const { top, left, right, bottom } = pieGrid.values;

  // 统一将内边距换算为像素：% 按容器对应边长折算，px 直接使用
  const toPx = (v, size) => v.unit === '%' ? size * v.value / 100 : v.value;
  const leftPx = toPx(left, containerWidth);
  const rightPx = toPx(right, containerWidth);
  const topPx = toPx(top, containerHeight);
  const bottomPx = toPx(bottom, containerHeight);

  // 可用区域（去除四周内边距后剩余的宽高）
  const availW = Math.max(containerWidth - leftPx - rightPx, 0);
  const availH = Math.max(containerHeight - topPx - bottomPx, 0);
  // 圆心取可用区域的中心
  const centerX = leftPx + availW / 2;
  const centerY = topPx + availH / 2;
  // 最大半径 = 可用区域短边的一半，保证饼图完整落入可用区域内
  const maxRadius = Math.min(availW, availH) / 2;

  if (!options.series?.[0]) return;
  // 浅拷贝 series，避免直接修改 props 传入的原配置对象
  const series = { ...options.series[0] };
  series.center = [centerX, centerY];

  if (Array.isArray(series.radius)) {
    // 环图：radius 为 [内半径, 外半径]，此处保留 buildOption 计算出的环宽（内外半径差值），
    // 仅把外半径替换为可用区域半径，使环图宽度不变且整体落在可用区域内。
    // 原半径若为百分比，其基准为 min(容器宽, 容器高) / 2，故换算成像素时需要乘以该基准。
    const halfMin = Math.min(containerWidth, containerHeight) / 2;
    const parseRadius = (v, base) => {
      if (typeof v === 'number') return v;
      const s = String(v);
      if (s.endsWith('%')) return parseFloat(s) / 100 * base;
      return parseFloat(s);
    };
    const outerPx = parseRadius(series.radius[1], halfMin);
    const innerPx = parseRadius(series.radius[0], halfMin);
    // 无法解析时默认环宽 5px
    const ringWidthPx = Number.isFinite(outerPx) && Number.isFinite(innerPx) ? outerPx - innerPx : 5;
    series.radius = [Math.max(maxRadius - ringWidthPx, 0), maxRadius];
  } else {
    // 饼图：半径直接取可用区域的最大半径
    series.radius = maxRadius;
  }

  // 替换 series 数组中的第一项，保证 setOption 生效且不污染原始配置
  options.series = [...options.series];
  options.series[0] = series;
};

const applyCanvasStyle = () => {
  const canvasEl = domRef.value?.querySelector('canvas');
  if (!canvasEl) return;
  const styleObj = props.customStyle || {};
  Object.keys(styleObj).forEach((key) => {
    canvasEl.style[key] = styleObj[key];
  });
};
defineExpose({
  chartObj,
});

const emit = defineEmits(['click-chart']);
onMounted(() => {
  if (!domRef.value) return;

  // 初始化
  chartObj.value = initChart(domRef.value);

  chartObj.value.on('click', function (params) {
    console.log('点击图表-params:', params);
    // console.log('echart点击事件-点击的图表类型:',params.componentType);
    // console.log('echart点击事件-点击的图表子类型:',params.componentSubType);
    // console.log('echart点击事件-点击的图表-名称:', params.name);
    // console.log('echart点击事件-点击的图表-数据:',params.data);

    if (params.componentType === 'series') {
      let emitObj = {
        name: params.name,
        value: params.data.value,
        dataIndex: params.dataIndex,
        type: params.componentType,
        event: params.event.event,
      }
      // console.log('echart点击事件-点击的图表-数据-系列索引:',params.seriesIndex);
      // console.log('echart点击事件-点击的图表-数据-系列名称:',params.seriesName);
      if (params.seriesType === 'scatter') {
        // console.log('echart点击事件-点击的图表-数据-系列-散点索引:', params.dataIndex);
        // console.log('echart点击事件-点击的图表-数据-系列-散点-数据:', params.data.value[2]);
        emitObj.value = params.data.value[2];
      } else if (params.seriesType === 'map') {
        // console.log('echart点击事件-点击的图表-数据-系列-地图-索引:', params.dataIndex);
        // console.log('echart点击事件-点击的图表-数据-系列-地图-数据:', params.data.value);
        emitObj.value = params.data.value;
        return
      }
      emit('click-chart', emitObj);
    }
  });

  objResizeObserver = new ResizeObserver(function (entries) {
    const entry = entries[0];
    if (entry?.target === domRef.value) {
      if (currentPieGrid?.mode === 'pixel') {
        // px 内边距布局需随容器尺寸变化重新计算
        const currentOption = chartObj.value?.getOption();
        if (currentOption?.series?.length) {
          applyPieGrid(currentOption, entry.contentRect.width, entry.contentRect.height);
          chartObj.value?.setOption(currentOption);
        }
      } else {
        chartObj.value?.resize();
      }
    }
  });

  // 观察元素尺寸变化
  objResizeObserver.observe(domRef.value);

  nextTick(() => {
    setTimeout(() => {
      chartObj.value && chartObj.value.resize();
    }, 500);
  });
});

onUnmounted(() => {
  if (chartObj.value) {
    chartObj.value.dispose();
    chartObj.value = null;
  }
  // 清除自动轮播定时器
  if (autoPlayTimer) {
    autoPlayTimer();
    autoPlayTimer = null;
  }
  // 取消监听
  domRef.value && objResizeObserver.unobserve(domRef.value);
});

// 监听配置变化
watch(
  () => props.options,
  () =>
    setTimeout(() => {
      drawOption();
    }, 200),
  {
    immediate: true,
  }
);

watch(
  () => props.customStyle,
  () => {
    setTimeout(() => {
      applyCanvasStyle();
    }, 0);
  },
  {
    deep: true,
  }
);

//加载图表配置
const drawOption = () => {
  console.log(props.chartType);
  if (!chartObj.value) return;
  chartObj.value.showLoading({
    text: "加载中...",
    color: "#333",
    textColor: "#333",
    maskColor: "rgba(255, 255, 255, 0.1)",
    spinnerRadius: 20,
  });
  const options = {
    ...props.options,
  };
  currentPieGrid = options.__pieGrid || null;
  if (props.colors?.length) {
    options.color = props.colors;
  }
  // 将饼图和环图的起始角度从默认的90度（12点钟方向）改为270度（6点钟方向）
  if ((props.chartType === 'pie' || props.chartType === 'ring') && !options.series[0]?.startAngle) {
    options.series = options.series.map(series => ({
      ...series,
      startAngle: 270
    }));
  }
  setTimeout(() => {
    nextTick(() => {
      applyPieGrid(options, domRef.value?.clientWidth, domRef.value?.clientHeight);
      chartObj.value.setOption(options);
      chartObj.value.hideLoading();
      applyCanvasStyle();

      // 如果是饼图或环图且配置了自动轮播，启动轮播
      if ((props.chartType === 'pie' || props.chartType === 'ring') && options._autoPlay) {
        // 清除之前的轮播定时器
        if (autoPlayTimer) {
          autoPlayTimer();
          autoPlayTimer = null;
        }
        // 启动新的轮播
        autoPlayTimer = startPieAutoPlay(chartObj.value, options);
      }
    });
  }, 1000);
};
</script>

<template>
  <!-- 为 ECharts 准备一个定义了宽高的 DOM -->
  <div
    ref="domRef"
    class="echarts-item"
    :style="{ width, height }"
  ></div>
</template>