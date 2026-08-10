// 为兼容 CJS 源文件，改为默认导入再按命名方式导出
import cfg from "./config";
export const getRouteMode = cfg.getRouteMode;
export const getBaseUrl = cfg.getBaseUrl;
export const getFullBaseUrl = cfg.getFullBaseUrl;
export const getPublicPath = cfg.getPublicPath;
export const getOutputDir = cfg.getOutputDir;
export const getAssetsDir = cfg.getAssetsDir;

/**
 * 检查字符串是否为有效的JSON格式
 * @description 尝试解析字符串为JSON对象，判断是否为有效的JSON格式
 * @param {string} str - 需要检查的字符串
 * @returns {boolean} 如果是有效JSON返回true，否则返回false
 * @example
 * // 有效JSON
 * isJSON('{"name": "test"}'); // 返回: true
 * 
 * @example
 * // 无效JSON
 * isJSON('invalid json'); // 返回: false
 * 
 * @since 1.0.0
 */
export const isJSON = (str) => {
  if (typeof str == "string") {
    try {
      let obj = JSON.parse(str);
      if (typeof obj == "object" && obj) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      console.log("error：" + str + "!" + e);
      return false;
    }
  }
  return false;
};

/**
 * 将Blob对象转换为Base64字符串
 * @description 使用FileReader将Blob对象异步转换为Base64编码的数据URL
 * @param {Blob} blob - 需要转换的Blob对象
 * @returns {Promise<string>} 返回Promise，resolve时包含Base64编码的数据URL字符串
 * @throws {Error} 当读取失败时reject错误信息
 * @example
 * // 转换Blob为Base64
 * const blob = new Blob(['Hello World'], { type: 'text/plain' });
 * blobToBase64(blob).then(base64 => {
 *   console.log(base64); // 输出: data:text/plain;base64,SGVsbG8gV29ybGQ=
 * });
 * 
 * @since 1.0.0
 */
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * 将File对象转换为Base64字符串
 * @description 使用FileReader将File对象异步转换为Base64编码的数据URL
 * @param {File} file - 需要转换的File对象
 * @returns {Promise<string>} 返回Promise，resolve时包含Base64编码的数据URL字符串
 * @throws {Error} 当读取失败时reject错误信息
 * @example
 * // 转换文件为Base64
 * const fileInput = document.querySelector('input[type="file"]');
 * const file = fileInput.files[0];
 * fileToBase64(file).then(base64 => {
 *   console.log(base64); // 输出Base64编码的文件内容
 * });
 * 
 * @since 1.0.0
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * 动态加载外部JavaScript脚本
 * @description 动态创建script标签加载外部JS资源，主要用于加载百度地图等第三方库
 * @param {string} src - 脚本文件的URL地址
 * @returns {Promise<void>} 返回Promise，脚本加载成功时resolve
 * @throws {Error} 当脚本加载失败时reject
 * @example
 * // 加载百度地图脚本
 * LoadScript('https://api.map.baidu.com/api?v=3.0&ak=your_ak')
 *   .then(() => {
 *     console.log('百度地图脚本加载成功');
 *     // 可以使用BMap对象
 *   })
 *   .catch(err => {
 *     console.error('脚本加载失败', err);
 *   });
 * 
 * @since 1.0.0
 */
export function LoadScript(src) {
  const BMap_URL = src;
  if (!src) {
    return;
  }
  return new Promise((resolve, reject) => {
    // 如果已加载直接返回
    if (typeof BMap !== "undefined") {
      resolve(BMap);
      return true;
    }
    if (typeof BMapGL !== "undefined") {
      resolve(BMapGL);
      return true;
    }
    // // 百度地图异步加载回调处理
    // window.onBMapCallback = function () {
    //   console.log("百度地图脚本初始化成功...");
    //   resolve(BMap);
    // };
    // 插入script脚本
    let scriptNode = document.createElement("script");
    scriptNode.setAttribute("type", "text/javascript");
    scriptNode.setAttribute("src", BMap_URL);
    // 引入成功
    scriptNode.onload = function () {
      console.log("js资源已加载成功了");
      resolve();
    };
    // 引入失败
    scriptNode.onerror = function (err) {
      console.log("js资源加载失败了", err);
    };
    document.body.appendChild(scriptNode);
  });
}

