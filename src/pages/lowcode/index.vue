<template>
  <div
    class="lowcode-wrapper"
    ref="lowcodeWrapper"
    :class="{ 'dark-mode': isDarkMode }"
    :style="panelWidthVars"
  >
    <header-view
      :is-preview.sync="previewVisible"
      :json-visible.sync="jsonVisible"
      @click.native="currentChange()"
      @preview="openNewTab"
      v-if="!isView"
    >
      <template #left>
        <div
          @click.stop="jsonVisible = true"
          class="handle-btn"
          title="组件json"
        >
          <Icon icon="ri-terminal-box-line" />
        </div>
        <div
          @click.stop="outlineVisible = true"
          class="handle-btn"
          title="组件大纲"
        >
          <Icon icon="ri-node-tree" />
        </div>
        <div
          @click.stop="hiddenComponentVisible = !hiddenComponentVisible"
          class="handle-btn"
          :class="{ active: hiddenComponentVisible }"
          title="显示已隐藏组件"
        >
          <Icon icon="ri-dashboard-horizontal-line" />
        </div>
        <!-- 编辑模式切换按钮组 -->
        <div class="editor-mode-switch">
          <el-radio-group v-model="editorMode" size="mini" @change="onEditorModeChange">
            <el-radio-button label="pc">
              <Icon icon="ri:computer-line" />
              PC端
            </el-radio-button>
            <el-radio-button label="mobile">
              <Icon icon="ri:smartphone-line" />
              移动端
            </el-radio-button>
          </el-radio-group>
        </div>
        <!-- 移动端预览按钮 -->
        <div
          v-if="editorMode === 'mobile'"
          @click.stop="toggleMobileView"
          class="handle-btn"
          :class="{ active: isMobileView }"
          title="移动端预览"
        >
          <Icon icon="ri:cellphone-line" />
        </div>
        <!-- 添加深色模式切换按钮 -->
        <div
          @click.stop="setDarkMode(!isDarkMode)"
          class="handle-btn theme-toggle-btn"
          title="切换主题模式"
        >
          <Icon
            :icon="isDarkMode ? 'ri:sun-line' : 'ri:moon-line'"
            class="theme-icon"
          />
        </div>
      </template>
      <template
        #center
        v-if="pageConfig && pageConfig.page_name"
      >
        {{ pageConfig.page_name || "" }}
      </template>
      <template #right>
        <el-button
          type="primary"
          size="mini"
          @click="getPageConfig"
        >刷新</el-button>
        <el-button
          type="primary"
          size="mini"
          @click="onSave"
          :loading="isSaving"
        >保存</el-button>
      </template>
    </header-view>
    <div class="lowcode-content">
      <!-- 修改物料面板，添加收缩功能 -->
      <div
        class="materials-panel-container"
        :class="{ collapsed: materialsCollapsed }"
        v-if="!isView"
      >
        <div
          class="materials-toggle"
          @click="toggleMaterialsPanel"
        >
          <i :class="materialsCollapsed ? 'el-icon-arrow-right' : 'el-icon-arrow-left'
            "></i>
        </div>
        <materials-view
          app-no="config"
          class="materials-view"
          :mode="editorMode"
          @drag-start="onDragStart"
          @drag-end="onDragEnd"
        ></materials-view>
        <!-- 添加物料面板拖动调整宽度的分隔线 -->
        <div
          class="materials-resizer"
          @mousedown="handleMaterialsResizerMouseDown"
        ></div>
      </div>
      <div
        class="editor-container"
        @click="currentChange()"
        :class="{ 
          'in-edit': !isPreview && !isView,
          'mobile-view': isMobileView,
          'mobile-mode': editorMode === 'mobile'
        }"
        ref="editorContainer"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp"
        :style="[
          editorContainerStyle,
          { cursor: isSpacePressed ? 'grab' : 'default' },
        ]"
      >
        <!-- 添加拖动状态遮罩层 -->
        <div
          v-if="isSpacePressed"
          class="drag-overlay"
          @click.stop=""
        ></div>
        <editor-view
          :page-config="pageConfig"
          :current-item="currentItem"
          :components="components"
          :current-id="currentId"
          :hidden-component-visible="hiddenComponentVisible"
          :draggingComponentType="draggingComponentType"
          :mode="editorMode"
          @select="currentChange"
          @change="componentsChange"
          @delete="onDel"
          @resize="onResize"
          @layout-resize="onLayoutResize"
          :content-width="contentAreaWidth"
          :style="[setStyle,themeVariable]"
          ref="editorRef"
          :key="pageRefreshKey"
        ></editor-view>
      </div>
      <div
        class="property-panel-container"
        :class="{ collapsed: propertyCollapsed }"
        v-if="!isView"
      >
        <!-- 添加属性面板拖动调整宽度的分隔线 -->
        <div
          class="property-resizer"
          @mousedown="handlePropertyResizerMouseDown"
        ></div>
        <div
          class="property-toggle"
          @click="togglePropertyPanel"
        >
          <i :class="propertyCollapsed ? 'el-icon-arrow-left' : 'el-icon-arrow-right'
            "></i>
        </div>
        <property-view
          class="property-view"
          app-no="config"
          :page-config="pageConfig"
          :current-item="currentItem"
          :current-id="currentId"
          :components="components"
          ref="propertyRef"
          @change="componentsChange"
          @page-change="onPageChange"
          @refresh="onRefresh"
          :key="pageRefreshKey"
        ></property-view>
      </div>
    </div>
    <el-dialog
      title="页面预览"
      :visible.sync="previewVisible"
      fullscreen
      v-if="!isView"
    >
      <div
        slot="title"
        class="dialog-title flex justify-between px-4"
      >
        <div class="flex items-center">
          <span class="mr-2">预览</span>
          <Icon icon="mdi-light:eye" />
        </div>
        <el-button
          type="primary"
          size="mini"
          @click="openNewTab"
        >页面预览</el-button>
      </div>
      <div
        class="preview-container"
        :class="{ 'mobile-preview': isMobileView }"
        :style="[themeVariable]"
      >
        <lc-view
          v-for="item in components"
          :key="item.id"
          v-bind="item"
          :content-width="contentAreaWidth"
          :isPreview="true"
        ></lc-view>
      </div>
    </el-dialog>
    <el-drawer
      title="页面JSON预览"
      :visible.sync="jsonVisible"
      direction="ltr"
      size="500px"
      :with-header="false"
      v-if="!isView"
    >
      <json-viewer
        :value="components"
        expanded
        :expand-depth="5"
        :copyable="{ copyText: '复制', copiedText: '已复制' }"
      ></json-viewer>
    </el-drawer>
    <OutlineTree
      :visible.sync="outlineVisible"
      :components="components"
      :current-id="currentId"
      :is-dark-mode="isDarkMode"
      @node-click="clickComponent"
      @remove="removeComp"
    />
    <!-- 移动端预览弹窗 -->
    <el-dialog
      title="移动端预览"
      :visible.sync="mobilePreviewVisible"
      width="375px"
      :modal="true"
      class="mobile-preview-dialog"
      @open="onMobilePreviewOpen"
    >
      <template #title>
        <div class="flex items-center justify-between w-full">
          <span>移动端预览</span>
          <a
            :href="mobilePreviewUrl"
            target="_blank"
            class="open-new-tab-btn"
            title="在新标签页打开"
            @click.prevent="openMobilePreviewInNewTab"
          >
            <Icon icon="ri-external-link-line" class="text-base" />
            <span class="ml-1 text-sm">新标签页打开</span>
          </a>
        </div>
      </template>
      <div class="mobile-preview-content">
        <!-- 加载动画 -->
        <div v-if="iframeLoading" class="iframe-loading">
          <i class="el-icon-loading"></i>
          <span>页面加载中...</span>
        </div>
        <iframe
          :src="mobilePreviewUrl"
          frameborder="0"
          class="mobile-preview-iframe"
          @load="onIframeLoad"
          :style="{ opacity: iframeLoading ? 0 : 1 }"
        ></iframe>
      </div>
    </el-dialog>
  </div>
