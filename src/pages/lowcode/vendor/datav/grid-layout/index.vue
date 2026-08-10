<template>
  <div class="customhome-container" :style="'--right-width:' + rightWidth + 'px'" @dragenter="dragDefFn($event)"
    @dragover="dragDefFn($event)">
    <div class="cushome-sidebar" v-if="!isDataview">
      <!-- <component-pane @set-list="comList2 = $event"></component-pane>
      <div class="component-list">
        <div v-for="item in comList2" :key="item.id" class="com-item margin component">
          <img src="" alt="" class="example" @drag="drag(item)" @dragend="dragend(item)" draggable="true"
            unselectable="on">
          <div class="label">{{ item.comp_label }}</div>
        </div>
      </div> -->
      <div v-for="pageItem in comList" :key="pageItem.id" @drag="drag(pageItem)" @dragend="dragend(pageItem)"
        class="com-item margin component" draggable="true" unselectable="on">
        <img :src="getImagePath(pageItem.example)" alt="" style="display: inline-block; width: 100%" />
        <span>{{ pageItem.com_type_name }}</span>
        <span>{{ pageItem.com_type }}</span>
      </div>
    </div>
    <div class="cushome-right" v-if="!isDataview">
      <div class="left-line" id="left-line"></div>
      <property-pane :pageConfg="pageConfg" :appNo="appNo" :scree-type="screenType" :currentItem="currentItem"
        :layout="layout" @save="clickSave" @preview="toPreview" @refresh="initPage" @screentype="screenType = $event"
        v-if="showPane"></property-pane>
      <template v-else>
        <el-input size="small" v-model="pageName" clearable placeholder="请输入页面名称"></el-input>
        <el-input size="small" v-model="pageTitle" clearable placeholder="请输入页面标题" style="margin-top: 10px"></el-input>
        <el-button size="mini" type="primary" style="float: right; margin-top: 10px" @click="clickSave">保存</el-button>
        <el-button size="mini" type="primary" style="float: right; margin: 10px 10px 0 0"
          @click="toPreview">预览</el-button>
      </template>
    </div>
    <div class="cushome-content" id="content" :style="[]" :class="{ 'data-view-mode': isDataview }">

      <div class="custom-design" id="custom-design" :style="[stylefn(styleJson)]" v-if="screenType === 'PC'">
        <grid-layout ref="gridlayout" :layout.sync="layout" :col-num="colNum"
          :breakpoints="{ lg: 1920, md: 1200, sm: 996, xs: 768, xxs: 480 }"
          :cols="{ lg: 1920, md: 1200, sm: 996, xs: 768, xxs: 480 }" :row-height="1" :preventCollision="true"
          :responsive="true" :is-draggable="!isDataview" :is-resizable="!isDataview" :is-mirrored="false"
          :vertical-compact="false" :margin="[0, 0]" :use-css-transforms="true" @layout-updated="layoutUpdatedEvent">
          <div class="grid-container" id="grid-container" :style="[bjStyles]"></div>
          <grid-item v-for="item in layout" :x="item.x" :y="item.y" :w="item.w" :h="item.h" :i="item.i" :key="item.i"
            @moved="movedEvent" @resized="resizedEvent" class="gridItem" @dblclick.native="toComponentDetail(item)">
            <span class="remove" @click.stop="removeItem(item.i)" v-if="!isDataview"><i class="el-icon-close"></i></span>
            <div v-if="item.isLeftBarItem" class="com-item dashed" :class="{ 'active': item.i === curDesign }"
              @click.stop.prevent.capture="changeDesign(item.i)">
              <img :src="getImagePath(item.data.example)" alt="" style="display: inline-block; width: 100%" />
            </div>
            <div class="com-item dashed" v-else-if="isDataview">
              <page-item ref="pageItem" @setPageParams="setPageParams" :pageParamsModel="pageParamsModel"
                :page-item="item.data" :layout="item" @click.stop="" @resize="resize"></page-item>
            </div>
            <div class="com-item dashed" :class="{ 'active': item.i === curDesign }" v-else
              @click.stop.prevent.capture="changeDesign(item.i)">
              <page-item ref="pageItem" @setPageParams="setPageParams" :pageParamsModel="pageParamsModel"
                :page-item="item.data" :layout="item"></page-item>
            </div>
          </grid-item>
        </grid-layout>
      </div>
      <div class="custom-design" id="custom-design" v-else-if="screenType === 'mobile'"
        style="width: 375px;height: 667px;margin-top: 5vh;overflow-y:auto;overflow-x: hidden;">
        <grid-layout ref="gridlayout" :layout.sync="layout" :col-num="colNum"
          :breakpoints="{ lg: 1920, md: 1200, sm: 996, xs: 768, xxs: 480 }"
          :cols="{ lg: 1920, md: 1200, sm: 996, xs: 768, xxs: 480 }" :row-height="1" :preventCollision="true"
          :responsive="true" :is-draggable="!isDataview" :is-resizable="!isDataview" :is-mirrored="false"
          :vertical-compact="false" :margin="[0, 0]" :use-css-transforms="true" @layout-updated="layoutUpdatedEvent">
          <div class="grid-container" id="grid-container" :style="[bjStyles]"></div>
          <grid-item v-for="item in layout" :x="item.x" :y="item.y" :w="item.w" :h="item.h" :i="item.i" :key="item.i"
            @moved="movedEvent" @resized="resizedEvent" class="gridItem" @dblclick.native="toComponentDetail(item)">
            <span class="remove" @click.stop="removeItem(item.i)" v-if="!isDataview"><i class="el-icon-close"></i></span>
            <div v-if="item.isLeftBarItem" class="com-item dashed" :class="{ 'active': item.i === curDesign }"
              @click.stop.prevent.capture="changeDesign(item.i)">
              <img :src="getImagePath(item.data.example)" alt="" style="display: inline-block; width: 100%" />
            </div>
            <div class="com-item dashed" v-else-if="isDataview">
              <page-item ref="pageItem" @setPageParams="setPageParams" :pageParamsModel="pageParamsModel"
                :page-item="item.data" :layout="item" @click.stop="" @resize="resize"></page-item>
            </div>
            <div class="com-item dashed" :class="{ 'active': item.i === curDesign }" v-else
              @click.stop.prevent.capture="changeDesign(item.i)">
              <page-item ref="pageItem" @setPageParams="setPageParams" :pageParamsModel="pageParamsModel"
                :page-item="item.data" :layout="item"></page-item>
            </div>
          </grid-item>
        </grid-layout>
      </div>
      <div v-if="screenType === 'mobile' && pgNo" style="text-align: center;margin-top: 50px;">
        <el-button @click="previewMobile">预览</el-button>
      </div>
    </div>

    <!-- 移动组件 start -->
    <div class="moveCon d-flex" v-if="moveShow" :style="moveStyle">
      <i class="rowIcon el-icon-folder-remove"></i>
      <div class="item-name">{{ moveData.title }}</div>
    </div>
    <!-- 移动组件 end -->
  </div>
