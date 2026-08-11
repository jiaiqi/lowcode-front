<template>
  <div class="app_home">
    <!--信息头部-->
    <div class="app_header">
      <div class="app_other">
        <!-- 组件大纲和JSON查看按钮 -->
        <div
          @click.stop="jsonVisible = true"
          class="handle-btn"
          title="组件json"
        >
          <i class="el-icon-document"></i>
        </div>
        <div
          @click.stop="outlineVisible = true"
          class="handle-btn"
          title="组件大纲"
        >
          <i class="el-icon-menu"></i>
        </div>
      </div>
      <div class="app_name">
        <span v-if="pageConfig">
          {{ pageConfig.page_name }}
        </span>
      </div>
      <div class="app_bts">
        <li><el-button
            type="primary"
            size="mini"
            @click="initPage"
          >刷新</el-button></li>
        <li><el-button
            type="primary"
            size="mini"
            @click="onSave"
            :loading="isSaving"
          >保存</el-button></li>
        <li>
          <el-button
            type="primary"
            size="mini"
            @click="showPreview"
          ><i class="el-icon-view"></i>预览</el-button>
        </li>
      </div>
    </div>
    <!--编辑区容器-->
    <div class="app_content">
      <div :class="materialsCollapsed ? 'app_left_act' : 'app_left'">
        <!--收缩框控制器-->
        <div
          class="materials-toggle"
          @click="setToggle('mater')"
        >
          <i :class="materialsCollapsed ? 'el-icon-arrow-right' : 'el-icon-arrow-left'
            "></i>
        </div>
        <materials-view
          v-show="!materialsCollapsed"
          @drag-start="onDragStart"
          @drag-end="onDragEnd"
        />
      </div>
      <div class="app_center">
        <div class="app_edit_main" @click.stop="handleComponentClick()">
          <RenderPage
            @componentClick="handleComponentClick"
            @UpdateComponents="UpdateComponents"
            :components="components"
            :current-id="currentId"
            :isPreview="false"
            ref="editRef"
            @ComponentsSwapped="ComponentsSwapped"
            :key="renderPageKey"
          />
        </div>
      </div>
      <div :class="propertyCollapsed ? 'app_right_act' : 'app_right'">
        <div
          class="property-toggle"
          @click="setToggle('pro')"
        >
          <i :class="propertyCollapsed ? 'el-icon-arrow-left' : 'el-icon-arrow-right'
            "></i>
        </div>
        <property-view
          class="property-view-app"
          app-no="config"
          :page-config="pageConfig"
          :key="pageRefreshKey"
          :current-item="currentItem"
          :current-id="currentId"
          :components="components"
          ref="propertyRef"
          @refresh="onRefresh"
          v-if="!propertyCollapsed"
        />
      </div>
    </div>
    
    <!-- JSON预览弹窗 -->
    <el-drawer
      title="页面JSON预览"
      :visible.sync="jsonVisible"
      direction="ltr"
      size="500px"
      :with-header="false"
    >
      <json-viewer
        :value="components"
        expanded
        :expand-depth="5"
        :copyable="{ copyText: '复制', copiedText: '已复制' }"
      ></json-viewer>
    </el-drawer>
    
    <!-- 组件大纲弹窗 -->
    <el-drawer
      title="组件大纲"
      :visible.sync="outlineVisible"
      direction="ltr"
      size="500px"
      :modal="false"
      class="outline-container"
    >
      <el-tree
        :highlight-current="true"
        :default-expand-all="true"
        :expand-on-click-node="false"
        :current-node-key="currentId"
        :data="outlineTree"
        :props="outlineTreeProps"
        @node-click="clickComponent"
      >
        <span
          class="custom-tree-node"
          style="width: 100%; display: flex"
          slot-scope="{ node, data }"
        >
          <span style="flex: 1">{{ node.label }}</span>
        </span>
      </el-tree>
    </el-drawer>
  </div>
</template>

