/**
 * 事件处理组合式函数
 * @param {Function} emit - Vue 3 的 emit 函数
 * @returns {Object} 返回事件处理相关的方法
 */
export function useEventHandlers(emit) {
  /**
   * 处理单元格点击事件
   * @param {Object} item - 单元格项数据
   * @param {Object} cellLayoutJson - 单元格布局配置
   */
  const onClickCell = (item, cellLayoutJson) => {
    emit('on-click-cell', item, cellLayoutJson)
  }

  /**
   * 处理显示对话框事件
   * @param {Object} params - 对话框参数
   */
  const showDialog = (params) => {
    emit('show-dialog', params)
  }

  /**
   * 处理键盘导航事件
   * @param {KeyboardEvent} event - 键盘事件
   * @param {Object} accordionControls - 手风琴控制对象
   */
  const handleKeyboardNavigation = (event, accordionControls) => {
    if (!accordionControls.isAccordionMode?.value) return

    const { activeAccordionSeq, partsLength, changeActiveAccordionSeq } = accordionControls

    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault()
        const prevIndex = activeAccordionSeq.value > 0 
          ? activeAccordionSeq.value - 1 
          : partsLength.value - 1
        changeActiveAccordionSeq(prevIndex)
        break
        
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault()
        const nextIndex = (activeAccordionSeq.value + 1) % partsLength.value
        changeActiveAccordionSeq(nextIndex)
        break
        
      case 'Home':
        event.preventDefault()
        changeActiveAccordionSeq(0)
        break
        
      case 'End':
        event.preventDefault()
        changeActiveAccordionSeq(partsLength.value - 1)
        break
    }
  }

  /**
   * 处理鼠标进入事件
   * @param {Object} accordionControls - 手风琴控制对象
   */
  const handleMouseEnter = (accordionControls) => {
    accordionControls.pauseAutoPlay?.()
  }

  /**
   * 处理鼠标离开事件
   * @param {Object} accordionControls - 手风琴控制对象
   */
  const handleMouseLeave = (accordionControls) => {
    accordionControls.resumeAutoPlay?.()
  }

  /**
   * 处理手风琴项点击事件
   * @param {number} index - 点击的索引
   * @param {Object} accordionControls - 手风琴控制对象
   */
  const handleAccordionItemClick = (index, accordionControls) => {
    accordionControls.changeActiveAccordionSeq?.(index)
  }

  /**
   * 处理手风琴项鼠标进入事件
   * @param {number} index - 鼠标进入的索引
   * @param {Object} accordionControls - 手风琴控制对象
   */
  const handleAccordionItemMouseEnter = (index, accordionControls) => {
    accordionControls.changeActiveAccordionSeq?.(index)
  }

  return {
    onClickCell,
    showDialog,
    handleKeyboardNavigation,
    handleMouseEnter,
    handleMouseLeave,
    handleAccordionItemClick,
    handleAccordionItemMouseEnter
  }
}