/**
 * Cookie操作工具对象
 * @description 提供完整的Cookie操作方法，包括获取、设置、删除、检查存在性等功能
 * @namespace docCookies
 * @since 1.0.0
 */
export const docCookies = {
  /**
   * 获取指定名称的Cookie值
   * @description 根据Cookie名称获取对应的值，自动进行URL解码
   * @param {string} sKey - Cookie的名称
   * @returns {string|null} Cookie的值，如果不存在则返回null
   * @example
   * // 获取名为'username'的Cookie
   * const username = docCookies.getItem('username');
   * console.log(username); // 输出Cookie值或null
   * 
   * @memberof docCookies
   */
  getItem: function (sKey) {
    return (
      decodeURIComponent(
        document.cookie.replace(
          new RegExp(
            "(?:(?:^|.*;)\\s*" +
            encodeURIComponent(sKey).replace(/[-.+*]/g, "\\$&") +
            "\\s*\\=\\s*([^;]*).*$)|^.*$"
          ),
          "$1"
        )
      ) || null
    );
  },
  /**
   * 设置Cookie
   * @description 设置Cookie的名称、值及各种属性
   * @param {string} sKey - Cookie的名称
   * @param {string} sValue - Cookie的值
   * @param {number|string|Date} [vEnd] - 过期时间，可以是秒数、日期字符串或Date对象
   * @param {string} [sPath] - Cookie的路径
   * @param {string} [sDomain] - Cookie的域名
   * @param {boolean} [bSecure] - 是否只在HTTPS下传输
   * @returns {boolean} 设置成功返回true，失败返回false
   * @example
   * // 设置基本Cookie
   * docCookies.setItem('username', 'john', 3600); // 1小时后过期
   * 
   * @example
   * // 设置带路径和域名的Cookie
   * docCookies.setItem('token', 'abc123', new Date('2024-12-31'), '/', '.example.com', true);
   * 
   * @memberof docCookies
   */
  setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
    if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) {
      return false;
    }
    var sExpires = "";
    if (vEnd) {
      switch (vEnd.constructor) {
        case Number:
          sExpires =
            vEnd === Infinity
              ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT"
              : "; max-age=" + vEnd;
          break;
        case String:
          sExpires = "; expires=" + vEnd;
          break;
        case Date:
          sExpires = "; expires=" + vEnd.toUTCString();
          break;
      }
    }
    document.cookie =
      encodeURIComponent(sKey) +
      "=" +
      encodeURIComponent(sValue) +
      sExpires +
      (sDomain ? "; domain=" + sDomain : "") +
      (sPath ? "; path=" + sPath : "") +
      (bSecure ? "; secure" : "");
    return true;
  },
  /**
   * 删除指定的Cookie
   * @description 通过设置过期时间为过去时间来删除Cookie
   * @param {string} sKey - 要删除的Cookie名称
   * @param {string} [sPath] - Cookie的路径
   * @param {string} [sDomain] - Cookie的域名
   * @returns {boolean} 删除成功返回true，Cookie不存在返回false
   * @example
   * // 删除Cookie
   * docCookies.removeItem('username');
   * 
   * @example
   * // 删除指定路径的Cookie
   * docCookies.removeItem('token', '/', '.example.com');
   * 
   * @memberof docCookies
   */
  removeItem: function (sKey, sPath, sDomain) {
    if (!sKey || !this.hasItem(sKey)) {
      return false;
    }
    document.cookie =
      encodeURIComponent(sKey) +
      "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" +
      (sDomain ? "; domain=" + sDomain : "") +
      (sPath ? "; path=" + sPath : "");
    return true;
  },
  /**
   * 检查指定名称的Cookie是否存在
   * @description 使用正则表达式检查Cookie是否存在
   * @param {string} sKey - 要检查的Cookie名称
   * @returns {boolean} 存在返回true，不存在返回false
   * @example
   * // 检查Cookie是否存在
   * if (docCookies.hasItem('username')) {
   *   console.log('用户已登录');
   * }
   * 
   * @memberof docCookies
   */
  hasItem: function (sKey) {
    return new RegExp(
      "(?:^|;\\s*)" +
      encodeURIComponent(sKey).replace(/[-.+*]/g, "\\$&") +
      "\\s*\\="
    ).test(document.cookie);
  },
  /**
   * 获取所有Cookie的名称数组
   * @description 解析document.cookie获取所有Cookie的名称
   * @returns {string[]} 包含所有Cookie名称的数组
   * @example
   * // 获取所有Cookie名称
   * const cookieNames = docCookies.keys();
   * console.log(cookieNames); // ['username', 'token', 'theme']
   * 
   * @memberof docCookies
   */
  keys: function () {
    var aKeys = document.cookie
      .replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "")
      .split(/\s*(?:\=[^;]*)?;\s*/);
    for (var nIdx = 0; nIdx < aKeys.length; nIdx++) {
      aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]);
    }
    return aKeys;
  },
  /**
   * 清除所有Cookie
   * @description 获取所有Cookie名称并逐一删除
   * @returns {void}
   * @example
   * // 清除所有Cookie
   * docCookies.clear();
   * console.log('所有Cookie已清除');
   * 
   * @memberof docCookies
   */
  clear: function () {
    var aKeys = this.keys();
    for (var nIdx = 0; nIdx < aKeys.length; nIdx++) {
      this.removeItem(aKeys[nIdx], "/");
      this.removeItem(aKeys[nIdx]);
    }
  },
};

