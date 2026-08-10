import Vue from 'vue';
import contextMenuDirective from '../components/common/ContextMenu/context-menu';

/**
 * 注册所有自定义指令
 */
export function registerDirectives() {
  // 注册右键菜单指令
  Vue.directive('context-menu', contextMenuDirective);
}

/**
 * 默认导出注册函数
 */
export default registerDirectives;