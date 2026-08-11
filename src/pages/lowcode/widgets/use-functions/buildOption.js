import * as echarts from "echarts/lib/echarts";
import "echarts-wordcloud"; // echarts-wordcloud@1.1.3
// 说明：echarts@4.9 无 v5 的 echarts.use() API，按需注册采用 side-effect 引入最小模块集
// （等价于 echarts.use([...])），避免全量 import * as echarts from "echarts"（约 775KB）。
// 以下为 buildOption.js / chart.vue 实际使用到的图表与组件的最小集合：
// 图表：line / bar / pie(含 ring) / radar / map / scatter / lines / custom(立体柱) / wordcloud(插件)；
// 组件：tooltip / legend(含 scroll) / title / grid(含 xAxis/yAxis) / geo / visualMap / radar / markLine。
// 注：sankey 图表由 SankeyChart.vue 独立引入（与 LiquidFillChart.vue 同属异步 vendor chunk，按需加载）。
import "echarts/lib/chart/line";
import "echarts/lib/chart/bar";
import "echarts/lib/chart/pie";
import "echarts/lib/chart/radar";
import "echarts/lib/chart/scatter";
import "echarts/lib/chart/lines";
import "echarts/lib/chart/custom";
import "echarts/lib/chart/map";
import "echarts/lib/component/tooltip";
import "echarts/lib/component/legend";
import "echarts/lib/component/legendScroll";
import "echarts/lib/component/title";
import "echarts/lib/component/grid";
import "echarts/lib/component/geo";
import "echarts/lib/component/visualMap";
import "echarts/lib/component/radar";
import "echarts/lib/component/markLine";
// import "echarts-gl"; //echarts-gl@1.1.2
import { getImagePath } from "@/common/http";
import dayjs from "dayjs";
import chinaJson from "echarts/map/json/china.json";

let __colors = [
  "#007AFF",
  "#FF6263",
  "#FDB05D",
  "#66E1DF",
  "#34C758",
  "#FFCB01",
  "#FF9502",
  "#FF3A30",
  "#A8071A",
  "#EB2F96",
  "#AF52DE",
  "#5756D7",
  "#D0DEEE",
  "#82B6F7",
];