/**
 * 设置进入动画的CSS类名
 * @description 根据动画配置参数生成对应的CSS动画类名，用于元素进入时的动画效果
 * @param {Object} [params={}] - 动画配置参数对象
 * @param {string} params.use_enter_animation - 是否使用进入动画，值为"是"时启用
 * @param {string} params.enter_animation_type - 进入动画类型
 * @param {string} params.enter_direction - 进入动画方向
 * @returns {string|undefined} 返回动画CSS类名字符串，如果不启用动画则返回undefined
 * @example
 * // 设置淡入动画
 * const className = setEnterAnimationClass({
 *   use_enter_animation: "是",
 *   enter_animation_type: "淡入",
 *   enter_direction: "由左往右"
 * });
 * console.log(className); // "animate__animated animate__fadeInLeft"
 * 
 * @since 1.0.0
 */
export function setEnterAnimationClass(params = {}) {
  const { use_enter_animation, enter_animation_type, enter_direction } = params
  if (use_enter_animation === "是") {
    return setAnimationClass({
      type: enter_animation_type,
      direction: enter_direction,
    })
  }
}

/**
 * 设置进入动画的CSS变量样式
 * @description 根据动画配置参数生成对应的CSS自定义属性，用于控制动画的延迟、持续时间和重复次数
 * @param {Object} [params={}] - 动画配置参数对象
 * @param {string} params.use_enter_animation - 是否使用进入动画，值为"是"时启用
 * @param {number} params.enter_animation_delay - 动画延迟时间（秒）
 * @param {number} params.enter_animation_duration - 动画持续时间（秒）
 * @param {number} params.enter_animation_repeat - 动画重复次数，0表示无限循环
 * @returns {Object} 返回包含CSS自定义属性的样式对象
 * @example
 * // 设置动画样式变量
 * const style = setEnterAnimationVariables({
 *   use_enter_animation: "是",
 *   enter_animation_delay: 0.5,
 *   enter_animation_duration: 1.0,
 *   enter_animation_repeat: 2
 * });
 * console.log(style); // { "--animate-delay": "0.5s", "--animate-duration": "1.0s", "--animate-repeat": "2" }
 * 
 * @since 1.0.0
 */
