import { isDimParaValid } from "./dim-para-util";

function isEmptyDimValue(value) {
  return value === null || value === undefined || value === "";
}

function normalizeBooleanValue(value) {
  if ([true, 1, "1", "true", "是"].includes(value)) return true;
  if ([false, 0, "0", "false", "否"].includes(value)) return false;
  return value;
}

function isSameDimValue(left, right, field) {
  if (field?.info?.type === "Boolean") {
    return Object.is(
      normalizeBooleanValue(left),
      normalizeBooleanValue(right)
    );
  }
  if (Object.is(left, right)) return true;
  if (isEmptyDimValue(left) || isEmptyDimValue(right)) return false;
  return String(left) === String(right);
}

export function getMenuDimParaField(fields, dimPara, formType) {
  if (!isDimParaValid(dimPara) || !fields || !formType) return null;

  const field = fields[dimPara.dim_no];
  const srvCol = field?.info?.srvCol;
  const inFlag = srvCol?.[`in_${formType}`];
  if (!field || inFlag === undefined || inFlag === null || inFlag === 0) {
    return null;
  }

  return { field, inFlag };
}

export function applyMenuDimParaFieldPolicy(fields, dimPara, formType) {
  const target = getMenuDimParaField(fields, dimPara, formType);
  if (!target || target.inFlag !== 1) return false;

  if (dimPara.dim_col_handle === "隐藏") {
    target.field.info.visible = false;
    return true;
  }
  if (dimPara.dim_col_handle === "只读") {
    target.field.info.editable = false;
    return true;
  }
  return false;
}

export function applyMenuDimParaAddValue(fields, dimPara) {
  const target = getMenuDimParaField(fields, dimPara, "add");
  if (!target || typeof target.field.setSrvVal !== "function") {
    return { status: "ignored" };
  }

  target.field.setSrvVal(dimPara.dim_val);
  return { status: "applied", field: target.field };
}

export function applyMenuDimParaUpdateValue(fields, dimPara) {
  const target = getMenuDimParaField(fields, dimPara, "update");
  if (!target || typeof target.field.getSrvVal !== "function") {
    return { status: "ignored" };
  }

  const currentValue = target.field.getSrvVal();
  if (isEmptyDimValue(currentValue)) {
    target.field.setSrvVal(dimPara.dim_val);
    return { status: "filled", field: target.field };
  }
  if (!isSameDimValue(currentValue, dimPara.dim_val, target.field)) {
    return {
      status: "conflict",
      field: target.field,
      currentValue,
      dimValue: dimPara.dim_val,
    };
  }
  return { status: "matched", field: target.field };
}
