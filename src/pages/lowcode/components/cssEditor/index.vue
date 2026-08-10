<template>
  <div class="style-editor">
    <!-- 布局设置 -->
    <div class="section">
      <div class="section-title">
        <i class="el-icon-s-grid"></i>
        布局
      </div>
      <div class="layout-types">
        <div 
          v-for="layout in layoutTypes" 
          :key="layout.value"
          :class="['layout-item', { active: styleData.display === layout.value }]"
          @click="updateStyle('display', layout.value)"
        >
          <i :class="layout.icon"></i>
          <span>{{ layout.label }}</span>
        </div>
      </div>
      
      <!-- 弹性布局配置 -->
      <div v-if="styleData.display === 'flex'" class="flex-config">
        <div class="config-row">
          <label>方向:</label>
          <el-select v-model="styleData.flexDirection" size="small" @change="updateFlexStyle">
            <el-option label="行" value="row"></el-option>
            <el-option label="列" value="column"></el-option>
            <el-option label="行反向" value="row-reverse"></el-option>
            <el-option label="列反向" value="column-reverse"></el-option>
          </el-select>
        </div>
        <div class="config-row">
          <label>主轴对齐:</label>
          <div class="align-buttons">
            <button 
              v-for="item in justifyContentOptions" 
              :key="item.value"
              :class="['align-btn', { active: styleData.justifyContent === item.value }]"
              @click="updateStyle('justifyContent', item.value)"
              type="button"
            >
              <i :class="item.icon"></i>
            </button>
          </div>
        </div>
        <div class="config-row">
          <label>交叉轴对齐:</label>
          <div class="align-buttons">
            <button 
              v-for="item in alignItemsOptions" 
              :key="item.value"
              :class="['align-btn', { active: styleData.alignItems === item.value }]"
              @click="updateStyle('alignItems', item.value)"
            >
              <i :class="item.icon"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- 网格布局配置 -->
      <div v-if="styleData.display === 'grid'" class="grid-config">
        <div class="config-row">
          <label>列数:</label>
          <el-input-number 
            v-model="gridColumns" 
            :min="1" 
            :max="12" 
            size="small"
            @change="updateGridColumns"
          ></el-input-number>
        </div>
        <div class="config-row">
          <label>行数:</label>
          <el-input-number 
            v-model="gridRows" 
            :min="1" 
            :max="12" 
            size="small"
            @change="updateGridRows"
          ></el-input-number>
        </div>
        <div class="config-row">
          <label>间距:</label>
          <el-slider 
            v-model="gridGap" 
            :min="0" 
            :max="50"
            @change="updateGridGap"
          ></el-slider>
        </div>
      </div>
    </div>

    <!-- 内外边距 -->
    <div class="section">
      <div class="section-title">
        <i class="el-icon-crop"></i>
        边距
      </div>
      
      <!-- 外边距 -->
      <div class="margin-padding-editor">
        <div class="editor-title">外边距 (Margin)</div>
        <div class="spacing-visual">
          <div class="margin-box">
            <input 
              v-model.number="margins.top" 
              class="spacing-input top"
              placeholder="0"
              @input="updateMargin"
            >
            <input 
              v-model.number="margins.right" 
              class="spacing-input right"
              placeholder="0"
              @input="updateMargin"
            >
            <input 
              v-model.number="margins.bottom" 
              class="spacing-input bottom"
              placeholder="0"
              @input="updateMargin"
            >
            <input 
              v-model.number="margins.left" 
              class="spacing-input left"
              placeholder="0"
              @input="updateMargin"
            >
            
            <!-- 内边距区域 -->
            <div class="padding-box">
              <div class="editor-title small">内边距 (Padding)</div>
              <input 
                v-model.number="paddings.top" 
                class="spacing-input top"
                placeholder="0"
                @input="updatePadding"
              >
              <input 
                v-model.number="paddings.right" 
                class="spacing-input right"
                placeholder="0"
                @input="updatePadding"
              >
              <input 
                v-model.number="paddings.bottom" 
                class="spacing-input bottom"
                placeholder="0"
                @input="updatePadding"
              >
              <input 
                v-model.number="paddings.left" 
                class="spacing-input left"
                placeholder="0"
                @input="updatePadding"
              >
              <div class="content-box">内容</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 边框设置 -->
    <div class="section">
      <div class="section-title">
        <i class="el-icon-picture-outline-round"></i>
        边框
      </div>
      <div class="border-config">
        <div class="config-row">
          <label>样式:</label>
          <el-select v-model="styleData.borderStyle" size="small" @change="updateBorderStyle">
            <el-option label="无" value="none"></el-option>
            <el-option label="实线" value="solid"></el-option>
            <el-option label="虚线" value="dashed"></el-option>
            <el-option label="点线" value="dotted"></el-option>
            <el-option label="双线" value="double"></el-option>
          </el-select>
        </div>
        <div v-if="styleData.borderStyle !== 'none'" class="config-row">
          <label>宽度:</label>
          <el-slider 
            v-model="borderWidth" 
            :min="1" 
            :max="20"
            @change="updateBorderWidth"
          ></el-slider>
        </div>
        <div v-if="styleData.borderStyle !== 'none'" class="config-row">
          <label>颜色:</label>
          <el-color-picker 
            v-model="styleData.borderColor" 
            @change="updateBorderColor"
          ></el-color-picker>
        </div>
      </div>
    </div>

    <!-- 圆角设置 -->
    <div class="section">
      <div class="section-title">
        <i class="el-icon-share"></i>
        圆角
      </div>
      <div class="border-radius-config">
        <div class="radius-visual">
          <div class="radius-box">
            <input 
              v-model.number="borderRadius.topLeft" 
              class="radius-input top-left"
              placeholder="0"
              @input="updateBorderRadius"
            >
            <input 
              v-model.number="borderRadius.topRight" 
              class="radius-input top-right"
              placeholder="0"
              @input="updateBorderRadius"
            >
            <input 
              v-model.number="borderRadius.bottomLeft" 
              class="radius-input bottom-left"
              placeholder="0"
              @input="updateBorderRadius"
            >
            <input 
              v-model.number="borderRadius.bottomRight" 
              class="radius-input bottom-right"
              placeholder="0"
              @input="updateBorderRadius"
            >
            <div class="radius-preview"></div>
          </div>
        </div>
        <div class="config-row">
          <label>统一圆角:</label>
          <el-slider 
            v-model="uniformRadius" 
            :min="0" 
            :max="50"
            @change="updateUniformRadius"
          ></el-slider>
        </div>
      </div>
    </div>

    <!-- 其他样式 -->
    <div class="section">
      <div class="section-title">
        <i class="el-icon-setting"></i>
        其他样式
      </div>
      <div class="other-styles">
        <div class="config-row">
          <label>背景色:</label>
          <el-color-picker 
            v-model="styleData.backgroundColor" 
            @change="updateBackgroundColor"
          ></el-color-picker>
        </div>
        <div class="config-row">
          <label>透明度:</label>
          <el-slider 
            v-model="opacity" 
            :min="0" 
            :max="100"
            @change="updateOpacity"
          ></el-slider>
        </div>
        <div class="config-row">
          <label>阴影:</label>
          <el-select v-model="shadowType" size="small" @change="updateShadow">
            <el-option label="无" value="none"></el-option>
            <el-option label="轻微" value="light"></el-option>
            <el-option label="中等" value="medium"></el-option>
            <el-option label="重" value="heavy"></el-option>
          </el-select>
        </div>
        <div class="config-row">
          <label>溢出:</label>
          <el-select v-model="styleData.overflow" size="small" @change="updateOverflow">
            <el-option label="可见" value="visible"></el-option>
            <el-option label="隐藏" value="hidden"></el-option>
            <el-option label="滚动" value="scroll"></el-option>
            <el-option label="自动" value="auto"></el-option>
          </el-select>
        </div>
      </div>
    </div>

    <!-- 预览区域 -->
    <div class="section">
      <div class="section-title">
        <i class="el-icon-view"></i>
        预览
      </div>
      <div class="preview-area">
        <div :style="computedStyle" class="preview-element">
          预览元素
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue'

