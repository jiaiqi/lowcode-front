<template>
  <div
    :class="{
      'bx-card': true,
      'marquee-mode': childAnimationType === '跑马灯',
    }"
    :style="[
      childAnimationType == '跑马灯' ? {} : gridStyle,
      {
        // 当启用垂直滚动时，父div作为可视区域容器
        height:
          childAnimationType === '纵向滚动'
            ? `${this.displayRowLimit * this.averageChildHeight}px`
            : 'auto',
        overflow:
          childAnimationType === '纵向滚动' || childAnimationType === '跑马灯'
            ? 'hidden'
            : 'visible',
        position:
          childAnimationType === '纵向滚动' || childAnimationType === '跑马灯'
            ? 'relative'
            : 'static',
      },
    ]"
    ref="cardRef"
  >
    <div
      ref="cardInnerContainer"
      :style="[
        { gap: gridStyle && gridStyle.gap },
        // gridStyle
        {
          '--child-animation-step': childAnimationConfig.step,
          '--child-animation-type': childAnimationType,
          '--child-animation-direction': childAnimationConfig.direction,
          '--child-animation-delay': childAnimationConfig.delay,
          // 纵向滚动时，内部容器作为可滚动内容区域
          position: childAnimationType === '纵向滚动' ? 'absolute' : 'static',
          top: 0,
          left: 0,
          right: 0,
        },
      ]"
      class="card-inner-container"
      :class="{
        'marquee-wrap':
          childAnimationConfig && childAnimationConfig.type === '跑马灯',
        'vertical-scroll-container': childAnimationType === '纵向滚动',
      }"
      v-if="
        childAnimationConfig &&
        (childAnimationConfig.type === '跑马灯' ||
          childAnimationConfig.type === '纵向滚动')
      "
    >
      <template v-for="(cellItemData, index) in cellDataFinal">
        <div
          :class="{
            'marquee-item':
              childAnimationConfig && childAnimationConfig.type === '跑马灯',
          }"
          :data-item-data="getStr(cellItemData, 'item')"
          :data-jump-json="getStr(cellsLayout, 'jumpJson')"
        >
          <card-cell-layout
            v-for="(cellLayoutJson, i) in cellsLayout"
            :item="getLayoutJson(cellLayoutJson, index)"
            :cellLayoutJson="getLayoutJson(cellLayoutJson, index)"
            :pageItem="pageItem"
            :currentRadio="currentRadio"
            :cellItemData="cellItemData"
            :cell-data="cellDataRun"
            :comColMap="comColMap"
            :readOnly="readOnly"
            :query-options="queryOptions"
            :page-params-model="pageParamsModel"
            :showActiveCard="showActiveCard"
            :inList="inList"
            :key="i"
            @mouse-enter="setActiveCardIndex(index)"
            @mouse-leave="activeCardAutoplay"
            @on-click-cell="onClickCell"
            @show-dialog="showDialog"
            @refresh-component="$emit('refresh-component')"
            :class="{
              'marquee-item':
                childAnimationConfig && childAnimationConfig.type === '跑马灯',
            }"
          >
            <template #footer>
              <slot name="footer" :data="cellItemData"></slot>
            </template>
          </card-cell-layout>
        </div>
      </template>
    </div>
    <template v-else>
      <template v-for="(cellItemData, index) in cellDataFinal">
        <card-cell-layout
          v-for="(cellLayoutJson, i) in cellsLayout"
          :item="getLayoutJson(cellLayoutJson, index)"
          :cellLayoutJson="getLayoutJson(cellLayoutJson, index)"
          :pageItem="pageItem"
          :currentRadio="currentRadio"
          :cellItemData="cellItemData"
          :cell-data="cellDataRun"
          :comColMap="comColMap"
          :readOnly="readOnly"
          :query-options="queryOptions"
          :page-params-model="pageParamsModel"
          :showActiveCard="showActiveCard"
          :inList="inList"
          :key="i"
          @mouse-enter="setActiveCardIndex(index)"
          @mouse-leave="activeCardAutoplay"
          @on-click-cell="onClickCell"
          @show-dialog="showDialog"
          @refresh-component="$emit('refresh-component')"
        >
          <template #footer>
            <slot name="footer" :data="cellItemData"></slot>
          </template>
        </card-cell-layout>
      </template>
    </template>
    <custom-dialog :visible.sync="dialogVisible" @close="handleDialogClose">
      <div
        v-if="iframeLoading && dialogPosition && !dialogPosition.pageNo"
        class="iframe-loading"
      >
        <el-loading-spinner></el-loading-spinner>
        <div class="loading-text">
          <p>
            加载中<span class="loading-dots"><i>.</i><i>.</i><i>.</i></span>
          </p>
        </div>
      </div>
      <lowcode-page
        :prop-page-no="dialogPosition.pageNo"
        v-if="dialogPosition && dialogPosition.pageNo"
        @executor-complete="executorComplete"
      >
      </lowcode-page>
      <iframe
        v-else-if="dialogUrl && dialogVisible"
        :src="dialogUrl"
        frameborder="0"
        style="width: 100%; height: 80vh"
        @load="iframeLoading = false"
      ></iframe>
    </custom-dialog>
  </div>
