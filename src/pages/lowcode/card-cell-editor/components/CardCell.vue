<template>
  <card-group-cell
    :cellData="cellData"
    :comColMap="comColMap"
    :cellsLayout="cellsLayout"
    :cardLayout="cardLayout"
    :activeCellLayout="activeCellLayout"
  ></card-group-cell>
</template>

<script>
import cardGroupCell from "@/pages/lowcode/vendor/datav/component/page-item/card-group-cell/card-group-cell.vue";

export default {
  props: {
    cardCell: {
      type: Object,
    },
  },
  components: {
    cardGroupCell,
  },
  computed: {
    cellsLayout() {
      let jsonStr = this.cardCell?.row_json;
      if(jsonStr && typeof jsonStr === "string") {
        return [JSON.parse(jsonStr)];
      }
      return [];
    }
  },
  data() {
    return {
      // 预览数据相关字段
      cellData: [],
      comColMap: null,
      cardLayout: {},
      activeCellLayout: {},
    };
  },
};
</script>

<style lang="scss" scoped></style>
