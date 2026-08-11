/**
 * 低代码纯函数工具库（ES Module，无 Vue 实例依赖）
 *
 * 从旧工程 vue_util.js 的 Vue.prototype 方法中提取，可独立复用、支持 tree-shaking。
 * 依赖 Vue 实例的方法（getNodePath / openLoading / jumpAction 等）保留在 vue_util.js。
 */
import dayjs from "dayjs";
import { parseUrlParams } from "@/util/DataUtil";
import { backendIpAddr, getEnv } from "@/common/http";
import { pathConfigMap } from "@/common/envList";

/**
 * 解析当前应用名（app）
 * 优先级：组件链 $srvApp > URL query srvApp > frame dataset.app > 静态环境配置 > top.pathConfig
 * @param {Object} vm - Vue 组件实例（可选）
 */
export function resolveDefaultSrvApp(vm) {
  let node = vm || null;
  while (node) {
    if (node.$srvApp) return node.$srvApp;
    node = node.$parent || null;
  }
  if (vm?.$route?.query?.srvApp) {
    return vm.$route.query.srvApp;
  }
  const frameApp = window.frameElement?.dataset?.app;
  if (frameApp) return frameApp;
  const envApp = pathConfigMap[getEnv()]?.application;
  if (envApp) return envApp;
  try {
    return top.window?.pathConfig?.application || "config";
  } catch (e) {
    return "config";
  }
}

/**
 * 拼接服务接口地址
 * @param {"select"|"operate"} operateType
 * @param {string} service
 * @param {string} app
 */
export function getServiceUrl(operateType, service, app) {
  const resolvedApp = app || resolveDefaultSrvApp();
  return `${backendIpAddr}/${resolvedApp}/${operateType}/${service}`;
}

/**
 * 构造图片访问地址（fileNo -> 完整 URL）
 * @param {string} no - 文件编号或完整地址
 * @param {number} [size] - 缩略尺寸
 */
export function getImagePath(no, size) {
  if (no && typeof no === "string") {
    if (
      (no.indexOf("http://") !== -1 || no.indexOf("https://") !== -1) &&
      no.indexOf("filePath=") === -1
    ) {
      return no;
    }
    if (no.indexOf("data:image") !== -1 && no.indexOf("base64") !== -1) {
      return no;
    }
    if (no.indexOf("&bx_auth_ticket") !== -1) {
      no = no.split("&bx_auth_ticket")[0];
    }
    const imageFileNo =
      window.serviceApi?.imageFileNo || `${backendIpAddr}/file/download?fileNo=`;
    let url = `${imageFileNo}${no}`;
    const ticket = sessionStorage.getItem("bx_auth_ticket");
    if (ticket) {
      url += `&bx_auth_ticket=${ticket}`;
    }
    if (size) {
      const thumbnailSize = Number(size);
      if (!isNaN(thumbnailSize)) {
        url += `&thumbnailType=fwsu_${thumbnailSize}`;
      }
    }
    if (location.href?.includes("/editor/")) {
      url += `&t=${new Date().getTime()}`;
    }
    return url;
  }
  return "";
}

/**
 * 构造 v2 列配置查询参数
 */
export function getV2RequestData(service_name, use_type, mainSrv, idVal) {
  const requestData = {
    serviceName: "srvsys_service_columnex_v2_select",
    colNames: ["*"],
    condition: [
      { colName: "service_name", value: service_name, ruleType: "eq" },
      { colName: "use_type", value: use_type, ruleType: "eq" },
    ],
    order: [{ colName: "seq", orderType: "asc" }],
  };
  if (mainSrv) {
    requestData.condition.push({
      colName: "main_srv",
      value: mainSrv,
      ruleType: "eq",
    });
  }
  if (
    mainSrv &&
    ["detail", "detaillist", "treelist"].includes(use_type) &&
    ![null, undefined, ""].includes(idVal)
  ) {
    requestData.condition.push({ colName: "id", value: idVal, ruleType: "eq" });
  }
  const params = parseUrlParams(decodeURIComponent(window.location.href));
  if (params && params.v2Params) {
    try {
      const v2Params = JSON.parse(decodeURIComponent(params.v2Params));
      if (v2Params && Array.isArray(v2Params.condition)) {
        requestData.condition = requestData.condition.concat(v2Params.condition);
      }
    } catch (error) {
      console.error(error);
    }
  }
  return requestData;
}

function findParentHasPageInstance(vm) {
  if (vm.procPageInstance) return vm.procPageInstance;
  if (vm.$parent) {
    return findParentHasPageInstance(vm.$parent);
  }
  return undefined;
}

