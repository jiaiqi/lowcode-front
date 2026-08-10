export const DEFAULT_MERGE_CELL = Object.freeze({ rowspan: 1 });

// 将后端的“首列 / 所有列 / 自定义”配置收敛为当前可见字段名，忽略无效和重复字段。
export function resolveMergeColumnNames({
  enabled,
  rule,
  customColumns,
  tableColumns,
}) {
  if (!enabled || !Array.isArray(tableColumns) || !tableColumns.length) {
    return [];
  }

  const visibleColumnNames = tableColumns
    .map((column) => column?.columns)
    .filter(
      (columnName, index, columnNames) =>
        columnName && columnNames.indexOf(columnName) === index
    );
  const normalizedRule = String(rule || "").trim();

  if (normalizedRule === "首列") {
    return visibleColumnNames.slice(0, 1);
  }
  if (normalizedRule === "所有列") {
    return visibleColumnNames;
  }
  if (normalizedRule !== "自定义") {
    return [];
  }

  const visibleColumnNameSet = new Set(visibleColumnNames);
  return String(customColumns || "")
    .split(/[,，]/)
    .map((columnName) => columnName.trim())
    .filter(
      (columnName, index, columnNames) =>
        columnName &&
        visibleColumnNameSet.has(columnName) &&
        columnNames.indexOf(columnName) === index
    );
}

export function buildMergeCellMap(rows, columnNames, getValue) {
  const mergeCellMap = new Map();
  if (
    !Array.isArray(rows) ||
    rows.length < 2 ||
    !Array.isArray(columnNames) ||
    !columnNames.length
  ) {
    return mergeCellMap;
  }

  const valueGetter =
    typeof getValue === "function"
      ? getValue
      : (row, columnName) => row?.[columnName];

  columnNames.forEach((columnName) => {
    let groupStart = 0;

    for (let rowIndex = 1; rowIndex <= rows.length; rowIndex += 1) {
      const isSameGroup =
        rowIndex < rows.length &&
        // 使用严格相等；BxTable 传入原始字段 getter，显示格式化不会影响合并判断。
        valueGetter(rows[rowIndex - 1], columnName) ===
          valueGetter(rows[rowIndex], columnName);

      if (isSameGroup) continue;

      const rowspan = rowIndex - groupStart;
      if (rowspan > 1) {
        // 起始单元格保存真实 rowspan，后续单元格用 rowspan: 0 表示不渲染 td。
        mergeCellMap.set(`${groupStart}:${columnName}`, { rowspan });
        for (
          let hiddenRowIndex = groupStart + 1;
          hiddenRowIndex < rowIndex;
          hiddenRowIndex += 1
        ) {
          mergeCellMap.set(`${hiddenRowIndex}:${columnName}`, { rowspan: 0 });
        }
      }
      groupStart = rowIndex;
    }
  });

  return mergeCellMap;
}

export function getFullyCoveredRowIndexes(rowCount, columnNames, mergeCellMap) {
  const rowIndexes = new Set();
  if (
    !Number.isInteger(rowCount) ||
    rowCount < 1 ||
    !Array.isArray(columnNames) ||
    !columnNames.length ||
    !mergeCellMap ||
    typeof mergeCellMap.get !== "function"
  ) {
    return rowIndexes;
  }

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    // 所有列都被上方 rowspan 覆盖时，该 tr 没有 td，需要由组件补回逻辑行高。
    const isFullyCovered = columnNames.every(
      (columnName) =>
        mergeCellMap.get(`${rowIndex}:${columnName}`)?.rowspan === 0
    );
    if (isFullyCovered) rowIndexes.add(rowIndex);
  }
  return rowIndexes;
}

export function rotateTableRows(rows, offset) {
  if (!Array.isArray(rows) || rows.length < 2) return rows || [];

  const normalizedOffset = ((offset % rows.length) + rows.length) % rows.length;
  if (!normalizedOffset) return rows;

  // 返回新数组，让 Vue 通过 key 移动行节点；禁止像旧 mixin 一样直接重排 DOM。
  return rows.slice(normalizedOffset).concat(rows.slice(0, normalizedOffset));
}
