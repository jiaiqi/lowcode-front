<template>
  <el-select
    v-model="selectedValue"
    placeholder="请选择"
    clearable
    @change="handleChange"
    @clear="handleClear"
    style="width: 100%"
    class="drop-down"
  >
    <el-option
      v-for="item in optionList"
      :key="item.value"
      :label="item.text"
      :value="item.value"
    />
  </el-select>
</template>

<script>
import cloneDeep from "lodash/cloneDeep";

export default {
  name: "drop-down",
  props: {
    cellData: {
      type: Object,
      default: () => {},
    },
    cellItem: {
      type: Object,
      default: () => {},
    },
    srvApp: {
      type: String,
      default: "",
    },
    value: {
      type: [String, Number],
      default: "",
    },
  },
  data() {
    return {
      list: [],
      selectedValue: null,
      page: this.cellItem?.opt_req_json?.page || {
        pageNo: 1,
        rownumber: 10,
        total: 0,
      },
      loadStatus: "init",
    };
  },
  computed: {
    labelKey() {
      return this.cellItem?.opt_label_col || "label";
    },
    valueKey() {
      return this.cellItem?.opt_value_col || "value";
    },
    optReq() {
      try {
        let req = null;
        if (this.cellItem?.part_opt_src === "接口请求") {
          req = cloneDeep(this.cellItem?.opt_req_json || {});
          if (Array.isArray(req.condition) && req.condition.length) {
            const row = { ...this.cellData };
            req.condition = req.condition.map((item) => {
              return {
                ...item,
                value: this.evalCondValue
                  ? this.evalCondValue(item.value, row)
                  : item.value,
              };
            });
          }
          req.page = this.page;
        }
        return req;
      } catch (error) {
        console.warn("Error creating option request:", error);
        return null;
      }
    },
    optionList() {
      try {
        let opt_list = [];
        if (this.cellItem?.part_opt_src === "模拟数据") {
          let mock_srv_data_json = this.cellItem?.opt_mock_data || [];
          if (Array.isArray(mock_srv_data_json) && mock_srv_data_json.length) {
            opt_list = mock_srv_data_json;
          }
        } else {
          opt_list = this.list || [];
        }
        return opt_list.map((item) => ({
          text: item[this.labelKey],
          value: item[this.valueKey],
        }));
      } catch (error) {
        console.warn("Error creating option list:", error);
        return [];
      }
    },
  },
  watch: {
    value: {
      handler(newVal) {
        if (newVal !== this.selectedValue) {
          this.selectedValue = newVal;
        }
      },
      immediate: true,
    },
  },
  methods: {
    fetchData() {
      if (!this.optReq || !this.optReq.serviceName) {
        return;
      }

      try {
        const app =
          this.optReq.mapp ||
          this.srvApp ||
          this.resolveDefaultSrvApp?.() ||
          "";
        const url = `/${app}/select/${this.optReq.serviceName}`;
        this.loadStatus = "loading";

        this.$http
          .post(url, this.optReq)
          .then((res) => {
            try {
              if (res.data.state === "SUCCESS") {
                this.list = Array.isArray(res.data.data) ? res.data.data : [];
                this.page.total = res.data.page?.total || 0;
              }
            } catch (error) {
              console.warn("Error processing response data:", error);
            } finally {
              this.loadStatus = "loaded";
            }
          })
          .catch((error) => {
            console.warn("Error fetching dropdown data:", error);
            this.loadStatus = "error";
          });
      } catch (error) {
        console.warn("Error initiating data fetch:", error);
        this.loadStatus = "error";
      }
    },
    handleClear() {
      try {
        this.selectedValue = null;
        this.$emit("update:value", null);
        this.$emit("change", null);
      } catch (error) {
        console.warn("Error emitting clear event:", error);
      }
    },
    handleChange(value) {
      try {
        // 通知父组件更新变量值
        this.$emit("update:value", value);
        this.$emit("change", value);
      } catch (error) {
        console.warn("Error emitting change event:", error);
      }
    },
  },
  created() {
    try {
      if (this.cellItem?.part_opt_src === "接口请求") {
        this.fetchData();
      }
      if (this.value) {
        this.selectedValue = this.value;
      }
    } catch (error) {
      console.warn("Error initializing dropdown component:", error);
    }
  },
};
</script>

<style lang="scss" scoped>
.drop-down {
  &.el-select {
    width: 100%;
    height: 100%;
    line-height: 100%;
    ::v-deep .el-input {
      width: 100%;
      height: 100%;
      line-height: 100%;
      color: currentColor;
      .el-input__icon{
        line-height: 100%;
      }
      .el-input__inner {
        background-color: transparent;
        border: none;
        padding-left: 10px;
        width: 100%;
        height: 100%;
        line-height: 100%;
        color: currentColor;
      }
    }
  }
}
</style>