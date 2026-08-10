<template>
  <div id="app">
    <router-view
      v-if="ready"
      :key="routerViewKey"
    ></router-view>
    <login-dialog ref="loginRef"></login-dialog>
  </div>
</template>

<script>
import loginDialog from "@/components/ui/login-dialog/login-dialog.vue";

export default {
  name: "App",
  components: {
    loginDialog,
  },
  data() {
    return {
      ready: true,
    };
  },
  computed: {
    /**
     * 官网类路由固定 key：同路径之间切换时复用同一组件实例，
     * 由 view.vue 的 watch + mixin loadPageConfig 内部刷新。
     */
    routerViewKey() {
      const siteRouteNames = [
        "website",
        "websiteWithAnchor",
        "lowcode-view",
        "lowcode-view1",
        "lowcodeHomePage",
      ];
      if (siteRouteNames.includes(this.$route.name)) {
        return "site-view";
      }
      return this.$route.path;
    },
  },
};
</script>

<style lang="scss">
html {
  height: 100%;
  margin: 0;
  padding: 0;
  scrollbar-gutter: stable;
}

html body {
  height: 100%;
  margin: 0 !important;
  padding: 0;
}

#app {
  height: 100%;
  color: #2c3e50;
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.el-date-table td.in-range div {
  background-color: #d2e2f9 !important;
}
</style>