<script>
import MaterialsView from "@/pages/low-app/app-materials/index.vue";
import { $selectList, $selectOne } from "@/common/http";
import { pageCompCols } from "@/pages/lowcode/components/property/columns";
import RenderPage from "@/pages/low-app/editor-home/render-page.vue";
import dragStore from "@/pages/low-app/app-materials/store/dragStore";
import PropertyView from "@/pages/low-app/app-materials/property/index.vue";
import debounce from "lodash/debounce";
import JsonViewer from "vue-json-viewer";
import "vue-json-viewer/style.css";
import cloneDeep from "lodash/cloneDeep";
export default {
  name: "app-home",
  components: {
    MaterialsView,
    RenderPage,
    PropertyView,
    JsonViewer
  },
  data() {
    return {
      // 保存按钮状态
      isSaving: false,
      components: [],
      materialsCollapsed: false,
      propertyCollapsed: false,
      pageRefreshKey: new Date().getTime(),
      renderPageKey: new Date().getTime(),
      pageNo: null,
      draggingComponentType: null, //拖拽组件类型
      pageConfig: null,
      currentId: '',
      currentItem: null,
      positionChange: [],
      // 弹窗控制状态
      jsonVisible: false, //json视图
      outlineVisible: false, //大纲视图
    }
  },
  computed: {
    // 组件大纲树属性配置
    outlineTreeProps() {
      return {
        label: "com_name",
        children: "children",
      };
    },
    // 组件大纲树数据
    outlineTree() {
      return this.components || [];
    },
  },
  created() {
    this.pageNo = this.$route.query.pageNo || this.$route.params.pageNo;
    if (this.pageNo) {
      this.initPage();
    }
  },
  methods: {
    //获取被交换位置的组件信息
    ComponentsSwapped(list) {
      this.positionChange = list;
    },
    //实时刷新
    onRefresh() {
      setTimeout(() => {
        this.initPage();
        this.pageRefreshKey = new Date().getTime();
        this.renderPageKey = new Date().getTime();
        // 通过ref调用RenderPage的刷新方法
        if (this.$refs.editRef && this.$refs.editRef.refresh) {
          this.$refs.editRef.refresh(this.components);
        }
      }, 150);
    },
    //实时更新更新组件列表
    UpdateComponents(newComponents) {
      this.components = newComponents;
    },
    //防抖方式的保存
    onSave: debounce(function () {

      // 1. 看页面属性有没有发生变化 有的话先保存页面属性
      if (this.isSaving) return; // 如果正在保存，则不重复执行

      this.isSaving = true;

      const savePromise = this.$refs?.propertyRef?.handleSave();

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

    //组件被点击了
    handleComponentClick(list, val) {
      if(!val){
        this.currentId = '';
        this.currentItem = null;
        return;
      }
      this.currentId = val.com_no ? val.id : null;
      this.currentItem = val || null;
    },
    //预览
    showPreview() {
      const url = process.env.NODE_ENV === "development" ? `http://113.201.21.178:880/xmp/views/custom/index/index?page_no=${this.pageNo}` : `/xmp/views/custom/index/index?page_no=${this.pageNo}`;
      window.open(url, "_blank");
    },
    //容器收缩板
    setToggle(type) {
      if (type === 'mater') {
        this.materialsCollapsed = !this.materialsCollapsed;
      } else {
        this.propertyCollapsed = !this.propertyCollapsed;
      }
    },
    //组件开始拖拽
    onDragStart(data) {
      this.draggingComponentType = data.type;
      // 设置拖拽组件信息到dragStore
      dragStore.setDraggingElement(data);
    },
    //组件拖拽结束
    onDragEnd() {
      this.draggingComponentType = null;
    },
    //初始化界面信息
    async initPage() {
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
        // this.initComponents(newData);
        // this.getPageComponents().then((list) => {
        //   if(Array.isArray(list)){
        //     this.initComponents(list);
        //   }
        // });
        await this.initComponents(newData);
        this.pageRefreshKey = new Date().getTime();
      } else if (msg) {
        this.$message.error(msg);
      } else {
        this.$message.info("无数据！");
      }
    },

    async initComponents(data) {
      const list = await this.getPageComponents();
      const component_json = list?.map((item) => {
        item.visible = item.display !== "否";
        if (item.com_type !== 'layout') {
          item.component = "page-item";
          if (item.com_option?.includes("悬浮可拖动")) {
            item.component = "float-component";
          }
        }
        item.data = {};
        pageCompCols.forEach((col) => {
          if (item[col]) {
            item.data[col] = item[col];
          }
        });
        if (item.id) {
          item.data.id = item.id;
        }
        const keys = ["component", "type", "_type"];
        keys.forEach((key) => {
          if (item.data[key]) {
            delete item.data[key];
          }
        });
        return item;
      });
      if (!Array.isArray(component_json)) {
        this.components = [];
        return;
      } else {
        this.components = component_json.filter(item => item.com_type !== 'layout');
      }
    },
    //获取界面组件信息
    async getPageComponents() {
      const url = `/config/select/srvpage_cfg_page_component_select`;
      const req = {
        serviceName: "srvpage_cfg_page_component_select",
        colNames: ["*"],
        condition: [
          {
            colName: "display",
            ruleType: "ne",
            value: "否",
          },
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
    //初始化界面配置详情
    initPageConfig(data) {
      Object.keys(data).forEach((key) => {
        if (key && data[key] && key.indexOf("_json") !== -1) {
          try {
            data[`${key}_data`] = JSON.parse(data[key]);
          } catch (e) {
            console.error(e);
          }
        }
      });
      this.pageConfig = data;
      // 使用Vuex初始化主题
      if (data?.app_json_data) {
        let currentTheme = data.app_json_data.current_theme;
        if (
          localStorage.currentTheme &&
          localStorage.getItem("currentTheme") !== currentTheme
        ) {
          currentTheme = localStorage.getItem("currentTheme");
        }
        if (!currentTheme && data?.app_json_data?.theme_list) {
          currentTheme = data.app_json_data.theme_list[0].name;
        }
        // this.initTheme({
        //   currentTheme: currentTheme,
        //   themeList: data.app_json_data.theme_list || [],
        // });
      }

      return data;
    },
    // 点击组件大纲中的组件
    clickComponent(data) {
      this.currentId = data.id;
      this.currentItem = data;
      // 关闭大纲弹窗
      this.outlineVisible = false;
    },
  }
}
</script>


<style scoped lang="scss">
@use "app-home.scss";
</style>