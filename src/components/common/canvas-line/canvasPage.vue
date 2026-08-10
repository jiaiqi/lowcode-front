<template>
    <canvas id="line_free" class="lines" :style="actualCanvasStyle"></canvas>
</template>

<script setup>
import { onMounted, ref, watch, onUnmounted, computed } from 'vue'
import { drawFlightLines } from "./drawLines.js";
// 组件使用前请仔细阅读，查看参数配置
// 航线参数接受说明
// options= {
//    lineColor = '#00ffff', // 基础线条颜色
//    lineWidth = 2,
//    animationDuration = 1000, //运动动画时间
      // 新增颜色配置
//    glowColor = 'rgba(0, 255, 255, 0.5)', // 发光效果颜色
//    flowColor = 'rgba(255, 255, 255, 0.8)', // 流动光效颜色
//    pointColor = '#00ffff', // 点位基础颜色
//    pointGlowColor = 'rgba(0, 255, 255, 0.8)', // 点位光晕颜色
//    rippleColor = 'rgba(0, 255, 255, 0.2)', // 水波纹颜色
//    centerPointColor = '#ffffff' // 中心点颜色
//   }

//canvas必要参数说明 相对容器在视图中的坐标(百分比)
//start 起点 {x:20,y:50}
//endPoints 终点多个[{x:20,y:40},{x:30,y:54}]
const props = defineProps({
  info:{
    type: Object,
    default: () => ({})
  },
  // 画布ID
  canvasId: {
    type: String,
    default: 'line_free'
  },
  // 起点坐标
  start: {
    type: Object,
    default: () => ({x: 20, y: 50})
  },
  // 终点坐标数组
  endPoints: {
    type: Array,
    default: () => [{x: 20, y: 40}, {x: 30, y: 54}]
  },
  // 画布样式
  canvasStyle: {
    type: Object,
    default: () => ({
      width: '100%',
      height: '100%',
      position: 'absolute',
      zIndex: -1,
      left: '0',
      top: '0'
    })
  }
})

// 验证必要参数是否存在
const validateParams = () => {
  if (!actualStart.value || typeof actualStart.value.x !== 'number' || typeof actualStart.value.y !== 'number') {
    console.warn('缺少有效的起点坐标')
    return false
  }

  if (!Array.isArray(actualEndPoints.value) || actualEndPoints.value.length === 0) {
    console.warn('缺少有效的终点坐标数组')
    return false
  }

  if (!actualEndPoints.value.every(point =>
      point && typeof point.x === 'number' && typeof point.y === 'number'
  )) {
    console.warn('终点坐标数组包含无效的坐标点')
    return false
  }

  return true
}

// 绘制函数
const drawLines = () => {
  if (!validateParams()) {
    return
  }

  const canvas = document.getElementById('line_free')
  if (!canvas) {
    console.warn('找不到画布元素')
    return
  }

  try {
    // 获取基于屏幕尺寸的转换坐标
    const { start: convertedStart, endPoints: convertedEndPoints } = handleTransform()

    if (!convertedStart || convertedEndPoints.length === 0) {
      console.warn('坐标转换失败')
      return
    }

    drawFlightLines('line_free', convertedStart, convertedEndPoints, actualOptions.value)
  } catch (error) {
    console.error('绘制过程中发生错误:', error)
  }
}

// 添加屏幕尺寸变化的监听
let resizeObserver = null
let resizeTimeout = null

// 防抖函数
const debounce = (func, delay) => {
  return function (...args) {
    clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(() => func.apply(this, args), delay)
  }
}

// 监听屏幕尺寸变化
const handleResize = debounce(() => {
  console.log('屏幕尺寸发生变化，重新绘制...')
  drawLines()
}, 100) // 100ms 防抖延迟



// 转换起点坐标（从百分比转为固定坐标）
const convertPercentageToFixed = (point,domWidth,domHeight) => {
  if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
    return null
  }

  // 输入的坐标是百分比值（0-100），基于canvas尺寸进行转换
  const fixedX = (point.x / 100) * domWidth
  const fixedY = (point.y / 100) * domHeight

  return { x: fixedX, y: fixedY }
}

