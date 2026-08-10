<template>
  <div
    class="customhome-container"
    :class="{
      mobile: screenType === 'mobile' && !inEditor,
      fixedWH: !autoScale,
    }"
    :style="{
      '--right-width': getRightWidth,
      '--top-height': inEditor ? '40px' : '0',
    }"
    @dragenter="dragDefFn($event)"
    @dragover="dragDefFn($event)"
  >
    <div class="tool-bar bg-white shadow" v-if="inEditor">
      <span></span>
      <span class="text-xs"> 缩放比例：{{ editorScale }} </span>
      <div>
        <el-button size="mini" @click="preview">预览</el-button>
        <!-- <el-button size="mini" type="primary" @click="clickSave"
          >保存</el-button
        > -->
      </div>
    </div>
    <div class="cushome-sidebar" v-if="inEditor">
      <component-pane @set-list="comList = $event"></component-pane>
      <div class="component-list">
        <div
          v-for="item in comList"
          :key="item.id"
          class="com-item-1 margin component"
          @drag="drag(item)"
          @dragend="dragend(item, $event)"
          draggable="true"
          unselectable="on"
        >
          <img :src="getImagePath(item.preview)" alt="" class="example"/>
          <div class="label">{{ item.comp_label }}</div>
        </div>
      </div>
    </div>
    <div class="cushome-right" v-if="inEditor">
      <span
        class="fold"
        :class="{ unfold: showRight }"
        @click="changeRightDisplay"
        :title="showRight ? '收起右侧面板' : '展开右侧面板'"
      >
        <!-- <span v-if="!showRight">展开</span>
        <span v-else>收起</span> -->
        <span class="icon">
          <i class="el-icon-d-arrow-left"></i>
        </span>
      </span>
      <div
        class="left-line"
        :class="{ 'show-right': showRight }"
        id="left-line"
      ></div>
      <property-pane
        :use-layout="useLayout"
        :pageConfg="pageConfg"
        :appNo="appNo"
        :scree-type="screenType"
        :currentItem="currentItem"
        :layout="layout"
        :str-layout="strLayout"
        @save="clickSave"
        @preview="toPreview"
        @refresh="initPage"
        @screentype="screenType = $event"
        v-if="showRight"
      ></property-pane>
    </div>
    <div
      class="cushome-content"
      id="content"
      ref="screensRef"
      :class="{ 'data-view-mode': !inEditor }"
    >
      <ruler-box
        :disabled="!inEditor"
        :rectWidth="parseInt(styleJson.width || '1920')"
        :rectHeight="parseInt(styleJson.height || '1080')"
        @scale-change="scaleChange"
        ref="rulerBox"
      >
        <div
          class="custom-design"
          :class="{ view: !inEditor }"
          id="custom-design"
          ref="customDesign"
          :style="[styleJson]"
          v-if="screenType === 'PC'"
        >
          <div class="page-bg" :style="[bgJson]"></div>
          <div
            class="grid-container"
            id="grid-container"
            :style="[bjStyles, { width: pageContentWidth, margin: '0 auto' }]"
            v-if="!inEditor && allowedOverlap === false"
          >
            <div
              v-for="(item, index) in layout"
              :key="index"
              :style="{
                position: item.w === 100 ? 'absolute' : 'absolute',
                zIndex: item.w === 100 ? 9 : 1,

                height: rowHeight * item.h + 'px',
                width:
                  item.w === 100
                    ? '100vw'
                    : (parseInt(pageContentWidth || styleJson.width || '1920') *
                        item.w) /
                        colNum +
                      'px',
                top: rowHeight * item.y + 'px',
                left:
                  (parseInt(pageContentWidth || styleJson.width || '1920') *
                    item.x) /
                    colNum +
                  'px',
              }"
            >
              <page-item
                :screenType="screenType"
                :use-layout="useLayout"
                ref="pageItem"
                @setPageParams="setPageParams"
                :pageParamsModel="pageParamsModel"
                :page-item="item.data"
                :page-no="pgNo"
                :layout="item"
                :pageConfig="pageConfg"
                @click.stop=""
                @resize="resize"
              ></page-item>
            </div>
          </div>
          <grid-layout
            ref="gridlayout"
            :layout.sync="layout"
            :col-num="colNum"
            :row-height="rowHeight"
            :preventCollision="preventCollision"
            :responsive="responsive"
            :is-draggable="inEditor"
            :is-resizable="inEditor"
            :is-mirrored="false"
            :vertical-compact="verticalCompact"
            :margin="[0, 0]"
            :use-css-transforms="true"
            @layout-updated="layoutUpdatedEvent"
            v-else-if="allowedOverlap === false"
            :style="[
              {
                width: pageContentWidth,
                margin: '0 auto',
                border: '1px dashed #999',
              },
            ]"
          >
            <div
              class="grid-container"
              id="grid-container"
              :style="[bjStyles]"
            ></div>
            <grid-item
              v-for="(item, index) in layout"
              :x="item.x"
              :y="item.y"
              :w="item.w"
              :h="item.h"
              :i="item.i"
              :key="item.i"
              @moved="movedEvent"
              @resized="resizedEvent"
              class="gridItem"
              @dblclick.native="toComponentDetail(item)"
            >
              <span
                class="remove"
                @click.stop="removeItem(item.i)"
                v-if="inEditor"
              ><i class="el-icon-close"></i
              ></span>
              <div class="com-item dashed" v-if="!inEditor">
                <page-item
                  :screenType="screenType"
                  :use-layout="useLayout"
                  ref="pageItem"
                  @setPageParams="setPageParams"
                  :pageParamsModel="pageParamsModel"
                  :page-item="item.data"
                  :page-no="pgNo"
                  :layout="item"
                  :pageConfig="pageConfg"
                  @click.stop=""
                  @resize="resize"
                ></page-item>
              </div>
              <div
                class="com-item dashed"
                :class="{ active: item.i === curDesign }"
                v-else
                @click.stop.prevent.capture="changeDesign(item.i)"
              >
                <page-item
                  :screenType="screenType"
                  :use-layout="useLayout"
                  ref="pageItem"
                  @setPageParams="setPageParams"
                  :pageParamsModel="pageParamsModel"
                  :page-item="item.data"
                  :page-no="pgNo"
                  :layout="item"
                  :pageConfig="pageConfg"
                ></page-item>
              </div>
            </grid-item>
          </grid-layout>
          <div v-else-if="allowedOverlap === true" class="drag-layout">
            <!-- 可重叠布局 -->
            <vue-drag-resize
              :parentLimitation="true"
              :isResizable="inEditor"
              :isDraggable="inEditor"
              :isActive="item.i && item.i === curDesign && inEditor"
              :z="item.z || 1"
              :x="vw2px(item.x)"
              :y="vh2px(item.y)"
              :w="vw2px(item.w)"
              :h="vh2px(item.h)"
              @deactivated="deactivated"
              @resizestop="onResizestop($event, lIndex)"
              @dragstop="onDragstop($event, lIndex)"
              :key="item.i"
              v-for="(item, lIndex) in layout"
            >
              <page-item
                :screenType="screenType"
                @click.native.stop.prevent.capture="changeDesign(item.i)"
                :use-layout="useLayout"
                ref="pageItem"
                @setPageParams="setPageParams"
                :pageParamsModel="pageParamsModel"
                :page-item="item.data"
                :page-no="pgNo"
                :layout="item"
                :pageConfig="pageConfg"
                :style="{ cursor: inEditor ? 'move' : '' }"
              ></page-item>
              <div class="tool-box">
                <!-- <el-tooltip
                class="item"
                effect="dark"
                content="置顶"
                placement="bottom"
              >
                <div
                  class="tool-item"
                  :class="{ disabled: isTop(item.z) }"
                  @click.stop.capture="toUp(lIndex, 1)"
                >
                  <i class="el-icon-upload2"></i>置顶
                </div>
              </el-tooltip>
              <el-tooltip
                class="item"
                effect="dark"
                content="置底"
                placement="bottom"
              >
                <div
                  class="tool-item"
                  :class="{ disabled: isBottom(item.z) }"
                  @click="toDown(lIndex)"
                >
                  <i class="el-icon-download"></i>置底
                </div>
              </el-tooltip> -->
                <el-tooltip
                  class="item"
                  effect="dark"
                  content="上移"
                  placement="bottom"
                >
                  <div
                    class="tool-item"
                    :class="{ disabled: isTop(item.z) }"
                    @click="toUp(lIndex, 1)"
                  >
                    <i class="el-icon-top"></i>上移
                  </div>
                </el-tooltip>
                <el-tooltip
                  class="item"
                  effect="dark"
                  content="下移"
                  placement="bottom"
                >
                  <div
                    class="tool-item"
                    :class="{ disabled: isBottom(item.z) }"
                    @click="toDown(lIndex, 1)"
                  >
                    <i class="el-icon-bottom"></i>下移
                  </div>
                </el-tooltip>
              </div>
            </vue-drag-resize>
          </div>
        </div>
        <div
          class="custom-design"
          :class="{ mobile: screenType === 'mobile' }"
          id="custom-design"
          ref="customDesign"
          v-else-if="screenType === 'mobile'"
          style="
            width: 375px;
            height: 667px;
            margin-top: 5vh;
            overflow-y: auto;
            overflow-x: hidden;
          "
          :style="[styleJson]"
        >
          <div class="page-bg" :style="[bgJson]"></div>

          <grid-layout
            ref="gridlayout"
            :layout.sync="layout"
            :col-num="colNum"
            :row-height="rowHeight"
            :vertical-compact="true"
            :is-draggable="inEditor"
            :is-resizable="inEditor"
            :is-mirrored="false"
            :margin="[0, 0]"
            :autoSize="false"
            :use-css-transforms="true"
            @layout-updated="layoutUpdatedEvent"
            :responsive="false"
            :preventCollision="true"
          >
            <div
              class="grid-container"
              id="grid-container"
              :style="[bjStyles]"
            ></div>
            <template v-if="!inEditor || onMobilePreview">
              <div v-for="(item, index) in layout" :key="index">
                <page-item
                  :screenType="screenType"
                  style="min-height: 100px"
                  ref="pageItem"
                  @setPageParams="setPageParams"
                  :pageParamsModel="pageParamsModel"
                  :page-item="item.data"
                  :page-no="pgNo"
                  :layout="item"
                  :pageConfig="pageConfg"
                  @click.stop=""
                  @resize="resize"
                ></page-item>
              </div>
            </template>
            <template v-else>
              <grid-item
                v-for="(item, key) in layout"
                :x="item.x"
                :y="item.y"
                :w="item.w"
                :h="item.h"
                :i="item.i"
                :key="item.i"
                @moved="movedEvent"
                @resized="resizedEvent"
                class="gridItem"
                @dblclick.native="toComponentDetail(item)"
              >
                <span
                  class="remove"
                  @click.stop="removeItem(item.i)"
                  v-if="inEditor"
                ><i class="el-icon-close"></i
                ></span>
                <!-- <div v-if="item.isLeftBarItem" class="com-item dashed" :class="{ 'active': item.i === curDesign }"
                @click.stop.prevent.capture="changeDesign(item.i)">
                <img :src="getImagePath(item.data.example)" alt="" style="display: inline-block; width: 100%" />
              </div> -->
                <div class="com-item dashed" v-if="!inEditor">
                  <page-item
                    :screenType="screenType"
                    ref="pageItem"
                    @setPageParams="setPageParams"
                    :pageParamsModel="pageParamsModel"
                    :page-item="item.data"
                    :page-no="pgNo"
                    :layout="item"
                    :pageConfig="pageConfg"
                    @click.stop=""
                    @resize="resize"
                  ></page-item>
                </div>
                <div
                  class="com-item dashed"
                  :class="{ active: item.i === curDesign }"
                  v-else
                  @click.stop.prevent.capture="changeDesign(item.i)"
                >
                  <page-item
                    :screenType="screenType"
                    ref="pageItem"
                    @setPageParams="setPageParams"
                    :pageParamsModel="pageParamsModel"
                    :page-item="item.data"
                    :page-no="pgNo"
                    :layout="item"
                    :pageConfig="pageConfg"
                  ></page-item>
                </div>
              </grid-item>
            </template>
          </grid-layout>
        </div>
        <div
          v-if="screenType === 'mobile' && inEditor && pgNo"
          style="text-align: center; margin-top: 50px"
        >
          <el-button @click="previewCurrent"
          >{{ onMobilePreview ? "编辑" : "预览" }}
          </el-button>
          <el-button @click="previewMobile">h5预览</el-button>
        </div>
      </ruler-box>
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
import {GridLayout, GridItem} from "vue-grid-layout";
import VueDragResize from "vue-drag-resize";
import PageItem from "../component/page-item/page-item.vue";
import propertyPane from "./property-pane.vue";
import componentPane from "./left-pane/component-pane.vue";
import rulerBox from "./ruler-box.vue";
import {formatStyleData, rpx2px} from "../common/index.js";
import {$http} from "@/common/http.js";

