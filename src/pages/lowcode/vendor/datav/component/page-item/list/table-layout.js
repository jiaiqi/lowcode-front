// BxTable 的表头和表体是两个原生 table，必须消费同一组最终像素宽度才能保持对齐。
const DEFAULT_COLUMN_MIN_WIDTH = 80;
const DEFAULT_IMAGE_COLUMN_MIN_WIDTH = 120;
const DEFAULT_ACTION_MIN_WIDTH = 80;
const DEFAULT_ACTION_MAX_WIDTH = 200;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function roundWidth(value) {
  return Math.round(value * 1000) / 1000;
}

function distributeWeightedWidths(totalWidth, columnSpecs) {
  const widths = columnSpecs.map(() => 0);
  let remainingWidth = Math.max(totalWidth, 0);
  let activeIndexes = columnSpecs.map((_, index) => index);

  // 反复固定达不到最小宽度的列，再把剩余空间按原百分比权重分给其他列。
  while (activeIndexes.length) {
    const totalWeight = activeIndexes.reduce(
      (total, index) => total + columnSpecs[index].width.value,
      0
    );
    if (!(totalWeight > 0)) {
      activeIndexes.forEach((index) => {
        widths[index] = columnSpecs[index].minWidth;
      });
      break;
    }

    const constrainedIndexes = activeIndexes.filter((index) => {
      const proportionalWidth =
        (remainingWidth * columnSpecs[index].width.value) / totalWeight;
      return proportionalWidth < columnSpecs[index].minWidth;
    });

    if (!constrainedIndexes.length) {
      activeIndexes.forEach((index) => {
        widths[index] =
          (remainingWidth * columnSpecs[index].width.value) / totalWeight;
      });
      break;
    }

    const constrainedIndexSet = new Set(constrainedIndexes);
    constrainedIndexes.forEach((index) => {
      widths[index] = columnSpecs[index].minWidth;
      remainingWidth -= columnSpecs[index].minWidth;
    });
    activeIndexes = activeIndexes.filter(
      (index) => !constrainedIndexSet.has(index)
    );

    if (remainingWidth <= 0) {
      activeIndexes.forEach((index) => {
        widths[index] = columnSpecs[index].minWidth;
      });
      break;
    }
  }

  return widths;
}

export function parseTableColumnWidth(width) {
  // 兼容旧配置：纯数字和数字类型沿用原行为，解释为百分比而不是 px。
  if (typeof width === "number" && Number.isFinite(width)) {
    return { type: "percent", value: Math.max(width, 0) };
  }

  const normalizedWidth = String(width ?? "")
    .trim()
    .toLowerCase();
  if (!normalizedWidth || normalizedWidth === "auto") {
    return { type: "auto", value: 0 };
  }

  const numericValue = Number.parseFloat(normalizedWidth);
  if (!Number.isFinite(numericValue)) {
    return { type: "auto", value: 0 };
  }
  if (normalizedWidth.endsWith("px")) {
    return { type: "px", value: Math.max(numericValue, 0) };
  }
  if (normalizedWidth.endsWith("%") || /^\d+(\.\d+)?$/.test(normalizedWidth)) {
    return { type: "percent", value: Math.max(numericValue, 0) };
  }
  return { type: "auto", value: 0 };
}

