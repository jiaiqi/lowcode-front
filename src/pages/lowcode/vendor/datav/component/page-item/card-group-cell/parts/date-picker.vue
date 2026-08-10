<template>
  <div class="date-picker-container">
    <el-time-picker
      v-if="partsType === '时间选择器' || partsType === '时间范围选择器'"
      v-model="pickerValue"
      value-format="HH:mm:ss"
      :picker-options="pickerOptions"
      placeholder="选择时间"
      clearable
      style="width: 100%"
      @change="handleChange"
    />
    <el-date-picker
      v-else
      v-model="pickerValue"
      :type="pickerType"
      :value-format="valueFormat"
      :picker-options="pickerOptions"
      :start-placeholder="rangeTypes.includes(partsType) ? '开始日期' : ''"
      :end-placeholder="rangeTypes.includes(partsType) ? '结束日期' : ''"
      :placeholder="placeholder"
      clearable
      style="width: 100%"
      @change="handleChange"
    />
  </div>
</template>

<script>
import dayjs from "dayjs";
import { getDateByKey, getDateKeys } from "@/common/date_util";

const rangeTypes = ["日期范围选择器", "时间范围选择器", "日期时间范围选择器"];

export default {
  name: "date-picker",
  props: {
    partsType: {
      type: String,
      default: "",
      validator(val) {
        return [
          "日期选择器",
          "时间选择器",
          "日期时间选择器",
          "日期范围选择器",
          "时间范围选择器",
          "日期时间范围选择器",
          "月份选择器",
          "年份选择器",
        ].includes(val);
      },
    },
    value: {
      type: [String, Array, Object],
      default: "",
    },
    startDate: {
      type: String,
      default: "1900-01-01",
    },
    endDate: {
      type: String,
      default: "2099-12-31",
    },
    customValueFormat: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      pickerValue: null,
      rangeTypes,
    };
  },
  computed: {
    pickerType() {
      switch (this.partsType) {
        case "日期选择器":
          return "date";
        case "时间选择器":
          return "time";
        case "日期时间选择器":
          return "datetime";
        case "日期范围选择器":
          return "daterange";
        case "时间范围选择器":
          return "timerange";
        case "日期时间范围选择器":
          return "datetimerange";
        case "月份选择器":
          return "month";
        case "年份选择器":
          return "year";
        default:
          return "date";
      }
    },
    valueFormat() {
      if (this.customValueFormat) return this.customValueFormat.replace(/Y/g, "y").replace(/D/g, "d");
      switch (this.partsType) {
        case "日期选择器":
          return "yyyy-MM-dd";
        case "时间选择器":
          return "HH:mm:ss";
        case "日期时间选择器":
          return "yyyy-MM-dd HH:mm:ss";
        case "日期范围选择器":
          return "yyyy-MM-dd";
        case "日期时间范围选择器":
          return "yyyy-MM-dd HH:mm:ss";
        case "月份选择器":
          return "yyyy-MM-01";
        case "年份选择器":
          return "yyyy-01-01";
        default:
          return "yyyy-MM-dd";
      }
    },
    placeholder() {
      if (this.rangeTypes.includes(this.partsType)) return "";
      const map = {
        月份选择器: "选择月份",
        年份选择器: "选择年份",
      };
      return map[this.partsType] || "选择日期";
    },
    pickerOptions() {
      try {
        const options = {};
        // 设置禁用日期范围
        if (this.startDate || this.endDate) {
          const precision = this.partsType === '年份选择器' ? 'year' : this.partsType === '月份选择器' ? 'month' : 'day';
          options.disabledDate = (time) => {
            const current = dayjs(time);
            const start = this.startDate ? dayjs(this.startDate) : null;
            const end = this.endDate ? dayjs(this.endDate) : null;

            if (start && end) {
              return (
                current.isBefore(start, precision) || current.isAfter(end, precision)
              );
            } else if (start) {
              return current.isBefore(start, precision);
            } else if (end) {
              return current.isAfter(end, precision);
            }
            return false;
          };
        }

        return options;
      } catch (error) {
        console.warn("Error creating picker options:", error);
        return {};
      }
    },
  },
  watch: {
    value: {
      handler(newVal) {
        if (newVal) {
          try {
            // 处理日期关键字
            let newValDateStr = newVal;

            // 使用导入的工具函数处理日期关键字
            if (typeof newVal === "string") {
              const dateKeys = getDateKeys();
              if (Array.isArray(dateKeys) && dateKeys.includes(newVal)) {
                newValDateStr = getDateByKey(
                  newVal,
                  rangeTypes.includes(this.partsType),
                );
              }
            }

            // 避免不必要的更新
            if (
              JSON.stringify(newValDateStr) !== JSON.stringify(this.pickerValue)
            ) {
              this.pickerValue = newValDateStr;
            }

            // 如果日期关键字被转换了,通知父组件
            if (JSON.stringify(newValDateStr) !== JSON.stringify(newVal)) {
              this.$nextTick(() => {
                this.handleChange(newValDateStr);
              });
            }
          } catch (error) {
            console.warn("Error processing date value:", error);
          }
        } else {
          this.pickerValue = null;
        }
      },
      immediate: true,
    },
  },
  methods: {
    handleChange(e) {
      try {
        this.$emit("update:value", e);
        this.$emit("change", e);
      } catch (error) {
        console.warn("Error emitting date change event:", error);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.date-picker-container {
  width: 100%;

  ::v-deep .el-date-editor {
    width: 100%;
  }

  ::v-deep .el-range-editor {
    width: 100%;
    
  }

  ::v-deep .el-input__inner{
    background-color: transparent;
    border-color: transparent;
  }
}
</style>
