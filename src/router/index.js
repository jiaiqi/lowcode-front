import Vue from "vue";
import VueRouter from "vue-router";
import lowcodeRoutes from "./modules/lowcode";

const routes = [
  ...lowcodeRoutes,
  // ==================== 兜底路由：任意短路径渲染低代码页面 ====================
  {
    path: "/:pageNo",
    name: "lowcode-view1",
    meta: {
      isEditor: false,
      isView: true,
    },
    component: () => import("@/pages/lowcode/view.vue"),
  },
  {
    path: "/",
    name: "lowcodeHomePage",
    meta: {
      isEditor: false,
      isView: true,
    },
    component: () => import("@/pages/lowcode/view.vue"),
  },
];

Vue.use(VueRouter);

const router = new VueRouter({
  routes,
});

export default router;
