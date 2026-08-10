<template>
  <div class="chart-wrap">
    <!-- 公共日期筛选组件 -->
    <DateFilter
      :filter-config="chartConfig.date_filter_opt"
      :date-column="dateColumn"
      @filter-change="onDateFilterChange"
      @filter-reset="onDateFilterReset"
      v-if="showDateFilter"
    />
    <!-- 加载状态 -->
    <div class="loading-container" v-if="loading">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <div class="loading-text">数据加载中...</div>
      </div>
    </div>

    <!-- 空数据状态（非地图类型，数据为空时显示） -->
    <div
      class="empty-data-container"
      v-else-if="loaded && cellData.length === 0"
    >
      <div class="empty-data">
        <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <path
              d="M32 8C18.745 8 8 18.745 8 32s10.745 24 24 24 24-10.745 24-24S45.255 8 32 8zm0 44c-11.046 0-20-8.954-20-20s8.954-20 20-20 20 8.954 20 20-8.954 20-20 20z"
              fill="#d9d9d9"
            />
            <path
              d="M32 20c-1.105 0-2 .895-2 2v12c0 1.105.895 2 2 2s2-.895 2-2V22c0-1.105-.895-2-2-2zm0 20c-1.105 0-2 .895-2 2s.895 2 2 2 2-.895 2-2-.895-2-2-2z"
              fill="#d9d9d9"
            />
          </svg>
        </div>
        <div class="empty-text">暂无数据</div>
        <!-- <div class="empty-desc">请检查数据源配置或筛选条件</div> -->
      </div>
    </div>

    <!-- 图表内容 -->
    <div class="chart-content" v-else-if="loaded">
      <SankeyChart
        ref="sankeyChartRef"
        :page-item="pageItem"
        :cell-data="cellData"
        :loading="loading"
        @click-chart="clickChart"
        v-if="chartType === 'sankey'"
      ></SankeyChart>
      <Chart
        ref="chartRef"
        v-loading="loading"
        element-loading-background="rgba(0, 0, 0, 0.1)"
        :page-item="pageItem"
        :options="option"
        :canvasId="canvasId"
        :chartType="chartType"
        :cellData="cellData"
        :customStyle="chartCanvasStyle"
        @click-chart="clickChart"
        v-else-if="option && chartType !== 'liquidFill'"
      ></Chart>
      <LiquidFillChart
        v-else-if="option && chartType == 'liquidFill'"
        :value="liquidValue"
        :color="setLiquidColor"
      ></LiquidFillChart>
    </div>

    <!-- 卡片弹窗 -->
    <div
      class="card-popup-overlay"
      @click="closeCardPopup"
      v-if="showCardPopup && popupCardJson"
    >
      <card-popup
        :cardUnitJson="popupCardJson"
        :data="popupItemData"
        :click-event="clickEvent"
        :placement="popupPlacement"
        @close="closeCardPopup"
        @click.stop
      />
    </div>
  </div>
</template>

<script setup>
import dayjs from "dayjs";
import cloneDeep from "lodash/cloneDeep";

import { computed, watch, onMounted, ref, defineAsyncComponent } from "vue";
import { useUtils } from "@/common/vueApi.js";

// 异步加载 LiquidFillChart 组件
const LiquidFillChart = defineAsyncComponent(() =>
  import(
    /* webpackChunkName: "echarts-vendor" */ "@/pages/lowcode/vendor/datav/component/page-item/LiquidFillChart.vue"
  )
);
// import LiquidFillChart from "@/pages/lowcode/vendor/datav/component/page-item/LiquidFillChart.vue";
import Chart from "./chart.vue";
// import SankeyChart from "./SankeyChart.vue";
const SankeyChart = defineAsyncComponent(() =>
  import(/* webpackChunkName: "echarts-vendor" */ "./SankeyChart.vue")
);
import DateFilter from "./DateFilter.vue";
import cardPopup from "../card-group/card-popup.vue";

import { $select } from "@/common/http.js";
import {
  useBuildOption,
  setDefaultChartOption,
} from "../use-functions/buildOption.js";
import { formatStyleData } from "@/pages/lowcode/vendor/datav/common";
const { renderStr } = useUtils();

const props = defineProps({
  pageItem: Object,
  pageParamsModel: Object,
  layout: Object,
  index: [String, Number],
  canvasId: {
    type: String,
    default: () => {
      return "ec-canvas" + new Date().getTime();
    },
  },
});
function deepClone(obj) {
  if (obj == null) return null;
  let newObj = obj instanceof Array ? [] : {};
  for (var i in obj) {
    newObj[i] = typeof obj[i] == "object" ? deepClone(obj[i]) : obj[i];
  }
  return newObj;
}
const pageItem = props.pageItem;

