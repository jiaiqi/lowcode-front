import axios from "axios";
import Vue from "vue";
import { Message } from "element-ui";
import loginDialog from "@/components/ui/login-dialog/login-dialog.vue";
import { pathConfigMap } from "./envList";

let _loginDialog = null;
let bx_auth_ticket = "";

// ==================== 环境配置自动识别 ====================
// 优先级（从高到低）：
//   1. URL 参数 ?env=xxx（仅开发环境生效）
//   2. sessionStorage dev_env（开发时页面切换）
//   3. .env.local / .env 中的 VUE_APP_DEFAULT_ENV（构建时注入）
//   4. 默认值 'dev'

/**
 * 从 URL 查询参数中提取指定参数的值
 * @param {string} name - 参数名
 * @returns {string|null}
 */
export function getQueryParam(name) {
  const reg = new RegExp(`(^|&)${name}=([^&]*)(&|$)`, "i");
  let r = window.location.search.substr(1).match(reg);
  if (!r && window.location.hash) {
    const hashSearch = window.location.hash.split("?")[1] || "";
    r = hashSearch.match(reg);
  }
  if (r != null) {
    return decodeURIComponent(r[2]);
  }
  return null;
}

/**
 * 解析当前环境名称
 * 优先级：URL 参数 > sessionStorage > .env 变量 > 默认值
 */
function resolveEnv() {
  // 1. URL 参数（仅开发环境生效，方便临时调试）
  if (process.env.NODE_ENV === "development") {
    const urlEnv = getQueryParam("env");
    if (urlEnv && pathConfigMap[urlEnv]) {
      return urlEnv;
    }
  }

  // 2. sessionStorage（开发时页面内切换后持久化）
  const storedEnv = sessionStorage.getItem("dev_env");
  if (storedEnv && pathConfigMap[storedEnv]) {
    return storedEnv;
  }

  // 3. .env.local / .env 中的 VUE_APP_DEFAULT_ENV（构建时注入）
  const envFromDotEnv = process.env.VUE_APP_DEFAULT_ENV;
  if (envFromDotEnv && pathConfigMap[envFromDotEnv]) {
    return envFromDotEnv;
  }

  // 4. 默认（延安园区开发）
  return "parkDev";
}

const ENV = resolveEnv();
window.env = ENV;

export const getEnv = () => ENV;

export const getHomePageNo = () => {
  return pathConfigMap[ENV]?.homePageNo;
};

// ==================== baseURL 解析（独立域名/二级目录部署，跨域安全） ====================
// 不再依赖跨域 window.top.pathConfig（独立域名后访问 top 会抛异常）。
// 优先级：window.backendIpAddr（部署注入）> sessionStorage.pathConfig > 静态 envList 配置
let baseURL = window.backendIpAddr;

const configuredGateway = pathConfigMap[ENV]?.gateway || "";
if (configuredGateway) {
  baseURL = configuredGateway;
}

// 兼容旧部署：同源顶层窗口注入的 pathConfig（跨域时静默忽略）
try {
  if (window.top?.pathConfig?.gateway && window.self === window.top) {
    baseURL = window.top.pathConfig.gateway;
  }
} catch (e) {
  // 跨域 iframe 无法访问 top，忽略
}
let sessionPathConfig = sessionStorage.pathConfig;
if (sessionPathConfig) {
  try {
    sessionPathConfig = JSON.parse(sessionPathConfig);
    if (sessionPathConfig?.gateway) {
      baseURL = sessionPathConfig?.gateway;
    }
  } catch (error) { }
}
if (window.backendIpAddr) {
  baseURL = window.backendIpAddr;
}
window.backendIpAddr = baseURL;
export const backendIpAddr = baseURL;

