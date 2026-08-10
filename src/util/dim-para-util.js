/**
 * 菜单维度参数（dim_para）接入层。
 *
 * 宿主系统通过以下两种方式传递参数：
 * 1. iframe data 属性：data-dim-no / data-dim-val / data-dim-col-handle
 * 2. postMessage：{ type: "menu_dim_para", dim_no, dim_val, dim_col_handle }
 *
 * 本模块只负责参数读取、校验、缓存和就绪时序，不包含列表或表单业务规则。
 */

const MESSAGE_TYPE = "menu_dim_para";
const DEFAULT_MESSAGE_GRACE_MS = 300;

let cachedDimPara = null;
let cachedSource = null;
let messageListenerInitialized = false;
let ready = false;
let readyPromise = null;
let resolveReadyPromise = null;
let windowLoadHandler = null;
let graceTimer = null;
let maxWaitTimer = null;

const subscribers = new Set();

function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function isEmbedded() {
  if (!isBrowser()) return false;
  try {
    return window.self !== window.top;
  } catch (error) {
    return true;
  }
}

function hasRequiredValue(value) {
  return value !== null && value !== undefined && value !== "";
}

/**
 * 将外部输入规范化为统一格式。
 * dim_no 和 dim_val 都存在时才启用该特性；dim_col_handle 可选。
 */
function normalizeDimPara(input) {
  if (!input || typeof input !== "object") return null;

  const dimNo =
    typeof input.dim_no === "string" ? input.dim_no.trim() : "";
  const dimVal = input.dim_val;

  if (!hasRequiredValue(dimNo) || !hasRequiredValue(dimVal)) return null;

  return Object.freeze({
    dim_no: dimNo,
    dim_val: dimVal,
    dim_col_handle: hasRequiredValue(input.dim_col_handle)
      ? input.dim_col_handle
      : null,
  });
}

function isDebugEnabled() {
  if (!isBrowser()) return false;

  try {
    if (window.sessionStorage?.getItem("menuDimParaDebug") === "true") {
      return true;
    }
  } catch (error) {
    // 某些隐私模式下 sessionStorage 不可用，不影响主流程。
  }

  return (
    typeof process !== "undefined" &&
    process.env &&
    process.env.NODE_ENV !== "production"
  );
}

function debugLog(message, detail) {
  if (!isDebugEnabled()) return;

  if (detail === undefined) {
    console.debug(`[menu-dim-para] ${message}`);
  } else {
    console.debug(`[menu-dim-para] ${message}`, detail);
  }
}

function clearReadyWaitResources() {
  if (!isBrowser()) return;

  if (windowLoadHandler) {
    window.removeEventListener("load", windowLoadHandler);
    windowLoadHandler = null;
  }
  if (graceTimer) {
    window.clearTimeout(graceTimer);
    graceTimer = null;
  }
  if (maxWaitTimer) {
    window.clearTimeout(maxWaitTimer);
    maxWaitTimer = null;
  }
}

function settleReady(value, reason) {
  if (ready) return;

  ready = true;
  clearReadyWaitResources();
  debugLog(`参数接入已就绪：${reason}`, value);

  if (resolveReadyPromise) {
    resolveReadyPromise(value);
    resolveReadyPromise = null;
  }
}

function notifySubscribers(value, source) {
  subscribers.forEach((subscriber) => {
    try {
      subscriber(value, source);
    } catch (error) {
      console.error("[menu-dim-para] 参数订阅回调执行失败:", error);
    }
  });
}

/**
 * 首次有效参数生效，避免同一 iframe 在生命周期内被后续消息改变业务维度。
 */
function cacheDimPara(input, source) {
  if (cachedDimPara) return cachedDimPara;

  const normalized = normalizeDimPara(input);
  if (!normalized) return null;

  cachedDimPara = normalized;
  cachedSource = source;
  debugLog(`收到有效参数，来源：${source}`, normalized);
  notifySubscribers(normalized, source);
  settleReady(normalized, source);
  return normalized;
}

/**
 * 同源时从 iframe 元素同步读取参数。
 * getAttribute 是主路径，同时兼容旧版本可能使用的下划线属性名。
 */
function readFromFrameElement() {
  if (!isBrowser() || !isEmbedded()) return null;

  try {
    const frameElement = window.frameElement;
    if (!frameElement) return null;

    return normalizeDimPara({
      dim_no:
        frameElement.getAttribute("data-dim-no") ||
        frameElement.getAttribute("data-dim_no"),
      dim_val:
        frameElement.getAttribute("data-dim-val") ||
        frameElement.getAttribute("data-dim_val"),
      dim_col_handle:
        frameElement.getAttribute("data-dim-col-handle") ||
        frameElement.getAttribute("data-dim_col_handle"),
    });
  } catch (error) {
    // 跨域 iframe 无法读取 frameElement，等待 postMessage 即可。
    debugLog("无法读取 iframe data 属性，等待 postMessage", error);
    return null;
  }
}

function getReferrerOrigin() {
  if (!isBrowser() || !document.referrer) return null;

  try {
    return new URL(document.referrer).origin;
  } catch (error) {
    debugLog("无法解析 document.referrer，退化为仅校验消息来源窗口", error);
    return null;
  }
}