const mapJson = computed(() => {
  return pageItem?.chart_json?.map_json || {};
}); // 地图配置

let timer = null;
const emit = defineEmits(["clickChart"]);

const option = ref(null);
const loading = ref(false);
const loaded = ref(false);

// 日期筛选状态
const currentDateFilter = ref(null);

const showCardPopup = ref(false);
const popupItemData = ref(null);
const clickEvent = ref(null);
const popupPlacement = ref("上");

const closeCardPopup = () => {
  showCardPopup.value = false;
  popupItemData.value = null;
  clickEvent.value = null;
};
// 点击弹出卡片单元
const popupCardJson = computed(() => {
  return (
    mapJson.value?.onclick === "弹出卡片" && mapJson.value?.tips_card_unit_json
  );
});

const clickChart = (params) => {
  console.log("点击图表-params:", params, cellData.value);
  if (params.type === "series" && typeof params.dataIndex === "number") {
    params.data = cellData.value[params.dataIndex];
    if (params.event?.target) {
      clickEvent.value = params.event;
      popupItemData.value = params.data;
      showCardPopup.value = true;
    }
  }
  emit("clickChart", params);
};

const setLiquidColor = computed(() => {
  const styleJson = pageItem?.style_json || {};
  let style = {};
  if (styleJson) {
    style = formatStyleData(styleJson);
  }
  if (style.color) {
  }
  return style.color;
});
const chartConfig = computed(() => {
  return pageItem?.chart_json || {};
});

const chartCanvasStyle = computed(() => {
  return formatStyleData(chartConfig.value?.chart_style_json || "");
});

const showDateFilter = computed(() => {
  return (
    chartConfig.value?.date_filter_opt &&
    chartConfig.value?.date_filter_opt.date_select_opt &&
    chartConfig.value?.date_filter_opt.col_date_select
  );
});

// 日期筛选字段配置
const dateColumn = computed(() => {
  // 从图表配置中获取日期筛选字段
  const config = chartConfig.value;
  if (config) {
    // 优先从桑基图配置中获取
    if (config.config_sankey?.col_date_select) {
      return config.config_sankey.col_date_select;
    }
    // 从其他图表配置中获取日期字段
    if (config.col_date_select) {
      return config.col_date_select;
    }
    // 从通用配置中获取
    if (config.date_column) {
      return config.date_column;
    }
  }
  return "";
});
const chartType = computed(() => {
  let chartType = "";
  switch (chartConfig.value?.chart_type) {
    case "折线图":
      chartType = "line";
      break;
    case "柱状图":
    case "条形图":
      chartType = "bar";
      break;
    case "饼图":
      chartType = "pie";
      break;
    case "环图":
      chartType = "ring";
      break;
    case "雷达图":
      chartType = "radar";
      break;
    case "组合图":
      chartType = "lineBar";
      break;
    case "地图":
      chartType = "map";
      break;
    case "雷达图":
      chartType = "radar";
      break;
    case "词云图":
      chartType = "wordcloud";
      break;
    case "水球图":
      chartType = "liquidFill";
      break;
    case "桑基图":
      chartType = "sankey";
      break;
    default:
      chartType = "line";
      break;
  }
  return chartType;
});
const colsMapDetailJson = computed(() => {
  // 组件参数 的map array  接口返回数据格式 无法确定接口时啥样子，小程序 逻辑使用com_para_with_map_json 但没值，改用有值的 page_com_cols_map_json
  let pageComColsMapJson = pageItem?.page_com_cols_map_json || null;
  let colsMapDetailJson = null;
  if (pageComColsMapJson) {
    // 识别、处理组件到页面参数联动
    if (
      pageComColsMapJson.cols_map_detail_json &&
      Array.isArray(pageComColsMapJson.cols_map_detail_json)
    ) {
      colsMapDetailJson = pageComColsMapJson.cols_map_detail_json;
    }
  }
  return colsMapDetailJson;
});

