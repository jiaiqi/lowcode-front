<template>
  <div
    class="bx-table"
    :style="[
      setTableStyle,
      {
        '--tbl-border-color': listConfig.tbl_border_color || '',
      },
    ]"
    :class="{ 'scroll-animation': isVerticalScroll }"
  >
    <!-- 表头和表体放在同一个横向滚动层，共享宽度模型，避免窄容器下滚动错位。 -->
    <div ref="tableViewport" class="table-horizontal-scroll">
      <div class="table-layout" :style="tableSurfaceStyle">
        <table class="table-head" :style="tableSurfaceStyle">
          <colgroup>
            <col
              v-for="(col, colIndex) in tableColumn"
              :key="col.columns"
              :style="{ width: `${columnLayout.columnWidths[colIndex]}px` }"
            />
            <col
              v-if="showRowButtons"
              :style="{ width: `${columnLayout.actionWidth}px` }"
            />
          </colgroup>
          <thead>
            <tr>
              <th
                v-for="(col, colIndex) in tableColumn"
                :key="col.columns"
                class="table-column"
                :style="{
                  color:
                    setStyle && setStyle.color
                      ? 'var(--tbl_head_color,' + setStyle.color + ')'
                      : null,
                  'font-size': setStyle && setStyle['font-size'],
                }"
                :title="col.label"
                :id="getHeaderCellId(colIndex)"
                scope="col"
              >
                {{ col.label }}
              </th>
              <th
                v-if="showRowButtons"
                class="table-column row-button-box"
                :style="normalizedRowButtonStyle"
                :id="getHeaderCellId(null, true)"
                scope="col"
              >
                操作
              </th>
            </tr>
          </thead>
        </table>
        <div
          class="table-body-wrap"
          :style="{
            height: isVerticalScroll
              ? `${displayRowLimit * rowHeight}px`
              : 'auto',
          }"
        >
          <table ref="tableBody" class="table-body" :style="tableSurfaceStyle">
            <colgroup>
              <col
                v-for="(col, colIndex) in tableColumn"
                :key="col.columns"
                :style="{ width: `${columnLayout.columnWidths[colIndex]}px` }"
              />
              <col
                v-if="showRowButtons"
                :style="{ width: `${columnLayout.actionWidth}px` }"
              />
            </colgroup>
            <tbody>
              <tr
                v-for="(tableRow, index) in orderedTableRows"
                :key="tableRow.sourceIndex"
                class="table-row"
                :class="{
                  stripe: striped && index % 2 === 1,
                  'merge-covered-row': fullyMergedRowIndexes.has(index),
                }"
                :style="getTableRowStyle(index)"
              >
                <template v-for="(col, colIndex) in tableColumn">
                  <td
                    v-if="getMergeCell(index, col).rowspan !== 0"
                    :key="col.columns"
                    class="table-column"
                    :rowspan="getMergeCell(index, col).rowspan"
                    :headers="getHeaderCellId(colIndex)"
                    :title="formatValue(tableRow.data, col)"
                    :style="[
                      cellOuterStyle,
                      {
                        color: setStyle && setStyle.color,
                        'font-size': setStyle && setStyle['font-size'],
                        '--first-col-bg':
                          (colIndex === 0 && listConfig.tbl_first_col_bg) ||
                          undefined,
                        '--first-col-color':
                          (colIndex === 0 && listConfig.tbl_first_col_color) ||
                          '',
                        '--tbl-border-color': listConfig.tbl_border_color || '',
                      },
                    ]"
                  >
                    <div class="table-cell-content" :style="cellContentStyle">
                      <el-image
                        v-if="
                          col.col_type === 'Image' &&
                          formatValue(tableRow.data, col)
                        "
                        class="td-img"
                        :src="getImagePath(formatValue(tableRow.data, col))"
                        :preview-src-list="[
                          getImagePath(formatValue(tableRow.data, col)),
                        ]"
                        @load="scheduleRowHeightMeasurement"
                      >
                      </el-image>
                      <span v-else>
                        {{ formatValue(tableRow.data, col) }}
                      </span>
                    </div>
                  </td>
                </template>
                <td
                  v-if="showRowButtons"
                  class="table-column row-button-box"
                  :style="normalizedRowButtonStyle"
                  :headers="getHeaderCellId(null, true)"
                >
                  <div class="row-button-content">
                    <el-button
                      v-for="btn in setRowButtons"
                      :key="btn.button_type"
                      type="text"
                      size="mini"
                      class="row-button"
                      @click="onRowButtonClick(btn, tableRow.data)"
                      >{{ btn.button_name }}</el-button
                    >
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { formatStyleData, applyEncryptParam } from "@/pages/lowcode/vendor/datav/common/index.js";
import { getAlternateUnitData } from "@/util/UnitUtil";
import {
  DEFAULT_MERGE_CELL,
  buildMergeCellMap,
  getFullyCoveredRowIndexes,
  resolveMergeColumnNames,
  rotateTableRows,
} from "./table-merge";
import { buildTableColumnLayout } from "./table-layout";

