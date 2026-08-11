import { defineConfig, loadEnv } from "vite";
import vue2 from "@vitejs/plugin-vue2";
import UnoCSS from "unocss/vite";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    // 二级目录部署：任意子路径可用（相对路径，chunk 自动带前缀）
    base: "./",
    plugins: [UnoCSS(), vue2()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        // 统一 Vue 为单一 ESM 构建：vue 包 main 字段是 NODE_ENV 条件 require(CJS)，
        // element-ui 等 CJS bundle 内部 require('vue') 若解析到 CJS 版，会与业务 import 的
        // ESM 版并存为两份 Vue，commonjs 转换后 exports 初始化断裂（生产运行报错）
        vue: "vue/dist/vue.runtime.esm.js",
      },
      extensions: [".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json", ".vue"],
    },
    define: {
      // 兼容旧代码中的 process.env.VUE_APP_*（Vue-cli 时代注入）
      "process.env.NODE_ENV": JSON.stringify(mode === "production" ? "production" : "development"),
      "process.env.VUE_APP_BASE_URL": JSON.stringify(env.VUE_APP_BASE_URL || ""),
      "process.env.VUE_APP_ROUTE_MODE": JSON.stringify(env.VUE_APP_ROUTE_MODE || "hash"),
      "process.env.VUE_APP_DEFAULT_ENV": JSON.stringify(env.VUE_APP_DEFAULT_ENV || "parkDev"),
    },
    css: {
      preprocessorOptions: {
        // modern-compiler：消除 sass legacy JS API 弃用警告（Dart Sass 2.0 将移除）
        scss: {
          api: "modern-compiler",
        },
      },
    },
    optimizeDeps: {
      include: [
        "element-ui",
        "echarts",
        "echarts-liquidfill",
        "echarts-wordcloud",
        "@iconify/vue2",
      ],
    },
    build: {
      chunkSizeWarningLimit: 1500,
      commonjsOptions: {
        include: [/node_modules/, /dhhls\.min\.js/, /dhflv\.min\.js/],
      },
      rollupOptions: {
        output: {
          // 渲染引擎与编辑器按需拆分（Vite manualChunks 替代 webpackChunkName）
          manualChunks(id) {
            if (!id.includes("node_modules")) {
              return undefined;
            }
            if (id.includes("echarts")) return "echarts-vendor";
            if (id.includes("iconify")) return "iconify";
            // vue 生态必须自包含（避免 chunk 循环依赖）：
            // - element-ui 及其依赖树（normalize-wheel/throttle-debounce 等）
            // - 依赖 vue/vuex/vue-router 的 UMD 包（vue-grid-layout/vuedraggable 等）
            // 若与 vendor 分开，UMD 包顶层执行访问 vuex/vue 导出时 TDZ 报错（生产构建必现）
            if (
              id.includes("element-ui") ||
              /node_modules\/(vue|vuex|vue-router|vue-grid-layout|vuedraggable|vue-drag-resize|vue-json-viewer|vue-fragment|vue2-teleport|vue-sketch-ruler|async-validator|babel-helper-vue-jsx-merge-props|deepmerge|normalize-wheel|resize-observer-polyfill|throttle-debounce)\//.test(
                id
              )
            ) {
              return "vue-vendor";
            }
            return "vendor";
          },
        },
      },
    },
    server: {
      host: "0.0.0.0",
      port: 8088,
      proxy: {
        "/dataview": {
          target: "http://localhost:5173",
          changeOrigin: true,
          ws: true,
        },
        "/baiduApi": {
          target: "https://api.map.baidu.com",
          changeOrigin: true,
          ws: true,
          pathRewrite: { "^/baiduApi": "" },
        },
        "/bxmap": {
          target: "http://192.168.0.151",
          changeOrigin: true,
          ws: true,
        },
        "/ragapi": {
          target: "http://192.168.0.159:59100",
          changeOrigin: true,
          ws: true,
        },
        "/gaosuApi": {
          target: "http://61.185.210.204:8099",
          changeOrigin: true,
          ws: true,
          pathRewrite: { "^/gaosuApi": "/bxapi" },
        },
        "/bx-video": {
          target: env.VUE_APP_VIDEO_PROXY_TARGET || "http://61.185.210.204:8099",
          changeOrigin: true,
          ws: true,
        },
        // 生产公共配置 /js/server.js：dev 时代理到延安园区获取同一份配置（与旧工程 dev 行为一致）
        "/js": {
          target: "http://192.168.0.214",
          changeOrigin: true,
        },
      },
    },
  };
});
