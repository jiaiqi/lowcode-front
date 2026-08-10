import { defineConfig, loadEnv } from "vite";
import vue2 from "@vitejs/plugin-vue2";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    // 二级目录部署：任意子路径可用（相对路径，chunk 自动带前缀）
    base: "./",
    plugins: [vue2()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
      extensions: [".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json", ".vue"],
    },
    define: {
      // 兼容旧代码中的 process.env.VUE_APP_*（Vue-cli 时代注入）
      "process.env.NODE_ENV": JSON.stringify(mode === "production" ? "production" : "development"),
      "process.env.VUE_APP_DEFAULT_ENV": JSON.stringify(env.VUE_APP_DEFAULT_ENV || "parkDev"),
    },
    css: {
      preprocessorOptions: {
        scss: {},
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
            if (id.includes("element-ui")) return "element-ui";
            if (id.includes("iconify")) return "iconify";
            if (id.includes("vue") || id.includes("vuex") || id.includes("vue-router")) return "vue-vendor";
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
      },
    },
  };
});