const calcSrvReq = computed(() => {
  // req = cloneDeep(req);
  let itemReqJson = pageItem?.srv_req_json
    ? JSON.parse(JSON.stringify(pageItem.srv_req_json))
    : null;
  const req = itemReqJson ? buildRequestParams(itemReqJson) : itemReqJson;
  let params = {};
  if (props.pageParamsModel && typeof props.pageParamsModel === "object") {
    params = {
      ...props.pageParamsModel,
    };
  }

  let conds = [];
  let userInfo =
    sessionStorage.getItem("login_user_info") ||
    sessionStorage.getItem("current_login_user");
  if (userInfo) {
    try {
      userInfo = JSON.parse(userInfo);
    } catch (e) {
      userInfo = null;
      console.error("解析用户信息失败", e);
    }
  }
  const globalParams = {
    ...params,
    user: userInfo,
    user_no: userInfo?.user_no || "",
    userInfo: userInfo || "",
  };

  // 添加日期筛选条件
  if (currentDateFilter.value && dateColumn.value) {
    let cond = {
      colName: dateColumn.value,
      ruleType: "like]",
      value: currentDateFilter.value.selectedDate,
    };
    if (req.condition) {
      req.condition.push(cond);
    } else {
      req.condition = [cond];
    }
    if (allColumns.value.length) {
      let dateFilterGroup = allColumns.value
        .filter((key) => key !== dateColumn.value)
        .map((colName) => {
          return {
            colName,
            type: "by",
          };
        });

      let groupMap = {
        按日: "date",
        按月: "month",
        按年: "year",
      };
      dateFilterGroup.push({
        colName: dateColumn.value,
        type: `by_${groupMap[currentDateFilter.value.type]}`,
      });
      if (req.group) {
        req.group.push(...dateFilterGroup);
      } else {
        req.group = [...dateFilterGroup];
      }
    }
  }

  // 处理原有条件
  if (
    req.hasOwnProperty("condition") &&
    Array.isArray(req.condition) &&
    req.condition.length > 0
  ) {
    for (let cond of req.condition) {
      let condModel = cloneDeep(cond);
      if (
        cond &&
        condModel.value &&
        typeof condModel.value === "string" &&
        condModel.value.indexOf("${") !== -1 &&
        condModel.value.indexOf("}") !== -1 &&
        params
      ) {
        if (
          renderStr(condModel.value, globalParams) &&
          renderStr(condModel.value, globalParams).indexOf("[object") == -1
        ) {
          condModel.value = renderStr(condModel.value, globalParams);
        } else {
          let key = condModel.value;
          var sreg = new RegExp("\\${", "g");
          var ereg = new RegExp("}", "g");
          key = key.replace(sreg, "");
          key = key.replace(ereg, "");
          console.log("--srvReq", params, key);
          condModel.value =
            params && params.hasOwnProperty(key) ? params[key] : "";
          if (condModel.value?.value) {
            condModel.value = condModel.value.value;
          }
        }
      }
      conds.push(cloneDeep(condModel));
    }
  }
  // 配置了日期筛选字段 默认查当天的数据
  if (
    showDateFilter.value &&
    dateColumn.value &&
    !conds?.find((item) => item.colName === dateColumn.value)
  ) {
    conds = conds || [];
    conds.push({
      colName: dateColumn.value,
      ruleType: "eq",
      value: dayjs().format("YYYY-MM-DD"),
    });
  }
  // 设置最终的条件数组
  req.condition = conds.map((item) => item);
  return req;
});
const allColumns = ref([]);
const onSrvReq = async (req = null) => {
  req = req || pageItem?.srv_req_json;
  if (req) {
    req = calcSrvReq.value;
    loading.value = true;
    let res = { ok: false, data: [] };
    try {
      res = await $select(req, req.mapp);
    } catch (error) {
      console.error("Chart data request failed", error);
    }
    loading.value = false;
    loaded.value = true;

    console.log(res);
    const data = res.ok && Array.isArray(res.data) ? res.data : [];
    if (data.length > 0) {
      cellData.value = data;
      allColumns.value = Object.keys(data[0]);
    } else {
      cellData.value = [];
    }
    console.log(pageItem);
    //todo 水球数据只需要传入具体的数字
    setLiquidData();
    option.value = useBuildOption(
      chartType.value,
      pageItem,
      data,
      props.layout
    );
  }
};

const getReqConditionVars = () => {
  const vars = [];
  const req = pageItem?.srv_req_json;
  if (req?.condition && Array.isArray(req.condition)) {
    req.condition.forEach((cond) => {
      if (cond.value && typeof cond.value === "string") {
        const matches = cond.value.match(/\$\{(\w+)\}/g);
        if (matches) {
          matches.forEach((match) => {
            const varName = match.replace(/\$\{|\}/g, "");
            if (!vars.includes(varName)) {
              vars.push(varName);
            }
          });
        }
      }
    });
  }
  return vars;
};