</template>

<script>
import dayjs from "dayjs";
import { getFullBaseUrl } from "@/common/common";
import { GridLayout, GridItem } from "vue-grid-layout";
import PageItem from "../component/page-item/page-item.vue";
import propertyPane from "./property-pane.vue";
import componentPane from "./left-pane/component-pane.vue";
import { formatStyleData } from "../common/index.js";
import { $http } from "@/common/http.js";
let mouseXY = { x: null, y: null };
let DragPos = { x: null, y: null, w: 1, h: 1, i: null };


// 页面参数
import pageParams from '../common/params/page-params-mixin.js'

export default {
  name: "pageEditor",
  mixins: [pageParams],
  components: {
    GridLayout,
    GridItem,
    PageItem,
    propertyPane,
    componentPane
  },
  data() {
    return {
      screenType: "PC",
      rightWidth: 340,
      isDown: false,
      contentData: {},
      isFullScreen: false,
      pageConfg: {},
      containerWidth: 800,
      colNum: 40,
      pgNo: "",
      pageId: "",
      appNo: "",//应用编号
      pageName: "可视化配置",
      pageTitle: "可视化配置页",
      // styleJson: null,
      parentLayoutNo: "",
      layoutObj: null,
      strLayout: "",
      layoutJson: null,
      comJson: [],
      comList: [],
      comList2: [],
      designData: { layoutCon: [], layoutData: [] }, //容器内容
      bjStyles: {}, //栅格样式
      curDesign: "", //点击容器组件样式
      rowheight: 30, //默认一格高度
      moveShow: false, //显示移动元素
      moveStyle: {}, //显示移动元素的位置
      mouseFalg: false, //按下的开关
      mouseLeft: 0, //鼠标距离x轴位置
      mouseTop: 0, //鼠标距离y轴位置
      designLeft: 0, //自定义容器距离x轴位置
      designTop: 0, //自定义容器距离y轴位置
      moveData: {}, //元素内容
      layout: [
        // i: 元素的ID（如果位置重叠，使用id体现元素先后顺序）
        // x: 元素位于第几列（可配置初始位置）
        // y: 元素位于第几行（可配置初始位置）
        // w: 元素的初始宽度（值为colWidth的倍数，最大值12/24）
        // h: 元素的初始高度（值为rowHeight的倍数，值任意大）
        // { "x": 0, "y": 0, "w": 4, "h": 12, "i": "0", type: 'videoCard' },
        // { "x": 5, "y": 0, "w": 6, "h": 6, "i": "1", type: 'currentInfo' },
      ],
    };
  },
  created() {
    this.getComList();
    if (this.$route.query.appNo) {
      this.appNo = this.$route.query.appNo;
    }
    if (this.$route.query.pageNo || this.$route.params?.no) {
      this.pgNo = this.$route.query.pageNo || this.$route.params?.no;
      this.initPage();
    }
  },
  mounted() {
    if (this.$route.query.screenType) {
      this.screenType = this.$route.query.screenType
    }
    document.addEventListener(
      "dragover",
      function (e) {
        mouseXY.x = e.clientX;
        mouseXY.y = e.clientY;
      },
      false
    );

    this.initDesign();

    this.moveMousemove();
    this.moveMouseup();
    this.initColNum();

    document.getElementById('custom-design').onclick = (e) => {
      this.curDesign = "";
    };
    if (!process?.env?.NODE_ENV === "development") {
      // 开发模式不监听窗口变化
      if (this.isDataview) {
        window.addEventListener('resize', () => {
          this.resize();
        })
      }
    }

    setTimeout(() => {
      if (this.needLogin) {
        // location.href = '/main/login.html'
      }
    }, 3000);
  },
  computed: {
    styleJson() {
      let json = this.pageConfg?.page_row_json_data?.page_style_json
      if (!json) {
        json = {
          width: this.screenType == 'PC' ? '1920px' : '375px',
          height: this.screenType == 'PC' ? '1080px' : '667px',
        }
      }
      if (this.isDataview && (json?.width || json?.height)) {
        delete json.width
        delete json.height
      }
      return json
    },
    showPane() {
      return true
      return process?.env?.NODE_ENV === "development";
    },
    isDataview() {
      // 预览模式
      return this.$route?.name === "gridview" || this.$route?.meta?.view===true;
    },
    showFullScreen() {
      return (
        this.pageConfg?.page_options &&
        this.pageConfg?.page_options.indexOf("全屏按钮") > -1
      );
    },
    needLogin() {
      return (
        this.pageConfg?.page_options &&
        this.pageConfg?.page_options.indexOf("先登录") > -1 &&
        sessionStorage.getItem("logined") !== "true"
      );
    },
    initWH() {
      let containerWidth = this.containerWidth || 800;
      return {
        w: 100,
        h: 80,
        // w: containerWidth / 4,
        // h: containerWidth / 8,
      };
    },
    currentItem() {
      return this.layout.find((item) => item.i === this.curDesign);
    },
  },
  watch: {
    layout: {
      immediate: true,
      deep: true,
      handler(newValue, oldValue) {
        // console.log(newValue);
      },
    },
  },
  methods: {
    previewMobile() {
      window.open(`/h5/#/views/custom/index/index?page_no=${this.pgNo}`)
    },
    resize() {
      // 自适应缩放
      if (!this.isDataview) {
        // 编辑状态不缩放
        return
      }
      let element = document.getElementById("custom-design");
      let resizeFull = () => {
        const windowWidth = window.innerWidth;
        const windowheight = window.innerHeight;
        if (!window.screen.height || !window.screen.width)
          return resizeFullBak();
        let ratioX = windowWidth / window.screen.width;
        let ratioY = windowheight / window.screen.height;
        let contentData = this.contentData;
        let dashboard_width = parseFloat(contentData.width);
        let dashboard_height = parseFloat(contentData.height);
        if (window.screen.width / dashboard_width < 1) {
          ratioX = (ratioX * window.screen.width) / dashboard_width;
        }
        if (window.screen.height / dashboard_height < 1) {
          ratioY = (ratioY * window.screen.height) / dashboard_height;
        }
        document.body.style = `width:${contentData.width};height:${contentData.height};overflow-y:hidden;transform:scale(${ratioX}, ${ratioY});transform-origin: left top; background-size: 100% 100%;`;
      };
      let resizeFullBak = () => {
        let ratioX = windowWidth / document.body.innerWidth;
        let ratioY = windowheight / document.body.innerHeight;
        let dashboard_width = parseFloat(contentData.width);
        let dashboard_height = parseFloat(contentData.height);
        if (window.screen.width / dashboard_width < 1) {
          ratiox = (ratio * window.screen.width) / dashboard_width;
        }
        if (window.screen.height / dashboard_height < 1) {
          ratiox = (ratio * window.screen.height) / dashboard_height;
        }
        document.body.style = `width:${contentData.width};height:${contentData.height};transform: scale(${ratioX},${ratioY});transform-origin: left top;background-size: 100%  ${ratioY}`;
      };
      resizeFull();
    },
    initColNum() {
      let containerWidth = document.getElementById("custom-design").offsetWidth;
      this.colNum = containerWidth;
    },
    stylefn(style) {
      if (style) {
        let res = formatStyleData(style);
        return res;
      }
    },
    // 跳转到预览页面
    toPreview() {
      window.open(window.location.hash.replace("/editor/", "/view/"));
    },
    clickSave() {
      if (this.layout.length === 0) {
        this.$message.error("画布为空！");
        return;
      }

      this.$confirm("是否确认保存", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.saveFn();
        })
        .catch(() => {
          // 已取消
        });
    },
    async saveFn() {
      let addObj = {};
      const layout = this.layout.map(item => {
        return {
          ...item,
          timestamp: Number((new Date().getTime() + '').slice(-9))
        }
      })
      // 新增保存
      if (!this.pgNo) {

        // 布局容器
        addObj = {
          serviceName: "srvpage_cfg_layout_add",
          data: [
            {
              layout_party: "页面",
              layout_name:
                this.pageName + dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
            },
          ],
        };
        const layoutInfo = await this.saveService("add", addObj, null, true);
        // 子容器
        addObj.data = [];
        layout.forEach((item, i) => {
          addObj.data.push({
            layout_party: "组件",
            parent_no: layoutInfo.layout_no,
            layout_name:
              this.pageName +
              dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss") +
              "-" +
              i,
            seq: item.timestamp || i + 1,
            pos_x: item.x,
            pos_y: item.y,
            col_span: item.h,
            row_span: item.w,
          });
        });
        await this.saveService("add", addObj);

        // 页面
        addObj = {
          serviceName: "srvpage_cfg_page_add",
          data: [
            {
              page_name: this.pageName,
              page_title: this.pageTitle,
              layout_no: layoutInfo.layout_no,
            },
          ],
        };
        const pageNo = await this.saveService("add", addObj, null, true);
        // 组件
        addObj = {
          serviceName: "srvpage_cfg_page_component_add",
          data: [],
        };
        layout.forEach((item, i) => {
          addObj.data.push({
            com_name: item.data.com_type_name,
            com_preview: item.data.example,
            page_layout_no: layoutInfo.layout_no,
            com_type: item.data.com_type,
            page_no: pageNo.page_no,
            com_seq: (i + 1) * 100,
            layout_seq: item.timestamp || i + 1,
          });
        });
        this.saveService("add", addObj);
      } else {
        // 编辑保存
        // 子容器
        const parseLayout = JSON.parse(this.strLayout || "[]");
        // 删除的子容器id数组
        let arrLayoutDel = [];
        // add子容器入参
        let addLayout = {
          serviceName: "srvpage_cfg_layout_add",
          data: [],
        };
        // update子容器入参
        let arrUpdateLayout = [];
        // delete子容器入参
        let deleteLayout = {
          serviceName: "srvpage_cfg_layout_delete",
        };

        let arrComDel = [];
        let addCom = {
          serviceName: "srvpage_cfg_page_component_add",
          data: [],
        };
        let deleteCom = {
          serviceName: "srvpage_cfg_page_component_delete",
        };
        // 更新、删除布局容器
        if (Array.isArray(parseLayout) && parseLayout.length) {
          parseLayout.forEach((oldItem) => {
            let isDel = true;
            layout.forEach((item, i) => {
              if (oldItem.id === item.id) {
                isDel = false;
                if (
                  oldItem.x !== item.x ||
                  oldItem.y !== item.y ||
                  oldItem.h !== item.h ||
                  oldItem.w !== item.w
                ) {
                  // x y h w 有任意一个发生变化，则更新
                  const data = {};
                  // x y h w 在服务端对应的字段
                  const keyMap = {
                    x: "pos_x",
                    y: "pos_y",
                    h: "col_span",
                    w: "row_span",
                  };
                  Object.keys(keyMap).forEach((key) => {
                    if (oldItem[key] !== item[key]) {
                      data[keyMap[key]] = item[key];
                    }
                  });
                  arrUpdateLayout.push({
                    serviceName: "srvpage_cfg_layout_update",
                    srvApp: "config",
                    condition: [
                      {
                        colName: "id",
                        ruleType: "eq",
                        value: item.id,
                      },
                    ],
                    data: [data],
                  });
                }
              }
            });
            if (isDel) {
              // 删除
              arrLayoutDel.push(oldItem.id);
              arrComDel.push(oldItem.data.id);
            }
          });
        }

        layout.forEach((item, i) => {
          if (!item.id) {
            // 新增容器
            addLayout.data.push({
              layout_party: "组件",
              parent_no: this.parentLayoutNo,
              layout_name:
                this.pageName +
                dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss") +
                "-" +
                i,
              seq: i + 1,
              pos_x: item.x,
              pos_y: item.y,
              col_span: item.h,
              row_span: item.w,
            });
          }
        });
        // 子容器
        if (arrLayoutDel.length > 0) {
          await this.saveService("delete", deleteLayout, arrLayoutDel.join());
        }
        if (addLayout.data.length > 0) {
          // 新增子容器
          this.layoutObj = await this.saveService("add", addLayout, null, true);
        }
        if (arrUpdateLayout.length > 0) {
          await this.saveService("update", arrUpdateLayout);
        }

        layout.forEach((item, i) => {
          if (!item.id) {
            // 新增组件
            addCom.data.push({
              com_name: item.data.com_type_name,
              com_preview: item.data.example,
              page_layout_no: this.layoutObj.layout_no,
              com_type: item.data.com_type,
              page_no: this.pgNo,
              com_seq: (i + 1) * 100,
              layout_seq: item.timestamp || i + 1,
            });
          }
        });

        // 组件
        if (arrComDel.length > 0) {
          await this.saveService("delete", deleteCom, arrComDel.join());
        }
        if (addCom.data.length > 0) {
          await this.saveService("add", addCom);
        }

        this.layout = [];
        this.initPage();
      }
    },
    async saveService(type, o, id, isTrue) {
      let params = [];
      switch (type) {
        case "add":
          params = [
            {
              serviceName: o.serviceName,
              srvApp: "config",
              condition: [],
              data: o.data,
            },
          ];
          break;
        case "update":
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

      const response = await this.operate(params)
      if (response.data.state === "SUCCESS") {
        if (isTrue) {
          return response.data.response[0].response.effect_data[0];
        } else {
          return response.data.response[0].response;
        }
      } else {
        this.$message.error(response.body.resultMessage);
      }
    },
    getLayoutNo(data) {
      return data.reduce((p, v) =>
        Date.parse(p.create_time) < Date.parse(v.create_time) ? v : p
      ).layout_no;
    },
    getPageNo(data) {
      return data.reduce((p, v) =>
        Date.parse(p.create_time) < Date.parse(v.create_time) ? v : p
      ).page_no;
    },
    async initPage(data) {
      if (data?.page_no) {
        this.pgNo = data.page_no
      }
      this.layout = []
      const url = `/config/select/srvpage_cfg_page_guest_select`;
      const req = {
        serviceName: "srvpage_cfg_page_guest_select",
        colNames: ["*"],
        condition: [
          {
            colName: "page_no",
            ruleType: "eq",
            value: this.pgNo,
          },
        ],
      };
      const res = await $http.post(url, req);
      if (
        res.data.state === "SUCCESS" &&
        Array.isArray(res.data.data) &&
        res.data.data.length > 0
      ) {
        let data = res.data.data[0];
        Object.keys(data).forEach((key) => {
          if (key && key.indexOf("_json") !== -1) {
            try {
              data[`${key}_data`] = JSON.parse(data[key]);
            } catch (e) {
              //TODO handle the exception
            }
          }
        });
        let page_row_json_data = data.page_row_json_data;

        this.pageId = data.id;
        this.pageName = page_row_json_data.page_name;
        this.pageTitle = page_row_json_data.page_title;
        this.comJson = page_row_json_data.component_json || [];
        this.pageConfg = data;

        // this.styleJson = page_row_json_data.page_style_json;
        // if (!this.styleJson) {
        //   this.styleJson = {
        //     width: this.screenType == 'PC' ? '1920px' : '375px',
        //     height: this.screenType == 'PC' ? '1080px' : '667px',
        //   }
        // }
        this.contentData = {
          width: this.styleJson?.width || (this.screenType === 'mobile' ? '375px' : '1920px'),
          height: this.styleJson?.height || (this.screenType === 'mobile' ? '667px' : '1080px'),
        }
        // if (this.isDataview) {
        //   delete this.styleJson.width;
        //   delete this.styleJson.height;
        // }
        if (!this.comJson) return;
        this.comJson.forEach((com, i) => {
          this.comList.forEach((list) => {
            if (list.com_type === com.com_type) {
              this.comJson[i].example = list.example;
            }
          });
        });
        this.parentLayoutNo = data.layout_no;

        this.layoutJson = data.layout_json_data;
        this.comJson = this.comJson.sort((a, b) => a.layout_seq - b.layout_seq);
        this.layoutJson.parts_json = this.layoutJson.parts_json.sort(
          (a, b) => a.seq - b.seq
        );
        this.layoutJson.parts_json.forEach((item, index) => {
          // const data = this.comJson.find(e=>e.layout_seq===item.seq);
          const data = this.comJson[index];
          let obj = {
            x: item.pos_x,
            y: item.pos_y,
            w: item.row_span,
            h: item.col_span,
            i: item.id || new Date().getTime(), // item.seq - 1
            // i: index, // item.seq - 1
            layout_no: item.layout_no,
            data,
            isLeftBarItem: false,
            id: item.id,
          };

          this.layout.push(obj);
        });
        this.strLayout = JSON.stringify(this.layout);
        this.$set(this, 'loadPageMata', data)  // 保存页面元数据
        this.initPageParams()  // 页面参数初始化
      } else {
        this.$message.info("无数据！");
      }
    },
    // 对应Vue生命周期的created
    layoutCreatedEvent(newLayout) {
      // console.log("Created layout: ", newLayout)
    },
    // 对应Vue生命周期的beforeMount
    layoutBeforeMountEvent(newLayout) {
      // console.log("beforeMount layout: ", newLayout)
    },
    // 对应Vue生命周期的mounted
    layoutMountedEvent(newLayout) {
      // console.log("Mounted layout: ", newLayout)
    },
    // 当完成mount中的所有操作时生成的事件
    layoutReadyEvent(newLayout) {
      // console.log("Ready layout: ", newLayout)
    },
    // 更新事件（布局更新或栅格元素的位置重新计算）
    layoutUpdatedEvent(newLayout) {
      // console.log("Updated layout: ", newLayout)
      // this.layout = newLayout;
      // this.layout.forEach((item) => {
      //   if (item.i === i) {
      //     item.x = newX;
      //     item.y = newY;
      //   }
      // });
    },
    // 移动时的事件
    moveEvent(i, newX, newY) {
      // console.log("MOVE i=" + i + ", X=" + newX + ", Y=" + newY);
    },
    // 调整大小时的事件
    resizeEvent(i, newH, newW, newHPx, newWPx) {
      // console.log("RESIZE i=" + i + ", H=" + newH + ", W=" + newW + ", H(px)=" + newHPx + ", W(px)=" + newWPx);
    },
    // 移动后的事件
    movedEvent(i, newX, newY) {
      // this.layout.forEach((item) => {
      //   if (item.i === i) {
      //     item.x = newX;
      //     item.y = newY;
      //   }
      // });
      // console.log("MOVED i=" + i + ", X=" + newX + ", Y=" + newY);
    },
    // 调整大小后的事件
    resizedEvent(i, newH, newW, newHPx, newWPx) {
      // this.layout.forEach((item, index) => {
      //   this.$refs?.pageItem?.[index]?.onResize?.(item.data.timestamp);
      // });
    },
    toComponentDetail(item) {
      if (!this.isDataview && item?.data?.id) {
        this.$confirm(`是否打开组件【${item.data.com_name}】详情？`, "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        }).then((action) => {
          if (action === "confirm") {
            window.open(
              `${getFullBaseUrl()}/detail/srvpage_cfg_page_component_select/${item.data.id}?srvApp=config`
            );
          }
        });
      }
    },
    //点击容器某一个组件
    changeDesign(idx) {
      console.log(idx);
      if (this.curDesign == idx) {
        return;
      }
      this.curDesign = idx;
    },
    //删除自定义组件布局
    deleteDesignCon(id) {
      this.deleteOnlyData(id);
      this.addClass(id, "no");
    },
    //删除容器里某一条数据
    deleteOnlyData(id) {
      let idx = this.filterData(id);
      this.designData.layoutCon.splice(idx, 1);
      this.designData.layoutData.splice(idx, 1);
    },
    //鼠标按下
    moveMouseDown(data, ev) {
      this.moveData = data;
      if (!this.haveData()) {
        this.mouseFalg = true;
        this.moveStyle = {
          top: ev.clientY + "px",
          left: ev.clientX + "px",
        };
        this.mouseLeft = ev.clientX;
        this.mouseTop = ev.clientY;
      } else {
      }
    },
    //自定义布局容器是否有当前数据
    haveData() {
      let flag = false;
      for (let i = 0, len = this.designData.layoutCon.length; i < len; i++) {
        if (this.designData.layoutCon[i].i == this.moveData.id) {
          flag = true;
        }
      }
      return flag;
    },
    //删除哪一条数据
    filterData(id) {
      for (let i = 0, len = this.designData.layoutCon.length; i < len; i++) {
        if (this.designData.layoutCon[i].i == id) {
          return i;
        }
      }
    },
    addClass(id, type) {
      for (let i = 0, len = this.selectors.length; i < len; i++) {
        let childs = this.selectors;
        for (let j = 0, jen = childs[i].child.length; j < jen; j++) {
          if (id == childs[i].child[j].id) {
            if (type == "have") {
              childs[i].child[j].move = false;
            } else {
              childs[i].child[j].move = true;
            }
          }
        }
      }
    },
    //自定义容器初始化
    initDesign() {
      let domstyleWidth =
        document.getElementById("custom-design").offsetWidth - 20 * 10,
        domstyleHeight = 50,
        domContainer = document.getElementById("custom-design"),
        resWidth = domstyleWidth / 12,
        everyWidth = ((resWidth / domstyleWidth) * 100).toFixed(2);
      if (!this.isDataview) {
        this.bjStyles = {
          // right: "20px",
          // background: `linear-gradient(to right, transparent 1px,#eee 1px),linear-gradient(to bottom, transparent 1px,#eee 1px)`,
          // "background-size": `20px 20px`,
          // borderLeft: "1px solid #fefefe",
          // borderRight: "1px solid #fefefe",
          // borderTop: "1px solid #fefefe",
          background: `linear-gradient(to right, transparent 19px,rgba(255,255,255,0.1) 1px),linear-gradient(to bottom, transparent 19px,rgba(255,255,255,0.1) 1px`,
          "background-size": `20px 20px`,
          // 画一个网格线每个格子是1*1的背景
          // background: `linear-gradient(to right, transparent 19px,#fefefe 1px),linear-gradient(to bottom, transparent 19px,#fefefe 1px)`,
          // "background-size": `20px 20px`,
        };
      }
      this.rowheight = domstyleHeight - 10;
      this.designLeft = domContainer.offsetLeft + 250;
      this.designTop = domContainer.offsetTop + 70;
      // this.containerWidth = document.getElementById("content").offsetWidth;
      this.$nextTick(() => {
        // this.resize();
      })
      setTimeout(() => {
        this.resize();
      }, 1000);
    },
    //鼠标移动
    moveMousemove() {
      document.getElementById("left-line").onmousedown = (e) => {
        this.isDown = true
      }
      document.getElementById("left-line").onmouseup = (e) => {
        this.isDown = false
      }
      window.onmousemove = (ev) => {
        if (this.isDown == true) {
          //获取x和y
          this.rightWidth = window.innerWidth - ev.clientX;
        }

        if (!this.mouseFalg) {
          return;
        }
        this.moveShow = true;
        this.moveStyle = {
          top: ev.clientY + "px",
          left: ev.clientX + "px",
        };
        this.mouseLeft = ev.clientX;
        this.mouseTop = ev.clientY;
        if (
          this.mouseLeft >= this.designLeft &&
          this.mouseTop >= this.designTop
        ) {
          if (!this.haveData()) {
            this.computedPosi(
              { w: 12, h: 4 },
              this.moveData.id,
              this.designData.layoutCon
            );
            this.designData.layoutData.push(this.moveData);
            this.addClass(this.moveData.id, "have");
          } else {
            let X = this.mouseLeft - this.designLeft,
              domstyleWidth =
                (document.getElementById("grid-container").offsetWidth -
                  12 * 10) /
                12,
              xlang = Math.floor(X / domstyleWidth / 2);
            if (xlang > 6) {
              xlang = 6;
            }
            this.designData.layoutCon[this.filterData(this.moveData.id)].x =
              xlang;
          }
        }
      };
    },
    //鼠标抬起
    moveMouseup() {
      window.onmouseup = () => {
        if (this.mouseFalg) {
          this.moveStyle = {
            top: 0,
            left: 0,
          };
          if (
            this.mouseLeft < this.designLeft ||
            this.mouseTop < this.designTop
          ) {
            if (this.haveData()) {
              this.deleteOnlyData(this.moveData.id);
              this.addClass(this.moveData.id, "no");
            }
          }
          this.mouseLeft = 0;
          this.mouseTop = 0;
          this.moveShow = false;
          this.mouseFalg = false;
        }
      };
    },
    //计算位置
    computedPosi(item, itemId, layout) {
      let newItem = {
        i: itemId,
        x: 0,
        y: 0,
        w: item.w,
        h: item.h,
      };
      let Ys = [],
        maxX = 0,
        maxY = 0,
        edgeX = 0,
        edgeY = 0;
      layout.map((item) => {
        Ys.push(item.y + item.h);
      });
      maxY = (Ys.length && Math.max.apply(null, Ys)) || 1;
      edgeX = 12;
      edgeY = maxY;
      let gridMap = new Array();
      for (let x = 0; x < edgeX; x++) {
        gridMap[x] = new Array();
        for (let y = 0; y < edgeY; y++) {
          gridMap[x][y] = 0;
        }
      }
      layout.map((item) => {
        for (let x = item.x; x < item.x + item.w; x++) {
          for (let y = item.y; y < item.y + item.h; y++) {
            gridMap[x][y] = 1;
          }
        }
      });
      for (let y = 0; y < edgeY; y++) {
        for (let x = 0; x < edgeX; x++) {
          if (edgeX - x >= item.w && edgeY - y >= item.h) {
            let itemSignArr = [];
            for (let a = x; a < x + item.w; a++) {
              for (let b = y; b < y + item.h; b++) {
                itemSignArr.push(gridMap[x][y]);
              }
            }
            if (itemSignArr.indexOf(1) < 0) {
              newItem.x = x;
              newItem.y = y;
              layout.push(newItem);
              return;
            }
          }
        }
      }
      newItem.x = 0;
      newItem.y = edgeY + 1;
      layout.push(newItem);
    },
    async getComList() {
      const url = `/config/select/srvpage_cfg_com_cus_type_select`;
      const req = {
        serviceName: "srvpage_cfg_com_cus_type_select",
        colNames: ["*"],
      };
      const res = await $http.post(url, req);
      if (
        res.data.state === "SUCCESS" &&
        Array.isArray(res.data.data) &&
        res.data.data.length > 0
      ) {
        this.comList = res.data.data;
        this.comList.forEach((item, i) => {
          item.timestamp = new Date().getTime() + i;
          this.comList[i]["com_type"] = item.com_type_no;
        });
      }
    },
    removeItem: function (val) {
      const index = this.layout.map((item) => item.i).indexOf(val);
      this.layout.splice(index, 1);
      this.layout.forEach((item, i) => {
        item.i = i;
      });
    },
    dragDefFn(e) {
      e.preventDefault();
    },

    drag: function (o) {
      // let parentRect = document
      //   .getElementById("content")
      //   .getBoundingClientRect();
      let parentRect = document
        .getElementById("grid-container")
        .getBoundingClientRect();
      let mouseInGrid = false;
      if (
        mouseXY.x > parentRect.left &&
        mouseXY.x < parentRect.right &&
        mouseXY.y > parentRect.top &&
        mouseXY.y < parentRect.bottom
      ) {
        mouseInGrid = true;
      }
      if (
        mouseInGrid === true &&
        this.layout.findIndex((item) => item.i === "drop") === -1
      ) {
        this.layout.push({
          x: 0,
          y: 0,
          // x: (this.layout.length * 2) % (this.colNum || 12),
          // y: this.layout.length + (this.colNum || 12), // puts it at the bottom
          w: this.initWH.w,
          h: this.initWH.h,
          i: "drop",
          data: o,
        });
      }
      let index = this.layout.findIndex((item) => item.i === "drop");
      if (index !== -1) {
        try {
          this.$refs.gridlayout.$children[
            this.layout.length
          ].$refs.item.style.display = "none";
        } catch { }
        let el = this.$refs.gridlayout.$children[index];
        el.dragging = {
          top: mouseXY.y - parentRect.top,
          left: mouseXY.x - parentRect.left,
        };
        let new_pos = el.calcXY(
          mouseXY.y - parentRect.top,
          mouseXY.x - parentRect.left
        );
        if (mouseInGrid === true) {
          this.$refs.gridlayout.dragEvent(
            "dragstart",
            "drop",
            new_pos.x,
            new_pos.y,
            // 5,
            // 10
            this.initWH.h,
            this.initWH.w
          );
          DragPos.i = String(index);
          DragPos.x = this.layout[index].x;
          DragPos.y = this.layout[index].y;
        }
        if (mouseInGrid === false) {
          this.$refs.gridlayout.dragEvent(
            "dragend",
            "drop",
            new_pos.x,
            new_pos.y,
            // 5,
            // 10
            this.initWH.h,
            this.initWH.w
          );
          this.layout = this.layout.filter((obj) => obj.i !== "drop");
        }
      }
    },
    dragend: function (o) {
      let parentRect = document
        .getElementById("content")
        .getBoundingClientRect();
      let mouseInGrid = false;
      if (
        mouseXY.x > parentRect.left &&
        mouseXY.x < parentRect.right &&
        mouseXY.y > parentRect.top &&
        mouseXY.y < parentRect.bottom
      ) {
        mouseInGrid = true;
      }
      if (mouseInGrid === true) {
        this.$refs.gridlayout.dragEvent(
          "dragend",
          "drop",
          DragPos.x,
          DragPos.y,
          // 10,
          // 5
          this.initWH.w,
          this.initWH.h
        );
        this.layout = this.layout.filter((obj) => obj.i !== "drop");
        // UNCOMMENT below if you want to add a grid-item
        let obj = {
          x: DragPos.x,
          y: DragPos.y,
          // w: 10,
          // h: 5,
          w: this.initWH.w,
          h: this.initWH.h,
          i: DragPos.i,
          __uuid: this.getUuid(),
          data: o,
          isLeftBarItem: true,
        };
        this.layout.push(obj);
        this.$refs.gridlayout.dragEvent(
          "dragend",
          DragPos.i,
          DragPos.x,
          DragPos.y,
          // 10,
          // 5
          this.initWH.w,
          this.initWH.h
        );
        try {
          this.$refs.gridlayout.$children[
            this.layout.length
          ].$refs.item.style.display = "block";
        } catch { }
      }
    },
    randomNum(n) {
      var res = "";
      for (var i = 0; i < n; i++) {
        res += Math.floor(Math.random() * 10);
      }
      return res;
    },
    openFullscreen() {
      this.isFullScreen = !this.isFullScreen;
      this.toggleFullScreen();
    },
    requestFullScreen(element) {
      //进入全屏状态 判断各种浏览器，找到正确的方法
      if (!element) {
        element = document.body;
      }
      var requestMethod =
        element.requestFullScreen || //W3C
        element.webkitRequestFullScreen || //Chrome等
        element.mozRequestFullScreen || //FireFox
        element.msRequestFullScreen; //IE11
      if (requestMethod) {
        requestMethod.call(element);
      } else if (typeof window.ActiveXObject !== "undefined") {
        //for Internet Explorer
        var wscript = new ActiveXObject("WScript.Shell");
        if (wscript !== null) {
          wscript.SendKeys("{F11}");
        }
      }
    },
    toggleFullScreen() {
      //切换全屏状态
      if (!document.fullscreenElement) {
        this.requestFullScreen();
        // document.documentElement.requestFullscreen();
      } else {
        this.exitFullScreen();
        // if (document.exitFullscreen) {
        //   document.exitFullscreen();
        // }
      }
    },
    exitFullScreen() {
      // 退出全屏状态 判断各种浏览器，找到正确的方法
      var exitMethod =
        document.exitFullscreen || //W3C
        document.mozCancelFullScreen || //FireFox
        document.webkitExitFullscreen || //Chrome等
        document.webkitExitFullscreen; //IE11
      if (exitMethod && document.fullscreenElement) {
        exitMethod.call(document);
      } else if (typeof window.ActiveXObject !== "undefined") {
        //for Internet Explorer
        var wscript = new ActiveXObject("WScript.Shell");
        if (wscript !== null) {
          wscript.SendKeys("{F11}");
        }
      }
    },
  },
  // beforeRouteLeave(to, from, next) {
  //   const answer = window.confirm("当前页面数据未保存，确定要离开？");
  //   if (answer) {
  //     next();
  //   } else {
  //     next(false);
  //   }
  // },
};
</script>

