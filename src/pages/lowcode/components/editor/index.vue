<template>
  <div
    class="editor-view"
    :class="{ 'mobile-mode': mode === 'mobile' }"
    @click.stop=""
    @dragover="handleEditorDragOver"
    @dragleave="handleEditorDragLeave"
    @drop="handleEditorDrop"
    @dragend="handleEditorDragEnd"
    :style="{ '--content-width': contentWidth }"
  >
    <div
      class="overlay"
      :class="{
        'on-drag-float-component': ['悬浮组件', '咨询入口'].includes(draggingComponentType),
      }"
      @click="clickOutside"
    ></div>
    <div class="editor-bg" :style="[setStyle]" v-if="mode === 'mobile'"></div>
    <lc-view
      :style="{
        'pointer-events': ['悬浮组件', '咨询入口'].includes(draggingComponentType) ? 'none' : '',
      }"
      v-for="(item, index) in editorComponents"
      :current-id="currentId"
      :key="item.id"
      :content-width="contentWidth"
      :hiddenComponentVisible="hiddenComponentVisible"
      :page-config="pageConfig"
      v-bind="item"
      :in-edit="true"
      :mode="mode"
      :sortable-index="index"
      @click="onTap"
      @open="openComponentSelector = true"
      @add="addComponent"
      @delete="deleteComponent"
      @resize="onResize"
      @layout-resize="$emit('layout-resize', $event)"
      @swap-components="swapComponents"
      @move-component="moveComponent"
      @sort-change="handleSortChange"
    >
    </lc-view>
  </div>
</template>

<script>
// import LcBlock from "../materials/block.vue";
// import LcContainer from "../materials/container.vue";
// import LcContent from "../materials/content-item.vue";
import lcView from "../materials/view.vue";
// import { VueDraggable } from "vue-draggable-plus";
import dragStore from "../../store/dragStore";
import cloneDeep from "lodash/cloneDeep";
import { formatStyleData } from "@/pages/lowcode/vendor/datav/common/index.js";

