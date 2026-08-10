<template>
  <!-- <div style="width:100px;height:100px;background:#fff;"> -->
  <cardGroupCell
    :key="pageItem.com_no"
    :query-options="queryOptions"
    :page-params-model="pageParamsModel"
    ref="cardGroupCell"
    :pageItem="pageItem"
    :cellsLayout="cellsLayoutJson"
    :cellData="cellData"
    :comColMap="comColMapRun"
    :cardLayout="cardLayoutJson || null"
    @on-click-cell="onClickCell"
    @on-click-block="onClickBlock"
    @on-click-icon="onClickBlock"
    @data-updated="onDataUpdate"
    @refresh-component="refresh"
    @close-popup="$emit('close-popup')"
    v-loading="loading"
    v-if="cellsLayoutJson && cellsLayoutJson.length"
  ></cardGroupCell>
  <div v-else-if="pageItem && pageItem.com_label">
    {{ pageItem.com_label }}
  </div>
  <!-- </div> -->
</template>

<script>
import { getDateByKey, getDateKeys } from "@/common/date_util";

import pageItemComponentMixin from "@/pages/lowcode/engine/pageItemComponentMixin.js";
import cardGroupCell from "../card-group-cell/card-group-cell.vue";
import cardPopup from "./card-popup.vue";
export default {
  data() {
    return {
      cellData: [],
      loading: false,
    };
  },
  components: {
    cardGroupCell,
    cardPopup,
  },
  mixins: [pageItemComponentMixin],
  props: {
    queryOptions: Object,
    pageParamsModel: Object,
    pageItem: {
      type: Object,
      default: function () {
        return null;
      },
    },
  },
  computed: {
    // comColMapRun: function () {
    //   let json =
    //     this.pageItem?.com_srv_col_map_json || this.pageItem?.cols_map_json;
    //   if (this.pageItem.hasOwnProperty("cols_map_json")) {
    //     // if(this.pageItem?.cols_map_json.hasOwnProperty('cols_map_json')){
    //     // 	json = this.pageItem?.cols_map_json?.cols_map_json
    //     // 	// return json
    //     // }
    //   }
    //   let maps = this.paramsBuild(json)?.target?.com || {};
    //   return maps || {};
    // },

    cardLayoutJson: function () {
      let json = this.pageItem?.card_group_json?.card_layout_json || {};
      return json;
    },
    datasfromType: function () {
      let cfgfrom = this.pageItem?.srv_req_type;
      switch (cfgfrom) {
        case "模板动态加载":
          return this.pageItem?.srv_req_type;
          break;
        default:
          break;
      }
      return cfgfrom;
    },
    fromType: function () {
      let cfgfrom = this.pageItem.card_unit_cfg_from || "静态配置";
      return cfgfrom;
    },
    cellsLayoutJson: function () {
      let cfgfrom = this.pageItem.card_unit_cfg_from;
      let cells = [];
      switch (cfgfrom) {
        case "静态配置":
        case "静态自有配置":
          cells =
            this.pageItem?.card_unit_merge_json ||
              this.pageItem?.card_group_json?.card_unit_json
              ? [this.pageItem?.card_group_json?.card_unit_json]
              : [];
          break;
        case "模板动态加载":
          cells = this.pageItem?.card_group_json?.card_unit_json
            ? [this.pageItem?.card_group_json?.card_unit_json]
            : [];
          break;
        default:
          cells =
            this.pageItem?.card_unit_merge_json ||
              this.pageItem?.card_group_json?.card_unit_json
              ? [this.pageItem?.card_group_json?.card_unit_json]
              : [];
          break;
      }
      return cells;
    },
  },
  mounted() {
    this.getDatas();
  },
  watch: {
    getAllPageVariables: {
      deep: true,
      handler: function () {
        this.getDatas();
      },
    },
  },
  methods: {
    navToPath(path) {
      console.log(path);
    },
    onClickCell(cell) {
      console.log(cell, "clickCell----------\r\n");
      if (cell?.cellsLayout?.jump_json?.dest_page_no) {
        // 执行自定义跳转
        this.jumpAction(cell?.cellsLayout?.jump_json, cell.data);
        return;
      }
    },
    onClickBlock(cell) {
      if (cell?.cellsLayout?.jump_json?.dest_page_no) {
        // 执行自定义跳转
        this.jumpAction(cell?.cellsLayout?.jump_json, cell.data);
        return;
      }
    },
    onDataUpdate() {
      this.refresh();
      console.log("clear-pageInstance:onDataUpdate");
      this.$store.commit("SET_PAGE_INSTANCE", null);
    },
    refresh() {
      this.getDatas();
    },
    async getDatas() {
      let req = this.calcSrvReq?.() ||  this.srvReq;
      let datasfromType = this.datasfromType;
      try {
        if (datasfromType === "模拟数据") {
          let mock_srv_data_json = this.pageItem?.mock_srv_data_json || [];
          this.cellData = mock_srv_data_json.map((item) => item);
          this.$emit("data-loaded", { count: this.cellData.length });
        } else if (req.serviceName) {
          const { condition, page, order, group } = req;
          this.loading = true;

          const res = await this.select(
            req.serviceName,
            condition,
            page,
            order,
            group,
            null,
            req.mapp
          );
          this.loading = false;

          if (res.data.state !== "FAILURE" && res.data.data.length > 0) {
            this.cellData = res.data.data;
            this.$emit("data-loaded", { count: this.cellData.length });
          } else {
            this.cellData = [];
            console.log(res);
            this.$emit("data-loaded", { count: 0 });
          }
        } else {
          this.cellData = [];
          this.$emit("data-loaded", { count: 0 });
        }
      } catch (error) {
        console.error("card-group getDatas error:", error);
        this.cellData = [];
        this.$emit("data-loaded", { count: 0 });
      }
    },
    calcSrvReq: function () {
      let params = this.componentParamsModels ? this.bxDeepClone(this.componentParamsModels) : {};

      if (this.pageParamsModel && typeof this.pageParamsModel === 'object') {
        params = {
          ...this.deepClone(this.pageParamsModel),
          ...params
        }
      }

      // 同步页面变量到组件参数
      const allPageVariables = this.getAllPageVariables || {};
      if (this.pageCompVarMap && typeof this.pageCompVarMap === 'object' && this.queryOptions && typeof this.queryOptions === 'object') {
        Object.keys(params).forEach((key) => {
          const comCol = this.pageCompVarMap[key];
          const pageVarValue = this.queryOptions[comCol] !== undefined ? this.queryOptions[comCol] : allPageVariables[comCol];
          if (comCol && pageVarValue !== undefined && params[key] && typeof params[key] === 'object' && 'value' in params[key] && params[key].value !== pageVarValue) {
            params[key].value = pageVarValue;
          }
        });
      }
      // let page = this.bxDeepClone(this.page)
      let req = this.bxDeepClone(this.pageItem?.srv_req_json) || {}
      let conds = []
      let userInfo = sessionStorage.getItem('login_user_info') || sessionStorage.getItem('current_login_user')
      if (userInfo) {
        try {
          userInfo = JSON.parse(userInfo)
        } catch (e) {
          userInfo = null
          console.error('解析用户信息失败', e)
        }
      }
      const globalParams = {
        ...params,
        ...allPageVariables||{},
        user: userInfo,
        user_no: userInfo?.user_no || '',
        userInfo: userInfo || '',
      }

      if (req.hasOwnProperty('condition') && req.condition.length > 0) {
        for (let cond of req.condition) {
          try {
            let condModel = this.bxDeepClone(cond)
            if (cond.var_src === '页面接口参数') {
              cond.value_key = cond.value;
              // 页面接口参数 从页面参数中取值
              delete condModel.var_src;
              delete condModel.value;
              if (this.pageParamsModel && typeof this.pageParamsModel === 'object' && cond.value_key && this.pageParamsModel[cond.value_key]?.value) {
                condModel.value = this.pageParamsModel[cond.value_key].value;
              }
            } else if (cond && condModel.value && condModel.value.indexOf('${') !== -1 && condModel.value.indexOf('}') !== -
              1 && params) {
              try {
                const renderedValue = this.renderStr(condModel.value, globalParams);
                if (renderedValue && renderedValue.indexOf('[object') == -1) {
                  condModel.value = renderedValue
                } else {
                  let key = condModel.value
                  var sreg = new RegExp("\\${", "g"); // 加'g'，删除字符串里所有的"a"
                  var ereg = new RegExp("\\}", "g"); // 加'g'，删除字符串里所有的"a"
                  key = key.replace(sreg, "");
                  key = key.replace(ereg, "");
                  console.log('--srvReq', params, key)
                  condModel.value = params && params.hasOwnProperty(key) ? params[key] : ""
                  if (condModel.value?.value) {
                    condModel.value = condModel.value.value
                  }
                }
              } catch (renderError) {
                console.warn('Error rendering condition value:', renderError);
              }

            }

            // 日期关键词 转换为对应的时间字符
            if (typeof condModel.value === 'string' && getDateKeys().includes(condModel.value)) {
              condModel.value = getDateByKey(condModel.value);
            }

            if (Array.isArray(condModel.value) && condModel.value.length === 2) {
              // 范围查询 ruleType改为between
              condModel.ruleType = 'between'
            }

            conds.push(this.bxDeepClone(condModel))

          } catch (condError) {
            console.error();
            console.warn('Error processing condition:', condError);
            // 出错时添加原始条件，避免请求失败
            conds.push(this.deepClone(cond));
          }


        }
        req.condition = conds.map(item => item)
      }
      let type = this.comType
      switch (type) {
        case 'list':
          break;
        default:
          break;
      }

      return req
    },
  },
  created() { },
};
</script>

<style lang="scss">
.u-wrap {
  background-color: transparent !important;
}
</style>