<template>
  <div class="descriptions-list-wrap">
    <div class="custom-loading" v-if="loading">
      <div class="loading-spinner">
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
      </div>
      <div class="loading-text">数据加载中...</div>
    </div>
    <div
      v-else-if="!currentData || Object.keys(currentData).length === 0"
      class="empty-data"
    >
      暂无数据
    </div>
    <div
      v-else
      class="descriptions-list"
      :class="[sizeClass, { 'word-wrap-enabled': wordWrapEnabled }]"
      :style="[setStyle]"
    >
      <el-descriptions
        :column="column"
        :border="border"
        :direction="direction"
        :colon="showColon"
        :label-style="labelStyle"
        :content-style="contentStyle"
      >
        <el-descriptions-item
          v-for="(col, index) in descriptionCols"
          :key="index"
          :label="col.label"
          :span="col.span || 1"
        >
          <template v-if="col.type === 'image'">
            <el-image
              :src="getImagePath(currentData[col.field])"
              :style="col.imageStyle || { width: '60px', height: '60px' }"
              fit="cover"
              v-if="currentData[col.field]"
            />
            <span v-else>-</span>
          </template>
          <template v-else-if="col.type === 'link'">
            <a
              :href="currentData[col.field]"
              target="_blank"
              class="desc-link"
              v-if="currentData[col.field]"
              >{{ currentData[col.field] }}</a
            >
            <span v-else>-</span>
          </template>
          <template v-else-if="col.type === 'tag'">
            <el-tag
              :type="getTagType(currentData[col.field], col)"
              v-if="
                currentData[col.field] !== undefined &&
                currentData[col.field] !== null &&
                currentData[col.field] !== ''
              "
              >{{ formatValue(currentData[col.field], col) }}</el-tag
            >
            <span v-else>-</span>
          </template>
          <div v-else class="cell-item">
            {{ formatValue(currentData[col.field], col) || "-" }}
          </div>
        </el-descriptions-item>
      </el-descriptions>
    </div>
  </div>
</template>

<script>
import { formatStyleData } from "@/pages/lowcode/vendor/datav/common/index.js";
import { $http } from "@/common/http";
import pageItemComponentMixin from "@/pages/lowcode/mixins/pageItemComponentMixin.js";
import { getDateByKey, getDateKeys } from "@/common/date_util";

