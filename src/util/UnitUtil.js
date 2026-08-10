export function getUnitData(value, header) {
  let srvcol = header.srvcol || {};
  let more_config = srvcol.more_config || null;
  if(more_config){
    more_config = JSON.parse(more_config);
    let changJson = {
      dataSize: {
        B: 1,
        KB: 1024,
        MB: 1024 * 1024,
        GB: 1024 * 1024 * 1024,
        TB: 1024 * 1024 * 1024 * 1024
      },
      lenth: {
        MM: 1,
        CM: 10,
        M: 10*100,
        KM: 10*100*1000
      },
    }
    let unitC = more_config.unitC;
    if(!unitC){
      return value;
    }
    let unit = changJson[ unitC.unit ];
    switch(unitC.unit){
      case "dataSize":
        value = dataSize(value,unit,unitC.beforeUnit,unitC.afterUnit);
        break;
      case "lenth":
        value = lenth(value,unit[unitC.beforeUnit],unit[unitC.afterUnit],unitC.beforeUnit,unitC.afterUnit);
        break;
    }
    return value; 
  } else {
      return value;
  }   
};

export function getAlternateUnitData(value, header = {}) {
  const srvcol = header.srvcol || header || {};
  const paramsCfg = parseParamsCfg(srvcol.params_cfg);
  const alternateUnits = parseAlternateUnits(paramsCfg?.alternate_units);
  const originalUnit = String(paramsCfg?.original_val_unit || "").trim();

  if (!paramsCfg || (alternateUnits.length === 0 && !originalUnit)) {
    return null;
  }

  const numberValue = parseNumber(value);
  if (numberValue === null) {
    return null;
  }

  const matchedUnit = alternateUnits
    .sort((prev, next) => next.rate - prev.rate)
    .find((item) => Math.abs(numberValue) >= item.rate);
  const unitConfig = matchedUnit
    ? {
        ...matchedUnit,
        unit: `${matchedUnit.unit}${originalUnit}`,
      }
    : {
        unit: originalUnit,
        rate: 1,
      };
  const convertedValue = numberValue / unitConfig.rate;
  const decimals = normalizeDecimals(paramsCfg.decimals_num);

  return `${formatNumber(convertedValue, decimals)}${unitConfig.unit}`;
}

function parseParamsCfg(paramsCfg) {
  if (!paramsCfg) {
    return null;
  }
  if (typeof paramsCfg === "object") {
    return paramsCfg;
  }
  try {
    return JSON.parse(paramsCfg);
  } catch (error) {
    return null;
  }
}

function parseAlternateUnits(alternateUnits) {
  if (!alternateUnits || typeof alternateUnits !== "string") {
    return [];
  }
  return alternateUnits
    .split(",")
    .map((item) => {
      const [unit, rate] = item.split("/");
      const unitText = unit && unit.trim();
      const unitRate = Number(rate);
      if (!unitText || !Number.isFinite(unitRate) || unitRate <= 0) {
        return null;
      }
      return {
        unit: unitText,
        rate: unitRate,
      };
    })
    .filter(Boolean);
}

function parseNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const numberValue = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizeDecimals(decimals) {
  // 未配置 / 空串：保持原值；配置 0：保留到整数位
  if (decimals === null || decimals === undefined || decimals === "") {
    return null;
  }
  const numberValue = Number(decimals);
  if (!Number.isFinite(numberValue) || numberValue < 0) {
    return null;
  }
  return Math.floor(numberValue);
}

function formatNumber(value, decimals) {
  if (decimals === null) {
    return `${value}`;
  }
  return value.toFixed(decimals);
}
function dataSize(value,unit,beforeUnit,afterUnit){
  var beforeUnitNum = unit[beforeUnit];
  var afterUnitNum =  unit[afterUnit];
  var i = value * (beforeUnitNum / afterUnitNum);
  if(0==i){
    value = value + afterUnit;
  }else if(0.1>i){
    // afterUnit = findSuitDataUnit();
    // afterUnitNum =  unit[afterUnit];
    // value = (value * beforeUnitNum / afterUnitNum) ;
    // value = Math.round(value*100)/100 + afterUnit;
    value = value + beforeUnit;
  }else{
    value = (value * beforeUnitNum / afterUnitNum) ;
    value = Math.round(value*100)/100 + afterUnit;
  }
  return value;
}
//查询合适数据单位
function findSuitDataUnit(value,beforeUnit,afterUnit,unit){

  var beforeUnitNum = unit[beforeUnit];
  var afterUnitNum =  unit[afterUnit];
  if(beforeUnit==afterUnit){
    return afterUnit;
  }else{
    value = value * (beforeUnitNum / afterUnitNum);
    if(value<0.1){
      if("TB" == afterUnit){
        afterUnit = "GB";
      }else if ("GB" == afterUnit){
        afterUnit = "MB";
      }else if ("MB" == afterUnit){
        afterUnit = "KB";
      }else if ("KB" == afterUnit){
        afterUnit = "B";
      }
      findSuitDataUnit(value,beforeUnit,afterUnit,unit);
    }else{
      return afterUnit;
    }
  }
}

function lenth(value,beforeUnitNum,afterUnitNum,beforeUnit,afterUnit){
  var i = value * (beforeUnitNum / afterUnitNum);
  if(0==i){
    value = value + afterUnit;
  }else if(0.1>i){
    value = value + beforeUnit;
  }else{
    value = (value * beforeUnitNum / afterUnitNum) ;
    value = Math.round(value*100)/100 + afterUnit
  }
  return value;
}