function hex2rgb(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (alpha) {
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

function addAlphaToRGB(rgb, alpha) {
  const [r, g, b] = rgb.match(/\d+/g);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getLegendDispConfig(legendDisp = '上') {
  const showLegendValue = legendDisp === '左-带数字' || legendDisp === '右-带数字';

  switch (legendDisp) {
    case '上':
      return {
        orient: 'horizontal',
        x: 'center',
        y: 'top',
        align: 'auto',
        showLegendValue,
        grid: { top: 55, left: 15, right: 10, bottom: 0 },
      };
    case '下':
      return {
        orient: 'horizontal',
        x: 'center',
        y: 'bottom',
        align: 'auto',
        showLegendValue,
        grid: { top: 55, left: 15, right: 10, bottom: 55 },
      };
    case '左':
    case '左-带数字':
      return {
        orient: 'vertical',
        x: 'left',
        y: 'center',
        align: 'left',
        showLegendValue,
        grid: { top: 55, left: 55, right: 10, bottom: 0 },
      };
    case '右上':
      return {
        orient: 'horizontal',
        x: 'right',
        y: 'top',
        align: 'auto',
        showLegendValue,
        grid: { top: 55, left: 15, right: 55, bottom: 0 },
      };
    case '右':
    case '右-带数字':
    default:
      return {
        orient: 'vertical',
        x: 'right',
        y: 'center',
        align: 'left',
        showLegendValue,
        grid: { top: 55, left: 15, right: 55, bottom: 0 },
      };
  }
}

/**
 * 根据 chart_json 中的 grid_top/grid_left/grid_right/grid_bottom 计算饼图/环图的内边距布局
 * 支持 px / % 单位，不带单位时默认按 px 处理
 * 背景：饼图/环图没有 xAxis/yAxis，echarts 的 grid 配置对饼图不生效，因此通过
 * center（圆心）/radius（半径）将图表限定在四周内边距围成的可用区域内。
 * @param {object} chartJson 图表配置
 * @returns {object|null} mode 为 'percent' 时返回可直接使用的 center/radiusPct；
 *   mode 为 'pixel' 时返回原始值（含单位），交由 chart.vue 在渲染时按容器尺寸计算；
 *   未配置任何内边距时返回 null
 */
function getPieGridLayout(chartJson) {
  const keys = ['grid_top', 'grid_left', 'grid_right', 'grid_bottom'];
  // 只要配置了任意一个内边距字段即启用内边距布局
  const hasGridConfig = keys.some((key) => {
    const val = chartJson?.[key];
    return val !== undefined && val !== null && val !== '';
  });
  if (!hasGridConfig) return null;

  // 解析单个内边距值，返回 { value: 数值, unit: 'px' | '%' }；非法/空值返回 null
  const parseValue = (val) => {
    if (val === undefined || val === null || val === '') return null;
    const str = String(val).trim();
    // 显式带 % 单位（如 "20%"）
    const percentMatch = str.match(/^([\d.]+)%$/);
    if (percentMatch) {
      return { value: parseFloat(percentMatch[1]), unit: '%' };
    }
    // 纯数字（如 "20"）或带 px（如 "20px"）：统一按 px 处理
    const num = parseFloat(str);
    if (Number.isFinite(num)) {
      // 不带单位默认按 px 处理
      return { value: num, unit: 'px' };
    }
    return null;
  };

  // 缺失的字段按 0 处理
  const top = parseValue(chartJson.grid_top) || { value: 0, unit: 'px' };
  const left = parseValue(chartJson.grid_left) || { value: 0, unit: 'px' };
  const right = parseValue(chartJson.grid_right) || { value: 0, unit: 'px' };
  const bottom = parseValue(chartJson.grid_bottom) || { value: 0, unit: 'px' };

  // 全部为百分比时可静态计算（无需容器尺寸）
  const allPercent = [top, left, right, bottom].every((item) => item.unit === '%');
  if (allPercent) {
    // 可用区域宽度/高度（相对容器宽高的百分比）
    const width = 100 - left.value - right.value;
    const height = 100 - top.value - bottom.value;
    return {
      mode: 'percent',
      // 圆心 = 左上角内边距 + 可用区域的一半
      center: [`${left.value + width / 2}%`, `${top.value + height / 2}%`],
      // echarts 饼图 radius 百分比相对 min(宽,高)/2 计算，故可用区域半径换算后为 min(width, height)
      radiusPct: Math.max(Math.min(width, height), 0),
    };
  }

  // 含 px 单位：无法在构建配置阶段换算，返回带单位原始值供运行时计算
  return {
    mode: 'pixel',
    values: { top, left, right, bottom },
  };
}

let __geoCoordCache = new Map();

function getGeoCoordFromGeoJson(geoJson, regionName) {
  if (!geoJson || !geoJson.features) return null;

  const cacheKey = regionName;
  if (__geoCoordCache.has(cacheKey)) {
    return __geoCoordCache.get(cacheKey);
  }

  let bestMatch = null;

  for (const feature of geoJson.features) {
    const props = feature.properties || {};
    const name = props.name || props.NAME || props.adcode || '';

    if (String(name).trim() === String(regionName).trim()) {
      bestMatch = feature;
      break;
    }

    if (String(name).includes(String(regionName)) || String(regionName).includes(String(name))) {
      if (!bestMatch) {
        bestMatch = feature;
      }
    }
  }

  if (!bestMatch) return null;

  const props = bestMatch.properties || {};
  
  let coord = null;
  if (props.center && Array.isArray(props.center) && props.center.length === 2) {
    coord = [props.center[0], props.center[1]];
  } else if (props.centroid && Array.isArray(props.centroid) && props.centroid.length === 2) {
    coord = [props.centroid[0], props.centroid[1]];
  } else {
    const coords = bestMatch.geometry.coordinates;
    let centroid = [0, 0];
    let count = 0;

    function processCoords(coords) {
      if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
        centroid[0] += coords[0];
        centroid[1] += coords[1];
        count++;
      } else if (Array.isArray(coords)) {
        for (const coord of coords) {
          processCoords(coord);
        }
      }
    }

    processCoords(coords);

    if (count > 0) {
      coord = [centroid[0] / count, centroid[1] / count];
    }
  }

  if (coord) {
    __geoCoordCache.set(cacheKey, coord);
  }
  
  return coord;
}

/**
 * 获取一个最合适的最大值
 * @param {number} maxVal 原始最大值
 * @returns {number} 最合适的最大值
 */
function getNiceMax(maxVal) {
  if (maxVal === 0) return 0;

  const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
  const normalized = maxVal / magnitude;

  let niceNormalized;
  if (normalized <= 1) {
    niceNormalized = 1;
  } else if (normalized <= 2) {
    niceNormalized = 2;
  } else if (normalized <= 5) {
    niceNormalized = 5;
  } else {
    niceNormalized = 10;
  }

  return (niceNormalized * magnitude).toFixed(2);
}

//params 要处理的字符串
//length 每行显示长度
function getEqualNewlineString(params, length) {
  let text = ''
  let count = Math.ceil(params.length / length) // 向上取整数
  // 一行展示length个
  if (count > 1) {
    for (let z = 1; z <= count; z++) {
      text += params.substr((z - 1) * length, length)
      if (z < count) {
        text += '\n'
      }
    }
  } else {
    text += params.substr(0, length)
  }
  return text
}

function getUnitDisplayValue(value, chartJson = {}, axis = 'y1') {
  const defaultUnit = chartJson?.[`${axis}_unit`] || '';
  const numberValue = parseChartNumber(value);

  if (numberValue === null) {
    return `${value ?? ''}${defaultUnit}`;
  }

  const unitConfig = getMatchedUnitConfig(
    numberValue,
    chartJson?.[`${axis}_unit_alternate`],
    defaultUnit
  );
  const decimals = normalizeDecimals(chartJson?.[`${axis}_decimals_num`]);
  const displayValue = numberValue / unitConfig.rate;

  return `${formatChartNumber(displayValue, decimals)}${unitConfig.unit}`;
}

function getMatchedUnitConfig(value, alternateUnits, defaultUnit) {
  const units = parseUnitAlternates(alternateUnits);
  const matchedUnit = units
    .sort((prev, next) => next.rate - prev.rate)
    .find((item) => Math.abs(value) >= item.rate);

  return matchedUnit || {
    unit: defaultUnit || '',
    rate: 1,
  };
}

function parseUnitAlternates(alternateUnits) {
  if (!alternateUnits || typeof alternateUnits !== 'string') {
    return [];
  }

  return alternateUnits
    .split(',')
    .map((item) => {
      const [unit, rate] = item.split('/');
      const unitText = unit && unit.trim();
      const unitRate = Number(rate);

      if (!unitText || !Number.isFinite(unitRate) || unitRate <= 0) {
        return null;
      }

      return {
        unit: unitText,
        rate: unitRate,
      };
    })
    .filter(Boolean);
}

function parseChartNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numberValue = typeof value === 'number'
    ? value
    : Number(String(value).replace(/,/g, ''));

  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizeDecimals(decimals) {
  const numberValue = Number(decimals);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    return null;
  }

  return Math.floor(numberValue);
}

function formatChartNumber(value, decimals) {
  if (decimals === null) {
    return `${Math.round((value + Number.EPSILON) * 100) / 100}`;
  }

  return value.toFixed(decimals);
}


// 初始化 必须传入dom节点 建议使用vue的ref获取
export const initChart = (domRef) => {
  return echarts.init(domRef);
};

// 桑基图相关代码已迁移到独立组件 SankeyChart.vue

export const useBuildOption = (type, pageItem, cellData = [], layout) => {
  let colors = [...__colors];
  let chartJson = pageItem?.chart_json || {
    chart_no: "CT2212240005",
    chart_type: "折线图",
    legend_disp: "上",
    series_value: "列数据",
    series_value_cols: "index1,index2,index3",
    series_name_cfg: "收入,订单数,费用",
    sort_axis: "某列数据值",
    sort_axis_col: "sort1",
  };

  if (chartJson?.legend_color_seq) {
    colors = chartJson?.legend_color_seq.split(",");
  }

  const showLabel = chartJson?.more_option?.includes('隐藏标签') ? false : true;
  const showLegend = chartJson?.more_option?.includes('隐藏图例') ? false : true;

  let ecOptions = {
    // 初始动画延迟
    // animationDelay: function (idx) {
    //   // 越往后的数据延迟越大
    //   return idx * 1000;
    // },
    // animationEasing: "quinticOut",
    animationEasing: "cubicInOut",
    animationDelay: 200,
    animationDuration: 3000, // 初始动画的时长
    color: colors,
    grid: {
      // 这里可以防止Y轴显示不全
      top: chartJson.grid_top || 40,
      left: chartJson.grid_left || 10,
      right: chartJson.grid_right || 10,
      bottom: chartJson.grid_bottom || 0,
      containLabel: true,
    },
    legend: {
      data: [],
      itemStyle: {
        // color: pageItem?.style_json?.color || "#848EAC",
      },
      textStyle: {
        color: pageItem?.style_json?.color || "#848EAC",
      },
      pageIconColor: pageItem?.style_json?.color || "#848EAC",
      pageTextStyle: {
        color: pageItem?.style_json?.color || "#848EAC",
      },
    }, //展示的折线图标题
    xAxis: {
      type: "category", // 还有其他的type，可以去官网喵两眼哦
      data: [], // x轴数据
      axisTick: {
        show: true, //是否显示刻度
        // alignWithLabel: true, //对齐文字
        // interval: '0',
        // length: 5, //标度标尺的长度
        inside: false, //刻度尺 标记 朝内 朝外
      },
      axisLabel: {
        show: true,
        // interval: 0, //刻度显示间隔 0代表 全部显示 1代表这个 隔一个显示一个
        rotate: chartJson.sort_label_ccw_rotation, //对刻度进行角度旋转 竖着显示
        textStyle: {
          fontWeight: 400,
          fontSize: 10,
          color: pageItem?.style_json?.color || "#848EAC",
        },
      },
      axisLine: {
        lineStyle: {
          color: pageItem?.style_json?.color || "#848EAC",
        },
      },
    },
    yAxis: [
      {
        type: "value",
        min: pageItem.min,
        max: pageItem.max,
        // min: chartJson.index_min,
        // max: chartJson.index_max,
        name: chartJson.y1_unit,
        //坐标轴最大值、最小值、强制设置数据的步长间隔
        // interval: chartJson.interval,

        axisLabel: {
          textStyle: {
            fontWeight: 400,
            fontSize: 10,
            color: pageItem?.style_json?.color || "#848EAC",
          },
          formatter: "{value}",
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: pageItem?.style_json?.color || "#848EAC",
          },
        },
        splitLine: {
          //修改背景线条样式
          show: false, //是否展示
          lineStyle: {
            color: "#E8E8E8", //线条颜色
            type: "dashed", //线条样式，默认是实现，dashed是虚线
          },
        },
      },
    ],
    tooltip: {
      trigger: "axis", // axis 代表着同列的所有项的值  item  单个项的值  none 什么都不展示 三个值
      formatter: function (params) {
        let result = params[0].name + '<br/>';
        params.forEach(function (item) {
          if (item.value !== null && item.value !== 0 && item.value !== undefined) {
            let markerColor = item.color;
            if (item.color && typeof item.color === 'object' && item.color.colorStops) {
              markerColor = item.color.colorStops[0].color;
            }
            const marker = `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${markerColor};"></span>`;
            const axis = ecOptions?.series?.[item.seriesIndex]?.yAxisIndex === 1 ? 'y2' : 'y1';
            result += marker + item.seriesName + ': ' + getUnitDisplayValue(item.value, chartJson, axis) + '<br/>';
          }
        });
        return result;
      }
    }, //点击折点 展示的样式
    series: [], //y轴展示的数据
  };
  //生成图表默认配置
  let defaultOptions = setDefaultChartOption(
    type,
    pageItem?.chart_json,
    echarts
  );
  ecOptions = { ...defaultOptions, ...ecOptions };

  if (
    chartJson?.more_option &&
    chartJson.more_option.indexOf("副坐标轴") > -1
  ) {
    ecOptions.yAxis.push({
      type: "value",
      name: chartJson.y2_unit,
      axisLabel: {
        formatter: "{value}",
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: "#848EAC",
        },
      },
      splitLine: {
        //修改背景线条样式
        show: false, //是否展示
        lineStyle: {
          color: "#E8E8E8", //线条颜色
          type: "dashed", //线条样式，默认是实现，dashed是虚线
        },
      },
    });
  }
  let datas = cellData;
  let seriesName = chartJson?.series_name_cfg || "";
  seriesName = seriesName.split(",");

  let seriesValueCols = chartJson?.series_value_cols || "";

  seriesValueCols = seriesValueCols.split(",");
  let y2seriesValueCols = []
  let y2SeriesNames = []
  if (chartJson?.y2_name_cfg && chartJson?.y2_cols) {
    y2SeriesNames = chartJson?.y2_name_cfg.split(',')
    y2seriesValueCols = chartJson?.y2_cols.split(',')
  }
  seriesValueCols = seriesValueCols.concat(y2seriesValueCols)
  seriesName = seriesName.concat(y2SeriesNames)
  // const mapJson =
  //   pageItem.cols_map_json?.cols_map_json ||
  //   pageItem?.page_com_cols_map_json?.cols_map_json;
  // let arr = [];
  // if (mapJson) {
  //   seriesValueCols.forEach((item) => {
  //     for (let k in mapJson) {
  //       if (k === item) {
  //         arr.push(mapJson[k]);
  //       }
  //     }
  //   });
  //   seriesValueCols = arr;
  // }

  let sortAxisCol = chartJson?.sort_axis_col || "";
  let lineVal1 = chartJson?.refer_line1 || "none";
  let lineVal2 = chartJson?.refer_line2 || "none";
  const legendDispValue = chartJson?.legend_disp?.trim?.() || "";
  const hasLegendDisp = !!legendDispValue;
  switch (type) {
    case "sankey": //桑基图
      // 桑基图已迁移到独立组件 SankeyChart.vue
      break;
    case "line":
    case "bar":
    case "lineBar":
      const legendDisp = legendDispValue;
      const legendConfig = hasLegendDisp ? getLegendDispConfig(legendDisp) : null;

      if (showLegend && hasLegendDisp) {
        ecOptions.legend.orient = legendConfig.orient;
        ecOptions.legend.x = legendConfig.x;
        ecOptions.legend.y = legendConfig.y;
        ecOptions.legend.align = legendConfig.align;
        ecOptions.grid.top = chartJson.grid_top || legendConfig.grid.top;
        ecOptions.grid.left = chartJson.grid_left || legendConfig.grid.left;
        ecOptions.grid.right = chartJson.grid_right || legendConfig.grid.right;
        ecOptions.grid.bottom = chartJson.grid_bottom || legendConfig.grid.bottom;
      }

      ecOptions.legend.show = showLegend && hasLegendDisp;
      ecOptions.legend.type = "scroll";
      ecOptions.legend.pageIconColor = pageItem?.style_json?.color || "#848EAC";
      ecOptions.legend.pageTextStyle = {
        color: pageItem?.style_json?.color || "#848EAC",
      };

      for (let sIndex in seriesName) {
        let dataColName = seriesValueCols[sIndex];
        let series = {
          name: seriesName[sIndex],
          data: [],
          // color: this.color,
          // type: type,
        };

        if (y2seriesValueCols.includes(dataColName)) {
          // 副坐标轴
          series.yAxisIndex = 1
        }

        if (
          lineVal1 &&
          lineVal2 &&
          lineVal1 !== "none" &&
          lineVal2 !== "none"
        ) {
          series.markLine = {
            symbol: "none",
            label: {
              show: true,
              position: "middle",
              // formatter: '{b}'      // 注释掉显示值，放开不显示值
            },
            data: [
              {
                // name: '阈值',
                yAxis: lineVal1,
                // lineStyle: {
                // 	color: '#FF7A42'
                // }
              },
              {
                yAxis: lineVal2,
                // lineStyle: {
                // 	color: '#FF7A42'
                // },
              },
            ],
            lineStyle: {
              color: "#FF7A42",
              type: "solid",
            },
          };
        }

        if (seriesName.length <= 2) {
          // series.yAxisIndex = sIndex;
        }
        const mapJson =
          pageItem.cols_map_json?.cols_map_json ||
          pageItem?.page_com_cols_map_json?.cols_map_json;
        // 处理x轴变量映射
        if (mapJson) {
          for (let k in mapJson) {
            if (k === sortAxisCol) {
              sortAxisCol = mapJson[k];
            }
          }
        }
        const xAxisData = cellData.map((item) => item[sortAxisCol]);
        ecOptions["xAxis"]["data"] = [...new Set(xAxisData)];
        series["data"] = new Array(ecOptions["xAxis"]["data"].length).fill(
          null
        );
        if (chartJson.more_option && chartJson.more_option.includes("x轴反序")) {
          ecOptions["xAxis"]["data"] = ecOptions["xAxis"]["data"].reverse();
        }
        if (
          chartJson.more_option &&
          chartJson.more_option.includes("序列堆叠")
        ) {
          series.stack = sortAxisCol;
        }

        // for (let data of cellData) {
        //   if (chartJson.more_option && chartJson.more_option === "x轴反序") {
        //     // series["data"].unshift(data[dataColName]);
        //     // ecOptions["xAxis"]["data"].unshift(data[sortAxisCol]);
        //     ecOptions["xAxis"]["data"] = xAxisData.reverse();
        //   } else {
        //     // series["data"].push(data[dataColName]);
        //     // ecOptions["xAxis"]["data"].push(data[sortAxisCol]);
        //   }
        // }
        series["data"] = series["data"].map((item, index) => {
          const data = cellData.find(
            (e) => e[sortAxisCol] === ecOptions["xAxis"]["data"][index]
          );
          return data?.[dataColName];
        });
        series["smooth"] = true;
        if (typeof chartJson?.smooth === "number") {
          series.smooth = chartJson?.smooth;
        }
        if (chartJson.data_label === "值") {
          series.itemStyle = {
            normal: {
              label: {
                show: true,
              },
            },
          };
        }

        ecOptions["legend"]["data"].push(seriesName[sIndex]);

        if (type === "lineBar") {
          let barCols = chartJson?.bar_cols || "";
          barCols = barCols.split(",");
          let lineCols = chartJson?.line_cols || "";
          lineCols = lineCols.split(",");

          if (barCols.includes(series.name)) {
            series["type"] = "bar";
          } else if (lineCols.includes(series.name)) {
            series["type"] = "line";
          }
        } else {
          series["type"] = type;
        }

        const baseColor = colors[sIndex % colors.length];
        const isArea = chartJson?.more_option?.includes('折线面积图');
        const barOptions = chartJson?.bar_option || '';
        const enableGradient = typeof barOptions === 'string' && barOptions.includes('渐变色');
        const showBarLabel = typeof barOptions === 'string' && barOptions.includes('显示标签');
        const labelPosition = chartJson?.label_position || 'top';
        const labelFormat = chartJson?.label_format || '数字';
        const gradientType = chartJson?.gradient_type || '线性渐变';
        const gradientStops = typeof chartJson?.color_stops === 'string' && chartJson.color_stops.trim()
          ? chartJson.color_stops.split(',').map((item) => {
              const match = item.trim().match(/^([0-9.]+)#(.+)$/);
              if (!match) return null;
              return {
                offset: Number(match[1]),
                color: `#${match[2]}`,
              };
            }).filter(Boolean)
          : [
              { offset: 0, color: baseColor },
              { offset: 1, color: baseColor + '80' },
            ];

        if (series.type === "bar") {
          if (chartJson?.bar_width) {
            series.barWidth = chartJson.bar_width;
          } else {
            series.barMaxWidth = 50;
            series.barMinWidth = 20;
          }
          if (seriesName.length > 1) {
            series.barGap = chartJson?.bar_gap || '20%';
            series.barCategoryGap = chartJson?.bar_category_gap || '30%';
          }
          if (enableGradient) {
            const isHorizontalBar = chartJson?.chart_type === "条形图";
            series.itemStyle = {
              color: gradientType === '径向渐变'
                ? new echarts.graphic.RadialGradient(0.5, 0.5, 0.8, gradientStops)
                : isHorizontalBar
                  ? new echarts.graphic.LinearGradient(0, 0, 1, 0, gradientStops)
                : new echarts.graphic.LinearGradient(0, 1, 0, 0, gradientStops),
            };
          }
          series.label = {
            ...(series.label || {}),
            show: showBarLabel,
            position: labelPosition,
            formatter: function (params) {
              const value = params?.value ?? '';
              return labelFormat === '数字+单位' ? getUnitDisplayValue(value, chartJson, 'y1') : `${value}`;
            },
          };
        } else if (series.type === "line") {
          series.lineStyle = {
            color: baseColor,
          };
          series.itemStyle = {
            color: baseColor,
          };
          if (isArea && enableGradient) {
            series.areaStyle = {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: baseColor + "80" },
                { offset: 1, color: baseColor + "20" },
              ]),
            };
          }
        }

        ecOptions["series"].push(series);
        if (chartJson?.series_value === "单列多行分组" && cellData?.length) {
          const nOption = buildMultiColSeries(pageItem, cellData, type);
          ecOptions["series"] = nOption?.series || [];
          if (nOption?.series?.length > 5) {
            const legendDisp = legendDispValue;
            const legendConfig = hasLegendDisp ? getLegendDispConfig(legendDisp) : null;

            let gridConfig = {
              containLabel: true,
            };

            if (showLegend && hasLegendDisp) {
              gridConfig.top = chartJson.grid_top || legendConfig.grid.top;
              gridConfig.left = chartJson.grid_left || legendConfig.grid.left;
              gridConfig.right = chartJson.grid_right || legendConfig.grid.right;
              gridConfig.bottom = chartJson.grid_bottom || legendConfig.grid.bottom;
            } else {
              gridConfig.top = chartJson.grid_top || 40;
              gridConfig.left = chartJson.grid_left || 15;
              gridConfig.right = chartJson.grid_right || 10;
              gridConfig.bottom = chartJson.grid_bottom || 0;
            }

            ecOptions.grid = gridConfig;
          }
          ecOptions.legend.data = nOption?.legend || [];

          const val =
            Math.abs(Number(nOption.max) - Number(nOption.min)) / nOption.legend.length;
          ecOptions.yAxis[0].min = (
            pageItem.min ||
            Number(nOption.min) - val ||
            0
          ).toFixed(2);
          if (ecOptions.yAxis[0].min < 0) {
            ecOptions.yAxis[0].min = 0;
          }

          // ecOptions.yAxis[0].max = (
          //   (Number(pageItem.max) || Number(nOption.max)) + val
          // ).toFixed(2);

          ecOptions.tooltip.trigger = "axis";
        }
      }
      if (chartJson?.more_option?.includes('序列堆叠')) {
        ecOptions.series.forEach((item, index) => {
          item.stack = sortAxisCol;
        })

        if (!pageItem.max && ecOptions.series.length > 0) {
          let maxVal = 0;
          ecOptions.xAxis.data.forEach(xVal => {
            let sum = 0;
            ecOptions.series.forEach(series => {
              const dataIndex = ecOptions.xAxis.data.indexOf(xVal);
              if (dataIndex >= 0 && series.data[dataIndex] !== null && series.data[dataIndex] !== undefined) {
                sum += Number(series.data[dataIndex]) || 0;
              }
            });
            if (sum > maxVal) {
              maxVal = sum;
            }
          });

          if (maxVal > 0) {
            // ecOptions.yAxis[0].max = getNiceMax(maxVal);
            ecOptions.yAxis[0].max = undefined
          }
        }
      }
      const dateFormatMap = {
        '年-月-日': 'YYYY-MM-DD',
        '年/月/日': 'YYYY/MM/DD',
        '年-月-日 时:分': 'YYYY-MM-DD HH:mm',
        '年/月/日 时:分': 'YYYY/MM/DD HH:mm',
        '时:分': 'HH:mm',
        '月-日 时:分': 'MM月DD日 HH:mm',
        '时:分:秒': 'HH:mm:ss',
        '年/月/日 时:分:秒': 'YYYY/MM/DD HH:mm:ss',
        '年-月-日 时:分:秒': 'YYYY-MM-DD HH:mm:ss',
      }
      if (chartJson.x_label_format === '日期时间' && chartJson.x_label_date_format) {
        ecOptions.xAxis.axisLabel.formatter = function (value) {
          return dayjs(value).format(dateFormatMap[chartJson.x_label_date_format]);
        }
      } else if (chartJson.x_label_format === '字符串模板' && chartJson.x_label_temp_format) {
        ecOptions.xAxis.axisLabel.formatter = chartJson.x_label_temp_format
      } else if (chartJson.x_label_custom_format) {
        ecOptions.xAxis.axisLabel.formatter = eval(`${chartJson.x_label_custom_format}`);
      }
      // ecOptions["xAxis"]["data"] = [
      //   ...new Set(ecOptions["xAxis"]["data"] || []),
      // ];
      if (chartJson?.chart_type === "条形图") {
        let xAxis = JSON.parse(JSON.stringify(ecOptions.yAxis));
        ecOptions.yAxis = JSON.parse(JSON.stringify(ecOptions.xAxis));
        ecOptions.xAxis = xAxis;
      }
      switch(chartJson?.bar_style) {
        case '平面':
          const axisColor = colors[0] || pageItem?.style_json?.color || "#848EAC";
          ecOptions.xAxis = {}
          ecOptions.xAxis.show = false;
          ecOptions.series.forEach((item) => {
            item.label = {
              ...item.label,
              show: true,
              color: axisColor,
            };
            item.barWidth = 8;
            item.barMinWidth = 8;
          });
          ecOptions.yAxis.axisLine = {
            ...(ecOptions.yAxis.axisLine || {}),
            show: true,
            lineStyle: {
              ...(ecOptions.yAxis.axisLine?.lineStyle || {}),
              color: axisColor,
            },
          };
          break;
        case '立体':
          ecOptions.series = ecOptions.series.map((item, index) => {
            const baseColor = colors[index] || colors[0] || "#007AFF";
            const barOptions = chartJson?.bar_option || '';
            const enableGradient = typeof barOptions === 'string' && barOptions.includes('渐变色');
            const gradientType = chartJson?.gradient_type || '线性渐变';
            const gradientStops = typeof chartJson?.color_stops === 'string' && chartJson.color_stops.trim()
              ? chartJson.color_stops.split(',').map((stop) => {
                  const match = stop.trim().match(/^([0-9.]+)#(.+)$/);
                  if (!match) return null;
                  return {
                    offset: Number(match[1]),
                    color: `#${match[2]}`,
                  };
                }).filter(Boolean)
              : [
                  { offset: 0, color: baseColor },
                  { offset: 1, color: baseColor + '80' },
                ];
            const startColor = gradientStops[0]?.color || baseColor;
            const sideGradient = gradientType === '径向渐变'
              ? new echarts.graphic.RadialGradient(0.5, 0.5, 0.8, gradientStops)
              : new echarts.graphic.LinearGradient(0, 1, 0, 0, gradientStops);
            const leftColor = enableGradient ? sideGradient : addAlphaToRGB(hex2rgb(baseColor), 0.9);
            const rightColor = enableGradient ? sideGradient : addAlphaToRGB(hex2rgb(baseColor), 0.65);
            const topColor = enableGradient ? (gradientStops[gradientStops.length - 1]?.color || baseColor) : addAlphaToRGB(hex2rgb(baseColor), 1);
            const labelColor = topColor || baseColor;
            const barWidth = item.barWidth || 16;
            const depth = Math.max(6, Math.round(barWidth / 2));
            const originalData = item.data || [];

            return {
              ...item,
              type: 'custom',
              renderItem: function (params, api) {
                const value = Number(originalData[params.dataIndex]) || 0;
                if (!value) {
                  return null;
                }
                const categoryIndex = params.dataIndex;
                const start = api.coord([categoryIndex, 0]);
                const end = api.coord([categoryIndex, value]);
                const x = end[0];
                const topY = end[1];
                const axisY = start[1];
                const halfWidth = barWidth / 2;
                const bodyTopY = topY;
                const bodyBottomY = axisY - depth;

                return {
                  type: 'group',
                  children: [
                    {
                      type: 'polygon',
                      shape: {
                        points: [
                          [x - halfWidth, bodyBottomY],
                          [x, axisY],
                          [x, bodyTopY + depth],
                          [x - halfWidth, bodyTopY],
                        ],
                      },
                      style: {
                        fill: leftColor,
                        opacity: 0.92,
                        shadowBlur: 14,
                        shadowColor: 'rgba(0, 0, 0, 0.28)',
                        shadowOffsetX: -4,
                        shadowOffsetY: 5,
                      },
                    },
                    {
                      type: 'polygon',
                      shape: {
                        points: [
                          [x, axisY],
                          [x + halfWidth, bodyBottomY],
                          [x + halfWidth, bodyTopY],
                          [x, bodyTopY + depth],
                        ],
                      },
                      style: {
                        fill: rightColor,
                        opacity: 0.78,
                        shadowBlur: 16,
                        shadowColor: 'rgba(0, 0, 0, 0.34)',
                        shadowOffsetX: 4,
                        shadowOffsetY: 6,
                      },
                    },
                    {
                      type: 'polygon',
                      shape: {
                        points: [
                          [x - halfWidth, bodyTopY],
                          [x, bodyTopY - depth],
                          [x + halfWidth, bodyTopY],
                          [x, bodyTopY + depth],
                        ],
                      },
                      style: {
                        fill: topColor,
                        opacity: 1,
                        shadowBlur: 18,
                        shadowColor: 'rgba(255, 255, 255, 0.35)',
                        shadowOffsetX: 0,
                        shadowOffsetY: -3,
                      },
                    },
                  ],
                };
              },
              data: originalData,
              label: {
                ...(item.label || {}),
                show: true,
                color: labelColor,
              },
              z: 3,
            };
          });
          break;
      }
      break;
    case "pie":
    case "ring":
      // 计算饼图/环图的内边距布局：全部为百分比时静态计算 center/radius；
      // 含 px 时无法在构建阶段换算（依赖容器尺寸），将原始值挂到 ecOptions.__pieGrid，
      // 由 chart.vue 在渲染及 resize 时按容器实际尺寸计算并覆写 series 的 center/radius
      const pieGridLayout = getPieGridLayout(chartJson);
      if (pieGridLayout?.mode === 'pixel') {
        // px 内边距需根据容器尺寸计算，交由 chart.vue 运行时处理
        ecOptions.__pieGrid = pieGridLayout;
      }
      for (let sIndex in seriesName) {
        console.log(chartJson);

        var scale = 1
        var rich = {
          total: {
            color: chartJson?.ring_val_color || "#ffc72b",
            fontSize: 18 * scale,
            align: 'center'
          },
          white: {
            color: "#fff",
            align: 'center',
            fontSize: 12 * scale,
            padding: [21, 0]
          },
          valueColor: {
            color: chartJson?.ring_val_color || '#49dff0',
            fontSize: 12 * scale,
            align: 'center'
          },
          labelColor: {
            color: chartJson?.ring_text_color || "#ffc72b",
            fontSize: 12 * scale,
            padding: [5, 4],
            align: 'center'
          },
          hr: {
            borderColor: '#0b5263',
            width: '100%',
            borderWidth: 1,
            height: 0,
          }
        }
        let dataColName = seriesValueCols[sIndex];

        let series = {
          name: "", // 名称
          type: "pie", // 类型 饼图
          //   color: color,
          // radius: ["55%", "65%"], // 饼图的半径 `50, 250 => 内半径 外半径`
          // 饼图的中心（圆心）坐标，数组的第一项是横坐标，第二项是纵坐标。
          // 百分比内边距布局下圆心取可用区域中心；px 布局由 chart.vue 运行时覆写，此处用默认值
          center: pieGridLayout?.mode === 'percent' ? pieGridLayout.center : ["50%", "50%"],
          // roseType: "area", // 是否展示成南丁格尔图，通过半径区分数据大小
          itemStyle: {
            normal: {
              label: {
                position: "outside",
                alignTo: "labelLine",
                show: true,
                // formatter: `{b} \r\n {c}${chartJson?.y1_unit || ""}`,
                // bleedMargin: 3,
                formatter: function (params, ticket, callback) {
                  let total = 0; //总数量
                  let percent = 0; //占比
                  let value = params.value;
                  // 使用原始cellData计算总数，确保百分比正确
                  cellData.forEach(function (value, index, array) {
                    const num = value[chartJson.series_value_cols || 'value'];
                    if (!isNaN(Number(num))) {
                      total += Number(num)
                    }
                  });
                  percent = ((value / total) * 100).toFixed(1);
                  let labelText = getEqualNewlineString(params.name, 6);
                  return `{labelColor|${labelText}}\n{valueColor|${getUnitDisplayValue(value, chartJson, 'y1')}}`;
                  // return '{labelColor|' + getEqualNewlineString(params.name,6) + '}{valueColor|' + percent + '%}'
                  //  + '({labelColor|' + value + `${chartJson?.y1_unit || ""})` + '}' ;
                },
                rich: rich,
              },
              labelLine: {
                show: true,
                length: 10,
                length2: 15,
              },
            },
          },
          tooltip: {
            trigger: 'item',
            formatter: function (params) {
              // if (params.value === null || params.value === 0 || params.value === undefined) {
              //   return '';
              // }
              // 计算原始数据总和，确保百分比正确
              let originalTotal = 0;
              cellData.forEach(function (data) {
                const num = data[seriesValueCols[0]];
                if (!isNaN(Number(num))) {
                  originalTotal += Number(num);
                }
              });
              const percent = ((params.value / originalTotal) * 100).toFixed(1);
              return `${params.name}<br/>${getUnitDisplayValue(params.value, chartJson, 'y1')} (${percent}%)`;
            }
          },
          data: [],
        };
        if (pieGridLayout?.mode === 'percent' && type !== "ring") {
          // 普通饼图：内边距布局下半径取可用区域的最大半径（百分比），
          // 使饼图完整落在 grid_top/grid_left/grid_right/grid_bottom 围成的区域内
          series.radius = `${pieGridLayout.radiusPct}%`;
        }
        if (type === "ring") {
          const ringWidthRaw = chartJson?.ring_width;
          let ringWidth = 5;
          let widthUnit = 'px';
          
          if (ringWidthRaw) {
            const widthStr = String(ringWidthRaw).trim();
            if (/^\d+$/.test(widthStr)) {
              ringWidth = parseInt(widthStr);
              widthUnit = 'px';
            } else if (/^\d+px$/.test(widthStr)) {
              ringWidth = parseInt(widthStr);
              widthUnit = 'px';
            } else if (/^\d+%$/.test(widthStr)) {
              ringWidth = parseInt(widthStr);
              widthUnit = '%';
            } else {
              ringWidth = parseInt(widthStr) || 5;
            }
          }
          
          const isProgressRing = chartJson?.ring_option?.includes('进度圆环');
          let progressData = null;
          let safeValue = 0;
          
          if (isProgressRing && cellData?.length > 0) {
            const valCol = chartJson?.ring_val_col || seriesValueCols[0];
            const firstValue = parseFloat(cellData[0]?.[valCol]) || 0;
            safeValue = Math.max(0, Math.min(100, firstValue));
            const remainingValue = 100 - safeValue;
            
            // 进度圆环使用占位符方式，第二项为不可见
            const ringBgColor = chartJson?.ring_bg_color || '#E9EBEC';
            const ringHighColor = chartJson?.ring_high_color;
            
            const firstItemStyle = ringHighColor ? {
              normal: { color: ringHighColor }
            } : {};
            
            progressData = [
              { value: safeValue, name: chartJson?.ring_sum_label || "完成", itemStyle: firstItemStyle },
              { 
                value: remainingValue, 
                name: "invisible", 
                itemStyle: { 
                  normal: { 
                    color: ringBgColor,
                    label: { show: false },
                    labelLine: { show: false }
                  },
                  emphasis: { color: ringBgColor }
                } 
              }
            ];
            
            series.data = progressData;
            series.itemStyle = {
              normal: {
                shadowColor: 'rgba(40, 40, 40, 0.5)',
                label: { show: false },
                labelLine: { show: false }
              }
            };
            series.hoverAnimation = false;
            series.startAngle = 90;
          }
          
          if (pieGridLayout?.mode === 'percent') {
            // 百分比内边距布局下：外半径取可用区域最大半径，内半径 = 外半径 - 环宽，
            // 使环图宽度不变且整体落在 grid_top/grid_left/grid_right/grid_bottom 围成的区域内；
            // px 布局由 chart.vue 运行时按容器尺寸覆写
            const ringWidthPct = widthUnit === '%' ? ringWidth : Math.max(5, ringWidth);
            series.radius = [`${pieGridLayout.radiusPct - ringWidthPct}%`, `${pieGridLayout.radiusPct}%`];
          } else if (widthUnit === '%') {
             series.radius = [`${80 - ringWidth}%`, '90%']
           } else {
             series.radius = [`${90 - ringWidth}px`, '90px']
           }
           
           // 进度圆环模式下，直接使用设置的数据并返回
           if (isProgressRing && progressData) {
             const title = chartJson?.ring_sum_label || "完成";
             const labelColor = chartJson?.ring_sum_label_color || pageItem?.style_json?.color || "#fff";
             const valColor = chartJson?.ring_sum_val_color || "#ffc97a";
             const displayValue = getUnitDisplayValue(safeValue, chartJson, 'y1');
             
             ecOptions.title = {
               text: displayValue,
               left: "center",
               top: "center",
               padding: [24, 0],
               subtext: title,
               subtextStyle: {
                 color: labelColor,
                 fontSize: 14,
                 align: "center",
               },
               textStyle: {
                 color: valColor,
                 fontSize: 24,
                 align: "center",
                 rich: {
                    value: {
                      fontSize: 24,
                      color: valColor,
                      verticalAlign: 'bottom'
                    },
                    unit: {
                      fontSize: 14,
                      color: valColor,
                      verticalAlign: 'bottom',
                      padding: [0, 0, 4, 4]
                    }
                  }
               },
             };
             if (ecOptions.legend) {
               ecOptions.legend.show = false;
             }
             if (ecOptions.tooltip) {
               ecOptions.tooltip.show = false;
             }
             delete ecOptions.xAxis;
             delete ecOptions.yAxis;
             if (ecOptions.grid) {
               ecOptions.grid.show = false;
             }
             ecOptions["series"].push(series);
             return ecOptions;
           }
        }
        series.itemStyle.normal.label.show = showLabel;

        // 处理数据，当超过10项时合并为"其它"
        let processedData = [];
        let legendData = [];

        // 先构建所有数据项
        let allDataItems = [];
        // 检查并合并已有的"其它"或"其他"项
        let existingOthersValue = 0;

        for (let data of cellData) {
          const name = data[chartJson?.series_name_cfg || sortAxisCol];
          const value = parseFloat(data[dataColName]);

          // 检查是否为"其它"或"其他"项
          if (name === "其它" || name === "其他") {
            existingOthersValue += value;
          } else {
            let dataItem = {
              value: value,
              name: name,
              itemStyle: {
                normal: {
                  borderWidth: 5,
                },
              },
            };
            allDataItems.push(dataItem);
          }
        }

        // 按值大小排序（降序）
        allDataItems.sort((a, b) => b.value - a.value);

        // 获取合并阈值配置，默认为5
        const mergeThreshold = chartJson?.pie_merge_threshold || 5;

        // 如果数据项超过配置的阈值，合并后面的为"其它"
        if (allDataItems.length > mergeThreshold) {
          // 取前(阈值-1)项，为"其它"项留出位置
          const keepCount = mergeThreshold - 1;
          processedData = allDataItems.slice(0, keepCount);

          // 计算其它项的总和
          let othersValue = existingOthersValue;
          for (let i = keepCount; i < allDataItems.length; i++) {
            othersValue += allDataItems[i].value;
          }

          // 添加"其它"项
          if (othersValue > 0) {
            processedData.push({
              value: othersValue,
              name: "其它",
              itemStyle: {
                normal: {
                  borderWidth: 5,
                },
              },
            });
          }
        } else {
          processedData = allDataItems;
          // 如果没有超过阈值但存在"其它"或"其他"项，直接添加
          if (existingOthersValue > 0) {
            processedData.push({
              value: existingOthersValue,
              name: "其它",
              itemStyle: {
                normal: {
                  borderWidth: 5,
                },
              },
            });
          }
        }

        // 添加处理后的数据到series
        series["data"] = processedData;

        // 构建图例数据
        for (let item of processedData) {
          let legendItem = {
            name: item.name,
            icon: "circle",
          };
          ecOptions["legend"]["data"].push(legendItem);
        }
        ecOptions["series"].push(series);
      }
      console.log(ecOptions);
      ecOptions["legend"]["orient"] = "vertical";
      ecOptions["legend"]["y"] = "center";
      ecOptions["legend"]["x"] = "65%";
      ecOptions["legend"]["align"] = "left";

      let pieDatas = ecOptions["series"][0]["data"];
      ecOptions["legend"]["formatter"] = function (name) {
        let v;
        for (var i = 0, n = pieDatas.length; i < n; i++) {
          if (name == pieDatas[i].name) {
            v = pieDatas[i].value;
          }
        }
        return `${name}(${v})`;
      };
      ecOptions.legend.show = false;
      switch(chartJson?.pie_style) {
        case '直角环形':
          // 百分比内边距布局下：外半径取可用区域最大半径（保持 15% 环宽），圆心取可用区域中心；
          // 未配置内边距或 px 布局时沿用原有定位
          ecOptions.series[0].radius = pieGridLayout?.mode === 'percent'
            ? [`${pieGridLayout.radiusPct - 15}%`, `${pieGridLayout.radiusPct}%`]
            : ['55%', '70%'];
          ecOptions.series[0].center = pieGridLayout?.mode === 'percent'
            ? pieGridLayout.center
            : (hasLegendDisp ? ['32%', '50%'] : ['50%', '50%']);
          Object.assign(ecOptions.series[0]?.itemStyle?.normal?.label, {
            show: true,
            position: 'inside',
            textBorderWidth: 0,
            textBorderColor: 'transparent',
            formatter: function (params) {
              let total = 0;
              cellData.forEach(function (value) {
                const num = value[chartJson.series_value_cols || 'value'];
                if (!isNaN(Number(num))) {
                  total += Number(num);
                }
              });
              if (!total) return '0%';
              return ((params.value / total) * 100).toFixed(1) + '%';
            }
          });
          Object.assign(ecOptions.series[0]?.itemStyle?.normal?.labelLine, {
            show: false,
          });

          const legendDisp = legendDispValue;
          const legendConfig = hasLegendDisp ? getLegendDispConfig(legendDisp) : null;

          ecOptions.legend.show = hasLegendDisp;
          if (hasLegendDisp) {
            ecOptions.legend.orient = legendConfig.orient;
            ecOptions.legend.x = legendConfig.x === 'left' ? '2%' : legendConfig.x;
            ecOptions.legend.y = legendConfig.y;
            ecOptions.legend.align = legendConfig.align;
          }
          ecOptions.legend.itemWidth = 10;
          ecOptions.legend.itemHeight = 10;
          ecOptions.legend.data = (ecOptions.legend.data || []).map((item) => ({
            ...item,
            icon: 'rect',
          }));

          ecOptions.legend.formatter = function (name) {
            let v = 0;
            for (let i = 0, n = pieDatas.length; i < n; i++) {
              if (name == pieDatas[i].name) {
                v = pieDatas[i].value;
                break;
              }
            }
            return legendConfig?.showLegendValue ? `${name}  ${v}` : `${name}`;
          };
        break;
      }
      if (type === "ring") {
        const title = chartJson?.ring_sum_label || "总数";
        const labelColor = chartJson?.ring_sum_label_color || pageItem?.style_json?.color || "#fff";
        const valColor = chartJson?.ring_sum_val_color || "#ffc97a";
        
        // 普通环图也支持 ring_width
        const ringWidthRaw = chartJson?.ring_width;
        let ringWidth = 0;
        let widthUnit = 'px';
        
        if (ringWidthRaw) {
          const widthStr = String(ringWidthRaw).trim();
          if (/^\d+$/.test(widthStr)) {
            ringWidth = parseInt(widthStr);
          } else if (/^\d+px$/.test(widthStr)) {
            ringWidth = parseInt(widthStr);
          } else if (/^\d+%$/.test(widthStr)) {
            ringWidth = parseInt(widthStr);
            widthUnit = '%';
          } else {
            ringWidth = parseInt(widthStr) || 0;
          }
        }
        
        // 设置环图宽度：百分比内边距布局下外半径取可用区域最大半径并保持环宽，px 布局由 chart.vue 运行时覆写
        if (ringWidth > 0 && ecOptions.series && ecOptions.series.length > 0) {
          const ringSeries = ecOptions.series[0];
          if (pieGridLayout?.mode === 'percent') {
            const ringWidthPct = widthUnit === '%' ? ringWidth : Math.max(5, ringWidth);
            ringSeries.radius = [`${pieGridLayout.radiusPct - ringWidthPct}%`, `${pieGridLayout.radiusPct}%`];
          } else if (widthUnit === '%') {
            ringSeries.radius = [`${70 - ringWidth}%`, '70%'];
          } else {
            ringSeries.radius = [`${70 - ringWidth}px`, '70px'];
          }
        }
        
        // 普通环图支持 ring_high_color（第一项颜色）
        const ringHighColor = chartJson?.ring_high_color;
        if (ringHighColor && ecOptions.series && ecOptions.series.length > 0) {
          const ringSeries = ecOptions.series[0];
          if (ringSeries.data && ringSeries.data.length > 0) {
            ringSeries.data[0].itemStyle = {
              normal: { color: ringHighColor }
            };
          }
        }
        
        // 计算原始数据的总和，确保总数正确
        let originalTotal = 0;
        cellData.forEach(function (data) {
          const num = data[seriesValueCols[0]];
          if (!isNaN(Number(num))) {
            originalTotal += Number(num);
          }
        });
        ecOptions.title = {
          text: originalTotal,
          left: "center",
          top: "center",
          padding: [24, 0],
          subtext: title,
          subtextStyle: {
            color: labelColor,
            fontSize: 14,
            align: "center", //文字水平对齐方式（left/right）
          },
          textStyle: {
            color: valColor,
            fontSize: 18,
            align: "center",
          },
        };
      }
      delete ecOptions.xAxis;
      delete ecOptions.yAxis;

      // 添加自动轮播功能
      if (chartJson?.more_option?.includes('自动轮播')) {
        // 配置轮播间隔时间，默认3秒
        const interval = chartJson.auto_play_interval || 3000;

        // 在配置中添加轮播相关的事件处理
        ecOptions.animation = true;
        ecOptions.animationDuration = 1000;
        ecOptions.animationEasing = 'cubicOut';

        // 保存原始的数据长度用于轮播
        let series = ecOptions["series"][0];
        const dataLength = series.data.length;

        // 添加轮播相关的配置到ecOptions中
        ecOptions._autoPlay = {
          dataLength: dataLength,
          interval: interval,
          currentIndex: 0
        };

        // 配置emphasis样式，让选中项更突出
        series.emphasis = {
          itemStyle: {
            shadowBlur: 20,
            shadowColor: 'rgba(0, 0, 0, 0.9)'
          }
        };
      }

      break;
    case "radar":
      // 默认配置
      ecOptions = {
        tooltip: {},
        legend: {
          data: ["预算分配", "实际开销"],
          type: "scroll",
          pageIconColor: pageItem?.style_json?.color || "#848EAC",
          pageTextStyle: {
            color: pageItem?.style_json?.color || "#848EAC",
          },
        },
        radar: {
          indicator: [
            {
              name: "销售",
              max: 6500,
            },
            {
              name: "管理",
              max: 16000,
            },
            {
              name: "信息技术",
              max: 30000,
            },
            {
              name: "客服",
              max: 38000,
            },
            {
              name: "研发",
              max: 52000,
            },
            {
              name: "市场",
              max: 25000,
            },
          ],
        },
        series: [
          {
            type: "radar",
            data: [
              {
                value: [4300, 10000, 28000, 35000, 50000, 19000],
                name: "预算分配",
              },
              {
                value: [5000, 14000, 28000, 31000, 42000, 21000],
                name: "实际开销",
              },
            ],
          },
        ],
      };
      if (
        chartJson?.series_name_cfg &&
        chartJson.series_value_cols &&
        cellData?.length
      ) {
        // 有配置名称字段跟值字段
        if (chartJson.series_value === "列数据") {
          // 单指标雷达图
          let datas = cellData.map((item) => item[chartJson.series_value_cols]);
          let max = Math.max(...datas) + "";
          max = Number(max) + Math.pow(10, max.length - 1);
          ecOptions.radar.indicator = cellData.map((item) => {
            return {
              name: item[chartJson.series_name_cfg],
              max: max,
            };
          });
          ecOptions.series = [
            {
              type: "radar",
              areaStyle: {
                normal: {
                  color: colors[0],
                },
              },
              symbolSize: 0,
              data: [
                {
                  value: datas,
                  name: "radar",
                },
              ],
            },
          ];
        }
      }

      break;
    case "wordcloud":
      let list = [
        {
          value: "50",
          name: "华为",
          textStyle: {
            shadowBlur: 4,
            shadowColor: "#ECEFFF",
            shadowOffsetY: 14,
            color: "#73DDFF",
          },
        }, // 50
        { value: "30", name: "VIVO" },
        { value: "29", name: "OPPO" },
        { value: "28", name: "HONOR" },
        { value: "27", name: "红米" },
        { value: "26", name: "小米" },
        { value: "25", name: "美图" },
        { value: "24", name: "ONEPLUS" },
        { value: "23", name: "魅族" },
      ];
      if (
        cellData?.length &&
        chartJson.series_value === "列数据" &&
        chartJson?.series_name_cfg &&
        chartJson.series_value_cols
      ) {
        list = cellData.map((item) => {
          return {
            name: item[chartJson?.series_name_cfg],
            value: item[chartJson?.series_value_cols],
          };
        });
      }
      ecOptions = {
        series: [
          {
            type: "wordCloud",
            // The shape of the "cloud" to draw. Can be any polar equation represented as a
            // callback function, or a keyword present. Available presents are circle (default),
            // cardioid (apple or heart shape curve, the most known polar equation), diamond (
            // alias of square), triangle-forward, triangle, (alias of triangle-upright, pentagon, and star.

            shape: "pentagon",

            // A silhouette image which the white area will be excluded from drawing texts.
            // The shape option will continue to apply as the shape of the cloud to grow.

            // Folllowing left/top/width/height/right/bottom are used for positioning the word cloud
            // Default to be put in the center and has 75% x 80% size.

            width: "100%",
            height: "100%",
            left: "0",
            top: "0",
            right: "0",
            bottom: "0",

            // Text size range which the value in data will be mapped to.
            // Default to have minimum 12px and maximum 60px size.

            sizeRange: [12, 40],

            // Text rotation range and step in degree. Text will be rotated randomly in range [-90, 90] by rotationStep 55

            rotationRange: [0, 0],
            rotationStep: 0,

            // size of the grid in pixels for marking the availability of the canvas
            // the larger the grid size, the bigger the gap between words.
            gridSize: 20,

            // set to true to allow word being draw partly outside of the canvas.
            // Allow word bigger than the size of the canvas to be drawn
            drawOutOfBound: false,

            // If perform layout animation.
            // NOTE disable it will lead to UI blocking when there is lots of words.
            layoutAnimation: true,

            // Global text style
            textStyle: {
              normal: {
                color: (v) => `${__colors[v.dataIndex]}`,
              },
              emphasis: {
                shadowBlur: 10,
                shadowColor: "#2ac",
              },
            },
            emphasis: {
              focus: "none",
            },

            // Data is an array. Each array item must have name and value property.
            data: list,
          },
        ],
      };
      break;
    case "map":
      delete ecOptions.xAxis;
      delete ecOptions.yAxis;
      ecOptions.series = [];
      const mapJson = pageItem?.chart_json?.map_json;
      const geoJson = pageItem?.chart_json?.map_base_geojson || chinaJson;
      // 同名 map 已注册则跳过，避免每次构建 option 都重复注册大体积 geoJSON
      if (!echarts.getMap("customMap")) {
        echarts.registerMap("customMap", geoJson);
      }
      let datas = [];
      let scatterDatas = []
      let spiderLineDatas = []
      let realPointDatas = []
      let mapSeriesIndex = -1
      let hasValueField = false
      if (cellData?.length) {
        const hasCoordFields = mapJson?.col_lon && mapJson?.col_lat;
        const hasRelocateCoordFields = mapJson?.relocate_col_lon && mapJson?.relocate_col_lat;
        const hasLabelField = mapJson?.col_label;
        const isValidCoord = (val) => val !== null && val !== undefined && val !== '' && !isNaN(Number(val));
        const getStableUpwardCurveness = (key, realLon, relocateLon) => {
          let hash = 0;
          for (let i = 0; i < key.length; i++) {
            hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
          }
          const normalized = (Math.abs(hash) % 1000) / 1000;
          const magnitude = 0.18 + (normalized % 0.27);
          const direction = Number(relocateLon) >= Number(realLon) ? 1 : -1;
          return Number((direction * magnitude).toFixed(2));
        };

        for (let i = 0; i < cellData.length; i++) {
          const regionName = mapJson?.col_label ? cellData[i][mapJson.col_label] : '';
          const rawValue = mapJson?.col_value ? cellData[i][mapJson.col_value] : undefined;
          if (rawValue != null && rawValue !== '' && mapJson?.col_value) {
            hasValueField = true;
          }
          const value = rawValue != null && rawValue !== '' ? rawValue : 1;

          datas.push({
            name: regionName,
            value: value
          });

          if (hasCoordFields) {
            const realLat = cellData[i][mapJson.col_lat];
            const realLon = cellData[i][mapJson.col_lon];
            const relocateLat = hasRelocateCoordFields ? cellData[i][mapJson.relocate_col_lat] : null;
            const relocateLon = hasRelocateCoordFields ? cellData[i][mapJson.relocate_col_lon] : null;
            const useRelocate = isValidCoord(relocateLat) && isValidCoord(relocateLon);
            const lat = Number(useRelocate ? relocateLat : realLat);
            const lon = Number(useRelocate ? relocateLon : realLon);
            if (!isNaN(lat) && !isNaN(lon)) {
              scatterDatas.push({
                name: regionName,
                value: [lon, lat, value],
                realValue: [Number(realLon), Number(realLat), value],
                useRelocate,
                rawData: cellData[i]
              });
              if (useRelocate && isValidCoord(realLat) && isValidCoord(realLon)) {
                const curvenessKey = [
                  Number(realLon).toFixed(6),
                  Number(realLat).toFixed(6),
                  lon.toFixed(6),
                  lat.toFixed(6),
                  regionName,
                  i,
                ].join('|');
                const curveness = getStableUpwardCurveness(curvenessKey, realLon, lon);

                spiderLineDatas.push({
                  name: regionName,
                  coords: [
                    [Number(realLon), Number(realLat)],
                    [lon, lat]
                  ],
                  lineStyle: {
                    curveness,
                  },
                  value,
                  rawData: cellData[i]
                });
                realPointDatas.push({
                  name: regionName,
                  value: [Number(realLon), Number(realLat), value],
                  rawData: cellData[i]
                });
              }
            }
          }

          if (hasLabelField && !scatterDatas.find(d => d.name === regionName)) {
            if (geoJson && regionName) {
              const coord = getGeoCoordFromGeoJson(geoJson, regionName);
              if (coord && coord.length === 2) {
                const coordArray = Array.isArray(coord) ? coord : Array.from(coord);
                if (coordArray.length === 2 && 
                    typeof coordArray[0] === 'number' && 
                    typeof coordArray[1] === 'number') {
                  scatterDatas.push({
                    name: regionName,
                    value: [coordArray[0], coordArray[1], value]
                  });
                }
              }
            }
          }
        }
      }

      // ecOptions['tooltip'] = {
      //   trigger: 'item',
      //   formatter: '{b}<br/>{c}'
      // }
      ecOptions.tooltip = {
        trigger: "item",
        formatter: function (params) {
          if (typeof params.value === 'number' && !isNaN(params.value)) {
            return hasValueField ? params.name + " : " + params.value : params.name;
          } else if (Array.isArray(params.value) && params.value.length === 3) {
            return hasValueField ? params.name + " : " + params.value[2] : params.name;
          } else {
            return params.name;
          }
        },
      };

      if (datas?.length) {
        let iconSize = 20;
        if (mapJson?.icon_scale) {
          let iconScale = mapJson?.icon_scale || 1;
          if (layout?.w) {
            iconSize = (layout?.w * iconScale) / 100;
            if (layout.colNum === 100) {
              iconSize = (layout?.w * 12 * iconScale) / 100;
            }
          }
        }

        let mapSeries = {
          type: 'map',
          label: {
            normal: {
              show: true,
              textStyle: {
                color: '#fff',
                fontSize: 12
              },
            },
            emphasis: {
              show: true,
              textStyle: {
                color: '#fff',
                fontSize: 12
              },
            },
          },
          itemStyle: {
            
            normal: {
              borderColor: '#2ab8ff',
              borderWidth: 1.5,
              areaColor: '#12235c',
            },
            emphasis: {
              areaColor: '#2AB8FF',
            },
          },
          left: 'center',
          data: datas,
          zoom: 1.2,
          roam: false,
          map: 'customMap',
          // geoIndex: 0,
          aspectScale: 0.75,
          showLegendSymbol: false,
          animation: false,
          zlevel: 6,
        }
        let serie = {
          type: 'scatter',
          coordinateSystem: 'geo',
          symbol: mapJson?.icon_default ? `image://${getImagePath(mapJson.icon_default)}` : 'pin',
          symbolSize: function(val) {
             if (val && val.length === 3) {
               const maxSize = 50;
               const minSize = 30;
               const dataValues = datas.map(d => Number(d.value)).filter(v => !isNaN(v));
               const valueMax = dataValues.length ? Math.max(...dataValues) : 1;
               const valueMin = dataValues.length ? Math.min(...dataValues) : 0;
               
               const normalizedValue = valueMax === valueMin ? 0.5 : (val[2] - valueMin) / (valueMax - valueMin);
               
               return minSize + normalizedValue * (maxSize - minSize);
             }
             return 30;
           },
          label: {
            normal: {
              show: false,
              position: 'inside',
              textStyle: {
                color: '#fff',
                fontSize: 12,
                fontWeight: 'bold'
              },
              formatter: function(params) {
                if (params.value && params.value.length === 3 && mapJson?.icon_default && hasValueField) {
                  return params.value[2];
                }
                return '';
              }
            }
          },
          itemStyle: {
            normal: {
              color: '#F62157',
            }
          },
          data: scatterDatas,
          zlevel: 9,
          z: 9,
        };
        
        const showBubble = !mapJson?.map_option?.includes('隐藏气泡');
        if (spiderLineDatas.length) {
          ecOptions.series.push({
            type: 'lines',
            coordinateSystem: 'geo',
            polyline: false,
            data: spiderLineDatas,
            lineStyle: {
              color: '#cb6c12',
              width: 2,
              opacity: 1,
              type: 'dashed',
              curveness: 0.25,
            },
            effect: {
              show: false,
            },
            silent: true,
            zlevel: 7,
            z: 7,
          });
        }
        if (realPointDatas.length) {
          ecOptions.series.push({
            type: 'scatter',
            coordinateSystem: 'geo',
            symbol: 'circle',
            symbolSize: 6,
            itemStyle: {
              color: '#cb6c12',
              borderColor: '#fff',
              borderWidth: 1,
            },
            tooltip: {
              show: false,
            },
            silent: true,
            data: realPointDatas,
            zlevel: 8,
            z: 8,
          });
        }
        if (showBubble) {
          ecOptions.series.push(serie);
        }

        mapSeriesIndex = ecOptions.series.length;
        ecOptions.series.push(mapSeries);
        
        if (geoJson) {
          ecOptions.geo = {
            show: true,
            map: 'customMap',
            zoom: 1.2,
            left: 'center',
            roam: false,
            label: {
            normal: {
              show: true,
              color: '#fff',
            },
            emphasis: {
              show: true
            }
          },
            itemStyle: {
              normal: {
                borderColor: '#2ab8ff',
                areaColor: '#013C62',
              },
              emphasis: {
                areaColor: '#2AB8FF',
              },
            },
          };
        }
      }
      if (datas?.length) {
        const values = datas.map(d => Number(d.value)).filter(v => !isNaN(v));
        if (values.length) {
          const rawMin = Math.min(...values);
          const rawMax = Math.max(...values);
          const range = rawMax - rawMin;
          const pad = range === 0 ? Math.max(Math.abs(rawMax), 1) * 0.1 : range * 0.1
          ecOptions.visualMap = ecOptions.visualMap || {};
          ecOptions.visualMap.min = Number((rawMin - pad).toFixed(2));
          if (ecOptions.visualMap.min < 0) {
            ecOptions.visualMap.min = 0;
          }
          ecOptions.visualMap.max = Number((rawMax + pad).toFixed(2));
          if (mapSeriesIndex > -1) {
            ecOptions.visualMap.seriesIndex = [mapSeriesIndex];
          }
        }
      }
      break;
    default:
      break;
  }
  if (showLegend === false) {
    ecOptions.legend = {
      show: false,
    }
  }
  return ecOptions;
};

