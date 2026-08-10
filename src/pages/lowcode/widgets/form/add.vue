<script setup>
import LegacyForm from "@/components/common/legacy-form.vue";
import { computed, ref } from "vue";

const props = defineProps({
  pageItem: Object,
});
const service = computed(() => {
  return props.pageItem?.srv_req_json?.serviceName;
});
const srvApp = computed(() => {
  return props.pageItem?.srv_req_json?.mapp;
});
const pageLoading = ref(true); //表单加载中
const emit = defineEmits(["executor-complete", "data-loaded"]);
const executorComplete = (data) => {
  console.log("executor-complete:", data);
  emit("executor-complete", data);
};
const onFormLoaded = (data) => {
  pageLoading.value = false;
  // 表单加载完成时通知父组件数据已加载（用于"没数据时隐藏"）
  emit("data-loaded", { count: 1 });
};
</script>

<template>
  <legacy-form
    mode="simple-add"
    :service="service"
    :srv-app="srvApp"
    @executor-complete="executorComplete"
    @form-loaded="onFormLoaded"
    v-if="service"
  >
  </legacy-form>
</template>

<style scoped lang="scss">
.legacy-form {
  min-height: 400px;
}
</style>