watch(
  () => props.pageParamsModel,
  (newVal, oldVal) => {
    // if (newVal && oldVal && JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
    console.log("paramsLinkage", newVal, oldVal);

    const reqVars = getReqConditionVars();
    if (reqVars.length > 0) {
      // const hasChanged = reqVars.some((varName) => {
      //   const oldValue = oldVal?.[varName]?.value;
      //   const newValue = newVal?.[varName]?.value;
      //   return oldValue !== newValue;
      // });
      // if (hasChanged) {
        paramsLinkage();
      // }
    } else {
      paramsLinkage();
    }
    // }
  },
  { immediate: true, deep: true }
);

const liquidValue = ref(0);
//手动更新水球图数据
const setLiquidData = () => {
  liquidValue.value = cellData.value.length
    ? cellData.value[0].value === "string"
      ? Number(cellData.value[0].value)
      : cellData.value[0].value
    : 0;
};

const useMockData = () => {
  const mockData = chartConfig.value?.mock_data_json || [];
  cellData.value = mockData;
  loaded.value = true;
  option.value = useBuildOption(
    chartType.value,
    pageItem,
    mockData,
    props.layout
  );
};

onMounted(() => {
  if (
    pageItem?.srv_req_type === "模拟数据" &&
    pageItem?.mock_srv_data_json?.length
  ) {
    // 使用模拟数据
    cellData.value = pageItem.mock_srv_data_json;
    loaded.value = true;
    option.value = useBuildOption(
      chartType.value,
      pageItem,
      cellData.value,
      props.layout
    );
  } else if (
    chartConfig.value?.more_option?.includes("使用模拟数据") &&
    !pageItem?.srv_req_json &&
    !cellData.value.length &&
    chartType.value !== "liquidFill"
  ) {
    option.value = useBuildOption(
      chartType.value,
      pageItem,
      chartConfig.value.mock_data_json || [],
      props.layout
    );
    cellData.value = chartConfig.value.mock_data_json || [];
    loaded.value = true;
  } else if (
    chartConfig.value?.more_option?.includes("使用模拟数据") &&
    !pageItem?.srv_req_json &&
    !cellData.value.length &&
    chartType.value === "liquidFill"
  ) {
    option.value = {
      chartType: chartType.value,
      pageItem: pageItem,
      cellData: chartConfig.value.mock_data_json || [],
    };
    cellData.value = chartConfig.value.mock_data_json || [];
    //todo 水球数据只需要传入具体的数字
    setLiquidData();
    loaded.value = true;
  } else if (!pageItem?.srv_req_type && !cellData.value?.length) {
    option.value = setDefaultChartOption(
      chartType.value,
      pageItem,
      [],
      props.layout
    );
    loaded.value = true;
  } else {
    let itemReqJson = pageItem?.srv_req_json
      ? JSON.parse(JSON.stringify(pageItem.srv_req_json))
      : null;
    const req = itemReqJson ? buildRequestParams(itemReqJson) : itemReqJson;
    onSrvReq(req);
    if (pageItem?.srv_req_json?.cycle_req_timer) {
      // 定时刷新
      autoRefreshData();
    }
  }
});

const cellData = ref([]);
const autoRefreshData = () => {
  const interval = pageItem?.srv_req_json?.cycle_req_timer;
  timer = setInterval(() => {
    let itemReqJson = pageItem?.srv_req_json
      ? JSON.parse(JSON.stringify(pageItem.srv_req_json))
      : null;
    const req = itemReqJson ? buildRequestParams(itemReqJson) : itemReqJson;
    onSrvReq(req);
  }, interval * 1000);
};

