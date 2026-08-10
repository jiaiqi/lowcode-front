<template>
  <div class="legacy-form">
    <iframe
      v-if="formUrl"
      :src="formUrl"
      class="legacy-form__frame"
      @load="onFrameLoad"
    ></iframe>
    <div v-else class="legacy-form__empty">
      <p>表单配置缺失（service 为空或未配置旧工程地址）</p>
    </div>
  </div>
</template>

<script>
/**
 * LegacyForm 旧工程表单 iframe 包装组件
 *
 * 新工程不引入旧工程的表单组件（simple-add / simple-update / add / update 等），
 * 需要表单的场景统一通过 iframe 嵌入旧工程的路由页面：
 *
 *   新增: {legacyFormHost}/#/simple-add/{service}?app={srvApp}
 *   更新: {legacyFormHost}/#/simple-update/{service}/{pk}?app={srvApp}
 *   普通: {legacyFormHost}/#/{mode}/{service}[/{pk}]
 *
 * 旧工程地址在 public/config/config_dev.js 的 APP_CONFIG.legacyFormHost 配置。
 *
 * 提交结果通知：
 *   旧工程表单提交成功后如向父窗口 postMessage
 *   { type: "LEGACY_FORM_DONE", success: true, data: {...} }
 *   本组件会转发 executor-complete 事件；旧工程未加支持时，
 *   父级联动依赖 form-loaded（iframe 加载完成）与手动刷新。
 */
export default {
  name: "LegacyForm",
  props: {
    // 表单模式，对应旧工程路由：simple-add / simple-update / add / update / simple-filter
    mode: {
      type: String,
      default: "simple-add",
    },
    service: {
      type: String,
      default: "",
    },
    srvApp: {
      type: String,
      default: "",
    },
    pk: {
      type: [String, Number],
      default: "",
    },
    // 附加 query 参数
    extraQuery: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      loaded: false,
    };
  },
  computed: {
    legacyFormHost() {
      try {
        return (window.APP_CONFIG && window.APP_CONFIG.legacyFormHost) || "";
      } catch (e) {
        return "";
      }
    },
    formUrl() {
      if (!this.legacyFormHost || !this.service) {
        return "";
      }
      let url = `${this.legacyFormHost}/#/${this.mode}/${this.service}`;
      if (this.pk !== "" && this.pk !== null && this.pk !== undefined) {
        url += `/${this.pk}`;
      }
      const query = {};
      if (this.srvApp) {
        query.app = this.srvApp;
      }
      Object.assign(query, this.extraQuery);
      const qs = Object.keys(query)
        .map((k) => `${k}=${encodeURIComponent(query[k])}`)
        .join("&");
      if (qs) {
        url += `?${qs}`;
      }
      return url;
    },
  },
  mounted() {
    window.addEventListener("message", this.onMessage);
  },
  beforeDestroy() {
    window.removeEventListener("message", this.onMessage);
  },
  methods: {
    onFrameLoad() {
      if (!this.loaded) {
        this.loaded = true;
        this.$emit("form-loaded", {});
      }
    },
    onMessage(event) {
      const data = event.data;
      if (!data || typeof data !== "object" || data.type !== "LEGACY_FORM_DONE") {
        return;
      }
      this.$emit("executor-complete", data.data || {});
    },
  },
};
</script>

<style scoped>
.legacy-form {
  width: 100%;
  height: 100%;
}
.legacy-form__frame {
  width: 100%;
  height: 100%;
  min-height: 400px;
  border: none;
  display: block;
}
.legacy-form__empty {
  padding: 40px 0;
  text-align: center;
  color: #909399;
  font-size: 13px;
}
</style>