</template>
<style>
.iframe-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.95);
  z-index: 10;
  animation: fadeIn 0.5s ease-in-out;
  backdrop-filter: blur(3px);
  box-shadow: inset 0 0 15px rgba(64, 158, 255, 0.1);
  transition: all 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.1);
  }

  100% {
    transform: scale(1);
  }
}

.iframe-loading .el-loading-spinner {
  animation: pulse 1.5s infinite ease-in-out;
  filter: drop-shadow(0 0 5px rgba(64, 158, 255, 0.5));
}

.iframe-loading .loading-text {
  margin-top: 15px;
  text-align: center;
}

.iframe-loading p {
  color: #409eff;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 1px;
  margin: 0;
}

.loading-dots {
  display: inline-block;
}

.loading-dots i {
  display: inline-block;
  opacity: 0;
  font-style: normal;
  animation: loadingDots 1.5s infinite;
}

.loading-dots i:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dots i:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes loadingDots {
  0% {
    opacity: 0;
  }

  50% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}
</style>
<script>
/**
 *
 * @description "card-group-cell" 支持灵活配置样式的布局单元
 * @tutorial
 * @property {Object} pageItem = {} 公共组件参数  #废弃
 * @property {Object} cellData = {} 单元 data {}
 * @property {Array} cellsLayout = {} 单元布局配置[{}]
 * @property {Object} cardLayout = {} 组件 card_layout_json
 * @property {Object} comColMap = {}  字段值映射关系
 * @property {Boolean} cellLayoutRepeat = false  单元布局是否重复,暂未启用
 * @property {Boolean} readOnly = false  是否只读，只读 = true 时，拦截所有点击事件。
 * @event {Function} on-click-cell 点击单元事件
 * @event {Function} on-click-sub-block 点击row 部件 事件
 * @event {Function} on-click-icon 点击icon类型 部件 事件
 * @example  import cardGroupCell from '@/components/card-group-cell/card-group-cell.vue'
 * <cardGroupCell ref="cardGroupCell" @on-click-cell="onClickCell" @on-click-block="onClickBlock"  @on-click-icon="onClickBlock"></cardGroupCell>
 */
// import {
//   debounce,
//   throttle
// } from '@/common/func/util.js'

// import cardGroupCellItem from '@/components/card-group-cell-item/card-group-cell-item.vue'
// import bxform from '@/views/custom/components/bx-form/bx-form.vue'
var self = null;
import Teleport from "vue2-teleport";
import { Icon } from "@iconify/vue2";
import cardGroupCellMxin from "./card-group-cell-mixin.js"; // 新的确实方法依赖 混入
import marqueeMixin from "./marquee-mixin.js"; // 跑马灯混入
import verticalScrollMixin from "@/components/mixin/vertical-scroll-mixin.js"; // 通用纵向滚动混入
import dayjs from "dayjs";
import { mapGetters, mapActions } from "vuex";
import cardCellPart from "./card-cell-part.vue";
import { formatStyleData } from "@/pages/lowcode/vendor/datav/common/index.js";
import { normalizeJumpFilePath } from "@/common/common";
import cardCellLayout from "./card-cell-layout.vue";
import customDialog from "./custom-dialog.vue";
import cloneDeep from "lodash/cloneDeep.js";
// import lowcodePage from '../../../../lowcode/view.vue'
let activeCardTimer = null;