// Props
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'change'])

// 样式数据
const styleData = reactive({
  display: 'block',
  flexDirection: 'row',
  justifyContent: 'flex-start',
  alignItems: 'stretch',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gridTemplateRows: 'repeat(2, 1fr)',
  gap: '10px',
  borderStyle: 'none',
  borderColor: '#dcdfe6',
  backgroundColor: '',
  overflow: 'visible',
  ...props.modelValue
})

// 布局类型
const layoutTypes = [
  { value: 'block', label: '块', icon: 'el-icon-minus' },
  { value: 'inline', label: '内联', icon: 'el-icon-more' },
  { value: 'inline-block', label: '内联块', icon: 'el-icon-grid' },
  { value: 'flex', label: '弹性', icon: 'el-icon-s-unfold' },
  { value: 'grid', label: '网格', icon: 'el-icon-menu' }
]

// 对齐选项
const justifyContentOptions = [
  { value: 'flex-start', icon: 'el-icon-back' },
  { value: 'center', icon: 'el-icon-remove' },
  { value: 'flex-end', icon: 'el-icon-right' },
  { value: 'space-between', icon: 'el-icon-sort' },
  { value: 'space-around', icon: 'el-icon-position' }
]

const alignItemsOptions = [
  { value: 'flex-start', icon: 'el-icon-top' },
  { value: 'center', icon: 'el-icon-remove' },
  { value: 'flex-end', icon: 'el-icon-bottom' },
  { value: 'stretch', icon: 'el-icon-rank' }
]

