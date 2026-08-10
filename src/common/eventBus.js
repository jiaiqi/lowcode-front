import Vue from 'vue';
// 事件总线用于组件间通信，替代Vuex方案
let eventBusInstance = null;

function getEventBusInstance() {
  if (!eventBusInstance) {
    eventBusInstance = new Vue();
    console.log('EventBus singleton instance created:', eventBusInstance);
  }
  return eventBusInstance;
}

const eventBus = getEventBusInstance();

// 跟踪事件监听器
const eventListeners = {};

// 重写$on方法以跟踪监听器
const originalOn = eventBus.$on;
eventBus.$on = function(event, callback) {
  if (!eventListeners[event]) {
    eventListeners[event] = [];
  }
  eventListeners[event].push(callback);
  console.log(`[EventBus] Registered listener for: ${event}, Total listeners: ${eventListeners[event].length}`);
  return originalOn.call(this, event, callback);
};

// 重写$off方法以跟踪监听器移除
const originalOff = eventBus.$off;
eventBus.$off = function(event, callback) {
  if (eventListeners[event]) {
    if (callback) {
      eventListeners[event] = eventListeners[event].filter(cb => cb !== callback);
    } else {
      delete eventListeners[event];
    }
    console.log(`[EventBus] Removed listener for: ${event}, Remaining listeners: ${eventListeners[event]?.length || 0}`);
  }
  return originalOff.call(this, event, callback);
};

// 获取当前事件监听器状态
eventBus.getListeners = function() {
  return Object.keys(eventListeners).reduce((result, event) => {
    result[event] = eventListeners[event].length;
    return result;
  }, {});
};

// 缓存最新事件数据
const eventCache = {};

// 重写$emit方法，添加日志和缓存
eventBus.$emit = function(event, data) {
  console.log(`[EventBus] Emitting event: ${event}`, data);
  console.log(`[EventBus] Current listeners:`, this.getListeners());
  // 缓存updateOrderForm事件的数据
  if (event === 'updateOrderForm') {
    eventCache[event] = data;
  }
  // 调用原始$emit方法
  Vue.prototype.$emit.apply(this, arguments);
};

// 添加获取最新缓存数据的方法
eventBus.getLatestData = function(event) {
  return eventCache[event];
};

export default eventBus;