const buildMultiColSeries = (pageItem, cellData = [], type) => {
  let chartJson = pageItem?.chart_json || {};
  let datas = cellData;
  let seriesName = chartJson?.series_name_cfg || "";
  const sortAxisCol = chartJson?.sort_axis_col;
  let xAxisData = cellData.map((item) => item[sortAxisCol]);
  xAxisData = [...new Set(xAxisData)];
  let lineVal1 = chartJson?.refer_line1 || "none";
  let lineVal2 = chartJson?.refer_line2 || "none";

  let colors = [...__colors];
  if (chartJson?.legend_color_seq) {
    colors = chartJson?.legend_color_seq.split(",");
  }

  if (seriesName && Array.isArray(datas) && datas.length > 0) {
    let seriesNames = datas.reduce((pre, cur) => {
      if (!pre.includes(cur[seriesName])) {
        pre.push(cur[seriesName]);
      }
      return pre;
    }, []);
    let series = seriesNames.map((name, index) => {
      let obj = {
        name: name,
        type: type || "line",
        // data: datas
        //   .filter((e) => e[seriesName] === name)
        //   .map((item) => item[chartJson.series_value_cols]),
        data: xAxisData.map((a, index) => {
          const data = datas.find(
            (e) => e[seriesName] === name && e[sortAxisCol] === a
          );
          const val = data?.[chartJson.series_value_cols] || 0;
          if (!isNaN(Number(val))) {
            return Number(val.toFixed(2));
          }
        }),
        symbol: "circle",
        smooth: true,
        // yAxisIndex: 0,
        showSymbol: true,
        // tooltip: {
        //   trigger: 'item' // axis 代表着同列的所有项的值  item  单个项的值  none 什么都不展示 三个值
        // }, //点击折点 展示的样式
      };

      const baseColor = colors[index % colors.length];
      const isArea = chartJson?.more_option?.includes('折线面积图');
      const enableGradient = chartJson?.more_option?.includes('自动渐变色');

      if (obj.type === "bar") {
        if (chartJson?.bar_width) {
          obj.barWidth = chartJson.bar_width;
        } else {
          obj.barMaxWidth = 50;
          obj.barMinWidth = 20;
        }
        if (enableGradient) {
          obj.itemStyle = {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: baseColor },
              { offset: 1, color: baseColor + "80" },
            ]),
          };
        }
      } else if (obj.type === "line") {
        obj.lineStyle = {
          color: baseColor,
        };
        obj.itemStyle = {
          color: baseColor,
        };
        if (isArea && enableGradient) {
          obj.areaStyle = {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: baseColor + "80" },
              { offset: 1, color: baseColor + "20" },
            ]),
          };
        }
      }

      if (lineVal1 && lineVal2 && lineVal1 !== "none" && lineVal2 !== "none") {
        obj.markLine = {
          symbol: "none",
          label: {
            show: true,
            // position: 'right',
            // formatter: '{b}'      // 注释掉显示值，放开不显示值
          },
          data: [
            {
              // name: '阈值',
              yAxis: lineVal1,
            },
            {
              yAxis: lineVal2,
            },
          ],
          lineStyle: {
            color: "#FF7A42",
            type: "solid",
          },
        };
      }
      if (chartJson?.more_option?.includes("stack")) {
        obj.stack = "stack";
      }
      if (
        chartJson.more_option &&
        chartJson.more_option.indexOf("x轴反序") > -1
      ) {
        obj["data"] = obj["data"].reverse();
      }
      return obj;
    });
    let sortData = datas.sort(
      (a, b) => a[chartJson.series_value_cols] - b[chartJson.series_value_cols]
    );

    let maxVal = sortData[sortData.length - 1][chartJson.series_value_cols];

    if (chartJson?.more_option?.includes('序列堆叠')) {
      maxVal = 0;
      xAxisData.forEach(xVal => {
        let sum = 0;
        seriesNames.forEach(name => {
          const data = datas.find(
            (e) => e[seriesName] === name && e[sortAxisCol] === xVal
          );
          sum += data?.[chartJson.series_value_cols] || 0;
        });
        if (sum > maxVal) {
          maxVal = sum;
        }
      });
    }

    // const niceMax = getNiceMax(maxVal);

    return {
      series: series,
      legend: seriesNames,
      min: sortData[0][chartJson.series_value_cols],
      // max: niceMax,
    };
  }
};