</template>

<script>
// 外部js
import JsonViewer from "vue-json-viewer";
import "vue-json-viewer/style.css";
import cloneDeep from "lodash/cloneDeep";
import debounce from "lodash/debounce";
// 外部组件
import DynamicIcon from "@/pages/lowcode/widgets/common/DynamicIcon.vue";

// 内部js
import { $http, $selectOne, $selectList, $delete } from "@/common/http";
import clickoutside from "@/pages/lowcode/common/clickoutside.js";
import dragStore from "./store/dragStore";

// mixin
import lowCodePageMixin from "./mixins/lowcode-page-mixin";
import pageParamsMixin from "./mixins/page-params-mixin";

// 内部组件
import HeaderView from "./components/header/index.vue";
import MaterialsView from "./components/materials/index.vue";
import EditorView from "./components/editor/index.vue";
import PropertyView from "./components/property/index.vue";
import lcView from "./components/materials/view.vue";
import OutlineTree from "./components/outline/OutlineTree.vue";
import { getFullBaseUrl } from "@/common/common";

export default {
  name: "lowCodeEditor",
  mixins: [lowCodePageMixin, pageParamsMixin],
  components: {
    HeaderView,
    MaterialsView,
    EditorView,
    PropertyView,
    JsonViewer,
    lcView,
    Icon: DynamicIcon,
    OutlineTree,
  },

  directives: {
    clickoutside: clickoutside,
  },
  computed: {
    // 添加面板宽度CSS变量计算属性
    panelWidthVars() {
      return {
        "--materials-panel-width": `${this.materialsWidth}px`,
        "--property-panel-width": `${this.propertyWidth}px`,
      };
    },
    isView() {
      return this.$route.meta?.isView === true;
    },
    appConfig() {
      return this.pageConfig?.app_json_data || {};
    },
    contentAreaWidth() {
      // 如果是移动端视图，返回固定的移动端宽度
      if (this.isMobileView) {
        return '375px';
      }
      // 否则使用原有逻辑
      let width = this.pageConfig?.content_area_width || "100%";
      return typeof width === "string" &&
        (width?.includes("%") || width?.includes("vw") || width?.includes("vh"))
        ? width
        : `${parseFloat(width)}px`;
    },
    // 移动端预览URL
    mobilePreviewUrl() {
      const isDev = process.env.NODE_ENV === 'development';
      const baseUrl = isDev ? 'http://192.168.0.209' : '';
      if(isDev){
        return `http://localhost:8081/xmp/views/custom/index/index?page_no=${this.pageNo}?srvApp=config`
        return `${getFullBaseUrl()}/lowcode/view/${this.pageNo}?srvApp=config`
      }
      return `${baseUrl}/xmp/views/custom/index/index?page_no=${this.pageNo}`;
    },
  },
  data() {
    return {
      //
      pageRefreshKey: new Date().getTime(),
      // pageNo: null,
      currentId: null,
      currentItem: null,
      structureData: null,
      jsonVisible: false, //json视图
      outlineVisible: false, //大纲视图
      hiddenComponentVisible: false, //隐藏组件视图
      previewVisible: false,
      // 属性面板折叠状态
      propertyCollapsed: false,
      // 添加物料面板折叠状态
      materialsCollapsed: false,
      isPreview: false,
      // 空格拖动相关
      isSpacePressed: false,
      isDragging: false,
      startX: 0,
      startY: 0,
      scrollLeft: 0,
      scrollTop: 0,
      editorContainerStyle: {},
      draggingComponentType: null,
      // 保存按钮状态
      isSaving: false,
      // 深色模式状态
      isDarkMode: false,
      // 面板宽度
      materialsWidth: 300,
      propertyWidth: 300,
      // 面板调整宽度相关
      isResizingMaterials: false,
      isResizingProperty: false,
      // 编辑模式: 'pc' | 'mobile'
      editorMode: 'pc',
      // 移动端视图状态
      isMobileView: false,
      // 移动端预览弹窗状态
      mobilePreviewVisible: false,
      // iframe加载状态
      iframeLoading: true,
    };
  },
  mounted() {
    // 从localStorage中读取面板宽度
    this.loadPanelWidths();
    if (
      localStorage.getItem("lowcode_dark_mode") === "true" ||
      (localStorage.getItem("lowcode_dark_mode") !== "false" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      this.isDarkMode = true;
    } else {
      this.isDarkMode = false;
    }
    // 设置深色模式
    this.setDarkMode(this.isDarkMode);
    // 从localStorage中读取移动端视图状态
    const savedMobileView = localStorage.getItem('lowcode_mobile_view');
    if (savedMobileView !== null) {
      this.isMobileView = savedMobileView === 'true';
    }
    // 从URL参数或localStorage中读取编辑模式
    this.initEditorMode();
  },
  created() {
    // 在组件挂载后，获取editorContainer引用
    this.$nextTick(() => {
      if (!this.isView && !this.isPreview && this.$refs.editorContainer) {
        // 为editorContainer添加键盘事件监听
        this.$refs.editorContainer.addEventListener(
          "keydown",
          this.handleKeyDown
        );
        this.$refs.editorContainer.addEventListener("keyup", this.handleKeyUp);
      }

      // 添加全局鼠标事件监听，用于处理面板宽度调整
      document.addEventListener("mousemove", this.handleGlobalMouseMove);
      document.addEventListener("mouseup", this.handleGlobalMouseUp);
    });
  },
  beforeDestroy() {
    if (!this.isView && !this.isPreview) {
      // 移除键盘事件监听，防止内存泄漏
      this.$refs.editorContainer.removeEventListener(
        "keydown",
        this.handleKeyDown
      );
      this.$refs.editorContainer.removeEventListener("keyup", this.handleKeyUp);
    }

    // 移除全局鼠标事件监听
    document.removeEventListener("mousemove", this.handleGlobalMouseMove);
    document.removeEventListener("mouseup", this.handleGlobalMouseUp);
  },
  methods: {
    // 初始化编辑模式
    initEditorMode() {
      // 优先从URL参数读取
      const urlMode = this.$route.query.mode || this.$route.query.platform;
      if (urlMode === 'mobile') {
        this.editorMode = 'mobile';
      } else if (urlMode === 'pc') {
        this.editorMode = 'pc';
      } else {
        // 从localStorage读取
        const savedMode = localStorage.getItem('lowcode_editor_mode');
        if (savedMode === 'mobile' || savedMode === 'pc') {
          this.editorMode = savedMode;
        }
      }
      // 同步到dragStore
      dragStore.setEditorMode(this.editorMode);
      // 如果是移动端模式，自动开启移动端视图
      if (this.editorMode === 'mobile') {
        this.isMobileView = true;
      }
    },
    // 编辑模式切换
    onEditorModeChange(mode) {
      this.editorMode = mode;
      // 保存到localStorage
      localStorage.setItem('lowcode_editor_mode', mode);
      // 同步到dragStore
      dragStore.setEditorMode(mode);
      // 更新URL参数（不刷新页面）
      const query = { ...this.$route.query, mode };
      this.$router.replace({ query }).catch(() => {});
      // 如果是移动端模式，自动开启移动端视图
      if (mode === 'mobile') {
        this.isMobileView = true;
      } else {
        this.isMobileView = false;
      }
      localStorage.setItem('lowcode_mobile_view', this.isMobileView);
    },
    // 切换深色主题
    setDarkMode(isDarkMode) {
      const ele = this.$refs.lowcodeWrapper;
      ele.classList.toggle("dark-mode", isDarkMode);
      this.isDarkMode = isDarkMode;
      // 保存主题设置到localStorage
      localStorage.setItem("lowcode_dark_mode", this.isDarkMode);
    },
    onRefresh() {
      setTimeout(() => {
        // location.reload();
        this.getPageConfig().then(() => {
          // this.pageRefreshKey = new Date().getTime();
        });
      }, 150);
    },
    removeComp(data) {
      if (this.$refs.editorRef) {
        this.$refs.editorRef.deleteComponent(data);
      }
    },
    openNewTab() {
      // 如果是移动端视图，使用弹窗在当前页面预览
      if (this.isMobileView) {
        this.mobilePreviewVisible = true;
      } else {
        // 桌面端使用原有预览方式
        const url = `${getFullBaseUrl()}/lowcode/view/${this.pageNo}`;
        window.open(url, "_blank");
      }
    },
    openMobilePreviewInNewTab() {
      window.open(this.mobilePreviewUrl, "_blank");
    },
    onDragStart(data) {
      this.draggingComponentType = data.type;
    },
    onDragEnd() {
      this.draggingComponentType = null;
    },
    // 加载面板宽度
    loadPanelWidths() {
      // 从localStorage中读取面板宽度
      const savedMaterialsWidth = localStorage.getItem(
        "lowcode_materials_width"
      );
      const savedPropertyWidth = localStorage.getItem("lowcode_property_width");

      if (savedMaterialsWidth) {
        this.materialsWidth = parseInt(savedMaterialsWidth);
      }

      if (savedPropertyWidth) {
        this.propertyWidth = parseInt(savedPropertyWidth);
      }
    },

    // 保存面板宽度
    savePanelWidths() {
      localStorage.setItem("lowcode_materials_width", this.materialsWidth);
      localStorage.setItem("lowcode_property_width", this.propertyWidth);
    },

    // 物料面板宽度调整相关方法
    handleMaterialsResizerMouseDown(e) {
      this.isResizingMaterials = true;
      this.startX = e.clientX;
      // 阻止默认行为和事件冒泡
      e.preventDefault();
      e.stopPropagation();
    },

    // 属性面板宽度调整相关方法
    handlePropertyResizerMouseDown(e) {
      this.isResizingProperty = true;
      this.startX = e.clientX;
      // 阻止默认行为和事件冒泡
      e.preventDefault();
      e.stopPropagation();
    },

    // 全局鼠标移动事件
    handleGlobalMouseMove(e) {
      if (this.isResizingMaterials) {
        // 计算宽度变化
        const deltaX = e.clientX - this.startX;
        const newWidth = Math.max(
          150,
          Math.min(800, this.materialsWidth + deltaX)
        );

        this.materialsWidth = newWidth;
        this.startX = e.clientX;

        // 保存宽度到localStorage
        this.savePanelWidths();
      } else if (this.isResizingProperty) {
        // 计算宽度变化
        const deltaX = this.startX - e.clientX;
        const newWidth = Math.max(
          200,
          Math.min(800, this.propertyWidth + deltaX)
        );

        this.propertyWidth = newWidth;
        this.startX = e.clientX;

        // 保存宽度到localStorage
        this.savePanelWidths();
      }
    },

    // 鼠标抬起事件
    handleGlobalMouseUp() {
      this.isResizingMaterials = false;
      this.isResizingProperty = false;
    },

    // 切换物料面板
    toggleMaterialsPanel() {
      this.materialsCollapsed = !this.materialsCollapsed;
    },
    // 切换属性面板
    togglePropertyPanel() {
      this.propertyCollapsed = !this.propertyCollapsed;
    },
    // 切换移动端视图
    toggleMobileView() {
      this.isMobileView = !this.isMobileView;
      // 保存状态到localStorage
      localStorage.setItem('lowcode_mobile_view', this.isMobileView);
    },

    // 移动端预览弹窗打开时
    onMobilePreviewOpen() {
      this.iframeLoading = true;
    },

    // iframe加载完成
    onIframeLoad() {
      this.iframeLoading = false;
    },

    findComponentById(components, id) {
      let result = null;
      if (!id || !components || !components.length) return result;
      for (let i = 0; i < components.length; i++) {
        const component = components[i];
        if (component.id == id) {
          result = component;
          if (result) {
            break;
          }
        } else if (
          Array.isArray(component.children) &&
          component.children.length
        ) {
          result = this.findComponentById(component.children, id);
          if (result) {
            break;
          }
        }
      }
      return result;
    },
    onResize({ id = "", width, height, x, y }) {
      if (!id) return;
      function findComponentById(components, id) {
        let result = null;
        if (!id || !components || !components.length) return result;
        for (let i = 0; i < components.length; i++) {
          const component = components[i];
          if (component.id === id) {
            result = component;
            if (result) {
              break;
            }
          } else if (
            Array.isArray(component.children) &&
            component.children.length
          ) {
            result = findComponentById(component.children, id);
            if (result) {
              break;
            }
          }
        }
        return result;
      }
      let component = findComponentById(this.components, id);
      if (component && (width || height || x || y)) {
        if (width) {
          component.layout_width = width;
          this.$set(component, "layout_width", width);
        }
        if (height) {
          component.layout_height = height;
          this.$set(component, "layout_height", height);
        }
        if (x) {
          component.layout_x = x;
          this.$set(component, "layout_x", x);
        }
        if (y) {
          component.layout_y = y;
          this.$set(component, "layout_y", y);
        }
        if (!component._editType) {
          this.$set(component, "_editType", "update");
        }
      }
    },
    onLayoutResize(data) {
      // this.$refs?.propertyRef?.saveLayoutStyle(data);
    },
    onSave: debounce(function () {
      // 1. 看页面属性有没有发生变化 有的话先保存页面属性
      if (this.isSaving) return; // 如果正在保存，则不重复执行

      this.isSaving = true;
      const savePromise = this.$refs?.propertyRef?.onSave();

      // 检查返回值是否是Promise
      if (savePromise && typeof savePromise.then === "function") {
        savePromise
          .then(() => {
            // PropertyView组件内部已经有成功提示，这里不再重复提示
          })
          .catch((err) => {
            this.$message.error("保存失败：" + (err?.message || "未知错误"));
          })
          .finally(() => {
            this.isSaving = false;
          });
      } else {
        // 如果不是Promise，直接设置状态为false
        this.isSaving = false;
      }
    }, 500),
    async getPageConfig() {
      const url = `/config/select/srvpage_cfg_page_guest_select`;
      const req = {
        serviceName: "srvpage_cfg_page_guest_select",
        // colNames: ["*"],
        colNames: [
          "page_title",
          "page_name",
          "id",
          "page_style_no",
          "srv_req_no",
          "preview",
          "page_no",
          "page_options",
          "tmpl_page_no",
          "page_style_json",
        ],
        condition: [
          {
            colName: "page_no",
            ruleType: "eq",
            value: this.pageNo,
          },
        ],
      };
      const { data, ok, msg } = await $selectOne(url, req);
      if (ok) {
        let newData = this.initPageConfig(data);
        await this.initComponents(newData);
        this.pageRefreshKey = new Date().getTime();
        this.initPageParams();
      } else if (msg) {
        this.$message.error(msg);
      } else {
        this.$message.info("无数据！");
      }
    },
    async getPageComponents() {
      const url = `/config/select/srvpage_cfg_page_component_select`;
      const req = {
        serviceName: "srvpage_cfg_page_component_select",
        colNames: ["*"],
        condition: [
          {
            colName: "page_no",
            ruleType: "eq",
            value: this.pageNo,
          },
        ],
      };
      const { data, ok, msg } = await $selectList(url, req);
      if (ok) {
        if (Array.isArray(data) && data.length) {
          let list = [];
          data.forEach((item) => {
            if (typeof item.com_json === "string") {
              try {
                const json = JSON.parse(item.com_json);
                list.push({
                  _raw_data: item,
                  ...json,
                });
              } catch (e) {
                console.error(e);
              }
            }
          });
          return list;
        }
      } else if (msg) {
        this.$message.error(msg);
      } else {
        this.$message.info("无数据！");
      }
    },
    clickComponent(data) {
      this.currentId = data.id;
      this.currentItem = data;
    },
    currentChange(id, item) {
      this.currentId = id;
      this.currentItem = item;
    },
    componentsChange(val) {
      this.components = val;
    },

    onPageChange(val, type, compType, compId) {
      // this.refresh();
      return;
      if (!val?.fieldName?.includes("style")) {
        return;
      }
      if (type === "page-update") {
        let data = cloneDeep(val.formModel);
        this.initPageConfig(data);
      } else if (type === "component-update" || type === "component-add") {
        let id = val.formModel.id;
        if (id) {
          let component = this.findComponentById(this.components, id);
          if (component) {
            let value = val.value;
            let key = val.fieldName;
            if (key?.lastIndexOf("_json") === key.length - 5) {
              try {
                value = JSON.parse(value);
              } catch (e) {
                console.error(e);
              }
            }
            this.$set(component, key, value);
            if (component.data) {
              this.$set(component.data, key, value);
            }
          }
        }
      } else if (type === "component-cfg-update") {
        // 组件配置
        let id = compId;
        if (!id) {
          return;
        }
        let row = val.formModel;
        let component = this.findComponentById(this.components, id);
        if (!component?.data) {
          return;
        }
        switch (compType) {
          case "currentInfo": {
            this.$set(component.data, "current_info_json", row);
            if (row.interface_json) {
              this.$set(
                component.data,
                "page_com_interface_json",
                row.interface_json
              );
            }
            // if (row.current_info_json) {
            // m.current_info_json = JSON.parse(row.current_info_json);
            // if (m.current_info_json.interface_json) {
            //   m.page_com_interface_json = m.current_info_json.interface_json;
            // }
            // }
            break;
          }
          case "swiper": {
            this.$set(component.data, "swiper_json", row);

            // if (row.swiper_json) {
            //   m.swiper_json = JSON.parse(row.swiper_json);
            //   if (m.swiper_json.interface_json) {
            //     m.page_com_interface_json = m.swiper_json.interface_json;
            //   }
            // }
            break;
          }
          case "userList": {
            this.$set(component.data, "user_list_json", row);

            // if (row.user_list_json) {
            //   m.user_list_json = JSON.parse(row.user_list_json);
            //   if (m.user_list_json.interface_json) {
            //     m.page_com_interface_json = m.user_list_json.interface_json;
            //   }
            // }
            break;
          }
          case "noticeBar": {
            this.$set(component.data, "notice_bar_json", row);

            // if (row.notice_bar_json) {
            //   m.notice_bar_json = JSON.parse(row.notice_bar_json);
            //   if (m.notice_bar_json.interface_json) {
            //     m.page_com_interface_json = m.notice_bar_json.interface_json;
            //   }
            // }
            break;
          }
          case "list": {
            this.$set(component.data, "list_json", row);

            // if (row.list_json) {
            //   m.list_json = JSON.parse(row.list_json);
            //   if (m.list_json.interface_json) {
            //     m.page_com_interface_json = m.list_json.interface_json;
            //   }
            // }
            break;
          }
          case "grid": {
            this.$set(component.data, "grid_json", row);

            // if (row.grid_json) {
            //   m.grid_json = JSON.parse(row.grid_json);
            //   if (m.grid_json.interface_json) {
            //     m.page_com_interface_json = m.grid_json.interface_json;
            //   }
            // }
            break;
          }
          case "cardGroup": {
            this.$set(component.data, "card_group_json", row);

            // if (row.card_group_json) {
            //   m.card_group_json = JSON.parse(row.card_group_json);
            //   if (m.card_group_json.interface_json) {
            //     m.page_com_interface_json = m.card_group_json.interface_json;
            //   }
            // }
            break;
          }
          case "richTextCard": {
            this.$set(component.data, "rich_text_card_json", row);

            // if (row.rich_text_card_json) {
            //   m.rich_text_card_json = JSON.parse(row.rich_text_card_json);
            //   if (m.rich_text_card_json.interface_json) {
            //     m.page_com_interface_json = m.rich_text_card_json.interface_json;
            //   }
            // }
            break;
          }
          case "videoCard": {
            this.$set(component.data, "video_card_json", row);

            // if (row.video_card_json) {
            //   m.video_card_json = JSON.parse(row.video_card_json);
            //   if (m.video_card_json.interface_json) {
            //     m.page_com_interface_json = m.video_card_json.interface_json;
            //   }
            // }
            break;
          }
          case "map": {
            this.$set(component.data, "map_json", row);

            // if (row.map_json) {
            //   m.map_json = JSON.parse(row.map_json);
            //   if (m.map_json.interface_json) {
            //     m.page_com_interface_json = m.map_json.interface_json;
            //   }
            // }
            break;
          }
          case "chart": {
            this.$set(component.data, "chart_json", row);

            // if (row.chart_json) {
            //   m.chart_json = JSON.parse(row.chart_json);
            //   if (m.chart_json.interface_json) {
            //     m.page_com_interface_json = m.chart_json.interface_json;
            //   }
            // }
            break;
          }
          case "tabs": {
            this.$set(component.data, "tabs_json", row);

            // if (row.tabs_json) {
            //   m.tabs_json = JSON.parse(row.tabs_json);
            //   if (row.relate_pages_json) {
            //     m.tabs_json.relate_pages_json = JSON.parse(row.relate_pages_json);
            //   }
            //   if (m.tabs_json.interface_json) {
            //     m.page_com_interface_json = m.tabs_json.interface_json;
            //   }
            // } else {
            //   m.tabs_json = {};
            //   if (row.relate_pages_json) {
            //     m.tabs_json.relate_pages_json = JSON.parse(row.relate_pages_json);
            //   }
            // }

            break;
          }
          case "form": {
            this.$set(component.data, "form_json", row);

            // if (row.form_json) {
            //   m.form_json = JSON.parse(row.form_json);
            //   if (m.form_json.interface_json) {
            //     m.page_com_interface_json = m.form_json.interface_json;
            //   }
            // }
            break;
          }
          case "steps": {
            this.$set(component.data, "steps_json", row);

            // if (row.steps_json) {
            //   m.steps_json = JSON.parse(row.steps_json);
            // }
            break;
          }
          case "footer": {
            this.$set(component.data, "footer_json", row);

            // if (row.footer_json) {
            //   m.footer_json = JSON.parse(row.footer_json);
            // }
            break;
          }
          case "layout": {
            this.$set(component.data, "layout_json", row);

            // if (row.layout_json) {
            //   m.layout_json = JSON.parse(row.layout_json);
            // }
            break;
          }
          case "控件": {
            this.$set(component.data, "widget_json", row);

            // if (row.widget_json) {
            //   m.widget_json = JSON.parse(row.widget_json);
            // }
            break;
          }
          case "日历":
            this.$set(component.data, "calendar_json", row);

            // if (row.calendar_json) {
            //   m.calendar_json = JSON.parse(row.calendar_json);
            // }
            break;

          default:
            break;
        }
      }
    },
    async deleteComponent(ids = "") {
      if (!ids) return;
      return await this.$confirm("确定要删除此组件吗？").then(async () => {
        const loading = this.$loading({
          lock: this,
          text: "操作中...",
          spinner: "el-icon-loading",
          background: "rgba(0, 0, 0, 0.7)",
        });
        const { data, ok, msg } = await $delete({
          app: "config",
          service: "srvpage_cfg_page_component_delete",
          value: ids,
        });
        loading.close();
        if (ok) {
          this.$message.success(msg);
          this.getPageConfig();
        } else {
          this.$message.error(msg);
        }
      });
    },
    async onDel(val) {
      this.currentId = null;
      this.currentItem = null;
      if (val?.com_no && val.id) {
        let getCompIds = function (list) {
          let ids = [];
          if (Array.isArray(list) && list.length) {
            list.forEach((item) => {
              if (item.id && item.com_no) {
                ids.push(item.id);
              }
              if (item.children?.length) {
                ids = ids.concat(getCompIds(item.children));
              }
            });
          }
          return ids;
        };
        const ids = [val.id, ...getCompIds(val.children)];
        return await this.deleteComponent(ids);
      }
      function del(val, list) {
        list = list.filter((item) => {
          if (val.id && item.id === val.id) {
            return false;
          } else if (item.children?.length) {
            item.children = del(val, item.children);
          }
          return true;
        });
        return list;
      }
      this.components = del(val, this.components);
    },
    // 键盘事件处理
    handleKeyDown(e) {
      if (e.code === "Space") {
        if (!this.isSpacePressed) {
          this.isSpacePressed = true;
        }
        // 防止空格键触发页面滚动
        e.preventDefault();
      }
    },

    handleKeyUp(e) {
      if (e.code === "Space") {
        e.preventDefault();
        this.isSpacePressed = false;
        this.isDragging = false;
      }
    },
    // 鼠标事件处理
    handleMouseDown(e) {
      if (this.isSpacePressed) {
        this.isDragging = true;
        this.startX = e.clientX;
        this.startY = e.clientY;

        const container = this.$refs.editorContainer;
        if (container) {
          this.scrollLeft = container.scrollLeft;
          this.scrollTop = container.scrollTop;
        }

        // 修改鼠标样式为抓取状态
        this.editorContainerStyle = { cursor: "grabbing" };

        // 阻止默认行为和事件冒泡
        e.preventDefault();
        e.stopPropagation();
      }
    },

    handleMouseMove(e) {
      if (this.isDragging && this.isSpacePressed) {
        const container = this.$refs.editorContainer;
        if (container) {
          // 计算移动距离
          const dx = this.startX - e.clientX;
          const dy = this.startY - e.clientY;

          // 设置滚动位置
          container.scrollLeft = this.scrollLeft + dx;
          container.scrollTop = this.scrollTop + dy;
        }

        // 阻止默认行为和事件冒泡
        e.preventDefault();
        e.stopPropagation();
      }
    },
    handleMouseUp(e) {
      if (this.isDragging) {
        this.isDragging = false;
        // 恢复鼠标样式
        this.editorContainerStyle = {
          cursor: this.isSpacePressed ? "grab" : "default",
        };
      }
    },
  },
};
</script>

<style lang="scss">
::view-transition-new(root),
::view-transition-old(root) {
  /* 关闭默认动画 */
  animation: none;
}

.lowcode-wrapper {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  --bg-color: #fff;
  background-color: var(--bg-color);

  &.dark-mode {
    --bg-color: #1a1a1a;
    --primary-color: #4a90e2;
    --menu-bg-color: var(--primary-color);
    color: #ddd;

    .handle-btn {
      background-color: #333;
      border-color: #444;
      color: #ddd;

      &:hover,
      &.active {
        background-color: var(--primary-color);
        border-color: var(--primary-color);
        color: #fff;
      }

      &.theme-toggle-btn {
        .theme-icon {
          color: #fff;
        }
      }
    }

    .header-view {
      background-color: #2d2d2d;
      border-bottom-color: #444;
      color: #fff;

      ::v-deep .header-title {
        color: #fff;
      }
    }

    .lowcode-content {

      .materials-panel-container,
      .property-panel-container {
        background-color: #252525;
        box-shadow: 2px 0 5px rgba(0, 0, 0, 0.3);

        .materials-toggle,
        .property-toggle,
        .tab-content,
        .el-tabs__header,
        .el-tab-pane {
          background-color: #333;
          border-color: #444;

          .el-tabs__item.is-active {
            color: #fff;
            background-color: #222;
            border-color: #555;
          }
        }

        .form-view-wrapper {
          background-color: #2d2d2d;
          scrollbar-color: #444 #2d2d2d;

          .el-form>.el-row {
            border-color: #444;
          }

          .section-title {
            border-bottom-color: #444;
          }

          .raw_field_editor input {
            --custom-input-color: #ddd;
          }

          .el-autocomplete-suggestion {
            background-color: #2d2d2d;
            color: #ffffff;
          }

          .el-button {
            background-color: #333;
            border-color: #444;
            color: #dddddd;

            &.el-button--primary {}
          }

          .el-checkbox,
          .el-upload__tip {
            color: #dddddd;
          }

          .el-input-group__append {
            background-color: #333;
            border-color: #444;
          }

          .el-input__inner {
            background-color: #333;
            border-color: #444;
          }

          .el-upload--picture-card {
            background-color: #252525;
            border-color: #444;
          }
        }
      }

      .editor-container.in-edit {
        // background-color: #1e1e1e;
        background-color: #18181c;
        background-image: linear-gradient(#18181c 19px, transparent 0),
          linear-gradient(90deg, transparent 19px, #86909c 0);

        .drag-overlay {
          background-color: rgba(0, 0, 0, 0.2);
        }
      }

      ::v-deep .materials-view,
      ::v-deep .property-view {
        background-color: #252525;
        color: #ddd;

        .panel-title,
        .group-title {
          color: #fff;
        }

        .el-form-item__label {
          color: #ddd;
        }

        .el-input__inner,
        .el-textarea__inner {
          background-color: #333;
          border-color: #444;
          color: #ddd;
        }

        .el-button {
          background-color: #333;
          border-color: #444;
          color: #ddd;

          &.el-button--primary {
            background-color: var(--primary-color);
            border-color: var(--primary-color);
            color: #fff;
          }
        }
      }
    }

    ::v-deep .el-dialog {
      background-color: #2d2d2d;

      .el-dialog__title {
        color: #ddd;
      }

      .el-dialog__body {
        color: #ddd;
      }

      .preview-container {
        background-color: #1e1e1e;
      }
    }

    ::v-deep .el-drawer {
      background-color: #2d2d2d;
      color: #ddd;

      .el-tree {
        background-color: #2d2d2d;
        color: #ddd;

        .el-tree-node__content {
          background-color: #2d2d2d;

          &:hover {
            background-color: #333;
          }
        }

        .el-tree-node.is-current>.el-tree-node__content {
          background-color: #444;
        }
      }
    }

    .materia-warp,
    .component-list {
      background-color: #222;

      .type-list {
        scrollbar-color: rgba(144, 146, 152, 0.3) transparent;
        border-right-color: #000;

        .type-item {
          color: #ccc;

          &:hover {
            background-color: #333;
          }

          &.active {
            background-color: #444;
          }
        }
      }

      .com-item {
        background-color: #2d2d2d;
      }
    }

    .type-item,
    .sub-type-item {
      &:hover {
        background-color: #3d3d3d;
      }
    }
  }

  .handle-btn {
    display: inline-flex;
    margin: 0 10px 0 0;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    border: 1px solid #e8e8e8;

    &:hover {
      background-color: var(--menu-bg-light-color, #b3d8ff);
      border-color: var(--menu-light-border-color, #b3d8ff);
      color: var(--primary-color, #409eff);
    }

    &.active {
      background-color: var(--menu-bg-light-color, #b3d8ff);
      border-color: var(--menu-light-border-color, #b3d8ff);
      color: var(--primary-color, #409eff);
    }

    color: #666;
  }

  .editor-mode-switch {
    display: inline-flex;
    margin: 0 10px 0 0;

    .el-radio-group {
      display: flex;
    }

    .el-radio-button__inner {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  .lowcode-content {
    flex: 1;
    display: flex;
    height: calc(100% - 50px);

    // 添加物料面板容器样式
    .materials-panel-container {
      position: relative;
      width: var(--materials-panel-width, 300px); // 使用CSS变量控制宽度
      height: 100%;
      transition: all 0.3s ease;
      background-color: #fff;
      box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);

      &.collapsed {
        width: 0px !important; // 使用!important确保折叠状态下宽度为0

        .materials-view {
          transform: translateX(-100%);
          opacity: 0;
        }

        .materials-resizer {
          display: none;
        }
      }

      // 添加物料面板拖动调整宽度的分隔线样式
      .materials-resizer {
        position: absolute;
        top: 0;
        right: 0;
        width: 5px;
        height: 100%;
        cursor: col-resize;
        background-color: transparent;
        z-index: 10;

        &:hover {
          background-color: rgba(0, 0, 0, 0.1);
        }
      }

      .materials-toggle {
        position: absolute;
        right: -15px;
        top: 50%;
        transform: translateY(-50%);
        width: 15px;
        height: 40px;
        background-color: #fff;
        border-radius: 0 4px 4px 0;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
        z-index: 10;

        &:hover {
          background-color: #f5f7fa;
        }

        i {
          font-size: 12px;
          color: #909399;
        }
      }

      .materials-view {
        width: 100%;
        height: 100%;
        transition: all 0.3s ease;
        opacity: 1;
      }
    }

    .editor-container {
      flex: 1;
      transition: all 0.3s ease;

      // 添加以下样式，使容器可以获得焦点但不显示轮廓
      &:focus {
        outline: none;
      }
      /* 添加拖动遮罩层样式 */
      .drag-overlay {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 100%;
        background-color: transparent;
        z-index: 1000;
        background: rgba(100, 100, 100, 0.1);
        cursor: grabbing;
      }

      &.in-edit {
        transition: none;
        overflow: auto;
        padding: 60px;
        scrollbar-color: rgba(144, 146, 152, 0.3) transparent;
        scrollbar-width: thin;
        background-color: #f5f5f9;
        // #18181c 暗色
        background-size: 20px 20px, 20px 20px;
        background-image: linear-gradient(#f5f5f9 19px, transparent 0),
          linear-gradient(90deg, transparent 19px, #000 0);

        .editor-view {
          border: 1px dashed #666;
          min-height: 100vh;
        }
      }

      // 移动端视图样式
      &.mobile-view {
        display: flex;
        justify-content: center;
        .page-item {
          height: unset;
        }
        &.in-edit {
          .editor-view {
            width: 375px;
            min-height: 667px;
            max-width: 375px;
            margin: 0 auto;
            border: 1px solid #ddd;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            border-radius: 8px;
            overflow: hidden;
            background: #fff;
            overflow-y: auto;
            // 滚动条优化 - overlay 模式不占位置
            scrollbar-width: none;
            scrollbar-color: rgba(144, 146, 152, 0.3) transparent;
            
            // WebKit 浏览器滚动条样式
            &::-webkit-scrollbar {
              width: 6px;
              height: 6px;
            }
            
            &::-webkit-scrollbar-track {
              background: transparent;
            }
            
            &::-webkit-scrollbar-thumb {
              background-color: rgba(144, 146, 152, 0.3);
              border-radius: 3px;
              transition: background-color 0.2s;
              
              &:hover {
                background-color: rgba(144, 146, 152, 0.5);
              }
            }
            
            &::-webkit-scrollbar-corner {
              background: transparent;
            }
          }
        }
      }
      
      // 移动端模式样式
      &.mobile-mode {
        &.in-edit {
          .editor-view {
            // 移动端模式下组件扁平化排列
            .lc-container,
            .lc-block {
              width: 100% !important;
              margin: 0 !important;
            }
          }
        }
      }
    }

    // 属性面板容器样式，使用CSS变量控制宽度
    .property-panel-container {
      position: relative;
      width: var(--property-panel-width, 300px); // 使用CSS变量控制宽度
      height: 100%;
      transition: all 0.3s ease;
      background-color: #fff;
      box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);

      &.collapsed {
        width: 0px !important; // 使用!important确保折叠状态下宽度为0

        .property-view {
          transform: translateX(100%);
          opacity: 0;
        }

        .property-resizer {
          display: none;
        }
      }

      .el-form-item {
        display: flex;
        flex-direction: column;
      }

      // 添加属性面板拖动调整宽度的分隔线样式
      .property-resizer {
        position: absolute;
        top: 0;
        left: 0;
        width: 5px;
        height: 100%;
        cursor: col-resize;
        background-color: transparent;
        z-index: 10;

        &:hover {
          background-color: rgba(0, 0, 0, 0.1);
        }
      }

      .property-toggle {
        position: absolute;
        left: -15px;
        top: 50%;
        transform: translateY(-50%);
        width: 15px;
        height: 40px;
        background-color: #fff;
        border-radius: 4px 0 0 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
        z-index: 10;

        &:hover {
          background-color: #f5f7fa;
        }

        i {
          font-size: 12px;
          color: #909399;
        }
      }

      .property-view {
        width: 100%;
        height: 100%;
        transition: all 0.3s ease;
        opacity: 1;
      }
    }

    ::v-deep .customhome-container {
      height: 100%;
    }
  }

  .lc-layout {

    &.view-mode,
    &.preview-mode {

      .resize-handle-s,
      .resize-handles {
        display: none;
      }
    }

    &.preview-mode {
      border-color: #f5f7fa;
    }

    &.view-mode {
      border-color: transparent;
    }
  }

  .preview-container {
    border: 1px dashed #ccc;
    
    &.mobile-preview {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 20px;
      background: #f5f5f5;
      
      .lc-view {
        width: 375px;
        min-height: 667px;
        max-width: 375px;
        border: 1px solid #ddd;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border-radius: 8px;
        overflow: hidden;
        background: #fff;
      }
    }
  }
}

:deep(.outline-container) {
  .el-tree-node {
    &.is-current {
      .el-tree-node__content {
        background-color: #b3d4fc !important;
        /* 修改为你想要的背景颜色 */
        color: #333;
        /* 修改为你想要的字体颜色 */
      }
    }
  }
}

.custom-tree-node {
  display: flex;
  align-items: center;

  .right-btn {
    display: none;
  }

  &:hover {
    .right-btn {
      display: block;
    }
  }
}

/* 移动端预览弹窗样式 */
.mobile-preview-dialog {
  .el-dialog__body {
    padding: 0;
  }
  .el-dialog__header {
    padding-right: 16px;
    margin-bottom: 0!important;
  }
}

.open-new-tab-btn {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  font-size: 13px;
  color: #409eff;
  background: #ecf5ff;
  border-radius: 4px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #409eff;
    color: #fff;
  }

  .dark-mode & {
    color: #409eff;
    background: rgba(64, 158, 255, 0.15);

    &:hover {
      background: #409eff;
      color: #fff;
    }
  }
}

.mobile-preview-content {
  position: relative;
  width: 100%;
  height: 667px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f5f5;
}

.mobile-preview-iframe {
  width: 375px;
  height: 667px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: opacity 0.3s ease;
}

.iframe-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #666;
  font-size: 14px;
  z-index: 10;
  
  i {
    font-size: 24px;
    color: #409eff;
  }
}
</style>