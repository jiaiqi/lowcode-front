# 单例右键菜单系统

这是一个基于单例模式的全局右键菜单系统，提供了统一的右键菜单管理和使用方式。

## 特性

- **单例模式**: 全局只有一个右键菜单实例，避免多个菜单同时显示
- **自定义指令**: 提供 `v-context-menu` 指令，简化使用
- **编程式调用**: 支持通过 JavaScript 代码直接调用
- **位置自适应**: 自动调整菜单位置，防止超出屏幕边界
- **事件管理**: 统一的全局事件监听和清理
- **自定义挂载**: 支持自定义挂载到指定的DOM元素
- **TypeScript 友好**: 提供完整的类型定义

## 安装和注册

### 1. 在 main.js 中注册指令

```javascript
import Vue from 'vue';
import { registerDirectives } from '@/directives';

// 注册所有自定义指令
registerDirectives();

new Vue({
  // ...
});
```

### 2. 或者单独注册右键菜单指令

```javascript
import Vue from 'vue';
import contextMenuDirective from '@/directives/context-menu';

Vue.directive('context-menu', contextMenuDirective);
```

## 使用方式

### 方式一: 使用自定义指令 (推荐)

```vue
<template>
  <div v-context-menu="menuConfig">
    右键点击这里
  </div>
</template>

<script>
export default {
  computed: {
    menuConfig() {
      return {
        menuItems: [
          {
            label: '复制',
            icon: 'ri:file-copy-2-fill',
            action: 'copy',
            shortcut: 'Ctrl+C'
          },
          {
            label: '粘贴',
            icon: 'ri:file-copy-2-line',
            action: 'paste',
            shortcut: 'Ctrl+V',
            disabled: false
          },
          { divider: true }, // 分割线
          {
            label: '删除',
            icon: 'ri:delete-bin-line',
            action: 'delete',
            shortcut: 'Delete'
          }
        ],
        onItemClick: this.handleMenuClick,
        context: { id: 1, type: 'item' }, // 传递给回调的上下文数据
        disabled: false, // 是否禁用右键菜单
        beforeShow: (event, context) => {
          // 菜单显示前的回调，返回 false 可阻止显示
          console.log('菜单即将显示', context);
          return true;
        }
      };
    }
  },
  methods: {
    handleMenuClick(item, context, event, el) {
      console.log('菜单项点击:', item.action, context);
      
      switch (item.action) {
        case 'copy':
          // 处理复制逻辑
          break;
        case 'paste':
          // 处理粘贴逻辑
          break;
        case 'delete':
          // 处理删除逻辑
          break;
      }
    }
  }
};
</script>
```

### 方式二: 编程式调用

```vue
<template>
  <div @contextmenu="showMenu">
    右键点击这里
  </div>
</template>

<script>
import { showContextMenu, hideContextMenu } from '@/directives/context-menu';

export default {
  methods: {
    showMenu(event) {
      event.preventDefault();
      
      showContextMenu({
        x: event.clientX,
        y: event.clientY,
        menuItems: [
          {
            label: '选项1',
            icon: 'ri:star-line',
            action: 'option1'
          },
          {
            label: '选项2',
            icon: 'ri:heart-line',
            action: 'option2'
          }
        ],
        onItemClick: (item, context) => {
          console.log('点击了:', item.label);
        },
        context: { data: 'some data' }
      });
    },
    
    hideMenu() {
      hideContextMenu();
    }
  }
};
</script>
```

## 配置选项

### 指令配置对象

```typescript
interface ContextMenuConfig {
  menuItems: MenuItem[];           // 菜单项数组
  onItemClick?: Function;          // 菜单项点击回调
  context?: any;                   // 传递给回调的上下文数据
  disabled?: boolean;              // 是否禁用右键菜单
  beforeShow?: Function;           // 菜单显示前的回调
  mountElement?: HTMLElement;      // 自定义挂载元素，默认为 document.body
}
```

### 菜单项配置

```typescript
interface MenuItem {
  label?: string;                  // 菜单项文本
  icon?: string;                   // 图标 (Iconify 图标名)
  action?: string;                 // 操作标识
  shortcut?: string;               // 快捷键显示文本
  disabled?: boolean;              // 是否禁用
  divider?: boolean;               // 是否为分割线
}
```