// 原生 td 必须保持 table-cell；只把 flex/grid 布局属性下放给内部内容容器。
const CELL_CONTENT_LAYOUT_STYLE_KEYS = [
  "display",
  "flex",
  "flex-grow",
  "flex-shrink",
  "flex-basis",
  "flex-flow",
  "flex-direction",
  "flex-wrap",
  "align-content",
  "align-items",
  "justify-content",
  "justify-items",
  "place-content",
  "place-items",
  "gap",
  "row-gap",
  "column-gap",
];

const DEFAULT_ROW_HEIGHT = 40;

function requestBrowserFrame(callback) {
  return typeof window.requestAnimationFrame === "function"
    ? window.requestAnimationFrame(callback)
    : window.setTimeout(callback, 16);
}

function cancelBrowserFrame(frameId) {
  if (!frameId) return;
  if (typeof window.cancelAnimationFrame === "function") {
    window.cancelAnimationFrame(frameId);
  } else {
    window.clearTimeout(frameId);
  }
}

function getPositiveNumber(value, fallback) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0
    ? numberValue
    : fallback;
}

export default {
  name: "BxTable",
  props: {
    // 表格列配置
    tableColumn: {
      type: Array,
      default: () => [],
    },
    // 表格数据
    displayTableData: {
      type: Array,
      default: () => [],
    },
    // 样式配置
    setStyle: {
      type: Object,
      default: () => ({}),
    },
    // 表格样式
    setTableStyle: {
      type: Object,
      default: () => ({}),
    },
    // 是否显示斑马纹
    striped: {
      type: Boolean,
      default: false,
    },
    // 是否显示操作按钮
    showRowButtons: {
      type: Boolean,
      default: false,
    },
    // 操作按钮列表
    setRowButtons: {
      type: Array,
      default: () => [],
    },
    // 操作按钮样式
    rowButtonBoxStyle: {
      type: Object,
      default: () => ({}),
    },
    // 是否垂直滚动
    isVerticalScroll: {
      type: Boolean,
      default: false,
    },
    // 显示行数限制
    displayRowLimit: {
      type: Number,
      default: 5,
    },
    // 列表配置
    listConfig: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      rowHeight: DEFAULT_ROW_HEIGHT,
      scrollOffset: 0,
      isVerticalScrolling: false,
      verticalScrollPaused: false,
      tableContainerWidth: 0,
    };
  },
  computed: {
    mergeEnabled() {
      const enabled = this.listConfig?.enable_merge_col;
      return [true, 1, "1", "true", "是"].includes(enabled);
    },
    mergeColumnNames() {
      return resolveMergeColumnNames({
        enabled: this.mergeEnabled,
        rule: this.listConfig?.merge_col_rule,
        customColumns: this.listConfig?.custom_merge_col,
        tableColumns: this.tableColumn,
      });
    },
    tableRows() {
      return this.displayTableData.map((data, sourceIndex) => ({
        data,
        sourceIndex,
      }));
    },
    orderedTableRows() {
      return rotateTableRows(this.tableRows, this.scrollOffset);
    },
    mergeCellMap() {
      return buildMergeCellMap(
        this.orderedTableRows,
        this.mergeColumnNames,
        // 合并按接口原始值判断，单位换算和小数格式化只影响显示。
        (tableRow, columnName) => tableRow.data?.[columnName]
      );
    },
    fullyMergedRowIndexes() {
      if (
        !this.mergeEnabled ||
        this.showRowButtons ||
        !this.tableColumn.length
      ) {
        return new Set();
      }
      // rowspan 覆盖全部数据列时 tr 会失去自然高度，提前找出这些逻辑行。
      return getFullyCoveredRowIndexes(
        this.orderedTableRows.length,
        this.tableColumn.map((column) => column.columns),
        this.mergeCellMap
      );
    },
    columnLayout() {
      // 容器宽度是唯一响应式输入，所有列宽均由纯函数派生，表头和表体不会各算一套。
      return buildTableColumnLayout({
        containerWidth: this.tableContainerWidth,
        columns: this.tableColumn,
        showRowButtons: this.showRowButtons,
        rowButtonWidth: this.rowButtonBoxStyle?.width,
      });
    },
    tableSurfaceStyle() {
      const width = `${this.columnLayout.tableWidth}px`;
      return { width, minWidth: width };
    },
    normalizedRowButtonStyle() {
      if (!this.showRowButtons) return {};
      const width = `${this.columnLayout.actionWidth}px`;
      return {
        ...this.rowButtonBoxStyle,
        width,
        minWidth: width,
        maxWidth: width,
      };
    },
    getElementStyle() {
      const config = this.listConfig;
      let style = {};
      if (config["element_style_json"]) {
        style = config["element_style_json"];
      }
      style = formatStyleData(style);
      return style;
    },
    cellOuterStyle() {
      // 背景、边框、padding、高度等视觉样式继续作用于完整 td。
      const style = { ...this.getElementStyle };
      CELL_CONTENT_LAYOUT_STYLE_KEYS.forEach((styleKey) => {
        delete style[styleKey];
      });
      return style;
    },
    cellContentStyle() {
      // display/对齐/gap 等结构样式转移到内容层，防止把 td 改成 flex 后表格塌陷。
      return CELL_CONTENT_LAYOUT_STYLE_KEYS.reduce((style, styleKey) => {
        if (this.getElementStyle[styleKey] !== undefined) {
          style[styleKey] = this.getElementStyle[styleKey];
        }
        return style;
      }, {});
    },
    // 滚动方向
    scrollDirection() {
      return this.listConfig?.animation_direction === "由上至下"
        ? "down"
        : "up";
    },
    verticalScrollConfigSignature() {
      // 只在动画相关配置变化时重启滚动，避免普通 listConfig 编辑造成抖动。
      return JSON.stringify([
        this.listConfig?.animation_interval,
        this.listConfig?.animation_duration,
        this.listConfig?.animation_direction,
      ]);
    },
    mergeConfigSignature() {
      // 合并配置会改变 DOM 行高，单独建立签名以触发测量和必要的滚动重启。
      return JSON.stringify([
        this.listConfig?.enable_merge_col,
        this.listConfig?.merge_col_rule,
        this.listConfig?.custom_merge_col,
      ]);
    },
    tableMeasurementConfigSignature() {
      // 只监听会改变单元格几何尺寸的配置，颜色等变化不需要触发布局读取。
      return JSON.stringify([this.listConfig?.element_style_json]);
    },
  },
  created() {
    this.verticalScrollTimer = null;
    this.verticalScrollFallbackTimer = null;
    this.verticalScrollAnimation = null;
    this.verticalScrollRunId = 0;
    this.tableResizeObserver = null;
    this.tableResizeFrame = null;
    this.tableRowMeasureFrame = null;
    this.verticalScrollRestartFrame = null;
    this.verticalScrollRestartPending = false;
    this.verticalScrollRestartResetOffset = false;
    this.tableHeaderIdPrefix = `bx-table-${this._uid}`;
  },
  methods: {
    measureTableContainer() {
      const tableViewport = this.$refs.tableViewport;
      const containerWidth =
        tableViewport?.clientWidth || this.$el?.clientWidth;
      if (!(containerWidth > 0) || containerWidth === this.tableContainerWidth) {
        return;
      }
      this.tableContainerWidth = containerWidth;
      // 宽度变化可能改变按钮换行，先释放旧统一行高再重新测量自然最大行高。
      this.scheduleRowHeightMeasurement({ reset: true });
    },
    scheduleTableMeasurement() {
      // ResizeObserver 和 window.resize 可能连续触发，用一帧合并多次布局读取。
      if (this.tableResizeFrame) {
        cancelBrowserFrame(this.tableResizeFrame);
      }
      this.tableResizeFrame = requestBrowserFrame(() => {
        this.tableResizeFrame = null;
        this.measureTableContainer();
      });
    },
    observeTableContainer() {
      const tableViewport = this.$refs.tableViewport;
      if (typeof ResizeObserver === "function" && tableViewport) {
        // 监听组件自身而非只监听浏览器窗口，覆盖低代码容器拖拽缩放场景。
        this.tableResizeObserver = new ResizeObserver(
          this.scheduleTableMeasurement
        );
        this.tableResizeObserver.observe(tableViewport);
      }
      window.addEventListener("resize", this.scheduleTableMeasurement);
      this.scheduleTableMeasurement();
    },
    disconnectTableContainerObserver() {
      if (this.tableResizeObserver) {
        this.tableResizeObserver.disconnect();
        this.tableResizeObserver = null;
      }
      window.removeEventListener("resize", this.scheduleTableMeasurement);
      if (this.tableResizeFrame) {
        cancelBrowserFrame(this.tableResizeFrame);
        this.tableResizeFrame = null;
      }
      if (this.tableRowMeasureFrame) {
        cancelBrowserFrame(this.tableRowMeasureFrame);
        this.tableRowMeasureFrame = null;
      }
      if (this.verticalScrollRestartFrame) {
        cancelBrowserFrame(this.verticalScrollRestartFrame);
        this.verticalScrollRestartFrame = null;
      }
    },
    scheduleRowHeightMeasurement({ reset = false } = {}) {
      if (reset) this.rowHeight = DEFAULT_ROW_HEIGHT;
      this.$nextTick(() => {
        if (this._isDestroyed || this._isBeingDestroyed) return;
        if (this.tableRowMeasureFrame) {
          cancelBrowserFrame(this.tableRowMeasureFrame);
        }
        this.tableRowMeasureFrame = requestBrowserFrame(() => {
          this.tableRowMeasureFrame = null;
          this.measureRowHeight();
        });
      });
    },
    measureRowHeight() {
      const rows = Array.from(this.$el.querySelectorAll(".table-row"));
      if (!rows.length) return;

      // 滚动表格统一使用自然最大行高，避免图片、按钮换行或 rowspan 导致视口跳动。
      const measuredRowHeight = rows.reduce((maxHeight, row) => {
        const height =
          row.offsetHeight || row.getBoundingClientRect().height || 0;
        return Math.max(maxHeight, height);
      }, DEFAULT_ROW_HEIGHT);
      this.rowHeight = measuredRowHeight;
    },
    getTableRowStyle(rowIndex) {
      if (this.isVerticalScroll || this.fullyMergedRowIndexes.has(rowIndex)) {
        return { height: `${this.rowHeight}px` };
      }
      return undefined;
    },
    getHeaderCellId(columnIndex, isActionColumn = false) {
      const suffix = isActionColumn ? "action" : `column-${columnIndex}`;
      return `${this.tableHeaderIdPrefix}-${suffix}`;
    },
    getMergeCell(rowIndex, col) {
      return (
        this.mergeCellMap.get(`${rowIndex}:${col.columns}`) ||
        DEFAULT_MERGE_CELL
      );
    },
    // 获取列索引
    getColumnIndex(colName) {
      const cols = this.listConfig?.custom_table_head_cols;
      if (!cols) return -1;
      const colArray = cols.split(",");
      return colArray.indexOf(colName);
    },
    // 构建 srvcol 格式供 UnitUtil 使用
    buildSrvcol(colIndex) {
      const unitAlternates = this.listConfig?.unit_alternates;
      const decimalsNums = this.listConfig?.decimals_nums;

      if (!unitAlternates) return {};

      const unitArray = unitAlternates.split(";");
      const decimalsArray = decimalsNums ? decimalsNums.split(";") : [];

      const colUnitStr = unitArray[colIndex];
      if (!colUnitStr || !colUnitStr.includes("/")) return {};

      // 未配置小数位时不传 decimals_num，UnitUtil 保持原值；显式 0 保留到整数
      const rawDecimals = decimalsArray[colIndex];
      const params_cfg = {
        alternate_units: colUnitStr,
      };
      if (
        rawDecimals !== undefined &&
        rawDecimals !== null &&
        String(rawDecimals).trim() !== ""
      ) {
        params_cfg.decimals_num = rawDecimals;
      }

      return {
        params_cfg,
      };
    },
    // 格式化值
    formatValue(row, col) {
      const colName = col?.columns || col?.column || col?.col_name || col?.name || col?.columnKey;
      let value = row?.[colName];
      if (value === null || value === undefined || value === "") return value;

      const colIndex = this.getColumnIndex(colName || col?.columns);
      if (colIndex >= 0) {
        const srvcol = this.buildSrvcol(colIndex);
        if (srvcol.params_cfg) {
          const result = getAlternateUnitData(value, { srvcol });
          if (result !== null) {
            value = result;
          }
        }
      }

      return applyEncryptParam(row, [colName, col?.columns, col?.column, col?.col_name], value);
    },
    // 获取图片路径
    getImagePath(path) {
      if (!path) return "";
      // 如果是完整的URL，直接返回
      if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
      }
      // 如果是相对路径，需要根据项目配置处理
      // 这里假设有一个全局的图片基础路径配置
      const baseUrl = process.env.VUE_APP_IMAGE_BASE_URL || "";
      return baseUrl + path;
    },
    // 行按钮点击事件
    onRowButtonClick(btn, item) {
      this.$emit("row-button-click", btn, item);
    },
    getVerticalScrollConfig() {
      const intervalSeconds = getPositiveNumber(
        this.listConfig?.animation_interval,
        3
      );
      return {
        interval: Math.max(intervalSeconds * 1000, 2000),
        duration: getPositiveNumber(
          this.listConfig?.animation_duration,
          2000
        ),
      };
    },
    advanceScrollOffset() {
      const rowCount = this.tableRows.length;
      if (rowCount < 2) return;

      const offsetDelta = this.scrollDirection === "down" ? -1 : 1;
      // 只更新数据偏移量；orderedTableRows 和 mergeCellMap 会随之重新计算。
      this.scrollOffset =
        (this.scrollOffset + offsetDelta + rowCount) % rowCount;
    },
    startTableVerticalScroll() {
      this.stopTableVerticalScroll();
      if (!this.isVerticalScroll || this.tableRows.length < 2) return;
      if (document.visibilityState === "hidden") {
        this.verticalScrollPaused = true;
        return;
      }

      this.isVerticalScrolling = true;
      const runId = this.verticalScrollRunId;
      this.$nextTick(() => {
        if (runId === this.verticalScrollRunId) {
          this.performTableVerticalScrollStep(runId);
        }
      });
    },
    performTableVerticalScrollStep(runId) {
      if (
        !this.isVerticalScrolling ||
        runId !== this.verticalScrollRunId ||
        !this.isVerticalScroll
      ) {
        return;
      }

      const tableBody = this.$refs.tableBody;
      const firstRow = tableBody?.querySelector(".table-row");
      const rowHeight =
        firstRow?.offsetHeight || firstRow?.getBoundingClientRect().height || 0;

      if (!tableBody || !rowHeight) {
        this.scheduleNextTableVerticalScroll(runId, 100);
        return;
      }

      this.rowHeight = rowHeight;
      if (this.scrollDirection === "down") {
        // 向下滚动需先把末行轮转到顶部，再从负位移回到 0，避免出现空白帧。
        this.advanceScrollOffset();
        this.$nextTick(() => {
          if (runId !== this.verticalScrollRunId) return;
          const nextFirstRow = tableBody.querySelector(".table-row");
          const nextRowHeight =
            nextFirstRow?.offsetHeight ||
            nextFirstRow?.getBoundingClientRect().height ||
            rowHeight;
          this.runTableVerticalScrollAnimation(
            tableBody,
            -nextRowHeight,
            0,
            runId
          );
        });
        return;
      }

      // 向上滚动先移出当前首行，动画结束后再轮转数据并清除 transform。
      this.runTableVerticalScrollAnimation(
        tableBody,
        0,
        -rowHeight,
        runId,
        () => this.advanceScrollOffset()
      );
    },
    runTableVerticalScrollAnimation(tableBody, fromY, toY, runId, beforeReset) {
      const { duration } = this.getVerticalScrollConfig();
      const complete = () => {
        if (runId !== this.verticalScrollRunId) return;
        if (beforeReset) beforeReset();
        this.$nextTick(() => {
          if (runId !== this.verticalScrollRunId) return;
          this.clearTableBodyAnimation();
          this.scheduleRowHeightMeasurement();
          this.scheduleNextTableVerticalScroll(runId);
        });
      };

      tableBody.style.willChange = "transform";
      if (typeof tableBody.animate === "function") {
        try {
          const animation = tableBody.animate(
            [
              { transform: `translateY(${fromY}px)` },
              { transform: `translateY(${toY}px)` },
            ],
            {
              duration,
              easing: "cubic-bezier(0.55, -0.25, 0.5, 1.1)",
              fill: "forwards",
            }
          );
          this.verticalScrollAnimation = animation;
          if (animation.finished?.then) {
            animation.finished.then(complete).catch(() => {});
          } else {
            // 兼容支持 Web Animations 但没有 finished Promise 的旧 WebView。
            animation.onfinish = complete;
          }
          return;
        } catch (_) {
          this.verticalScrollAnimation = null;
        }
      }

      tableBody.style.transition = "none";
      tableBody.style.transform = `translateY(${fromY}px)`;
      void tableBody.offsetHeight;
      tableBody.style.transition = `transform ${duration}ms cubic-bezier(0.55, -0.25, 0.5, 1.1)`;
      tableBody.style.transform = `translateY(${toY}px)`;
      this.verticalScrollFallbackTimer = setTimeout(complete, duration);
    },
    scheduleNextTableVerticalScroll(runId, customWait) {
      if (!this.isVerticalScrolling || runId !== this.verticalScrollRunId) {
        return;
      }

      const { interval, duration } = this.getVerticalScrollConfig();
      // interval 表示两次动画起点间隔，因此完成后只等待 interval - duration。
      const wait =
        customWait === undefined
          ? Math.max(interval - duration, 0)
          : customWait;
      clearTimeout(this.verticalScrollTimer);
      this.verticalScrollTimer = setTimeout(() => {
        this.performTableVerticalScrollStep(runId);
      }, wait);
    },
    clearTableBodyAnimation() {
      // 所有停止、重启和销毁路径都走同一清理逻辑，防止残留 transform 或定时器。
      if (this.verticalScrollAnimation) {
        try {
          this.verticalScrollAnimation.cancel();
        } catch (_) {}
        this.verticalScrollAnimation = null;
      }
      clearTimeout(this.verticalScrollFallbackTimer);
      this.verticalScrollFallbackTimer = null;

      const tableBody = this.$refs.tableBody;
      if (tableBody) {
        tableBody.style.transition = "";
        tableBody.style.transform = "";
        tableBody.style.willChange = "auto";
      }
    },
    stopTableVerticalScroll({ resetOffset = false } = {}) {
      this.verticalScrollRunId += 1;
      this.isVerticalScrolling = false;
      clearTimeout(this.verticalScrollTimer);
      this.verticalScrollTimer = null;
      this.clearTableBodyAnimation();
      if (resetOffset) this.scrollOffset = 0;
    },
    restartTableVerticalScroll({ resetOffset = false } = {}) {
      this.stopTableVerticalScroll({ resetOffset });
      if (this.isVerticalScroll) {
        this.$nextTick(() => this.startTableVerticalScroll());
      }
    },
    scheduleTableVerticalScrollRestart({ resetOffset = false } = {}) {
      // 同一轮 props/config 更新可能命中多个 watcher，只允许实际重启一次。
      this.verticalScrollRestartResetOffset =
        this.verticalScrollRestartResetOffset || resetOffset;
      if (this.verticalScrollRestartPending) return;

      this.verticalScrollRestartPending = true;
      this.$nextTick(() => {
        if (this._isDestroyed || this._isBeingDestroyed) return;
        this.verticalScrollRestartFrame = requestBrowserFrame(() => {
          this.verticalScrollRestartFrame = null;
          this.verticalScrollRestartPending = false;
          const shouldResetOffset = this.verticalScrollRestartResetOffset;
          this.verticalScrollRestartResetOffset = false;
          this.restartTableVerticalScroll({ resetOffset: shouldResetOffset });
        });
      });
    },
    onDocumentVisibilityChange() {
      if (document.visibilityState === "hidden") {
        this.verticalScrollPaused = this.isVerticalScrolling;
        this.stopTableVerticalScroll();
        return;
      }

      if (this.verticalScrollPaused) {
        this.verticalScrollPaused = false;
        this.startTableVerticalScroll();
      }
    },
  },
  mounted() {
    document.addEventListener(
      "visibilitychange",
      this.onDocumentVisibilityChange
    );
    this.observeTableContainer();
    if (this.isVerticalScroll) {
      this.scheduleRowHeightMeasurement({ reset: true });
      this.scheduleTableVerticalScrollRestart();
    }
  },
  beforeDestroy() {
    this.stopTableVerticalScroll();
    document.removeEventListener(
      "visibilitychange",
      this.onDocumentVisibilityChange
    );
    this.disconnectTableContainerObserver();
  },
  watch: {
    isVerticalScroll: {
      handler(newVal) {
        if (newVal) {
          this.scheduleRowHeightMeasurement({ reset: true });
          this.scheduleTableVerticalScrollRestart();
        } else {
          this.stopTableVerticalScroll({ resetOffset: true });
        }
      },
    },
    displayTableData: {
      handler() {
        this.scheduleRowHeightMeasurement({ reset: true });
        this.scheduleTableVerticalScrollRestart({ resetOffset: true });
      },
    },
    tableColumn: {
      handler() {
        this.scheduleTableMeasurement();
        this.scheduleRowHeightMeasurement({ reset: true });
      },
      deep: true,
    },
    setStyle: {
      handler() {
        this.scheduleRowHeightMeasurement({ reset: true });
      },
      deep: true,
    },
    verticalScrollConfigSignature() {
      this.scheduleTableVerticalScrollRestart();
    },
    mergeConfigSignature() {
      this.scheduleRowHeightMeasurement({ reset: true });
      if (this.isVerticalScroll) this.scheduleTableVerticalScrollRestart();
    },
    tableMeasurementConfigSignature: {
      handler() {
        this.scheduleRowHeightMeasurement({ reset: true });
      },
    },
    rowButtonBoxStyle: {
      handler() {
        this.scheduleTableMeasurement();
        this.scheduleRowHeightMeasurement({ reset: true });
      },
      deep: true,
    },
    setRowButtons: {
      handler() {
        this.scheduleRowHeightMeasurement({ reset: true });
      },
      deep: true,
    },
    showRowButtons() {
      this.scheduleTableMeasurement();
      this.scheduleRowHeightMeasurement({ reset: true });
    },
  },
};
</script>

