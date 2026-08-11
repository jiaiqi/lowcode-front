<template>
  <div v-if="
    hiddenComponentVisible === false &&
    visible == false &&
    type === 'component'
  ">
    组件已隐藏
  </div>
  <div
    class="force-login"
    ref=""
    v-else-if="
      forceLogin && (visible !== false || hiddenComponentVisible === true)
    "
    :id="com_name"
  >
    <!-- :style="{ backgroundImage: 'url(' + loginBg + ')' }" -->
    <!-- <img :src="loginBg" v-if="loginBg" class="img" /> -->
    <div
      class="login-bg"
      :style="{ backgroundImage: 'url(' + loginBg + ')' }"
    ></div>
    <div class="login-box">
      <div>请在登录后进行查看</div>
      <button
        class="login-btn"
        @click="toLogin"
        type="button"
      >登录</button>
    </div>
  </div>
  <!-- 在线咨询对话框-->
  <div v-else-if="com_name === '咨询入口' && isOpenChat">
    <ChatBox
      :visible.sync="isOpenChat"
      :chatItem="chatItem"
    />
  </div>
  <!-- 移动端模式下的组件包装器 -->
  <div
    v-else-if="mode === 'mobile' && inEdit && (visible !== false || hiddenComponentVisible === true)"
    class="mobile-component-wrapper"
    :class="{
      'is-selected': currentId === id,
      'is-dragging': isDragging,
      'drag-over-top': dragOverPosition === 'top',
      'drag-over-bottom': dragOverPosition === 'bottom'
    }"
    @dragover.stop="handleMobileDragOver"
    @dragleave.stop="handleMobileDragLeave"
    @drop.stop="handleMobileDrop"
  >
    <!-- 移动端组件操作栏 -->
    <div
      class="mobile-component-header"
      :class="{ 'is-selected': currentId === id }"
      @click.stop="onTap(props)"
    >
      <div
        class="drag-handle"
        draggable="true"
        @dragstart.stop="handleMobileDragStart"
        @dragend.stop="handleMobileDragEnd"
        title="拖拽排序"
      >
        <i class="el-icon-rank"></i>
      </div>
      <span class="component-name">{{ com_name || name || '组件' }}</span>
      <div
        class="delete-btn"
        @click.stop="handleDelete"
        title="删除组件"
      >
        <i class="el-icon-delete"></i>
      </div>
    </div>
    <!-- 组件内容 -->
    <div class="mobile-component-content">
      <component
        :is="component"
        v-if="component"
        v-bind="props"
        :page-item="props.data"
        :query-options="queryOptions"
        :page-params-model="pageParamsModel"
        :page-no="pageNo"
        :page-config="pageConfig"
        :content-width="contentWidth"
        :page-route="pageRoute"
        @click="onTap"
        :currentId="currentId"
        :isPreview="isPreview"
        :isView="isView"
        :in-edit="inEdit"
        @add="addComponent"
        @resize="onResize"
        @layout-resize="$emit('layout-resize', $event)"
        @setOpenChat="setOpenChat"
        @executor-complete="$emit('executor-complete', $event)"
        :class="{ 'preview-mode': isPreview, 'view-mode': isView }"
      >
        <template v-if="childComponents && childComponents.length">
          <lc-view
            v-for="(item, idx) in childComponents"
            v-if="isChildVisible(item)"
            v-bind="item"
            :page-item="item.data"
            :content-width="contentWidth"
            :key="item.com_no || item.id"
            :currentId="currentId"
            :isPreview="isPreview"
            :isView="isView"
            :hidden-component-visible="hiddenComponentVisible"
            :in-edit="inEdit"
            :mode="mode"
            :sortable-index="sortableIndex"
            :query-options="queryOptions"
            :page-params-model="pageParamsModel"
            :page-no="pageNo"
            :page-config="pageConfig"
            :page-route="pageRoute"
            @click="onTap"
            @add="addComponent"
            @delete="deleteComponent"
            @resize="onResize"
            @layout-resize="$emit('layout-resize', $event)"
            @setOpenChat="setOpenChat"
            @swap-components="$emit('swap-components', $event)"
            @move-component="$emit('move-component', $event)"
            @sort-change="$emit('sort-change', $event)"
            @executor-complete="$emit('executor-complete', $event)"
          ></lc-view>
        </template>
        <slot v-else>
          <template v-if="!isView && !isPreview">
            <template v-if="type === 'content'">
              <span
                class=""
                style="color: #999; pointer-events: none"
              >
                {{ name || "可放置组件/布局容器" }}
              </span>
            </template>
            <template v-else-if="type === 'component' && props.com_name">
              {{ props.com_name }}
            </template>
            <template v-else>
              {{ name }}
            </template>
          </template>
        </slot>
      </component>
    </div>
  </div>
  <!-- PC端模式 -->
  <component
    :is="component"
    v-else-if="
      component && (visible !== false || hiddenComponentVisible === true)
    "
    v-bind="props"
    :page-item="props.data"
    :query-options="queryOptions"
    :page-params-model="pageParamsModel"
    :page-no="pageNo"
    :page-config="pageConfig"
    :content-width="contentWidth"
    :page-route="pageRoute"
    @click="onTap"
    :currentId="currentId"
    :isPreview="isPreview"
    :isView="isView"
    :in-edit="inEdit"
    @add="addComponent"
    @delete="deleteComponent"
    @resize="onResize"
    @layout-resize="$emit('layout-resize', $event)"
    @setOpenChat="setOpenChat"
    @swap-components="$emit('swap-components', $event)"
    @move-component="$emit('move-component', $event)"
    @executor-complete="$emit('executor-complete', $event)"
    :class="{ 'preview-mode': isPreview, 'view-mode': isView }"
    :style="(props.com_option && props.com_option.includes('悬浮可拖动')) ||
        type === '悬浮组件'
        ? ''
        : 'position: relative; z-index: 1'
      "
  >
    <template v-if="childComponents && childComponents.length">
      <lc-view
        v-for="(item, idx) in childComponents"
        v-if="isChildVisible(item)"
        v-bind="item"
        :page-item="item.data"
        :content-width="contentWidth"
        :key="item.com_no || item.id"
        :currentId="currentId"
        :isPreview="isPreview"
        :isView="isView"
        :hidden-component-visible="hiddenComponentVisible"
        :in-edit="inEdit"
        :mode="mode"
        :sortable-index="sortableIndex"
        :query-options="queryOptions"
        :page-params-model="pageParamsModel"
        :page-no="pageNo"
        :page-config="pageConfig"
        :page-route="pageRoute"
        @click="onTap"
        @add="addComponent"
        @delete="deleteComponent"
        @resize="onResize"
        @layout-resize="$emit('layout-resize', $event)"
        @setOpenChat="setOpenChat"
        @swap-components="$emit('swap-components', $event)"
        @move-component="$emit('move-component', $event)"
        @sort-change="$emit('sort-change', $event)"
        @executor-complete="$emit('executor-complete', $event)"

      ></lc-view>
    </template>
    <slot v-else>
      <template v-if="!isView && !isPreview">
        <template v-if="type === 'content'">
          <span
            class=""
            style="color: #999; pointer-events: none"
          >
            {{ name || "可放置组件/布局容器" }}
          </span>
        </template>
        <template v-else-if="type === 'component' && props.com_name">
          {{ props.com_name }}
        </template>
        <template v-else>
          {{ name }}
        </template>
      </template>
    </slot>
  </component>