/**
 * 通用查询（http 由调用方注入，便于复用与测试）
 * @param {Object} http - axios 实例（$http）
 */
export function doSelect(
  http,
  url,
  service_name,
  condition,
  page,
  order,
  group,
  mapcondition,
  isproc,
  columns,
  relationCondition,
  draft,
  pageType,
  srvAuth,
  vpageNo,
  use_type,
  rdt,
  divCondition
) {
  const query = {
    serviceName: service_name,
    colNames: columns || ["*"],
    condition: condition || [],
    relation_condition: relationCondition || {},
    page,
    order,
    draft,
    vpage_no: vpageNo,
    use_type,
  };
  const procPageInstance = findParentHasPageInstance(http);
  if (procPageInstance) {
    query.proc_page_instance = procPageInstance;
  }
  if (divCondition) {
    query.divCond = divCondition;
  } else if (
    query.condition.length &&
    query.condition.find((item) => item.use_div_calc === "是")
  ) {
    const divCond = query.condition.filter((item) => item.use_div_calc === "是");
    if (divCond?.length) {
      query.divCond = divCond.map(({ colName, ruleType, value }) => ({
        colName,
        ruleType,
        value,
      }));
      query.condition = query.condition.map(({ colName, ruleType, value }) => ({
        colName,
        ruleType,
        value,
      }));
    }
  }
  if (query.divCond?.length) {
    if (query.condition?.length) {
      query.condition = query.condition.map((item) => {
        if (item.ruleType === "like" && resolveDefaultSrvApp() !== "log") {
          item.ruleType = "eq";
        }
        return item;
      });
    }
    query.divCond = query.divCond.map((item) => {
      if (!Array.isArray(item.value)) {
        item.value = [item.value];
      }
      return item;
    });
  }
  if (use_type === "treelist" && rdt) {
    query.rdt = rdt;
    if (query.page?.rownumber) {
      query.page.rownumber = 9999;
    }
  }
  if (pageType && pageType === "list_page") {
    query.query_source = "list_page";
  }
  if (isproc) {
    query.proc_data_type = isproc;
  }
  if (group) {
    query.group = group;
  }
  if (mapcondition != undefined && mapcondition != "" && mapcondition != null) {
    query.map_table_condtion = mapcondition;
  }

  url = url + "?" + service_name;
  const defaultApp = resolveDefaultSrvApp();
  if (
    srvAuth &&
    sessionStorage.getItem(`bx_srv_auth_ticket-${defaultApp}-${service_name}`)
  ) {
    return http.post(url, query, {
      headers: {
        bx_auth_ticket: sessionStorage.getItem("bx_auth_ticket"),
        "bx-auth-ticket": sessionStorage.getItem("bx_auth_ticket"),
        bx_srv_auth_ticket: sessionStorage.getItem(
          `bx_srv_auth_ticket-${defaultApp}-${service_name}`
        ),
      },
    });
  }
  return http.post(url, query);
}

/**
 * 查询（http 由调用方注入）
 */
export function select(
  http,
  service_name,
  condition,
  page,
  order,
  group,
  mapcondition,
  app,
  isproc,
  columns,
  relationCondition,
  draft,
  pageType,
  srvAuth,
  vpageNo,
  useType,
  rdt,
  divCondition
) {
  const url = getServiceUrl("select", service_name, app);
  return doSelect(
    http,
    url,
    service_name,
    condition,
    page,
    order,
    group,
    mapcondition,
    isproc,
    columns,
    relationCondition,
    draft,
    pageType,
    srvAuth,
    vpageNo,
    useType || "list",
    rdt,
    divCondition
  );
}

/**
 * 附件列表查询
 */
export function selectFileList(http, file_no) {
  const serviceName = "srvfile_attachment_select";
  const url = getServiceUrl("select", serviceName, "file");
  return doSelect(
    http,
    url,
    serviceName,
    [
      { colName: "file_no", value: file_no, ruleType: "eq" },
      { colName: "is_delete", value: "1", ruleType: "eq" },
    ],
    null,
    [{ colName: "seq", orderType: "asc" }]
  );
}

/**
 * 批量操作
 */
export function operate(http, requests) {
  const service = requests.length > 0 ? requests[0].serviceName : "";
  const srvApp = requests[0].srvApp;
  const url = getServiceUrl("operate", service, srvApp);
  return http.post(url, requests);
}

/**
 * v2 列配置查询
 */
