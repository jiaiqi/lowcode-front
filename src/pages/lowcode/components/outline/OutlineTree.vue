<template>
  <el-drawer
    title="组件大纲"
    :visible.sync="drawerVisible"
    direction="ltr"
    size="400px"
    :modal="false"
    class="outline-container"
    :class="{ 'dark-mode': isDarkMode }"
    @close="handleClose"
  >
    <div class="outline-toolbar">
      <el-input
        v-model="filterText"
        placeholder="搜索组件"
        prefix-icon="el-icon-search"
        clearable
        size="mini"
        class="search-input"
      />
      <el-button-group class="expand-btns">
        <el-button size="mini" @click="expandAll" title="展开全部">
          <Icon icon="ri-expand-diagonal-s-fill" />
        </el-button>
        <el-button size="mini" @click="collapseAll" title="折叠全部">
          <Icon icon="ri-collapse-diagonal-s-fill" />
        </el-button>
      </el-button-group>
    </div>
    
    <el-tree
      ref="outlineTree"
      node-key="id"
      :highlight-current="true"
      :default-expand-all="true"
      :expand-on-click-node="false"
      :current-node-key="currentId"
      :data="treeData"
      :props="treeProps"
      :filter-node-method="filterNode"
      @node-click="handleNodeClick"
    >
      <span
        class="custom-tree-node"
        style="width: 100%; display: flex; align-items: center"
        slot-scope="{ node, data }"
      >
        <Icon
          :icon="getComponentIcon(data.com_type)"
          class="node-icon"
        />
        <span class="node-label" :title="node.label">{{ node.label }}</span>
        <span class="right-btn">
          <el-button
            type="text"
            size="mini"
            @click.stop="() => handleRemove(node, data)"
          >
            删除
          </el-button>
        </span>
      </span>
    </el-tree>
  </el-drawer>
</template>

<script>
import { Icon } from "@iconify/vue2";
import cloneDeep from "lodash/cloneDeep";

const COMPONENT_ICONS = {
  "lc-container": "ri-layout-bottom-2-line",
  "lc-block": "ri-layout-4-line",
  "lc-content": "ri-layout-right-2-line",
  "lc-tabs": "ri-folder-line",
  "lc-carousel": "ri-slideshow-line",
  "lc-image": "ri-image-line",
  "lc-text": "ri-text",
  "lc-button": "ri-button",
  "lc-input": "ri-input-field",
  "lc-select": "ri-list-check",
  "lc-checkbox": "ri-checkbox-line",
  "lc-radio": "ri-radio-button-line",
  "lc-switch": "ri-toggle-line",
  "lc-date-picker": "ri-calendar-line",
  "lc-time-picker": "ri-time-line",
  "lc-table": "ri-table-line",
  "lc-chart": "ri-pie-chart-line",
  "lc-map": "ri-map-pin-line",
  "lc-video": "ri-video-line",
  "lc-audio": "ri-volume-up-line",
  "lc-form": "ri-file-list-3-line",
  "lc-nav-menu": "ri-menu-line",
  "lc-list": "ri-list-ordered",
  "lc-card": "ri-layout-card-line",
  "lc-divider": "ri-separator",
  "lc-space": "ri-space",
  "lc-html": "ri-code-line",
  "lc-iframe": "ri-window-line",
  "default": "ri-checkbox-blank-line",
};

