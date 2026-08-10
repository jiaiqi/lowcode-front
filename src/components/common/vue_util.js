import Vue from "vue";
import { MessageBox } from "element-ui";
import { backendIpAddr, getEnv } from "@/common/http";
import { pathConfigMap } from "@/common/envList";
import { getFullBaseUrl, normalizeJumpFilePath } from "@/common/common";
import {
  getImagePath,
  getServiceUrl,
  getV2RequestData,
  doLoadColsV2 as doLoadColsV2Fn,
  select as selectFn,
  selectFileList as selectFileListFn,
  doSelect as doSelectFn,
  operate as operateFn,
  addTabByUrl as addTabByUrlFn,
  bxDeepClone,
  getUuid,
  evalBxExpr,
  renderStr,
  evalCondValue,
  recoverFileAddress4richText,
  getVersionNo,
  resolveDefaultSrvApp as resolveApp,
} from "@/common/bx-util";

/**
 * 低代码渲染所需的 Vue.prototype 全局方法。
 * 纯函数逻辑统一收敛在 @/common/bx-util.js（可复用、可 tree-shaking），
 * 本文件仅保留依赖 Vue 实例（this）的包装方法，并委托 bx-util。
 */
function init_util() {
  const prefix = getFullBaseUrl();
  const common_page_path = {
    detail: `${prefix}/detail`,
    list: `${prefix}/list`,
    "simple-add": `${prefix}/simple-add`,
    "simple-update": `${prefix}/simple-update`,
    "start-proc": `${prefix}/startproc`,
    procdetail_v2: `${prefix}/v2/procdetail`,
    procdetail: `${prefix}/v2/procdetail`,
    "start-proc_v2": `${prefix}/v2/startproc`,
    editgrid: `${prefix}/editgrid`,
    treegrid: `${prefix}/treegrid`,
    explain: `${prefix}/explain?`,
    report: `${prefix}/reportList`,
  };

  // ===== 纯函数委托（实现见 @/common/bx-util.js）=====
  Vue.prototype.getImagePath = getImagePath;
  Vue.prototype.getV2RequestData = getV2RequestData;
  Vue.prototype.bxDeepClone = bxDeepClone;
  Vue.prototype.deepClone = bxDeepClone;
  Vue.prototype.getUuid = getUuid;
  Vue.prototype.guid = getUuid;
  Vue.prototype.evalBxExpr = evalBxExpr;
  Vue.prototype.renderStr = renderStr;
  Vue.prototype.evalCondValue = evalCondValue;
  Vue.prototype.recoverFileAddress4richText = recoverFileAddress4richText;
  Vue.prototype.getVersionNo = function () {
    return getVersionNo(this.$route);
  };

  Vue.prototype.resolveDefaultSrvApp = function () {
    return resolveApp(this);
  };

  Vue.prototype.getServiceUrl = function (operate_type, service, app) {
    return getServiceUrl(operate_type, service, app || this.resolveDefaultSrvApp());
  };

  Vue.prototype.doLoadColsV2 = function (service_name, use_type, app, mainSrv, idVal) {
    return doLoadColsV2Fn(this.$http, service_name, use_type, app, mainSrv, idVal);
  };

  Vue.prototype.select = function (
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
    return selectFn(
      this.$http,
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
    );
  };

  Vue.prototype.selectFileList = function (file_no) {
    return selectFileListFn(this.$http, file_no);
  };

  Vue.prototype.doSelect = function (
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
    return doSelectFn(
      this.$http,
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
    );
  };

  Vue.prototype.operate = function (requests) {
    return operateFn(this.$http, requests);
  };

  Vue.prototype.addTabByUrl = function (url, tab_title, urlParams, type) {
    return addTabByUrlFn(url, tab_title, urlParams, type, common_page_path);
  };

  // ===== 依赖实例的方法 =====

  Vue.prototype.openLoading = function (text) {
    const loading = this.$loading({
      lock: true,
      text: text || "加载中",
      spinner: "el-icon-loading",
      background: "rgba(0, 0, 0, 0.7)",
    });
    return loading;
  };

  Vue.prototype.getNodePath = function () {
    let tokens = [];
    let node = this;
    while (node) {
      let isMarker =
        node.isMarker || (this.$attrs && this.$attrs["is-mark"] === "true");
      if (isMarker || (node.getName && typeof node.getName === "function" && node === this)) {
        let name = node.getName();
        tokens.splice(0, 0, name);
      }
      node = node.$parent;
    }
    return tokens.join("/");
  };

  Vue.prototype.serviceApi = function (e) {
    let defaultApp = this.resolveDefaultSrvApp();
    var service_api = {
      backendIpAddr: backendIpAddr,
      selectOne: backendIpAddr + "/" + defaultApp + "/select",
      select: backendIpAddr + "/" + defaultApp + "/select",
      selectByUser: backendIpAddr + "/" + defaultApp + "/select",
      operate: backendIpAddr + "/" + defaultApp + "/operate",
      approval: backendIpAddr + "/" + defaultApp + "/process/approval",
      uploadFile: backendIpAddr + "/file/upload",
      downloadFilePrefix: backendIpAddr + "/file/download",
      downloadFile: `${backendIpAddr}/file/download?${
        sessionStorage.getItem("bx_auth_ticket") ? "bx_auth_ticket=" + sessionStorage.getItem("bx_auth_ticket") : ""
      }&filePath=`,
      deleteFile: backendIpAddr + "/file/delete",
      downloadFileNo: `${backendIpAddr}/file/download?bx_auth_ticket=${sessionStorage.getItem("bx_auth_ticket" || "")}&fileNo=`,
      exportExcel: backendIpAddr + "/" + defaultApp + "/export/exportExcel",
      importExcel: backendIpAddr + "/" + defaultApp + "/bizDataImport",
      qrcode: backendIpAddr + "/" + defaultApp + "/bxsys/qrcode",
    };
    if (e && e.indexOf("http") !== -1) {
      service_api.downloadFileNo = "";
      return service_api;
    }
    return service_api;
  };

  Vue.prototype.jumpAction = async function (jumpJson, itemData = {}) {
    let rowData = itemData;
    if (jumpJson?.tmpl_page_json?.file_path) {
      let path = jumpJson?.tmpl_page_json?.file_path;
      if (path?.indexOf("webview://") === 0) {
        window.open(path.replace("webview://", ""));
        return;
      }
    }
    if (jumpJson?.before_action_tip) {
      const confirm2next = await new Promise((resolve) => {
        MessageBox.confirm(jumpJson?.before_action_tip, "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
          showCancelButton: jumpJson?.dest_page_no ? true : false,
        })
          .then(() => resolve(true))
          .catch(() => resolve(false));
      });
      if (!confirm2next || !jumpJson?.dest_page_no) {
        return;
      }
    }
    if (jumpJson) {
      let isLogin = sessionStorage.getItem("logined");
      if (jumpJson.click_jump_option) {
        let jumpOptions = jumpJson?.click_jump_option;
        if (jumpOptions?.includes("先登录")) {
          let loginUserInfo = sessionStorage.getItem("current_login_user");
          try {
            loginUserInfo = JSON.parse(loginUserInfo);
          } catch (error) {
            console.error(error);
          }
          if (!isLogin || !loginUserInfo?.mobile) {
            MessageBox.confirm("您还未登录,需要登录才能进入,点击确认前往登录", "提示", {
              confirmButtonText: "确定",
              cancelButtonText: "取消",
              type: "warning",
              showCancelButton: true,
            }).then(() => {
              let ssoUrl = "";
              try {
                ssoUrl = (window.APP_CONFIG && window.APP_CONFIG.ssoLoginUrl) || "";
              } catch (e) {}
              if (ssoUrl) {
                window.location.href = `${ssoUrl}?redirect=${encodeURIComponent(
                  window.location.href
                )}`;
              } else {
                window.location.href = window.location.origin + "/main/login.html";
              }
            });
          }
        }
      }
      if (jumpJson?.click_type === "扫码") {
        MessageBox("功能暂未开放", "提示", "error");
        return;
      }

      let pageNo = jumpJson?.dest_page_no;
      let url = `${getFullBaseUrl()}/`;
      let authJson = jumpJson.page_auth_json || null;
      if (pageNo) {
        if (jumpJson?.tmpl_page_json?.file_path) {
          url = normalizeJumpFilePath(
            jumpJson?.tmpl_page_json?.file_path
          ).replace(":pageNo", pageNo);
        } else {
          url = `/site/${pageNo}`;
        }
        const id = rowData?.id || "";
        if (url && !url.includes("?")) {
          url = `${url}?timestamp=${new Date().getTime()}`;
        }
        if (jumpJson?.cols_map_json?.cols_map_detail_json?.length) {
          jumpJson?.cols_map_json?.cols_map_detail_json.forEach((item) => {
            if (item.to_type === "URL") {
              if (item.from_type == "常量") {
                url += `&${item.col_to}=${item.col_from}`;
              } else if (item.from_type === "页面") {
                url += `&${item.col_to}=${this.queryOptions[item.col_from]}`;
              } else if (rowData && rowData[item.col_from]) {
                url += `&${item.col_to}=${rowData[item.col_from]}`;
              }
            }
          });
        } else if (jumpJson.cols_map_json && jumpJson.cols_map_json.to_type == "URL") {
          let maps = jumpJson.cols_map_json.cols_map_json;
          if (maps && rowData) {
            let parmes = "";
            for (let key in maps) {
              if (
                rowData?.hasOwnProperty(maps[key]) &&
                (rowData[maps[key]] || rowData[maps[key]] == 0)
              ) {
                parmes = `${parmes}&${key}=${rowData[maps[key]]}`;
              }
            }
            url = `${url}${parmes}`;
          }
        }
        if (!url.includes("id") && id) {
          url += `&id=${id}`;
        }
      } else {
        console.log("无效的跳转页面");
      }

      if (authJson) {
        let type = authJson.in_cond || "";
        let authRoles = authJson.roles || "";
        let userRoles = sessionStorage.getItem("current_login_user")?.roles;
        let noneTipMsg = authJson.tip_msg || "暂无权限访问";
        if (type.indexOf("有权限时") !== -1 && authRoles) {
          authRoles = authRoles.split(",");
          let onRoles = userRoles?.filter((role) => new Set(authRoles).has(role));
          if (onRoles && onRoles.length > 0) {
            window.location.href = url;
          } else if (onRoles && onRoles.length == 0 || !onRoles) {
            let confirmText = "刷新页面";
            const noneAuthJump = authJson.jump_json || null;
            if (noneAuthJump?.dest_page_no) {
              confirmText = "确认";
            }
            MessageBox.confirm(noneTipMsg, "提示", {
              confirmButtonText: confirmText,
              cancelButtonText: "取消",
              type: "warning",
            }).then(() => {});
          }
        } else {
          window.location.href = url;
        }
      } else {
        if (jumpJson?.obj_type === "微信小程序") {
          if (jumpJson?.wxxcx_json?.path && jumpJson.wxxcx_json?.appid) {
            if (jumpJson?.wxxcx_json?.getCode?.url) {
              let req = jumpJson?.wxxcx_json?.getCode?.req || {};
              let rUrl = jumpJson?.wxxcx_json?.getCode?.url;
              const res = await this.$http.post(rUrl, req);
              if (res?.data?.data) {
                this.renderStr(jumpJson?.wxxcx_json?.path, {
                  data: res.data.data,
                  ...this.queryOptions,
                });
              }
            }
            MessageBox("功能暂未开放", "提示", "error");
          }
          return;
        } else if (jumpJson?.obj_type === "外部页面") {
          if (jumpJson.outer_url) {
            url = jumpJson.outer_url;
            if (rowData) {
              url = renderStr(url, rowData);
            }
            if (rowData) {
              url = url.replace(/:([\w]+)/g, (match, key) => {
                return rowData[key] !== undefined ? rowData[key] : match;
              });
            }
            if (jumpJson.target_type == "新页面") {
              const newPage = window.open(url);
              if (jumpJson?.jump_page_title) {
                newPage.document.title = jumpJson?.jump_page_title;
              }
            } else {
              window.location.href = url;
            }
          } else {
            MessageBox("请配置要打开的页面", "提示", "error");
          }
        } else {
          if (url?.includes("target=_blank") !== -1 && jumpJson.target_type !== "原页面") {
            const newPage = window.open(url);
            if (jumpJson?.jump_page_title) {
              newPage.document.title = jumpJson?.jump_page_title;
            }
          } else if (jumpJson.target_type == "原页面") {
            if (url.includes("#")) {
              url = url.split("#")[1];
            }
            this.$router.push(url);
          } else {
            window.location.href = url;
          }
        }
      }
      console.log(jumpJson);
    } else {
      console.log("jumpJson 配置错误 或 未获取到有效的 jump_json");
    }
  };
}

export default init_util;