let mouseXY = {x: null, y: null};
let DragPos = {x: null, y: null, w: 1, h: 1, i: null};

// 页面参数
import pageParams from "../common/params/page-params-mixin.js";
import { getFullBaseUrl } from "@/common/common";

export default {
  // name: "pageEditor",
  mixins: [pageParams],
  components: {
    GridLayout,
    GridItem,
    VueDragResize,
    PageItem,
    propertyPane,
    componentPane,
    rulerBox,
  },
  data() {
    return {
      showRight: false,
      editorScale: 1,
      onMobilePreview: false,
      screenType: "PC",
      rightWidth: 340,
      isDown: false,
      contentData: {},
      isFullScreen: false,
      pageConfg: {},
      containerWidth: 800,
      colNum: 100,
      // rowHeight: 10.8,
      pgNo: "",
      pageId: "",
      appNo: "", //应用编号
      pageName: "可视化配置",
      pageTitle: "可视化配置页",
      // styleJson: null,
      parentLayoutNo: "",
      layoutObj: null,
      strLayout: "",
      layoutJson: null,
      comJson: [],
      comList: [],
      designData: {layoutCon: [], layoutData: []}, //容器内容
      bjStyles: {}, //栅格样式
      curDesign: "", //点击容器组件样式
      rowHeight: 10, //默认一格高度
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
    if (this.$route.query.screenType) {
      this.screenType = this.$route.query.screenType;
    }
    if (this.$route.query.appNo) {
      this.appNo = this.$route.query.appNo;
    }
    if (this.$route.query.pageNo || this.$route.params?.no) {
      this.pgNo = this.$route.query.pageNo || this.$route.params?.no;
      this.initPage().then((_) => {
        this.$nextTick(() => {
          this.initDesign();
          if (this.inEditor) {
            // 编辑模式 监听事件
            document.addEventListener(
              "dragover",
              function (e) {
                mouseXY.x = e.clientX;
                mouseXY.y = e.clientY;
              },
              false
            );
            this.moveMousemove();
            this.moveMouseup();
            if (!this.allowedOverlap) {
              document.getElementById("custom-design").onclick = (e) => {
                this.curDesign = "";
              };
            }
          }
          this.initColNum();

          // if (!process?.env?.NODE_ENV === "development") {
          // 开发模式不监听窗口变化
          console.log("this.autoScale:", this.autoScale);
          if (this.screenType === "PC") {
            window.addEventListener("resize", this.resize);
          }
          // }
          setTimeout(() => {
            // if (this.screenType === "PC") {
            //   window.addEventListener("resize", this.resize);
            // }
            if (this.needLogin) {
              // location.href = '/main/login.html'
            }
          }, 3000);
        });
      });
    }
  },
  mounted() {
    // this.startMove()
    // this.initDesign();
    // if (this.inEditor) {
    //   // 编辑模式 监听事件
    //   document.addEventListener(
    //       "dragover",
    //       function (e) {
    //         mouseXY.x = e.clientX;
    //         mouseXY.y = e.clientY;
    //       },
    //       false
    //   );
    //   this.moveMousemove();
    //   this.moveMouseup();
    //   if (!this.allowedOverlap) {
    //     document.getElementById("custom-design").onclick = (e) => {
    //       this.curDesign = "";
    //     };
    //   }
    // }
    // this.initColNum();
    //
    // // if (!process?.env?.NODE_ENV === "development") {
    //   // 开发模式不监听窗口变化
    // console.log('this.autoScale:',this.autoScale)
    //   if (!this.inEditor && this.autoScale && this.screenType === "PC") {
    //     window.addEventListener("resize", this.resize);
    //   }
    // // }
    //
    // setTimeout(() => {
    //   if (this.needLogin) {
    //     // location.href = '/main/login.html'
    //   }
    // }, 3000);
    // if(this.inEditor){
    //   this.initZoomHandler()
    // }
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.resize);
  },
  computed: {
    pageContentWidth() {
      let contentWidth = this.pageConfg?.content_area_width;
      if (contentWidth && !isNaN(Number(contentWidth))) {
        return `${Number(contentWidth)}px`;
      } else {
        return null;
      }
    },
    getRightWidth() {
      return this.showRight === false ? "0px" : `${this.rightWidth}px`;
    },
    responsive() {
      return this.pageConfg?.page_options?.includes("响应式") || false;
    },
    verticalCompact() {
      // 垂直紧凑 垂直方向自动补位
      return (
        this.pageConfg?.page_options?.includes("垂直方向自动补位") || false
      );
    },
    preventCollision() {
      // 防止碰撞
      return this.pageConfg?.page_options?.includes("防止元素碰撞") || false;
    },
    needLogin() {
      // 需要登录
      return this.pageConfg?.page_options?.includes("需要登录") || false;
    },
    allowedOverlap() {
      // 允许重叠
      return this.pageConfg?.page_options?.includes("可重叠大屏") || false;
    },
    autoScale() {
      // 自动根据配置的页面宽高进行缩放
      return this.pageConfg?.page_options?.includes("不缩放") !== true;
    },
    bgJson() {
      let json = this.pageConfg?.page_row_json_data?.page_style_json;
      if (!this.inEditor && (json?.width || json?.height)) {
        delete json.width;
        delete json.height;
      }
      if (this.pageConfg.background_image) {
        if (!json) {
          json = {}
        }
        json.background_image = this.pageConfg.background_image
      }
      if (json) {
        json = JSON.parse(rpx2px(JSON.stringify(json)));
      }

      json = formatStyleData(json);

      return json;
    },
    styleJson() {
      let json = null;
      if (!json) {
        json = {
          width: this.screenType == "PC" ? "1920px" : "375px",
          height: this.screenType == "PC" ? "1080px" : "667px",
        };
      }

      if (!this.inEditor && (json?.width || json?.height)) {
        delete json.width;
        delete json.height;
      }
      if (this.pageInfo?.page_options?.includes("不缩放")) {
        if (this.pageInfo?.page_style_json_data) {
          json = {
            ...this.pageInfo?.page_style_json_data,
          };
        }
        // json = {
        //   width: this.pageInfo?.page_style_json_data?.width,
        //   height: this.pageInfo?.page_style_json_data?.height,
        // };
      }
      json = JSON.parse(rpx2px(JSON.stringify(json)));
      json = formatStyleData(json);
      // if (this.pageContentWidth) {
      //   json.width = this.pageContentWidth;
      // }
      return json;
    },
    useLayout() {
      return this.pageConfg?.page_options?.includes("布局容器") || false;
    },
    inEditor() {
      // 编辑状态
      return (
        this.$route?.name?.includes("gridEditor") ||
        this.$route?.meta?.isEditor === true
      );
    },
    isDataview() {
      // 预览模式
      return (
        this.$route?.name === "gridview" ||
        this.$route?.name === "gridViewDetail"
      );
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
      const ele = this.$refs.customDesign;
      if (ele && ele instanceof HTMLElement) {
        const eleHeight = ele.offsetHeight;
        const eleWidth = ele.offsetWidth;
        return {
          w: this.screenType === "mobile" ? 100 : 10,
          h:
            this.screenType === "mobile"
              ? 20
              : parseFloat(((5 * eleWidth) / eleHeight).toFixed(6)),
          // w: containerWidth / 4,
          // h: containerWidth / 8,
        };
      }
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
    getRightWidth(val) {
      setTimeout(() => {
        this.$refs.rulerBox?.initSize?.();
      }, 500);
    },
  },
  methods: {
    changeRightDisplay() {
      this.showRight = !this.showRight;
    },
    scaleChange(val) {
      this.editorScale = val;
    },
    initZoomHandler() {
      const container = this.$refs.screensRef;
      const ZOOM_STEP = 0.1;
      const MIN_ZOOM = 0.5;
      const MAX_ZOOM = 3;

      const handleWheel = (e) => {
        if (e.ctrlKey) {
          e.preventDefault();
          const delta = e.deltaY > 0 ? -1 : 1;
          this.editorScale += delta * ZOOM_STEP;
          this.editorScale = Math.min(
            Math.max(this.editorScale, MIN_ZOOM),
            MAX_ZOOM
          );

          const designElement = document.getElementById("custom-design");
          if (designElement) {
            designElement.style.transform = `scale(${this.editorScale})`;
            designElement.style.transformOrigin = "0 0";
            this.$message.info({
              message: `缩放比例：${parseFloat(this.editorScale.toFixed(2))}`,
              center: true,
            });
          }
        }
      };

      container.addEventListener("wheel", handleWheel, {passive: false});
      this.$once("hook:beforeDestroy", () => {
        container.removeEventListener("wheel", handleWheel);
      });
    },
    deactivated() {
      this.curDesign = "";
    },
    px2vw(num) {
      // px转为vw
      const ele = this.$refs.customDesign;
      if (ele && ele instanceof HTMLElement) {
        const eleWidth = ele.offsetWidth;
        return (num / eleWidth) * 100;
      }
    },
    px2vh(num) {
      // px转为vh
      const ele = this.$refs.customDesign;
      if (ele && ele instanceof HTMLElement) {
        const eleHeight = ele.offsetHeight;
        return (num / eleHeight) * 100;
      }
    },
    vw2px(num) {
      //vw转为px
      const ele = this.$refs.customDesign;
      if (ele && ele instanceof HTMLElement) {
        const eleWidth = ele.offsetWidth;
        return (num / 100) * eleWidth;
      }
    },
    vh2px(num) {
      // vh转为px
      const ele = this.$refs.customDesign;
      if (ele && ele instanceof HTMLElement) {
        const eleHeight = ele.offsetHeight;
        return (num / 100) * eleHeight;
      }
    },
    isTop(z) {
      // 判断是否是顶端元素 从大到小第0位
      return z === this.layout.map((item) => item.z).sort((a, b) => b - a)[0];
    },
    isBottom(z) {
      // 判断是否是最底端元素 从小到大第0位
      return z === this.layout.map((item) => item.z).sort((a, b) => a - b)[0];
    },
    toDown(index, step) {
      let zArr = this.layout.map((item) => item.z).sort((a, b) => a - b);
      if (!this.isBottom(this.layout[index].z)) {
        // 下移
        if (step) {
          let curZ = this.layout[index].z;
          let curIndex = zArr.findIndex((item) => item === curZ);
          if (curIndex > 0) {
            let oldZ = zArr[curIndex - 1];
            let oldIndex = this.layout.findIndex((item) => item.z === oldZ);
            this.layout[oldIndex].z = curZ;
            this.layout[index].z = zArr[curIndex - 1];
            console.log(oldIndex, curIndex);
          }
        } else {
          //置底
          // let curZ = this.layout[index].z;
          // let nextIndex = this.layout.find((item) => item.z === zArr[0])
          // this.layout[index].z = zArr[0];
          // this.layout[nextIndex].z = curZ;
        }
      } else {
        this.layout[index].z = this.layout[index].z - 1;
      }
      console.log(this.layout[index].z);
    },
    toUp(index, step) {
      // 上移
      let zArr = this.layout.map((item) => item.z).sort((a, b) => a - b);
      if (!this.isTop(this.layout[index].z)) {
        if (step) {
          // 上移一层
          let curZ = this.layout[index].z;
          let curIndex = zArr.findIndex((item) => item === curZ);
          if (curIndex < zArr.length - 1) {
            let oldZ = zArr[curIndex + 1];
            let oldIndex = this.layout.findIndex((item) => item.z === oldZ);
            this.layout[oldIndex].z = curZ;
            this.layout[index].z = zArr[curIndex + 1];
            console.log(oldIndex, curIndex);
          }
        } else {
          //置顶
          let curZ = this.layout[index].z;
          let nextIndex = this.layout.find((item) => item.z === zArr[0]);
          this.layout[index].z = zArr[0];
          this.layout[nextIndex].z = curZ;
        }
      } else {
        this.layout[index].z = this.layout[index].z + 1;
      }
      console.log(this.layout[index].z);
    },
    previewCurrent() {
      this.onMobilePreview = !this.onMobilePreview;
      // window.open(window.location.hash.replace("/editor/", "/view/"));
    },
    preview() {
      open(`${getFullBaseUrl()}/lowcode-grid/view/${this.pgNo}`);
    },
    previewMobile() {
      // window.open(`/h5/#/views/custom/index/index?page_no=${this.pgNo}`);
      window.open(`/xmp/#/views/custom/index/index?page_no=${this.pgNo}`);
    },
    resize() {
      // 自适应缩放
      // return;
      if (this.inEditor || this.autoScale === false) {
        // 编辑状态不缩放
        return;
      }
      let element = document.getElementById("custom-design");

      let contentData = this.contentData;
      console.log("contentData", this.contentData);

      let resizeFull = () => {
        const windowWidth = window.innerWidth;
        const windowheight = window.innerHeight;
        let ratioX = windowWidth / window.screen.width;
        let ratioY = windowheight / window.screen.height;
        if (!window.screen.height || !window.screen.width)
          return resizeFullBak();
        let dashboard_width = parseFloat(contentData.width);
        let dashboard_height = parseFloat(contentData.height);
        // if (windowWidth/ dashboard_width < 1) {
        ratioX = (ratioX * window.screen.width) / dashboard_width;
        // }
        // if (windowheight / dashboard_height < 1) {
        ratioY = (ratioY * window.screen.height) / dashboard_height;
        // }
        document.body.style = `width:${contentData.width};height:${contentData.height};overflow-y:hidden;transform:scale(${ratioX}, ${ratioY});transform-origin: left top; background-size: 100% 100%;`;
        // element.style = `width:${contentData.width};height:${contentData.height};overflow-y:hidden;transform:scale(${ratioX}, ${ratioY});transform-origin: left top; background-size: 100% 100%;`;
        console.log("resizeFull", ratioX, ratioY);
      };
      let resizeFullBak = () => {
        const windowWidth = window.innerWidth;
        const windowheight = window.innerHeight;
        let ratioX = windowWidth / document.body.clientWidth;
        let ratioY = windowheight / document.body.clientHeight;
        let dashboard_width = parseFloat(contentData.width);
        let dashboard_height = parseFloat(contentData.height);
        let ratio = Math.min(ratioX, ratioY);
        if (window.screen.width / dashboard_width < 1) {
          ratioX = (ratio * window.screen.width) / dashboard_width;
        }
        if (window.screen.height / dashboard_height < 1) {
          ratioY = (ratio * window.screen.height) / dashboard_height;
        }
        document.body.style = `width:${contentData.width};height:${contentData.height};transform: scale(${ratioX},${ratioY});transform-origin: left top;background-size: 100%  ${ratioY}`;
        // element.style = `width:${contentData.width};height:${contentData.height};transform: scale(${ratioX},${ratioY});transform-origin: left top;background-size: 100%  ${ratioY}`;
        console.log("resizeFullBak", ratioX, ratioY);
      };
      resizeFull();
    },
    initColNum() {
      const ele = this.$refs.customDesign;
      if (ele && ele instanceof HTMLElement) {
        const eleHeight = parseFloat(this.contentData.height);
        // const eleHeight = ele.offsetHeight;
        this.rowHeight = parseFloat((eleHeight / 100).toFixed(6)); //行高设置为页面高度的1/100
      }
      let containerWidth = document.getElementById("custom-design").offsetWidth;

      // this.colNum = containerWidth;
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
      const layout = this.layout.map((item) => {
        return {
          ...item,
          timestamp: Number((new Date().getTime() + "").slice(-9)),
        };
      });
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
              condition: [{colName: "id", ruleType: "in", value: id}],
            },
          ];
          break;
      }

      const response = await this.operate(params);
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
      console.log("initPage");
      if (data?.page_no) {
        this.pgNo = data.page_no;
      }
      this.layout = [];
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
          width:
            this.styleJson?.width ||
            (this.screenType === "mobile" ? "375px" : "1920px"),
          height:
            this.styleJson?.height ||
            (this.screenType === "mobile" ? "667px" : "1080px"),
        };
        // if (this.isDataview) {
        //   delete this.styleJson.width;
        //   delete this.styleJson.height;
        // }
        if (!this.comJson) return;
        // this.comJson.forEach((com, i) => {
        //   this.comList.forEach((list) => {
        //     if (list.com_type === com.com_type) {
        //       this.comJson[i].example = list.example;
        //     }
        //   });
        // });
        this.comJson = this.comJson.sort((a, b) => a.layout_seq - b.layout_seq);

        this.layoutJson = data.layout_json_data;
        if (
          Array.isArray(data.layout_json_data) &&
          data.layout_json_data.length > 0
        ) {
          this.layoutJson.parts_json = data.layout_json_data.sort(
            (a, b) => a.seq - b.seq
          );
        }
        if (this.useLayout) {
          // 使用布局容器
          this.parentLayoutNo = data.layout_no;
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
        } else {
          // 直接将坐标、宽高存在组件上
          if (this.layoutJson?.parts_json?.length) {
          } else {
            this.comJson = this.comJson.sort((a, b) => a.com_seq - b.com_seq);
          }
          this.comJson.forEach((item, index) => {
            let layoutItem = {};
            if (this.layoutJson?.parts_json?.length - 1 >= index) {
              // 兼容之前使用布局容器的方案
              layoutItem = this.layoutJson.parts_json[index];
            }
            switch (item.com_type) {
              case "list":
                if (
                  !item.srv_req_json &&
                  item.list_json?.default_srv_req_json
                ) {
                  item.srv_req_json = item.list_json.default_srv_req_json;
                }
                if (!item.cols_map_json && item.list_json?.cols_map_json) {
                  item.cols_map_json = item.list_json.cols_map_json;
                }
                break;
              default:
                break;
            }
            const obj = {
              x: item.layout_x || 0,
              y:
                item.layout_y || item.layout_y === 0
                  ? item.layout_y
                  : index * this.initWH.h,
              z: item.layout_z || index + 1,
              w: item.layout_width || this.initWH.w,
              h: item.layout_height || this.initWH.h,
              i: item.id || new Date().getTime(), // item.seq - 1
              // layout_no: item.layout_no,
              data: {...item},
              isLeftBarItem: false,
              id: item.id,
              colNum: this.colNum,
            };
            if (
              layoutItem?.col_span &&
              layoutItem.row_span &&
              layoutItem.pos_x &&
              layoutItem.pos_y &&
              this.screenType === "pc" &&
              this.useLayout
            ) {
              obj.w = (layoutItem?.row_span * 100 * 1.6) / 1920;
              obj.h = (layoutItem?.col_span * 100 * 1.17) / 1080;
              obj.x = (layoutItem?.pos_x * 100 * 1.6) / 1920;
              obj.y = (layoutItem?.pos_y * 100 * 1.17) / 1080;
              obj.layout_no = layoutItem?.layout_no;
            }
            this.layout.push(JSON.parse(JSON.stringify(obj)));
          });
        }
        this.strLayout = JSON.stringify(this.layout);
        this.$set(this, "loadPageMata", data); // 保存页面元数据
        this.initPageParams(); // 页面参数初始化
      } else {
        this.$message.info("无数据！");
      }
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
    onDragstop({left, top, width, height}, index) {
      this.curDesign = this.layout[index].i;
      console.log(
        "拖拽停止：",
        index,
        left,
        top,
        width,
        height,
        this.layout[index].z
      );
      this.$set(this.layout, index, {
        ...this.layout[index],
        x: this.px2vw(left),
        y: this.px2vh(top),
        w: this.px2vw(width),
        h: this.px2vh(height),
      });
    },
    onResizestop({left, top, width, height}, index) {
      this.curDesign = this.layout[index].i;
      console.log("大小改变：", index, left, top, width, height);
      this.$set(this.layout, index, {
        ...this.layout[index],
        x: this.px2vw(left),
        y: this.px2vh(top),
        w: this.px2vw(width),
        h: this.px2vh(height),
      });
    },
    toComponentDetail(item) {
      if (this.inEditor && item?.data?.id) {
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
      if (this.inEditor) {
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
        if (this.screenType === "PC") {
          setTimeout(() => {
            this.resize();
          }, 50);
        }
      });
    },
    //鼠标移动
    moveMousemove() {
      // if (!this.showRight) {
      //   return;
      // }
      document.getElementById("left-line").onmousedown = (e) => {
        this.isDown = true;
      };
      document.getElementById("left-line").onmouseup = (e) => {
        this.isDown = false;
      };
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
              {w: 12, h: 4},
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
    removeItem: function (val) {
      const index = this.layout.map((item) => item.i).indexOf(val);
      this.layout.splice(index, 1);
      // this.layout.forEach((item, i) => {
      //   item.i = item.id || i;
      // });
    },
    dragDefFn(e) {
      e.preventDefault();
    },

    drag: function (o) {
      if (this.allowedOverlap) {
        // 允许重叠 使用vue-drag-resize
        return;
      }
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
        debugger
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
        debugger

      }
      let index = this.layout.findIndex((item) => item.i === "drop");
      if (index !== -1) {
        try {
          this.$refs.gridlayout.$children[
            this.layout.length
            ].$refs.item.style.display = "none";
        } catch {
        }
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
    initComCfg(type, config) {
      // 初始化组件配置
      switch (type) {
        case "chart":
          if (config.row_json) {
            config.chart_json = JSON.parse(config.row_json);
          }
          break;
        case "cardGroup":
          if (config.row_json) {
            const cfg = JSON.parse(config.row_json);
            config.card_group_json = cfg;
          }
          break;
        case "list":
          if (config.list_json) {
            const cfg = JSON.parse(config.list_json);
            config.list_json = cfg;
            if (cfg.list_type === "卡片") {
              config.card_group_json = {
                card_unit_json: cfg.card_unit_json,
                card_layout_json: cfg.layout_json,
                interface_json: cfg.interface_json,
              };
            }
            if (cfg?.default_srv_req_json) {
              config.srv_req_json = cfg?.default_srv_req_json;
            }
          }
          break;
        case "widget":
        case "控件":
          if (config.row_json) {
            config.widget_json = JSON.parse(config.row_json);
          }
          break;
        case "swiper":
          if (config.figure_row_json) {
            try {
              config.swiper_json = JSON.parse(config.figure_row_json);
            } catch (error) {
            }
          }
          break;
        case "map":
          if (config.row_json) {
            config.map_json = JSON.parse(config.row_json);
            if (config.map_json?.srv_req_json) {
              config.srv_req_json = config.map_json?.srv_req_json;
            }
            if (config.map_json?.cols_map_json) {
              config.cols_map_json = config.map_json?.cols_map_json;
            }
            if (config.map_json?.interface_json) {
              config.interface_json = config.map_json?.interface_json;
            }
          }
          break;
        case "tabs":
          if (config.row_json) {
            config.tabs_json = JSON.parse(config.row_json);
          }
          break;
        case "form":
          if (config.row_json) {
            config.form_json = JSON.parse(config.row_json);
          }
          break;
        case "noticeBar":
          if (config.row_json) {
            config.notice_bar_json = JSON.parse(config.row_json);
          }
          break;
      }
      return JSON.parse(JSON.stringify(config));
    },
    dragend: function (o, pos) {
      let parentRect = document
        .getElementById("content")
        .getBoundingClientRect();
      if (this.allowedOverlap) {
        // 允许重叠 使用vue-drag-resize
        if (
          pos.x > parentRect.left &&
          pos.x < parentRect.right &&
          pos.y > parentRect.top &&
          pos.y < parentRect.bottom
        ) {
          // 拖拽到画布中
          let cvs = document
            .getElementById("custom-design")
            .getBoundingClientRect();
          let obj = {
            x: ((pos.x - cvs.left - 80) * 100) / cvs.width,
            y: ((pos.y - cvs.top - 40) * 100) / cvs.height,
            z: this.layout.length - 1,
            w: this.initWH.w,
            h: this.initWH.h,
            i: this.layout.length,
            __uuid: this.getUuid(),
            data: JSON.parse(JSON.stringify(o)),
            isLeftBarItem: true,
          };
          obj.data = this.initComCfg(o.com_type, obj.data);
          console.log("dragend:", obj);
          debugger
          this.layout.push(obj);
        }
        return;
      }

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
          data: JSON.parse(JSON.stringify(o)),
          isLeftBarItem: true,
        };
        obj.data = this.initComCfg(o.com_type, obj.data);
        // switch (o.com_type) {
        //   case "chart":
        //     if (obj.data.row_json) {
        //       obj.data.chart_json = JSON.parse(obj.data.row_json);
        //     }
        //     break;
        //   case "cardGroup":
        //     if (obj.data.row_json) {
        //       const cfg = JSON.parse(obj.data.row_json);
        //       obj.data.card_group_json = cfg;
        //     }
        //     break;
        //   case "list":
        //     if (obj.data.list_json) {
        //       const cfg = JSON.parse(obj.data.list_json);
        //       obj.data.list_json = cfg;
        //       if (cfg.list_type === "卡片") {
        //         obj.data.card_group_json = {
        //           card_unit_json: cfg.card_unit_json,
        //           card_layout_json: cfg.layout_json,
        //           interface_json: cfg.interface_json,
        //         };
        //       }
        //       if (cfg?.default_srv_req_json) {
        //         obj.data.srv_req_json = cfg?.default_srv_req_json;
        //       }
        //     }
        //     break;
        //   case "widget":
        //   case "控件":
        //     if (obj.data.row_json) {
        //       obj.data.widget_json = JSON.parse(obj.data.row_json);
        //     }
        //     break;
        //   case "swiper":
        //     if (obj.data.figure_row_json) {
        //       try {
        //         obj.data.swiper_json = JSON.parse(obj.data.figure_row_json);
        //       } catch (error) {}
        //     }
        //     break;
        //   case "map":
        //     if (obj.data.row_json) {
        //       obj.data.map_json = JSON.parse(obj.data.row_json);
        //       if (obj.data.map_json?.srv_req_json) {
        //         obj.data.srv_req_json = obj.data.map_json?.srv_req_json;
        //       }
        //       if (obj.data.map_json?.cols_map_json) {
        //         obj.data.cols_map_json = obj.data.map_json?.cols_map_json;
        //       }
        //       if (obj.data.map_json?.interface_json) {
        //         obj.data.interface_json = obj.data.map_json?.interface_json;
        //       }
        //     }
        //     break;
        //   case "tabs":
        //     if (obj.data.row_json) {
        //       obj.data.tabs_json = JSON.parse(obj.data.row_json);
        //     }
        //     break;
        //   case "form":
        //     if (obj.data.row_json) {
        //       obj.data.form_json = JSON.parse(obj.data.row_json);
        //     }
        //     break;
        //   case "noticeBar":
        //     if (obj.data.row_json) {
        //       obj.data.notice_bar_json = JSON.parse(obj.data.row_json);
        //     }
        //     break;
        // }
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
        } catch {
        }
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
.page-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

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
  display: grid;
  font-size: 14px;
  // border: 1px solid transparent;

  &.component {
    border-color: #000;
  }

  &.margin {
    margin: 20px;
  }

  &::after {
    position: absolute;
    content: "";
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    border: 1px dashed #ccc;
    z-index: 99;
  }

  // &::before{
  //   position: absolute;
  //   content: "";
  //   left: 0;
  //   top: 0;
  //   width: 100%;
  //   height: 100%;
  //   border: 2px dashed #ccc;
  // }

  &:hover {
    // border: 3px dashed #409eff;
    &::after {
      border-color: #409eff;
    }
  }

  &.dashed {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 30px;
  }

  &.active {
    // border: 1px solid #409eff;
    &::after {
      border-color: #409eff;
      border-style: solid;
    }
  }

  img {
    height: 100%;
    overflow: hidden;
  }
}

