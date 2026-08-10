<template>
  <div class="property-form-page">
    <property-view
      v-if="pageConfig"
      ref="propertyRef"
      app-no="config"
      :page-config="pageConfig"
      :current-item="currentItem"
      :components="components"
      @change="onChange"
      @page-change="onPageChange"
      @refresh="emitToParent('refresh')"
      @save="emitToParent('save')"
      @preview="emitToParent('preview')"
      @screen-type="emitToParent('screen-type', $event)"
    ></property-view>
    <div v-else class="property-form-empty">
      等待编辑器传入页面数据…
    </div>
  </div>
</template>

<script>
import PropertyView from "../components/property/index.vue";

/**
 * 属性表单独立页（供新工程低代码编辑器 iframe 嵌入）
 *
 * 数据流（postMessage 双向通信）：
 *  - 本页加载完成后向父窗口发送 { type: 'property:ready' }
 *  - 父窗口（新工程编辑器）随后发送：
 *      { type: 'property:init', payload: { pageConfig, currentItem, components } }
 *      { type: 'property:select', payload: currentItem }（选中组件变更）
 *  - 本页将属性面板的变更/保存/预览等事件转发给父窗口：
 *      { type: 'property:change'|'property:save'|'property:preview'|'property:refresh'|'property:screen-type', args }
 */
export default {
  name: "PropertyFormPage",
  components: {
    PropertyView,
  },
  data() {
    return {
      pageConfig: null,
      currentItem: null,
      components: [],
    };
  },
  created() {
    window.addEventListener("message", this.onMessage);
  },
  mounted() {
    // 通知父窗口本页就绪，等待其推送页面数据
    window.parent.postMessage({ type: "property:ready" }, "*");
  },
  beforeDestroy() {
    window.removeEventListener("message", this.onMessage);
  },
  methods: {
    onMessage(event) {
      const msg = event.data || {};
      if (msg.type === "property:init") {
        const payload = msg.payload || {};
        this.pageConfig = payload.pageConfig || null;
        this.currentItem = payload.currentItem || null;
        this.components = payload.components || [];
      } else if (msg.type === "property:select") {
        this.currentItem = msg.payload || null;
      }
    },
    emitToParent(type, ...args) {
      window.parent.postMessage({ type: `property:${type}`, args }, "*");
    },
    onChange(value) {
      this.emitToParent("change", value);
    },
    onPageChange(value, type, compType, componentId) {
      this.emitToParent("page-change", {
        value,
        type,
        compType,
        componentId,
      });
    },
  },
};
</script>

<style scoped>
.property-form-page {
  height: 100%;
  overflow: auto;
  background: #fff;
}
.property-form-empty {
  padding: 40px 20px;
  text-align: center;
  color: #999;
  font-size: 13px;
}
</style>