/**
 * 生成图表默认配置
 * @param {*} chartType 图表类型
 * @param {*} chartJson 图表配置
 */
export const setDefaultChartOption = (chartType, chartJson, eCharts) => {
  const colors = [...__colors];
  const option = {
    color: colors,
    tooltip: {},
    legend: {
      itemStyle: {
        // color: "#E8E8E8",
      },
      textStyle: {
        color: "#E8E8E8",
      },
      pageIconColor: "#E8E8E8",
      pageTextStyle: {
        color: "#E8E8E8",
      },
    },
    series: [],
  };
  const datas = [0, 1, 2, 3, 4, 5].map((item) => {
    return Math.random() * 100;
  });
  switch (chartType) {
    case "line":
    case "bar":
      option.series = [
        {
          name: "销量",
          type: chartType || "bar",
          data: datas,
        },
      ];
      if (chartJson?.more_option?.includes('折线面积图')) {
        option.series[0].areaStyle = {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0, color: 'rgba(255, 199, 43, 0.3)' // 0% 处的颜色
            }, {
              offset: 1, color: 'rgba(255, 199, 43, 0)' // 100% 处的颜色
            }],
            global: false // 缺省为 false
          }
        }
      }
      option.xAxis = {
        data: ["衬衫", "羊毛衫", "雪纺衫", "裤子", "高跟鞋", "袜子"],
        axisLine: {
          lineStyle: {
            color: "#E8E8E8",
          },
        },
        axisLabel: {
          textStyle: {
            fontWeight: 400,
            fontSize: 10,
            color: "#E8E8E8",
          },
        },
      };
      option.yAxis = {
        axisLabel: {
          textStyle: {
            fontWeight: 400,
            fontSize: 10,
            color: "#E8E8E8",
          },
          formatter: "{value}",
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: "#E8E8E8",
          },
        },
        splitLine: {
          //修改背景线条样式
          show: false, //是否展示
          lineStyle: {
            color: "#E8E8E8", //线条颜色
            type: "dashed", //线条样式，默认是实现，dashed是虚线
          },
        },
      };
      option.legend.data = ["销量"];
      if (chartJson?.chart_type === "条形图") {
        let xAxis = JSON.parse(JSON.stringify(option.yAxis));
        option.yAxis = JSON.parse(JSON.stringify(option.xAxis));
        option.xAxis = xAxis;
      }
      break;
    case "pie":
    case "ring":
      option.legend = {
        show: false,
      };
      console.log(chartJson);
      var scale = 1;
      var scaleData = [
        {
          name: "工程建设",
          value: 10,
        },
        {
          name: "产权交易",
          value: 10,
        },
        {
          name: "土地交易",
          value: 10,
        },
        {
          name: "其他交易",
          value: 10,
        },
      ];
      var total = scaleData.reduce((pre, cur) => {
        return pre + cur.value;
      }, 0);
      var rich = {
        total: {
          color: chartJson?.ring_sum_color || chartJson?.ring_val_color || "#ffc72b",
          fontSize: 40 * scale,
          align: "center",
        },
        white: {
          color: "#ddd",
          align: "center",
          padding: [3, 0],
        },
        num: {
          color: chartJson?.ring_val_color || "#ffc72b",
          fontSize: 24 * scale,
          align: "center",
        },
      };
      if (chartType === "ring") {
        const title = chartJson?.ring_sum_label || "总数";
        option.title = {
          text: title,
          left: "center",
          top: "35%",
          padding: [24, 0],
          textStyle: {
            color: "#fff",
            fontSize: 18 * scale,
            align: "center",
          },
        };
      }

      var data = [];
      for (var i = 0; i < scaleData.length; i++) {
        data.push({
          value: scaleData[i].value,
          name: scaleData[i].name,
          itemStyle: {
            // normal: {
            //   borderWidth: 0,
            //   shadowBlur: 20,
            //   borderColor: color[i],
            //   shadowColor: color[i],
            // },
          },
        });
      }
      option.series = [
        {
          name: "",
          type: "pie",
          clockWise: false,
          // radius: ["50%", "52%"],
          radius: chartType === "ring" ? ["50%", "52%"] : "50%",
          hoverAnimation: false,
          itemStyle: {
            normal: {
              label: {
                show: true,
                position: "outside",
                color: "#ddd",
                formatter: function (params) {
                  var percent = 0;
                  var total = 0;
                  for (var i = 0; i < scaleData.length; i++) {
                    total += scaleData[i].value;
                  }
                  percent = ((params.value / total) * 100).toFixed(0);
                  if (params.name !== "") {
                    return params.name + "\n{white|" + "占比" + percent + "%}"
                    // + "\n{num|" + params.value + "}";
                  } else {
                    return "";
                  }
                },
                rich: rich,
              },
              labelLine: {
                length: 30,
                length2: 30,
                show: true,
                color: "#00ffff",
              },
            },
          },
          data: data,
        },
      ];
      break;
    case "map":
      if (echarts && eCharts && !echarts.getMap("customMap")) {
        // 同名 map 已注册则跳过，避免重复注册大体积 geoJSON
        echarts.registerMap("customMap", chartJson?.map_base_geojson || chinaJson);
      }
      option.legend = {
        show: false,
      };

      option.series = [
        {
          type: 'map',
          map: 'customMap',
          left: 'center',
          zoom: 1.2,
          roam: false,
          aspectScale: 0.75,
          label: {
            normal: {
              show: false,
              color: '#fff',
              fontSize: 12,
            },
            emphasis: {
              show: false,
              color: '#fff',
              fontSize: 12,
            },
          },
          itemStyle: {
            normal: {
              borderColor: '#2ab8ff',
              borderWidth: 1.5,
              areaColor: '#12235c',
            },
            emphasis: {
              areaColor: '#2AB8FF',
            },
          },
          showLegendSymbol: false,
          animation: false,
          zlevel: 6,
        },
      ];

      const geoCfg = {
        show: true,
        map: "customMap",
        // aspectScale: 1,
        zoom: 1.2,//当前视角的缩放比例
        left: 'center', // 地图居中
        label: {
          normal: {
            show: false,
            color: "#fff"
          },
          emphasis: {
            show: false,
            color: "#fff"
          }
        },
        roam: false,

        itemStyle: {//地图区域的多边形 图形样式
          normal: {
            borderColor: '#2ab8ff',
            areaColor: '#013C62',//地区颜色
            // shadowColor: '#182f68',//阴影颜色
            shadowColor: '#12235c',//阴影颜色
            shadowOffsetX: 10,//阴影偏移量
            shadowOffsetY: 10,//阴影偏移量
          },
          emphasis: {
            areaColor: '#2AB8FF',//地区颜色
            label: {
              show: false,//是否在高亮状态下显示标签
            },
          },
        },
      }
      // if(chartJson?.map_json?.map_option?.includes('显示气泡')){
      option['geo'] = geoCfg
      // }
      option['visualMap'] = {
        type: 'continuous',
        seriesIndex: [0],
        show: true,
        // min: 0,
        // max: 100,
        left: '20',
        top: 'bottom',
        text: ['高', '低'], // 文本，默认为数值文本
        textStyle: {
          color: "#fff",
          fontSize: 16,
          align: "center",
        },
        calculable: true,
        // seriesIndex: [0],
        inRange: {
          color: ['#0055FF', '#0FDFDE']
        }
      }
      break;
  }
  return option;
};

