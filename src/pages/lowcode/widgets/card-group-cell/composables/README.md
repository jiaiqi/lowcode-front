# 卡片单元格组合式函数

本目录包含了卡片单元格组件的组合式函数，用于提高代码的可维护性和复用性。

## 文件结构

```
composables/
├── index.js                 # 统一导出文件
├── useAccordionAutoPlay.js  # 手风琴自动轮播功能
├── useStyleBuilder.js       # 样式构建功能
├── useEventHandlers.js      # 事件处理功能
└── README.md               # 说明文档
```

## 组合式函数说明

### useAccordionAutoPlay

**功能**: 处理手风琴自动轮播相关逻辑

**返回值**:
- `activeAccordionSeq`: 当前激活的手风琴序号
- `isAccordionMode`: 是否为手风琴模式
- `accordionAutoPlay`: 是否启用自动轮播
- `changeActiveAccordionSeq`: 切换激活序号的防抖函数
- `startAutoPlay/stopAutoPlay`: 启动/停止自动轮播
- `pauseAutoPlay/resumeAutoPlay`: 暂停/恢复自动轮播

**特性**:
- 自动管理定时器生命周期
- 支持鼠标悬停暂停
- 防抖处理用户交互
- 错误处理和边界检查

### useStyleBuilder

**功能**: 处理样式构建相关逻辑

**返回值**:
- `buildColStyleJson`: 构建列样式的核心函数
- `buildDynamicClasses`: 构建动态类名
- `buildDynamicStyles`: 构建动态样式
- `getImagePath`: 图片路径处理

**特性**:
- 支持背景图片处理
- 动态类名和样式计算
- 错误处理和降级

### useEventHandlers

**功能**: 处理事件相关逻辑

**返回值**:
- `onClickCell`: 单元格点击处理
- `showDialog`: 对话框显示处理
- `handleKeyboardNavigation`: 键盘导航处理
- `handleMouseEnter/Leave`: 鼠标进入/离开处理
- `handleAccordionItem*`: 手风琴项交互处理

**特性**:
- 完整的键盘导航支持
- 无障碍访问优化
- 事件委托和优化

## 使用方式

### 基础使用

```javascript
import { useCardCell } from './composables'

// 在组件中使用
const {
  activeAccordionSeq,
  isAccordionMode,
  onClickCell,
  buildDynamicClasses,
  // ... 其他功能
} = useCardCell(props, emit)
```

### 单独使用某个功能

```javascript
import { useAccordionAutoPlay } from './composables/useAccordionAutoPlay'

// 只使用手风琴功能
const accordionControls = useAccordionAutoPlay(props)
```

### 自定义组合

```javascript
import { 
  useAccordionAutoPlay, 
  useStyleBuilder 
} from './composables'

// 自定义组合多个功能
const accordion = useAccordionAutoPlay(props)
const styles = useStyleBuilder()
```

## 设计原则

1. **单一职责**: 每个组合式函数专注于一个特定功能领域
2. **可组合性**: 函数可以独立使用或组合使用
3. **类型安全**: 提供完整的参数和返回值类型定义
4. **错误处理**: 内置错误处理和边界检查
5. **性能优化**: 使用防抖、节流等技术优化性能
6. **可测试性**: 纯函数设计，便于单元测试

## 迁移指南

### 从原组件迁移

1. **替换导入**: 将原有的 Vue API 导入替换为组合式函数导入
2. **重构逻辑**: 将分散的逻辑代码移动到对应的组合式函数中
3. **更新模板**: 使用新的计算属性和方法
4. **测试验证**: 确保功能正常且性能优化

### 注意事项

- 确保 props 结构与组合式函数期望的一致
- 检查事件名称和参数是否匹配
- 验证样式构建逻辑是否符合预期
- 测试自动轮播和键盘导航功能

## 扩展建议

1. **添加 TypeScript 支持**: 为更好的类型安全
2. **单元测试**: 为每个组合式函数编写测试
3. **文档完善**: 添加 JSDoc 注释
4. **性能监控**: 添加性能指标收集
5. **国际化支持**: 支持多语言配置