<style lang="scss" scoped>
.bx-table {
  width: 100%;
  min-width: 0;
  color: var(--cell_color, #fff);
  border-top: 1px solid var(--tbl-border-color);
  border-left: 1px solid var(--tbl-border-color);

  .table-horizontal-scroll {
    // 达到列最小宽度后允许整体横向滚动，不再压缩到不可读。
    width: 100%;
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
  }

  .table-layout {
    min-width: 100%;
  }

  .table-head,
  .table-body {
    width: 100%;
    table-layout: fixed;
    border-collapse: separate;
    border-spacing: 0;
  }

  .table-column {
    // 项目全局样式中同名类会被设置为 table-column，原生 th/td 必须明确恢复为单元格。
    display: table-cell;
    padding: 8px;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    cursor: pointer;
    vertical-align: middle;
    border-right: 1px solid var(--tbl-border-color);
    border-bottom: 1px solid var(--tbl-border-color);
  }

  .table-head {
    color: var(--tbl_head_color);
    background-color: var(--tbl_head_bg, rgba($color: #f0f3f9, $alpha: 0.1));

    .table-column {
      color: var(--tbl_head_color);
      font-weight: normal;
      // background-color: var(--tbl_head_bg, rgba($color: #f0f3f9, $alpha: 0.1));
    }
  }

  .table-row {
    --row-bg: var(--cell_bg, transparent);
    color: var(--cell_color);

    &.stripe {
      --row-bg: var(--cell_bg2, rgba(255, 255, 255, 0.1));
      color: var(--cell_color2);
    }

    .table-column {
      background-color: var(--first-col-bg, var(--row-bg));
    }
  }

  .table-cell-content {
    // flex 子项必须允许收缩，超长中英文才能稳定触发 ellipsis。
    display: flex;
    width: 100%;
    min-width: 0;
    align-items: center;

    span {
      display: block;
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .td-img {
    // 使用确定高度，避免图片加载前后的 100% 高度计算造成行高跳变。
    width: 100%;
    max-width: 120px;
    height: 50px;
    object-fit: cover;
    border-radius: 8px;
  }

  .row-button-box {
    .row-button-content {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      min-width: 0;
      gap: 8px;
    }

    .el-button {
      min-width: 50px;
    }

    .el-button + .el-button {
      margin-left: 0;
    }

    .row-button {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 85px;
      height: 30px;
      padding: 0 12px;
      border-radius: 4px;
      background: linear-gradient(
        151.99deg,
        rgba(0, 122, 255, 1) 29.59%,
        rgba(4, 71, 171, 1) 294.82%
      );
      color: rgba(255, 255, 255, 1);
      font-size: 14px;
    }
  }
}

.scroll-animation {
  .table-body-wrap {
    overflow: hidden;
  }

  .table-body {
    position: relative;
    will-change: transform;

    .table-row {
      transition: opacity 0.3s ease-out;
      opacity: 1;

      &:first-child {
        opacity: 0.8;
      }

      &:nth-child(2) {
        opacity: 0.9;
      }

      &:last-child {
        opacity: 0.8;
      }

      &:nth-last-child(2) {
        opacity: 0.9;
      }

      &:nth-child(n + 3):nth-last-child(n + 3) {
        opacity: 1;
      }
    }
  }
}
</style>
