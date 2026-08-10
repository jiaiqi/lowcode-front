import { ref, computed, watch, onMounted, onBeforeUnmount, onUnmounted } from 'vue'
import debounce from 'lodash/debounce'

// 常量定义
const DEFAULT_AUTOPLAY_INTERVAL = 3 // 自动轮播默认间隔
const THROTTLE_DELAY = 300

/**
 * 手风琴自动轮播组合式函数
 * @param {Object} props - 组件 props
 * @returns {Object} 返回手风琴相关的响应式数据和方法
 */
export function useAccordionAutoPlay(props) {
  // 响应式数据
  const activeAccordionSeq = ref(props.item?.default_item || 0)
  const autoPlayTimer = ref(null)
  const isHovered = ref(false)

  // 计算属性
  const accordionAutoPlay = computed( // 是否自动轮播
    () => props.cellLayoutJson?.autoplay === '是' || false
  )
  const autoPlayInterval = computed( // 自动轮播间隔
    () => (props.cellLayoutJson?.autoplay_interval || DEFAULT_AUTOPLAY_INTERVAL) * 1000
  )
  const autoplayDirection = computed( // 自动轮播方向
    () => props.cellLayoutJson?.animation_direction || '由左往右'
  )
  const partsLength = computed(
    () => props.cellLayoutJson?.parts_json?.length || 0
  )

  const isAccordionMode = computed(() =>
    props.cellLayoutJson?.animation_type === '手风琴' || props.cellLayoutJson?.child_animation_type === '手风琴'
  )

  const isMarquee = computed(() =>
    props.cellLayoutJson?.animation_type === '跑马灯' || props.cellLayoutJson?.child_animation_type === '跑马灯'
  )

  // 防抖处理的切换函数
  const changeActiveAccordionSeq = debounce((n) => {
    if (n >= 0 && n < partsLength.value) {
      activeAccordionSeq.value = n
    }
  }, THROTTLE_DELAY, {
    leading: true, // 表示在延迟开始前调用
  })

  // 自动轮播相关函数
  const startAutoPlay = () => {
    try {
      if (!accordionAutoPlay.value || partsLength.value <= 1) {
        return
      }

      stopAutoPlay() // 确保清理之前的定时器

      autoPlayTimer.value = setInterval(() => {
        // 鼠标悬停时暂停
        if (!isHovered.value) {
          if (autoplayDirection.value === '由左往右' || autoplayDirection.value === '由上至下') {
            activeAccordionSeq.value =
              (activeAccordionSeq.value + 1) % partsLength.value
          } else {
            activeAccordionSeq.value =
              (activeAccordionSeq.value - 1 + partsLength.value) % partsLength.value
          }
        }
      }, autoPlayInterval.value)
    } catch (error) {
      console.warn('自动轮播启动失败:', error)
    }
  }

  const stopAutoPlay = () => {
    if (autoPlayTimer.value) {
      clearInterval(autoPlayTimer.value)
      autoPlayTimer.value = null
    }
  }

  const pauseAutoPlay = () => {
    isHovered.value = true
  }

  const resumeAutoPlay = () => {
    isHovered.value = false
  }

  // 监听器
  watch(() => accordionAutoPlay, (newVal) => {
    debugger
    if (newVal) {
      startAutoPlay()
    } else {
      stopAutoPlay()
    }
  })

  watch(partsLength, (newVal) => {
    if (newVal <= 1) {
      stopAutoPlay()
    } else if (accordionAutoPlay.value) {
      startAutoPlay()
    }
  })

  // 生命周期钩子
  onMounted(() => {
    if (isAccordionMode.value && accordionAutoPlay.value && partsLength.value > 1) {
      startAutoPlay()
    }
  })

  onBeforeUnmount(() => {
    stopAutoPlay()
  })

  onUnmounted(() => {
    stopAutoPlay()
  })

  return {
    // 响应式数据
    activeAccordionSeq,
    isHovered,

    // 计算属性
    accordionAutoPlay,
    autoPlayInterval,
    partsLength,
    isAccordionMode,
    isMarquee,

    // 方法
    changeActiveAccordionSeq,
    startAutoPlay,
    stopAutoPlay,
    pauseAutoPlay,
    resumeAutoPlay
  }
}