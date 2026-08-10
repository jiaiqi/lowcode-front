/**
 * v-clickoutside 指令
 * 用于检测点击元素外部的事件
 */

const clickoutside = {
  bind(el, binding, vnode) {
    function documentHandler(e) {
      // 如果点击的元素是绑定指令的元素或其子元素，则不执行回调
      if (el.contains(e.target)) {
        return false;
      }
      // 执行绑定的回调函数
      if (binding.expression) {
        binding.value(e);
      }
    }
    
    // 将事件处理函数存储在元素上，以便在 unbind 时移除
    el.__vueClickOutside__ = documentHandler;
    
    // 添加事件监听器
    document.addEventListener('click', documentHandler);
  },
  
  update(el, binding) {
    // 更新时重新绑定事件处理函数
    if (el.__vueClickOutside__) {
      document.removeEventListener('click', el.__vueClickOutside__);
    }
    
    function documentHandler(e) {
      if (el.contains(e.target)) {
        return false;
      }
      if (binding.expression) {
        binding.value(e);
      }
    }
    
    el.__vueClickOutside__ = documentHandler;
    document.addEventListener('click', documentHandler);
  },
  
  unbind(el) {
    // 移除事件监听器
    if (el.__vueClickOutside__) {
      document.removeEventListener('click', el.__vueClickOutside__);
      delete el.__vueClickOutside__;
    }
  }
};

export default clickoutside;