export default {
  name: "lowcode-editor",
  components: {
    // LcBlock,
    // LcContainer,
    // LcContent,
    lcView,
    // VueDraggable,
  },
  props: {
    currentId: {
      type: [String, Number],
      default: "",
    },
    contentWidth: {
      type: String,
      default: "",
    },
    components: {
      type: Array,
      default: () => [],
    },
    hiddenComponentVisible: {
      type: Boolean,
      default: false,
    },
    draggingComponentType: {
      type: String,
      default: "",
    },
    pageConfig: {
      type: Object,
      default: () => {},
    },
    mode: {
      type: String,
      default: "pc",
      validator: (value) => ["pc", "mobile"].includes(value),
    },
  },
  computed: {
    setStyle() {
      let style = {};
      if (this.mode === "mobile" && this.pageConfig?.page_style_json_data) {
        style = cloneDeep(this.pageConfig?.page_style_json_data);
      }
      return formatStyleData(style);
    },
    isView() {
      return this.$route.meta?.isView === true;
    },
  },
  watch: {
    components: {
      immediate: true,
      deep: true,
      handler(newValue, oldValue) {
        if (oldValue !== newValue) {
          this.editorComponents = newValue;
        }
      },
    },
  },
  data() {
    return {
      // 组件数据
      editorComponents: [],
      // currentId: null,
      openComponentSelector: false,
      // 移动端排序相关
      draggedIndex: null,
      dragOverIndex: null,
    };
  },
  methods: {
    onStart(e) {
      // console.log("start", e);
    },

    onEnd(e) {
      // console.log("onEnd", e);
    },

    onUpdate(val) {
      // console.log("update",val,this.editorComponents);
      this.$nextTick(() => {
        this.$emit("change", this.editorComponents);
      });
    },
    clickOutside() {
      console.log("clickOutside");
      // this.currentId = null;
      this.$emit("select", null, null);
    },
    onTap(val) {
      console.log("onTap", val);
      // this.currentId = val.id;
      this.$emit("select", val.id, val);
    },

    // 处理组件交换
    swapComponents(data) {
      console.log("swapComponents", data);
      const {
        sourceContentId,
        targetContentId,
        draggedComponent,
        targetComponent,
      } = data;

      // 查找源容器和目标容器
      let sourceContainer = null;
      let targetContainer = null;

      // 递归查找容器
      const findContainers = (components) => {
        for (let i = 0; i < components.length; i++) {
          const item = components[i];
          if (item.id === sourceContentId) {
            sourceContainer = item;
          }
          if (item.id === targetContentId) {
            targetContainer = item;
          }
          if (sourceContainer && targetContainer) {
            return true;
          }
          if (item.children && item.children.length > 0) {
            if (findContainers(item.children)) {
              return true;
            }
          }
        }
        return false;
      };

      findContainers(this.editorComponents);

      if (sourceContainer && targetContainer) {
        // 交换组件
        const sourceIndex = sourceContainer.children.findIndex(
          (item) => item.id === draggedComponent.id
        );
        const targetIndex = targetContainer.children.findIndex(
          (item) => item.id === targetComponent.id
        );

        if (sourceIndex !== -1 && targetIndex !== -1) {
          // 更新父容器ID
          const tempComponent = { ...sourceContainer.children[sourceIndex] };
          tempComponent.parentId = targetContainer.id;
          tempComponent.parent_no = targetContainer.com_no;
          tempComponent.com_seq = targetContainer.com_seq;
          tempComponent._editType = "update";

          const tempTargetComponent = {
            ...targetContainer.children[targetIndex],
          };
          tempTargetComponent.parentId = sourceContainer.id;
          tempTargetComponent.parent_no = sourceContainer.com_no;
          tempTargetComponent.com_seq = sourceContainer.com_seq;
          tempTargetComponent._editType = "update";

          // 交换组件
          this.$set(sourceContainer.children, sourceIndex, tempTargetComponent);
          this.$set(targetContainer.children, targetIndex, tempComponent);

          // 触发更新
          this.$nextTick(() => {
            this.$emit("change", this.editorComponents);
          });
        }
      }
    },

    // 处理组件移动
    moveComponent(data) {
      console.log("moveComponent", data);
      const { sourceContentId, targetContentId, component } = data;

      // 查找源容器和目标容器
      let sourceContainer = null;
      let targetContainer = null;

      // 递归查找容器
      const findContainers = (components) => {
        for (let i = 0; i < components.length; i++) {
          const item = components[i];
          if (item.id === sourceContentId) {
            sourceContainer = item;
          }
          if (item.id === targetContentId) {
            targetContainer = item;
          }
          if (sourceContainer && targetContainer) {
            return true;
          }
          if (item.children && item.children.length > 0) {
            if (findContainers(item.children)) {
              return true;
            }
          }
        }
        return false;
      };

      findContainers(this.editorComponents);

      if (sourceContainer && targetContainer) {
        // 从源容器中移除组件
        const sourceIndex = sourceContainer.children.findIndex(
          (item) => item.id === component.id
        );

        if (sourceIndex !== -1) {
          // 更新父容器ID
          const tempComponent = { ...sourceContainer.children[sourceIndex] };
          tempComponent.parentId = targetContainer.id;
          tempComponent.parent_no = targetContainer.com_no;
          tempComponent.com_seq = targetContainer.com_seq;
          tempComponent._editType = "update";

          // 从源容器移除
          sourceContainer.children.splice(sourceIndex, 1);

          // 添加到目标容器
          targetContainer.children.push(tempComponent);

          // 触发更新
          this.$nextTick(() => {
            this.$emit("change", this.editorComponents);
          });
        }
      }
    },
    findComponentById(id, list = [], data) {
      let result = null;
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        if (id && (item.id === id || item.com_no === id)) {
          // 检查是否已有children数组
          if (!item.children) {
            this.$set(item, "children", []);
          }
          item.children.push(data);
          result = item;
          break; // 找到后立即退出循环
        }
        if (item.children && item.children.length > 0) {
          const found = this.findComponentById(id, item.children, data);
          if (found) {
            result = found;
            break;
          }
        }
      }
      return result;
    },
    onResize(val) {
      this.$emit("resize", val || {});
    },
    addComponent(val) {
      console.log("addComponent", val);
      if (val?.parentId) {
        this.findComponentById(val.parentId, this.editorComponents, val);
        // 触发更新
        this.$nextTick(() => {
          this.$emit("change", this.editorComponents);
        });
      }
    },
    deleteComponent(val) {
      console.log("deleteComponent", val);
      this.$emit("delete", val);
    },
    // 移动端组件排序处理
    handleSortChange(data) {
      console.log("handleSortChange", data);
      const { fromIndex, toIndex } = data;
      
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
        return;
      }
      
      // 交换组件位置
      const components = [...this.editorComponents];
      const draggedComponent = components[fromIndex];
      const targetComponent = components[toIndex];
      
      // 交换 com_seq 值
      const tempSeq = draggedComponent._seq || draggedComponent.com_seq;
      draggedComponent._seq = targetComponent._seq || targetComponent.com_seq;
      targetComponent._seq = tempSeq;
      
      // 标记为更新
      draggedComponent._editType = "update";
      draggedComponent._isPositionChanged = true;
      targetComponent._editType = "update";
      targetComponent._isPositionChanged = true;
      
      // 记录交换的组件
      dragStore.addSwappedComponent(draggedComponent.id);
      dragStore.addSwappedComponent(targetComponent.id);
      dragStore.addPositionChangedComponent(draggedComponent.id);
      dragStore.addPositionChangedComponent(targetComponent.id);
      
      // 交换位置
      components[fromIndex] = targetComponent;
      components[toIndex] = draggedComponent;
      
      this.editorComponents = components;
      
      // 触发更新
      this.$nextTick(() => {
        this.$emit("change", this.editorComponents);
      });
    },
    // 在methods中添加以下方法
    handleEditorDragOver(e) {
      // 获取拖拽元素的类型
      const draggedType = dragStore.getDragType();
      console.log("handleEditorDragOver", draggedType);
      // 阻止默认行为以允许放置
      e.preventDefault();
      // 检查拖拽元素的类型
      console.log("draggedType", draggedType);
      
      // 移动端模式下允许所有组件放置
      if (this.mode === "mobile") {
        e.dataTransfer.dropEffect = "copy";
        e.currentTarget.classList.add("editor-drag-over");
        e.currentTarget.classList.remove("editor-drag-not-allowed");
        if (draggedType === "悬浮组件" || draggedType === '咨询入口') {
          e.currentTarget.classList.add("on-drag-float-component");
        }
        return;
      }
      
      // PC端模式原有逻辑
      if (draggedType === "container") {
        // 允许放置容器组件
        e.dataTransfer.dropEffect = "copy";
        e.currentTarget.classList.add("editor-drag-over");
        e.currentTarget.classList.remove("editor-drag-not-allowed");
      } else if (draggedType === "悬浮组件" || draggedType === '咨询入口') {
        // 允许放置悬浮组件
        e.dataTransfer.dropEffect = "copy";
        e.currentTarget.classList.add("on-drag-float-component");
        e.currentTarget.classList.add("editor-drag-over");
        e.currentTarget.classList.remove("editor-drag-not-allowed");
      } else if (draggedType) {
        // 不允许放置非容器组件
        e.dataTransfer.dropEffect = "none";
        e.currentTarget.classList.remove("editor-drag-over");
        e.currentTarget.classList.add("editor-drag-not-allowed");
      }
    },
    handleEditorDragLeave(e) {
      e.currentTarget.classList.remove("editor-drag-over");
      e.currentTarget.classList.remove("editor-drag-not-allowed");
      e.currentTarget.classList.remove("on-drag-float-component");
    },
    // 添加拖拽结束处理
    handleEditorDragEnd(e) {
      // 清除拖拽状态
      dragStore.clearDragType();
      // 清除所有拖拽样式
      document
        .querySelectorAll(
          ".editor-drag-over, .editor-drag-not-allowed, .drag-over, .drag-not-allowed"
        )
        .forEach((el) => {
          el.classList.remove("editor-drag-over");
          el.classList.remove("editor-drag-not-allowed");
          el.classList.remove("drag-over");
          el.classList.remove("drag-not-allowed");
        });
    },
    handleEditorDrop(e) {
      e.preventDefault();
      e.currentTarget.classList.remove("editor-drag-over");
      e.currentTarget.classList.remove("editor-drag-not-allowed");
      e.currentTarget.classList.remove("on-drag-float-component");
      // 获取拖拽数据
      const data = e.dataTransfer.getData("text/plain");
      if (data) {
        try {
          const draggedElement = JSON.parse(data);
          const isMobileMode = this.mode === "mobile";
          
          // 移动端模式：所有组件都添加到根级别
          if (isMobileMode) {
            // 移动端模式下的处理逻辑
            if (draggedElement.type === "悬浮组件") {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              const xPercent = (x / rect.width) * 100;
              const yPercent = (y / rect.height) * 100;

              draggedElement.position = {
                x: xPercent,
                y: yPercent,
              };
              draggedElement.com_type = "cardGroup";
              draggedElement.component = "float-component";
              if (!draggedElement._editType) {
                draggedElement.id = `root_container_${new Date().getTime()}`;
                draggedElement._editType = "add";
                draggedElement.com_name = "悬浮组件";
                draggedElement.com_option = "悬浮可拖动";
                draggedElement._seq = (this.editorComponents.length + 1) * 100 + 10000;
                this.editorComponents.push(draggedElement);
              }
              this.$emit("change", this.editorComponents);
            } else if (draggedElement.value === "咨询入口") {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              const xPercent = (x / rect.width) * 100;
              const yPercent = (y / rect.height) * 100;

              draggedElement.position = {
                x: xPercent,
                y: yPercent,
              };
              draggedElement.com_type = "cardGroup";
              draggedElement.component = "chat-entrance";
              draggedElement.com_option = "悬浮可拖动";
              if (!draggedElement._editType) {
                draggedElement.id = `root_container_${new Date().getTime()}`;
                draggedElement._editType = "add";
                draggedElement.com_name = "咨询入口";
                draggedElement._seq = (this.editorComponents.length + 1) * 100 + 10000;
                this.editorComponents.push(draggedElement);
              }
              this.$emit("change", this.editorComponents);
            } else if (draggedElement.type === "container") {
              // 移动端模式下也支持容器组件
              if (!draggedElement._editType) {
                draggedElement.id = `root_container_${new Date().getTime()}`;
                draggedElement._editType = "add";
                draggedElement._seq = (this.editorComponents.length + 1) * 100;
                this.editorComponents.push(draggedElement);
              }
              this.$emit("change", this.editorComponents);
            } else {
              // 移动端模式：普通组件扁平化添加
              if (!draggedElement._editType) {
                draggedElement.id = `component_${new Date().getTime()}`;
                draggedElement._editType = "add";
                draggedElement._seq = (this.editorComponents.length + 1) * 100;
                // 确保组件有必要的属性
                if (!draggedElement.com_type && draggedElement.value) {
                  draggedElement.com_type = draggedElement.value;
                }
                if (!draggedElement.com_name && draggedElement.label) {
                  draggedElement.com_name = draggedElement.label;
                }
                this.editorComponents.push(draggedElement);
              }
              this.$emit("change", this.editorComponents);
            }
            return;
          }
          
          // PC端模式：原有逻辑
          // 只处理container类型的组件
          if (draggedElement.type === "container") {
            if (!draggedElement._editType) {
              draggedElement.id = `root_container_${new Date().getTime()}`;
              draggedElement._editType = "add";
              // 计算seq值，使用(当前组件数量+1)*100
              draggedElement._seq = (this.editorComponents.length + 1) * 100;
              // 添加到顶层组件
              this.editorComponents.push(draggedElement);
            }
            this.$emit("change", this.editorComponents);
          } else if (draggedElement.type === "悬浮组件") {
            // 计算当前放入的点相对于editor-view的位置 单位使用百分比
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const xPercent = (x / rect.width) * 100;
            const yPercent = (y / rect.height) * 100;

            draggedElement.position = {
              x: xPercent,
              y: yPercent,
            };
            draggedElement.com_type = "cardGroup";
            draggedElement.component = "float-component";
            if (!draggedElement._editType) {
              draggedElement.id = `root_container_${new Date().getTime()}`;
              draggedElement._editType = "add";
              draggedElement.com_name = "悬浮组件";
              draggedElement.com_option = "悬浮可拖动";
              // 计算seq值，使用(当前组件数量+1)*100 + 10000
              draggedElement._seq = (this.editorComponents.length + 1) * 100 + 10000;
              // 添加到顶层组件
              this.editorComponents.push(draggedElement);
            }
            this.$emit("change", this.editorComponents);
          } else if (draggedElement.value === '详情组件') {
            draggedElement.com_type = "details";
            draggedElement.component = "component";
            if (!draggedElement._editType) {
              draggedElement.id = `root_container_${new Date().getTime()}`;
              draggedElement._editType = "add";
              draggedElement.com_name = "详情";
              draggedElement.com_type = "details";
              // 计算seq值，使用(当前组件数量+1)*100 + 10000
              draggedElement._seq = (this.editorComponents.length + 1) * 100 + 10000;
              // 添加到顶层组件
              this.editorComponents.push(draggedElement);
            }
            this.$emit("change", this.editorComponents);
          } else if (draggedElement.value === '大华视频监控') {
            draggedElement.com_type = "大华视频监控";
            draggedElement.component = "component";
            if (!draggedElement._editType) {
              draggedElement.id = `root_container_${new Date().getTime()}`;
              draggedElement._editType = "add";
              draggedElement.com_name = "大华视频监控";
              draggedElement.com_type = "大华视频监控";
              // 计算seq值，使用(当前组件数量+1)*100 + 10000
              draggedElement._seq = (this.editorComponents.length + 1) * 100 + 10000;
              // 添加到顶层组件
              this.editorComponents.push(draggedElement);
            }
            this.$emit("change", this.editorComponents);
          } else if (draggedElement.value === '咨询入口') {
            // 计算当前放入的点相对于editor-view的位置 单位使用百分比
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const xPercent = (x / rect.width) * 100;
            const yPercent = (y / rect.height) * 100;

            draggedElement.position = {
              x: xPercent,
              y: yPercent,
            };
            draggedElement.com_type = "cardGroup";
            draggedElement.component = "chat-entrance";
            draggedElement.com_option = "悬浮可拖动";
            if (!draggedElement._editType) {
              draggedElement.id = `root_container_${new Date().getTime()}`;
              draggedElement._editType = "add";
              draggedElement.com_name = "咨询入口";
              // 计算seq值，使用(当前组件数量+1)*100 + 10000
              draggedElement._seq = (this.editorComponents.length + 1) * 100 + 10000;
              // 添加到顶层组件
              this.editorComponents.push(draggedElement);
            }
            this.$emit("change", this.editorComponents);
          }
          else {
            // 不是container类型，显示不允许放置的反馈
            let target = e.currentTarget;
            target.classList.add("editor-drag-not-allowed");
            setTimeout(() => {
              target.classList.remove("editor-drag-not-allowed");
            }, 1500);
          }
        } catch (err) {
          console.error("解析拖拽数据失败:", err);
        }
      }
    },
  },
};
</script>