// 边距数据
const margins = reactive({ top: 0, right: 0, bottom: 0, left: 0 })
const paddings = reactive({ top: 0, right: 0, bottom: 0, left: 0 })

// 边框数据
const borderWidth = ref(1)
const borderRadius = reactive({ topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 })
const uniformRadius = ref(0)

// 网格数据
const gridColumns = ref(2)
const gridRows = ref(2)
const gridGap = ref(10)

// 其他样式数据
const opacity = ref(100)
const shadowType = ref('none')

// 计算样式
const computedStyle = computed(() => {
  const styles = { ...styleData }
  
  // 边距
  styles.margin = `${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px`
  styles.padding = `${paddings.top}px ${paddings.right}px ${paddings.bottom}px ${paddings.left}px`
  
  // 边框
  if (styleData.borderStyle !== 'none') {
    styles.border = `${borderWidth.value}px ${styleData.borderStyle} ${styleData.borderColor}`
  }
  
  // 圆角
  styles.borderRadius = `${borderRadius.topLeft}px ${borderRadius.topRight}px ${borderRadius.bottomRight}px ${borderRadius.bottomLeft}px`
  
  // 透明度
  styles.opacity = opacity.value / 100
  
  // 阴影
  if (shadowType.value !== 'none') {
    const shadows = {
      light: '0 2px 4px rgba(0,0,0,0.1)',
      medium: '0 4px 8px rgba(0,0,0,0.15)',
      heavy: '0 8px 16px rgba(0,0,0,0.2)'
    }
    styles.boxShadow = shadows[shadowType.value]
  }
  
  return styles
})

// 方法
const updateStyle = (key, value) => {
  styleData[key] = value
  emitChange()
}

const updateFlexStyle = () => {
  emitChange()
}

const updateMargin = () => {
  emitChange()
}

const updatePadding = () => {
  emitChange()
}

const updateBorderStyle = () => {
  emitChange()
}

const updateBorderWidth = () => {
  emitChange()
}

const updateBorderColor = () => {
  emitChange()
}

const updateBorderRadius = () => {
  emitChange()
}

const updateUniformRadius = (value) => {
  borderRadius.topLeft = value
  borderRadius.topRight = value
  borderRadius.bottomLeft = value
  borderRadius.bottomRight = value
  emitChange()
}

const updateGridColumns = (value) => {
  styleData.gridTemplateColumns = `repeat(${value}, 1fr)`
  emitChange()
}

const updateGridRows = (value) => {
  styleData.gridTemplateRows = `repeat(${value}, 1fr)`
  emitChange()
}

const updateGridGap = (value) => {
  styleData.gap = `${value}px`
  emitChange()
}

const updateBackgroundColor = () => {
  emitChange()
}

const updateOpacity = () => {
  emitChange()
}

const updateShadow = () => {
  emitChange()
}

const updateOverflow = () => {
  emitChange()
}

const emitChange = () => {
  const result = { ...computedStyle.value }
  emit('update:modelValue', result)
  emit('change', result)
}

// 监听props变化
watch(() => props.modelValue, (newVal) => {
  Object.assign(styleData, newVal)
}, { deep: true })
</script>

