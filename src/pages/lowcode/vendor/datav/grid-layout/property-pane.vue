<template>
  <div class="property-pane">
    <el-tabs type="border-card" v-loading="pageLoading" v-model="activeTab">
      <el-tab-pane label="页面" name="页面">
        <div class="tab-content">
          <simple-update
            name="list-update"
            :defaultValues="pageConfg"
            :navAfterSubmit="false"
            :service="pageService"
            :pk="pageId"
            pkCol="id"
            @executor-complete="onPageUpdate"
            @form-loaded="pageLoading = false"
            v-if="pageId"
          >
          </simple-update>
          <simple-add
            :service="pageService"
            :navAfterSubmit="false"
            @executor-complete="onPageUpdate($event, 'add')"
            @form-loaded="pageLoading = false"
            @submitted2mem=""
            v-else
          >
          </simple-add>
        </div>
      </el-tab-pane>
      <el-tab-pane
        label="组件"
        name="组件"
        v-if="componentId || (!componentId && pageId && currentItem)"
        v-loading="componentLoading"
      >
        <simple-update
          ref="compFormUpdate"
          name="list-update"
          :service="componentService"
          :navAfterSubmit="false"
          :pk="componentId"
          pkCol="id"
          @action-complete="onComponentUpdate"
          @form-loaded="
            (componentLoading = false),
              (componentLoaded = true),
              setCompServiceCfg()
          "
          v-if="componentId"
        >
        </simple-update>
        <simple-add
          ref="compForm"
          :pageName="'list-duplicate'"
          :service="componentService"
          :defaultValues="addCompDefaultValues"
          @executor-complete="onComponentUpdate($event, 'add')"
          @form-loaded="componentLoading = false"
          :navAfterSubmit="false"
          @submitted2mem=""
          v-else-if="showAddComponent"
        >
        </simple-add>
      </el-tab-pane>
      <el-tab-pane
        label="组件配置"
        name="组件配置"
        v-if="compServiceCfg && compServiceCfg.service && compServiceCfg.pk"
      >
        <simple-update
          name="list-update"
          :service="compServiceCfg.service"
          :navAfterSubmit="false"
          :pk="compServiceCfg.pk"
          :pkCol="compServiceCfg.pkCol"
          @action-complete="onComponentUpdate"
        >
        </simple-update>
      </el-tab-pane>
      <el-tab-pane label="布局" name="布局" v-if="useLayout">
        <div style="padding: 20px">
          <el-switch
            v-model="screentype"
            active-text="移动端"
            inactive-text="PC端"
            active-value="mobile"
            inactive-value="PC"
          >
          </el-switch>
        </div>
        <div
          style="
            padding: 20px;
            height: calc(100% - 80px);
            display: flex;
            justify-content: center;
            align-items: flex-end;
          "
        >
          <el-button
            size="mini"
            type="primary"
            style="margin-right: 10px"
            @click="clickSave"
            >保存</el-button
          >
          <el-button
            size="mini"
            type="primary"
            style="margin: 10px 10px 0 0"
            @click="toPreview"
            >预览</el-button
          >
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import simpleUpdate from "@/components/common/simple-update.vue";
import simpleAdd from "@/components/common/simple-add.vue";
import dayjs from "dayjs";

