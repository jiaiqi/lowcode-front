<template>
  <el-tabs v-model="activeName" @tab-click="handleClick">
    <el-tab-pane :label="tab.name" :name="tab.no" v-for="tab in tabs" :key="tab.no">
      <content-wrap :data="tab"></content-wrap>
    </el-tab-pane>
  </el-tabs>
</template>

<script>
export default {
  components: {
    ContentWrap: () => import("./content-wrap"),
  },
  props: {
    data: {
      type: Object,
    },
  },
  data() {
    return {
      tabs: [],
      activeName: null,
    };
  },
  methods: {
    handleClick() {},
  },
  created() {
    if (this.data?.children?.length) {
      this.tabs = this.data.children;
      this.activeName = this.tabs[0].no;
    }
  },
};
</script>

<style lang="scss" scoped></style>