function isTrustedParentMessage(event) {
  if (!isBrowser() || !isEmbedded()) return false;
  if (event.source !== window.parent) return false;

  const referrerOrigin = getReferrerOrigin();
  if (referrerOrigin && event.origin !== referrerOrigin) {
    debugLog("忽略 origin 不匹配的 menu_dim_para 消息", {
      actualOrigin: event.origin,
      expectedOrigin: referrerOrigin,
    });
    return false;
  }

  return true;
}

function handleMessage(event) {
  if (!event.data || event.data.type !== MESSAGE_TYPE) return;
  if (!isTrustedParentMessage(event)) {
    debugLog("忽略非宿主窗口发送的 menu_dim_para 消息");
    return;
  }

  const dimPara = cacheDimPara(event.data, "postMessage");
  if (!dimPara) {
    debugLog("收到 menu_dim_para，但缺少必填的 dim_no 或 dim_val");
  }
}

function initPostMessageListener() {
  if (!isBrowser() || messageListenerInitialized) return;

  messageListenerInitialized = true;
  window.addEventListener("message", handleMessage);
}

/**
 * 同步获取已生效的菜单维度参数。
 *
 * @returns {{ dim_no: string, dim_val: *, dim_col_handle: * } | null}
 */
export function getMenuDimPara() {
  if (cachedDimPara) return cachedDimPara;

  const fromFrameElement = readFromFrameElement();
  return fromFrameElement
    ? cacheDimPara(fromFrameElement, "iframe-data-attributes")
    : null;
}

/**
 * 等待菜单维度参数接入完成。
 *
 * 同源 iframe 可立即返回；跨域 iframe 等待宿主在 iframe load 后发送消息。
 * 若宿主未配置维度，不会发送消息，因此在 window.load 后保留一个短暂窗口，
 * 随后以 null 正常降级。默认不在 window.load 前超时，避免跨域页面加载较慢时
 * 先发起一次未带维度条件的查询；调用方确有需要时可显式传入 maxWaitMs。
 *
 * @param {{ messageGraceMs?: number, maxWaitMs?: number }} options
 * @returns {Promise<{ dim_no: string, dim_val: *, dim_col_handle: * } | null>}
 */
export function waitMenuDimParaReady(options = {}) {
  const immediateValue = getMenuDimPara();
  if (immediateValue) return Promise.resolve(immediateValue);

  if (!isBrowser() || !isEmbedded()) {
    settleReady(null, "非 iframe 场景");
    return Promise.resolve(null);
  }

  if (ready) return Promise.resolve(cachedDimPara);
  if (readyPromise) return readyPromise;

  const messageGraceMs = Math.max(
    0,
    Number(options.messageGraceMs ?? DEFAULT_MESSAGE_GRACE_MS) || 0
  );
  const configuredMaxWaitMs = Number(options.maxWaitMs);
  const maxWaitMs = Number.isFinite(configuredMaxWaitMs)
    ? Math.max(messageGraceMs, configuredMaxWaitMs)
    : null;

  readyPromise = new Promise((resolve) => {
    resolveReadyPromise = resolve;
  });

  const startGracePeriod = () => {
    if (ready || graceTimer) return;
    graceTimer = window.setTimeout(() => {
      graceTimer = null;
      settleReady(cachedDimPara, "宿主未传递有效维度参数");
    }, messageGraceMs);
  };

  if (document.readyState === "complete") {
    startGracePeriod();
  } else {
    windowLoadHandler = startGracePeriod;
    window.addEventListener("load", windowLoadHandler, { once: true });
  }

  if (maxWaitMs !== null) {
    maxWaitTimer = window.setTimeout(() => {
      maxWaitTimer = null;
      settleReady(cachedDimPara, "等待宿主消息超时");
    }, maxWaitMs);
  }

  return readyPromise;
}

/**
 * 订阅首次有效维度参数，供无法阻塞初始化的调用方处理极晚到达的消息。
 * 返回取消订阅函数，避免组件自行绑定 window message 事件。
 *
 * @param {(value: object, source: string) => void} subscriber
 * @param {{ immediate?: boolean }} options
 * @returns {() => void}
 */
export function subscribeMenuDimPara(subscriber, options = {}) {
  if (typeof subscriber !== "function") return () => {};

  subscribers.add(subscriber);
  if (options.immediate !== false && cachedDimPara) {
    subscriber(cachedDimPara, cachedSource);
  }

  return () => subscribers.delete(subscriber);
}

/**
 * 判断维度参数是否有效。dim_val 允许为 0 或 false。
 */
export function isDimParaValid(para) {
  return !!normalizeDimPara(para);
}

/**
 * 调试用状态快照。生产环境不会主动打印参数；需要时可在控制台设置：
 * sessionStorage.setItem("menuDimParaDebug", "true")
 */
export function getMenuDimParaDebugState() {
  return {
    embedded: isEmbedded(),
    ready,
    source: cachedSource,
    value: cachedDimPara,
    referrerOrigin: getReferrerOrigin(),
  };
}

// 必须在业务组件初始化前监听，避免漏掉宿主在 iframe load 后发送的消息。
initPostMessageListener();
