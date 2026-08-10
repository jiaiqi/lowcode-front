import Vue from 'vue';
import ContextMenu from './ContextMenu.vue';

/**
 * 右键菜单管理器 - 单例模式
 * 全局只会有一个右键菜单实例
 */
class ContextMenuManager {
  constructor() {
    this.instance = null;
    this.vm = null;
    this.container = null;
    this.mountElement = null; // 记录挂载的DOM元素
  }

  /**
   * 获取单例实例
   */
  static getInstance() {
    if (!ContextMenuManager._instance) {
      ContextMenuManager._instance = new ContextMenuManager();
    }
    return ContextMenuManager._instance;
  }

  /**
   * 初始化右键菜单实例
   * @param {Element} mountElement - 挂载的DOM元素，默认为document.body
   */
  init(mountElement = document.body) {
    // 如果已经初始化且挂载元素相同，直接返回
    if (this.vm && this.mountElement === mountElement) {
      return this.vm;
    }

    // 如果挂载元素不同，先销毁旧实例
    if (this.vm && this.mountElement !== mountElement) {
      this.destroy();
    }

    // 记录挂载元素
    this.mountElement = mountElement;

    // 创建容器
    this.container = document.createElement('div');
    this.container.id = 'global-context-menu-container';
    this.mountElement.appendChild(this.container);

    // 创建Vue组件实例
    const ContextMenuConstructor = Vue.extend(ContextMenu);
    this.vm = new ContextMenuConstructor({
      propsData: {
        visible: false,
        x: 0,
        y: 0,
        menuItems: []
      }
    });

    // 监听事件
    this.vm.$on('item-click', this.handleItemClick.bind(this));
    this.vm.$on('close', this.hide.bind(this));

    // 挂载到容器
    this.vm.$mount(this.container);

    return this.vm;
  }

  /**
   * 显示右键菜单
   * @param {Object} options - 菜单配置
   * @param {number} options.x - X坐标
   * @param {number} options.y - Y坐标
   * @param {Array} options.menuItems - 菜单项
   * @param {Function} options.onItemClick - 菜单项点击回调
   * @param {Object} options.context - 上下文数据
   * @param {Element} options.mountElement - 挂载的DOM元素，默认为document.body
   */
  show(options) {
    const { x, y, menuItems, onItemClick, context, mountElement = document.body } = options;
    
    // 初始化或重新初始化（如果挂载元素改变）
    if (!this.vm || this.mountElement !== mountElement) {
      this.init(mountElement);
    }

    // 存储回调和上下文
    this.currentCallback = onItemClick;
    this.currentContext = context;
    // 调整菜单位置，防止超出屏幕
    const adjustedPosition = this.adjustPosition(x, y);

    // 更新菜单属性
    this.vm.visible = true;
    this.vm.x = adjustedPosition.x;
    this.vm.y = adjustedPosition.y;
    this.vm.menuItems = menuItems || [];

    // 添加全局点击监听
    this.addGlobalListeners();
  }

  /**
   * 隐藏右键菜单
   */
  hide() {
    if (this.vm) {
      this.vm.visible = false;
      this.removeGlobalListeners();
      this.currentCallback = null;
      this.currentContext = null;
    }
  }

  /**
   * 处理菜单项点击
   * @param {Object} item - 菜单项
   */
  handleItemClick(item) {
    if (this.currentCallback && typeof this.currentCallback === 'function') {
      this.currentCallback(item, this.currentContext);
    }
    this.hide();
  }

  /**
   * 调整菜单位置，防止超出屏幕
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @returns {Object} 调整后的坐标
   */
  adjustPosition(x, y) {
    const menuWidth = 160; // 菜单最小宽度
    const menuHeight = 200; // 估算菜单高度
    const padding = 10; // 边距

    let adjustedX = x;
    let adjustedY = y;

    // 防止右侧超出屏幕
    if (x + menuWidth + padding > window.innerWidth) {
      adjustedX = window.innerWidth - menuWidth - padding;
    }

    // 防止底部超出屏幕
    if (y + menuHeight + padding > window.innerHeight) {
      adjustedY = window.innerHeight - menuHeight - padding;
    }

    // 防止左侧和顶部超出屏幕
    adjustedX = Math.max(padding, adjustedX);
    adjustedY = Math.max(padding, adjustedY);

    return { x: adjustedX, y: adjustedY };
  }

  /**
   * 添加全局事件监听
   */
  addGlobalListeners() {
    document.addEventListener('click', this.handleGlobalClick.bind(this));
    document.addEventListener('keydown', this.handleGlobalKeydown.bind(this));
    document.addEventListener('contextmenu', this.handleGlobalContextMenu.bind(this));
  }

  /**
   * 移除全局事件监听
   */
  removeGlobalListeners() {
    document.removeEventListener('click', this.handleGlobalClick.bind(this));
    document.removeEventListener('keydown', this.handleGlobalKeydown.bind(this));
    document.removeEventListener('contextmenu', this.handleGlobalContextMenu.bind(this));
  }

  /**
   * 处理全局点击事件
   * @param {Event} e - 点击事件
   */
  handleGlobalClick(e) {
    if (this.vm && this.vm.visible) {
      // 如果点击的不是菜单内部，则隐藏菜单
      if (!this.vm.$el.contains(e.target)) {
        this.hide();
      }
    }
  }

  /**
   * 处理全局键盘事件
   * @param {Event} e - 键盘事件
   */
  handleGlobalKeydown(e) {
    if (this.vm && this.vm.visible && e.key === 'Escape') {
      this.hide();
    }
  }

  /**
   * 处理全局右键事件
   * @param {Event} e - 右键事件
   */
  handleGlobalContextMenu(e) {
    // 如果菜单已显示，阻止浏览器默认右键菜单
    if (this.vm && this.vm.visible) {
      e.preventDefault();
    }
  }

  /**
   * 销毁实例
   */
  destroy() {
    if (this.vm) {
      this.hide();
      this.vm.$destroy();
      this.vm = null;
    }
    
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }

    ContextMenuManager._instance = null;
  }
}

// 导出单例实例
export default ContextMenuManager.getInstance();