export default {
  name: "DescriptionsList",
  mixins: [pageItemComponentMixin],
  props: {
    pageItem: {
      type: Object,
      default: () => ({}),
    },
    pageParamsModel: {
      type: Object,
      default: () => ({}),
    },
    queryOptions: {
      type: Object,
      default: () => ({}),
    },
    data: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      tableData: [],
      loading: false,
      loaded: false,
    };
  },
  computed: {
    listConfig() {
      return this.pageItem?.list_json || {};
    },
    descConfig() {
      return (
        this.pageItem?.desc_list_json ||
        this.pageItem?.row_json_data ||
        this.pageItem?.row_json ||
        this.listConfig ||
        {}
      );
    },
    wordWrapEnabled() {
      return this.descConfig?.word_wrap === "是";
    },
    currentData() {
      if (this.data && Object.keys(this.data).length > 0) {
        return this.data;
      }
      return this.tableData[0] || {};
    },
    sizeClass() {
      const size = this.getConfigValue("size") || "默认";
      const sizeMap = {
        默认: "",
        中: "size-medium",
        小: "size-small",
        超小: "size-mini",
      };
      return sizeMap[size] || "";
    },
    border() {
      return this.getConfigValue("show_border") === "是";
    },
    borderColor() {
      return this.getConfigValue("border_color") || "#ebeef5";
    },
    column() {
      return parseInt(this.getConfigValue("column")) || 3;
    },
    direction() {
      const dir = this.getConfigValue("direction") || "水平";
      return dir === "垂直" ? "vertical" : "horizontal";
    },
    showColon() {
      return this.getConfigValue("show_colon") === "是";
    },
    labelStyle() {
      let styleJson =
        this.getConfigValue("label_style_json") ||
        this.getConfigValue("label_style_json_data") ||
        {};
      let style = {};
      if (styleJson && typeof styleJson === "string") {
        try {
          style = JSON.parse(styleJson);
        } catch (e) {
          style = {};
        }
      } else if (styleJson && typeof styleJson === "object") {
        style = { ...styleJson };
      }
      if (this.border && this.borderColor) {
        style.borderRight = `1px solid ${this.borderColor}`;
        style["--border-color"] = this.borderColor;
      }
      return formatStyleData(style);
    },
    contentStyle() {
      let styleJson =
        this.getConfigValue("content_style_json") ||
        this.getConfigValue("content_style_json_data") ||
        {};
      let style = {
        flex: "1",
      };
      if (styleJson && typeof styleJson === "string") {
        try {
          style = JSON.parse(styleJson);
        } catch (e) {
          style = {};
        }
      } else if (styleJson && typeof styleJson === "object") {
        style = { ...styleJson };
      }
      if (this.border && this.borderColor) {
        style.borderRight = `1px solid ${this.borderColor}`;
        style["--border-color"] = this.borderColor;
      }
      if (this.wordWrapEnabled) {
        style.whiteSpace = "normal";
        style.wordBreak = "break-all";
        style.overflow = "visible";
        style.maxWidth = "none";
      } else {
        style.whiteSpace = "nowrap";
        style.overflow = "hidden";
        style.textOverflow = "ellipsis";
        style.maxWidth = "100%";
      }
      return formatStyleData(style);
    },
    descriptionCols() {
      let cols = this.getConfigValue("descriptions_cols");
      let cnCols = this.getConfigValue("descriptions_cn_cols");
      let cnLabels = [];

      if (cnCols && typeof cnCols === "string") {
        cnLabels = cnCols.split(",").map((s) => s.trim());
      } else if (Array.isArray(cnCols)) {
        cnLabels = cnCols;
      }

      if (Array.isArray(cols)) {
        return cols.map((col, index) => {
          if (typeof col === "object") {
            return {
              ...col,
              label:
                cnLabels[index] !== undefined && cnLabels[index] !== ""
                  ? cnLabels[index]
                  : col.label || col.field,
            };
          }
          return {
            label: cnLabels[index] !== undefined ? cnLabels[index] : col,
            field: col,
            span: 1,
            type: "text",
          };
        });
      }
      if (typeof cols === "string") {
        if (cols.startsWith("[")) {
          try {
            const parsed = JSON.parse(cols);
            return parsed.map((col, index) => {
              if (typeof col === "object") {
                return {
                  ...col,
                  label:
                    cnLabels[index] !== undefined && cnLabels[index] !== ""
                      ? cnLabels[index]
                      : col.label || col.field,
                };
              }
              return {
                label: cnLabels[index] !== undefined ? cnLabels[index] : col,
                field: col,
                span: 1,
                type: "text",
              };
            });
          } catch (e) {
            return [];
          }
        }
        const fields = cols.split(",").map((s) => s.trim());
        return fields.map((field, index) => ({
          label:
            cnLabels[index] !== undefined && cnLabels[index] !== ""
              ? cnLabels[index]
              : field,
          field: field,
          span: 1,
          type: "text",
        }));
      }
      return [];
    },
    setStyle() {
      let result = {};
      if (this.border && this.borderColor) {
        result["--desc-border-color"] = this.borderColor;
      }
      return result;
    },
    colsMapDetailJson() {
      const pageComColsMapJson = this.pageItem?.page_com_cols_map_json || null;
      let colsMapDetailJson = null;
      if (pageComColsMapJson) {
        if (
          pageComColsMapJson.cols_map_detail_json &&
          Array.isArray(pageComColsMapJson.cols_map_detail_json)
        ) {
          colsMapDetailJson = pageComColsMapJson.cols_map_detail_json;
        }
      }
      return colsMapDetailJson;
    },
  },
  methods: {
    getConfigValue(key) {
      if (this.pageItem && this.pageItem[key] !== undefined) {
        return this.pageItem[key];
      }
      if (
        this.pageItem?.desc_list_json &&
        this.pageItem.desc_list_json[key] !== undefined
      ) {
        return this.pageItem.desc_list_json[key];
      }
      if (
        this.pageItem?.row_json_data &&
        this.pageItem.row_json_data[key] !== undefined
      ) {
        return this.pageItem.row_json_data[key];
      }
      if (
        this.pageItem?.row_json &&
        this.pageItem.row_json[key] !== undefined
      ) {
        return this.pageItem.row_json[key];
      }
      if (this.listConfig && this.listConfig[key] !== undefined) {
        return this.listConfig[key];
      }
      return null;
    },
    formatValue(value, col) {
      if (value === null || value === undefined || value === "") {
        return "";
      }
      if (col.formatter) {
        try {
          const fn = new Function("value", "row", col.formatter);
          return fn(value, this.currentData);
        } catch (e) {
          return value;
        }
      }
      if (col.enumMap && col.enumMap[value]) {
        return col.enumMap[value];
      }
      return value;
    },
    getTagType(value, col) {
      if (col.tagTypeMap && col.tagTypeMap[value]) {
        return col.tagTypeMap[value];
      }
      return "";
    },
    getImagePath(path) {
      if (!path) return "";
      if (
        path.startsWith("http") ||
        path.startsWith("//") ||
        path.startsWith("data:")
      ) {
        return path;
      }
      const baseUrl = window.location.origin;
      if (path.startsWith("/")) {
        return baseUrl + path;
      }
      return baseUrl + "/" + path;
    },
    async refresh() {
      if (this.data && Object.keys(this.data).length > 0) {
        return;
      }
      let itemReqJson = this.pageItem?.srv_req_json
        ? this.bxDeepClone(this.pageItem.srv_req_json)
        : null;
      if (itemReqJson) {
        const req = this.buildRequestParams(itemReqJson);
        await this.getListData(req);
      }
    },
    buildRequestParams(e) {
      let condition = this.bxDeepClone(e.condition);
      let mapsJonss = this.colsMapDetailJson || [];

      if (Array.isArray(condition)) {
        for (let cond of condition) {
          if (cond.var_src === "页面接口参数") {
            const value_key = cond.value;
            delete cond.var_src;
            delete cond.value;
            if (
              this.pageParamsModel &&
              typeof this.pageParamsModel === "object" &&
              value_key &&
              this.pageParamsModel[value_key]?.value
            ) {
              cond.value = this.pageParamsModel[value_key].value;
            }
          } else if (
            cond.value &&
            cond.value.startsWith("${") &&
            cond.value.endsWith("}")
          ) {
            let par = cond.value.replace("${", "");
            par = par.replace("}", "");
            let params = this.bxDeepClone(this.pageParamsModel);
            if (params && Object.keys(params).length > 0) {
              for (let key in params) {
                if (key === par) {
                  let mapsCol = mapsJonss.filter(
                    (item) => item.col_to === par || item.col_from === par
                  );
                  if (Array.isArray(mapsCol) && mapsCol.length > 0) {
                    for (let col of mapsCol) {
                      switch (col.from_type) {
                        case "页面":
                          switch (col.to_type) {
                            case "组件":
                              cond.value = this.pageParamsModel[key].value;
                              if (
                                cond.value === undefined &&
                                cond.ruleType === "eq"
                              ) {
                                cond.ruleType = "like";
                              }
                              break;
                            default:
                              break;
                          }
                          break;
                        default:
                          break;
                      }
                    }
                  }
                }
              }
            }
          }
          if (
            typeof cond.value === "string" &&
            getDateKeys().includes(cond.value)
          ) {
            cond.value = getDateByKey(cond.value);
          }

          if (Array.isArray(cond.value) && cond.value.length === 2) {
            cond.ruleType = "between";
          }
        }
      }
      e.condition = this.bxDeepClone(condition);
      if (!e.page) {
        e.page = {
          pageNo: 1,
          rownumber: 1,
        };
      }
      return e;
    },
    async getListData(req) {
      const url = `/${req.mapp}/select/${req.serviceName}`;
      if (Array.isArray(req.condition) && req.condition.length) {
        const data = Object.keys(this.pageParamsModel).reduce((res, key) => {
          res[key] = this.pageParamsModel[key]?.value;
          return res;
        }, {});
        req.condition.forEach((item) => {
          item.value = this.renderStr(item.value, data);
        });
      }
      this.loading = true;
      try {
        const res = await $http.post(url, req);
        this.loading = false;
        this.loaded = true;

        if (res.data.state === "SUCCESS") {
          this.tableData = res.data.data || [];
        }
      } catch (error) {
        this.loading = false;
        console.error("描述列表数据加载失败:", error);
      }
    },
  },
  mounted() {
    if (this.data && Object.keys(this.data).length > 0) {
      return;
    }
    let mockData =
      this.getConfigValue("mock_data_json") ||
      this.getConfigValue("mock_data_json_data");
    if (typeof mockData === "string") {
      try {
        mockData = JSON.parse(mockData);
      } catch (error) {
        console.error("描述列表数据加载失败:", error);
        mockData = [];
      }
    }
    if (this.pageItem?.srv_req_type !== "请求数据" && mockData) {
      this.tableData = mockData || [];
    } else if (
      this.pageItem?.srv_req_type === "请求数据" &&
      this.pageItem?.srv_req_json
    ) {
      let itemReqJson = this.pageItem.srv_req_json
        ? this.bxDeepClone(this.pageItem.srv_req_json)
        : null;
      if (itemReqJson) {
        itemReqJson.page = { pageNo: 1, rownumber: 1 };
        const req = this.buildRequestParams(itemReqJson);
        this.getListData(req);
      }
    } else {
      console.error("描述列表数据加载失败: 请检查请求参数");
    }
  },
};
</script>