export function buildTableColumnLayout({
  containerWidth,
  columns,
  showRowButtons,
  rowButtonWidth,
  columnMinWidth = DEFAULT_COLUMN_MIN_WIDTH,
  imageColumnMinWidth = DEFAULT_IMAGE_COLUMN_MIN_WIDTH,
  actionMinWidth = DEFAULT_ACTION_MIN_WIDTH,
  actionMaxWidth = DEFAULT_ACTION_MAX_WIDTH,
} = {}) {
  const safeColumns = Array.isArray(columns) ? columns : [];
  const safeContainerWidth = Number.isFinite(Number(containerWidth))
    ? Math.max(Number(containerWidth), 0)
    : 0;

  const columnSpecs = safeColumns.map((column) => ({
    minWidth:
      column?.col_type === "Image" ? imageColumnMinWidth : columnMinWidth,
    width: parseTableColumnWidth(column?.width),
  }));

  let actionWidth = 0;
  if (showRowButtons) {
    // 操作列优先保证按钮可用空间，同时限制其不能无限挤占数据列。
    const actionSpec = parseTableColumnWidth(rowButtonWidth);
    const preferredActionWidth =
      actionSpec.type === "percent"
        ? (safeContainerWidth * actionSpec.value) / 100
        : actionSpec.type === "px"
        ? actionSpec.value
        : actionMinWidth;
    actionWidth = clamp(
      preferredActionWidth || actionMinWidth,
      actionMinWidth,
      actionMaxWidth
    );
  }

  // 百分比列描述的是数据区域占比，操作列是附加区域，不能重复挤占百分比宽度。
  const dataViewportWidth = Math.max(safeContainerWidth - actionWidth, 0);
  const percentColumnSpecs = columnSpecs.filter(
    (columnSpec) => columnSpec.width.type === "percent"
  );
  const percentWidthTotal = percentColumnSpecs.reduce(
    (total, columnSpec) =>
      total + columnSpec.width.value,
    0
  );
  const hasAutoColumns = columnSpecs.some(
    (columnSpec) => columnSpec.width.type === "auto"
  );
  const shouldDistributePercentWidths =
    !hasAutoColumns &&
    percentColumnSpecs.length > 0 &&
    percentWidthTotal > 0 &&
    percentWidthTotal <= 100;

  const fixedPixelWidth = columnSpecs.reduce(
    (total, columnSpec) =>
      columnSpec.width.type === "px"
        ? total + Math.max(columnSpec.width.value, columnSpec.minWidth)
        : total,
    0
  );
  const distributedPercentWidths = shouldDistributePercentWidths
    ? distributeWeightedWidths(
        Math.max(dataViewportWidth - fixedPixelWidth, 0),
        percentColumnSpecs
      )
    : [];
  let distributedPercentIndex = 0;

  const autoColumnIndexes = [];
  const columnWidths = columnSpecs.map((columnSpec, columnIndex) => {
    if (columnSpec.width.type === "auto") {
      autoColumnIndexes.push(columnIndex);
      return columnSpec.minWidth;
    }
    if (columnSpec.width.type === "percent" && shouldDistributePercentWidths) {
      const width = distributedPercentWidths[distributedPercentIndex];
      distributedPercentIndex += 1;
      return width;
    }
    const preferredWidth =
      columnSpec.width.type === "percent"
        ? (dataViewportWidth * columnSpec.width.value) / 100
        : columnSpec.width.value;
    return Math.max(preferredWidth, columnSpec.minWidth);
  });

  const assignedWidth =
    columnWidths.reduce((total, width) => total + width, 0) + actionWidth;
  const remainingWidth = Math.max(safeContainerWidth - assignedWidth, 0);

  // 只有 auto 列可以吸收剩余空间，显式 px/% 宽度始终保持稳定。
  if (remainingWidth > 0 && autoColumnIndexes.length) {
    const extraWidth = remainingWidth / autoColumnIndexes.length;
    autoColumnIndexes.forEach((columnIndex) => {
      columnWidths[columnIndex] += extraWidth;
    });
  }

  const contentWidth =
    columnWidths.reduce((total, width) => total + width, 0) + actionWidth;
  const shouldFillContainer =
    autoColumnIndexes.length > 0 || shouldDistributePercentWidths;

  return {
    columnWidths: columnWidths.map(roundWidth),
    actionWidth: roundWidth(actionWidth),
    // 内容超过容器时保留最小列宽，由 BxTable 外层提供横向滚动，不再继续压缩。
    tableWidth: roundWidth(
      shouldFillContainer
        ? Math.max(safeContainerWidth, contentWidth)
        : contentWidth
    ),
  };
}