// 饼图自动轮播控制函数
export const startPieAutoPlay = (chartInstance, ecOptions) => {
  if (!chartInstance || !ecOptions?._autoPlay) return;

  const { dataLength, interval } = ecOptions._autoPlay;
  let currentIndex = 0;

  // 清除之前的高亮
  chartInstance.dispatchAction({
    type: 'downplay',
    seriesIndex: 0
  });

  // 高亮当前项
  const highlightItem = () => {
    // 先取消所有高亮
    chartInstance.dispatchAction({
      type: 'downplay',
      seriesIndex: 0
    });

    // 高亮当前项
    chartInstance.dispatchAction({
      type: 'highlight',
      seriesIndex: 0,
      dataIndex: currentIndex
    });

    // 显示提示框
    chartInstance.dispatchAction({
      type: 'showTip',
      seriesIndex: 0,
      dataIndex: currentIndex
    });

    currentIndex = (currentIndex + 1) % dataLength;
  };

  // 立即执行一次
  highlightItem();

  // 设置定时器
  const timer = setInterval(highlightItem, interval);

  // 返回清除函数
  return () => {
    clearInterval(timer);
    chartInstance.dispatchAction({
      type: 'downplay',
      seriesIndex: 0
    });
    chartInstance.dispatchAction({
      type: 'hideTip'
    });
  };
};
