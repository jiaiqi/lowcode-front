<template>
  <div class="property-pane">
    <el-tabs
      type="border-card"
      v-model="activeTab"
    >
      <el-tab-pane
        label="页面"
        name="页面"
        v-if="!currentItem"
      >
        <div class="tab-content">
          <legacy-form
            mode="simple-update"
            :service="pageService"
            :srv-app="appNo"
            :pk="pageId"
            @executor-complete="onPageUpdate"
            @form-loaded="onPageFormLoaded"
            ref="pageFormUpdate"
            v-if="pageId"
          >
          </legacy-form>
          <div v-else>请先保存</div>
        </div>
      </el-tab-pane>
      <!-- <template v-if="!currentItem && pageStyleCols && pageStyleCols.length">
        <el-tab-pane
          :label="item.label"
          :name="item.columns"
          v-for="item in pageStyleCols"
          :key="item.columns"
        >
          <div class="tab-content">
            <simple-update
              name="list-update"
              :navAfterSubmit="false"
              :service="item.option_list_v2.update_srv_cfg.srv"
              :pk="item.value"
              :app-no="item.option_list_v2.app || appNo"
              :pkCol="item.option_list_v2.refed_col"
              :group-collapse="true"
              @executor-complete="
                onStyleColUpdate($event, 'page-style-col-update', item)
              "
              @field-value-changed="
                onValueChange($event, 'page-style-col-update', item)
              "
              ref="pageStyleColUpdate"
              v-if="item.value"
            >
            </simple-update>
            <simple-add
              :service="item.option_list_v2.add_srv_cfg.srv"
              :defaultValues="{
                page_no: pageConfig.page_no,
                obj_type: '页面',
                owner_no: pageConfig.page_no,
              }"
              :navAfterSubmit="false"
              @executor-complete="
                onStyleColUpdate($event, 'page-style-col-add', item)
              "
              ref="pageStyleColAdd"
              v-else
            >
            </simple-add>
          </div>
        </el-tab-pane>
      </template> -->
      <el-tab-pane
        label="组件"
        name="组件"
        v-if="showPageCompForm"
        v-loading="componentLoading"
      >
        <legacy-form
          :key="compFormKey"
          ref="pageCompFormUpdate"
          mode="simple-update"
          :service="componentService"
          :srv-app="appNo"
          :pk="componentId"
          @executor-complete="onComponentUpdate"
          @form-loaded="onPageCompFormLoaded"
          v-if="componentId && (componentLoaded || activeTab === '组件')"
        >
        </legacy-form>
        <div v-else>请先保存</div>
      </el-tab-pane>

      <el-tab-pane
        label="组件配置"
        name="组件配置"
        v-if="showCompForm"
      >
        <legacy-form
          ref="compFormUpdate"
          mode="simple-update"
          :service="compServiceCfg.service"
          :srv-app="appNo"
          :pk="compServiceCfg.pk"
          @executor-complete="onComponentUpdate"
          @form-loaded="onCompFormLoaded"
          v-if="componentCfgLoaded || activeTab === '组件配置'"
        >
        </legacy-form>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import LegacyForm from "@/components/common/legacy-form.vue";