.mobile {
  .com-item.dashed {
    .page-item {
      pointer-events: none;
    }

    // height: unset;
  }
}

.customhome-container {
  // width: 100vw;
  // height: 100vh;
  background: #f1f3f2;
  user-select: none;
  position: relative;
  height: 100%;
  width: 100%;
  // &.fixedWH {
  //   .cushome-content {
  //     .custom-design {
  //       overflow-y: auto;
  //     }
  //   }

  // }

  &.mobile {
    display: flex;
    justify-content: center;
    align-items: center;

    .cushome-content {
      position: relative;
      width: 375px;

      .custom-design {
        height: 667px;
        overflow-y: auto;
      }
    }
  }

  .cushome-sidebar {
    width: 340px;
    position: absolute;
    // position: fixed;
    top: var(--top-height);
    left: 0;
    bottom: 0;
    background: #fff;
    overflow: auto;
    box-shadow: 0px 0px 4px 0px rgba(0, 0, 0, 0.08);
    display: flex;

    .component-list {
      // display: flex;
      // flex-direction: column;
      flex: 1;
      overflow-x: hidden;
      overflow-y: auto;
      background-color: #fff;

      &::-webkit-scrollbar {
        width: 4px; /* 设置滚动条的宽度 */
        height: 4px; /* 设置滚动条的高度 */
      }

      &::-webkit-scrollbar-thumb {
        background-color: rgba(0, 0, 0, 0.2); /* 设置滚动条滑块的颜色 */
        border-radius: 4px; /* 设置滚动条滑块的圆角 */
      }

      .com-item-1 {
        display: inline-flex;
        flex-direction: column;
        width: calc(100% - 10px);
        // width: calc(50% - 20px);
        margin: 5px;
        min-height: 130px;
        border-radius: 8px;
        border: none;
        overflow: hidden;
        cursor: unset;
        // box-shadow:0 2px 6px 0 rgba(0,0,0,.2);
        border: 1px solid #ccc;
        background-color: #f1f1f1;
        cursor: move;

        .example {
          flex: 1;
          background-color: #ccc;
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
        }

        .label {
          width: calc(100% - 0px);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding: 5px;
        }
      }
    }
  }

  .tool-bar {
    position: absolute;
    top: 0;
    right: 0;
    width: 100%;
    // width: 340px;
    height: 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    font-size: 14px;
    border-bottom: 1px solid #f1f1f1;
    z-index: 999;
  }

  .cushome-right {
    width: 340px;
    width: var(--right-width);
    position: absolute;
    // position: fixed;
    top: var(--top-height);
    right: 0;
    bottom: 0;
    background: #fff;
    // overflow: auto;
    transition: width 0.5s ease-in-out;

    &::-webkit-scrollbar {
      width: 4px; /* 设置滚动条的宽度 */
      height: 4px; /* 设置滚动条的高度 */
    }

    &::-webkit-scrollbar-thumb {
      background-color: rgba(0, 0, 0, 0.2); /* 设置滚动条滑块的颜色 */
      border-radius: 4px; /* 设置滚动条滑块的圆角 */
    }

    ::v-deep .form-view-wrapper.el-row {
      &::-webkit-scrollbar {
        width: 8px; /* 设置滚动条的宽度 */
        height: 8px; /* 设置滚动条的高度 */
      }

      &::-webkit-scrollbar-thumb {
        background-color: rgba(0, 0, 0, 0.2); /* 设置滚动条滑块的颜色 */
        border-radius: 4px; /* 设置滚动条滑块的圆角 */
      }

      height: calc(100vh - 150px);
    }

    .fold {
      position: absolute;
      top: 50%;
      left: -5px;
      transform: translateX(-100%);
      z-index: 20;
      cursor: pointer;
      display: flex;
      align-items: center;
      // width: 40px;
      .icon {
        display: inline-block;
        transform: rotate(0);
        transition: all 0.5s ease-in-out;
      }

      &.unfold {
        .icon {
          transform: rotate(180deg);
        }
      }

      background: rgba(0, 0, 0, 0.08);
      border-radius: 4px;
      padding: 2px;
    }

    // padding: 20px;
    .left-line {
      // border-right: 2px solid transparent;
      position: fixed;
      width: 5px;
      height: 100vh;
      top: 0;
      right: calc(var(--right-width) - 5px);
      z-index: 9999;

      &.show-right {
        cursor: col-resize;

        &::after {
          content: "";
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
  }

  .cushome-content {
    position: absolute;
    // position: fixed;
    top: var(--top-height);
    bottom: 0;
    right: var(--right-width);
    left: 340px;
    overflow: auto;
    // padding: 40px;
    background: #f1f3f2;
    transition: right 0.5s ease-in-out;

    &::-webkit-scrollbar {
      width: 6px; /* 设置滚动条的宽度 */
      height: 6px; /* 设置滚动条的高度 */
    }

    &::-webkit-scrollbar-thumb {
      background-color: rgba(0, 0, 0, 0.2); /* 设置滚动条滑块的颜色 */
      border-radius: 4px; /* 设置滚动条滑块的圆角 */
    }

    &.no-padding {
      padding: 0;
      background-color: transparent;
      z-index: 9;
      pointer-events: none;
    }

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
      position: relative;

      &.view {
        background: unset;
      }

      .grid-container {
        height: 100%;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        position: absolute;
      }

      .drag-layout {
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        position: absolute;

        .active {
          background-color: rgba(255, 255, 255, 0.2);

          .tool-box {
            display: flex;
            // justify-content: space-around;
            color: #fff;
            position: absolute;
            bottom: -30px;
            left: 0;
            width: 240px;
            z-index: 999;

            .tool-item {
              cursor: pointer;
              // width: 30px;
              height: 30px;
              line-height: 30px;
              text-align: center;
              font-size: 12px;
              margin-right: 10px;
              position: relative;

              &:active {
                transform: translate(2px, 2px);
              }

              i {
                font-size: 16px;
              }
            }
          }
        }

        .tool-box {
          display: none;
        }
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
<style lang="scss">
.custom-design {
  transition: transform 0.15s ease-in-out;
}

.custom-design .vue-grid-layout {
  min-height: calc(100% - 200px);
  padding-bottom: 200px;
  box-sizing: content-box;
}

.vue-grid-item.vue-grid-placeholder {
  background: #197f54;
}

.vue-grid-item > .vue-resizable-handle {
  // position: absolute;
  // width: 0;
  // height: 0;
  // border: 6px solid;
  // border-color: transparent #ccc #ccc transparent;
  // box-sizing: border-box;
  // bottom: 0px;
  // right: 0px;
  // background: none;
  // padding: 0;
  // z-index: 99;
  // background-color: #197f54;
  background-size: 50%;
  bottom: 0px;
  right: 0px;
  z-index: 99;
  // width: 0;
  // height: 0;

  &:hover {
    // border-width: 2px;
    // border-color: transparent #409eff #409eff transparent;
    &::after {
      content: "";
      position: absolute;
      right: 2px;
      bottom: 2px;
      width: 4px;
      height: 20px;
      background: #409eff;
    }

    &::before {
      content: "";
      position: absolute;
      right: 2px;
      bottom: 2px;
      width: 20px;
      height: 4px;
      background: #409eff;
    }
  }
}

.vue-grid-item:hover .vue-resizable-handle {
  // border-color: transparent #197f54 #197f54 transparent;
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
  z-index: 199;
  transition: all 0.3s ease-in-out;

  &:hover {
    font-size: 28px;
    font-weight: bold;
    background-color: #333;
    color: #fff;
  }
}

.custom-design.mobile {
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