export default {
  components: {
    Teleport,
    Icon,
    cardCellPart,
    cardCellLayout,
    customDialog,
    lowcodePage: () => import("@/pages/lowcode/view.vue"),
  },
  name: "card-group-cell",
  mixins: [cardGroupCellMxin, marqueeMixin, verticalScrollMixin],

  data() {
    return {
      updateService: "",
      updateDatakey: "id",
      updateDataVal: "",
      updateTitle: "",
      activeMode: null,
      dialogPosition: null,
      dialogVisible: false,
      dialogUrl: "",
      iframeLoading: true,
      currentAccordionSeq: 1,
      activeCardIndex: 0,
      // 缓存的子元素平均高度
      cachedAverageChildHeight: 46, // 默认高度
    };
  },
  watch: {
    dialogVisible(val) {
      if (!val) {
        // 对话框关闭时重置loading状态
        this.iframeLoading = true;
      }
    },

    // 监听数据变化，更新高度缓存
    cellDataFinal: {
      handler(newVal, oldVal) {
        if (newVal !== oldVal) {
          this.updateChildHeightCache();
          // 如果是纵向滚动模式，重启滚动
          if (this.childAnimationType === "纵向滚动") {
            this.$nextTick(() => {
              this.restartVerticalScroll();
            });
          }
        }
      },
      deep: true,
    },

    // 监听布局变化，更新高度缓存
    cellsLayout: {
      handler(newVal, oldVal) {
        if (newVal !== oldVal) {
          this.updateChildHeightCache();
        }
      },
      deep: true,
    },

    // 监听动画类型变化，启动或停止滚动
    childAnimationType: {
      handler(newVal) {
        if (newVal === "纵向滚动") {
          this.$nextTick(() => {
            this.startCardVerticalScroll();
          });
        } else {
          this.stopCardVerticalScroll();
        }
      },
    },
  },
  props: {
    readOnly: {
      type: Boolean,
      default() {
        return false;
      },
    },
    listOptions: {
      type: [Object, Array],
      default: function () {
        return [];
      },
    },
    rowButtons: {
      type: [Object, Array],
      default: function () {
        return [];
      },
    },
    pageItem: {
      type: Object,
      default: () => {
        return {};
      },
    },
    cellData: {
      type: [Object, Array],
      default: () => {
        return [];
      },
    },
    comColMap: {
      type: Object,
      default: null,
    },
    cellsLayout: {
      type: [Array],
      default: function () {
        return [];
      },
    },
    cardLayout: {
      type: Object,
      default: () => {
        return {};
      },
    },
    selectorMode: {
      type: String,
    },
    listUseType: {
      type: String,
    },
    currentRadio: {
      type: String,
    },
    pageParamsModel: {
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
    activeCellLayout: {
      type: [Object, null],
      default: () => {
        return {};
      },
    },
    // 是否垂直滚动
    isVerticalScroll: {
      type: Boolean,
      default: false,
    },
    // 显示行数限制
    displayRowLimit: {
      type: Number,
      default: 5,
    },
    listConfig: {
      type: [Object, null],
      default: () => {
        return {};
      },
    },
    // cellLayoutRepeat:{
    // 	type:Boolean,
    // 	default:function(){
    // 		return false
    // 	}
    // }               // repeat：重复布局，配置一个单元布局，其余数据按照该单元循环  static:静态布局，按照配置单元渲染界面，不会重复
  },
  computed: {
    childAnimationType() {
      return (
        this.listConfig?.use_animation === "是" &&
        (this.listConfig?.animation_type ||
          this.listConfig.child_animation_type)
      );
    },
    childAnimationConfig() {
      let obj = {};
      if (this.listConfig?.use_animation === "是") {
        // 针对纵向滚动，默认方向设置为向上
        const defaultDirection =
          (this.listConfig?.animation_type ||
            this.listConfig.child_animation_type ||
            "跑马灯") === "纵向滚动"
            ? "向上"
            : "由左往右";

        obj = {
          type:
            this.listConfig?.animation_type ||
            this.listConfig.child_animation_type ||
            "跑马灯",
          step: this.listConfig?.animation_step || "100",
          direction: this.listConfig?.animation_direction || defaultDirection,
          interval: (this.listConfig?.animation_interval || 1) * 1000, // 转换为毫秒
          delay: (this.listConfig?.animation_delay || 0) * 1000, // 转换为毫秒
        };
      }
      return obj;
    },
    // 获取子元素的平均高度（使用缓存）
    averageChildHeight() {
      return this.cachedAverageChildHeight;
    },
    inList() {
      return this.pageItem?.com_type === "list";
    },
    showActiveCard() {
      if (this.activeCellLayout?.parts_json?.length) {
        return true;
      }
    },
    showRowButtons() {
      let show = false;
      if (this.pageItem && this.pageItem.com_type == "list") {
        if (
          this.pageItem.list_json.list_options &&
          this.pageItem.list_json.list_options.indexOf("单元按钮") !== -1 &&
          this.rowButtons.length > 0
        ) {
          show = true;
        }
      }
      return show;
    },
    comColMapRun: function () {
      let configJson = this.comColMap;
      let maps = this.paramsBuild(configJson);
      // console.log('comColMapRun',maps)
      //  url   sys user page com srv_col srv_cond
      // let target = configJson?.dest_owner  // 目标
      // let source = configJson?.src_owner  // 源
      // let map = configJson?.cols_map_json || {}
      return maps;
    },
    cells: function () {
      return this.cellsLayout || [];
    },
    cellStyle: function () {
      let style =
        this.cardLayout && this.cardLayout?.style_json
          ? this.cardLayout?.style_json
          : {};
      return style;
    },
    totalMaximum: function () {
      let config = this.cardLayout || {};
      config.rows_max = Number(config?.rows_max);
      let maxPageRowNumber = this.pageItem?.srv_req_json?.page?.rownumber || 9;
      let maximum =
        config && config.rows_max && config.cols_num
          ? config["rows_max"] * config["cols_num"]
          : maxPageRowNumber;
      if (config["rows_max"] == "0" || config["rows_max"] == "全部") {
        maximum = maxPageRowNumber;
      }
      return maximum;
    },
    gridStyle: function () {
      let style = {};
      let config = this.cardLayout || {
        rows_max: 1,
        cols_num: 1,
      };
      // console.log('config',config)
      let height =
        config.hasOwnProperty("style_json") &&
        config.style_json.hasOwnProperty("height")
          ? config.style_json.height
          : "auto";
      let configStyle = config["style_json"] || {};
      if (config.layout_type == "表格") {
        style["display"] = "grid";
        if (config["rows_max"]) {
          style[
            "grid-template-rows"
          ] = `repeat(${config["rows_max"]},${height})`;
        }

        style["grid-template-columns"] = `repeat(${config["cols_num"]}, 1fr)`;
      }
      for (let arr in configStyle) {
        if (configStyle[arr]) {
          style[arr.replace(/_/g, "-")] = configStyle[arr];
        }
      }
      if (Object.keys(style).indexOf("gap") == -1) {
        style["gap"] = "5px";
      }
      let style_json_diy = config.style_json_diy || {};
      if (Object.keys(style_json_diy).indexOf("gap") !== -1) {
        style["gap"] = style_json_diy["gap"];
      }
      if (Object.keys(style_json_diy).indexOf("column-gap") !== -1) {
        style["column-gap"] = style_json_diy["column-gap"];
      }
      if (Object.keys(style_json_diy).indexOf("row-gap") !== -1) {
        style["row-gap"] = style_json_diy["row-gap"];
      }
      style["margin"] = 0;
      return style;
    },
    cellDataRun: function () {
      let data = this.cellData;
      if (data && !Array.isArray(data)) {
        return [data];
      } else if (data.length > 0) {
        return data;
      } else if (this.pageItem?.com_type !== "list") {
        return [""];
      } else {
        return data;
      }
    },
    cellDataFinal() {
      let res = cloneDeep(this.cellDataRun);
      let max = this.totalMaximum;
      if (max) {
        res = res.slice(0, max);
      }
      return res;
    },
    srvApp() {
      return (
        this.pageItem?.srv_req_json?.mapp ||
        sessionStorage.getItem("current_app")
      );
    },
  },
  mounted() {
    // 初始计算子元素高度
    this.$nextTick(() => {
      this.calculateAverageChildHeight(true);
      const marqueeElement = this.$refs.cardInnerContainer;
      if (marqueeElement?.classList.contains("marquee-wrap")) {
        this.setMarqueeItemWidth(marqueeElement);
      }
    });

    // 启动动画
    const animationType = this.childAnimationType;
    if (!animationType) return;

    if (animationType === "跑马灯") {
      const config = this.childAnimationConfig;
      setTimeout(() => {
        this.startMarqueeAnimation(config, "cardInnerContainer");
      }, 3000);
    } else if (
      this.childAnimationType?.includes("焦点") &&
      this.childAnimationType?.includes("轮播")
    ) {
      this.activeCardIndex = 0;
      this.activeCardAutoplay();
    } else if (animationType === "纵向滚动") {
      // 使用通用纵向滚动混入
      this.$nextTick(() => {
        // 确保在启动滚动前计算高度
        this.calculateAverageChildHeight(true);
        this.startCardVerticalScroll();
      });
    }
  },
  beforeDestroy() {
    activeCardTimer && clearInterval(activeCardTimer);
  },

  methods: {
    ...mapActions("loginInfo", ["initLoginInfo"]),

    /**
     * 计算子元素的平均高度并缓存
     * @param {boolean} forceUpdate - 是否强制更新缓存
     * @returns {number} 平均高度
     */
    calculateAverageChildHeight(forceUpdate = false) {
      // 如果不强制更新且已有缓存值，直接返回
      if (!forceUpdate && this.cachedAverageChildHeight > 0) {
        return this.cachedAverageChildHeight;
      }

      const defaultHeight = 46;

      try {
        if (
          this.$refs.cardInnerContainer &&
          this.$refs.cardInnerContainer.children.length > 0
        ) {
          const children = this.$refs.cardInnerContainer.children;
          // 过滤出非克隆的原始子元素
          const originalChildren = Array.from(children).filter(
            (child) => !child.classList.contains("vertical-scroll-clone")
          );

          if (originalChildren.length > 0) {
            const totalHeight = originalChildren.reduce(
              (sum, child) => sum + child.offsetHeight,
              0
            );
            const avgHeight = Math.round(totalHeight / originalChildren.length);

            // 缓存计算结果
            this.cachedAverageChildHeight = avgHeight;
            return avgHeight;
          }
        }
      } catch (error) {
        console.warn("计算子元素高度时出错:", error);
      }

      // 如果无法获取实际高度，使用默认值并缓存
      this.cachedAverageChildHeight = defaultHeight;
      return defaultHeight;
    },

    /**
     * 更新子元素高度缓存
     * 在DOM更新后调用此方法
     */
    updateChildHeightCache() {
      this.$nextTick(() => {
        this.calculateAverageChildHeight(true);
      });
    },

    executorComplete(data) {
      console.log("executorComplete", data);
      this.handleDialogClose();
    },

    getStr(json, type) {
      if (type === "item") {
        return JSON.stringify(json || null);
      } else {
        if (Array.isArray(json) && json.length) {
          return JSON.stringify(json[0]?.jump_json || null) || "";
        }
      }
    },
    handleDialogClose() {
      this.dialogVisible = false;
      this.dialogUrl = "";
      this.dialogPosition = null;
      this.iframeLoading = true;
    },
    setActiveCardIndex(index) {
      clearInterval(activeCardTimer);
      this.activeCardIndex = index;
    },
    activeCardAutoplay() {
      let direction = this.childAnimationConfig?.direction;
      if (activeCardTimer) {
        clearInterval(activeCardTimer);
      }
      this.$nextTick(() => {
        activeCardTimer = setInterval(() => {
          const listLength = this.cellDataFinal?.length || 0;
          if (direction === "由上至下") {
            this.activeCardIndex = (this.activeCardIndex + 1) % listLength;
          } else if (direction === "由下至上") {
            this.activeCardIndex =
              (this.activeCardIndex - 1 + listLength) % listLength;
          }
          console.log("activeCardIndex:", this.activeCardIndex);
        }, this.childAnimationConfig?.interval || 3000);
      });
    },
    getLayoutJson(layout, index) {
      if (this.showActiveCard && this.activeCardIndex === index) {
        return this.activeCellLayout;
      }
      return layout;
    },
    recoverFileAddress(val = "") {
      if (typeof val !== "string") {
        return val;
      }
      if (
        val &&
        typeof val === "string" &&
        val.indexOf("$bxFileAddress$") === -1
      ) {
        return val;
      }
      // 替换文件前缀
      const prefix = this.serviceApi().downloadFilePrefix;
      val = val?.replaceAll?.("$bxFileAddress$", prefix) || "";
      // 使用正则表达式来匹配 bx_auth_ticket 的值，并使用sessionStorage.bx_auth_ticket替换它
      const ticketStr = `bx_auth_ticket=${sessionStorage.bx_auth_ticket}`;
      val = val.replace(/(bx_auth_ticket=)[^&]+/gi, ticketStr);
      // console.log('getPartModelData:recoverFileAddress:', val);

      return val;
    },
    paramsBuild(json) {
      if (!json) {
        return;
      }
      let configJson = json;
      //  url   sys user page com srv_col srv_cond
      let target = configJson?.dest_owner; // 目标
      let source = configJson?.src_owner; // 源
      let map = configJson?.cols_map_json || {};
      let maps = {
        target: {},
        source: {},
      };
      maps["target"][target] = map;
      return maps;
    },
    v2Loaded(e) {
      this.updateTitle = e?.service_view_name;
      console.log(e);
    },
    onSubmitForm(e) {
      // 表单提交
      this.$emit("data-updated", e); //通知父组件数据更新完成
      console.log("表单提交成功：：：", e);
      this.closeUpdateFormPopup();
    },
    openUpdateFormPopup(id, service) {
      // id = '13'
      // service = 'srvwuliu_car_update'
      if (id && service) {
        this.updateService = service;
        this.updateDataVal = id;
        this.$refs?.updateFormPopup?.open();
      }
    },
    closeUpdateFormPopup() {
      this.updateService = null;
      this.updateDataVal = null;
      this.updateTitle = null;
      this.$refs?.updateFormPopup?.close();
    },
    getButtonVisible(cellItemData, button, ib) {
      // listCard、cardGroupCell组件统一不显示详情按钮 230824
      if (button?.button_type === "detail") {
        return false;
      }
      if (
        Array.isArray(cellItemData?._buttons) &&
        cellItemData._buttons.length >= ib + 1
      ) {
        return cellItemData["_buttons"][ib] === 1;
      } else {
        return false;
        console.log(
          cellItemData,
          "getButtonVisible---->cellItemDatacellItemDatacellItemData"
        );
        return (
          button.permission &&
          (!button.hasOwnProperty("visible") || button?.visible === "是")
        );
      }
    },
    onRowButton(e) {
      if (this.readOnly) {
        return;
      }
      this.$emit("on-row-button-click", e);
    },
    onClickCell(item, cellLayoutJson) {
      if (this.readOnly) {
        return;
      }
      console.log("bx-card-cell");
      // 设置选中数据
      this.$set(this, "activeMode", item);
      this.$emit("on-click-cell", {
        data: item,
        cellsLayout: cellLayoutJson,
      });
    },
    toLogin() {
      if (process.env.NODE_ENV === "development") {
        return this.$loginRef?.open((res) => {
          console.log(res);
          if (res) {
            this.initLoginInfo(res);
          }
        });
      }
      const currentUrl = window.location.pathname + window.location.hash;
      sessionStorage.setItem("login_redirect_url", currentUrl);
      const loginUrl = window.location.origin + "/main/login.html";
      window.location.href = loginUrl;
    },
    showDialog({ rect, data, jumpJson }) {
      if (this.readOnly) {
        return;
      }
      if (jumpJson) {
        const x = rect.left;
        const y = rect.top;
        const w = rect.width;
        const h = rect.height;
        console.log("弹框:", x, y, w, h);
        if (jumpJson.tmpl_page_json?.file_path) {
          let pagePath = normalizeJumpFilePath(jumpJson.tmpl_page_json.file_path);
          if (jumpJson.dest_page_no) {
            pagePath = pagePath.replace(":pageNo", jumpJson.dest_page_no);
          }
          if (jumpJson.cols_map_json?.cols_map_detail_json?.length) {
            const mapJson = jumpJson.cols_map_json?.cols_map_detail_json;
            mapJson.forEach((item) => {
              if (
                item.to_type === "URL" &&
                ["当前数据", "业务", "模型"].includes(item.from_type) &&
                data?.[item.col_from]
              ) {
                pagePath?.includes("?")
                  ? (pagePath += `&${item.col_to}=${data[item.col_from]}`)
                  : (pagePath += `?${item.col_to}=${data[item.col_from]}`);
              }
            });
          }
          if (pagePath) {
            if (jumpJson?.click_type === "弹框") {
              this.dialogUrl = pagePath;
              this.dialogPosition = {
                x,
                y,
                w,
                h,
                pageNo: jumpJson.dest_page_no,
              };
              this.dialogVisible = true;
              this.iframeLoading = true;
            } else {
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
                    const currentUrl =
                      window.location.pathname + window.location.hash;
                    sessionStorage.setItem("login_redirect_url", currentUrl);
                    const loginUrl =
                      window.location.origin + "/main/login.html";
                    window.location.href = loginUrl;
                  });
                  return;
                }
              }
              open(pagePath);
            }
          }
        }
      }
    },
    buildColStyleJson(styleJson, cssArr, cellLayoutJson, column) {
      let style = {};
      if (styleJson) {
        style = formatStyleData(styleJson);
      }

      let bgImg = cellLayoutJson?.background_image || "";
      if (styleJson && styleJson.background_image) {
        bgImg = styleJson.background_image;
      }
      if (bgImg) {
        // 单元背景图 补偿样式。
        style["background-image"] = `url(${this.getImagePath(bgImg)})`;
        style["background-size"] = "100% 100%";
        style["background-repeat"] = "norepeat";
      }
      if (cellLayoutJson && !style.hasOwnProperty("min-height") && bgImg) {
        style["min-height"] = "60px";
      }
      // if (!style["background-color"]) {
      //   style["background-color"] = "transparent";
      // }
      if (!style["overflow"]) {
        // style["overflow"] = "hidden";
      }
      // console.log("styleJson", style);
      if (column) {
        return style[column] || "";
      }
      return style;
    },

    /**
     * 开始卡片纵向滚动 - 使用通用混入
     */
    startCardVerticalScroll() {
      const config = {
        interval: this.childAnimationConfig?.interval || 3000,
        direction: this.childAnimationConfig?.direction || "up",
        duration: this.childAnimationConfig?.duration || 2000,
      };

      const options = {
        containerSelector: "cardInnerContainer",
        containerType: "ref",
      };

      this.startVerticalScroll(config, options);
    },

    /**
     * 停止卡片纵向滚动 - 使用通用混入
     */
    stopCardVerticalScroll() {
      this.stopVerticalScroll();
    },
  },
};
</script>

<style lang="scss">
/* 跑马灯公共样式：元素渲染于子组件 card-cell-part，scoped 选择器无法匹配，必须全局引入 */
@import "./marquee.css";
</style>

<style lang="scss" scoped>
.bx-text-cell {
  // overflow: hidden;

  .u-wrap {
    background-color: transparent !important;
  }
}

.bx-card {
  position: relative;
  flex: 1;
}

.update-title {
  background-color: #fff;
  text-align: center;
  padding: 10px;
  font-size: 16px;
  font-weight: bold;
}

.popup-form-warp {
  max-height: 80vh;
  overflow-y: scroll;
  background-color: #fff;
}

/* 纵向滚动容器样式 */
.vertical-scroll-container {
  position: relative;
  display: block;

  // 确保子元素在滚动过程中平滑过渡
  > div {
    position: relative;
    // 启用硬件加速
    transform: translateZ(0);
    will-change: transform;
  }
}
</style>
