<template>
  <div
    class="date-filter"
    v-if="showDateFilter"
  >
    <div class="date-filter-content">
      <!-- 筛选类型选择 -->
      <el-radio-group
        v-model="dateFilterType"
        @change="onDateFilterTypeChange"
        size="small"
      >
        <el-radio-button
          :label="type"
          v-for="type in dateFilterTypes"
          :key="type"
        >{{ type }}</el-radio-button>
      </el-radio-group>

      <!-- 日期选择器 -->
      <el-date-picker
        v-model="selectedDate"
        :type="datePickerType"
        :placeholder="datePickerPlaceholder"
        :format="dateFormatStr"
        :value-format="dateValueFormat"
        @change="onDateChange"
        size="small"
        style="margin-left: 10px; width: 150px;"
      />

      <!-- 操作按钮 -->
      <div class="filter-buttons">
        <el-button
          type="primary"
          size="small"
          @click="applyDateFilter"
        >筛选</el-button>
        <el-button
          size="small"
          @click="resetDateFilter"
        >重置</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import dayjs from 'dayjs'

export default {
  name: 'DateFilter',
  props: {
    //日期筛选配置
    filterConfig: {
      type: Object,
      default: () => ({})
    },
    // 日期字段配置
    dateColumn: {
      type: String,
      default: ''
    }
  },
  emits: ['filter-change', 'filter-reset'],
  data() {
    return {
      dateFilterType: '按日', // 筛选类型：按日, 按月, 按年
      selectedDate: null, // 选中的日期
      isFilterApplied: false // 是否已应用筛选
    }
  },
  computed: {
    dateFilterTypes() {
      return this.filterConfig?.date_select_opt?.split(',') || ['按日', '按月', '按年']
    },
    // 是否显示日期筛选
    showDateFilter() {
      return this.dateColumn && this.dateColumn.trim() !== ''
    },
    // 日期选择器类型
    datePickerType() {
      const typeMap = {
        '按日': 'date',
        '按月': 'month',
        '按年': 'year'
      }
      return typeMap[this.dateFilterType] || 'date'
    },
    // 日期选择器占位符
    datePickerPlaceholder() {
      const placeholderMap = {
        day: '选择日期',
        month: '选择月份',
        year: '选择年份'
      }
      return placeholderMap[this.dateFilterType] || '选择日期'
    },
    // 日期显示格式
    dateFormatStr() {
      const formatMap = {
        day: 'yyyy-MM-dd',
        month: 'yyyy-MM',
        year: 'yyyy'
      }
      return formatMap[this.datePickerType] || 'yyyy-MM-dd'
    },
    // 日期值格式
    dateValueFormat() {
      const formatMap = {
        day: 'yyyy-MM-dd',
        month: 'yyyy-MM',
        year: 'yyyy'
      }
      return formatMap[this.datePickerType] || 'yyyy-MM-dd'
    }
  },
  mounted() {
    // 默认设置为当天
    if (this.showDateFilter) {
      this.selectedDate = dayjs().format(this.dateValueFormat.toLocaleUpperCase())
    }
  },
  watch: {
    dateFilterType() {
      // 切换筛选类型时重新设置默认日期
      this.selectedDate = dayjs().format(this.dateValueFormat.toLocaleUpperCase())
      this.isFilterApplied = false
      this.applyDateFilter()
    },
    dateColumn() {
      // 日期字段变化时重置筛选
      this.resetDateFilter()
    }
  },
  methods: {
    // 筛选类型改变
    onDateFilterTypeChange() {
      this.isFilterApplied = false
    },
    // 日期改变
    onDateChange() {
      this.isFilterApplied = false
    },
    // 应用日期筛选
    applyDateFilter() {
      if (!this.selectedDate) {
        this.$message.warning('请选择日期')
        return
      }

      const filterParams = this.buildFilterParams()
      this.isFilterApplied = true

      // 触发筛选事件
      this.$emit('filter-change', filterParams)
    },
    // 重置日期筛选
    resetDateFilter() {
      this.dateFilterType = 'day'
      this.selectedDate = dayjs().format(this.dateValueFormat.toLocaleUpperCase())
      this.isFilterApplied = false

      // 触发重置事件
      this.$emit('filter-reset')
    },
    // 构建筛选参数
    buildFilterParams() {
      if (!this.selectedDate || !this.dateColumn) {
        return null
      }

      const date = dayjs(this.selectedDate)
      let startDate, endDate

      switch (this.dateFilterType) {
        case 'day':
          startDate = date.format('YYYY-MM-DD')
          endDate = date.format('YYYY-MM-DD')
          break
        case 'month':
          startDate = date.startOf('month').format('YYYY-MM-DD')
          endDate = date.endOf('month').format('YYYY-MM-DD')
          break
        case 'year':
          startDate = date.startOf('year').format('YYYY-MM-DD')
          endDate = date.endOf('year').format('YYYY-MM-DD')
          break
        default:
          startDate = date.format('YYYY-MM-DD')
          endDate = date.format('YYYY-MM-DD')
      }

      return {
        type: this.dateFilterType,
        dateColumn: this.dateColumn,
        startDate,
        endDate,
        selectedDate: this.selectedDate
      }
    },
    // 获取当前筛选状态
    getFilterStatus() {
      return {
        isApplied: this.isFilterApplied,
        params: this.isFilterApplied ? this.buildFilterParams() : null
      }
    }
  }
}
</script>

<style lang="scss">
.date-filter {
  padding: 12px 16px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  margin-bottom: 16px;
}

.date-filter-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.date-filter-content label{
  margin-bottom: 0;
}

.filter-buttons {
  display: flex;
  gap: 8px;
  flex: 1;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .date-filter-content {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-buttons {
    margin-left: 0;
    justify-content: flex-end;
  }
}
</style>