// ==================== 跨域登录态注入（iframe postMessage） ====================
// 主站业务页 iframe 嵌入低代码页时，父窗口通过 postMessage 注入登录票据与用户信息。
// 允许的父窗口 origin 白名单在 public/config/config_dev.js 的 APP_CONFIG.allowedOrigins 配置；
// 未配置时默认接受（内网部署），生产建议配置。
const ALLOWED_PARENT_ORIGINS = (() => {
  try {
    return (window.APP_CONFIG && window.APP_CONFIG.allowedOrigins) || [];
  } catch (e) {
    return [];
  }
})();
if (typeof window.addEventListener === "function") {
  window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || typeof data !== "object" || data.type !== "LC_AUTH_INJECT") {
      return;
    }
    if (
      ALLOWED_PARENT_ORIGINS.length &&
      !ALLOWED_PARENT_ORIGINS.includes(event.origin)
    ) {
      console.warn("[http] 拒绝未知 origin 的登录注入:", event.origin);
      return;
    }
    if (data.bx_auth_ticket) {
      sessionStorage.setItem("bx_auth_ticket", data.bx_auth_ticket);
    }
    if (data.user) {
      sessionStorage.setItem(
        "current_login_user",
        JSON.stringify(data.user)
      );
      window.user = data.user;
    }
  });
}

const instance = axios.create({
  baseURL: baseURL,
  timeout: 1000 * 60 * 10,
  // 6分钟超时
  withCredentials: true,
  // headers: {'X-Custom-Header': 'foobar'}
});
instance.interceptors.request.use(
  function (config) {
    // 在发送请求之前做些什么
    bx_auth_ticket = sessionStorage.getItem("bx_auth_ticket");
    if (bx_auth_ticket) {
      config.headers.set("bx_auth_ticket", bx_auth_ticket);
      config.headers.set("bx-auth-ticket", bx_auth_ticket);
    }
    return config;
  },
  function (error) {
    // 对请求错误做些什么
    return Promise.reject(error);
  }
);
instance.interceptors.response.use(
  function (response) {
    // 2xx 范围内的状态码都会触发该函数。
    // 对响应数据做点什么
    // let _this = window.app; //vue实例
    if (response.hasOwnProperty("status") && response.status === 429) {
      // 当前使用人数过多，请稍后再试
      try {
        window.top.limitingTips && window.top.limitingTips();
      } catch (e) { /* 跨域 iframe 无法访问 top */ }
    }
    if (response.data.state == "FAILURE") {
      if (response.data.resultCode == "0011") {
        if (
          process?.env?.NODE_ENV === "development" ||
          window.self === window.top
        ) {
          // 开发环境 调用登录弹窗
          let dialog = null;
          if (Vue.prototype.$loginRef) {
            // 使用 App.vue 中已经存在的登录对话框实例
            dialog = Vue.prototype.$loginRef;
          } else if (!_loginDialog) {
            // 创建新的登录对话框实例并添加到 DOM
            let ComponentClass = Vue.extend(loginDialog);
            dialog = new ComponentClass();
            _loginDialog = dialog;
            dialog.$mount();
            // 将登录对话框添加到 DOM
            document.body.appendChild(dialog.$el);
          } else {
            dialog = _loginDialog;
          }
          dialog?.open((o) => {
            if (sessionStorage.bx_auth_ticket) {
              const isReload = window.confirm("登录票据更新，是否刷新页面？");
              if (isReload) {
                window.location.reload();
                setTimeout(() => {
                  window.user = JSON.parse(
                    sessionStorage.getItem("current_login_user")
                  );
                }, 500);
              }
            }
          });
        } else {
          // iframe 中：跳转登录（SSO 优先，其次主站登录页）
          if (top !== window) {
            let login_page = "/main/index.html";
            try {
              if (top.getMainAddress) {
                console.info("1");
                login_page = "/" + top.getMainAddress();
              }
            } catch (exception) { }
            // SSO 兜底：独立域名部署时配置 APP_CONFIG.ssoLoginUrl，
            // 未配置则回退主站登录页跳转
            let ssoUrl = "";
            try {
              ssoUrl = (window.APP_CONFIG && window.APP_CONFIG.ssoLoginUrl) || "";
            } catch (e) { }
            if (ssoUrl) {
              window.location.href = `${ssoUrl}?redirect=${encodeURIComponent(
                window.location.href
              )}`;
            } else {
              window.location.href = window.location.origin + login_page;
            }
          }
        }
      } else if (response.data.resultCode == "0000") {
        if (sessionStorage.getItem("need_login_flag") != "need_login") {
          Message.error(response.data.resultMessage);
        }
      } else {
        if (response.data.resultCode !== "9998") {
          if (response.data.serviceInfo?.includes("sql语句执行异常")) {
            console.error(response.data.serviceInfo);
          } else if (
            sessionStorage.getItem("need_login_flag") != "need_login"
          ) {
            // Message.error(response.data.resultMessage);
          }
        }
      }
    }
    if (response.data) {
      response.body = response.data;
    }
    return response;
  },
  function (error) {
    // 超出 2xx 范围的状态码都会触发该函数。
    // 对响应错误做点什么
    return Promise.reject(error);
  }
);

