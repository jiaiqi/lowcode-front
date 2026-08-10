import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";

import ElementUI from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
import "../theme/scss/common-theme.scss";

import Fragment from "vue-fragment";
Vue.use(Fragment.Plugin);

import clickoutside from "@/directives/clickoutside.js";
Vue.directive("clickoutside", clickoutside);

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