<style lang="scss" scoped>
.page-header {
  position: relative;
  display: flex;
  justify-content: space-between;
  padding-top: 30px;
  padding-right: 40px;
  z-index: 99;

  .right {
    color: #fff;

    .iconfont {
      font-size: 30px;
      cursor: pointer;
    }
  }
}

.com-item {
  min-height: 90px;
  cursor: move;
  text-align: center;
  display: grid;
  font-size: 14px;
  border: 1px solid transparent;

  &.component {
    border-color: #000;
  }

  &.margin {
    margin: 20px;
  }

  &:hover {
    border: 1px dashed #666;
  }

  &.dashed {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 30px;
    // width: 100%;
    // height: 100%;
    // min-height: 30px;
    // border: 1px dashed #666;
    // position: relative;
    // &::after{
    //   position: absolute;
    //   content: '';
    //   left: 0;
    //   top: 0;
    //   width: 100%;
    //   height: 100%;
    //   border: 1px dashed #666;
    // }
  }

  &.active {

    // border: 1px solid #409eff;
    &::after {
      position: absolute;
      content: '';
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      border: 2px solid #409eff;
      border-radius: 5px;
    }
  }

  img {
    height: 100%;
    overflow: hidden;
  }
}

.customhome-container {
  width: 100vw;
  height: 100vh;
  background: #f1f3f2;
  user-select: none;

  .cushome-sidebar {
    width: 240px;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    background: #fff;
    overflow: auto;
    box-shadow: 0px 0px 4px 0px rgba(0, 0, 0, 0.08);
    // display: flex;

    // .component-list {
    //   // display: flex;
    //   // flex-direction: column;
    //   // flex:1;
    //   overflow-x: hidden;
    //   overflow-y: auto;

    //   .com-item {
    //     display: inline-flex;
    //     flex-direction: column;
    //     width: calc(100% - 10px);
    //     // width: calc(50% - 20px);
    //     margin: 5px;
    //     height: 130px;
    //     background-color: #f1f3f2;
    //     border-radius: 8px;
    //     border: none;
    //     padding: 5px;
    //     overflow: hidden;
    //     cursor: unset;
    //     .example {
    //       flex: 1;
    //       background-color: #ccc;
    //       border-radius: 5px;
    //       cursor: move;
    //     }

    //     .label {
    //       width: calc(100% - 0px);
    //       overflow: hidden;
    //       text-overflow: ellipsis;
    //       white-space: nowrap;
    //       margin-top: 5px;
    //     }
    //   }
    // }
  }

  .cushome-right {
    width: 340px;
    width: var(--right-width);
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    background: #fff;
    overflow: auto;

    // padding: 20px;
    .left-line {
      // border-right: 2px solid transparent;
      position: fixed;
      width: 5px;
      height: 100vh;
      top: 0;
      right: calc(var(--right-width) - 5px);
      z-index: 9999;
      cursor: col-resize;

      &::after {
        content: '';
        width: 4px;
        height: 0px;
        background: transparent;
        position: absolute;
        right: 0;
        top: 50%;
        transition: all 0.5s ease-in-out;
      }

      &:hover {
        &::after {
          top: calc(50% - 50px);
          height: 100px;
          background: #ccc;
        }
      }
    }
  }

  .cushome-content {
    position: fixed;
    top: 0;
    bottom: 0;
    right: var(--right-width);
    left: 240px;
    overflow: auto;
    padding: 40px;
    background: #f1f3f2;

    &.data-view-mode {
      padding: 0;
      left: 0;
      right: 0;
      background-color: transparent;

      .com-item {
        cursor: inherit;
      }

      .com-item.dashed {
        border: none;
      }
    }

    .custom-design {
      // width: 800px;
      width: 100%;
      height: 100%;
      // min-width: 800px;
      // width: 100vw;
      // height: 100vh;
      overflow-y: hidden;
      // transform: scale(0.8);
      margin: 0 auto;
      background: #040711;

      .grid-container {
        height: 100%;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        position: absolute;
      }
    }
  }

  .moveCon {
    position: fixed;
    top: 0;
    left: 0;
    width: 208px;
    height: 40px;
    background: #edf5f2;
    border-radius: 4px;
    margin-bottom: 12px;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    padding-left: 16px;
    opacity: 0.5;

    .rowIcon {
      font-size: 20px;
    }

    .item-name {
      font-size: 14px;
      color: #303133;
      margin-left: 10px;
    }
  }
}
</style>
<style lang="scss" scoped>
.custom-design .vue-grid-layout {
  min-height: calc(100% - 200px);
  padding-bottom: 200px;
  box-sizing: content-box;
}

.vue-grid-item.vue-grid-placeholder {
  background: #197f54;
}

.vue-grid-item>.vue-resizable-handle {
  position: absolute;
  width: 0;
  height: 0;
  border: 6px solid;
  border-color: transparent #e8eaef #e8eaef transparent;
  box-sizing: border-box;
  bottom: 6px;
  right: 6px;
  background: none;
  padding: 0;
  z-index: 99;
  background-color: #197f54;
}

.vue-grid-item:hover .vue-resizable-handle {
  border-color: transparent #197f54 #197f54 transparent;
}

.gridItem {
  // border: 1px solid #fff;
  // background-color: rgba(255,255,255,1);
  // overflow: hidden;
}

.remove {
  position: absolute;
  right: 0;
  top: 0;
  cursor: pointer;
  display: inline-block;
  width: 24px;
  height: 24px;
  margin: 0 auto;
  line-height: 24px;
  text-align: center;
  z-index: 1;
}
</style>
