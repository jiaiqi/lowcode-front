import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";

import ElementUI from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
// 渲染一致性:旧工程 app.css 含 tailwind preflight + modern-normalize(来自主工程 tailwind v2.2.17),
// 缺失会导致 box-sizing 回退 content-box、line-height 回退 normal,页面布局与旧工程不一致。
// 引入顺序与旧工程一致:element-ui → preflight → 业务主题,后者可覆盖前者。
import "../theme/scss/preflight.scss";
import "../theme/scss/common-theme.scss";

import Fragment from "vue-fragment";
Vue.use(Fragment.Plugin);

import clickoutside from "@/directives/clickoutside.js";
Vue.directive("clickoutside", clickoutside);

import VueInit from "@/components/common/vue_init.js";
Vue.use(VueInit);

import VueUtil from "@/components/common/vue_util.js";
Vue.use(VueUtil);

import { $http } from "@/common/http";
Vue.prototype.$http = $http;
Vue.prototype.$axios = $http;

Vue.use(ElementUI);
Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount("#app");