<style scoped lang="scss">
.editor-view {
  width: 100%;
  min-width: var(--content-width);
  position: relative;
  padding-bottom: 50px;
  &.mobile-mode{
    &::webkit-scrollbar {
      display: none;
    }
    ::v-deep .page-item{
      width: unset;
      height: unset;
    }
  }
  &.editor-drag-over {
    border: 2px dashed #ff740e;
    background-color: rgba(255, 116, 14, 0.05);

    &::before {
      content: "可放置页面容器";
      position: absolute;
      top: 10px;
      left: 10px;
      padding: 5px 10px;
      background-color: #ff740e;
      color: #fff;
      z-index: 100;
      border-radius: 4px;
    }
  }

  &.on-drag-float-component {
    background-color: rgba(255, 116, 14, 0.1);

    &.editor-drag-over {
      &::before {
        content: "放置悬浮组件";
        position: absolute;
        top: 10px;
        left: 10px;
        padding: 5px 10px;
        color: #fff;
        z-index: 100;
        border-radius: 4px;
      }
    }
  }

  &.editor-drag-not-allowed {
    border: 2px dashed #ff0000;
    background-color: rgba(255, 0, 0, 0.05);

    &::before {
      content: "不可放置此组件";
      position: absolute;
      top: 10px;
      left: 10px;
      padding: 5px 10px;
      background-color: #ff0000;
      color: #fff;
      z-index: 100;
      border-radius: 4px;
    }
  }
}

.editor-bg{
  position:absolute;
  top:0;
  left:0;
  width:100%;
  background-color: transparent;
}
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0);
  z-index: 0;

  .on-drag-float-component {
    z-index: 9999999;
  }
}
</style>