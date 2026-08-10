import { getFullBaseUrl } from "@/common/common";

export function createLinkUrlFunc(optionListV2, thisColName) {
  let func = function (data) {
    if(!optionListV2 || !optionListV2.serviceName) return console.error(thisColName,"optionListV2 or serviceName is empty", optionListV2);
    let service = optionListV2.serviceName
    let defaultSrvApp = resolveAppFromService(service);
    const srvApp = optionListV2.srv_app || defaultSrvApp || optionListV2?.add_srv_cfg?.app || optionListV2?.update_srv_cfg?.app || ""
    const url = `${getFullBaseUrl()}/detail/${service}/xxx?srvApp=${srvApp}&operate_params=`;
    const refedCol = optionListV2.refed_col
    const operateParams = {
      serviceName: service,
      condition: [{
        colName: refedCol,
        ruleType: "eq",
        value: data[thisColName]
      }]
    }
    return url + encodeURIComponent(JSON.stringify(operateParams));
  }

  return func;
}


export function resolveAppFromService(service) {
  let appList = ["auth", "sso"];
  let ret = appList.find(app => service.includes(app));
  return ret || "";
}
