import Vue from "vue";
import { backendIpAddr, getEnv } from "@/common/http";
import { pathConfigMap } from "@/common/envList";

let serviceApi = null;

/**
 * 初始化旧工程遗留的全局 serviceApi 契约。
 * 新工程 lowcode 实际只使用 imageFileNo / downloadFile / downloadFilePrefix / downloadFileNo，
 * 其余字段（导出/审批/上传等旧表单能力）已移除。
 */
function init() {
  const envConfig = pathConfigMap[getEnv()] || {};
  const defaultApp =
    window?.frameElement?.dataset?.app || envConfig.application || "config";
  const baseUrl = (backendIpAddr || "").replace(/\/$/, "");

  serviceApi = {
    backendIpAddr: baseUrl,
    imageFileNo: `${baseUrl}/file/download?fileNo=`,
    downloadFile: `${baseUrl}/file/download?filePath=`,
    downloadFilePrefix: `${baseUrl}/file/download`,
    downloadFileNo: `${baseUrl}/file/download?fileNo=`,
  };

  window.serviceApi = serviceApi;
  Vue.prototype.service_api = serviceApi;
}

export { serviceApi };
export default init;
