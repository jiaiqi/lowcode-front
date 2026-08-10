/**
 * 弹窗相关的组合式函数
 * 负责处理弹窗位置计算、显示隐藏等逻辑
 */
import { ref, nextTick } from 'vue'

export function usePopover() {
  // 弹窗相关状态
  const activeMarker = ref({})
  const popoverPosition = ref({ x: 0, y: 0 })
  const currentMarkerElement = ref(null)

  // 配置常量
  const CONFIG = {
    UI: {
      POPUP_OFFSET: 10,
    },
    PERFORMANCE: {
      DEBOUNCE_DELAY: 100,
    },
  }

  // 防抖定时器
  let debounceTimer = null

  /**
   * 获取弹窗实际尺寸
   */
  function getPopoverDimensions() {
    const popoverElement = document.querySelector('.popover-component .popover-content')
    
    if (popoverElement) {
      const rect = popoverElement.getBoundingClientRect()
      return {
        width: rect.width || 300,
        height: rect.height || 200
      }
    }
    
    return {
      width: 300,
      height: 200
    }
  }

  /**
   * 计算弹窗位置
   */
  function calculatePopoverPosition(element) {
    if (!element) return

    const elementRect = element.getBoundingClientRect()
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight
    
    const popoverDimensions = getPopoverDimensions()
    const popoverWidth = popoverDimensions.width
    const popoverHeight = popoverDimensions.height
    const padding = 50

    const markerCenterX = elementRect.left + elementRect.width / 2
    const markerCenterY = elementRect.top + elementRect.height / 2

    // 计算初始位置
    let x = markerCenterX
    let y = elementRect.top - CONFIG.UI.POPUP_OFFSET
    let arrowDirection = 'bottom'
    let arrowPosition = 50

    // 水平位置调整
    const popoverActualLeft = x - popoverWidth / 2
    const popoverActualRight = x + popoverWidth / 2

    if (popoverActualLeft < padding) {
      const newX = padding + popoverWidth / 2
      arrowPosition = Math.max(10, Math.min(90, ((markerCenterX - newX) / popoverWidth + 0.5) * 100))
      x = newX
    } else if (popoverActualRight > viewportWidth - padding) {
      const newX = viewportWidth - padding - popoverWidth / 2
      arrowPosition = Math.max(10, Math.min(90, ((markerCenterX - newX) / popoverWidth + 0.5) * 100))
      x = newX
    }

    // 垂直位置调整
    const popoverActualTop = y - popoverHeight
    const popoverActualBottom = y

    if (popoverActualTop < padding) {
      y = elementRect.bottom + CONFIG.UI.POPUP_OFFSET + popoverHeight
      arrowDirection = 'top'
      
      if (y > viewportHeight - padding) {
        const spaceAbove = elementRect.top
        const spaceBelow = viewportHeight - elementRect.bottom
        
        if (spaceAbove > spaceBelow) {
          y = Math.max(padding + popoverHeight, elementRect.top - CONFIG.UI.POPUP_OFFSET)
          arrowDirection = 'bottom'
        } else {
          y = Math.min(viewportHeight - padding, elementRect.bottom + CONFIG.UI.POPUP_OFFSET + popoverHeight)
          arrowDirection = 'top'
        }
      }
    }

    // 基于最终位置重新计算箭头方向
    const finalPopoverCenter = y - popoverHeight / 2
    if (finalPopoverCenter > markerCenterY) {
      arrowDirection = 'top'
    } else {
      arrowDirection = 'bottom'
    }

    // 返回正确的位置格式
    popoverPosition.value = {
        left: x,
        top: y,
        arrowDirection,
        arrowPosition
      }
  }

  /**
   * 延迟重新计算位置的通用函数
   */
  async function recalculatePositionWithDelay(element, delays = [100, 300]) {
    if (!element || !activeMarker.value?.id) return

    const initialPosition = { ...popoverPosition.value }

    for (const delay of delays) {
      await new Promise(resolve => setTimeout(resolve, delay))
      
      if (!currentMarkerElement.value || !activeMarker.value?.id) break

      const beforeRecalc = { ...popoverPosition.value }
      calculatePopoverPosition(currentMarkerElement.value)
      const afterRecalc = { ...popoverPosition.value }

      // 检查位置变化是否过大
      const xDiff = Math.abs(afterRecalc.left - beforeRecalc.left)
      const yDiff = Math.abs(afterRecalc.top - beforeRecalc.top)
      const threshold = delay === 100 ? 50 : 30

      if (xDiff > threshold || yDiff > threshold) {
        console.warn(`位置变化过大，恢复到${delay === 100 ? '初始' : '当前'}位置:`, {
          before: beforeRecalc,
          after: afterRecalc,
          diff: { left: xDiff, top: yDiff }
        })
        popoverPosition.value = delay === 100 ? initialPosition : beforeRecalc
        break
      }
    }
  }

  /**
   * 显示弹窗
   */
  async function showPopover(marker, element) {
    activeMarker.value = marker
    currentMarkerElement.value = element
    
    if (element) {
      calculatePopoverPosition(element)
      addEventListeners()
      
      // 延迟重新计算位置
      await recalculatePositionWithDelay(element)
    }
  }

  /**
   * 隐藏弹窗
   */
  function hidePopover() {
    activeMarker.value = null
    currentMarkerElement.value = null
    removeEventListeners()
  }

  /**
   * 切换弹窗显示状态
   */
  async function togglePopover(marker, element) {
    if (marker?.id && marker?.id === activeMarker.value?.id) {
      hidePopover()
    } else {
      await showPopover(marker, element)
    }
  }

  /**
   * 检查元素是否在可视区域内
   */
  function isElementInViewport(element) {
    if (!element) return false

    const rect = element.getBoundingClientRect()
    const windowHeight = window.innerHeight || document.documentElement.clientHeight
    const windowWidth = window.innerWidth || document.documentElement.clientWidth

    return (
      rect.top < windowHeight &&
      rect.bottom > 0 &&
      rect.left < windowWidth &&
      rect.right > 0
    )
  }

  /**
   * 视口变化处理函数（防抖优化版本）
   */
  function handleViewportChange() {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    debounceTimer = setTimeout(() => {
      if (currentMarkerElement.value && activeMarker.value?.id) {
        if (isElementInViewport(currentMarkerElement.value)) {
          calculatePopoverPosition(currentMarkerElement.value)
        } else {
          hidePopover()
        }
      }
    }, CONFIG.PERFORMANCE.DEBOUNCE_DELAY)
  }

  /**
   * 添加事件监听器
   */
  function addEventListeners() {
    window.addEventListener("resize", handleViewportChange)
    window.addEventListener("scroll", handleViewportChange, true)
  }

  /**
   * 移除事件监听器
   */
  function removeEventListeners() {
    window.removeEventListener("resize", handleViewportChange)
    window.removeEventListener("scroll", handleViewportChange, true)
  }

  /**
   * 清理资源
   */
  function cleanup() {
    removeEventListeners()
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  }

  return {
    // 状态
    activeMarker,
    popoverPosition,
    currentMarkerElement,
    
    // 方法
    calculatePopoverPosition,
    showPopover,
    hidePopover,
    togglePopover,
    cleanup
  }
}