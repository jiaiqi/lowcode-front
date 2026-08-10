<template>
  <engine-view-proxy v-bind="$attrs" v-on="$listeners">
    <template v-for="slotName in Object.keys($slots)" :slot="slotName">
      <slot :name="slotName" />
    </template>
  </engine-view-proxy>
</template>

<script>
import EngineViewProxy from "./engine/view.vue";

export default {
  name: "LowCodeViewProxy",
  components: {
    EngineViewProxy,
  },
};
</script>
