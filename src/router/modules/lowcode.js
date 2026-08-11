// 低代码相关路由（渲染 + 编辑器）
import { getEnv } from "@/common/http";

const lowCodePages = [
  // ==================== 低代码页面 ====================
  // 最新低代码页面
  {
    path: "/lowcode/editor/:pageNo",
    name: "lowcode-editor",
    meta: {
      isEditor: true,
    },
    component: () => import("@/pages/lowcode/index.vue"),
  },
  {
    path: "/edit/:pageNo",
    name: "lowcode-editor1",
    meta: {
      isEditor: true,
    },
    component: () => import("@/pages/lowcode/index.vue"),
  },
  {
    path: "/lowcode/view/:pageNo",
    name: "lowcode-view",
    meta: {
      isEditor: false,
      isView: true,
    },
    component: () => import("@/pages/lowcode/engine/view.vue"),
  },
  {
    path: "/site/:pageNo",
    name: "website",
    component: () => import("@/pages/lowcode/engine/view.vue"),
    meta: {
      isEditor: false,
      isView: true,
    },
  },
  {
    path: "/site/:pageNo/:anchorName",
    name: "websiteWithAnchor",
    component: () => import("@/pages/lowcode/engine/view.vue"),
    meta: {
      isEditor: false,
      isView: true,
    },
  },
  {
    path: "/card-cell-editor/:cardNo",
    name: "cardCellEditor",
    component: () =>
      import("@/pages/lowcode/card-cell-editor/card-cell-editor.vue"),
    meta: {
      isEditor: false,
      isView: true,
    },
  },
  {
    path: "/map-editor/:mapNo",
    name: "MapEditor",
    component: () => import("@/pages/lowcode/map-editor/index.vue"),
    meta: {
      title: "地图标记点编辑器",
    },
  },
  // ==================== 移动端编辑与预览 ====================
  {
    path: "/app/edit/:pageNo",
    name: "app-edit",
    component: () => import("@/pages/lowcode/editor/mobile/app-home.vue"),
  },
  {
    path: "/app/preview/:pageNo",
    name: "app-preview",
    component: () =>
      import("@/pages/lowcode/preview/mobile/preview-page.vue"),
  },
  {
    path: "/get-page-address",
    component: () =>
      import("@/pages/lowcode/get-page-address/get-page-address.vue"),
  },
  {
    path: "/property-form",
    name: "lowcode-property-form",
    meta: {
      isEditor: true,
    },
    component: () => import("@/pages/lowcode/property-form/property-form.vue"),
  },
  {
    path: "/changelog",
    name: "changelog",
    component: () => import("@/pages/changelog/index.vue"),
  },
];

const env = getEnv();

export default [...lowCodePages];