export function doLoadColsV2(http, service_name, use_type, app, mainSrv, idVal) {
  const data = getV2RequestData(service_name, use_type, mainSrv, idVal);
  const url = getServiceUrl("select", "srvsys_service_columnex_v2_select", app);
  return http.post(`${url}?colsel_v2=${service_name}`, data);
}

/**
 * 深拷贝
 */
export function bxDeepClone(obj) {
  if (obj == null) return null;
  const newObj = obj instanceof Array ? [] : {};
  for (const i in obj) {
    newObj[i] = typeof obj[i] === "object" ? bxDeepClone(obj[i]) : obj[i];
  }
  return newObj;
}

/**
 * 生成 UUID
 */
export function getUuid() {
  const s4 = () =>
    Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

/**
 * 表达式求值（返回默认值兜底）
 */
export function evalBxExpr(expr, data, vm, defaultValue) {
  try {
    if (expr && typeof expr === "string" && expr.trim() === "new Date()") {
      const value = eval(expr);
      if (value && value.getTime && typeof value.getTime === "function") {
        return dayjs(value).format("YYYY-MM-DD HH:mm:ss");
      }
    }
    return eval(expr);
  } catch (e) {
    return defaultValue || null;
  }
}

/**
 * 模板字符串渲染 ${key} / ${a.b.c}
 */
export function renderStr(str, obj = {}) {
  const tryParseJson = (value) => {
    if (value && typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed === "object" && parsed !== null) {
          return parsed;
        }
      } catch (e) {
        return value;
      }
    }
    return value;
  };

  const target = tryParseJson(obj);

  if (typeof target === "object" && str && typeof str === "string") {
    return str.replace(/\$\{(.*?)\}/g, (match, key) => {
      key = key.trim();
      let result = target;
      for (const item of key.split(".")) {
        try {
          result =
            result[item] || result[item] === false || result[item] === 0
              ? result[item]
              : "";
          if (result === 0) {
            result = "0";
          }
          result = tryParseJson(result);
        } catch (e) {
          break;
        }
      }
      return result;
    });
  }
  return str;
}

/**
 * 条件表达式取值（${} / data. / mainData. / 值类型对象）
 */
export function evalCondValue(value, row = {}, mainData = {}) {
  if (!value || typeof value === "string") {
    if (value?.includes("${")) {
      return renderStr(value, row);
    }
    if (value?.includes("data.")) {
      try {
        const key = value.split("data.")[1];
        return key ? row?.[key] || "" : value;
      } catch (error) {
        return value;
      }
    }
    if (value?.includes("mainData.")) {
      try {
        const key = value.split("mainData.")[1];
        return key ? mainData?.[key] || "" : value;
      } catch (error) {
        return value;
      }
    }
    return value;
  }
  if (value?.value_type === "rowData") {
    return row[value.value_key];
  }
  if (value?.value_type === "mainData" && value.value_key) {
    return mainData[value.value_key];
  }
  if (value?.value_type === "constant" && value.value) {
    return value.value;
  }
  return value;
}

/**
 * 富文本文件地址替换（$bxFileAddress$ -> 服务端下载地址）
 */
export function recoverFileAddress4richText(val = "") {
  const prefix = backendIpAddr + "/file/download";
  val = val?.replaceAll?.("$bxFileAddress$", prefix) || "";
  const ticketStr = `bx_auth_ticket=${sessionStorage.bx_auth_ticket}`;
  return val.replace(/(bx_auth_ticket=)[^&]+/gi, ticketStr);
}

/**
 * 路由版本号解析（/v2/xxx -> v2）
 */
export function getVersionNo(route) {
  const paths = (route?.path || "").split("/");
  if (paths.length > 1 && /^v\d*$/.test(paths[1])) {
    return paths[1];
  }
  return "";
}

/**
 * 新标签页打开（兼容主站 top.tab 集成，跨域自动降级 window.open）
 */
export function addTabByUrl(url, tabTitle, urlParams, type, pagePathMap = {}) {
  const finalUrl = url || (pagePathMap[type] || "") + "?data=" + urlParams;
  try {
    if (window.top.tab && window.top.tab.addTab) {
      window.top.tab.addTab({ title: tabTitle || "新标签页", url: finalUrl });
      return;
    }
  } catch (e) {
    // 跨域 iframe 无法访问 top
  }
  const newWindow = window.open(
    finalUrl,
    "CNN_WindowName",
    "menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes"
  );
  if (newWindow) {
    newWindow.document.title = tabTitle;
  }
}