const handleTransform=()=>{
  const canvas = document.getElementById('line_free')
  if (!canvas) {
    console.warn('找不到画布元素')
    return { start: null, endPoints: [] }
  }

  // 获取canvas的实际尺寸
  const canvasWidth = canvas.offsetWidth || canvas.clientWidth
  const canvasHeight = canvas.offsetHeight || canvas.clientHeight

  console.log('Canvas尺寸:', canvasWidth, 'x', canvasHeight)

  // 转换起点
  const convertedStart = convertPercentageToFixed(actualStart.value, canvasWidth, canvasHeight)

  // 转换终点数组
  const convertedEndPoints = actualEndPoints.value.map(point => convertPercentageToFixed(point, canvasWidth, canvasHeight)).filter(point => point !== null)

  console.log('转换后的起点坐标:', convertedStart)
  console.log('转换后的终点坐标:', convertedEndPoints)

  return {
    start: convertedStart,
    endPoints: convertedEndPoints
  }
}

// 计算属性：从info中提取实际使用的数据
const actualStart = computed(() => {
  return props.info?.start || props.start || {x: 20, y: 50}
})

const actualEndPoints = computed(() => {
  return props.info?.end_points || props.endPoints || [{x: 20, y: 40}, {x: 30, y: 54}]
})

const actualOptions = computed(() => {
  // 从info中提取使用下划线命名的字段
  return {
    lineColor: props.info?.line_color || '#00ffff',
    lineWidth: props.info?.line_width || 1,
    animationDuration: props.info?.animation_duration || 2000,
    glowColor: props.info?.glow_color || 'rgba(0, 255, 255, 0.5)',
    flowColor: props.info?.flow_color || 'rgba(255, 255, 255, 0.8)',
    pointColor: props.info?.point_color || '#00ffff',
    pointGlowColor: props.info?.point_glow_color || 'rgba(0, 255, 255, 0.8)',
    rippleColor: props.info?.ripple_color || 'rgba(0, 255, 255, 0.2)',
    centerPointColor: props.info?.center_point_color || '#ffffff'
  }
})

const actualCanvasStyle = computed(() => {
  // 使用info中有canvas_style_json
  if (props.info?.canvas_style_json) {
    try {
      if (typeof props.info.canvas_style_json === 'string') {
        return JSON.parse(props.info.canvas_style_json);
      } else if (typeof props.info.canvas_style_json === 'object') {
        return props.info.canvas_style_json;
      }
    } catch (error) {
      console.warn('canvas_style_json异常:', error);
    }
  }
  // 返回props中的canvasStyle或默认样式
  return props.canvasStyle || {
    width: '100%',
    height: '100%',
    position: 'absolute',
    zIndex: -1,
    left: '0',
    top: '0'
  };
})

onMounted(() => {
  console.log('info:', props.info);

  const canvas = document.getElementById('line_free')
  if (canvas) {
    console.log('画布大小:', canvas.width, canvas.height)
  } else {
    console.warn('找不到画布元素 line_free')
  }
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)

  // 监听屏幕方向变化
  window.addEventListener('orientationchange', handleResize)

  //监听 canvas 尺寸变化
  if (window.ResizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      handleResize()
    })
    if (canvas) {
      resizeObserver.observe(canvas)
    }
  }

  drawLines()
})

onUnmounted(() => {
  // 清理事件监听器
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('orientationchange', handleResize)

  // 清理防抖定时器
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }

  // 清理 ResizeObserver
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})
</script>

<style lang="less" scoped>
.lines {
  width: v-bind('actualCanvasStyle.width');
  height: v-bind('actualCanvasStyle.height');
  position: v-bind('actualCanvasStyle.position');
  z-index: v-bind('actualCanvasStyle.zIndex');
  display: v-bind('actualCanvasStyle.display');
  top: v-bind('actualCanvasStyle.top');
  left: v-bind('actualCanvasStyle.left');
}
</style>