import { getImagePath } from "@/common/http";

// 处理后端返回的样式数据
const formatStyleData = (val) => {
  let json = val;
  if (typeof json === 'string') {
    try {
      json = JSON.parse(json);
    } catch (error) {
      console.error("error：" + json + "!" + error);
    }
  }
  let str = JSON.stringify(json);
  if (!isJSON(str)) return {};

  let obj = {};
  let themeVariableKeys = [
    "primary-color",
    "text-color",
    "header-bg-color",
    "header-text-color",
    "footer-bg-color",
    "footer-text-color",
    "menu-bg-color",
    "menu-text-color",
    "menu-active-bg-color",
    "menu-hover-bg-color",
    "menu-active-text-color",
    "menu-hover-text-color",
  ];
  const needUnitsCssKey = ['width', 'height', 'left', 'right', 'top', 'bottom', 'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'font-size', 'border-radius', 'border-width',];
  for (let key in json) {
    let _key = key.replaceAll("_", "-");
    // 宽、高、left、right、top、bottom等属性默认单位为px
    if (needUnitsCssKey.includes(_key) && (typeof json[key] === 'number' || !isNaN(Number(json[key])))) {
      json[key] = `${json[key]}px`;
    }
    obj[_key] = json[key];

    if (typeof json[key] === 'string') {
      // 处理样式变量
      if (themeVariableKeys.includes(json[key])) {
        obj[_key] = `var(--${json[key]})`;

        if (json[key]?.includes('text')) {
          obj[_key] = `var(--${json[key]}, #fff)`;
        }
        if (json[key]?.includes('bg')) {
          obj[_key] = `var(--${json[key]}, #409EFF)`;
        }
      }
      if (json[key]?.includes('bg-color')) {
        obj[_key] = `var(--${json[key]}, #409EFF)`;
      }
      if (json[key]?.includes('text-color')) {
        obj[_key] = `var(--${json[key]}, #fff)`;
      }
    }

    if (_key === "background-image" && json[key] && !json[key]?.includes('url(')) {
      obj[_key] = `url(${getImagePath(json[key])})`;
    }
    if (typeof obj[_key] === 'string' && obj[_key].includes('rpx')) {
      obj[_key] = rpx2px(obj[_key]);
    }
  }
  if (obj["background-image"] && !obj["background-size"]) {
    obj["background-size"] = "100% 100%";
  }

  return obj;
};

const isJSON = (str) => {
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

function rpx2px(str) {
  if (!str) return str;
  return str.replace(/(\d+)rpx/g, (match, p1) => {
    return `${parseInt(p1) / 2}px`;
  });
}
export { applyEncryptParam } from "./encrypt-util";
export { formatStyleData, rpx2px };

