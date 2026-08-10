<template>
  <div class="context-menu-example">
    <h2>右键菜单使用示例</h2>
    
    <!-- 指令方式示例 -->
    <div class="example-section">
      <h3>1. 使用自定义指令</h3>
      <div 
        class="demo-area directive-demo"
        v-context-menu="directiveMenuConfig"
      >
        <p>在这个区域右键点击试试</p>
        <p>当前选中项: {{ selectedItem || '无' }}</p>
      </div>
    </div>
    
    <!-- 自定义挂载容器示例 -->
    <div class="example-section">
      <h3>2. 自定义挂载容器</h3>
      <div class="custom-container" ref="customContainer">
        <div 
          class="demo-area custom-mount-demo"
          v-context-menu="customMountMenuConfig"
        >
          <p>右键菜单将挂载到上级容器中</p>
          <p>容器ID: {{ customContainerId }}</p>
        </div>
      </div>
    </div>
    
    <!-- 编程式调用示例 -->
    <div class="example-section">
      <h3>3. 编程式调用</h3>
      <div 
        class="demo-area programmatic-demo"
        @contextmenu="showProgrammaticMenu"
      >
        <p>在这个区域右键点击试试</p>
        <p>点击次数: {{ clickCount }}</p>
      </div>
    </div>
    
    <!-- 动态菜单示例 -->
    <div class="example-section">
      <h3>4. 动态菜单</h3>
      <div class="controls">
        <label>
          <input type="checkbox" v-model="showAdvancedOptions"> 
          显示高级选项
        </label>
      </div>
      <div 
        class="demo-area dynamic-demo"
        v-context-menu="dynamicMenuConfig"
      >
        <p>右键查看动态菜单</p>
        <p>高级选项: {{ showAdvancedOptions ? '已启用' : '已禁用' }}</p>
      </div>
    </div>
    
    <div class="result">
      <h3>操作结果:</h3>
      <p>{{ lastAction }}</p>
    </div>
  </div>
</template>

<script>
import { showContextMenu } from '@/components/common/ContextMenu/context-menu';

export default {
  name: 'ContextMenuExample',
  data() {
    return {
      selectedItem: null,
      clickCount: 0,
      showAdvancedOptions: false,
      customContainerId: 'custom-container-' + Date.now()
    };
  },
  
  mounted() {
    // 为自定义容器设置ID
    if (this.$refs.customContainer) {
      this.$refs.customContainer.id = this.customContainerId;
    }
  },
  computed: {
    // 指令方式的菜单配置
    directiveMenuConfig() {
      return {
        menuItems: [
          {
            label: '选择项目A',
            icon: 'ri:star-line',
            action: 'select-a'
          },
          {
            label: '选择项目B',
            icon: 'ri:heart-line',
            action: 'select-b'
          },
          { divider: true },
          {
            label: '清除选择',
            icon: 'ri:close-line',
            action: 'clear'
          }
        ],
        onItemClick: this.handleDirectiveMenuClick,
        context: { type: 'directive' }
      };
    },
    
    // 自定义挂载容器的菜单配置
    customMountMenuConfig() {
      return {
        menuItems: [
          {
            label: '容器内选项1',
            icon: 'ri:folder-line',
            action: 'container-option1'
          },
          {
            label: '容器内选项2', 
            icon: 'ri:folder-open-line',
            action: 'container-option2'
          },
          { divider: true },
          {
            label: '查看容器信息',
            icon: 'ri:information-line',
            action: 'container-info'
          }
        ],
        onItemClick: this.handleCustomMountMenuClick,
        context: { containerId: this.customContainerId },
        mountElement: this.$refs.customContainer // 挂载到自定义容器
      };
    },
    
    // 动态菜单配置
    dynamicMenuConfig() {
      const baseItems = [
        {
          label: '基础选项1',
          icon: 'ri:file-line',
          action: 'basic1'
        },
        {
          label: '基础选项2',
          icon: 'ri:file-text-line',
          action: 'basic2'
        }
      ];
      
      const advancedItems = this.showAdvancedOptions ? [
        { divider: true },
        {
          label: '高级选项1',
          icon: 'ri:settings-line',
          action: 'advanced1'
        },
        {
          label: '高级选项2',
          icon: 'ri:tools-line',
          action: 'advanced2'
        }
      ] : [];
      
      return {
        menuItems: [...baseItems, ...advancedItems],
        onItemClick: this.handleDynamicMenuClick,
        context: { type: 'dynamic', hasAdvanced: this.showAdvancedOptions }
      };
    }
  },
  methods: {
    handleDirectiveMenuClick(item, context) {
      this.$message.success(`指令菜单点击: ${item.label}`);
      console.log('指令菜单点击:', item, context);
      
      if (item.action === 'select-a') {
        this.selectedItem = '项目A';
      } else if (item.action === 'select-b') {
        this.selectedItem = '项目B';
      } else if (item.action === 'clear') {
        this.selectedItem = null;
      }
    },
    
    handleCustomMountMenuClick(item, context) {
      this.$message.success(`容器菜单点击: ${item.label}`);
      console.log('容器菜单点击:', item, context);
      
      if (item.action === 'container-info') {
        alert(`容器ID: ${context.containerId}`);
      }
    },
    
    handleDynamicMenuClick(item, context) {
      this.$message.success(`动态菜单点击: ${item.label}`);
      console.log('动态菜单点击:', item, context);
    },
    
    showProgrammaticMenu(event) {
      event.preventDefault();
      this.clickCount++;
      
      showContextMenu({
        x: event.clientX,
        y: event.clientY,
        menuItems: [
          {
            label: '编程式选项1',
            icon: 'ri:code-line',
            action: 'programmatic1'
          },
          {
            label: '编程式选项2',
            icon: 'ri:terminal-line',
            action: 'programmatic2'
          },
          { divider: true },
          {
            label: `点击次数: ${this.clickCount}`,
            icon: 'ri:mouse-line',
            action: 'show-count',
            disabled: true
          }
        ],
        onItemClick: (item, context) => {
          this.$message.success(`编程式菜单点击: ${item.label}`);
          console.log('编程式菜单点击:', item, context);
        },
        context: { type: 'programmatic', clickCount: this.clickCount }
      });
    }
  }
};
</script>

<style scoped>
.context-menu-example {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.example-section {
  margin-bottom: 30px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.example-section h3 {
  margin: 0;
  padding: 15px 20px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  color: #303133;
  font-size: 16px;
}

.demo-area {
  border: 2px dashed #ccc;
  padding: 40px;
  margin: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.demo-area:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.demo-area p {
  margin: 5px 0;
  color: #606266;
}

.custom-container {
  margin: 20px;
  padding: 10px;
  border: 2px solid #67c23a;
  border-radius: 8px;
  background-color: #f0f9ff;
  position: relative;
}

.custom-container::before {
  content: '自定义挂载容器';
  position: absolute;
  top: -10px;
  left: 10px;
  background-color: #67c23a;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.custom-mount-demo {
  margin: 10px 0;
  border-color: #67c23a;
}

.custom-mount-demo:hover {
  border-color: #85ce61;
  background-color: #f0f9ff;
}

.controls {
  padding: 15px 20px;
  background-color: #fafafa;
  border-bottom: 1px solid #e4e7ed;
}

.controls label {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #606266;
}

.controls input[type="checkbox"] {
  margin-right: 8px;
}

.result {
  margin-top: 30px;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.result h3 {
  margin-top: 0;
  color: #333;
}

.result p {
  margin: 10px 0 0 0;
  color: #666;
  font-family: monospace;
  background-color: #fff;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #ddd;
}
</style>