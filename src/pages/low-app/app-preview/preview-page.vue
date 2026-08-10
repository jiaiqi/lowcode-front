<template>
  <mobile-preview-proxy v-bind="$attrs" v-on="$listeners">
    <template v-for="slotName in Object.keys($slots)" :slot="slotName">
      <slot :name="slotName" />
    </template>
  </mobile-preview-proxy>
</template>

<script>
import MobilePreviewProxy from "@/pages/lowcode/preview/mobile/preview-page.vue";

export default {
  name: "PreviewPageProxy",
  components: {
    MobilePreviewProxy,
  },
};
</script>