export default {
  name: "OutlineTree",
  components: {
    Icon,
  },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    components: {
      type: Array,
      default: () => [],
    },
    currentId: {
      type: String,
      default: "",
    },
    isDarkMode: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      filterText: "",
      treeProps: {
        label: "com_name",
        children: "children",
      },
    };
  },
  computed: {
    drawerVisible: {
      get() {
        return this.visible;
      },
      set(val) {
        this.$emit("update:visible", val);
      },
    },
    treeData() {
      return cloneDeep(this.components);
    },
  },
  watch: {
    filterText(val) {
      this.$refs.outlineTree?.filter(val);
    },
    currentId: {
      handler(newVal) {
        if (newVal && this.$refs.outlineTree) {
          this.$nextTick(() => {
            this.$refs.outlineTree.setCurrentKey(newVal);
            this.scrollToNode(newVal);
          });
        }
      },
      immediate: true,
    },
  },
  methods: {
    getComponentIcon(comType) {
      return COMPONENT_ICONS[comType] || COMPONENT_ICONS.default;
    },
    
    filterNode(value, data) {
      if (!value) return true;
      const comName = data.com_name || "";
      return comName.toLowerCase().includes(value.toLowerCase());
    },
    
    handleNodeClick(data) {
      this.$emit("node-click", data);
    },
    
    handleRemove(node, data) {
      this.$confirm("确定删除该组件吗？删除后不可恢复", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(() => {
        this.$emit("remove", data);
      }).catch(() => {});
    },
    
    expandAll() {
      const nodes = this.$refs.outlineTree?.store?.nodesMap;
      if (nodes) {
        for (let key in nodes) {
          nodes[key].expanded = true;
        }
      }
    },
    
    collapseAll() {
      const nodes = this.$refs.outlineTree?.store?.nodesMap;
      if (nodes) {
        for (let key in nodes) {
          nodes[key].expanded = false;
        }
      }
    },
    
    scrollToNode(nodeKey) {
      this.$nextTick(() => {
        const node = this.$refs.outlineTree?.store?.nodesMap?.[nodeKey];
        if (node) {
          const nodeEl = document.querySelector(
            `.outline-container .el-tree-node[data-key="${nodeKey}"], 
             .outline-container .el-tree-node[key="${nodeKey}"]`
          );
          if (nodeEl) {
            nodeEl.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      });
    },
    
    handleClose() {
      this.$emit("update:visible", false);
    },
  },
};
</script>

<style lang="scss" scoped>
.outline-toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  padding: 0 10px;
  
  .search-input {
    flex: 1;
  }
  
  .expand-btns {
    flex-shrink: 0;
  }
}

.custom-tree-node {
  .node-icon {
    margin-right: 8px;
    font-size: 16px;
    color: var(--primary-color, #17d57e);
  }
  
  .node-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .right-btn {
    visibility: hidden;
    margin-left: 10px;
  }
  
  &:hover .right-btn {
    visibility: visible;
  }
}

:deep(.el-tree-node__content) {
  height: 32px;
  
  &:hover {
    background-color: rgba(23, 213, 126, 0.1);
  }
}

:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: rgba(23, 213, 126, 0.2);
  color: var(--primary-color, #17d57e);
  
  .node-icon {
    color: var(--primary-color, #17d57e);
  }
}

.outline-container {
  :deep(.el-drawer__header) {
    margin-bottom: 15px;
    padding: 15px 20px;
    border-bottom: 1px solid #e4e7ed;
  }
  
  :deep(.el-drawer__body) {
    padding: 15px;
  }
}

.dark-mode {
  :deep(.el-drawer__header) {
    border-bottom-color: #3a3a3a;
    color: #e5eaf3;
    background-color: #1a1a1a;
  }
  
  :deep(.el-drawer__body) {
    background-color: #1e1e1e;
    color: #e5eaf3;
  }
  
  :deep(.el-input__inner) {
    background-color: #2a2a2a;
    border-color: #3a3a3a;
    color: #e5eaf3;
    
    &::placeholder {
      color: #6b6b6b;
    }
  }
  
  :deep(.el-tree) {
    background-color: transparent;
    color: #e5eaf3;
  }
  
  :deep(.el-tree-node__content) {
    &:hover {
      background-color: rgba(23, 213, 126, 0.15);
    }
  }
  
  :deep(.el-tree-node.is-current > .el-tree-node__content) {
    background-color: rgba(23, 213, 126, 0.25);
  }
  
  :deep(.el-button--text) {
    color: #17d57e;
    
    &:hover {
      color: #2ae88f;
    }
  }
  
  .custom-tree-node {
    .node-icon {
      color: #17d57e;
    }
  }
}
</style>