export function setEnterAnimationVariables(params = {}) {
  const {
    use_enter_animation,
    enter_animation_delay: delay,
    enter_animation_duration: duration,
    enter_animation_repeat: repeat } = params
  const style = {}
  if (use_enter_animation === "是") {
    return setAnimationStyle({
      delay,
      duration,
      repeat,
    })
  }
  return style
}
/**
 * 根据动画方向构建动画类名后缀
 * @description 将中文的动画方向描述转换为对应的英文类名后缀，用于构建完整的动画类名
 * @param {string} direction - 动画方向的中文描述
 * @returns {string} 返回对应的英文类名后缀，如果方向不匹配则返回空字符串
 * @example
 * // 获取左侧进入的类名后缀
 * const suffix = buildAnimationClass("由左往右");
 * console.log(suffix); // "Left"
 * 
 * @example
 * // 获取右上角渐显的类名后缀
 * const suffix = buildAnimationClass("右上渐显");
 * console.log(suffix); // "TopRight"
 * 
 * @since 1.0.0
 */
export function buildAnimationClass(direction) {
  switch (direction) {
    case "由左往右":
      return "Left";
    case "由右往左":
      return "Right";
    case "由上至下":
      return "Down";
    case "由下至上":
      return "Up";
    /** 淡入可用 start*/
    case "左上渐显":
      return "TopLeft";
    case "右上渐显":
      return "TopRight";
    case "左下渐显":
      return "BottomLeft";
    case "右下渐显":
      return "BottomRight";
    /** 淡入可用 end*/
    /** 仅旋转可用 start*/
    case "向下左旋":
      return "DownLeft";
    case "向下右旋":
      return "DownRight";
    case "向上左旋":
      return "UpLeft";
    case "向上右旋":
      return "UpRight";
    /** 仅旋转可用 end*/
  }
  return ''
}
/**
 * 根据动画类型和方向生成完整的动画CSS类名
 * @description 基于Animate.css库，根据动画类型和方向生成对应的CSS类名字符串
 * @param {Object} [params={}] - 动画参数对象
 * @param {string} params.type - 动画类型（如：淡入、弹入、滑入等）
 * @param {string} params.direction - 动画方向（如：由左往右、由上至下等）
 * @returns {string} 返回完整的动画CSS类名字符串
 * @example
 * // 生成淡入动画类名
 * const className = setAnimationClass({
 *   type: "淡入",
 *   direction: "由左往右"
 * });
 * console.log(className); // "animate__animated animate__fadeInLeft"
 * 
 * @example
 * // 生成弹跳动画类名
 * const className = setAnimationClass({
 *   type: "弹跳"
 * });
 * console.log(className); // "animate__animated animate__bounce"
 * 
 * @since 1.0.0
 */
export function setAnimationClass(params = {}) {
  let className = "animate__animated ";
  const { type, direction } = params
  switch (type) {
    case "淡入":
      className += `animate__fadeIn${buildAnimationClass(direction)}`;
      break;
    case "弹入":
    case "弹跳进入":
      className += `animate__bounceIn${buildAnimationClass(direction)}`;
      break;
    case "划入":
    case "滑入":
      className += `animate__slideIn${buildAnimationClass(direction)}`;
      break;
    case "旋转":
      className += `animate__rotateIn${buildAnimationClass(direction)}`;
      break;
    case "缩放":
    case "放大":
      className += `animate__zoomIn${buildAnimationClass(direction)}`;
      break;
    case "缩放划入":
      className += `animate__backIn${buildAnimationClass(direction)}`;
      break;
    case "弹跳":
      className += `animate__bounce`;
      break;
    case "闪烁":
      className += `animate__flash`;
      break;
    case "脉冲":
      className += `animate__pulse`;
      break;
    case "橡皮圈":
      className += `animate__rubberBand`;
      break;
    case "横向晃动":
      className += `animate__shakeX`;
      break;
    case "纵向晃动":
      className += `animate__shakeY`;
      break;
    case "摇头":
      className += `animate__headShake`;
      break;
    case "摆动":
      className += `animate__swing`;
      break;
    case "颤动":
      className += `animate__tada`;
      break;
    case "果冻":
      className += `animate__jello`;
      break;
    case "心跳":
      className += `animate__heartBeat`;
      break;
    case "渐显":
      className += `animate__fadeIn`;
      break;
    case "翻转":
      className += `animate__flip`;
      break;
    case "铰链":
      className += `animate__hinge`;
      break;
    case "滚入":
      className += `animate__rollIn`;
      break;
  }
  return className
}