import dayjs from "dayjs";
import cloneDeep from "lodash/cloneDeep";
import { pageCompCols } from "./columns";
import cssEditor from "../cssEditor/index.vue";
import { safeEval } from "@/common/bx-util";
export default {
  components: {
    LegacyForm,
    cssEditor,
  },
  props: {
    pageConfig: {
      type: Object,
    },
    currentItem: {
      type: Object,
    },
    layout: Array,
    strLayout: String,
    appNo: {
      type: String,
      default: "config",
    },
    screeType: String,
    useLayout: Boolean, //使用布局容器，默认不使用
    components: Array,
  },
  watch: {
    currentItem: {
      immediate: true,
      deep: true,
      handler(newValue, oldValue) {
        if (newValue) {
          this.activeTab = "组件";
          this.setCompServiceCfg();
          this.pageLoading = false;
        } else {
          this.activeTab = "页面";
        }
      },
    },
    currentComponent: {
      immediate: true,
      deep: true,
      handler(newValue) {
        if (newValue?.id) {
          this.componentId = null;
          this.$nextTick(() => {
            this.componentId = newValue.id + "";
          });
        } else {
          this.componentId = null;
        }
      },
    },
    componentId(newValue, oldValue) {
      if (newValue && newValue !== oldValue) {
        this.componentLoading = true;
        this.layoutLoading = true;
        this.setCompServiceCfg();
        setTimeout(() => {
          this.componentLoading = false;
          this.layoutLoading = false;
        }, 3000);
      } else if (!newValue) {
        this.compServiceCfg = null;
      }
    },
  },
  computed: {
    showPageCompForm() {
      return (
        !!this.componentId ||
        (!this.componentId &&
          this.pageId &&
          this.currentItem?._type === "component")
      );
    },
    showCompForm() {
      return this.compServiceCfg?.service && this.compServiceCfg?.pk;
    },
    strLayoutObj() {
      if (this.strLayout) {
        return JSON.parse(this.strLayout);
      }
    },
    compFormModel() {
      return this.$refs?.pageCompFormUpdate?.formModel;
    },
    updateList() {
      let oldLayout = JSON.parse(this.strLayout);
      const updateList = this.layout.filter((item) => {
        if (item.id) {
          let newItem = oldLayout.find((e) => e.id === item.id);
          if (newItem) {
            return (
              newItem.w !== item.w ||
              newItem.h !== item.h ||
              newItem.x !== item.x ||
              newItem.y !== item.y
            );
          }
        }
      });
      return updateList.map((item) => {
        return {
          id: item.id,
          layout_width: item.w,
          layout_height: item.h,
          layout_x: item.x,
          layout_y: item.y,
        };
      });
    },
    // compServiceCfg() {

    // },
    screenType: {
      get() {
        return this.screeType;
      },
      set(val) {
        this.$emit("screenType", val);
      },
    },
    // 组件类型
    compType: {
      get() {
        return this.currentItem?.data?.com_type;
      },
    },
    showAddComponent() {
      return (
        this.currentItem?.com_type &&
        this.currentItem._seq &&
        !this.componentId &&
        this.pageId
      );
    },
    addCompDefaultValues() {
      let keys = pageCompCols;
      let obj = {};
      keys.forEach((item) => {
        obj[item] = this.currentItem.data[item];
      });
      return {
        ...obj,
        com_type: this.currentItem.com_type,
        page_no: this.pageConfig.page_no,
        com_seq: this.currentItem._seq,
      };
    },
    currentComponent() {
      return this.currentItem?.id && this.currentItem?.data;
    },
    pageId() {
      if (this.pageConfig?.id) {
        return this.pageConfig?.id + "";
      }
    },
    pageService() {
      return this.pageId ? `srvpage_cfg_page_update` : `srvpage_cfg_page_add`;
    },
    // componentId() {
    //   if (
    //     this.currentComponent?.id
    //     // && this.currentComponent?.com_type !== "layout"
    //   ) {
    //     return this.currentComponent?.id + "";
    //   } else {
    //     return false;
    //   }
    // },
    componentService() {
      if (this.componentId) {
        // update
        // return `srvpage_cfg_page_component_editor_update`;
        return `srvpage_cfg_page_component_update`;
      } else {
        // add
        return `srvpage_cfg_page_component_add`;
      }
    },
    layoutId() {
      if (this.currentItem?.id) {
        return this.currentItem?.id + "";
      }
    },
    layoutService() {
      if (this.layoutId) {
        return `srvpage_cfg_layout_update`;
      } else {
        return `srvpage_cfg_layout_add`;
      }
    },
  },
  data() {
    return {
      pageLoading: true,
      componentLoading: false,
      layoutLoading: false,
      activeTab: "页面",
      componentLoaded: false,
      pageLoaded: false,
      componentCfgLoaded: false,
      compServiceCfg: null,
      componentId: "",
      compFormKey: new Date().getTime(),
      pageStyleCols: [], // 页面表样式相关字段
      pageCompStyleCols: [], // 页面组件表样式相关字段
      compStyleCols: [], // 对应类型组件表样式相关字段
    };
  },
  methods: {
    onStyleColUpdate(event, type, item) {
      if (event.data.resultCode === "SUCCESS") {
        const data = event.data.response?.[0]?.response?.effect_data?.[0];
        const refMap = {
          "page-style-col-update": this.$refs.pageStyleColUpdate,
          "page-comp-style-col-update": this.$refs.pageCompStyleColUpdate,
          "comp-style-col-update": this.$refs.compStyleColUpdate,
          "page-style-col-add": this.$refs.pageStyleColAdd,
          "page-comp-style-col-add": this.$refs.pageCompStyleColAdd,
          "comp-style-col-add": this.$refs.compStyleColAdd,
        };

        switch (type) {
          case "page-style-col-update":
          case "page-comp-style-col-update":
          case "comp-style-col-update":
            // 样式更新 通知页面刷新
            this.$emit("refresh");
            break;
          case "page-style-col-add":
            // 页面相关样式创建 更新到页面表
            const { style_no } = data || {};
            this.updatePage(item.columns, style_no).then((res) => {
              if (res?.effect_rows) {
                // 参数更新到页面 通知页面刷新
                this.$emit("refresh");
              }
            });
            break;
          case "page-comp-style-col-add":
            // 页面组件相关样式创建 更新到页面组件表
            this.updatePageComp(item.columns, data.style_no).then((res) => {
              if (res?.effect_rows) {
                // 参数更新到页面 通知页面刷新
                this.$emit("refresh");
              }
            });
            break;
          case "comp-style-col-add":
            // 组件相关样式创建 更新到组件表
            this.updateComp(item.columns, data.style_no).then((res) => {
              if (res?.effect_rows) {
                // 参数更新到页面 通知页面刷新
                this.$emit("refresh");
              }
            });
            break;
          default:
            break;
        }
      }
    },
    async updatePage(col, val) {
      let updateObj = {
        serviceName: "srvpage_cfg_page_update",
        srvApp: "config",
        condition: [
          {
            ruleType: "eq",
            colName: "id",
            value: this.pageId,
          },
        ],
        data: [
          {
            [col]: val,
          },
        ],
      };
      if (!val) {
        return;
      }
      return await this.httpOperate("update", [updateObj]);
    },
    async updatePageComp(col, val) {
      const updateObj = {
        serviceName: "srvpage_cfg_page_component_update",
        srvApp: "config",
        condition: [
          {
            ruleType: "eq",
            colName: "id",
            value: this.componentId,
          },
        ],
        data: [
          {
            [col]: val,
          },
        ],
      };
      return await this.httpOperate("update", [updateObj]);
    },
    async updateComp(col, val) {
      const updateObj = {
        serviceName: this.compServiceCfg.service,
        srvApp: "config",
        condition: [
          {
            ruleType: "eq",
            colName: this.compServiceCfg.pkCol,
            value: this.compServiceCfg.pk,
          },
        ],
        data: [
          {
            [col]: val,
          },
        ],
      };
      return await this.httpOperate("update", [updateObj]);
    },
    getStyleColumns(refName = "") {
      const pageAllFields = this.$refs?.[refName]?.allFields || {};
      const formModel = this.$refs?.[refName]?.formModel || {};
      const whiteList = ["page_style_no", "style_no"];
      const keys = Object.keys(pageAllFields)
        .filter((item) => item.includes("style_no") && whiteList.includes(item))
        .filter((key) => {
          if (pageAllFields[key].vif === true) {
            if (pageAllFields[key]?.info?.xIf) {
              let row = formModel;
              // 原实现 eval("var zz=" + xIf + "(row); zz")，xIf 为函数表达式字符串（如
              // function(row){...} / (row)=>...），以 row 入参调用求值；此处经 safeEval
              // 注入 row 作用域执行，出错时返回 undefined（!!undefined=false，等价过滤掉该列）
              let ret = safeEval(
                "var zz=" + pageAllFields[key]?.info?.xIf + "(row); zz",
                { row }
              );
              return !!ret;
            }
            return true;
          }
        })
        .map((key) => {
          let obj = cloneDeep(pageAllFields[key]["info"]["srvCol"]);
          if (formModel[key]) {
            obj.value = formModel[key];
          }
          obj.key = `${obj.columns}_${dayjs().format("YYYY-MM-DD_HH:mm:ss")}`;
          obj.label = obj.label.replace("编码", "");
          return obj;
        });
      if (keys.length) {
        return keys;
      }
    },
    onPageFormLoaded() {
      this.pageLoading = false;
      this.pageLoaded = true;
      this.pageStyleCols = this.getStyleColumns("pageFormUpdate");
    },
    onPageCompFormLoaded() {
      this.componentLoading = false;
      this.componentLoaded = true;
      this.setCompServiceCfg();
      this.pageCompStyleCols = this.getStyleColumns("pageCompFormUpdate");
    },
    onCompFormLoaded() {
      // this.compStyleCols = this.getStyleColumns("compFormUpdate");
      this.componentCfgLoaded = true;
    },
    onValueChange(value, type) {
      this.$emit("page-change", value, type, this.compType, this.componentId);

      // 处理样式更新
      if (value?.fieldName?.includes("style_no")) {
        const styleUpdateMap = {
          "page-update": "pageFormUpdate",
          "component-update": "pageCompFormUpdate",
          // "component-cfg-update": "compFormUpdate",
        };

        const formRef = styleUpdateMap[type];
        if (formRef) {
          const styleColsKey = {
            "page-update": "pageStyleCols",
            "component-update": "pageCompStyleCols",
            // "component-cfg-update": "compStyleCols",
          }[type];

          this[styleColsKey] = this.getStyleColumns(formRef);
        }
      }
    },

    setCompServiceCfg() {
      if (this.componentLoaded) {
        const obj = {
          service: "",
          col: "",
          pkCol: "",
          pk: "",
        };
        switch (this.compType) {
          case "chart":
            obj.service = "srvpage_cfg_com_chart_update";
            obj.pkCol = "chart_no";
            break;
          case "swiper":
            obj.service = "srvpage_cfg_figure_swiper_update";
            obj.pkCol = "swiper_no";
            break;
          case "list": //列表
            obj.service = "srvpage_cfg_com_list_update";
            obj.pkCol = "list_no";
            break;
          case "描述列表": //描述列表
            obj.service = "srvpage_cfg_com_descriptions_update";
            obj.pkCol = "desc_list_no";
            break;
          case "grid": //宫格
            obj.service = "srvpage_cfg_com_grid_update";
            obj.pkCol = "grid_no";
            break;
          case "cardGroup": //卡片组
            obj.service = "srvpage_cfg_card_group_update";
            obj.col = "card_group_no";
            obj.pkCol = "cardg_no";
            break;
          case "map": //地图
            obj.service = "srvpage_cfg_com_map_update";
            obj.pkCol = "map_no";
            break;
          case "tabs": //
            obj.service = "srvpage_cfg_com_tabs_update";
            obj.pkCol = "tabs_no";
            break;
          case "控件": //
            obj.service = "srvpage_cfg_meta_col_widget_update";
            obj.pkCol = "widget_no";
            break;
          case "noticeBar": //通知条
            obj.service = "srvpage_cfg_com_notice_bar_update";
            obj.pkCol = "notice_bar_no";
            obj.col = "noticebar_no";
            break;
          case "tabs": //标签tabs
            obj.service = "srvpage_cfg_com_tabs_update";
            obj.pkCol = "tabs_no";
            break;
          case "form": //表单
            obj.service = "srvpage_cfg_com_form_update";
            obj.pkCol = "form_no";
            break;
          case "navBar": //导航栏
            obj.service = "srvpage_cfg_page_nav_bar_update";
            obj.col = "com_case_no";
            obj.pkCol = "nav_no";
            break;
          case "extPage": //外部页面
            obj.service = "srvpage_cfg_com_ext_page_update";
            obj.col = "com_case_no";
            obj.pkCol = "extp_no";
            break;
          case "卡片部件":
            obj.service = "srvpage_cfg_card_parts_update";
            obj.col = "card_parts_no";
            obj.pkCol = "card_parts_no";
            break;
        }
        obj.pk =
          this.$refs.pageCompFormUpdate?.formModel?.[obj.col || obj.pkCol];
        if (!obj.pk) {
          setTimeout(() => {
            this.setCompServiceCfg();
          }, 3000);
        }
        this.compServiceCfg = obj;
      }
    },
    async addComponent(componentData) {
      if (componentData?.id) {
        // 组件创建成功后创建对应布局
        const item = this.currentItem;
        let layout_name =
          componentData.com_name || componentData.com_label || "组件";
        layout_name += `_${item?.data?.com_type_name}_${dayjs().format(
          "YYYY-MM-DD HH:mm:ss"
        )}`;
        const addObj = {
          serviceName: "srvpage_cfg_layout_add",
          data: [
            {
              layout_party: "组件",
              parent_no: this.pageConfig.layout_no,
              seq: componentData.layout_seq,
              pos_x: item.x,
              pos_y: item.y,
              col_span: item.h,
              row_span: item.w,
              layout_name:
                item?.data?.com_type_name +
                "_" +
                dayjs().format("YYYY-MM-DD HH:mm:ss"),
            },
          ],
        };
        return await this.httpOperate("add", addObj);
      }
    },
    /**
     * 新建页面 不使用布局容器 直接创建组件 并且填充组件的坐标及宽高
     * @param {object} pageData
     */
    async createComponents(pageData) {
      // 新建页面 不使用布局容器 直接创建组件 并且填充组件的坐标及宽高
      const layout = this.layout.map((item) => {
        return {
          ...item,
          // 时间戳
          timestamp: Number((new Date().getTime() + "").slice(-9)),
        };
      });
      if (pageData?.id) {
        //创建子组件
        if (layout?.length === 0) {
          // 页面上没有组件 直接通知父组件刷新页面
          return true;
        }
        let addObj = {
          serviceName: "srvpage_cfg_page_component_add",
          srvApp: "config",
          data: [],
        };
        layout.forEach((item, i) => {
          addObj.data.push({
            com_name: item.data.chart_name,
            // com_preview: item.data.example,
            com_type: item.data.com_type,
            page_no: pageData.page_no,
            com_seq: (i + 1) * 100,
            layout_x: item.x,
            layout_y: item.y,
            layout_z: item.z,
            layout_width: item.w,
            layout_height: item.h,
          });
        });
        return await this.httpOperate("add", addObj);
      }
    },
    async addPage(pageData) {
      // 使用布局容器方式新建页面
      if (pageData?.id) {
        const layout = this.layout.map((item) => {
          return {
            ...item,
            // 时间戳
            timestamp: Number((new Date().getTime() + "").slice(-9)),
          };
        });
        if (layout?.length === 0) {
          // 页面上没有组件 直接通知父组件刷新页面
          return true;
        }
        const pageName = pageData.page_name || pageData.page_title;
        // 创建页面容器
        let addObj = {
          serviceName: "srvpage_cfg_layout_add",
          srvApp: "config",
          data: [
            {
              layout_party: "页面",
              layout_name: `${pageName}_${dayjs().format(
                "YYYY-MM-DD HH:mm:ss"
              )}`,
            },
          ],
        };
        const layoutInfo = await this.httpOperate("add", addObj, null, true);
        // 创建子容器
        addObj.data = [];
        layout.forEach((item, i) => {
          addObj.data.push({
            layout_party: "组件",
            parent_no: layoutInfo.layout_no,
            layout_name: `${item?.data?.com_type_name}_${i + 1
              }_${dayjs().format("YYYY-MM-DD HH:mm:ss")}`,
            seq: item.timestamp || i + 1, //改用时间戳做关联 相对更可靠
            pos_x: item.x,
            pos_y: item.y,
            col_span: item.h,
            row_span: item.w,
          });
        });
        await this.httpOperate("add", addObj);
        // 将页面布局编号更新到页面信息中
        const updateObj = {
          serviceName: "srvpage_cfg_page_update",
          srvApp: "config",
          condition: [
            {
              ruleType: "eq",
              colName: "id",
              value: pageData.id,
            },
          ],
          data: [
            {
              layout_no: layoutInfo.layout_no,
              app_no: this.appNo,
            },
          ],
        };
        await this.httpOperate("update", [updateObj], pageData.id);

        //创建子组件
        addObj = {
          serviceName: "srvpage_cfg_page_component_add",
          srvApp: "config",
          data: [],
        };
        layout.forEach((item, i) => {
          addObj.data.push({
            com_name: item.data.com_type_name,
            // com_preview: item.data.example,
            page_layout_no: layoutInfo.layout_no,
            com_type: item.data.com_type,
            page_no: pageData.page_no,
            com_seq: (i + 1) * 100,
            layout_seq: item.timestamp || i + 1, //改用时间戳做关联 相对更可靠
          });
        });
        await this.httpOperate("add", addObj);
        return layoutInfo;
      }
    },
    async httpOperate(type, o, id, returnData, returnChildren) {
      let params = [];
      switch (type) {
        case "add":
          params = [
            {
              serviceName: o.serviceName,
              srvApp: "config",
              data: o.data,
              duplicate: true,
            },
          ];
          break;
        case "update":
        case "batch_add":
          params = o;
          break;
        case "delete":
          params = [
            {
              serviceName: o.serviceName,
              srvApp: "config",
              condition: [{ colName: "id", ruleType: "in", value: id }],
            },
          ];
          break;
      }
      const loading = this.$loading({
        lock: this,
        text: "操作中...",
        spinner: "el-icon-loading",
        background: "rgba(0, 0, 0, 0.7)",
      });
      const response = await this.operate(params);
      loading.close();
      if (response.data.state === "SUCCESS") {
        if (type === "batch_add") {
          return response.data.response;
        }
        if (returnChildren) {
          return response.data.response[0].child_data_list;
        }
        if (returnData) {
          return response.data.response[0].response.effect_data[0];
        } else {
          return response.data.response[0].response;
        }
      } else {
        this.$message.error(response.body.resultMessage);
      }
    },
    clickSave() {
      this.$emit("save");
    },
    toPreview() {
      this.$emit("preview");
    },
    findNormalChild(list) {
      let result = [];
      if (Array.isArray(list) && list.length) {
        list.forEach((item) => {
          let data = item.response.effect_data[0];
          if (data?.com_type !== "layout") {
            result.push(data);
          } else if (Array.isArray(item?.child_data_list)) {
            result = result.concat(this.findNormalChild(item?.child_data_list));
          }
        });
      }
      return result;
    },
    findNormalComponents(list) {
      let result = [];
      if (Array.isArray(list) && list.length) {
        list.forEach((item) => {
          if (item?._type === "component" && item._editType === "add") {
            result.push(item);
          } else if (Array.isArray(item.children)) {
            let arr = this.findNormalComponents(item.children);
            if (arr.length) {
              result = result.concat(arr);
            }
          }
        });
      }
      return result;
    },
    updateNormalComponents(list = [], normalChildren = []) {
      let result = list.map((item) => {
        if (item?._type === "component") {
          let data = normalChildren.find((e) => e.id === item.id);
          if (data) {
            return {
              ...item,
              ...data,
            };
          } else {
            return {
              ...item,
            };
          }
        } else if (Array.isArray(item.children) && item.children.length) {
          return {
            ...item,
            children: this.updateNormalComponents(
              item.children,
              normalChildren
            ),
          };
        } else if (item?.type) {
          return {
            ...item,
          };
        }
      });
      return result;
    },
    findLayoutComponentsByType(list, type) {
      let result = [];
      if (!type) {
        return [];
      }
      if (Array.isArray(list) && list.length) {
        list.forEach((item) => {
          if (item?._editType === type) {
            result.push(item);
          } else if (Array.isArray(item?.children) && item?.children.length) {
            result = result.concat(
              this.findLayoutComponentsByType(item?.children, type)
            );
          }
        });
      }
      return result;
    },
    buildAddChildren(list) {
      const result = [];
      let keys = pageCompCols;
      if (Array.isArray(list) && list.length) {
        return list
          .filter((item) => !!item)
          .map((item, index) => {
            let data = {};
            keys.forEach((key) => {
              if (item[key]) {
                data[key] = item[key];
              }
            });
            let obj = {
              serviceName: "srvpage_cfg_page_component_add",
              condition: [],
              depend_keys: [
                {
                  type: "column",
                  add_col: "parent_no",
                  depend_key: "com_no",
                },
              ],
              data: [
                {
                  ...data,
                  page_no: this.pageConfig.page_no,
                  com_type: item.com_type,
                  com_name: item.com_name || item.comp_label || "",
                  com_seq: item.com_seq || item._seq || (index + 1) * 100,
                  child_data_list: item?.children?.length
                    ? this.buildAddChildren(item.children)
                    : [],
                },
              ],
            };
            return obj;
          });
      }
      return result;
    },
    buildAddComponentsReqData(list) {
      if (!list?.length) {
        return [];
      }
      let keys = pageCompCols;
      const result = list.map((item, index) => {
        let data = {};
        keys.forEach((key) => {
          if (item[key]) {
            data[key] = item[key];
          } else if(key === "com_name" && !data[key]){
            data[key] = item.comp_label || item.chart_name || "";
          }
        });
        let obj = {
          ...data,
          page_no: this.pageConfig.page_no,
          com_seq: item.com_seq || item._seq || (index + 1) * 100,
          child_data_list: item?.children?.length
            ? this.buildAddChildren(item.children)
            : [],
        };
        if (item?.position?.x && item?.position?.y) {
          obj.layout_x = item?.position?.x;
          obj.layout_y = item?.position?.y;
        }
        return obj;
      });
      return result;
    },
    async onSave() {
      if (Array.isArray(this.components) && this.components.length) {
        const oldComponents = cloneDeep(this.components);
        // 保存页面属性后删除在页面上移除的组件
        const deleteIds = this.findLayoutComponentsByType(
          oldComponents,
          "delete"
        ).map((item) => item.id);
        if (deleteIds?.length) {
          const deleteObj = {
            serviceName: "srvpage_cfg_page_component_delete",
          };
          await this.httpOperate("delete", deleteObj, deleteIds.toString());
        }
        const updateList = this.findLayoutComponentsByType(
          oldComponents,
          "update"
        );
        if (updateList?.length) {
          //更新页面组件 目前只有固定的几个key可以更新
          const updateKeys = [
            "com_seq",
            "layout_height",
            "layout_width",
            "layout_x",
            "layout_y",
            "parent_no",
          ];
          const updateObj = [];
          updateList.forEach((item) => {
            // 组装更新对象
            const data = {};
            updateKeys.forEach((key) => {
              if (item[key]) {
                data[key] = item[key];
              }
            });
            if (!Object.keys(data).length) {
              return;
            }
            const obj = {
              serviceName: "srvpage_cfg_page_component_update",
              // serviceName: "srvpage_cfg_page_component_editor_update",
              condition: [
                {
                  colName: "id",
                  ruleType: "eq",
                  value: item.id,
                },
              ],
              data: [data],
            };
            updateObj.push(obj);
          });
          await this.httpOperate("update", updateObj);
        }
        let addList = this.findLayoutComponentsByType(oldComponents, "add");
        if (addList?.length) {
          const normalChild = this.findNormalComponents(addList);

          if (Array.isArray(normalChild) && normalChild.length) {
            // todo 更新组件
            //  this.updateComponentNo()
            const resultComps = await this.insertComponents(
              this.pageConfig,
              normalChild
            );
            if (
              Array.isArray(resultComps) &&
              resultComps.length === normalChild.length
            ) {
              addList = this.updateNormalComponents(addList, resultComps);
            }
          }
          const addObj = {
            serviceName: "srvpage_cfg_page_component_add",
            data: this.buildAddComponentsReqData(addList),
            duplicate: true,
          };
          const addChildRes = await this.httpOperate(
            "add",
            addObj,
            null,
            false,
            true
          );
          // let normalChild = this.findNormalChild(addChildRes);
        }
        // this.$message.success("保存成功");
        return this.$emit("refresh");
        const addNormalComponents = this.findNormalComponents(oldComponents);
        if (addNormalComponents?.length) {
          // 先创建对应类型的组件 再创建页面组件
          await this.insertComponents(this.pageConfig, addNormalComponents);
        }
      }
    },
    async onPageUpdate(event, type) {
      if (event?.data?.state === "SUCCESS") {
        const response = event?.data?.response?.[0]?.response?.effect_data;
        if (Array.isArray(response) && response.length > 0) {
          const resData = response[0];
          if (type === "add") {
            // const res = null;
            // if (this.useLayout) {
            //   res = await this.addPage(resData);
            // } else {
            //   res = await this.insertComponents(resData, this.layout);
            // }
            // if (res) {
            //   this.$emit("refresh", resData);
            // }
            return;
          } else {
            await this.onSave();
            this.$emit("refresh", resData);
          }
        }
      }
    },
    // 更新组件的宽高以及定位
    async updateComponent(event) { },

    async saveLayoutStyle(data) {
      if (!data?.id) return;
      const loading = this.$loading({
        lock: true,
        text: "正在保存布局样式...",
        spinner: "el-icon-loading",
      });
      try {
        const currentComponent = this.components.find(c => c.id === data.id);
        let updateData = {};
        
        if (data.resizeType === "height") {
          updateData.layout_height = data.layoutHeight;
        } else {
          const currentStyleJson = currentComponent?.style_json
            ? (typeof currentComponent.style_json === "string"
              ? JSON.parse(currentComponent.style_json)
              : currentComponent.style_json)
            : {};
          const newStyleJson = { ...currentStyleJson, ...data.styleJson };
          updateData.style_json = JSON.stringify(newStyleJson);
        }
        
        const params = [
          {
            serviceName: "srvpage_cfg_page_component_update",
            srvApp: "config",
            condition: [
              {
                colName: "id",
                ruleType: "eq",
                value: data.id,
              },
            ],
            data: [updateData],
          },
        ];
        const response = await this.operate(params);
        loading.close();
        if (response.data.state === "SUCCESS") {
          this.$message.success("布局样式保存成功");
          this.$emit("refresh");
        } else {
          this.$message.error(response.data.resultMessage || "保存失败");
        }
      } catch (error) {
        loading.close();
        this.$message.error("保存失败: " + error.message);
      }
    },

    // 更新页面属性时同时创建新增的组件，以及对应的组件配置
    async insertComponents(pageData, layout) {
      if (pageData?.id) {
        //创建子组件
        if (layout?.length === 0) {
          // 页面上没有组件 直接通知父组件刷新页面
          return true;
        }
        let addCompArr = [];
        // 每次新增加组件类型之后要将组件表的自动生成编号字段加到componentNoKey中，创建组件的时候不能提交这个字段
        const componentNoKey = [
          "current_info_no",
          "chart_no",
          "swiper_no",
          "list_no",
          "desc_list_no",
          "grid_no",
          "cardg_no",
          "map_no",
          "tabs_no",
          "widget_no",
          "noticebar_no",
          "tabs_no",
          "form_no",
          "current_info_no",
          "userlist_no",
          "calendar_no",
          "card_layout_no",
          "nav_no",
          "extp_no", //外部链接
        ];
        const ignoreField = [
          ...componentNoKey,
          "component",
          "notice_bar_json",
          "tabs_json",
          "form_json",
          "map_json",
          "interface_json",
          "cols_map_json",
          "swiper_json",
          "widget_json",
          "srv_req_json",
          "list_json",
          "card_group_json",
          "sys_option",
          "chart_json",
          "com_type",
          "comp_label",
          "create_time",
          "com_no",
          "create_user",
          "create_user_disp",
          "del_flag",
          "id",
          "modify_time",
          "modify_user",
          "modify_user_disp",
          "row_json",
          "page_no",
          // "image",
          // "preview",
          "cellItem",
          "parentId",
          "",
        ];
        layout.forEach((item, i) => {
          const data = { ...item.data };
          ignoreField.forEach((key) => {
            if (data[key]) {
              delete data[key];
            }
          });
          Object.keys(data).forEach((key) => {
            if (key && key.indexOf("_") === 0) {
              delete data[key];
            }
            if (data[key] === "" || data[key] === null) {
              delete data[key];
            }
            if (
              key?.lastIndexOf("_json_data") > -1 &&
              typeof data[key] === "object"
            ) {
              delete data[key];
            }
          });
          let compObj = {
            serviceName: "",
            srvApp: "config",
            data: [data],
          };
          if (item._duplicate_id && typeof item._duplicate_id === "number") {
            compObj.duplicate = true;
            compObj.condition = [
              {
                colName: "id",
                ruleType: "eq",
                value: item._duplicate_id,
              },
            ];
          }
          switch (item.data.com_type) {
            case "chart":
              compObj.serviceName = "srvpage_cfg_com_chart_add";
              break;
            case "list":
              compObj.serviceName = "srvpage_cfg_com_list_add";
              break;
            case "描述列表":
              compObj.serviceName = "srvpage_cfg_com_descriptions_add";
              break;
            case "cardGroup":
              compObj.serviceName = "srvpage_cfg_card_group_add";
              break;
            case "控件":
            case "widget":
              compObj.serviceName = "srvpage_cfg_meta_col_widget_add";
              break;
            case "swiper":
              compObj.serviceName = "srvpage_cfg_figure_swiper_add";
              break;
            case "map":
              compObj.serviceName = "srvpage_cfg_com_map_add";
              break;
            case "noticeBar":
              compObj.serviceName = "srvpage_cfg_com_notice_bar_add";
              break;
            case "form": //表单
              compObj.serviceName = "srvpage_cfg_com_form_add";
              break;
            case "tabs": //
              compObj.serviceName = "srvpage_cfg_com_tabs_add";
              break;
            case "grid": //
              compObj.serviceName = "srvpage_cfg_com_grid_add";
              // compObj.serviceName = "srvpage_cfg_com_grid_update";
              // compObj.condition = [
              //   {
              //     colName: "grid_no",
              //     ruleType: "eq",
              //     value: data?.grid_no,
              //   },
              // ];
              break;
            case "navBar":
              compObj.serviceName = "srvpage_cfg_page_nav_bar_add";
              break;
            case "extPage":
              compObj.serviceName = "srvpage_cfg_com_ext_page_add";
              break;
            case "currentInfo":
              compObj.serviceName = "srvpage_cfg_com_current_info_update";
              compObj.condition = [
                {
                  colName: "current_info_no",
                  ruleType: "eq",
                  value: item?.current_info_no,
                },
              ];
              compObj.data = [{}];
              break;
            case "卡片部件":
              compObj.serviceName = "srvpage_cfg_card_parts_add";
              break;
            case "detail":
              compObj.serviceName = "srvpage_cfg_meta_col_widget_add";
              compObj.data = [{ widget_type: "文本" }];
              break;
            case "咨询入口":
              compObj.serviceName = "srvpage_cfg_meta_col_widget_add";
              compObj.data = [{ widget_type: "文本" }];
              break;
            case "大华视频监控":
              compObj.serviceName = "srvpage_cfg_meta_col_widget_add";
              compObj.data = [{ widget_type: "视频" }];
              break;
          }
          addCompArr.push(compObj);
        });
        let compRes = await this.httpOperate("batch_add", addCompArr);
        if (!compRes) {
          return false;
        }
        let componentsLength = 0;
        if (
          pageData.component_json &&
          typeof pageData.component_json === "string"
        ) {
          componentsLength = JSON.parse(pageData.component_json)?.length;
        }
        if (isNaN(componentsLength)) {
          componentsLength = 0;
        }
        const resultComps = [];
        layout.forEach((item, index) => {
          const comp = compRes[index]?.response?.effect_data?.[0];
          const data = {
            ...item,
          };
          if (!comp) {
            debugger;
            return;
          }
          switch (item.data.com_type) {
            case "chart":
              data.chart_no = comp?.chart_no;
              break;
            case "list":
              data.list_no = comp?.list_no;
              break;
            case "描述列表":
              data.desc_list_no = comp?.desc_list_no;
              break;
            case "cardGroup":
              data.card_group_no = comp?.cardg_no;
              break;
            case "控件":
            case "widget":
              data.widget_no = comp?.widget_no;
              break;
            case "swiper":
              data.swiper_no = comp?.swiper_no;
              // data.image = null;
              break;
            case "map":
              data.map_no = comp?.map_no;
              break;
            case "noticeBar":
              data.notice_bar_no = comp?.noticebar_no;
              break;
            case "form":
              data.form_no = comp?.form_no;
            case "tabs":
              data.tabs_no = comp?.tabs_no;
              break;
            case "grid":
              data.grid_no = comp?.grid_no;
              break;
            case "navBar":
              data.com_case_no = comp?.nav_no;
              break;
            case "extPage":
              data.com_case_no = comp?.extp_no;
              break;
            case "卡片部件":
              data.card_parts_no = comp?.card_parts_no;
              break;
          }
          resultComps.push(data);
        });
        return resultComps;
      }
    },
    onComponentUpdate(event, type) {
      if (type === "add" && event?.data?.state === "SUCCESS") {
        // 组件创建成功
        // 编辑页面，新增组件
        const response = event?.data?.response?.[0]?.response?.effect_data;
        if (Array.isArray(response) && response.length > 0) {
          const resData = response[0];
          this.$emit("refresh", resData);
          this.activeTab = "页面";
          return;
        }
      } else {
        this.$emit("refresh", "component", event);
      }
      this.compFormKey = new Date().getTime();
    },
    onLayoutUpdate(event) {
    },
    onUpdateFormActionComplete(event) {
    },
    onUpdateFormLoaded(event) {
      this.pageLoading = false;
    },
  },
};
</script>

<style lang="scss" scoped>
.property-pane {
  width: 300px;

  ::v-deep .form-view-wrapper {
    max-height: calc(100vh - 150px);
    overflow-y: auto;
  }
}

.el-tabs {
  width: 100%;
  height: calc(100vh - 50px);
  // padding-bottom: 50px;
  overflow: hidden;
  border: none;

  // .tab-content{
  //   height: 100%;
  //   overflow-y: auto;
  // }
  ::v-deep .el-tab-pane {
    height: 100%;
  }

  ::v-deep .el-tabs--border-card {}

  ::v-deep .el-tabs__content {
    height: 100%;
    overflow-y: auto;
    padding: 0;
  }

  ::v-deep .el-form {
    .el-col {
      width: 100%;
    }
  }

  ::v-deep .el-form-item__label {
    text-align: left !important;
  }

  ::v-deep .el-form-item__content {
    margin-left: 0 !important;
  }
}
</style>