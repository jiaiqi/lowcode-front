<template>
  <div class="sankey-container" :style="{ width, height }">
    <!-- 桑基图容器 -->
    <div
      ref="domRef"
      v-loading="loading"
      element-loading-background="rgba(0, 0, 0, 0.1)"
      class="sankey-chart"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue';
import * as echarts from "echarts";

const props = defineProps({
  pageItem: {
    type: Object,
    required: true
  },
  cellData: {
    type: Array,
    default: () => []
  },
  width: {
    type: String,
    default: '100%'
  },
  height: {
    type: String,
    default: '100%'
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['click-chart']);

const domRef = ref(null);
let chartObj = null;
let objResizeObserver = null;
// 各类定时器句柄：组件销毁时统一取消，避免销毁后仍执行 setOption / resize / drawChart
let drawTimer = null; // watch 触发 drawChart 的防抖定时器
let setOptionTimer = null; // drawChart 内延迟 setOption 的定时器
let resizeTimer = null; // 初始化后延迟 resize 的定时器



// 全局颜色配置
const __colors = [
  "#007AFF",
  "#FF6263",
  "#FDB05D",
  "#66E1DF",
  "#34C758",
  "#FFCB01",
  "#FF9502",
  "#FF3A30",
  "#A8071A",
  "#EB2F96",
  "#AF52DE",
  "#5756D7",
  "#D0DEEE",
  "#82B6F7",
];

/**
 * 构建桑基图配置选项
 * @description 根据传入的数据生成ECharts桑基图的配置对象，支持多层级节点和连接关系的可视化
 * 
 * @param {Array} data - 原始数据数组，每个元素包含节点信息和层级关系
 * @param {Object} keyMap - 字段映射配置，用于指定数据中各字段的键名
 * @param {Object} options - 可选配置项
 * 
 * @returns {Object} ECharts桑基图配置对象
 */
const buildSankeyOption = (
  data,
  keyMap,
  options = {}
) => {

  const defaultKeyMap = {
    col_no: "area_no", // 节点唯一标识字段名
    col_parent_no: "parent_no", // 父节点标识字段名
    col_name: "name", // 节点显示名称字段名
    col_date_select: "rec_time", // 日期字段
    col_val: "day_use_quantity", // 节点数值字段名
    col_level: "level", // 节点层级字段名
  }

  if (!keyMap) {
    keyMap = defaultKeyMap
  }

  // 参数验证：检查数据是否为有效的非空数组
  if (!Array.isArray(data) || data.length === 0) {
    console.warn('buildSankeyOption: 数据为空或格式不正确');
    return { series: [{ type: 'sankey', data: [], links: [] }] };
  }

  // 默认配置：定义桑基图的基础样式和行为配置
  const defaultOptions = {
    colors: __colors,           // 使用全局颜色配置
    minValue: 0,               // 最小值过滤，小于此值的连接将被忽略
    showTitle: false,          // 是否显示图表标题
    showTooltip: true,         // 是否显示鼠标悬停提示框
    animationDuration: 1000,   // 动画持续时间（毫秒）
    curveness: 0.2,           // 连线弯曲度，0为直线，1为最弯曲
    labelFontSize: 12,         // 节点标签字体大小
    nodeGap: keyMap?.node_gap || 8,               // 节点间距
  };

  // 合并用户配置和默认配置
  const config = { ...defaultOptions, ...options };

  // 初始化数据结构
  const nodeMap = new Map();  // 用于快速查找节点的映射表
  const nodes = [];           // 桑基图节点数组
  const links = [];           // 桑基图连接关系数组

  // 第一遍遍历：创建所有唯一节点
  data.forEach(item => {
    const nodeId = item[keyMap.col_no];        // 获取节点ID
    const nodeName = item[keyMap.col_name];    // 获取节点显示名称
    const nodeValue = Number(item[keyMap.col_val]) || 0;  // 获取节点数值，确保为数字类型

    // 检查节点是否已存在，且ID和名称都有效
    if (!nodeMap.has(nodeId) && nodeId && nodeName) {
      const node = {
        id: nodeId,                                    // 节点唯一标识
        name: nodeName,                               // 节点显示名称
        value: nodeValue,                             // 节点数值（用于计算节点大小）
      };
      if (item[keyMap.col_level]) {
        node.depth = item[keyMap.col_level] - 1
      }
      nodeMap.set(nodeId, node);  // 添加到映射表中便于后续查找
      nodes.push(node);           // 添加到节点数组中
    }
  });

  // 第二遍遍历：创建节点间的连接关系
  data.forEach(item => {
    const parentId = item[keyMap.col_parent_no];     // 获取父节点ID
    const currentId = item[keyMap.col_no];     // 获取当前节点ID
    const value = Number(item[keyMap.col_val]) || 0;  // 获取连接的数值权重

    // 只有当父节点存在、当前节点存在且数值大于最小阈值时才创建连接
    if (parentId && currentId && value > config.minValue) {
      const parentNode = nodeMap.get(parentId);   // 从映射表中获取父节点
      const currentNode = nodeMap.get(currentId); // 从映射表中获取当前节点

      // 确保两个节点都存在才创建连接
      if (parentNode && currentNode) {
        links.push({
          source: parentNode.id,              // 连接起始节点ID
          target: currentNode.id,             // 连接目标节点ID
          sourceName: parentNode.name,        // 起始节点名称（用于tooltip）
          targetName: currentNode.name,       // 目标节点名称（用于tooltip）
          subName: item[keyMap.col_date_select],   // 附加信息（如时间等）
          value: value,                        // 连接的数值权重（决定连线粗细）
          label: {
            fontSize: item[keyMap.col_level] ? config.labelFontSize - item[keyMap.col_level] : config.labelFontSize
          }
        });
      }
    }
  });

  // 动态生成层级颜色配置
  const levels = [];
  const maxLevel = Math.max(...nodes.map(n => n.depth || 5));  // 找出最大层级数

  // 为每个层级创建样式配置
  for (let i = 0; i <= maxLevel; i++) {
    levels.push({
      depth: i,                                           // 层级深度
      itemStyle: {
        color: config.colors[i % config.colors.length]   // 循环使用颜色数组中的颜色
      },
      lineStyle: {
        color: 'source',                                  // 连线颜色跟随起始节点
        opacity: 0.2                                     // 连线透明度
      }
    });
  }

  // 构建桑基图的核心配置对象
  const option = {
    series: [{
      left:"0",
      top:"0",
      type: 'sankey',                    // 图表类型：桑基图
      data: nodes,                       // 节点数据数组
      links: links,                      // 连接关系数组
      emphasis: {
        focus: 'adjacency'               // 鼠标悬停时高亮相邻的节点和连线
      },
      draggable: true,                   // 允许拖拽节点调整位置
      focusNodeAdjacency: 'allEdges',    // 鼠标划上时高亮的节点和连线
      layoutIterations: 0,               // 布局迭代次数
      levels: levels,                    // 层级样式配置数组
      lineStyle: {
        color: 'gradient',               // 连线颜色使用渐变效果
        curveness: config.curveness      // 连线弯曲度
      },
      itemStyle: {
        borderWidth: 0,                  // 节点边框宽度
        borderColor: '#aaa'              // 节点边框颜色
      },
      label: {
        show: true,                      // 显示节点标签
        position: 'right',               // 标签位置在节点右侧
        formatter: '{b}',                // 标签格式，{b}表示显示节点名称
        fontSize: config.labelFontSize   // 标签字体大小
      },
      animationDuration: config.animationDuration,  // 动画持续时间
      animationEasing: 'cubicInOut',               // 动画缓动函数
      nodeGap: config.nodeGap,                     // 节点间距
    }]
  };

  // 可选的标题配置
  if (config.showTitle && config.title) {
    option.title = {
      text: config.title,              // 标题文本
      left: 'center',                  // 标题水平居中
      textStyle: {
        color: '#333',                 // 标题文字颜色
        fontSize: 16                   // 标题字体大小
      }
    };
  }

  // 可选的提示框配置
  if (config.showTooltip) {
    option.tooltip = {
      trigger: 'item',                 // 触发类型：数据项图形触发
      triggerOn: 'mousemove',          // 触发条件：鼠标移动时触发
      formatter: function (params) {
        // 根据数据类型（节点或连线）显示不同的提示内容
        if (params.dataType === 'node') {
          // 节点提示：显示节点名称和数值
          return `${params.data.name}<br/>用量: ${params.data.value}`;
        } else if (params.dataType === 'edge') {
          // 连线提示：显示起始节点到目标节点的流向信息
          let tip = `${params.data.sourceName || params.data.source} → ${params.data.targetName || params.data.target}`
          // 如果有附加信息（如时间），则显示
          // if (params.data.subName) {
          //   tip += `<br/>时间: ${params.data.subName}`
          // }
          tip += `<br/>用量: ${params.data.value}`

          return tip;
        }
      }
    };
  }

  return option;
};

// 初始化图表
const initChart = () => {
  if (!domRef.value) return;
  chartObj = echarts.init(domRef.value);

  // 添加点击事件
  chartObj.on('click', (params) => {
    emit('click-chart', params);
  });

  // 监听尺寸变化
  objResizeObserver = new ResizeObserver(function (entries) {
    const entry = entries[0];
    if (entry?.target === domRef.value) {
      chartObj?.resize();
    }
  });

  objResizeObserver.observe(domRef.value);

  resizeTimer = setTimeout(() => {
    chartObj && chartObj.resize();
  }, 1000);
};



// 绘制图表
const drawChart = () => {
  const dataToUse = props.cellData;
  
  if (!chartObj || !dataToUse.length) {
    if (chartObj) {
      chartObj.clear();
    }
    return;
  }

  chartObj.showLoading({
    text: '加载中...',
    color: '#333',
    textColor: '#333',
    maskColor: 'rgba(255, 255, 255, 0.3)',
    spinnerRadius: 20,
  });

  const chartJson = props.pageItem?.chart_json;
  const option = buildSankeyOption(dataToUse, chartJson?.config_sankey);

  setOptionTimer = setTimeout(() => {
    nextTick(() => {
      chartObj.setOption(option);
      chartObj.hideLoading();
    });
  }, 500);
};

// 监听数据变化
watch(
  () => [props.cellData, props.pageItem],
  () => {
    // 深监听 + 防抖 100ms：数据/配置变化后延迟绘制
    if (drawTimer) {
      clearTimeout(drawTimer);
    }
    drawTimer = setTimeout(() => {
      drawChart();
    }, 100);
  },
  { immediate: true, deep: true }
);

// 组件挂载
onMounted(() => {
  initChart();
});

// 组件卸载
onUnmounted(() => {
  // 取消所有挂起的定时器（watch 防抖 / setOption 延迟 / resize 延迟），
  // 避免组件销毁后定时器回调仍执行 setOption / resize / drawChart
  if (drawTimer) {
    clearTimeout(drawTimer);
    drawTimer = null;
  }
  if (setOptionTimer) {
    clearTimeout(setOptionTimer);
    setOptionTimer = null;
  }
  if (resizeTimer) {
    clearTimeout(resizeTimer);
    resizeTimer = null;
  }
  if (chartObj) {
    chartObj.dispose();
    chartObj = null;
  }
  if (objResizeObserver && domRef.value) {
    objResizeObserver.unobserve(domRef.value);
  }
});

// 暴露方法
const onResize = () => {
  chartObj?.resize();
};

defineExpose({
  onResize
});
</script>

<style lang="scss" scoped>
.sankey-container {
  width: 100%;
  height: 100%;
}

.sankey-chart {
  width: 100%;
  height: 100%;
}

::v-deep .el-loading-mask {
  background-color: rgba($color: #000000, $alpha: 0.1);
}

::v-deep .el-radio-button__inner {
  padding: 8px 12px;
  font-size: 12px;
}

::v-deep .el-button--small {
  padding: 6px 12px;
  font-size: 12px;
}
</style>