/**
 * 设置动画的CSS自定义属性样式
 * @description 根据动画参数生成对应的CSS自定义属性对象，用于控制Animate.css动画的延迟、持续时间和重复次数
 * @param {Object} [params={}] - 动画样式参数对象
 * @param {number} params.delay - 动画延迟时间（秒）
 * @param {number} params.duration - 动画持续时间（秒）
 * @param {number} params.repeat - 动画重复次数，0表示无限循环
 * @returns {Object} 返回包含CSS自定义属性的样式对象
 * @example
 * // 设置动画样式
 * const style = setAnimationStyle({
 *   delay: 0.5,
 *   duration: 2.0,
 *   repeat: 3
 * });
 * console.log(style); // { "--animate-delay": "0.5s", "--animate-duration": "2.0s", "--animate-repeat": "3" }
 * 
 * @example
 * // 设置无限循环动画
 * const style = setAnimationStyle({
 *   duration: 1.0,
 *   repeat: 0
 * });
 * console.log(style); // { "--animate-duration": "1.0s", "--animate-repeat": "infinite" }
 * 
 * @since 1.0.0
 */
export function setAnimationStyle(params = {}) {
  const { duration, delay, repeat } = params
  const style = {}
  if (delay) {
    style["--animate-delay"] = `${delay}s`
  }
  if (duration) {
    style["--animate-duration"] = `${duration}s`
  }
  if (repeat) {
    style["--animate-repeat"] = `${repeat}`
  } else if (repeat === 0) {
    style["--animate-repeat"] = `infinite`
  }
  return style
}


/**
 * 转换颜色格式并设置透明度
 * 
 * 支持多种颜色输入格式（十六进制、RGB、RGBA），并可以设置透明度值，
 * 最终输出为指定格式的带透明度颜色值。
 * 
 * @param {string} color - 输入颜色值
 *   - 十六进制格式：#RGB、#RRGGBB、#RRGGBBAA
 *   - RGB格式：rgb(r, g, b)
 *   - RGBA格式：rgba(r, g, b, a)
 * @param {string|number} opacity - 透明度值
 *   - 字符串：十六进制透明度值（如 "FF"、"80"）
 *   - 数字：0-1 范围的透明度值（如 0.5、1.0）
 * @param {string} [format="hex"] - 输出格式
 *   - "hex"：输出十六进制格式 #RRGGBBAA
 *   - "rgba"：输出 rgba(r, g, b, a) 格式
 * 
 * @returns {string} 带透明度的颜色值
 * 
 * @example
 * // 十六进制输入，数字透明度
 * convertColorWithOpacity("#FF0000", 0.5) // "#FF000080"
 * 
 * @example
 * // RGB输入，十六进制透明度，输出rgba格式
 * convertColorWithOpacity("rgb(255, 0, 0)", "80", "rgba") // "rgba(255, 0, 0, 0.502)"
 * 
 * @example
 * // 短格式十六进制输入
 * convertColorWithOpacity("#F00", 1.0) // "#FF0000FF"
 */
