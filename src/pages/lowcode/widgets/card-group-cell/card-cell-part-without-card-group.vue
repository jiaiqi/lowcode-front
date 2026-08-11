<template>
  <card-cell-part
    :cell-item="cellItem"
    :cell-item-data="cellData"
    :cell-data="allCellData"
    :query-options="queryOptions"
    :page-params-model="pageParamsModel"
    @on-click-cell="onClickCell"
    :pageItem="pageItem"
    @refresh-component="$emit('refresh-component')"
  ></card-cell-part>
</template>

<!-- 不依赖卡片组的卡片部件 -->
<script>
import cloneDeep from "lodash/cloneDeep.js";
import cardCellPart from "./card-cell-part.vue";
export default {
  name: "card-cell-part-without-card-group",
  components: {
    cardCellPart,
  },
  data() {
    return {
      cellData: null,
      allCellData: null,
    };
  },
  props: {
    pageItem: {
      type: Object,
      default: () => {
        return {};
      },
    },
    cellItem: {
      type: Object,
      default: () => {
        return {};
      },
    },
    cellItemData: {
      type: Object,
      default: () => {
        return {};
      },
    },
    queryOptions: {
      type: Object,
      default: () => {
        return {};
      },
    },
    pageParamsModel: {
      type: Object,
      default: () => {
        return {};
      },
    },
  },
  computed: {
    srvReq() {
      return this.pageItem?.srv_req_json || {};
    },
  },
  methods: {
    onClickCell(cell) {
      // if (cell?.cellsLayout?.jump_json?.page_auth_json) {
      //   // 执行自定义跳转
      //   this.jumpAction(cell?.cellsLayout?.jump_json, cell.data);
      //   return;
      // }
      // let pageNo = "";
      // if (cell && cell.cellsLayout && cell.cellsLayout.jump_json) {
      //   pageNo = cell.cellsLayout?.jump_json?.dest_page_no;
      //   let path = "";
      //   if (cell.cellsLayout.jump_json?.tmpl_page_json.file_path) {
      //     path = `${cell.cellsLayout.jump_json?.tmpl_page_json.file_path}?page_no=${pageNo}`;
      //   } else {
      //     path = `/views/custom/index/index?page_no=${pageNo}`;
      //   }
      //   const colsMapJson =
      //     cell?.cellsLayout?.jump_json?.cols_map_json?.cols_map_detail_json ||
      //     [];
      //   if (colsMapJson?.length) {
      //     let data = {
      //       ...cell?.cellsLayout,
      //       ...(cell?.data || []),
      //     };
      //     colsMapJson.forEach((item) => {
      //       if (
      //         item.to_type === "URL" &&
      //         item.from_type === "当前数据" &&
      //         data[item.col_from]
      //       ) {
      //         path += `&${item.col_to}=${data[item.col_from]}`;
      //       } else if (
      //         item.to_type === "URL" &&
      //         item.from_type === "页面" &&
      //         this.queryOptions[item.col_from]
      //       ) {
      //         path += `&${item.col_to}=${
      //           this.queryOptions[item.col_from]
      //         }`;
      //       } else if (
      //         item.to_type === "URL" &&
      //         item.from_type !== "当前数据" &&
      //         item.col_from &&
      //         item.col_to
      //       ) {
      //         let val = this.renderStr(item.col_from, {
      //           data,
      //         });
      //         if (val) {
      //           path += `&${item.col_to}=${val}`;
      //         }
      //       }
      //     });
      //   }
      //   if (
      //     cell &&
      //     cell.hasOwnProperty("data") &&
      //     cell.data.hasOwnProperty("id")
      //   ) {
      //     // 如果有行数据默认携带 id
      //     if (path.indexOf("?") == -1) {
      //       path = `${path}?id=${cell.data.id}`;
      //     } else {
      //       path = `${path}&id=${cell.data.id}`;
      //     }
      //   }
      //   if (pageNo) {
      //     this.navToPath(path);
      //   }
      // }
    },
    async getData() {
      let req = this.srvReq;
      let reqType = this.pageItem.srv_req_type;
      if (reqType === "模拟数据") {
        let mock_srv_data_json = this.pageItem?.mock_srv_data_json || [];
        if (Array.isArray(mock_srv_data_json) && mock_srv_data_json.length) {
          this.cellData = mock_srv_data_json[0];
        }
      } else if (req.serviceName) {
        let condition = cloneDeep(req.condition || []);
        const globalParams = {
          ...this.queryOptions,
        };
        condition = condition.map((cond) => {
          if (
            cond &&
            condModel.value &&
            condModel.value.indexOf("${") !== -1 &&
            condModel.value.indexOf("}") !== -1 &&
            params
          ) {
            if (
              this.renderStr(condModel.value, globalParams) &&
              this.renderStr(condModel.value, globalParams).indexOf(
                "[object"
              ) == -1
            ) {
              condModel.value = this.renderStr(condModel.value, globalParams);
            } else {
              let key = condModel.value;
              var sreg = new RegExp("\\${", "g"); // 加'g'，删除字符串里所有的"a"
              var ereg = new RegExp("\}", "g"); // 加'g'，删除字符串里所有的"a"
              key = key.replace(sreg, "");
              key = key.replace(ereg, "");
              condModel.value =
                params && params.hasOwnProperty(key) ? params[key] : "";
              if (condModel.value?.value) {
                condModel.value = condModel.value.value;
              }
            }
          }
        });
        let res = await this.select(
          req.serviceName,
          condition,
          null,
          null,
          null,
          null,
          req.mapp
        );
        if (res.data.state !== "FAILURE" && res.data.data.length > 0) {
          this.cellData = res.data.data[0];
          this.allCellData = res.data.data;
        } else {
        }
      }
    },
  },
  created() {
    if (this.cellItemData) {
      this.cellData = this.cellItemData;
    } else {
      this.getData();
    }
  },
};
</script>

<style lang="scss" scoped></style>