function buildRequestParams(e) {
  console.log("请求参数====>", e);
  let condition = deepClone(e.condition);
  let mapsJonss = colsMapDetailJson.value || [];
  if (Array.isArray(condition)) {
    for (let cond of condition) {
      console.log("buildRequestParams", cond.colName, cond.value);
      if (
        cond.value &&
        cond.value.startsWith("${") &&
        cond.value.endsWith("}")
      ) {
        console.log("2", cond.value);
        let par = cond.value.replace("${", "");

        par = par.replace("}", "");
        let params = deepClone(props.pageParamsModel);
        if (params && Object.keys(params).length > 0) {
          for (let key in params) {
            console.log("key", key, par);
            if (key === par) {
              let mapsCol = mapsJonss.filter(
                (item) => item.col_to === par || item.col_from === par
              );
              if(!mapsCol?.length){
                mapsCol = Object.keys(params).map(k=>{
                  return {
                    col_to: k,
                    col_from: k,
                    from_type: "页面",
                    to_type: "组件",
                  }
                })
              }
              if (Array.isArray(mapsCol) && mapsCol.length > 0) {
                let value = "";
                let model = null;
                for (let col of mapsCol) {
                  switch (col.from_type) {
                    case "页面":
                      model = params;
                      switch (col.to_type) {
                        case "组件":
                          cond.value = params[key].value;
                          // $set(cond,'value',pageParamsModel[key].value)
                          break;
                        case "页面":
                          break;

                        default:
                          break;
                      }
                      break;
                    case "组件":
                      switch (col.to_type) {
                        case "组件":
                          break;
                        case "页面":
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
              console.log("请求参数", e);
              //  $set(cond,'value',)
            }
          }
        }
      }
    }
    condition = condition.filter((item) => {
      if (
        item.ruleType === "eq" &&
        (item.value === null || item.value === undefined)
      ) {
        return false;
      } else {
        return true;
      }
    });
  }

  e.condition = deepClone(condition);
  // console.log(e.serviceName,condition)
  return e;
}
function paramsLinkage() {
  if (chartConfig.value?.more_option?.includes("使用模拟数据") && !pageItem?.srv_req_json) {
    useMockData();
    return;
  }
  let itemReqJson = pageItem?.srv_req_json
    ? JSON.parse(JSON.stringify(pageItem.srv_req_json))
    : null;
  const req = itemReqJson ? buildRequestParams(itemReqJson) : itemReqJson;
  console.log("图表请求", req, req?.serviceName);
  if (Array.isArray(colsMapDetailJson.value)) {
    for (let p of colsMapDetailJson.value) {
      if (p.from_type === "页面" && p.trigger_time === "联动") {
        if (req?.serviceName) {
          onSrvReq(req);
        }
      }
    }
  }else{
    onSrvReq(req);
  }
}

const chartRef = ref(null);
const sankeyChartRef = ref(null);
// 日期筛选事件处理
const onDateFilterChange = (filterParams) => {
  console.log("日期筛选变化:", filterParams);
  currentDateFilter.value = filterParams;

  if (chartConfig.value?.more_option?.includes("使用模拟数据") && !pageItem?.srv_req_json) {
    useMockData();
    return;
  }

  // 重新请求数据
  let itemReqJson = pageItem?.srv_req_json
    ? JSON.parse(JSON.stringify(pageItem.srv_req_json))
    : null;
  const req = itemReqJson ? buildRequestParams(itemReqJson) : itemReqJson;
  if (req?.serviceName) {
    onSrvReq(req);
  }
};

const onDateFilterReset = () => {
  console.log("重置日期筛选");
  currentDateFilter.value = null;

  if (chartConfig.value?.more_option?.includes("使用模拟数据") && !pageItem?.srv_req_json) {
    useMockData();
    return;
  }

  // 重新请求数据
  let itemReqJson = pageItem?.srv_req_json
    ? JSON.parse(JSON.stringify(pageItem.srv_req_json))
    : null;
  const req = itemReqJson ? buildRequestParams(itemReqJson) : itemReqJson;
  if (req?.serviceName) {
    onSrvReq(req);
  }
};

const onResize = () => {
  if (chartType.value === "sankey") {
    sankeyChartRef?.value?.onResize();
  } else {
    chartRef?.value?.onResize();
  }
};
defineExpose({
  onResize,
});
</script>

<style
  lang="scss"
  scoped
>
::v-deep .el-loading-mask {
  background-color: rgba($color: #000000, $alpha: 0.1);
}

.chart-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;

  .chart-content {
    flex: 1;
    height: 100%;
    width: 100%;
  }

  // 加载状态样式
  .loading-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;

    .loading-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;

      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #409eff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      .loading-text {
        color: #666;
        font-size: 14px;
      }
    }
  }

  // 空数据状态样式
  .empty-data-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;

    .empty-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0;

      .empty-icon {
        display: none;
      }

      .empty-text {
        color: #909399;
        font-size: 14px;
        font-weight: 400;
      }

      .empty-desc {
        color: #c0c4cc;
        font-size: 12px;
        text-align: center;
        line-height: 1.4;
      }
    }
  }

  // 旋转动画
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }
}

/* 卡片弹窗样式 */
.card-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  // background-color: rgba(0, 0, 0, 0.1);
  pointer-events: auto;
}
</style>