### 回调函数参数

```typescript
// 菜单项点击回调
function onItemClick(
  item: MenuItem,      // 被点击的菜单项
  context: any,        // 上下文数据
  event: MouseEvent,   // 原始右键事件
  el: HTMLElement      // 触发右键的元素
): void;

// 显示前回调
function beforeShow(
  event: MouseEvent,   // 原始右键事件
  context: any         // 上下文数据
): boolean;            // 返回 false 阻止显示
```

## 高级用法

### 动态菜单项

```vue
<script>
export default {
  data() {
    return {
      selectedItems: []
    };
  },
  computed: {
    menuConfig() {
      const baseItems = [
        { label: '复制', action: 'copy', icon: 'ri:file-copy-2-fill' }
      ];
      
      // 根据选中状态动态添加菜单项
      if (this.selectedItems.length > 0) {
        baseItems.push(
          { divider: true },
          { label: '批量删除', action: 'batchDelete', icon: 'ri:delete-bin-line' }
        );
      }
      
      return {
        menuItems: baseItems,
        onItemClick: this.handleMenuClick,
        context: { selectedItems: this.selectedItems }
      };
    }
  }
};
</script>
```

### 条件显示菜单

```vue
<script>
export default {
  computed: {
    menuConfig() {
      return {
        menuItems: this.getMenuItems(),
        onItemClick: this.handleMenuClick,
        beforeShow: (event, context) => {
          // 只在特定条件下显示菜单
          return this.hasPermission('contextMenu');
        }
      };
    }
  }
};
</script>
```

### 自定义挂载元素

```vue
<template>
  <div class="container" ref="container">
    <div v-context-menu="menuConfig">
      右键菜单将挂载到指定容器中
    </div>
  </div>
</template>

<script>
export default {
  computed: {
    menuConfig() {
      return {
        menuItems: [
          { label: '选项1', action: 'option1' },
          { label: '选项2', action: 'option2' }
        ],
        onItemClick: this.handleMenuClick,
        mountElement: this.$refs.container // 挂载到指定容器
      };
    }
  },
  methods: {
    handleMenuClick(item) {
      console.log('点击了:', item.label);
    }
  }
};
</script>
```

**编程式调用自定义挂载:**

```javascript
import { showContextMenu } from '@/directives/context-menu';

// 挂载到指定元素
showContextMenu({
  x: event.clientX,
  y: event.clientY,
  menuItems: [...],
  onItemClick: this.handleClick,
  mountElement: this.$refs.customContainer // 自定义挂载容器
});
```

## 注意事项

1. **单例特性**: 同一时间只能显示一个右键菜单，新菜单会自动关闭旧菜单
2. **事件清理**: 组件销毁时会自动清理相关事件监听器
3. **位置调整**: 菜单会自动调整位置以避免超出屏幕边界
4. **键盘支持**: 支持 ESC 键关闭菜单
5. **点击外部关闭**: 点击菜单外部区域会自动关闭菜单

## 迁移指南

### 从旧版本迁移

如果你之前使用的是组件式的右键菜单，可以按以下步骤迁移：

1. **移除旧的组件引用**:
   ```vue
   <!-- 删除 -->
   <context-menu
     :visible="contextMenuVisible"
     :x="contextMenuX"
     :y="contextMenuY"
     :menu-items="contextMenuItems"
     @item-click="handleContextMenuItemClick"
     @close="closeContextMenu"
   />
   ```

2. **添加新的指令**:
   ```vue
   <!-- 添加 -->
   <div v-context-menu="menuConfig">
     <!-- 内容 -->
   </div>
   ```

3. **重构数据和方法**:
   ```javascript
   // 删除这些数据
   data() {
     return {
       contextMenuVisible: false,
       contextMenuX: 0,
       contextMenuY: 0
     };
   },
   
   // 添加配置计算属性
   computed: {
     menuConfig() {
       return {
         menuItems: this.contextMenuItems,
         onItemClick: this.handleContextMenuItemClick
       };
     }
   }
   ```

## 示例项目

查看 `ContextMenuExample.vue` 文件获取完整的使用示例。