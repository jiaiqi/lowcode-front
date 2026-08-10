/**
 * 根据数据行中的 _encrypt_param 配置对指定字段值进行前端脱敏处理
 * @param {Object} row 数据行对象，包含 _encrypt_param 规则数组
 * @param {String|Array} colNames 对应字段名或字段名候选数组
 * @param {Any} val 原始或格式化后的文本值
 * @returns {Any} 脱敏后字符串或原始值
 */
export function applyEncryptParam(row, colNames, val) {
  if (val === null || val === undefined || val === "") {
    return val;
  }
  const encryptParam = row?._encrypt_param;
  if (!Array.isArray(encryptParam) || encryptParam.length === 0) {
    return val;
  }

  // 1. 构建候选列名列表
  const targets = [];
  if (Array.isArray(colNames)) {
    colNames.forEach((c) => c && targets.push(String(c)));
  } else if (colNames) {
    targets.push(String(colNames));
  }

  // 2. 智能反查：如果无法通过传入的 colNames 匹配，自动推断 row 中值与 val 相同的字段名
  if (row && typeof row === "object") {
    const strVal = String(val).trim();
    for (const [k, v] of Object.entries(row)) {
      if (
        k !== "_encrypt_param" &&
        k !== "_encrypt_cols" &&
        v !== null &&
        v !== undefined &&
        String(v).trim() === strVal
      ) {
        if (!targets.includes(k)) {
          targets.push(k);
        }
      }
    }
  }

  // 辅助匹配规则中的 _encrypt_cols
  const matchCol = (ruleCol, targetCol) => {
    if (!ruleCol || !targetCol) return false;
    const targetStr = String(targetCol).trim();
    if (Array.isArray(ruleCol)) {
      return ruleCol.some((c) => String(c).trim() === targetStr);
    }
    const ruleStr = String(ruleCol).trim();
    if (ruleStr === targetStr) return true;
    if (ruleStr.includes(",")) {
      return ruleStr.split(",").some((c) => c.trim() === targetStr);
    }
    return false;
  };

  // 3. 在候选列名中寻找匹配的脱敏规则
  let rule = null;
  for (const colName of targets) {
    if (!colName) continue;
    rule = encryptParam.find(
      (r) =>
        r &&
        matchCol(r._encrypt_cols, colName) &&
        (r._desens_method === "前端脱敏" || !r._desens_method)
    );
    if (rule) break;
  }

  // 4. 执行脱敏算法
  if (rule) {
    const dsType = rule._ds_type;
    if (dsType === "全部脱敏") {
      return "******";
    } else if (dsType === "部分脱敏") {
      const strValue = String(val);
      const startPos = parseInt(rule._start_pos, 10);
      const numberOfChar = parseInt(rule._numberofchar, 10);
      if (
        !isNaN(startPos) &&
        !isNaN(numberOfChar) &&
        startPos >= 1 &&
        numberOfChar >= 1 &&
        startPos <= strValue.length
      ) {
        const startIndex = startPos - 1;
        const actualEndIndex = Math.min(
          startIndex + numberOfChar,
          strValue.length
        );
        const maskLength = actualEndIndex - startIndex;
        const mask = "*".repeat(maskLength);
        return (
          strValue.substring(0, startIndex) +
          mask +
          strValue.substring(actualEndIndex)
        );
      }
    }
  }

  return val;
}
