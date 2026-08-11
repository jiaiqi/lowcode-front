<template>
  <div
    v-if="isPageItemVisible"
    class="lc-container lc-layout"
    :class="[{ 'in-edit': !isPreview && !isView }, enterAnimationClass]"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    @dragend="handleDragEnd"
    :style="[setStyle, enterAnimationVariables]"
    :id="com_name"
  >
    <div class="placeholder-img"
      v-if="props.com_preview" 
      :style="{
      backgroundImage: `url(${getImagePath(props.com_preview)})`,
    }"></div>
    <!-- 遮罩层 -->
    <div
      class="overlay"
      @click.stop="$emit('click', props)"
      :class="{ active: currentId && currentId === id }"
      v-if="!isPreview && !isView"
    >
      <!-- 拖拽排序 -->
      <!-- <div class="handle">
        <i class="el-icon-rank"></i>
      </div> -->
      <!-- 删除按钮 -->
      <i class="el-icon-close" @click="$emit('delete', props)"></i>
      <!-- <div
        @click="$emit('delete', props)"
        class="delete-bar"
        title="删除"
      >
        <i class="el-icon-delete"></i>
      </div> -->
    </div>

    <!-- 组件标题 -->
    <ComLabel
      v-if="props.show_label === '是' && props.com_label"
      :label="props.com_label"
      :show-label="props.show_label === '是'"
      :title-style-json="props.com_title_style_json"
      :icon="props.com_icon"
      :show-more-btn="showMoreBtn && pageItem.more_position !== '数据项后'"
      :more-label="pageItem.more_label"
      :more-position="pageItem.more_position"
      @more="toMore"
      ref="comLabelRef"
    />

    <!-- 子组件 -->
    <slot></slot>
  </div>
</template>

