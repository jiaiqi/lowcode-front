// clickoutside.js
export default {
  bind(el, binding, vnode) {
    const documentHandler = function(event) {
      // 如果点击的是el本身或者是el的子元素，则忽略
      if (!el.contains(event.target)) {
        // 触发绑定的函数
        if (binding.expression) {
          vnode.context[binding.expression](event);
        }
      }
    };
    el.__vueClickOutside__ = documentHandler;
    document.addEventListener('click', documentHandler);
  },
  unbind(el) {
    document.removeEventListener('click', el.__vueClickOutside__);
    delete el.__vueClickOutside__;
  }
};