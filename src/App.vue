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

<style>
body {
  margin: 0;
  padding: 0;
}
</style>
