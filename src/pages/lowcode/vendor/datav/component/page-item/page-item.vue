<template>
  <page-item-widget v-bind="$attrs" v-on="$listeners">
    <template v-for="slotName in Object.keys($slots)" :slot="slotName">
      <slot :name="slotName" />
    </template>
  </page-item-widget>
</template>

<script>
import PageItemWidget from "@/pages/lowcode/widgets/page-item.vue";

export default {
  name: "PageItemProxy",
  components: {
    PageItemWidget,
  },
};
</script>