<style lang="scss" scoped>
.descriptions-list-wrap {
  width: 100%;
  height: unset;
  min-height: 60px;
}
::v-deep.descriptions-list .el-descriptions__body {
  background-color: transparent;
  overflow: hidden;
  .el-descriptions-item__cell {
    width: 10px;
    border-color: var(--border-color, transparent);
  }
  .el-descriptions-item__label.is-bordered-label {
    background-color: transparent;
  }

  .cell-item {
    width: 100%;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1; /* 单行可改为多行 */
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-all;
  }
}
.empty-data {
  width: 100%;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
}

.descriptions-list {
  width: 100%;

  :deep(.el-descriptions) {
    // .el-descriptions-row {
    //   display: flex;
    //   max-width: 100%;
    //   overflow: hidden;
    // }
    .el-descriptions__label {
      font-weight: 500;
    }
    .el-descriptions-item__content{
      width: unset;
    }
    // .el-descriptions__content{
    //   flex: 1;
    // }
    // .el-descriptions__content,
    // .el-descriptions-item__content {
    //   word-break: break-all;
    //   flex: 1;
    //   min-width: 0;
    // }
  }

  // &:not(.word-wrap-enabled) {
  //   :deep(.el-descriptions__content),
  //   :deep(.el-descriptions-item__content) {
  //     display: block;
  //     max-width: 100%;
  //     overflow: hidden;
  //     text-overflow: ellipsis;
  //     white-space: nowrap;
  //   }
  // }

  // &.word-wrap-enabled {
  //   :deep(.el-descriptions__content),
  //   :deep(.el-descriptions-item__content) {
  //     white-space: normal;
  //     word-break: break-all;
  //   }
  // }

  &.size-medium {
    :deep(.el-descriptions) {
      .el-descriptions__label,
      .el-descriptions__content {
        padding: 8px 10px;
        font-size: 14px;
      }
    }
  }

  &.size-small {
    :deep(.el-descriptions) {
      .el-descriptions__label,
      .el-descriptions__content {
        padding: 6px 8px;
        font-size: 13px;
      }
    }
  }

  &.size-mini {
    :deep(.el-descriptions) {
      .el-descriptions__label,
      .el-descriptions__content {
        padding: 4px 6px;
        font-size: 12px;
      }
    }
  }

  :deep(.el-descriptions--border) {
    .el-descriptions__label,
    .el-descriptions__content {
      border-color: var(--desc-border-color, #ebeef5);
    }
  }

  .desc-link {
    color: var(--primary-color, #409eff);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.custom-loading {
  position: relative;
  width: 100%;
  min-height: 60px;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-spinner {
  position: relative;
  width: 40px;
  height: 40px;
  margin-bottom: 10px;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1.5s linear infinite;
}

.spinner-ring:nth-child(1) {
  border-top-color: #3498db;
  animation-delay: 0s;
}

.spinner-ring:nth-child(2) {
  border-top-color: #e74c3c;
  animation-delay: -0.5s;
  width: 80%;
  height: 80%;
  top: 10%;
  left: 10%;
}

.spinner-ring:nth-child(3) {
  border-top-color: #f39c12;
  animation-delay: -1s;
  width: 60%;
  height: 60%;
  top: 20%;
  left: 20%;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: #666;
  font-size: 12px;
}
</style>