<style scoped>
.style-editor {
  width: 320px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  overflow: hidden;
}

.section {
  border-bottom: 1px solid #f0f0f0;
  padding: 16px;
}

.section:last-child {
  border-bottom: none;
}

.section-title {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  margin-bottom: 12px;
}

.section-title i {
  margin-right: 6px;
  color: #409eff;
}

/* 布局样式 */
.layout-types {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.layout-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
}

.layout-item:hover {
  border-color: #409eff;
  background: #f0f8ff;
}

.layout-item.active {
  border-color: #409eff;
  background: #409eff;
  color: white;
}

.layout-item i {
  font-size: 16px;
  margin-bottom: 4px;
}

/* 弹性和网格配置 */
.flex-config, .grid-config {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.config-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
}

.config-row label {
  width: 60px;
  color: #606266;
  flex-shrink: 0;
}

.align-buttons {
  display: flex;
  gap: 4px;
}

.align-btn {
  width: 28px;
  height: 28px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.align-btn:hover {
  border-color: #409eff;
}

.align-btn.active {
  border-color: #409eff;
  background: #409eff;
  color: white;
}

/* 边距编辑器 */
.margin-padding-editor {
  margin-top: 8px;
}

.editor-title {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
  text-align: center;
}

.editor-title.small {
  font-size: 10px;
  margin-bottom: 4px;
}

.spacing-visual {
  display: flex;
  justify-content: center;
}

.margin-box {
  position: relative;
  background: #f8f9fa;
  border: 2px dashed #e4e7ed;
  border-radius: 6px;
  padding: 24px;
  width: 180px;
  height: 120px;
}

.padding-box {
  position: relative;
  background: #e8f4fd;
  border: 2px dashed #409eff;
  border-radius: 4px;
  padding: 16px;
  width: 100%;
  height: 100%;
}

.content-box {
  background: #67c23a;
  color: white;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 10px;
}

.spacing-input {
  position: absolute;
  width: 32px;
  height: 20px;
  border: 1px solid #ddd;
  border-radius: 3px;
  text-align: center;
  font-size: 10px;
  background: white;
}

.margin-box > .spacing-input.top { top: 2px; left: 50%; transform: translateX(-50%); }
.margin-box > .spacing-input.right { right: 2px; top: 50%; transform: translateY(-50%); }
.margin-box > .spacing-input.bottom { bottom: 2px; left: 50%; transform: translateX(-50%); }
.margin-box > .spacing-input.left { left: 2px; top: 50%; transform: translateY(-50%); }

.padding-box > .spacing-input.top { top: -10px; left: 50%; transform: translateX(-50%); }
.padding-box > .spacing-input.right { right: -16px; top: 50%; transform: translateY(-50%); }
.padding-box > .spacing-input.bottom { bottom: -10px; left: 50%; transform: translateX(-50%); }
.padding-box > .spacing-input.left { left: -16px; top: 50%; transform: translateY(-50%); }

/* 圆角配置 */
.border-radius-config {
  margin-top: 8px;
}

.radius-visual {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.radius-box {
  position: relative;
  width: 120px;
  height: 80px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
}

.radius-preview {
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  bottom: 8px;
  background: linear-gradient(135deg, #409eff, #67c23a);
  transition: border-radius 0.3s ease;
}

.radius-input {
  position: absolute;
  width: 24px;
  height: 16px;
  border: 1px solid #ddd;
  border-radius: 2px;
  text-align: center;
  font-size: 9px;
  background: white;
}

.radius-input.top-left { top: -8px; left: -8px; }
.radius-input.top-right { top: -8px; right: -8px; }
.radius-input.bottom-left { bottom: -8px; left: -8px; }
.radius-input.bottom-right { bottom: -8px; right: -8px; }

/* 预览区域 */
.preview-area {
  margin-top: 8px;
}

.preview-element {
  width: 100%;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f8ff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
  transition: all 0.3s ease;
}

/* Element UI 样式覆盖 */
.el-select, .el-input-number {
  width: 100%;
}

.el-slider {
  margin: 0 8px;
}

.el-color-picker {
  margin-left: auto;
}

/* 响应式动画 */
* {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.spacing-input:focus,
.radius-input:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  outline: none;
}
</style>