export const $http = instance;

/**
 *
 * @param {*} url
 * @param {*} req
 * @returns
 */
export async function $selectOne(url, req) {
  const res = await $http.post(url, req);
  if (res?.data?.state === "SUCCESS") {
    if (res.data?.data?.length > 0) {
      return {
        ok: true,
        data: res.data?.data?.[0],
      };
    } else {
      return {
        ok: false,
        data: {},
        msg: "未查询到数据",
      };
    }
  } else {
    return {
      ok: false,
      data: {},
      msg: res?.data?.resultMessage || "请求失败",
    };
  }
}

export async function $selectList(url, req) {
  const res = await $http.post(url, req);
  if (res?.data?.state === "SUCCESS") {
    return {
      ok: true,
      data: res.data?.data,
      page: res.data.page,
    };
  } else {
    return {
      ok: false,
      data: [],
      msg: res?.data?.resultMessage || "请求失败",
    };
  }
}

export const $delete = async ({ app, service, key = "id", value = "" }) => {
  if (!value) {
    return {
      ok: false,
      data: {},
      msg: "删除的数据不能为空",
    };
  }
  if (!service) {
    return {
      ok: false,
      data: {},
      msg: "service不能为空",
    };
  }
  if (Array.isArray(value)) {
    value = value.join(",");
  }
  const url = `/${app}/delete/${service}`;
  const req = [
    {
      serviceName: service,
      condition: [{ colName: key, ruleType: "in", value: value }],
    },
  ];
  const res = await $http.post(url, req);

  if (res?.data?.state === "SUCCESS") {
    return {
      ok: true,
      data: res.data?.data,
      msg: "删除成功",
    };
  } else {
    return {
      ok: false,
      data: {},
      msg: res?.data?.resultMessage || "删除失败",
    };
  }
};

// 使用文件编号拼文件路径
export const getImagePath = (no, notThumb) => {
  if (no && typeof no === "string") {
    if (no.indexOf("http://") !== -1 || no.indexOf("https://") !== -1) {
      return no;
    }
    if (no.indexOf("data:image") !== -1 && no.indexOf("base64") !== -1) {
      return no;
    }
    if (no.indexOf("&bx_auth_ticket") !== -1) {
      no = no.split("&bx_auth_ticket")[0];
    }
    let url = `${backendIpAddr}/file/download?fileNo=${no}&bx_auth_ticket=${bx_auth_ticket || sessionStorage.getItem("bx_auth_ticket")
      }`;
    if (location.href?.includes("lowcode-grid/editor/")) {
      // 可视化编辑页面，图片后缀增加时间戳，避免缓存
      url += `&t=${new Date().getTime()}`;
    }
    return url;
  } else {
    return "";
  }
};

/**
 * 通用 select 查询：按 app/serviceName 拼接 URL 发起查询
 * @param {*} req 请求参数（需含 serviceName；app 缺省取 req.srvApp || req.mapp）
 * @param {*} app 应用名
 * @returns {Promise<{ok: boolean, data?: Array, msg?: string}>}
 */
export const $select = async (req, app) => {
  app = app || req.srvApp || req.mapp;
  if (app) {
    const url = `/${app}/select/${req.serviceName}`;
    const res = await $http.post(url, req);
    if (res?.data?.state === "SUCCESS") {
      return {
        msg: res?.data?.resultMessage,
        ok: true,
        data: res.data?.data || [],
      };
    } else {
      return {
        msg: res?.data?.resultMessage,
        ok: false,
      };
    }
  }
};

/**
 * 判断查询接口返回的数据是否有效
 * @param {object} res 接口返回的数据
 * @param {boolean} gtZero 查回来的数据长度是否需要大于0
 * @returns {boolean} true/false
 */
export const isValidResponse = (res, gtZero = false) => {
  if (res?.data?.state === "SUCCESS" && Array.isArray(res.data.data)) {
    if (!gtZero) {
      return true;
    } else if (gtZero && res.data.data.length === 0) {
      return false;
    }
  }
  return true;
};