export default {
  components: {
    simpleUpdate,
    simpleAdd,
  },
  props: {
    pageConfg: {
      type: Object,
    },
    currentItem: {
      type: Object,
    },
    layout: Array,
    strLayout: String,
    appNo: String,
    screeType: String,
    useLayout: Boolean, //使用布局容器，默认不使用
  },
  watch: {
    currentItem: {
      handler(newValue, oldValue) {
        if (newValue) {
          this.activeTab = "组件";
          this.setCompServiceCfg();
        } else {
          this.activeTab = "页面";
        }
      },
    },
    componentId(newValue, oldValue) {
      // if (newValue && !oldValue) {
      //   this.activeTab = "组件";
      // } else if (!newValue && oldValue) {
      //   this.activeTab = "页面";
      // }
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
    strLayoutObj() {
      if (this.strLayout) {
        return JSON.parse(this.strLayout);
      }
    },
    compFormModel() {
      return this.$refs?.compFormUpdate?.formModel;
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
    screentype: {
      get() {
        return this.screeType;
      },
      set(val) {
        this.$emit("screentype", val);
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
        this.currentItem?.data &&
        this.currentItem.i &&
        !this.componentId &&
        this.pageId
      );
    },
    addCompDefaultValues() {
      return {
        com_type: this.currentItem.data.com_type,
        page_no: this.pageConfg.page_no,
        page_layout_no: this.pageConfg.layout_no,
        com_seq: (Number(this.currentItem.i) + 1) * 100,
        layout_seq: Number((new Date().getTime() + "").slice(-9)),
      };
    },
    currentComponent() {
      return this.currentItem?.id && this.currentItem?.data;
    },
    pageId() {
      if (this.pageConfg?.id) {
        return this.pageConfg?.id + "";
      }
    },
    pageService() {
      return this.pageId ? `srvpage_cfg_page_update` : `srvpage_cfg_page_add`;
    },
    componentId() {
      if (this.currentComponent?.id) {
        return this.currentComponent?.id + "";
      } else {
        return false;
      }
    },
    componentService() {
      if (this.componentId) {
        // update
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
      compServiceCfg: null,
    };
  },
  methods: {
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
        }
        obj.pk = this.$refs.compFormUpdate?.formModel?.[obj.col || obj.pkCol];
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
              parent_no: this.pageConfg.layout_no,
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
            com_preview: item.data.example,
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
            layout_name: `${item?.data?.com_type_name}_${
              i + 1
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
            com_preview: item.data.example,
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
    async httpOperate(type, o, id, returnData) {
      let params = [];
      switch (type) {
        case "add":
          params = [
            {
              serviceName: o.serviceName,
              srvApp: "config",
              data: o.data,
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

      const response = await this.operate(params);
      if (response.data.state === "SUCCESS") {
        if (type === "batch_add") {
          return response.data.response;
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
    async onPageUpdate(event, type) {
      console.log("onPageUpdate", event, type);
      if (event?.data?.state === "SUCCESS") {
        const response = event?.data?.response?.[0]?.response?.effect_data;
        if (Array.isArray(response) && response.length > 0) {
          const resData = response[0];
          if (type === "add") {
            const res = null;
            if (this.useLayout) {
              res = await this.addPage(resData);
            } else {
              res = await this.insertComponents(resData, this.layout);
            }
            if (res) {
              this.$emit("refresh", resData);
            }
            return;
          } else {
            if (this.strLayout) {
              // 保存页面属性后删除在页面上移除的组件
              let oldLayout = JSON.parse(this.strLayout);
              let deleteIds = oldLayout
                .filter(
                  (item) =>
                    item?.id && !this.layout.find((e) => e.id === item.id)
                )
                .map((item) => item.id);
              if (deleteIds?.length) {
                const deleteObj = {
                  serviceName: "srvpage_cfg_page_component_delete",
                };
                await this.httpOperate(
                  "delete",
                  deleteObj,
                  deleteIds.toString()
                );
              }
              // 更新页面属性，同时更新宽高以及定位变化的组件
              const updateList = this.layout.filter((item) => {
                if (item.id) {
                  let newItem = oldLayout.find((e) => e.id === item.id);
                  if (newItem) {
                    return (
                      newItem.w !== item.w ||
                      newItem.h !== item.h ||
                      newItem.x !== item.x ||
                      newItem.y !== item.y ||
                      newItem.z !== item.z
                    );
                  }
                }
              });
              if (updateList?.length) {
                const updateObj = updateList.map((item) => {
                  return {
                    serviceName: "srvpage_cfg_page_component_update",
                    condition: [
                      {
                        colName: "id",
                        ruleType: "eq",
                        value: item.id,
                      },
                    ],
                    data: [
                      {
                        layout_width: item.w,
                        layout_height: item.h,
                        layout_x: item.x,
                        layout_y: item.y,
                        layout_z: item.z,
                      },
                    ],
                  };
                });
                await this.httpOperate("update", updateObj);
              }
            }
            //更新页面属性，同时创建新增的组件
            const list = this.layout.filter(
              (item) => item.isLeftBarItem === true
            );
            if (list?.length) {
              await this.insertComponents(resData, list);
            }
          }
        }
      }
      this.$emit("refresh", "page", event);
    },
    // 更新组件的宽高以及定位
    async updateComponent(event) {},

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
        ];
        const ignoreField = [
          ...componentNoKey,
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
          "image",
        ];
        layout.forEach((item, i) => {
          const data = { ...item.data };
          ignoreField.forEach((key) => {
            if (data[key]) {
              delete data[key];
            }
          });
          Object.keys(data).forEach((key) => {
            if (data[key] === "" || data[key] === null) {
              delete data[key];
            }
          });
          const compObj = {
            serviceName: "",
            srvApp: "config",
            data: [data],
          };
          switch (item.data.com_type) {
            case "chart":
              compObj.serviceName = "srvpage_cfg_com_chart_add";
              break;
            case "list":
              compObj.serviceName = "srvpage_cfg_com_list_add";
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
              compObj.serviceName = "srvpage_cfg_com_grid_update";
              compObj.condition = [
                {
                  colName: "grid_no",
                  ruleType: "eq",
                  value: data?.grid_no,
                },
              ];
              break;
            case "navBar":
              compObj.serviceName = "srvpage_cfg_page_nav_bar_add";
              break;
          }
          addCompArr.push(compObj);
        });
        let compRes = await this.httpOperate("batch_add", addCompArr);

        let addObj = {
          serviceName: "srvpage_cfg_page_component_add",
          srvApp: "config",
          data: [],
        };
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
        layout.forEach((item, index) => {
          const comp = compRes[index]?.response?.effect_data?.[0];
          const data = {
            com_name: item.data.chart_name,
            com_preview: item.data.example,
            com_type: item.data.com_type,
            page_no: pageData.page_no,
            com_seq: (index + 1 + componentsLength) * 100,
            layout_x: item.x,
            layout_y: item.y,
            layout_z: item.z,
            layout_width: item.w,
            layout_height: item.h,
          };
          switch (item.data.com_type) {
            case "chart":
              data.chart_no = comp?.chart_no;
              break;
            case "list":
              data.list_no = comp?.list_no;
            case "描述列表":
              data.desc_list_no = comp?.desc_list_no;
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
          }
          addObj.data.push(data);
        });
        return await this.httpOperate("add", addObj);
      }
    },
    onComponentUpdate(event, type) {
      console.log("onComponentUpdate", event);
      if (type === "add" && event?.data?.state === "SUCCESS") {
        // 组件创建成功
        // 编辑页面，新增组件
        const response = event?.data?.response?.[0]?.response?.effect_data;
        if (Array.isArray(response) && response.length > 0) {
          const resData = response[0];
          if (this.useLayout) {
            this.addComponent(resData).then((res) => {
              if (res) {
                this.$emit("refresh", resData);
                this.activeTab = "页面";
              }
            });
          } else {
            this.$emit("refresh", resData);
            this.activeTab = "页面";
          }
          return;
        }
      }
      this.$emit("refresh", "component", event);
    },
    onLayoutUpdate(event) {
      console.log("onLayoutUpdate", event);
    },
    onUpdateFormActionComplete(event) {
      console.log("onUpdateFormActionComplete", event);
    },
    onUpdateFormLoaded(event) {
      this.pageLoading = false;
      console.log("onUpdateFormLoaded", event);
    },
  },
};
</script>

<style lang="scss" scoped>
.property-pane {
  ::v-deep .form-view-wrapper {
    max-height: calc(100vh - 110px);
    overflow-y: auto;
  }
}
.el-tabs {
  width: 100%;
  height: calc(100vh - 2px);
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

  ::v-deep .el-tabs--border-card {
  }

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