export function convertColorWithOpacity(color, opacity, format = "hex") {
  // 处理透明度参数
  let alphaValue;
  if (typeof opacity === "string" && opacity.length <= 2) {
    // 如果是十六进制字符串
    alphaValue = parseInt(opacity, 16);
  } else if (
    typeof opacity === "number" &&
    opacity >= 0 &&
    opacity <= 1
  ) {
    // 如果是0-1的数值
    alphaValue = Math.round(opacity * 255);
  } else {
    // 默认完全不透明
    alphaValue = 255;
  }

  // 确保透明度值在有效范围内
  alphaValue = Math.max(0, Math.min(255, alphaValue));

  let r, g, b;

  if (color.startsWith("#")) {
    // 处理十六进制颜色
    let hex = color.slice(1);

    if (hex.length === 3) {
      // 短格式 #RGB -> #RRGGBB
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    } else if (hex.length === 8) {
      // 已经包含透明度的格式 #RRGGBBAA，只取RGB部分
      hex = hex.slice(0, 6);
    }

    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else if (color.startsWith("rgb")) {
    // 处理rgb或rgba格式
    const match = color.match(/\d+/g);
    if (match && match.length >= 3) {
      r = parseInt(match[0]);
      g = parseInt(match[1]);
      b = parseInt(match[2]);
    } else {
      // 解析失败，返回默认颜色
      return format === "rgba" ? "rgba(0, 0, 0, 1)" : "#000000FF";
    }
  } else {
    // 不支持的格式，返回默认颜色
    return format === "rgba" ? "rgba(0, 0, 0, 1)" : "#000000FF";
  }

  // 确保RGB值在有效范围内
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));

  // 根据指定格式返回结果
  if (format === "rgba") {
    // 返回rgba格式，透明度转换为0-1范围
    const alpha = (alphaValue / 255).toFixed(3);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } else {
    // 默认返回十六进制格式
    const toHex = (value) =>
      value.toString(16).padStart(2, "0").toUpperCase();
    const result = `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(
      alphaValue
    )}`;
    return result;
  }
}

/**
  * 获取文件扩展名
  */
export function getFileExtension(url) {
  if (!url) return ''
  const fileName = url.split('/').pop().split('?')[0]
  const extension = fileName.split('.').pop().toLowerCase()
  return extension
}

/**
 * 根据文件后缀判断是否为图片文件
 */
export const isImageFile = (url, fileType) => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
  let extension = this.getFileExtension(url)
  if (fileType) {
    extension = fileType
  }
  if (extension) {
    extension = extension.toLowerCase()
  }
  return imageExtensions.includes(extension)
}

/**
     * H5环境下载
     */
export function downloadFileH5(url, fileName) {
  return new Promise((resolve, reject) => {
    try {
      const link = document.createElement('a')
      link.href = url
      link.download = fileName || url.split('/').pop().split('?')[0] || 'download'
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      uni.showToast({
        title: '开始下载',
        duration: 1500
      })
      resolve()
    } catch (error) {
      reject(new Error('下载失败'))
    }
  })
}

/**
 * 格式化文件大小
 * @param {number} bytes  文件大小，以字节为单位
 * @returns 
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0B';
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 * 1024) return Number((bytes / 1024).toFixed(2)) + 'KB';
  if (bytes < 1024 * 1024 * 1024) return Number((bytes / 1024 / 1024).toFixed(2)) + 'MB';
  return Number((bytes / 1024 / 1024 / 1024).toFixed(2)) + 'GB';
}

const LIST_SERVICE_TITLE_FORMS = ["add", "update", "detail"];

export function getAppStyleJson(vm) {
  try {
    const loginUser = JSON.parse(sessionStorage.getItem("current_login_user") || "{}");
    let appStyleJson = loginUser?.theme?.app_style_json;

    if (!appStyleJson) return null;
    if (typeof appStyleJson === "string") {
      try {
        appStyleJson = JSON.parse(appStyleJson);
      } catch (e) {
        return null;
      }
    }
    return appStyleJson || null;
  } catch (e) {
    return null;
  }
}

export function shouldUseServiceNameDialogTitle(vm) {
  const formDisplayOpt = getAppStyleJson(vm)?.form_display?.form_display_opt;
  return (
    typeof formDisplayOpt === "string" &&
    formDisplayOpt.includes("\u6807\u9898\u663e\u793a\u670d\u52a1\u540d")
  );
}

export function getFormServiceViewName(formVm) {
  return (
    formVm?.serviceViewName ||
    formVm?.getBasicForm?.()?.formV2?.service_view_name ||
    formVm?.formV2?.service_view_name ||
    ""
  );
}

export function isListServiceTitleForm(activeForm) {
  return LIST_SERVICE_TITLE_FORMS.includes(activeForm);
}
