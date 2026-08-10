const dragStore = {
  currentDragType: null,
  
  setDragType(type) {
    this.currentDragType = type;
  },
  
  getDragType() {
    return this.currentDragType;
  },
  
  clearDragType() {
    this.currentDragType = null;
  },

  draggingElement: null,

  setDraggingElement(element) {
    this.draggingElement = element;
  },

  getDraggingElement() {
    return this.draggingElement;
  },

  isResizing: false,
  resizeListeners: [],

  startResize() {
    this.isResizing = true;
    this.notifyResizeChange();
  },

  stopResize() {
    this.isResizing = false;
    this.notifyResizeChange();
  },

  getResizeState() {
    return this.isResizing;
  },

  addResizeListener(callback) {
    this.resizeListeners.push(callback);
  },

  removeResizeListener(callback) {
    const index = this.resizeListeners.indexOf(callback);
    if (index > -1) {
      this.resizeListeners.splice(index, 1);
    }
  },

  notifyResizeChange() {
    this.resizeListeners.forEach(callback => {
      if (typeof callback === 'function') {
        callback(this.isResizing);
      }
    });
  },

  editorMode: 'pc',
  mobileCanvasWidth: 375,
  mobileCanvasHeight: 667,

  setEditorMode(mode) {
    this.editorMode = mode;
    this.notifyModeChange();
  },

  getEditorMode() {
    return this.editorMode;
  },

  isMobileMode() {
    return this.editorMode === 'mobile';
  },

  modeListeners: [],

  addModeListener(callback) {
    this.modeListeners.push(callback);
  },

  removeModeListener(callback) {
    const index = this.modeListeners.indexOf(callback);
    if (index > -1) {
      this.modeListeners.splice(index, 1);
    }
  },

  notifyModeChange() {
    this.modeListeners.forEach(callback => {
      if (typeof callback === 'function') {
        callback(this.editorMode);
      }
    });
  },

  // 组件交换记录机制
  swappedComponents: new Set(),
  positionChangedComponents: new Set(),

  // 添加交换记录
  addSwappedComponent(componentId) {
    this.swappedComponents.add(componentId);
  },

  // 获取交换记录
  getSwappedComponents() {
    return Array.from(this.swappedComponents);
  },

  // 清除交换记录
  clearSwappedComponents() {
    this.swappedComponents.clear();
  },

  // 添加位置变更记录
  addPositionChangedComponent(componentId) {
    this.positionChangedComponents.add(componentId);
  },

  // 获取位置变更记录
  getPositionChangedComponents() {
    return Array.from(this.positionChangedComponents);
  },

  // 清除位置变更记录
  clearPositionChangedComponents() {
    this.positionChangedComponents.clear();
  },

  // 清除所有记录
  clearAllRecords() {
    this.clearSwappedComponents();
    this.clearPositionChangedComponents();
  },
};

export default dragStore;
