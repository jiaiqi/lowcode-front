
export function dispCol2ValCol(dispColName) {
  let colName = dispColName.substring(1, dispColName.length)
  colName = colName.substring(0, colName.indexOf("_disp"))
  return colName
}
