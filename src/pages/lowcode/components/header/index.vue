<template>
  <div class="header-view">
    <div class="left">
      <!-- <el-button @click="showJSON" size="mini">页面JSON</el-button> -->
      <slot name="left">
      </slot>
    </div>
    <div class="center"><slot name="center"> 可视化编辑器 </slot></div>
    <div class="right">
      <slot name="right"></slot>
      <el-button type="primary" size="mini" @click="showPreview">
        <i class="el-icon-view"></i>
        {{ isPreview ? "退出" : "预览" }}
      </el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: "lowcode-header",
  props: {
    isPreview: {
      type: Boolean,
      default: false,
    },
    jsonVisible: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      //
    };
  },
  methods: {
    showPreview() {
      this.$emit("preview");
      // this.$emit("update:isPreview", !this.isPreview);
    },
    showJSON() {
      this.$emit("update:jsonVisible", true);
    },
  },
};
</script>

<style lang="scss" scoped>
.header-view {
  --header-height: 50px;
  --header-background-color: #fff;
  --header-color: #333;

  background-color: var(--header-background-color);
  height: var(--header-height);
  line-height: var(--header-height);
  color: var(--header-color);
  padding: 0 10px;
  border-bottom: 1px solid #f1f1f1;
  display: flex;
  justify-content: space-between;
}

.left,.right {
  display: flex;
  align-items: center;
}
</style>
