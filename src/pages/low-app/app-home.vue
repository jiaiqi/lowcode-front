<template>
  <mobile-editor-proxy v-bind="$attrs" v-on="$listeners">
    <template v-for="slotName in Object.keys($slots)" :slot="slotName">
      <slot :name="slotName" />
    </template>
  </mobile-editor-proxy>
</template>

<script>
import MobileEditorProxy from "@/pages/lowcode/editor/mobile/app-home.vue";

export default {
  name: "AppHomeProxy",
  components: {
    MobileEditorProxy,
  },
};
</script>