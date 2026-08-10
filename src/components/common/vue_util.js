import Vue from "vue";
import dayjs from "dayjs";
import * as DataUtil from "../../util/DataUtil";
import { Loading } from "element-ui";
import { MessageBox } from "element-ui";
import {
  formatMoney,
  monthEnd,
  monthStart,
  traverseObj,
  weekEnd,
  weekStart,
  parseUrlParams,
} from "../../util/DataUtil";

import isBoolean from "lodash/isBoolean";
import isUndefined from "lodash/isUndefined";
import isString from "lodash/isString";
import isFunction from "lodash/isFunction";
import isEmpty from "lodash/isEmpty";
import { backendIpAddr } from "@/common/http";
import { getFullBaseUrl } from "@/common/common";

function init_util() {
  const eventBus = new Vue();
  const prefix = getFullBaseUrl()
  const common_page_path = {
    detail: `${prefix}/detail`,
    list: `${prefix}/list`,
    "simple-add": `${prefix}/simple-add`,
    "simple-update": `${prefix}/simple-update`,
    "start-proc": `${prefix}/startproc`,
    procdetail_v2: `${prefix}/v2/procdetail`,
    procdetail: `${prefix}/v2/procdetail`,
    // procdetail: `${prefix}/procdetail`,
    "start-proc_v2": `${prefix}/v2/startproc`,
    editgrid: `${prefix}/editgrid`,
    treegrid: `${prefix}/treegrid`,
    explain: `${prefix}/explain?`,
    report: `${prefix}/reportList`,
  };

  Vue.prototype.getImagePath = (no, size) => {
    if (no && typeof no === "string") {
      if ((no.indexOf("http://") !== -1 || no.indexOf("https://") !== -1) && no.indexOf("filePath=") === -1) {
        return no;
      }
      if (no.indexOf("data:image") !== -1 && no.indexOf("base64") !== -1) {
        return no;
      }
      if (no.indexOf("&bx_auth_ticket") !== -1) {
        no = no.split("&bx_auth_ticket")[0];
      }
      let url = `${serviceApi.imageFileNo
        }${no}`;
      if (sessionStorage.getItem("bx_auth_ticket")) {
        url += `&bx_auth_ticket=${sessionStorage.getItem("bx_auth_ticket")}`
      }
      // if (notThumb === false) {
      //   url += `&thumbnailType=fwsu_100`
      // }
      let thumbnailSize = size
      if (thumbnailSize) {
        thumbnailSize = Number(thumbnailSize)
      }
      if (thumbnailSize && typeof thumbnailSize === 'number' && !isNaN(thumbnailSize)) {
        url += `&thumbnailType=fwsu_${thumbnailSize}`
      }
      if (location.href?.includes('/editor/')) {
        // 可视化编辑页面，图片后缀增加时间戳，避免缓存
        url += `&t=${new Date().getTime()}`
      }
      return url;
    } else {
      return "";
    }
  };

  Vue.prototype.download = function (filePath, name) {
    // let url = this.serviceApi().downloadFile + filePath
    window.location.href = filePath;
    // 利用原生fetch直接下载文件
    // return new Promise((resolve, reject) => {
    //   this.$http({
    //     method: 'post',
    //     url: url,
    //     responseType: 'blob'
    //   }).then(
    //     response => {
    //       if(response.data.state && response.data.state == "FAILURE"){
    //         console.log('download',response)
    //         this.$alert(response.data.resultMessage, '提示', {
    //           confirmButtonText: '确定'
    //         });
    //       }else{
    //           resolve(response.data)
    //           let blob = new Blob([response.data],{
    //             type:response.headers.map['content-type'][0] + ';charset=UTF-8'
    //           })
    //           console.log('download',blob,response,response.headers.map['content-type'][0])
    //           let fileName = name
    //           if (window.navigator.msSaveOrOpenBlob) {
    //             // console.log(2)
    //             navigator.msSaveBlob(blob, fileName)
    //           } else {
    //             // console.log(3)
    //             var link = document.createElement('a')
    //             link.href = window.URL.createObjectURL(blob)
    //             link.download = fileName
    //             link.click()
    //             //释放内存
    //             window.URL.revokeObjectURL(link.href)
    //           }
    //       }

    //     },
    //     err => {
    //       reject(err)
    //     }
    //   )
    // })
  };
  Vue.prototype.word2number = function (w, type) {
    //阿拉伯数字转中文数字
    // 节内转换算法
    function SectionToChinese(section) {
      var strIns = "",
        chnStr = "";
      var unitPos = 0;
      var zero = true;
      while (section > 0) {
        var v = section % 10;
        if (v === 0) {
          if (!zero) {
            zero = true;
            chnStr = chnNumChar[v] + chnStr;
          }
        } else {
          zero = false;
          strIns = chnNumChar[v];
          strIns += chnUnitChar[unitPos];
          chnStr = strIns + chnStr;
        }
        unitPos++;
        section = Math.floor(section / 10);
      }
      return chnStr;
    }
    // 转换算法主函数
    function NumberToChinese(num) {
      var unitPos = 0;
      var strIns = "",
        chnStr = "";
      var needZero = false;
      if (num === 0) {
        return chnNumChar[0];
      }
      while (num > 0) {
        var section = num % 10000;
        if (needZero) {
          chnStr = chnNumChar[0] + chnStr;
        }
        strIns = SectionToChinese(section);
        strIns += section !== 0 ? chnUnitSection[unitPos] : chnUnitSection[0];
        chnStr = strIns + chnStr;
        needZero = section < 1000 && section > 0;
        num = Math.floor(num / 10000);
        unitPos++;
      }
      return chnStr;
    }
    //中文数字转阿拉伯数字
    var chnNumChar = {
      零: 0,
      一: 1,
      二: 2,
      三: 3,
      四: 4,
      五: 5,
      六: 6,
      七: 7,
      八: 8,
      九: 9,
    };
    var chnNameValue = {
      十: { value: 10, secUnit: false },
      百: { value: 100, secUnit: false },
      千: { value: 1000, secUnit: false },
      万: { value: 10000, secUnit: true },
      亿: { value: 100000000, secUnit: true },
    };
    function ChineseToNumber(chnStr) {
      var rtn = 0;
      var section = 0;
      var number = 0;
      var secUnit = false;
      var str = chnStr.split("");
      for (var i = 0; i < str.length; i++) {
        var num = chnNumChar[str[i]];
        if (typeof num !== "undefined") {
          number = num;
          if (i === str.length - 1) {
            section += number;
          }
        } else {
          var unit = chnNameValue[str[i]].value;
          secUnit = chnNameValue[str[i]].secUnit;
          if (secUnit) {
            section = (section + number) * unit;
            rtn += section;
            section = 0;
          } else {
            section += number * unit;
          }
          number = 0;
        }
      }
      return rtn + section;
    }
    if (type) {
      return ChineseToNumber(w);
    } else {
      return NumberToChinese(w);
    }
  };
  Vue.prototype.emitEvent = function (eventType, data) {
    let eventKey = eventType + "#" + this.getNodePath();
    eventBus.$emit(eventKey, data);
  };

  Vue.prototype.isJSON = function (str) {
    if (typeof str == "string") {
      JSON.parse(str);
      try {
        return true;
      } catch (e) {
        console.log(e);
        return false;
      }
    }
    //console.log('It is not a string!')
  };
  Vue.prototype.onEvent = function (nodePath, eventType, callback) {
    let eventKey = eventType + "#" + nodePath;
    eventBus.$on(eventKey, callback);
  };
  /**
   *
   * @param {*} randomLength
   */
  Vue.prototype.GenNonDuplicateID = function (s, e) {
    //  let str = Number(Math.floor((Math.random()+Math.floor(Math.random()*9+1))*Math.pow(10,9)) + Date.now()).toString(12)
    let str =
      Math.floor(
        (Math.random() + Math.floor(Math.random() * 9 + 1)) * Math.pow(10, 9)
      ).toString(16) + Date.now().toString(16);
    //  console.log(Math.random().toString().substr(3,randomLength),Date.now(),str)
    if (s) {
      str = s + str;
    }
    if (e) {
      str = str + e;
    }
    return str;
  };
  //GenNonDuplicateID()将生成 rfmipbs8ag0kgkcogc 类似的ID
  /**
   * resolve default srvapp from vue component
   * @returns {*}
   */
  Vue.prototype.resolveDefaultSrvApp = function () {
    let app = null;
    // search $srvApp from node to root
    let node = this;
    while (!node.$srvApp) {
      if (node.$parent) {
        node = node.$parent;
      } else {
        break;
      }
    }

    if (node.$srvApp) {
      app = node.$srvApp;
    } else {
      // whole path does not have $srvApp,
      // try  page level
      if (node?.$route && node?.$route?.query?.srvApp) {
        app = node?.$route?.query?.srvApp;
      } else {
        let defaultApp =
          (window.frameElement && window.frameElement.dataset["app"]) ||
          (top.window.pathConfig && top.window.pathConfig.application);
        app = defaultApp;
      }
    }

    return app;
  };

  /**
   *
   * @param operate_type: operate | select
   * @param service
   * @param app
   * @returns {string}
   */
  Vue.prototype.getServiceUrl = function (operate_type, service, app) {
    app = app || this.resolveDefaultSrvApp();
    return backendIpAddr + "/" + app + "/" + operate_type + "/" + service;
  };

  /**
   *
   * @param operate
   * @param service
   * @param app
   * @returns {string}
   */
  Vue.prototype.downloadexport = function (uuid) {
    const app = this.resolveDefaultSrvApp();
    const url = `${backendIpAddr}/${app}/downloadexport/${uuid}?bx_auth_ticket=${sessionStorage.getItem(
      "bx_auth_ticket"
    )}`;
    // backendIpAddr +
    // "/" +
    // app +
    // "/downloadexport/" +
    // uuid +
    // "?bx_auth_ticket=" +
    // sessionStorage.getItem("bx_auth_ticket");
    window.location.href = url;
    var loading = this.openLoading("文件准备中...");
    const downloadTimer = setInterval(() => {
      Vue.prototype
        .getFileState(uuid, app)
        .then((res) => {
          if (res === "完成") {
            loading.close();
            clearInterval(downloadTimer);
          }
        })
        .catch((err) => {
          console.log(err);
          loading.close();
          clearInterval(downloadTimer);
        });
    }, 1000);
  };

  /**
   * 查询后端生成文件的状态
   * @param {*} uuid 后端返回的文件唯一标识
   * @param {string} app 应用编号
   */
  Vue.prototype.getFileState = async function (uuid, app) {
    const url = `/${app}/export/file/check?uuid=${uuid}`;
    const res = await Vue.prototype.$http(url);
    console.log(res.data);
    if (res.data.state === "SUCCESS") {
      return res.data.resultMessage;
    } else {
      return null;
    }
  };

  //打开遮罩
  Vue.prototype.openLoading = function (text) {
    const loading = this.$loading({
      lock: true,
      text: text || "加载中",
      spinner: "el-icon-loading",
      background: "rgba(0, 0, 0, 0.7)",
    });
    return loading;
  };

  /**
   *
   * @param operate
   * @param service
   * @param app
   * @returns {string}
   */
  Vue.prototype.downloadFailimport = function () {
    var app = this.resolveDefaultSrvApp();
    var url = backendIpAddr + "/" + app + "/downloadImportFail";
    let bx_auth_ticket = sessionStorage.getItem("bx_auth_ticket");
    window.location.href = url + "?bx_auth_ticket=" + bx_auth_ticket;
  };

  Vue.prototype.getRootWindow = function (_window) {
    _window = _window || window;
    if (_window.top !== _window) {
      return this.getRootWindow(_window.top);
    } else {
      return _window;
    }
  };

  /**
   * 查询serviceCols, use an vuex cache here
   * @param service_name
   * @param use_type
   * @returns {*}
   */
  Vue.prototype.loadColsV2 = function (
    service_name,
    use_type,
    app,
    mainSrv,
    forceRefreshV2 = false,
    idVal
  ) {
    if (!service_name) {
      console.error("service_name is null");
      return Promise.resolve({});
    }
    let fullServiceName = this.resolveDefaultSrvApp() + "." + service_name;
    let cacheP =
      this.$store &&
      this.$store.getters.getSrvCols(fullServiceName, use_type, mainSrv);
    if (forceRefreshV2 !== true && cacheP) {
      return cacheP;
    }

    let loadedP = this.doLoadColsV2(service_name, use_type, app, mainSrv, idVal);
    this.$store &&
      this.$store.commit("addSrvCols", {
        service: fullServiceName,
        useType: use_type,
        response: loadedP,
        mainSrv,
      });
    return loadedP;
  };

  Vue.prototype.getV2RequestData = function (service_name, use_type, mainSrv, idVal) {
    let requestData = {
      serviceName: "srvsys_service_columnex_v2_select",
      colNames: ["*"],
      condition: [
        {
          colName: "service_name",
          value: service_name,
          ruleType: "eq",
        },
        {
          colName: "use_type",
          value: use_type,
          ruleType: "eq",
        },
      ],
      order: [
        {
          colName: "seq",
          orderType: "asc",
        },
      ],
    };
    if (mainSrv) {
      // 如果传递了 页面 service 则 发送 新参数  /**2023-05-18**/
      requestData["condition"].push({
        colName: "main_srv",
        value: mainSrv,
        ruleType: "eq",
      });
    }
    // 详情场景：仅当调用方传入 id 值时，追加 { colName: 'id', ... } 2025-09-03
    if (mainSrv && ['detail', 'detaillist', 'treelist'].includes(use_type) && ![null, undefined, ''].includes(idVal)) {
      requestData.condition.push({
        colName: 'id',
        value: idVal,
        ruleType: 'eq'
      });
    }
    let url = decodeURIComponent(window.location.href);
    let params = parseUrlParams(url);
    if (params && params.v2Params) {
      try {
        let v2Params = params.v2Params;
        v2Params = JSON.parse(decodeURIComponent(v2Params));
        if (v2Params && Array.isArray(v2Params.condition)) {
          requestData.condition = requestData.condition.concat(
            v2Params.condition
          );
        }
      } catch (error) {
        console.log(error);
      }
    }
    return requestData;
  };

  Vue.prototype.doLoadColsV2 = function (service_name, use_type, app, mainSrv, idVal) {
    // 使用当前组件实例上下文，仅根据调用方传入的 id 值决定是否追加主键条件
    var data = this.getV2RequestData(service_name, use_type, mainSrv, idVal);

    var url = this.getServiceUrl(
      "select",
      "srvsys_service_columnex_v2_select",
      app
    );
    url = url + "?colsel_v2=" + service_name;
    return this.$http.post(url, data).then((response) => {
      return response;
    });
  };

  Vue.prototype.loadHotTableData = function (metadata) {
    if (!this.$store) {
      return;
    }

    let table = metadata.table;
    let service = metadata.selectService;

    let cached = this.$store.getters.getTableData(table);
    if (cached) {
      return cached;
    }

    // commit a placeholder for now
    this.$store &&
      this.$store.commit("addTableData", {
        table,
        data: [],
      });

    var url = this.getServiceUrl("select", service, metadata.srvApp);
    var params = {
      serviceName: service,
      colNames: ["*"],
    };
    url = url + "?" + service;

    this.$http.post(url, params).then((response) => {
      let data = response.data.data;
      this.$store.commit("addTableData", {
        table,
        data,
      });
    });
  };

  /**查询生成导出excel*/
  Vue.prototype.genExportExcel = function (
    service_name,
    condition,
    page,
    order,
    group,
    mapcondition,
    isproc,
    columns,
    relationCondition
  ) {
    // var url = this.service_api.exportExcel;
    var url = this.getServiceUrl("export", service_name);
    return this.doSelect(
      url,
      service_name,
      condition,
      page,
      order,
      group,
      mapcondition,
      isproc,
      columns,
      relationCondition
    );
  };

  /**业务导出*/
  Vue.prototype.bizExport = function (service_name, condition, data) {
    // var url = this.service_api.exportExcel;
    var url = this.getServiceUrl("export", service_name);
    var params = {
      serviceName: service_name,
      colNames: ["*"],
      condition: condition || [],
      listData: data,
    };
    url = url + "?" + service_name;
    return this.$http.post(url, params);
  };

  /**查询列表*/
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
    var url = this.getServiceUrl("select", service_name, app);
    //2023.10.20增加use_type参数 解决行按钮权限丢失问题
    //2023年11月13日增加rdt参数 目前值只有ttd 代表后端查找符合条件的数据的最顶层节点返回回来
    return this.doSelect(
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
  };
  /***
   * 根据文件data 获取文件类别
   */
  Vue.prototype.getFileType = function (e) {
    let types = {
      img: ["jpg", "JPG", "PNG", "JPEG", "jpeg", "png", "bmp", "tiff"],
      doc: ["xlsx", "xls", "xlsm", "docx", "doc", "wps", "ppt", 'pptx'],
      pdf: ["pdf"],
      ppt: ['ppt', 'pptx'],
      media: ["mp3", "mp4", "avi", "mov", "mkv", "wav"],
    };
    let type = "more";
    for (let key in types) {
      if (e.hasOwnProperty("file_type")) {
        for (let item of types[key]) {
          if (e.file_type === item) {
            type = key;
          }
        }
      }
    }
    return type;
  };
  Vue.prototype.selectFileList = function (file_no) {
    let serviceName = "srvfile_attachment_select";
    var url = this.getServiceUrl("select", serviceName, "file");
    let condition = [
      {
        colName: "file_no",
        value: file_no,
        ruleType: "eq",
      },
      {
        colName: "is_delete",
        value: "1",
        ruleType: "eq",
      },
    ];
    const order = [{
      colName: "seq",
      orderType: "asc"
    }]
    return this.doSelect(url, serviceName, condition, null, order);
  };

  /**查询列表*/
  Vue.prototype.selectList = function (query, app) {
    let service_name = query.serviceName;
    let url = this.getServiceUrl("select", service_name, app);
    let proc_page_instance = findParentHasPageInstance(this)
    if (proc_page_instance) {
      console.log('proc_page_instance:', proc_page_instance, query);
      query.proc_page_instance = proc_page_instance
    }
    return this.$http.post(url, query);
  };

  function findParentHasPageInstance(vm) {
    if (vm.procPageInstance) return vm.procPageInstance
    if (vm.$parent) {
      return findParentHasPageInstance(vm.$parent)
    }
    return
  }

  /**查询*/
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
    var query = {
      serviceName: service_name,
      colNames: columns || ["*"],
      condition: condition || [],
      relation_condition: relationCondition || {},
      page: page,
      order: order,
      draft: draft,
      vpage_no: vpageNo,
      use_type: use_type, //2023.10.20增加use_type参数 解决行按钮权限丢失问题
    };
    let proc_page_instance = findParentHasPageInstance(this)
    if (proc_page_instance) {
      console.log('proc_page_instance:', proc_page_instance, query);
      query.proc_page_instance = proc_page_instance
    }
    if (divCondition) {
      query["divCond"] = divCondition;
    } else if (
      query.condition.length &&
      query.condition.find((item) => item.use_div_calc === "是")
    ) {
      let divCond = query.condition.filter(
        (item) => item.use_div_calc === "是"
      );
      if (divCond?.length) {
        query.divCond = divCond.map((item) => {
          return {
            colName: item.colName,
            ruleType: item.ruleType,
            value: item.value,
          };
        });
        query.condition = query.condition.map((item) => {
          return {
            colName: item.colName,
            ruleType: item.ruleType,
            value: item.value,
          };
        });
      }
    }
    if (query["divCond"]?.length) {
      if (query["condition"]?.length) {
        query.condition = query["condition"].map((item) => {
          if (
            item.ruleType === "like" &&
            this.resolveDefaultSrvApp() !== "log"
          ) {
            item.ruleType = "eq";
          }
          return item;
        });
      }
      query["divCond"] = query["divCond"].map((item) => {
        if (!Array.isArray(item.value)) {
          item.value = [item.value];
        }
        return item;
      });
    }
    if (use_type === "treelist") {
      // 2023年11月13日增加，top tree data特性，后端返回符合条件的数据的最顶层节点数据，不使用parentCol为null作为条件
      //  query["rdt"] = "ttd";
      if (rdt) {
        query["rdt"] = rdt;
        if (query.page?.rownumber) {
          query.page.rownumber = 9999;
        }
      }
    }
    if (pageType && pageType === "list_page") {
      query["query_source"] = "list_page";
    }
    if (isproc) {
      query["proc_data_type"] = isproc;
    }
    if (group) {
      query.group = group;
    }

    if (
      mapcondition != undefined &&
      mapcondition != "" &&
      mapcondition != null
    ) {
      query["map_table_condtion"] = mapcondition;
    }

    url = url + "?" + service_name;
    let defaultApp = this.resolveDefaultSrvApp();
    if (
      srvAuth &&
      sessionStorage.getItem(`bx_srv_auth_ticket-${defaultApp}-${service_name}`)
    ) {
      let bx_srv_auth_ticket = sessionStorage.getItem(
        `bx_srv_auth_ticket-${defaultApp}-${service_name}`
      );

      return this.$http.post(url, query, {
        headers: {
          bx_auth_ticket: sessionStorage.getItem("bx_auth_ticket"),
          "bx-auth-ticket": sessionStorage.getItem("bx_auth_ticket"),
          bx_srv_auth_ticket: bx_srv_auth_ticket,
        },
      });
      // url = `${url}&bx_srv_auth_ticket=${bx_srv_auth_ticket}`
    } else {
      return this.$http.post(url, query);
    }
  };

  /**查询*/
  Vue.prototype.selectByUser = function (
    service_name,
    condition,
    page,
    order,
    group,
    mapcondition,
    pageType
  ) {
    var url = this.getServiceUrl("select", service_name);
    var params = {
      serviceName: service_name,
      colNames: ["*"],
      condition: condition,
      group: group,
      page: page,
      order: order,
    };
    let proc_page_instance = findParentHasPageInstance(this)
    if (proc_page_instance) {
      console.log('proc_page_instance:', proc_page_instance, params);
      params.proc_page_instance = proc_page_instance
    }
    if (pageType && pageType === "list_page") {
      params["query_source"] = "list_page";
    }
    if (
      mapcondition != undefined &&
      mapcondition != "" &&
      mapcondition != null
    ) {
      params["map_table_condtion"] = mapcondition;
    }
    url = url + "?" + service_name;
    return this.$http.post(url, params);
  };

  /**查询*/
  Vue.prototype.selectproc = function (
    service_name,
    condition,
    page,
    order,
    proc_type,
    pageType,
    vpage_no
  ) {
    //var url = this.service_api.select;

    var url = this.getServiceUrl("select", service_name);
    var params = {
      serviceName: service_name,
      proc_data_type: proc_type,
      colNames: ["*"],
      condition: condition,
      page: page,
      order: order,
      vpage_no: vpage_no,
      use_type: "proclist", //2023.10.20增加use_type参数 解决行按钮权限丢失问题
    };
    if (pageType && pageType === "list_page") {
      params["query_source"] = "list_page";
    }
    let proc_page_instance = findParentHasPageInstance(this)
    if (proc_page_instance) {
      console.log('proc_page_instance:', proc_page_instance, params);
      params.proc_page_instance = proc_page_instance
    }
    url = url + "?" + service_name;
    return this.$http.post(url, params);
  };

  /**查询*/
  Vue.prototype.treeSelect = function (service_name, condition, app) {
    var url = this.getServiceUrl("select", service_name, app);
    var params = {
      serviceName: service_name,
      treeData: true,
      colNames: ["*"],
      condition: condition,
      use_type: "treelist", //2023.10.20增加use_type参数 解决行按钮权限丢失问题
    };
    let proc_page_instance = findParentHasPageInstance(this)
    if (proc_page_instance) {
      console.log('proc_page_instance:', proc_page_instance, params);
      params.proc_page_instance = proc_page_instance
    }
    url = url + "?" + service_name;
    return this.$http.post(url, params);
  };

  Vue.prototype.selectOne = function (
    service_name,
    condition,
    draft = false,
    isHisVer,
    srvAuth,
    pageType,
    divCond
  ) {
    // divCond 分表查询参数 2021年1月12日新增
    var url = this.getServiceUrl("select", service_name);
    var params = {
      serviceName: service_name,
      colNames: ["*"],
      condition: condition,
      draft: draft === "true" ? true : false,
      hisVer: isHisVer || false,
    };
    if (divCond) {
      try {
        divCond = JSON.parse(decodeURIComponent(divCond));
      } catch (error) { }
      if (Array.isArray(divCond) && divCond.length) {
        if (divCond.length) {
          params["divCond"] = divCond;
        }
      }
    }
    if (pageType) {
      params["query_source"] = pageType;
      console.log("on page TYPe", pageType);
    }

    url = url + "?" + service_name;
    let defaultApp = this.resolveDefaultSrvApp();
    let bx_srv_auth_ticket = sessionStorage.getItem(
      `bx_srv_auth_ticket-${defaultApp}-${service_name}`
    );
    if (srvAuth) {
      return this.$http
        .post(url, params, {
          headers: {
            bx_auth_ticket: sessionStorage.getItem("bx_auth_ticket"),
            "bx-auth-ticket": sessionStorage.getItem("bx_auth_ticket"),
            bx_srv_auth_ticket: bx_srv_auth_ticket,
          },
        })
        .then((response) => {
          if (response.body.data && response.body.data.length > 0) {
            response.response = Vue.prototype.bxDeepClone(response.body);
            response.body = response.body.data[0];
          }
          return response;
        });
      // url = `${url}&bx_srv_auth_ticket=${bx_srv_auth_ticket}`
    } else {
      return this.$http
        .post(url, params, {
          headers: {
            bx_auth_ticket: sessionStorage.getItem("bx_auth_ticket"),
            "bx-auth-ticket": sessionStorage.getItem("bx_auth_ticket"),
            bx_srv_auth_ticket: bx_srv_auth_ticket,
          },
        })
        .then((response) => {
          if (response.body.data && response.body.data.length > 0) {
            response.response = Vue.prototype.bxDeepClone(response.body);
            response.body = response.body.data[0];
          }
          return response;
        });
    }
  };

  /**操作*/
  Vue.prototype.operate = function (requests) {
    let service = requests.length > 0 ? requests[0].serviceName : "";
    let srvApp = requests[0].srvApp;
    var url = this.getServiceUrl("operate", service, srvApp);
    return this.$http.post(url, requests);
  }; /**删除文件*/

  Vue.prototype.deleteFile = function (params) {
    var url = this.serviceApi().deleteFile;
    return this.$http.post(url, params);
  };
  /**
   * 返回常用的页面路径
   * @param type：页面类型
   * @returns {*}
   */
  Vue.prototype.getCommonPagePath = function (type) {
    return common_page_path[type];
  };

  /**操作*/
  Vue.prototype.addTab = function (
    type,
    urlParams,
    tab_title,
    srv,
    button,
    app
  ) {
    if (tab_title == undefined || tab_title == null || tab_title == "") {
      tab_title = "新标页签";
    }
    let srvName = srv || null;
    let url = common_page_path[type] + urlParams;
    var versionNo = this.getVersionNo();
    if (versionNo != "" && ("procdetail" == type || "start-proc" == type)) {
      type = type + "_" + versionNo;
      url = common_page_path[type] + urlParams;
      if (app) {
        if (url.indexOf("?") !== -1) {
          url = `${url}&srvApp=${app}&time=${new Date().getTime()}`;
        } else {
          url = `${url}?srvApp=${app}&time=${new Date().getTime()}`;
        }
      }
    }

    if (type === "explain") {
      // 自定义 字段说明页面的参数
      url = common_page_path[type] + "?data=" + urlParams;
    } else if (type === "report") {
      url = common_page_path[type] + "?operate_params=" + urlParams;
    } else if (type === "list") {
      let params = JSON.parse(urlParams);
      url =
        common_page_path[type] + "/" + srvName + "?operate_params=" + urlParams;
    }

    let more_config = "";
    if (button && button.more_config) {
      more_config = button.more_config;
    }
    if (window.top.tab) {
      let page = {
        title: tab_title,
        url: url,
        icon: "",
      };

      if (more_config && more_config.indexOf("openInCurrentTab") !== -1) {
        // window.location.href = url
        // window.top.tab.replaceTab(page);
        window.top.tab.addTab(page);
      } else {
        window.top.tab.addTab(page);
      }
    } else {
      window.open(url);
    }
  };
  Vue.prototype.closeCurrentTab = function () {
    const currTab = window?.top?.tab?.getCurrentTab()
    if (window.top?.tab && window.top.tab.closeCurrentTab) {
      window.top.tab.closeCurrentTab(currTab)
    } else {
      window.close()
    }
  }

  /**
   *  //字符串截取
   * @param {*} str
   * @param {*} n
   */
  Vue.prototype.getStrIntercept = function (str, n) {
    let strs = str;
    if (n) {
      if (str.length > n) {
        strs = str.substring(0, n) + "...";
        return strs;
      } else {
        return strs;
      }
    } else {
      return strs;
    }
  };
  /**
   *
   * @param {*} fileNo
   */
  Vue.prototype.getDownloadFile = function (file) {
    let self = this;
    if (
      !file.hasOwnProperty("_dl_auth") ||
      (file.hasOwnProperty("_dl_auth") && file["_dl_auth"])
    ) {
      let url = self.serviceApi().downloadFile + file.fileurl;
      if (file.fileurl?.indexOf('http') === 0) {
        url = file.fileurl
        if (top.location.protocol?.includes('https') && url?.includes('https') === false) {
          url = url.replace("http://", 'https://')
        }
        if (top.location.protocol?.includes('https') && url?.indexOf('http') === 0 && url?.indexOf('https') !== 0) {
          // url = url.replace("http://",'https://')
          url = `${window.backendIpAddr}/file/forward?targetUrl=${encodeURIComponent(url)}`
        }
        // url = file.fileurl.replace("http://",'https://')
      }
      window.open(url);
      // window.location.href = url;
    } else {
      self.$alert("您无权限下载，请确认后重试！", "提示", {
        confirmButtonText: "确定",
      });
    }
  };

  Vue.prototype.addTabByUrl = function (url, tab_title, urlParams, type) {
    url = url || common_page_path[type] + "?data=" + urlParams;
    let page = {
      title: tab_title || "新标页签",
      url,
    };

    if (window.top.tab && window.top.tab.addTab) {
      window.top.tab.addTab(page);
    } else {
      let strWindowFeatures =
        "menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes";
      let newWindow = window.open(url, "CNN_WindowName", strWindowFeatures);
      newWindow.document.title = tab_title;
    }
  }; /**操作*/
  Vue.prototype.forwardAddTab = function (address, tab_title, button) {
    if (tab_title == undefined || tab_title == null || tab_title == "") {
      tab_title = "新标页签";
    }

    let page = {
      title: tab_title,
      url: address,
      icon: button?.tabIcon || "",
      app: button?.application,
    };
    if (window.top.tab) {
      if (
        button &&
        button.more_config &&
        button.more_config.indexOf("openInCurrentTab") !== -1
      ) {
        // window.location.href = address
        window.top.tab.replaceTab(page);
        return;
      }
      window.top.tab.addTab(page);
    } else {
      // 没有tab实例，在浏览器中打开新标签页
      const page = window.open(address);
      setTimeout(() => {
        page.document.title = tab_title;
      }, 500);
    }
  }; /**操作*/
  Vue.prototype.custAddTab = function (type, urlParams, tab_title, button) {
    if (tab_title == undefined || tab_title == null || tab_title == "") {
      tab_title = "新标页签";
    }

    let page = {
      title: tab_title,
      url: common_page_path[type] + urlParams,
      icon: "",
    };

    let more_config = "";
    if (button && button.more_config) {
      more_config = button.more_config;
    }
    if (more_config && more_config.indexOf("openInCurrentTab") !== -1) {
      // window.location.href = page.url
      // window.top.tab.replaceTab(page)
      window.top.tab.addTab(page);

      return;
    }
    if(!window.top.tab && page.url) return window.open(page.url);
    window.top.tab.addTab(page);
  };
  Vue.prototype.approval = function (requests) {
    var url = this.serviceApi().approval;
    return this.$http.post(url, requests);
  };
  //直接启动流程
  Vue.prototype.startProc = async function (requests) {
    let service = requests.length > 0 ? requests[0].serviceName : "";
    var url = this.getServiceUrl("apply", service);
    url = url + "?" + service;
    let loadingInstance = Loading.service({
      body: true,
      lock: true, //锁定
      background: "rgba(0, 0, 0, 0.7)",
      spinner: "el-icon-loading", //加载图标'
      text: "提交中...",
    });
    setTimeout(() => {
      loadingInstance.close(); // 20s后自动关闭遮罩
    }, 20 * 1000);
    const res = await this.$http.post(url, requests);
    this.$nextTick(() => {
      // 以服务的方式调用的 Loading 需要异步关闭
      loadingInstance.close(); //请求提交成功后自动关闭遮罩
    });
    return res;
  };

  //保存草稿
  Vue.prototype.saveDraft = function (requests) {
    let service = requests.length > 0 ? requests[0].serviceName : "";
    var url = this.getServiceUrl("apply", service);
    url = url + "?" + service;
    for (var item of requests) {
      item.proc_save_type = "save";
    }
    return this.$http.post(url, requests);
  };

  //开启已有数据流程
  Vue.prototype.startDataProc = function (requests) {
    let service = requests.length > 0 ? requests[0].serviceName : "";
    var url = this.getServiceUrl("apply", service);
    url = url + "?" + service;
    for (var item of requests) {
      item.proc_data_type = "old";
    }
    return this.$http.post(url, requests);
  }; // 唯一性校验

  Vue.prototype.isUniqueCheck = async function (UniqueCheckConfig, model) {
    let url = this.getServiceUrl(
      "select",
      UniqueCheckConfig.serviceName,
      UniqueCheckConfig.srvApp
    );
    let cols = UniqueCheckConfig.columns;
    cols = cols.split(",");
    let reqs = {
      serviceName: UniqueCheckConfig.serviceName,
      colNames: cols,
      condition: [],
    };
    for (let i = 0; i < cols.length; i++) {
      let cond = {
        colName: cols[i],
        ruleType: "eq",
        value: model[cols[i]],
      };
      if (
        model[cols[i]] !== null &&
        model[cols[i]] !== "" &&
        model[cols[i]] !== undefined
      ) {
        reqs.condition.push(this.bxDeepClone(cond));
      }
    }
    console.log("isUniqueCheck");
    return this.$http.post(url, reqs);

    //  let cols = this.$http.post(url, requests);
  };
  Vue.prototype.bxDeepClone = function (obj) {
    if (obj == null) return null;
    let newObj = obj instanceof Array ? [] : {};
    for (var i in obj) {
      newObj[i] =
        typeof obj[i] === "object" ? this.bxDeepClone(obj[i]) : obj[i];
    }
    return newObj;
  };
  Vue.prototype.deepClone = Vue.prototype.bxDeepClone;

  Vue.prototype.parseDateTime = function (dateStr) {
    return dayjs(dateStr).toDate();
  };

  Vue.prototype.formatDateTime = function (date) {
    return dayjs(date).format("YYYY-MM-DD  HH:mm:ss");
  };

  Vue.prototype.parseDate = function (dateStr) {
    return dayjs(dateStr).toDate();
  };

  Vue.prototype.formatDate = function (date) {
    return dayjs(date).format("YYYY-MM-DD");
  };

  Vue.prototype.addDate = function (date, amount, flag) {
    return dayjs(date).add(amount, flag).toDate();
  };

  Vue.prototype.templateToString = function (row, temp) {
    let datas = row || {};
    let template = temp || "";
    let str = "return " + "`" + template + "`"; // 根据配置的模版字符串解析内容
    let func = new Function("row", str);
    let srv = func(datas);
    // console.log("templateToString",datas,temp,srv)
    return func(datas);
  };
  Vue.prototype.popupDialog = async function (params, callback) {
    var btninfo = params["btninfo"];

    if (params.formType.startsWith("simple-")) {
      params.formType = params.formType.substring("simple-".length);
    }

    if (!this.dialog) {
      let ComponentClass = Vue.extend(Dialog);
      let dialog = new ComponentClass({
        propsData: { type: "primary" },
        store: this.$store,
      });
      this.dialog = dialog;

      dialog.$mount();
      this.$el.appendChild(dialog.$el);
    }

    // conf and show dialog
    let dialog = this.dialog;
    dialog.service = params.service;
    dialog._service = params._service;
    // dialog.gridData = this.gridData;
    dialog.defaultCondition = params.defaultCondition;
    dialog.childForeignkey = params.childForeignkey;
    dialog.listMainFormDatas = params.listMainFormDatas;
    dialog.buttonInfo = btninfo;
    if (btninfo && btninfo.application) {
      dialog.srvApp = btninfo.application;
      dialog.$srvApp =
        btninfo.application !== "this" ? btninfo.application : null;
    }

    dialog.defaultConditions = params.condition;
    dialog.defaultValues = params.defaultValues || params.data || [];
    dialog.mapcondition = params.mapcondition;
    dialog.checkUnique = params.checkUnique;
    if (params.otherParams != undefined && params.otherParams != null) {
      var load_old_data = params.otherParams.load_old_data;
      if (load_old_data == false) {
        dialog.initLoad = load_old_data;
      }

      dialog.buttonInfo = params.otherParams.buttonInfo;
    }
    if (params.hasOwnProperty("batchInitConfig")) {
      dialog["batchInitConfig"] = params.batchInitConfig;
    }
    dialog.activeForm = params.formType;
    if (btninfo?.moreConfig?.customComponentName) {
      if (btninfo.application) {
        dialog.defaultApplication = btninfo.application;
      }
      dialog.activeForm = btninfo?.moreConfig?.customComponentName;
      if (params.listRowData) {
        dialog.rowData = params.listRowData;
      }
    }
    dialog.$on('popup-action-complete', (e) => {
      console.log('popup-action-complete:', e);
    })
    // 调用弹窗的地方传进来的回调函数，如果有传，则弹窗操作完成后调用此函数触发回调，通知组件操作完成
    dialog.callback = callback;
  };

  Vue.prototype.popuplistFormDialog = async function (
    formType,
    service,
    selectService,
    condition,
    updateData
  ) {
    if (!this.dialog) {
      let ComponentClass = Vue.extend(Dialog);
      let dialog = new ComponentClass({
        propsData: { type: "primary" },
        store: this.$store,
      });
      this.dialog = dialog;

      dialog.$mount();
      this.$el.appendChild(dialog.$el);
    }

    // conf and show dialog
    let dialog = this.dialog;
    dialog.service = service;
    dialog.selectService = selectService;
    dialog.defaultConditions = condition;
    dialog.defaultValues = updateData;

    dialog.activeForm = formType;
  };

  const getUuid = function () {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
  };
  Vue.prototype.getUuid = getUuid;
  Vue.prototype.guid = getUuid;

  Vue.prototype.formartMoney = function (s) {
    return formatMoney(s);
  };

  Vue.prototype.isEmptyCondition = function (condition) {
    let value = condition.value;
    if (condition.ruleType == "isnull" || condition.ruleType == "notnull") {
      return false;
    } else if (condition.ruleType == "between") {
      return isEmpty(value) || (value[0] == null && value[1] == null);
    } else {
      if (typeof value == "object") {
        return isEmpty(value);
      } else {
        return value == null || value == undefined || value === "";
      }
    }
  };

  Vue.prototype.money2zh = function (money) {
    return DataUtil.money2Zh(money);
  };

  Vue.prototype.isTopComp = function () {
    return this.$parent.$parent === this.$root;
  };

  Vue.prototype.isListTopComp = function () {
    if (this.$route && this.$route.meta.compName) {
      return (
        this.$parent.$parent.$parent === this.$root ||
        this.$options.name === this.$route.meta.compName
      );
    } else {
      return this.$parent.$parent.$parent === this.$root;
    }
  };

  Vue.prototype.getCurrPage = function () {
    let isInDialog = false;
    let node = this;

    while (node.$parent) {
      isInDialog =
        node.$parent.$vnode &&
        node.$parent.$vnode.tag &&
        node.$parent.$vnode.tag.endsWith("ElDialog");
      if (isInDialog) {
        break;
      } else {
        node = node.$parent;
      }
    }

    return isInDialog ? node : this.$root.$children[0].$children[0];
  };

  Vue.prototype.getOperateParams = function () {
    if (this.$route && this.$route.query && this.$route.query.operate_params) {
      return this.$route.query.operate_params;
    }
    return false;
  };

  Vue.prototype.getVueUrlParams = function (paraName) {
    if (this.$route && this.$route.query && this.$route.query[paraName]) {
      return this.$route.query[paraName];
    }
    return false;
  };

  Vue.prototype.getinitparams = function () {
    if (this.$route && this.$route.query && this.$route.query.init_params) {
      return this.$route.query.init_params;
    }
    return "";
  };

  Vue.prototype.eval = function (expr) {
    return eval(expr);
  };

  Vue.prototype.santinizeQueries = function (queries) {
    traverseObj(
      queries,
      (obj, key) => {
        if (key === "_rtDataCtx") {
          delete obj._rtDataCtx;
        } else if (key === "data") {
          if (!obj.data || isEmpty(obj.data)) {
            delete obj.data;
          }
        }
      },
      (obj, key) => {
        return (
          key === "data" || key === "child_data_list" || Array.isArray(obj)
        );
      }
    );
  };

  Vue.prototype.weekStart = function () {
    return weekStart();
  };

  Vue.prototype.weekEnd = function () {
    return weekEnd();
  };

  Vue.prototype.monthStart = function () {
    return monthStart();
  };

  Vue.prototype.monthEnd = function () {
    return monthEnd();
  };

  Vue.prototype.toTemplateString = function (templ) {
    return "`" + templ + "`";
  };

  Vue.prototype.parseJson = function (str) {
    return Function('"use strict";return (' + str + ")")();
  };

  // noinspection JSUnusedLocalSymbols
  /**
   *
   * @param expr
   * @param data
   * @param vm
   * @returns {*}
   */
  Vue.prototype.evalBxExpr = function (expr, data, vm, defaultValue) {
    try {
      let user = top.user;
      if (expr && typeof expr === 'string' && expr.trim() === 'new Date()') {
        let value = eval(expr)
        if (value && value.getTime && typeof value.getTime === 'function') {
          return dayjs(value).format('YYYY-MM-DD HH:mm:ss')
        }
      }
      return eval(expr);
    } catch (e) {
      return defaultValue || null;
    }
  };

  Vue.prototype.evalActionValidator = function (funcStr, data) {
    let vm = this;
    let expr = "var zz=(" + funcStr + ")(vm, data); zz";
    let test = this.evalBxExpr(expr, data, vm);
    if (test !== true) {
      this.$message.error(test + "");
      return false;
    } else {
      return true;
    }
  };

  Vue.prototype.getNodePath = function () {
    let node = this;
    while (!node.$srvApp) {
      if (node.$parent) {
        node = node.$parent;
      } else {
        break;
      }
    }
  };

  /**
   * (id | key| name | attrs[name])
   */
  Vue.prototype.getName = function () {
    let type = this.$options.name || this.$options._componentTag;
    let shortName =
      this.name ||
      (this.$attrs && this.$attrs.name) ||
      (this.$vnode && this.$vnode.key);
    return type + "#" + shortName;
  };

  Vue.prototype.getNodePath = function () {
    let tokens = [];

    // precondition: path already
    let node = this;
    while (node) {
      let isMarker =
        node.isMarker || (this.$attrs && this.$attrs["is-mark"] === "true");
      if (
        isMarker ||
        (node.getName && isFunction(node.getName) && node === this)
      ) {
        let name = node.getName();
        tokens.splice(0, 0, name);
      }

      node = node.$parent;
    }

    return tokens.join("/");
  };
  Vue.prototype.msgTips = function () {
    console.log("Vue.prototype.msgTips");
    window.top.limitingTips();
  };
  Vue.prototype.findNodeByPath = function (path) {
    // find leaf node type
    let tokens = path.split("/");
    let leafNodeType = tokens[tokens.length - 1].split("#")[0];

    // filter by their path
    return this.$root.findAnyNodeByTypeAndPredict(
      leafNodeType,
      (node) => node.getNodePath() === path
    );
  };
  /**
   * 新版可配置子表表单位置的 子表数据封装
   * @param {*} type
   * @param {*} predict
   */
  Vue.prototype.buildChildListConfig = function (e, mainData) {
    let self = this;
    let list = {
      form: {
        append: [],
        prepend: [],
      },
      field: {},
    };
    if (e && e.length > 0) {
      e.forEach(async (child, index) => {
        child["showPagination"] =
          window.sessionStorage.getItem("childPagination") || true;
        // Vue.set(child,'showPagination',true)
        let config = child?.foreign_key?.more_config;
        if (
          config &&
          (config.indexOf("field") !== -1 || config.indexOf("form") !== -1)
        ) {
          config = JSON.parse(config);
          child["_childMoreConfig"] = config;
          if (config.hasOwnProperty("showPagination")) {
            child["showPagination"] = config.showPagination;
          }
          try {
            if (config.type) {
              if (
                config.type === "field" &&
                config.colName &&
                config.position
              ) {
                // 依附在字段的 子表
                if (list.field.hasOwnProperty(config.colName)) {
                  list.field[config.colName][config.position].push(child);
                } else {
                  let childObj = {
                    append: [],
                    prepend: [],
                  };
                  childObj[config.position].push(child);
                  list.field[config.colName] = childObj;
                }
              } else if (config.type === "form") {
                // 依附在表单的 子表
                if (config.position && config.position === "prepend") {
                  list.form.prepend.push(child);
                } else {
                  list.form.append.push(child);
                }
              } else {
                // 没有moreconfig 配置默认
                list.form.append.push(child);
              }
            }
          } catch (error) { }
        } else {
          if (config) {
            config = JSON.parse(config);
            child["_childMoreConfig"] = config;
            if (config.hasOwnProperty("showPagination")) {
              child["showPagination"] = config.showPagination;
            }
          } else {
            child["_childMoreConfig"] = config;
          }

          list.form.append.push(child);
        }
      });
    }
    self.childrenListLoaded = true;
    // let childs = {childs:list,feildKeys:list.feild.keys()}
    return list;
  };
  /**
   * build 子表配置的
   * @param {*} type
   * @param {*} predict
   */
  Vue.prototype.buildCollapsed = function (childs, cols) {
    // 处理子表 Collapsed 组件的默认展开效果
    let childCollapsed = {
      form_append: [],
      form_prepend: [],
    };
    function collapseds(e, type) {
      let eds = [];
      for (let key = 0; key < e.length; key++) {
        let moreConfig = e[key]["_childMoreConfig"];
        if (moreConfig && moreConfig.collapse && moreConfig.collapse === true) {
          let num = type + key;
          eds.push(num);
        }
      }
      if (eds.length === 0) {
        let num = type + 0;
        eds.push(num);
      }
      return eds;
    }
    let keys = Object.keys(childs);
    for (let i = 0; i < keys.length; i++) {
      if (keys[i] === "form") {
        childCollapsed["form_append"] = collapseds(
          childs[keys[i]]["append"],
          "form_append_"
        );
        childCollapsed["form_prepend"] = collapseds(
          childs[keys[i]]["prepend"],
          "form_prepend_"
        );
      } else if (keys[i] === "field") {
        let fieldChild = childs["field"];

        for (let c = 0; c < cols.length; c++) {
          let appends = fieldChild[cols[c]]["append"];
          let prepends = fieldChild[cols[c]]["prepend"];
          if (appends.length > 0) {
            childCollapsed[cols[c] + "_append"] = collapseds(
              appends,
              cols[c] + "_append_"
            );
          } else if (prepends.length > 0) {
            childCollapsed[cols[c] + "_prepend"] = collapseds(
              prepends,
              cols[c] + "_prepend_"
            );
          }
        }
      }
    }
    return childCollapsed;
  };
  /**
   * find descendant nodes with type and predict
   * @param type
   * @param predict
   * @returns {*}
   */
  Vue.prototype.findAnyNodeByTypeAndPredict = function (type, predict) {
    let nodeType = this.$options.name || this.$options._componentTag;
    if (nodeType && nodeType === type && (!predict || predict(this))) {
      return this;
    } else {
      for (let child of this.$children) {
        let match = child.findAnyNodeByTypeAndPredict(type, predict);
        if (match) {
          return match;
        }
      }
      return null;
    }
  };

  Vue.prototype.evalExprOrFunc = function (value, data, defaultValue, mainData = {}) {
    try {
      if (isString(value)) {
        let vm = this;
        return eval(value);
      } else if (isFunction(value)) {
        return value(data, mainData);
      } else {
      }
    } catch (e) {
      if (isUndefined(defaultValue)) {
        throw e;
      } else {
        return defaultValue;
      }
    }
  };

  Vue.prototype.evalVersatileFlagVar = function (flagVar, data) {
    if (isBoolean(flagVar)) {
      return flagVar;
    } else if (isFunction(flagVar)) {
      return flagVar(data);
    } else {
      return !!flagVar;
    }
  };

  Vue.prototype.getVersionNo = function () {
    var version = "";
    var path = this.$route.path;
    var paths = this.$route.path.split("/");
    if (paths.length > 1) {
      var reg = /^v\d*$/;
      var value = paths[1];
      if (reg.test(value)) {
        version = value;
      }
    }
    return version;
  };

  Vue.prototype.removeByValue = function (datas, value) {
    var _index = -1;
    for (var i = 0; i < datas.length; i++) {
      if (datas[i] == value) {
        _index = i;
        break;
      }
    }

    if (_index > -1) {
      datas.splice(_index, 1);
    }
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
      downloadFile: `${backendIpAddr}/file/download?${sessionStorage.getItem("bx_auth_ticket") ? 'bx_auth_ticket=' + sessionStorage.getItem("bx_auth_ticket") : ''}&filePath=`,
      deleteFile: backendIpAddr + "/file/delete",
      downloadFileNo: `${backendIpAddr}/file/download?bx_auth_ticket=${sessionStorage.getItem("bx_auth_ticket" || '')}&fileNo=`,
      exportExcel: backendIpAddr + "/" + defaultApp + "/export/exportExcel",
      importExcel: backendIpAddr + "/" + defaultApp + "/bizDataImport",

      qrcode: backendIpAddr + "/" + defaultApp + "/bxsys/qrcode",

      // startProc: backendIpAddr + defaultApp + "/bxsys/startProc",
      // saveDraft: backendIpAddr + defaultApp + "/bxsys/saveDraft",
      // startDataProc: backendIpAddr + defaultApp + "/bxsys/startDataProc",
    };
    if (e && e.indexOf("http") !== -1) {
      service_api.downloadFileNo = "";
      return service_api;
    }
    return service_api;
  };

  //设置二级密码
  Vue.prototype.srvAuthSet = function (srv, pwd, app) {
    let req = [
      {
        serviceName: "srvsso_service_pwd_set",
        data: [
          {
            app_no: app || this.resolveDefaultSrvApp(),
            service: srv,
            service_type: "select",
            pwd: pwd,
          },
        ],
      },
    ];
    let url = this.getServiceUrl("operate", "srvsso_service_pwd_set", "sso");
    this.$http.post(url, req).then((res) => {
      if (res.data.state == "FAILURE") {
        this.$message({
          message: res.data.resultMessage,
          type: "error",
        });
        return false;
      } else {
        this.$message({
          message: "二级密码设置成功，请注意保密",
          type: "success",
        });
        return res.data;
      }
    });
  };
  //登录

  Vue.prototype.makeTree = function (passArray, keyObj) {
    let { parentKey, labelKey, valueKey } = keyObj;

    let recuisionChain = (chain, compareNode, result) => {
      // let nKey = 'no';
      // let nLabel = "classify_name";

      if (chain.parentKey == compareNode.no) {
        if (!compareNode.children) {
          compareNode.children = [];
        }
        compareNode.children.push(chain);
        let preNode = chain.preNode;
        let nextNode = chain.nextNode;
        chain.isFind = true;
        chain.nextNode = nextNode;

        recuisionChain(chain, chain, result);
      } else {
        let nowNode = chain;
        while (nowNode.nextNode) {
          nowNode = nowNode.nextNode;
          if (nowNode.parentKey == compareNode.no) {
            if (!compareNode.children) {
              compareNode.children = [];
            }
            compareNode.children.push(nowNode);
            let preNode = nowNode.preNode;
            let nextNode = nowNode.nextNode;
            nowNode.isFind = true;
            preNode.nextNode = nextNode;
            if (nextNode) {
              nextNode.preNode = preNode;
            }

            recuisionChain(chain, nowNode);
          }
        }
      }
    };

    let makeChain = (array, parentNode) => {
      let startNode = null;
      let nowNode = null;
      for (let i = 0; i < array.length; i++) {
        let item = array[i];
        item.label = item[`${labelKey}`];
        item.value = item[`${valueKey}`];
        // item.children = [];
        if (!item.parentKey) {
          parentNode.push(item);
        } else {
          if (!startNode) {
            startNode = item;
          }

          if (!nowNode) {
            nowNode = item;
            nowNode.preNode = null;
          }

          item.preNode = nowNode;
          nowNode.nextNode = item;

          nowNode = item;
        }
      }

      return startNode;
    };

    let array = [...passArray];

    let parentNode = [];
    let chain = makeChain(array, parentNode);
    // let result = [];
    /*
     * 递归把商品费雷给成children
     */
    if (chain) {
      parentNode.forEach((item, index) => {
        recuisionChain(chain, item);
      });
    }

    let treeData = parentNode;

    return treeData;
  };

  Vue.prototype.makeTree2 = function (passArray, keyObj) {
    let { parentKey, labelKey, valueKey } = keyObj;

    let recuisionChain = (chain, compareNode, result) => {
      // let nKey = 'no';
      // let nLabel = "classify_name";
      let parentNum = chain[parentKey];
      parentNum = parentNum.replaceAll("/", "");
      if (parentNum == compareNode[valueKey]) {
        if (!compareNode.children) {
          compareNode.children = [];
        }
        compareNode.children.push(chain);
        let preNode = chain.preNode;
        let nextNode = chain.nextNode;
        chain.isFind = true;
        chain.nextNode = nextNode;
        recuisionChain(chain, chain, result);
      } else {
        let nowNode = chain;
        while (nowNode.nextNode) {
          nowNode = nowNode.nextNode;
          let parentNum = compareNode[valueKey];

          parentNum = parentNum.replaceAll("/", "");

          if (nowNode[parentKey] == parentNum) {
            if (!compareNode.children) {
              compareNode.children = [];
            }

            compareNode.children.push(nowNode);
            let preNode = nowNode.preNode;
            let nextNode = nowNode.nextNode;
            nowNode.isFind = true;
            preNode.nextNode = nextNode;
            if (nextNode) {
              nextNode.preNode = preNode;
            }

            recuisionChain(chain, nowNode);
          }
        }
      }
    };

    let makeChain = (array, parentNode) => {
      let startNode = null;
      let nowNode = null;
      for (let i = 0; i < array.length; i++) {
        let item = array[i];
        item.label = item[`${labelKey}`];
        item.value = item[`${valueKey}`];
        // item.children = [];
        if (!item[parentKey]) {
          parentNode.push(item);
        } else {
          if (!startNode) {
            startNode = item;
          }

          if (!nowNode) {
            nowNode = item;
            nowNode.preNode = null;
          }

          item.preNode = nowNode;
          nowNode.nextNode = item;

          nowNode = item;
        }
      }

      return startNode;
    };

    let array = [...passArray];

    let parentNode = [];
    let chain = makeChain(array, parentNode);
    // let result = [];
    /*
     * 递归把商品费雷给成children
     */
    if (chain) {
      parentNode.forEach((item, index) => {
        recuisionChain(chain, item);
      });
    }

    let treeData = parentNode;

    return treeData;
  };

  Vue.prototype.getV2Columns = function (filterColumn, srv_cols, callback) {
    let arrayToChain = (passArray) => {
      class SingleChian {
        constructor(data) {
          this.data = data;
        }
        isStart = null;
        nextNode = null;
        preNode = null;

        pop() {
          let preNode = this.preNode;
          let nextNode = this.nextNode;
          if (preNode) {
            preNode.nextNode = nextNode;
          }

          if (nextNode) {
            nextNode.preNode = preNode;
          }
          this.nextNode = null;
          this.preNode = null;
        }
      }
      let startNode = null;
      let workingNow = null;
      passArray.forEach((item, index) => {
        let itemChain = new SingleChian(item);
        itemChain.souceSort = index;
        if (!startNode) {
          startNode = itemChain;
        } else {
          itemChain.preNode = workingNow;
          workingNow.nextNode = itemChain;
        }

        workingNow = itemChain;
      });

      return startNode;
    };

    let startChain = arrayToChain(filterColumn);
    //  console.log(startChain,"chain--链表是是你们？？")

    let columnArray = srv_cols;
    let resultArray = [];

    for (let i = 0; i < columnArray.length; i++) {
      let item = columnArray[i];

      let boolean = true;
      let blChain = startChain;

      while (boolean) {
        if (!blChain) {
          boolean = false;
          break;
        }
        // blChain.data.key == item.columns
        if (callback(blChain.data, item)) {
          item.souceSort = blChain.blChain;
          resultArray.push(item);

          if (!blChain.preNode) {
            startChain = blChain.nextNode;
          }
          blChain.pop();

          boolean = false;
        } else {
          blChain = blChain.nextNode;
        }
        //   blChain
      }
    }

    return resultArray;
  };

  Vue.prototype.filterTableInfo = function (obj) {
    obj.appName = obj.gridButton[0].application;
    // 0/mer/select/srvsys_service_columnex_v2_select?colsel_v2=srvbu_store_type_select
    let tableName = `srv${obj.main_table.substring(2)}`;
    let selectServiceName = `${tableName}_select`;
    selectServiceName = obj.service_name;
    let mainTableInfo = {
      select: {
        url: `/${obj.appName}/select/${selectServiceName}?${selectServiceName}`,
        serviceName: selectServiceName,
        tableName: tableName,
      },
    };

    obj.mainTableInfo = mainTableInfo;

    return obj;
  };

  Vue.prototype.arrayTochian = (passArray, callback, parentObj) => {
    class SingleChian {
      constructor(data) {
        this.data = data;
      }
      isStart = null;
      nextNode = null;
      preNode = null;

      pop() {
        let preNode = this.preNode;
        let nextNode = this.nextNode;
        if (preNode) {
          preNode.nextNode = nextNode;
        } else {
          //说明是链表的第一个node
          if (parentObj) {
            parentObj.instance[`${parentObj.key}`] = nextNode;
          }
        }

        if (nextNode) {
          nextNode.preNode = preNode;
        }
        this.nextNode = null;
        this.preNode = null;
      }
    }
    let startNode = null;
    let workingNow = null;
    passArray.forEach((item, index) => {
      let itemChain;
      if (callback) {
        let callbackData = callback(item);
        if (callbackData) {
          itemChain = new SingleChian(callbackData);
        }
      } else {
        itemChain = new SingleChian(item);
      }

      itemChain.souceSort = index;
      if (!startNode) {
        startNode = itemChain;
      } else {
        itemChain.preNode = workingNow;
        workingNow.nextNode = itemChain;
      }

      workingNow = itemChain;
    });

    return startNode;
  };

  Vue.prototype.getTemplateInfo = function (str) {
    class Variable {
      constructor(variableStr, parent) {
        /**
         *
         * 仅仅支持.或者str后续支持多种方式 包括函数，表达式等等
         *
         * colum
         *
         * colum.kk.ll
         *
         *
         *
         */
        let regColumn = /\$\<(?<variableName>[\s\S]*?)\>/;
        let { variableName } = variableStr.match(regColumn).groups;

        let isObject = false;
        if (variableName.indexOf(".") != -1) {
          isObject = true;
        }
        this.variableName = variableName;
        this.isObject = isObject;
        this.parent = parent;
        this.hasReplaced = false;
      }

      replaceStr(value) {
        if (!this.hasReplaced) {
          throw new Error("已经替换过了");
        }
        this.parent.str = this.parent.str.replaceAll(
          `$<${this.variableName}>`,
          value
        );
        this.hasReplaced = true;
      }
    }

    class TemplateStr {
      constructor(str) {
        this.init(str);
      }

      init(str) {
        let reg = /\$\<[\s\S]*?\>/g;
        let array = str.match(reg);

        this.str = str;
        this.sourceStr = str;
        this.variables = null;
        this.hasTemplate = false;
        if (array) {
          this.hasTemplate = true;

          this.variables = Vue.prototype.arrayTochian(
            array,
            (item) => {
              return new Variable(item);
            },
            {
              instance: this,
              key: "variables",
            }
          );
        } else {
          this.hasTemplate = false;
        }
      }

      setColumns(array) {
        this.variables.forEach((item, index) => {
          if (array[`${item.column}`]) {
            let value = array[`${item.column}`];

            item.replaceStr(value);
          }
        });

        return this.str;
      }
    }

    return new TemplateStr(str);
  };

  Vue.prototype.srvAuthlogin = function (srv, pwd, app) {
    let req = [
      {
        serviceName: "srvuser_service_login",
        data: [
          {
            app_no: app || this.resolveDefaultSrvApp(),
            service: srv,
            pwd: pwd,
          },
        ],
      },
    ];
    let url = this.getServiceUrl("operate", "srvuser_service_login", "sso");
    return this.$http.post(url, req);
  };

  Vue.prototype.parseDate2 = function parseDate(date, time, type) {
    function getTime(nowDate2) {
      let year = nowDate2.getFullYear();
      let month = nowDate2.getMonth() + 1;
      let date = nowDate2.getDate();
      let hours = nowDate2.getHours();
      let minutes = nowDate2.getMinutes();

      let seconds = nowDate2.getSeconds();

      if (month < 10) {
        month = `0${month}`;
      } else {
        month = month.toString();
      }

      if (date < 10) {
        date = `0${date}`;
      } else {
        date = date.toString();
      }

      if (hours < 10) {
        hours = `0${hours}`;
      } else {
        hours = hours.toString();
      }

      if (minutes < 10) {
        minutes = `0${minutes}`;
      } else {
        minutes = minutes.toString();
      }

      if (seconds < 10) {
        seconds = `0${seconds}`;
      } else {
        seconds = seconds.toString();
      }

      return {
        instance: nowDate2,
        year: year,
        month: month,
        hours: hours,
        minutes: minutes,
        seconds: seconds,
        date: date,
        dateDate: `${year}-${month}-${date}`,
        datetime: `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`,
        dateMonth: `${year}-${month}`,
      };
    }

    if (!time) {
      return getTime(date);
    } else if (time.date) {
      if (typeof time.date == "string") {
        time.date = parseInt(time.date);
      }
      date.setDate(date.getDate() + time.date);
      return getTime(date);
    } else if (time.month) {
      if (typeof time.date == "string") {
        time.date = parseInt(time.date);
      }
      date.setMonth(date.getMonth() + time.month);
      return getTime(date);
    } else if (time.year) {
      if (typeof time.date == "string") {
        time.date = parseInt(time.date);
      }
      date.setFullYear(date.getFullYear() + time.year);
      return getTime(date);
    } else if (time.hours) {
      if (typeof time.date == "string") {
        time.date = parseInt(time.date);
      }
      date.setHours(date.getHours() + time.hours);

      return getTime(date);
    } else if (time.minutes) {
      if (typeof time.date == "string") {
        time.date = parseInt(time.date);
      }
      date.setMinutes(date.getMinutes() + time.minutes);

      return getTime(date);
    }
  };

  Vue.prototype.renderStr = (str, obj = {}) => {
    // if(str && str?.includes('.')&&str.split('.').length>1 && !/\$\{(.*?)\}/g.test(str)){
    // }

    // 辅助函数：尝试解析 JSON 字符串
    const tryParseJson = (value) => {
      if (value && typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          // 只有当解析结果是对象或数组时才返回解析结果
          if (typeof parsed === 'object' && parsed !== null) {
            return parsed;
          }
        } catch (e) {
          // 解析失败，返回原值
        }
      }
      return value;
    };

    // 如果 obj 本身是 JSON 字符串，先解析它
    obj = tryParseJson(obj);

    if (typeof obj === "object" && str && typeof str === "string") {
      str = str.replace(/\$\{(.*?)\}/g, (match, key) => {
        key = key.trim();
        let result = obj[key];
        let arr = key.split(".");
        if (arr?.length) {
          result = obj;
          arr.forEach((item) => {
            try {
              result =
                result[item] || result[item] === false || result[item] === 0
                  ? result[item]
                  : "";
              if (result === 0) {
                result = "0";
              }
              // 在每一步访问后，尝试解析 JSON 字符串
              result = tryParseJson(result);
            } catch (e) {
              //TODO handle the exception
            }
          });
        } else {
          // 对于单层属性访问，也尝试解析 JSON 字符串
          result = tryParseJson(result);
        }
        return result;
      });
    }
    return str;
  };
  /**
   * 将queryString格式的divCond转为数组格式
   * @param {*} url
   */
  Vue.prototype.urlDivCondToArray = (url) => {
    if (
      url &&
      url?.includes("divCol") &&
      url.includes("divStartVal") &&
      url.includes("divEndVal")
    ) {
      const queryString2Obj = (url) => {
        let search = url.split("?")[1];
        if (url.indexOf("?") == -1) {
          search = url;
        }
        if (!search) {
          return {};
        }
        return JSON.parse(
          '{"' +
          decodeURIComponent(search)
            .replace(/"/g, '\\"')
            .replace(/&/g, '","')
            .replace(/=/g, '":"') +
          '"}'
        );
      };
      const obj = queryString2Obj(url);
      return [
        {
          colName: obj.divCol,
          ruleType: "between",
          value: [obj.divStartVal, obj.divEndVal],
        },
      ];
    }
    return url;
  };
  /**
   * 构建自定义按钮配置的divCond 输出为queryString格式
   * @param {*} btn 自定义按钮
   * @param {*} row 行数据或者详情数据
   * @param {*} mainData 详情页面 点击子表时按钮传入的主表数据
   * @returns { string } 返回divCol,divStartVal,divEndVal组成的queryString
   */
  Vue.prototype.buildCustomBtnDivCondUrl = (btn, row, mainData) => {
    const result = Vue.prototype.buildCustomBtnDivCond(btn, row, mainData);
    if (
      Array.isArray(result) &&
      result.length &&
      result[0]?.value?.length > 1
    ) {
      return `divCol=${result[0].colName}&divStartVal=${result[0].value[0]}&divEndVal=${result[0].value[1]}`;
    }
  };
  Vue.prototype.evalCondValue = (value, row = {}, mainData = {}) => {
    if (!value || typeof value === "string") {
      if (value?.includes('${')) {
        value = Vue.prototype.renderStr(value, row);
      } else if (value?.includes('data.')) {
        try {
          let key = value.split("data.")[1];
          if (key) {
            value = row?.[key] || '';
          }
        } catch (error) { }
      } else if (value?.includes('mainData.')) {
        try {
          let key = value.split("mainData.")[1];
          if (key) {
            value = mainData?.[key] || '';
          }
        } catch (error) { }
      }
      return value;
    } else if (value?.value_type === "rowData") {
      return row[value.value_key];
    } else if (value?.value_type === "mainData" && value.value_key) {
      return mainData[value.value_key];
    } else if (value?.value_type === "constant" && value.value) {
      return value.value;
    }
  };
  /**
   * 构建自定义按钮配置的divCond
   * @param {*} btn 自定义按钮
   * @param {*} row 行数据或者详情数据
   * @param {*} mainData 详情页面 点击子表时按钮传入的主表数据
   * @returns { Array } 返回一个长度为1的数组
   */
  Vue.prototype.buildCustomBtnDivCond = (btn, row = {}, mainData = {}) => {
    let result = null;
    if (Array.isArray(row) && row.length) {
      row = JSON.parse(JSON.stringify(row[0]));
    }
    const evalCondValue = Vue.prototype.evalCondValue;
    if (btn?.more_config) {
      try {
        const moreConfig = JSON.parse(btn.more_config);
        if (moreConfig?.divCond?.colName) {
          moreConfig.divCond = [moreConfig.divCond];
        }
        if (Array.isArray(moreConfig?.divCond) && moreConfig.divCond?.length) {
          result = moreConfig.divCond.map((item) => {
            const obj = {
              colName: item.colName,
              ruleType: "between",
              value: [],
            };
            let val1, val2;
            if (item.start_value) {
              val1 = evalCondValue(item.start_value, row, mainData);
            }
            if (item.end_value) {
              val2 = evalCondValue(item.end_value, row, mainData);
            }
            if (val1 && val2) {
              obj.value = [val1, val2];
            } else if (val1 || val2) {
              obj.value = [val1 || val2];
            }
            return obj;
          });
        }
      } catch (error) { }
    }
    return result;
  };

  Vue.prototype.checkUploadStatus = async (file_no, times = 0, timeout = 1000) => {
    const url = `/file/getUpPro?uploadId=${file_no}`
    try {
      const res = await Vue.prototype.$http.get(url);
      console.log(res.data.data, ':checkUploadStatus');
      if (res.data.data < 100 && times < 10) {
        await new Promise(resolve => {
          setTimeout(() => {
            Vue.prototype.checkUploadStatus(file_no, times + 1).then((res) => {
              resolve(res)
            })
          }, timeout);
        })
      }
    } catch (error) {
      console.error(error, ':checkUploadStatus');
    }
  }

  /**
   * 判断值是rgb还是hex 如果是hex 将其转换成rgb再返回 如果是rgb直接返回
   * @returns {string} 
   */
  Vue.prototype.getColor = (color) => {
    if (color.startsWith('#')) {
      const rgb = Vue.prototype.hexToRgb(color);
      return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    } else {
      return color;
    }
  }

  Vue.prototype.rgbToHex = (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  /**
   * 将hex颜色代码转换为rgb颜色代码
   * @param {string} hex - hex颜色代码，如 "#FF0000" 或 "#F00"
   * @returns {object} - 包含rgb颜色的对象，如 { r: 255, g: 0, b: 0 }
   */
  Vue.prototype.hexToRgb = (hex) => {
    // 扩展简写的hex颜色代码（如 #333 -> #333333）
    if (hex.length === 4) {
      hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
  Vue.prototype.publicLogin = () => {
    if (process.env.NODE_ENV === "development") {
      return this.$loginRef?.open((res) => {
        console.log(res);
      });
    }
    const currentUrl = window.location.pathname + window.location.hash;
    sessionStorage.setItem("login_redirect_url", currentUrl);
    const loginUrl = window.location.origin + "/main/login.html";
    window.location.href = loginUrl;
  }
  Vue.prototype.publicLogout = () => {
    MessageBox.confirm("确认退出登录吗?", "提示", {
      confirmButtonText: "确认",
      cancelButtonText: "取消",
      type: "warning",
    }).then(() => {
      Vue.prototype.$store.dispatch("loginInfo/logout");
    });
  }
  // jump 拦截处理权限
  Vue.prototype.jumpAction = async function (jumpJson, itemData = {}) {
    let rowData = itemData
    if (jumpJson?.tmpl_page_json?.file_path) {
      let path = jumpJson?.tmpl_page_json?.file_path
      if (path?.indexOf('webview://') === 0) {
        // if(window?.open){
        window.open(path.replace('webview://', ''))
        // }else{
        // const url = `${this.$api.serverURL?.replace('/bxapi', '')}${path.replace('webview://', '')}`
        // uni.navigateTo({
        //   url: `/views/public/webview/webview?src=${encodeURIComponent(url)}`,
        //   // query:{
        //   //   src:encodeURIComponent(url)
        //   // }
        // })
        // }
        return
      }
    }
    if (jumpJson?.before_action_tip) {
      // 跳转前提示
      const confirm2next = await new Promise((resolve) => {
        MessageBox.confirm(jumpJson?.before_action_tip, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
          showCancelButton: jumpJson?.dest_page_no ? true : false, //如果有跳转页面，则显示取消按钮，点击取消后不跳转
        }).then(() => {
          resolve(true)
        }).catch(() => {
          resolve(false)
        })
      })
      if (!confirm2next || !jumpJson?.dest_page_no) {
        return
      }
    }
    if (jumpJson) {
      let jumpOptions = ""
      let isLogin = sessionStorage.getItem('logined')
      if (jumpJson.click_jump_option) {
        // grid  item 点击 老代码迁移
        jumpOptions = jumpJson?.click_jump_option

        if (jumpOptions?.includes('先登录')) {
          let loginUserInfo = uni.getStorageSync('current_login_user')
          try {
            loginUserInfo = JSON.parse(loginUserInfo)
          } catch (error) {
            console.error(error);
          }
          if (!isLogin || !loginUserInfo?.mobile) {
            MessageBox.confirm('您还未登录,需要登录才能进入,点击确认前往登录', '提示', {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning',
              showCancelButton: true,
            }).then(() => {
              Vue.prototype.publicLogin()
            })
            // return
          }
        }

      }
      if (jumpJson?.click_type === '扫码') {
        MessageBox('功能暂未开放', '提示', 'error')
        return
      }

      let pageNo = jumpJson?.dest_page_no
      let url = `${getFullBaseUrl()}/`
      let authJson = jumpJson.page_auth_json || null
      if (pageNo) {
        if (jumpJson?.tmpl_page_json?.file_path) {
          url = `${jumpJson?.tmpl_page_json?.file_path}?page_no=${pageNo}`
          url = jumpJson?.tmpl_page_json.file_path.replace(":pageNo", pageNo);
        } else if (pageNo) {
          url = `/site/${pageNo}`
        }
        const id = rowData?.id || ''
        // url = `${jumpJson?.tmpl_page_json?.file_path}?page_no=${pageNo}`
        if (url && !url.includes('?')) {
          url = `${url}?timestamp=${new Date().getTime()}`
        }
        if (jumpJson?.cols_map_json?.cols_map_detail_json?.length) {
          jumpJson?.cols_map_json?.cols_map_detail_json.forEach(item => {
            if (item.to_type === 'URL') {
              if (item.from_type == '常量') {
                url += `&${item.col_to}=${item.col_from}`
              } else if (item.from_type === '页面') {
                url += `&${item.col_to}=${this.queryOptions[item.col_from]}`
              } else if (rowData && rowData[item.col_from]) {
                url += `&${item.col_to}=${rowData[item.col_from]}`
              }
            }
          })
        } else if (jumpJson.cols_map_json && jumpJson.cols_map_json.to_type == 'URL') {
          let maps = jumpJson.cols_map_json.cols_map_json
          if (maps && rowData) {
            let parmes = ''
            for (let key in maps) {
              if (rowData?.hasOwnProperty(maps[key]) && (rowData[maps[key]] || rowData[maps[key]] == 0)) {
                parmes = `${parmes}&${key}=${rowData[maps[key]]}`
              }
            }
            // let maps = jump.cols_map_json.cols_map_json
            url = `${url}${parmes}`
          }
        }

        if (!url.includes('id') && id) {
          url += `&id=${id}`
        }

      } else {

        console.log('无效的跳转页面')
      }


      let isJumpAuth = false
      if (authJson) {
        let type = authJson.in_cond || ''
        let authRoles = authJson.roles || ''
        let userRoles = sessionStorage.getItem('current_login_user')?.roles
        // if (store?.state?.user?.loginUserInfo?.roles) {
        //   userRoles = store?.state?.user?.loginUserInfo?.roles
        // }
        let noneTipMsg = authJson.tip_msg || '暂无权限访问'
        if (type.indexOf('有权限时') !== -1 && authRoles) {
          authRoles = authRoles.split(',')

          let onRoles = userRoles?.filter(role => new Set(authRoles).has(role));

          if (onRoles && onRoles.length > 0) {
            uni.navigateTo({
              url: `${url}`
            })
          } else if (onRoles && onRoles.length == 0 || !onRoles) {
            let confirmText = '刷新页面'
            // 有配置跳转的话点击确认进行跳转
            const noneAuthJump = authJson.jump_json || null
            if (noneAuthJump?.dest_page_no) {
              confirmText = '确认'
            }
            MessageBox.confirm(noneTipMsg, '提示', {
              confirmButtonText: confirmText,
              cancelButtonText: '取消',
              type: 'warning',
            }).then(() => {

            })

          }
          console.log('authRoles', authRoles, userRoles, onRoles)
        } else {
          uni.navigateTo({
            url: `${url}`
          })
        }
      } else {
        if (jumpJson?.obj_type === '微信小程序') {
          if (jumpJson?.wxxcx_json?.path && jumpJson.wxxcx_json?.appid) {
            let path = jumpJson?.wxxcx_json?.path
            if (jumpJson?.wxxcx_json?.getCode?.url) {
              let req = jumpJson?.wxxcx_json?.getCode?.req || {}
              let rUrl = jumpJson?.wxxcx_json?.getCode?.url
              const res = await this.$http.post(rUrl, req)
              if (res?.data?.data) {
                const data = res.data.data
                path = this.renderStr(path, {
                  data,
                  ...this.queryOptions,
                })
              }
            }
            MessageBox('功能暂未开放', '提示', 'error')
          }
          return
        } else if (jumpJson?.obj_type === '外部页面') {
          if (jumpJson.outer_url) {
            url = jumpJson.outer_url
            if (rowData) {
              url = Vue.prototype.renderStr(url, rowData)
            }
            // 替换所有以:开头的变量
            if (rowData) {
              url = url.replace(/:([\w]+)/g, (match, key) => {
                return rowData[key] !== undefined ? rowData[key] : match
              })
            }
            if (top.window.addTab && url?.includes('target=_blank') < 0) {
              Vue.prototype.addTabByUrl(url, jumpJson?.jump_page_title || '')
            } else if (jumpJson.target_type == "新页面") {
              const newPage = open(url)
              if (jumpJson?.jump_page_title) {
                newPage.title = jumpJson?.jump_page_title
              }
            } else {
              if (top.window.addTab && !url?.includes('target=_blank') ) {
                Vue.prototype.addTabByUrl(url, jumpJson?.jump_page_title || '')
              } else {
                location.href = url
              }
            }
          } else {
            MessageBox('请配置要打开的页面', '提示', 'error')
          }
        } else {
          if (top.window.addTab && url?.includes('target=_blank') < 0) {
            Vue.prototype.addTabByUrl(url, jumpJson?.jump_page_title || '')
          } else if (url?.includes('target=_blank') !== -1 && jumpJson.target_type !== "原页面") {
            const newPage = open(url)
            if (jumpJson?.jump_page_title) {
              newPage.title = jumpJson?.jump_page_title
            }
          } else if (jumpJson.target_type == "原页面") {
            if (url.includes('#')) {
              url = url.split('#')[1]
            }
            this.$router.push(url)
          }
        }
      }
      console.log(jumpJson)
    } else {
      console.log('jumpJson 配置错误 或 未获取到有效的 jump_json')
    }
  }

  /**
   * 将富文本字符串中的文件地址相对路径前缀替换为当前所用的服务端地址前缀
   * @param {*} val 富文本字符串
   * @returns 
   */
  Vue.prototype.recoverFileAddress4richText = (val = "") => {
    // 替换文件前缀
    const prefix = backendIpAddr + "/file/download";
    val = val?.replaceAll?.("$bxFileAddress$", prefix) || "";
    // 使用正则表达式来匹配 bx_auth_ticket 的值，并使用sessionStorage.bx_auth_ticket替换它
    const ticketStr = `bx_auth_ticket=${sessionStorage.bx_auth_ticket}`;
    val = val.replace(/(bx_auth_ticket=)[^&]+/ig, ticketStr);
    return val;
  }

  /**
   * 日期格式化方法
   * @param {*} value - 日期值（支持时间戳、日期字符串、Dayjs 对象等）
   * @param {string} format - 格式化模板，默认 'YYYY-MM-DD HH:mm:ss'
   * @returns {string} - 格式化后的日期字符串
   * 
   * 特殊处理逻辑：
   * - 如果传入的日期值本身只包含年月日（如 "2024-01-15"），不包含时间部分
   *   即使格式模板包含时分秒（HH:mm:ss），输出时也会自动省略时分秒部分
   * - 避免 "2024-01-15" 被格式化为 "2024-01-15 00:00:00" 的情况
   */
  Vue.prototype.formatDate = (value, format = 'YYYY-MM-DD HH:mm:ss') => {
    if (!value) return '';
    
    // 标准化日期值，确保为字符串并去除首尾空格
    const normalizedValue = String(value).trim();
    
    // 检测原始数据是否包含时间部分（匹配 "HH:mm" 或 "HH:mm:ss" 格式）
    // 例如："14:30"、"09:05:30" 等
    const hasTimePart = /\d{1,2}:\d{2}/.test(normalizedValue) 
                     || /\d{1,2}:\d{2}:\d{2}/.test(normalizedValue);
    
    // 如果原始数据没有时间部分，但格式模板包含时分秒，则从模板中移除时分秒
    // /[Hh]:?m{1,2}(:s{1,2})?/ 匹配 "HH:mm:ss"、"H:mm:ss"、"hh:mm" 等格式
    if (!hasTimePart && /[Hh]:?m{1,2}(:s{1,2})?/.test(format)) {
      // 移除格式模板中的时分秒部分，同时移除前面可能的空格或分隔符
      // /\s*[Hh]{1,2}:m{1,2}(:s{1,2})?/ 匹配 " HH:mm:ss"、" H:mm" 等
      format = format.replace(/\s*[Hh]{1,2}:m{1,2}(:s{1,2})?/, '');
    }
    
    const dayjsObj = dayjs(value);
    if (!dayjsObj.isValid()) {
      return value;
    }
    
    return dayjsObj.format(format);
  }
}

export default init_util;
