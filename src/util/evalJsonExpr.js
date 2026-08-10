/**
 *
 * @param {*} json json表达式
 * @param {*} data 调用目标为字段时，值为表单的数据，调用目标为子表时，值为主表的数据
 * @returns {Boolean} true/false
 */
export function evalJson(json, data) {
  if (Array.isArray(json)) {
    // 表达式直接是一个数组 则按AND的逻辑来
    return json.every((item) => evalJson(item, data));
  }
  if (typeof json === "object") {
    if (json.column_name) {
      // 进行判断
      switch (json.operator) {
        case "等于":
          return json.value === data[json.column_name];
        case "不等于":
          return json.value !== data[json.column_name];
        case "大于":
          return json.value > data[json.column_name];
        case "小于":
          return json.value < data[json.column_name];
        case "大于等于":
          return json.value >= data[json.column_name];
        case "小于等于":
          return json.value <= data[json.column_name];
        case "开始于":
          return (
            (json.value &&
              typeof json.value == "string" &&
              data[json.column_name].indexOf(json.value) == 0) ||
            (Array.isArray(json.value) &&
              json.value.indexOf(data[json.column_name]) === 0)
          );
        case "结束于":
          return (
            json.value &&
            ((typeof json.value == "string" &&
              data[json.column_name].indexOf(json.value) ==
                data[json.column_name].length - json.value.length) ||
              (Array.isArray(json.value) &&
                json.value.indexOf(data[json.column_name]) ===
                  json.value.length - 1))
          );
        case "包含":
          return (
            json.value &&
            ((typeof json.value == "string" &&
              data[json.column_name].indexOf(json.value) > -1) ||
              (Array.isArray(json.value) &&
                json.value.indexOf(data[json.column_name]) > -1))
          );
        case "不包含":
          return (
            json.value &&
            ((typeof json.value == "string" &&
              data[json.column_name].indexOf(json.value) == -1) ||
              (Array.isArray(json.value) &&
                json.value.indexOf(data[json.column_name]) == -1))
          );
        case "等于NULL":
          return data[json.column_name] == null;
        case "不等于NULL":
          return data[json.column_name] != null;
        case "等于空":
          return data[json.column_name] == "";
        case "不等于空":
          return data[json.column_name] != "";
      }
    } else {
      // 逻辑运算
      return Object.keys(json).every((key) => {
        switch (key) {
          case "AND":
            return json[key].every((item) => evalJson(item, data));
          case "OR":
            return json[key].some((item) => evalJson(item, data));
          default:
            return false;
        }
      });
    }
  }
}
