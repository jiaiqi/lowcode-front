// 组合式函数统一导出
export { useAccordionAutoPlay } from './useAccordionAutoPlay.js'
export { useStyleBuilder } from './useStyleBuilder.js'
export { useEventHandlers } from './useEventHandlers.js'

// 导入组合式函数用于内部使用
import { useAccordionAutoPlay } from './useAccordionAutoPlay.js'
import { useStyleBuilder } from './useStyleBuilder.js'
import { useEventHandlers } from './useEventHandlers.js'

/**
 * 卡片单元格组合式函数集合
 * 提供完整的卡片单元格功能组合
 * @param {Object} props - 组件 props
 * @param {Function} emit - Vue 3 的 emit 函数
 * @returns {Object} 返回所有组合式函数的结果
 */
export function useCardCell(props, emit) {
  // 手风琴自动轮播功能
  const accordionControls = useAccordionAutoPlay(props)
  
  // 样式构建功能
  const styleBuilder = useStyleBuilder()
  
  // 事件处理功能
  const eventHandlers = useEventHandlers(emit)

  return {
    // 手风琴控制
    ...accordionControls,
    
    // 样式构建
    ...styleBuilder,
    
    // 事件处理
    ...eventHandlers,
    
    // 组合对象（用于需要传递整个控制对象的场景）
    accordionControls,
    styleBuilder,
    eventHandlers
  }
}