<script>
import dragStore from "../../store/dragStore";
import { formatStyleData } from "@/pages/lowcode/common/index.js";
import ComLabel from "./ComLabel.vue";
import {
  setEnterAnimationClass,
  setEnterAnimationVariables,
} from "@/common/common";
// 页面组件级 显示隐藏控制
import pageItemVisible from "@/pages/lowcode/common/params/page-item-visible-mixin.js";
export default {
  name: "lc-container",
  mixins: [pageItemVisible],
  components: { ComLabel },
  props: {
    id: {
      type: [String, Number],
      default: "",
    },
    com_no: {
      type: [String, Number],
      default: "",
    },
    currentId: {
      type: [String, Number],
      default: "",
    },
    isPreview: {
      type: Boolean,
      default: false,
    },
    isView: {
      type: Boolean,
      default: false,
    },
    contentWidth: {
      type: [String, Number],
      default: "",
    },
    com_name: {
      type: String,
      default: "",
    },
    pageItem: Object,
    pageParamsModel: Object,
    queryOptions: Object,
    // 显式声明让 mixin（page-item-visible-mixin）能稳定读取 inEdit，
    // 否则 Vue 默认会把它 inherit 到根 <div> 的 attribute 上，$attrs 拿不到。
    inEdit: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      titlePaddingTop: 0,
    };
  },
  computed: {
    enterAnimationClass() {
      return setEnterAnimationClass(this.pageItem);
    },
    enterAnimationVariables() {
      return setEnterAnimationVariables(this.pageItem);
    },
    showMoreBtn() {
      return (
        this.pageItem?.com_option?.includes("更多") &&
        this.pageItem?.more_jump_json
      );
    },
    setStyle() {
      let style = {};
      if (this.props.style_json && typeof this.props.style_json === "string") {
        style = JSON.parse(this.props.style_json);
      } else if (
        this.props.style_json &&
        typeof this.props.style_json === "object"
      ) {
        style = this.props.style_json;
      }
      if (
        this.props.layout_json?.style_json &&
        typeof this.props.layout_json.style_json === "object"
      ) {
        style = { ...this.props.layout_json.style_json, ...style };
      }
      if (this.titlePaddingTop > 0) {
        style.paddingTop = `${this.titlePaddingTop}px`;
      }
      return formatStyleData(style);
    },
    props() {
      return { ...this.$props, ...(this.$attrs || {}) };
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.titlePaddingTop = this.getTitlePaddingTop();
    });
  },
  beforeDestroy() {
  },
  methods: {
    getTitlePaddingTop() {
      if (this.props.show_label !== '是' || !this.props.com_label) {
        return 0;
      }
      const comLabelRef = this.$refs.comLabelRef;
      if (!comLabelRef) {
        return 0;
      }
      return comLabelRef.$el?.offsetHeight || comLabelRef.$el?.getBoundingClientRect?.()?.height || 0;
    },
    toMore() {
      const { more_jump_json: jumpJson } = this.pageItem || {};
      if (jumpJson?.obj_type === "内部页面") {
        let pageNo = jumpJson?.dest_page_no;
        if (jumpJson?.click_jump_option?.includes("先登录")) {
          if (this.$store.state?.loginInfo?.logined !== true) {
            this.$confirm(
              "您还未登录,需要登录才能进入,点击确认前往登录",
              "提示",
              {
                confirmButtonText: "确定",
                cancelButtonText: "取消",
                type: "warning",
              }
            ).then(() => {
              this.$router.push({
                path: "/login",
                query: { redirect: this.$route.fullPath },
              });
            });
            return;
          }
        }
        if (pageNo) {
          this.$router.push({ path: `/page/${pageNo}` });
        }
      } else if (jumpJson?.obj_type === "外部链接") {
        let url = jumpJson?.dest_url;
        if (url) {
          window.open(url, "_blank");
        }
      }
    },
    handleDragLeave(e) {
      if (this.isPreview) return;
      // 阻止事件冒泡
      e.stopPropagation();
      e.target.classList.remove("drag-over");
      e.target.classList.remove("drag-not-allowed");
    },

    handleDragOver(e) {
      if (this.isPreview) return;
      // 阻止事件冒泡
      e.stopPropagation();
      // 阻止默认行为以允许放置
      e.preventDefault();

      // 获取当前拖拽的组件类型
      const draggedType = dragStore.getDragType();

      if (e.target) {
        if (draggedType === "layout") {
          // 允许放置布局组件
          e.dataTransfer.dropEffect = "copy";
          e.target.classList.add("drag-over");
          e.target.classList.remove("drag-not-allowed");
        } else if (draggedType) {
          // 不允许放置其他类型组件
          e.dataTransfer.dropEffect = "none";
          e.target.classList.remove("drag-over");
          e.target.classList.add("drag-not-allowed");
        }
      }
    },

    // 添加拖拽结束处理
    handleDragEnd() {
      if (this.isPreview) return;
      // 清除拖拽状态
      dragStore.clearDragType();
      // 清除所有拖拽样式
      document
        .querySelectorAll(".drag-over, .drag-not-allowed")
        .forEach((el) => {
          el.classList.remove("drag-over");
          el.classList.remove("drag-not-allowed");
        });
    },

    handleDrop(e) {
      if (this.isPreview) return;
      // 阻止事件冒泡
      e.stopPropagation();
      e.preventDefault();
      if (e.target) {
        e.target.classList.remove("drag-over");
        e.target.classList.remove("drag-not-allowed");
      }

      // 获取拖拽数据
      const data = e.dataTransfer.getData("text/plain");

      if (data) {
        try {
          const draggedElement = JSON.parse(data);

          // 只处理layout类型的组件
          if (draggedElement.type === "layout") {
            if (!draggedElement._editType) {
              draggedElement.id = `${this.id}_layout_${new Date().getTime()}`;
              draggedElement._editType = "add";
            }
            draggedElement.parentId = this.id;
            draggedElement.parent_no = this.com_no;
            draggedElement.com_seq = (this.props.children.length + 1) * 100;
            // 根据布局类型创建对应数量的内容组件
            let columnCount = 1; // 默认一列
            if (draggedElement.subType === "layout-1-2") {
              columnCount = 2; // 两列布局
            } else if (draggedElement.subType === "layout-1-3") {
              columnCount = 3; // 三列布局
            } else if (draggedElement.subType === "layout-1-4") {
              columnCount = 4; // 四列布局
            } else if (
              draggedElement.subType === "layout-2-2-3070" ||
              draggedElement.subType === "layout-2-2-7030"
            ) {
              columnCount = 2; // 两列布局(比例不同)
            }
            if (
              draggedElement.child_num &&
              typeof draggedElement.child_num === "number"
            ) {
              columnCount = draggedElement.child_num;
            }
            // 创建子内容组件
            if (!draggedElement.children) {
              draggedElement.children = [];
            }
            for (let i = 0; i < columnCount; i++) {
              const contentItem = {
                id: `${draggedElement.id}_content_${i}_${new Date().getTime()}`,
                type: "content",
                component: "lc-content",
                com_type: "layout",
                name: `可放置组件区域${i + 1}`,
                com_name: `组件容器${i + 1}`,
                parentId: draggedElement.id,
                layout_party: "组件",
                _editType: "add",
              };
              draggedElement.children.push(contentItem);
            }
            this.$emit("add", draggedElement);
          } else {
            // 不是layout类型，显示不允许放置的反馈
            if (e.target) {
              e.target.classList.add("drag-not-allowed");
              setTimeout(() => {
                if (e.target) {
                  e.target.classList.remove("drag-not-allowed");
                }
              }, 1500);
            }
          }
        } catch (err) {
          console.error("解析拖拽数据失败:", err);
        }
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@use "../../styles/layout.common.scss" as layout;

.overlay {
  @include layout.overlay;
}

.placeholder-img{
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: 100% 100%;
  background-position: center;
  z-index: 2;
}

.lc-container {
  width: 100%;
  // min-height: 30px;
  min-width: var(--content-width);
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  $primary-color: #ff740e;
  // border: 1px dashed rgba($color: $primary-color, $alpha: 0.3);
  /* 添加浅色虚线边框 */
  // &.preview-mode {
  //   border-color: transparent;
  // }
  // margin: 10px 0;
  // padding: 10px;
  &.in-edit {
    min-height: 50px;
  }

  > .overlay {
    border: 1px dashed rgba($color: $primary-color, $alpha: 1);

    &.drag-over {
      border: 2px dashed $primary-color;
      background-color: rgba($color: $primary-color, $alpha: 0.3);

      &::before {
        content: "可放置布局容器";
        position: absolute;
        top: 0;
        left: 0;
        padding: 2px 5px;
        background-color: $primary-color;
        color: #fff;
        transform: translateY(-100%);
        z-index: 10;
        font-size: 12px;
        border-radius: 2px 2px 0 0;
      }
    }

    &.drag-not-allowed {
      border: 2px dashed #ff0000;
      background-color: rgba(255, 0, 0, 0.05);

      &::before {
        content: "不可放置此组件";
        position: absolute;
        top: 0;
        left: 0;
        padding: 2px 5px;
        background-color: #ff0000;
        color: #fff;
        transform: translateY(-100%);
        z-index: 10;
      }
    }

    > .handle {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      z-index: 10;
      right: 0;
      display: none;
    }

    &:hover {
      .handle {
        display: block;
        cursor: move;
      }
    }

    &:hover {
      // cursor: pointer;
      border: 1px dashed $primary-color;
      background-color: rgba($color: $primary-color, $alpha: 0.1);

      &::before {
        content: "页面容器";
        position: absolute;
        top: 0;
        left: 0;
        padding: 2px 5px;
        background-color: $primary-color;
        color: #fff;
        transform: translateY(-100%);
      }
    }

    &.active {
      border: 2px solid $primary-color;
      background-color: rgba($color: $primary-color, $alpha: 0.1);

      &::before {
        content: "页面容器";
        position: absolute;
        top: 0;
        left: 0;
        padding: 2px 5px;
        background-color: $primary-color;
        color: #fff;
        transform: translateY(-100%);
      }
    }
  }
}
</style>
