import ContextMenuManager from '@/components/common/ContextMenu/ContextMenuManager';

/**
 * 右键菜单自定义指令
 * 使用方式：v-context-menu="{ menuItems: [], onItemClick: handler, context: data, mountElement: element }"
 */
const contextMenuDirective = {
  bind(el, binding, vnode) {
    // 存储原始的contextmenu事件处理器
    el._originalContextMenu = el.oncontextmenu;
    
    // 创建右键菜单处理函数
    el._contextMenuHandler = function(event) {
      event.preventDefault();
      event.stopPropagation();
      
      const { value } = binding;
      
      if (!value) {
        console.warn('v-context-menu directive requires a value object');
        return;
      }
      
      const {
        menuItems = [],
        onItemClick,
        context,
        disabled = false,
        beforeShow,
        mountElement
      } = value;
      
      // 如果禁用或没有菜单项，则不显示
      if (disabled || !menuItems.length) {
        return;
      }
      
      // 执行显示前的回调
      if (beforeShow && typeof beforeShow === 'function') {
        const shouldShow = beforeShow(event, context);
        if (shouldShow === false) {
          return;
        }
      }
      // 显示右键菜单
      ContextMenuManager.show({
        x: event.clientX,
        y: event.clientY,
        menuItems,
        onItemClick: (item, ctx) => {
          if (onItemClick && typeof onItemClick === 'function') {
            onItemClick(item, ctx, event, el);
          }
        },
        context,
        mountElement: mountElement || document.body
      });
    };
    
    // 绑定右键事件
    el.addEventListener('contextmenu', el._contextMenuHandler);
  },
  
  update(el, binding) {
    // 当指令值更新时，不需要重新绑定事件
    // 因为事件处理器会从binding中获取最新的值
  },
  
  unbind(el) {
    // 移除事件监听器
    if (el._contextMenuHandler) {
      el.removeEventListener('contextmenu', el._contextMenuHandler);
      delete el._contextMenuHandler;
    }
    
    // 恢复原始的contextmenu事件处理器
    if (el._originalContextMenu) {
      el.oncontextmenu = el._originalContextMenu;
      delete el._originalContextMenu;
    }
  }
};

/**
 * 安装指令的函数
 * @param {Vue} Vue - Vue构造函数
 */
export function install(Vue) {
  Vue.directive('context-menu', contextMenuDirective);
}

/**
 * 默认导出指令对象
 */
export default contextMenuDirective;

/**
 * 导出便捷的使用函数
 */
export const showContextMenu = (options) => {
  ContextMenuManager.show(options);
};

export const hideContextMenu = () => {
  ContextMenuManager.hide();
};