</template>

<script>
import lcBlock from "./block.vue";
import lcContainer from "./container.vue";
import lcContent from "./content-item.vue";
import PageItem from "@/pages/lowcode/widgets/page-item.vue";
import floatComponent from "./float-component.vue";
// import { VueDraggable } from "vue-draggable-plus";
import chatEntrance from "@/pages/lowcode/widgets/chat/chat-entrance.vue";
import ChatBox from "@/pages/lowcode/widgets/chat/chat-box.vue";
// 页面组件级 显示隐藏控制
import pageItemVisible from "@/pages/lowcode/common/params/page-item-visible-mixin.js";

export default {
  name: "lc-view",
  mixins: [pageItemVisible],
  components: {
    ChatBox,
    lcBlock,
    lcContainer,
    lcContent,
    // VueDraggable,
    PageItem,
    lcView: () => import("./view.vue"),
    floatComponent,
    chatEntrance
  },
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
    component: {
      type: String,
      default: "",
    },
    name: {
      type: String,
      default: "",
    },
    children: {
      type: Array,
      default: () => [],
    },
    type: {
      type: String,
      default: "",
    },
    isPreview: {
      type: Boolean,
      default: false,
    },
    contentWidth: {
      type: String,
    },
    pageItem: {
      type: Object,
      default: () => {
        return {};
      },
    },
    com_name: {
      type: String,
      default: "",
    },
    visible: {
      type: Boolean,
      default: true,
    },
    hiddenComponentVisible: {
      type: Boolean,
      default: false,
    },
    inEdit: {
      type: Boolean,
      default: false,
    },
    pageNo: {
      type: String,
      default: "",
    },
    pageConfig: {
      type: Object,
      default: () => {
        return {};
      },
    },
    queryOptions: {
      type: Object,
      default: () => {
        return {};
      },
    },
    pageParamsModel: {
      type: Object,
      default: () => {
        return {};
      },
    },
    pageRoute: {
      type: Object,
      default: () => {
        return {};
      },
    },
    mode: {
      type: String,
      default: "pc",
      validator: (value) => ["pc", "mobile"].includes(value),
    },
    sortableIndex: {
      type: Number,
      default: -1,
    },
  },
  computed: {
    props() {
      return { ...this.$props, ...(this.$attrs || {}) };
    },
    isView() {
      return this.$route.meta?.isView === true;
    },
    forceLogin() {
      return this.pageItem?.com_option?.includes("强制登录") && this.needLogin;
    },
    loginBg() {
      let imgs = this.pageItem?.login_bg_img_json;
      if (Array.isArray(imgs) && imgs.length) {
        const img = imgs[0];
        if (img?.file_no) {
          return this.serviceApi().downloadFileNo + img.file_no;
        }
        if (img?.fileurl) {
          return this.serviceApi().downloadFile + img.fileurl;
        }
      }
    },
    needLogin() {
      return this.$store.state.loginInfo.logined !== true;
    },
  },
  data() {
    return {
      childComponents: [],
      chatItem: null,
      isOpenChat: false,
      // 移动端拖拽排序相关
      isDragging: false,
      dragOverPosition: null,
    };
  },
  watch: {
    children: {
      immediate: true,
      deep: true,
      handler(newValue) {
        if (Array.isArray(newValue)) {
          this.childComponents = newValue;
        } else {
          this.childComponents = [];
        }
      },
    },
  },
  methods: {
    //打开指定的在线咨询框
    setOpenChat(item) {
      this.isOpenChat = true;
      this.chatItem = item;
    },
    toLogin() {
      const currentUrl = window.location.pathname + window.location.hash;
      sessionStorage.setItem("login_redirect_url", currentUrl);
      const loginUrl = window.location.origin + "/main/login.html";
      window.location.href = loginUrl;
    },
    openComponentSelector() {
      this.$emit("open", this.props);
    },
    onTap(val) {
      if (!this.isPreview) {
        const propsData = val || this.props;
        this.$emit("click", {
          ...propsData,
          data: propsData.data || propsData._raw_data || propsData,
        });
      }
    },
    addComponent(val) {
      if (!this.isPreview) {
        this.$emit("add", val);
      }
    },
    deleteComponent(val) {
      if (!this.isPreview) {
        this.$emit("delete", val);
      }
    },
    onResize(val) {
      if (!this.isPreview) {
        if (this.component === "lc-content") {
          this.$emit("content-resize", val);
          this.$el.dispatchEvent(new CustomEvent("content-resize", {
            bubbles: true,
            detail: val,
          }));
        } else {
          this.$emit("resize", val);
        }
      }
    },
    // 移动端拖拽排序相关方法
    handleMobileDragStart(e) {
      this.isDragging = true;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", JSON.stringify({
        type: "sort",
        fromIndex: this.sortableIndex,
        id: this.id,
      }));
    },
    handleMobileDragEnd(e) {
      this.isDragging = false;
      this.dragOverPosition = null;
    },
    handleMobileDragOver(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      
      const rect = e.currentTarget.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      
      if (e.clientY < midY) {
        this.dragOverPosition = "top";
      } else {
        this.dragOverPosition = "bottom";
      }
    },
    handleMobileDragLeave(e) {
      this.dragOverPosition = null;
    },
    handleMobileDrop(e) {
      e.preventDefault();
      this.dragOverPosition = null;
      
      try {
        const data = JSON.parse(e.dataTransfer.getData("text/plain"));
        if (data.type === "sort" && data.fromIndex !== this.sortableIndex) {
          const rect = e.currentTarget.getBoundingClientRect();
          const midY = rect.top + rect.height / 2;
          let toIndex = this.sortableIndex;
          
          if (e.clientY < midY) {
            toIndex = this.sortableIndex > data.fromIndex ? this.sortableIndex - 1 : this.sortableIndex;
          } else {
            toIndex = this.sortableIndex > data.fromIndex ? this.sortableIndex : this.sortableIndex + 1;
          }
          
          this.$emit("sort-change", {
            fromIndex: data.fromIndex,
            toIndex: toIndex,
          });
        }
      } catch (err) {
        console.error("解析拖拽数据失败:", err);
      }
    },
    handleDelete() {
      this.$confirm('确定要删除此组件吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$emit("delete", this.props);
      }).catch(() => {
        // 用户取消删除
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.force-login {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;

  .login-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.1);
    background-image: url("~@/assets/image/login/wj_login.jpg");
    background-repeat: no-repeat;
    background-size: cover;
    filter: blur(10px);
    z-index: -1;
  }

  .login-box {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #fff;
    flex-direction: column;

    .login-btn {
      padding: 10px 20px;
      border-radius: 5px;
      background-color: var(--menu-bg-color, #409eff);
      min-width: 200px;
      text-align: center;
      margin-top: 20px;
    }
  }
}

// 移动端组件包装器样式
.mobile-component-wrapper {
  position: relative;
  margin-bottom: 8px;
  border: 2px solid transparent;
  border-radius: 4px;
  transition: all 0.2s ease;

  &.is-selected {
    border-color: var(--primary-color, #409eff);
  }

  &.is-dragging {
    opacity: 0.5;
    border-color: #ff9800;
  }

  &.drag-over-top {
    border-top-color: #ff9800;
    border-top-width: 3px;
  }

  &.drag-over-bottom {
    border-bottom-color: #ff9800;
    border-bottom-width: 3px;
  }

  .mobile-component-header {
    display: flex;
    align-items: center;
    padding: 6px 10px;
    background-color: #f5f7fa;
    border-bottom: 1px solid #e4e7ed;
    cursor: pointer;
    transition: background-color 0.2s;

    &.is-selected {
      background-color: var(--primary-color, #409eff);
      color: #fff;

      .drag-handle,
      .delete-btn {
        color: #fff;
      }
    }

    &:hover {
      background-color: #ecf5ff;
    }

    .drag-handle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      margin-right: 8px;
      cursor: grab;
      color: #909399;
      transition: color 0.2s;

      &:active {
        cursor: grabbing;
      }

      &:hover {
        color: var(--primary-color, #409eff);
      }
    }

    .component-name {
      flex: 1;
      font-size: 12px;
      color: #606266;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .delete-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      cursor: pointer;
      color: #909399;
      transition: color 0.2s;

      &:hover {
        color: #f56c6c;
      }
    }
  }

  .mobile-component-content {
    min-height: 40px;
  }
}
</style>