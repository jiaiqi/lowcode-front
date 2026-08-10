
// 通用实现：不使用 ESM 语法，保持纯函数定义，底部按 CJS 导出。

function getRouteMode() {
  return process.env.VUE_APP_ROUTE_MODE || 'hash'
}

function getBaseUrl() {
  return process.env.VUE_APP_BASE_URL || ''
}

function getFullBaseUrl() {
  if (getRouteMode() === 'hash') {
    return `${getBaseUrl()}/#`
  } else {
    return `${getBaseUrl()}`
  }
}

function getPublicPath() {
  return process.env.VUE_APP_BASE_URL
    ? process.env.VUE_APP_BASE_URL + "/"
    : process.env.VUE_APP_ROUTE_MODE === 'history'
      ? '/'
      : "./"
}

function getOutputDir() {
  return process.env.VUE_APP_OUTPUT_DIR || 'vpages'
}

function getAssetsDir() {
  return process.env.VUE_APP_ASSETS_DIR || 'assets'
}

// CommonJS 导出，供 Node 侧直接 require 使用；
// Webpack/TS/Babel 环境下，允许通过 ESM 语法进行“命名导入”互操作。
// 说明：大多数现代打包器会为 CJS 的对象导出提供命名导入支持。
export default {
  getRouteMode,
  getBaseUrl,
  getFullBaseUrl,
  getPublicPath,
  getOutputDir,
  getAssetsDir,
}