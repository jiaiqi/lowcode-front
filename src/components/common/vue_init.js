import Vue from "vue";
let service_api = null
function init() {
  let backendIpAddr = null;
  if (!window.top.pathConfig?.gateway && sessionStorage.getItem("pathConfig")) {
    try {
      const pathConfig = JSON.parse(sessionStorage.getItem("pathConfig"));
      if (pathConfig?.gateway) {
        window.top.pathConfig = pathConfig;
      }
    } catch (err) {
      console.error("pathConfig", pathConfig, err);
    }
  }

  if (window.top.pathConfig && window.top.pathConfig.gateway) {
    // 如果外层有就用外层的路径配置
    let parentServerPath = window.top.pathConfig.gateway;
    if (parentServerPath.endsWith("/")) {
      backendIpAddr = parentServerPath.substring(
        0,
        parentServerPath.length - 1
      );
    } else {
      backendIpAddr = parentServerPath;
    }
  } else {
    // 单vue页面使用配置的后台地址
    let server_cfg = {
      // back_server_protocol: "https",
      // back_server_ip: "srvms.100xsys.cn", // oa
      // back_server_port: "",
      // back_server_protocol: "https",
      // back_server_ip: "wx.100xsys.cn", // oa
      // back_server_port: "",

      back_server_protocol: "https",
      back_server_ip: "api.100xsys.cn", // saas外网
      back_server_port: "",

      // back_server_protocol: "http",
      // back_server_ip: "vrms.vanxum.com", // 万像
      // back_server_port: "8101",

      // back_server_protocol: "http",
      // back_server_ip: "192.168.0.157", // 研学
      // back_server_port: "8104",

      // back_server_protocol: "http",
      // back_server_ip: "192.168.0.111", // oa
      // back_server_port: "180",

      //audit ai稽核项目
      // back_server_protocol: "http",
      // back_server_ip: "192.168.0.151", //
      // back_server_port: "180",
      // 稽核生产环境
      // back_server_protocol: "http",
      // back_server_ip: "30.61.1.21", //
      // back_server_port: "180",

      //saas内网
      // back_server_protocol: "https",
      // back_server_ip: "api.100xsys.cn", //
      // back_server_port: "6100",

      // // 后端本地环境
      // back_server_protocol: "http",
      // back_server_ip: "192.168.0.155", //
      // back_server_port: "8888",

      // back_server_protocol: "https",
      // back_server_ip: "api.laodongcloud.com",    // 西乡
      // back_server_port: "",

      // back_server_protocol: "http",
      // back_server_ip: "192.168.0.157",    // 西乡
      // back_server_port: "8104",

      // back_server_protocol: "https",
      // back_server_ip: "xxld.100xsys.cn",    // 西乡
      // back_server_port: "",

      // back_server_protocol: "http",
      // back_server_ip: "139.196.209.46",    //
      // back_server_port: "4678",

      // back_server_protocol: "http",
      // back_server_ip: "192.168.0.140",    // 高速
      // back_server_port: "180",

      // back_server_ip: "srvms.100xsys.cn",    // 240 139.129.128.155:5021   零售   http://192.168.0.155:8106
      // back_server_port: "8106",
      // 内网
      // back_server_protocol: "http",
      // back_server_ip: "192.168.0.241",
      // back_server_port: "8080",
      // 外网
      // back_server_protocol: "http",
      // back_server_ip: "192.168.0.157",    // 240 139.129.128.155:5021   零售   http://192.168.0.155:8106
      // back_server_port: "8104",

      // back_server_ip: "139.196.209.46",    // 240 139.129.128.155:5021
      // back_server_port: "4678",
      // back_server_protocol: "http",
      // back_server_ip: "192.168.0.155",    // 240 139.129.128.155:5021
      // back_server_port: "8888",
      // back_server_ip: "192.168.0.111",    // 240 139.129.128.155:5021   零售   http://192.168.0.155:8106
      // back_server_port: "8080",
      // back_server_ip: "192.168.0.192",  // 199
      // back_server_ip: "139.196.209.46",    // 240 139.129.128.155:5021
      // back_server_port: "8106",
      // back_server_port: "8101",
      // back_server_ip: "192.168.0.192",    // 240 139.129.128.155:5021
      // back_server_port: "8101",
      // back_server_ip: "39.98.203.134",    // 240 139.129.128.155:5021
      // back_server_port: "8081",

      // back_server_protocol: "http",
      // back_server_ip: "192.168.0.244",    // 240 139.129.128.155:5021
      // back_server_port: "8101",
      // back_server_ip: "api.vanxum.com",    // http://api.vanxum.com:9080
      // back_server_port: "9080",
      // back_server_ip: "192.168.0.240",    // 240 139.129.128.155:5021   中铁
      // back_server_port: "8106",
      // back_server_ip: "192.168.0.121",    // 240 139.129.128.155:5021
      // back_server_port: "8101",
      // v2/procdetail/20200904153515052100
      // back_server_ip: "192.168.0.241",    // 240 139.129.128.155:5021   中铁
      // back_server_port: "8080",
      // back_server_ip: "192.168.0.157",    // 240 139.129.128.155:5021   中铁
      // back_server_port: "8104",
      // back_server_protocol: "https",
      // back_server_ip: "wx.100xsys.cn",
      // back_server_ip: "srvms.100xsys.cn",    // 100xsys
      // back_server_ip:"192.168.0.111",  // 公路研究院
      // back_server_port: "443",
      // back_server_port: "180",
      // back_server_port: "",
    };
    backendIpAddr =
      server_cfg.back_server_protocol +
      "://" +
      server_cfg.back_server_ip +
      ":" +
      server_cfg.back_server_port;
  }
  // window.backendIpAddr = backendIpAddr;

  const defaultApp =  window?.frameElement?.dataset?.["app"] ||  top.window?.pathConfig?.application;

  service_api = {
    selectOne: backendIpAddr + "/" + defaultApp + "/select",
    select: backendIpAddr + "/" + defaultApp + "/select",
    selectByUser: backendIpAddr + "/" + defaultApp + "/select",
    operate: backendIpAddr + "/" + defaultApp + "/operate",
    approval: backendIpAddr + "/" + defaultApp + "/process/approval",
    uploadFile: backendIpAddr + "/file/upload",
    downloadFile: backendIpAddr + "/file/download?filePath=",
    deleteFile: backendIpAddr + "/file/delete",
    exportExcel: backendIpAddr + "/" + defaultApp + "/export/exportExcel",
    importExcel: backendIpAddr + "/" + defaultApp + "/bizDataImport",
    qrcode: backendIpAddr + "/" + defaultApp + "/bxsys/qrcode",
    downloadTemplate:
      backendIpAddr + "/" + defaultApp + "/downloadTemplate/excel/",
    imageFileNo: backendIpAddr + "/file/download?fileNo=",
  };
  window.serviceApi = service_api;
  Vue.prototype.service_api = service_api;
}
export const serviceApi = service_api
export default init;
