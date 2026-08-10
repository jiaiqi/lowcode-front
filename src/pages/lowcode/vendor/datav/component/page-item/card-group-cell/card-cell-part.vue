<template>
  <Fragment v-if="partsShow">
    <weather
      v-if="partsType === '天气'"
      :page-item="pageItem"
      :container-style="buildColStyleJson"
    ></weather>
    <div
      v-else-if="['附件'].includes(cellItem.parts_type)"
      class="bx-cell-variable"
      :class="{
        'cursor-pointer': isLink,
      }"
      @click.stop="onClickSubBlock()"
      :style="[buildColStyleJson]"
      :ref="partsType"
    >
      {{ getFileName || "" }}
    </div>
    <!-- 文件列表：展示该 file_no 下所有附件简要信息，支持下载按钮 -->
    <div
      v-else-if="['文件列表', 'fileList'].includes(cellItem.parts_type)"
      class="bx-cell-file-list"
      :style="[buildColStyleJson]"
      :ref="partsType"
    >
      <template v-if="Array.isArray(attachmentList) && attachmentList.length">
        <div
          class="bx-cell-file-item"
          v-for="(file, fIdx) in attachmentList"
          :key="file.id || file.file_id || fIdx"
        >
          <span class="i-ep-document bx-cell-file-icon"></span>
          <div class="bx-cell-file-info">
            <div class="bx-cell-file-name" :title="file.src_name">
              {{ file.src_name || "附件" + (fIdx + 1) }}
            </div>
            <div class="bx-cell-file-meta">
              <span v-if="file.file_type" class="bx-cell-file-tag">{{
                String(file.file_type).toUpperCase()
              }}</span>
              <span v-if="file.file_size" class="bx-cell-file-size">{{
                file.file_size
              }}</span>
              <!-- <span v-if="file.create_user_disp" class="bx-cell-file-user">{{
                file.create_user_disp
              }}</span>
              <span v-if="file.create_time" class="bx-cell-file-time">{{
                formatAttachmentTime(file.create_time)
              }}</span> -->
            </div>
          </div>
          <!-- 下载按钮：仅 sys_fun 含“下载” 且 后端 _dl_auth !== false 时显示 -->
          <el-button
            v-if="canDownloadAttachment && file._dl_auth !== false"
            class="bx-cell-file-download-btn"
            type="primary"
            size="mini"
            circle
            @click.stop="onDownloadAttachmentItem(file)"
          >
            <span class="i-ep-download"></span>
          </el-button>
        </div>
      </template>
      <div v-else class="bx-cell-file-empty">暂无附件</div>
    </div>
    <LiquidFillChart
      v-else-if="partsType === '水球图'"
      :value="setPartModelData"
      :ref="partsType"
      :style="[buildColStyleJson]"
      :color="setLiquidConfig.color"
      :wave-color="setLiquidConfig.waveColor"
      :wave-bg-color="setLiquidConfig.waveBgColor"
      :wave-outline-color="setLiquidConfig.waveOutlineColor"
      :wave-font-size="setLiquidConfig.waveFontSize"
    />
    <ProgressRing
      v-else-if="partsType === '进度圆环'"
      :value="setPartModelData"
      :ref="partsType"
      :style="[buildColStyleJson]"
      :size="progressRingConfig.size"
      :stroke-width="progressRingConfig.strokeWidth"
      :progress-color="progressRingConfig.progressColor"
      :bg-color="progressRingConfig.bgColor"
      :text-color="progressRingConfig.textColor"
      :font-size="progressRingConfig.fontSize"
      :show-text="progressRingConfig.showText"
      :show-unit="progressRingConfig.showUnit"
      :unit="progressRingConfig.unit"
      :max-value="progressRingConfig.maxValue"
      :label="progressRingConfig.label"
      :label-color="progressRingConfig.labelColor"
      :label-font-size="progressRingConfig.labelFontSize"
    />
    <page-item-chart
      v-else-if="chartPartTypes.includes(partsType)"
      :page-item="buildChartPageItem"
      :ref="partsType"
      :style="[buildColStyleJson]"
      @click-chart="handleChartClick"
    />
    <video
      class="bx-cell-video"
      :controls="videoAttribute.controls === true"
      :muted="videoAttribute.muted === true"
      :loop="videoAttribute.loop === true"
      :controlslist="videoAttribute.controlslist"
      :autoplay="videoAttribute.autoplay === true"
      :poster="videoPoster"
      :class="{
        'cursor-pointer': isLink,
      }"
      :src="getImagePath(setPartModelData)"
      :style="[buildColStyleJson]"
      v-else-if="['视频'].includes(partsType)"
      :ref="partsType"
    ></video>
    <hlsplayer-video
      v-else-if="['hls视频'].includes(partsType)"
      :cellItem="cellItem"
      :cellItemData="cellItemData"
      :pageItem="pageItem"
    >
    </hlsplayer-video>
    <div
      v-else-if="textPartTypes.includes(cellItem.parts_type)"
      class="bx-cell-string"
      :class="[
        {
          'cursor-pointer': isLink,
        },
        animationClass,
      ]"
      @click.stop="onClickSubBlock()"
      :style="[buildColStyleJson, animationStyle]"
      :ref="partsType"
    >
      {{ setPartModelData }}
    </div>
    <div
      v-else-if="['variable', '变量'].includes(cellItem.parts_type)"
      class="bx-cell-variable"
      :class="{
        'cursor-pointer': isLink,
      }"
      @click.stop="onClickSubBlock()"
      :style="[buildColStyleJson]"
      :ref="partsType"
    >
      {{ setPartModelData || "" }}
    </div>
    <img loading="lazy"
      v-else-if="['图片', 'iconImg'].includes(item.parts_type)"
      @click.stop="onClickSubBlock()"
      :src="getImagePath(setPartModelData, item.img_dpi)"
      class="demo-layout bx-text-cell"
      :class="{
        'cursor-pointer': isLink,
      }"
      :style="[buildColStyleJson, { objectFit: setScaleMode }]"
      :ref="partsType"
      decoding="async"
    />
    <el-rate
      :disabled="true"
      v-else-if="['rate', '星级评分'].includes(item.parts_type)"
      :count="5"
      :value="Number(setPartModelData) || 0"
      :ref="partsType"
    ></el-rate>
    <el-progress
      :show-text="false"
      :style="[buildColStyleJson]"
      v-else-if="['progress', '进度条'].includes(item.parts_type)"
      :count="5"
      :define-back-color="buildColStyleJson['background-color'] || ''"
      :color="buildColStyleJson.color || '#2979ff'"
      :percentage="Number(setPartModelData) || 0"
      :ref="partsType"
    ></el-progress>
    <div
      v-else-if="iconPartTypes.includes(item.parts_type) && !setPartModelData"
      :style="[buildColStyleJson]"
    ></div>
    <i
      v-else-if="
        iconPartTypes.includes(item.parts_type) &&
        setPartModelData &&
        setPartModelData.indexOf('el-icon-') === 0
      "
      :class="[setPartModelData, { 'cursor-pointer': isLink }]"
      :style="[buildColStyleJson]"
      @click.stop="onClickSubBlock()"
      :ref="partsType"
    ></i>
    <Icon
      v-else-if="iconPartTypes.includes(item.parts_type) && getIconName"
      :icon="getIconName"
      class="bx-cell-icon"
      :class="[{ 'cursor-pointer': isLink }, setPartModelData]"
      :style="[buildColStyleJson]"
      @click.stop="onClickSubBlock()"
      :ref="partsType"
    ></Icon>
    <div
      v-else-if="item.parts_type == '富文本'"
      :style="[buildColStyleJson]"
      class="bx-cell-rich-text"
      v-html="recoverFileAddress4richText(setPartModelData)"
      :ref="partsType"
    ></div>
    <qr-code
      :size="getQrcodeSize"
      :text="setPartModelData || 'https://www.baidu.com'"
      :color="buildColStyleJson.color || '#000000'"
      :style="[buildColStyleJson]"
      v-else-if="cellItem.parts_type == '二维码'"
      :ref="partsType"
      @click.native.stop="onClickSubBlock()"
    ></qr-code>
    <div
      v-else-if="cellItem.parts_type === '倒计时'"
      :style="[buildColStyleJson]"
      :ref="partsType"
    >
      {{ countdownDisplay }}
    </div>
    <date-picker
      v-else-if="
        [
          '日期选择器',
          '时间选择器',
          '日期时间选择器',
          '日期范围选择器',
          '时间范围选择器',
          '日期时间范围选择器',
          '月份选择器',
          '年份选择器',
        ].includes(cellItem.parts_type)
      "
      :parts-type="cellItem.parts_type"
      :value="setPartModelData || ''"
      :style="[buildColStyleJson]"
      :start-date="startDate"
      :end-date="endDate"
      :ref="partsType"
      :custom-value-format="cellItem.date_value_format || ''"
      @change="handleFormPartChange"
    ></date-picker>
    <drop-down
      v-else-if="cellItem.parts_type === '下拉选项'"
      :cellItem="cellItem"
      :style="[buildColStyleJson]"
      :value="setPartModelData || ''"
      @change="handleFormPartChange"
      :ref="partsType"
    ></drop-down>
    <div
      ref="bxCellContainer"
      v-else-if="containerPartTypes.includes(cellItem.parts_type)"
      :class="{
        'marquee-mode': childAnimationType === '跑马灯',
        'cursor-pointer': isLink && childAnimationType !== '跑马灯',
        ['bx-cell-' + cellItem.parts_type]: childAnimationType !== '跑马灯',
      }"
      :style="[
        childAnimationType === '跑马灯'
          ? { width: buildColStyleJson.width }
          : buildColStyleJson,
      ]"
      :data-jump-json="jumpJson"
      :data-item-data="itemDataStr"
      @click.stop="onClickSubBlock()"
      @mouseenter="onMouseenter"
      @mouseleave="onMouseleave"
    >
      <div
        ref="bxCellInnerContainer"
        class="marquee-wrap"
        :class="[
          'bx-cell-' + cellItem.parts_type,
          {
            'cursor-pointer': isLink,
          },
        ]"
        @click.stop="onClickSubBlock()"
        v-if="childAnimationType === '跑马灯'"
      >
        <template v-for="(subCardPart, subindex) in getSubJson(cellItem)">
          <card-cell-part
            :cellItem="subCardPart"
            :comColMap="setComColMap"
            :cellItemData="cellItemData"
            :cellData="cellData"
            :readOnly="readOnly"
            :queryOptions="queryOptions"
            :cellLayoutJson="subCardPart"
            :parentPart="cellItem"
            :accordion="accordion"
            :accordion-seq="accordionSeq"
            :active-accordion-seq="activeAccordionSeq"
            :pageItem="pageItem"
            :pageParamsModel="pageParamsModel"
            @on-click-part="onClickSubBlock"
            @on-click-cell="onClickCell"
            @show-dialog="showDialog"
            @close-popup="$emit('close-popup')"
            class="marquee-item"
            :key="subindex"
          ></card-cell-part>
        </template>
      </div>
      <template
        v-else-if="getSubJson(cellItem) && getSubJson(cellItem).length > 0"
      >
        <template v-for="(subCardPart, subindex) in getSubJson(cellItem)">
          <card-cell-part
            :cellItem="subCardPart"
            :comColMap="setComColMap"
            :cellItemData="cellItemData"
            :cellData="cellData"
            :readOnly="readOnly"
            :queryOptions="queryOptions"
            :cellLayoutJson="subCardPart"
            :parentPart="cellItem"
            :accordion="accordion"
            :accordion-seq="accordionSeq"
            :active-accordion-seq="activeAccordionSeq"
            :pageItem="pageItem"
            :pageParamsModel="pageParamsModel"
            @on-click-part="onClickSubBlock"
            @on-click-cell="onClickCell"
            @show-dialog="showDialog"
            @close-popup="$emit('close-popup')"
            @refresh-component="$emit('refresh-component')"
            :key="subindex"
          ></card-cell-part>
        </template>
      </template>
    </div>
    <!-- 卡片弹窗 -->
    <div
      class="card-popup-overlay"
      @click="closeCardPopup"
      v-if="showCardPopup"
    >
      <card-popup
        v-if="showCardPopup && popupCardJson"
        :cardUnitJson="popupCardJson"
        :data="popupItemData"
        :clickedElement="clickedElement"
        :placement="popupPlacement"
        :pageItem="pageItem"
        @close="closeCardPopup"
        @click.stop
      />
    </div>
  </Fragment>
</template>

<script>
import "animate.css";

import { mapGetters } from "vuex";
import { Icon } from "@iconify/vue2";
import dayjs from "dayjs";
// import LiquidFillChart from "../LiquidFillChart.vue";
const datePicker = () => import("./parts/date-picker.vue");
const dropDown = () => import("./parts/drop-down.vue");
const qrCode = () => import("../qr-code/qr-code.vue");
const weather = () => import("../widgets/weather.vue");

import { formatStyleData } from "@/pages/lowcode/vendor/datav/common";
import {
  getBaseUrl,
  setAnimationClass,
  setAnimationStyle,
} from "@/common/common";
import {
  numberAnimationRun,
  formatNumber,
  animateNumberWithFormat,
} from "@/common/animations";
import marqueeMixin from "./marquee-mixin.js"; // 跑马灯混入
import { applyEncryptParam } from "@/pages/lowcode/vendor/datav/common/index.js";
// import HlsplayerVideo from "@/components/common/hls-video/hlsplayer-video.vue";
import cardPopup from "../card-group/card-popup.vue";

import { getFilePathByNo } from "@/common/httpUtil";
import { downloadFileH5 as downloadFile, isImageFile } from "@/common/common";
import { t } from "element-ui/src/locale/index.js";
// 节流
function throttle(func, delay = 300) {
  let prev = 0;
  return function () {
    let now = Date.now();
    if (now - prev >= delay) {
      func.apply(this, arguments);
      prev = Date.now();
    }
  };
}
let numberAnimationStop = null;
export default {
  name: "cardCellPart",
  mixins: [marqueeMixin],
  options: {
    virtualHost: true, // 将自定义节点设置成虚拟的，更加接近Vue组件的表现。
  },
  components: {
    cardCellPart: () => import("./card-cell-part.vue"),
    Icon,
    LiquidFillChart: () =>
      import(/* webpackChunkName: "echarts-vendor" */ "../LiquidFillChart.vue"),
    ProgressRing: () => import("./parts/ProgressRing.vue"),
    PageItemChart: () =>
      import(/* webpackChunkName: "echarts-vendor" */ "../chart/page-item-chart.vue"),
    HlsplayerVideo: () =>
      import(
        /* webpackChunkName: "hls-video" */ "@/components/common/hls-video/hlsplayer-video.vue"
      ),
    cardPopup,
    qrCode,
    weather,
    datePicker,
    dropDown,
  },
  data() {
    return {
      fileNoMap: {},
      fileList: [],
      attachmentList: [],
      liquidColor: "",
      showCardPopup: false,
      popupCardJson: null,
      popupPlacement: "下",
      popupItemData: null,
      clickedElement: null,
      textPartTypes: ["文本", "字符串", "string", "数字", "金额", "时间日期"],
      numberPartTypes: ["数字", "金额"],
      datePartTypes: ["时间日期"],
      imagePartTypes: ["图片", "iconImg"],
      iconPartTypes: ["icon", "字体图标", "图标"],
      containerPartTypes: ["块容器", "行容器", "block", "row"],
      chartPartTypes: ["饼图", "环图"],
      countdownTimeMs: 0,
      countdownDisplay: "00日00时00分00秒",
      _countdownTimer: null,
    };
  },
  props: {
    pageItem: {
      type: Object,
    },
    cellItem: {
      type: Object,
    },
    cellItemData: {
      type: [Object, String],
    },
    cellData: {
      type: Array,
    },
    parentPart: Object,
    readOnly: {
      type: Boolean,
      default() {
        return false;
      },
    },
    comColMap: {
      type: Object,
      default: null,
    },
    cellLayoutJson: {
      type: [Array, Object],
      default: function () {
        return {};
      },
    },
    queryOptions: Object,
    pageParamsModel: Object,
    accordion: Boolean, //使用手风琴效果
    accordionSeq: Number,
    activeAccordionSeq: Number,
  },

  computed: {
    ...mapGetters("loginInfo", ["logined", "loginUser"]),
    variableKey() {
      return this.cellItem.variable || this.cellItem.opt_value_col || "";
    },
    startDate() {
      return this.cellItem.enable_date_start || "1900-01-01";
    },
    endDate() {
      return this.cellItem.enable_date_end || "2099-12-31";
    },
    getQrcodeSize() {
      let width = this.buildColStyleJson?.width || 100;
      if (typeof width === "string") {
        if (width.indexOf("rpx") > -1) {
          width = parseInt(width) * 0.5;
        }
      }
      width = parseInt(width);
      if (isNaN(width)) {
        width = 100;
      }
      return width;
    },
    setScaleMode() {
      let scale_mode = this.item.scale_mode;

      // 微信小程序图片模式到el-image模式的映射
      const modeMap = {
        // 缩放模式映射
        scaleToFill: "fill", // 不保持纵横比缩放图片，使图片的宽高完全拉伸至填满 image 元素
        aspectFit: "contain", // 保持纵横比缩放图片，使图片的长边能完全显示出来
        aspectFill: "cover", // 保持纵横比缩放图片，只保证图片的短边能完全显示出来
        widthFix: "scale-down", // 宽度不变，高度自动变化，保持原图宽高比不变

        // 裁剪模式映射（统一映射到cover模式，因为裁剪模式在el-image中没有直接对应）
        top: "cover", // 不缩放图片，只显示图片的顶部区域
        bottom: "cover", // 不缩放图片，只显示图片的底部区域
        center: "cover", // 不缩放图片，只显示图片的中间区域
        left: "cover", // 不缩放图片，只显示图片的左边区域
        right: "cover", // 不缩放图片，只显示图片的右边区域
        "top left": "cover", // 不缩放图片，只显示图片的左上边区域
        "top right": "cover", // 不缩放图片，只显示图片的右上边区域
        "bottom left": "cover", // 不缩放图片，只显示图片的左下边区域
        "bottom right": "cover", // 不缩放图片，只显示图片的右下边区域
      };

      // 如果scale_mode存在且在映射表中，返回对应的el-image模式
      if (scale_mode && modeMap[scale_mode]) {
        return modeMap[scale_mode];
      }

      // 默认返回cover模式
      return "cover";
    },
    setComColMap() {
      let map = this.comColMap || {};
      if (Object.keys(map).length === 0) {
        const itemData = this.cellItemData || {};
        map = Object.keys(itemData).reduce((acc, key) => {
          acc[key] = key;
          return acc;
        }, {});
      }
      if (Object.keys(map).length === 0) {
        map = null;
      }
      return map;
    },
    jumpJson() {
      return JSON.stringify(this.cellLayoutJson?.jump_json || null);
    },
    itemDataStr() {
      return JSON.stringify(this.cellItemData || null);
    },
    useChildAnimation() {
      return (
        ["row", "block"].includes(this.partsType) &&
        this.cellLayoutJson?.child_use_animation === "是"
      );
    },
    childAnimationType() {
      return this.cellLayoutJson?.child_animation_type;
    },
    childAnimationConfig() {
      let obj = {};
      if (this.useChildAnimation) {
        obj = {
          type: this.cellLayoutJson?.child_animation_type || "跑马灯",
          step: this.cellLayoutJson?.child_animation_step || "100",
          direction:
            this.cellLayoutJson?.child_animation_direction || "由左往右",
          interval: (this.cellLayoutJson?.child_animation_interval || 1) * 1000, // 转换为毫秒
          delay: (this.cellLayoutJson?.child_animation_delay || 0) * 1000, // 转换为毫秒
        };
      }
      return obj;
    },
    animationClass() {
      return setAnimationClass({
        type: this.cellItem.animation_type,
        direction: this.cellItem.animation_direction,
      });
    },
    animationStyle() {
      return setAnimationStyle({
        duration: this.cellItem.animation_duration,
        delay: this.cellItem.animation_delay,
        repeat: this.cellItem.animation_repeat,
      });
    },
    // 是否开启数字滚动动画
    enableNumberRollAnimation() {
      return (
        this.cellItem?.use_animation === "是" &&
        this.cellItem.animation_type === "数字滚动"
      );
    },
    // 数字动画格式化配置
    numberFormatOptions() {
      return {
        thousands:
          this.cellLayoutJson?.num_option?.includes("千分位分隔符") || false,
        prefix: this.cellLayoutJson?.num_prefix || "", // 前缀
        suffix: this.cellLayoutJson?.num_suffix || "", // 单位
        precision:
          this.cellLayoutJson?.number_precision ??
          this.cellLayoutJson?.num_decimal ??
          1,
        autoUnit:
          this.cellLayoutJson?.num_option?.includes("自动换算单位") || false, // 自动换算单位 万、亿
        showTitle: true, // 显示原始值在 title 属性中
      };
    },
    // 数字动画配置
    numberAnimationOptions() {
      return {
        delay: (this.cellLayoutJson?.animation_delay || 0) * 1000,
        easing: this.cellLayoutJson?.animation_easing || "easeOutStrong",
        onStart: () => console.log("动画开始"),
        onComplete: () => console.log("动画完成"),
      };
    },
    // 数字动画完整配置
    numberAnimationConfig() {
      const number = Number(this.setPartModelData);
      // 判断目标值是否为整数
      const isTargetInteger = Number.isInteger(number);
      return {
        from: 0,
        to: isNaN(number) ? 0 : number,
        duration: (this.cellLayoutJson?.animation_duration || 10) * 1000,
        formatOptions: this.numberFormatOptions,
        animationOptions: {
          ...this.numberAnimationOptions,
          isInteger: isTargetInteger, // 传递整数标识
        },
      };
    },
    getIconName() {
      if (this.iconPartTypes.includes(this.cellItem?.parts_type)) {
        let icon = this.setPartModelData || "";
        if (icon) {
          if (icon?.startsWith("i-")) {
            return icon.replace("i-", "");
          } else if (icon?.startsWith("ri")) {
            return icon.replace("ri-", "ri:");
          } else if (icon?.startsWith("el-icon-")) {
            return icon.replace("el-icon-", "ep:");
          } else {
            return icon;
          }
        }
      }
    },
    item() {
      return this.cellItem;
    },
    isLink() {
      if (this.cellItem.sys_fun) {
        if (
          ["拨打电话", "地图导航", "登录", "退出登录"].includes(
            this.cellItem.sys_fun
          )
        ) {
          return true;
        }
      }
      if (this.cellItem.jump_json) {
        return true;
      }
      return false;
    },
    partsType() {
      return this.cellItem.parts_type;
    },
    videoAttribute() {
      let obj = {
        autoplay: false,
        controls: false,
        muted: false,
        loop: false,
        controlslist: "",
      };
      // set('自动播放','控制面板','不允许下载','不允许全屏','自动循环播放','默认静音')
      if (this.cellItem.video_attribute?.includes("自动播放")) {
        obj.autoplay = true;
      }
      if (this.cellItem.video_attribute?.includes("控制面板")) {
        obj.controls = true;
      }
      if (this.cellItem.video_attribute?.includes("不允许下载")) {
        obj.controlslist = "nodownload";
      }
      if (this.cellItem.video_attribute?.includes("不允许全屏")) {
        obj.controlslist += obj.controlslist ? ",nofullscreen" : "nofullscreen";
      }
      if (obj.controlslist) {
        obj.controls = true;
      }
      if (this.cellItem.video_attribute?.includes("自动循环播放")) {
        obj.loop = true;
      }
      if (this.cellItem.video_attribute?.includes("默认静音")) {
        obj.muted = true;
      }
      return obj;
    },
    videoPoster() {
      let poster = this.cellItem.video_default_poster;
      if (this.cellItem.video_poster_field) {
        poster = this.cellItemData[this.cellItem.video_poster_field] || poster;
      }
      return this.getImagePath(poster);
    },
    resetRichTextHtml() {
      if (this.setPartModelData && typeof this.setPartModelData === "string") {
        // 将所有nowrap改为wrap，防止一行展示不全不自动换行
        return this.setPartModelData.replace(/nowrap/gi, "wrap");
      } else {
        return "";
      }
    },
    buildColStyleJson() {
      const styleJson = this.cellItem?.style_json || {};
      let style = {};
      if (styleJson) {
        style = formatStyleData(styleJson);
      }
      if (
        this.accordionSeq === this.activeAccordionSeq &&
        this.accordion === true &&
        this.cellItem?.active_style_json
      ) {
        style = {
          ...style,
          ...formatStyleData(this.cellItem.active_style_json),
        };
      }
      return style;
    },
    setLiquidConfig() {
      let obj = {};
      if (this.partsType === "水球图") {
        let style = {
          color: null,
        };
        if (this.cellItem?.style_json?.color) {
          style.color = this.cellItem?.style_json?.color;
        }
        if (this.cellItem?.wave_color) {
          obj.waveColor = this.cellItem?.wave_color;
        }
        if (this.cellItem?.wave_outline_color) {
          obj.waveOutlineColor = this.cellItem?.wave_outline_color;
        }
        if (this.cellItem?.wave_bg_color) {
          obj.waveBgColor = this.cellItem?.wave_bg_color;
        }
        if (this.cellItem?.wave_font_size) {
          obj.waveFontSize = this.cellItem?.wave_font_size;
        }
      }
      return obj;
    },
    progressRingConfig() {
      const config = {
        size: this.cellItem?.style_json?.width || "",
        strokeWidth: this.cellItem?.prog_stroke_width || 10,
        progressColor: this.cellItem?.progress_color || "#409eff",
        bgColor: this.cellItem?.progress_bg_color || "#e4e7ed",
        textColor:
          this.cellItem?.progress_text_color ||
          this.cellItem?.style_json?.color ||
          "#303133",
        fontSize: this.cellItem?.progress_font_size || "24px",
        showText: this.cellItem?.progress_show_text !== false,
        showUnit: this.cellItem?.progress_show_unit !== false,
        unit: this.cellItem?.progress_unit || "%",
        maxValue: this.cellItem?.progress_max_value || 100,
        label: this.cellItem?.progress_label || "",
        labelColor: this.cellItem?.progress_label_color || "#909399",
        labelFontSize: this.cellItem?.progress_label_font_size || "0.5em",
      };
      return config;
    },
    progressBarConfig() {
      const config = {
        showText: this.cellItem?.progress_show_text !== false,
        showUnit: this.cellItem?.progress_show_unit !== false,
        unit: this.cellItem?.progress_unit || "%",
        bgColor: this.cellItem?.progress_bg_color || "#e4e7ed",
        fillColor: this.cellItem?.progress_color || "#409eff",
        height: this.cellItem?.progress_bar_height || 12,
      };
      return config;
    },
    progressBarStyle() {
      const value = parseFloat(this.setPartModelData) || 0;
      const percentage = Math.min(100, Math.max(0, value));
      return {
        width: `${percentage}%`,
      };
    },
    progressDisplayValue() {
      const value = parseFloat(this.setPartModelData) || 0;
      return Math.round(value);
    },
    setPartModelData() {
      return this.getPartModelData();
    },
    buildChartPageItem() {
      if (!this.chartPartTypes.includes(this.partsType)) {
        return null;
      }
      const chartJson = this.cellItem?.chart_json || {
        chart_type: this.partsType,
        series_name_cfg: "类别",
        series_value_cols: "value",
      };
      return {
        ...this.cellItem,
        chart_json: chartJson,
        style_json: this.cellItem?.style_json || {},
        srv_req_json: this.cellItem?.srv_req_json || null,
      };
    },
    partsShow() {
      const item = this.cellItem;
      const itemData = this.cellItemData || {};
      const map = this.setComColMap || {};
      let show = true;
      if (
        item.disp_flag === "显示" &&
        item?.disp_variable?.includes("手风琴")
      ) {
        return this.accordionSeq === this.activeAccordionSeq;
      }
      // 根据显示条件判断是否显示 islogin代表是否登录
      if (item.disp_flag && item?.disp_variable?.toLowerCase() === "islogin") {
        if (item.disp_flag === "显示") {
          return item.disp_compare_value === "是"
            ? !!this.logined
            : !this.logined;
        } else if (item.disp_flag === "隐藏") {
          return item.disp_compare_value === "是"
            ? !this.logined
            : !!this.logined;
        }
      } else if (item && itemData) {
        if (
          item.disp_flag == "显示" &&
          item.disp_variable &&
          map.hasOwnProperty(item.disp_variable)
        ) {
          show = false;
          let val =
            itemData[map[item.disp_variable]] ||
            this.queryOptions[map[item.disp_variable]] ||
            null;
          let dispValue = item.disp_compare_value || null; // 显示值
          if (dispValue === "notnull") {
            show = !!val;
          } else if (dispValue && val) {
            dispValue = dispValue.split(",");
            // console.log('dispValue1',dispValue,val,itemData.target_name)
            if (dispValue.indexOf(val) !== -1) {
              show = true;
            }
          }
        } else if (
          item.disp_flag == "隐藏" &&
          item.disp_variable &&
          map.hasOwnProperty(item.disp_variable)
        ) {
          show = true;
          let val =
            itemData[map[item.disp_variable]] ||
            this.queryOptions[map[item.disp_variable]] ||
            null;
          let dispValue = item.disp_compare_value || null; // 隐藏值
          if (["null", "false"].includes(disp_compare_value)) {
            show = !!val;
          } else if (dispValue && val) {
            dispValue = dispValue.split(",");
            if (dispValue.indexOf(val) !== -1) {
              show = false;
            }
          }
        }
      }
      // console.log('dispValue2',itemData.rent_type,itemData.rent_status,show)
      if (!show) {
        console.log(
          "dispValue2",
          itemData.rent_type,
          itemData.rent_status,
          show
        );
      }
      return show;
    },
    getFileName() {
      let fileName = this.setPartModelData || "附件1";
      if (Array.isArray(this.fileList) && this.fileList.length) {
        fileName = this.fileList[0].src_name || fileName;
      }
      return fileName;
    },
    // 文件列表是否启用下载（sys_fun 中包含 “下载” 时启用）
    canDownloadAttachment() {
      const sysFun = this.cellItem?.sys_fun;
      if (!sysFun) return false;
      if (Array.isArray(sysFun)) {
        return sysFun.includes("下载");
      }
      return String(sysFun).includes("下载");
    },
  },
  methods: {
    handleFormPartChange(e) {
      console.log("handleFormPartChange", e);
      this.$emit("update:value", e);
      // 使用 vuex通知页面更新变量值
      if (this.$store && this.variableKey) {
        this.$store.commit("pageEvent/SET_COMP_VARIABLE_WITH_PAGE_SYNC", {
          com_no: this.pageItem.com_no,
          componentId: this.pageItem.com_no,
          key: this.variableKey,
          value: e,
        });
      }
    },
    handleChartClick(params) {
      console.log("handleChartClick", params);
      this.$emit("on-click-part", params, this.cellItem);
    },
    startNativeCountdown() {
      const ms = this.computeCountdownMs(this.setPartModelData);
      this.countdownTimeMs = ms;
      this.updateCountdownDisplay(ms);
      if (this._countdownTimer) {
        clearInterval(this._countdownTimer);
        this._countdownTimer = null;
      }
      if (ms <= 0) return;
      this._countdownTimer = setInterval(() => {
        this.countdownTimeMs = Math.max(0, this.countdownTimeMs - 1000);
        this.updateCountdownDisplay(this.countdownTimeMs);
        if (this.countdownTimeMs <= 0) {
          clearInterval(this._countdownTimer);
          this._countdownTimer = null;
        }
      }, 1000);
    },
    updateCountdownDisplay(ms) {
      const total = Math.max(0, Number(ms) || 0);
      const day = Math.floor(total / (24 * 60 * 60 * 1000));
      const hour = Math.floor(
        (total % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)
      );
      const minute = Math.floor((total % (60 * 60 * 1000)) / (60 * 1000));
      const second = Math.floor((total % (60 * 1000)) / 1000);
      const pad = (n) => String(n).padStart(2, "0");
      this.countdownDisplay = `${pad(day)}日${pad(hour)}时${pad(minute)}分${pad(
        second
      )}秒`;
    },
    computeCountdownMs(rawVal) {
      if (!rawVal) return 0;
      const raw = String(rawVal).trim();
      let end = dayjs(raw);
      if (!end.isValid()) {
        const m = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (m) {
          const year = Number(m[1]);
          const month = Number(m[2]) - 1;
          const day = Number(m[3]);
          end = dayjs(new Date(year, month, day, 0, 0, 0));
        } else {
          return 0;
        }
      } else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(raw)) {
        end = end.startOf("day");
      }
      const now = dayjs();
      const diff = end.valueOf() - now.valueOf();
      return diff > 0 ? diff : 0;
    },
    getValByExprFromRow(row, expr) {
      const rowRegex = /row\[(.*?)=(.*?)\]\.(.*)/;
      const match = expr.match(rowRegex);
      if (match) {
        // 提取row[]中的=两边的值以及].后面的字段col2
        const col1 = match[1];
        const val1 = match[2];
        const col2 = match[3];
        // 根据提取的值从itemData中获取相应数据
        // 首先检查itemData中是否存在col1字段且其值等于val1
        if (Array.isArray(row) && row.length) {
          return row.find((item) => item[col1] === val1)?.[col2];
        }
      }
    },
    getPartModelData(getTrueValue = false) {
      const item = this.cellItem;
      const itemData = this.cellItemData || {};
      let map = this.setComColMap || {};
      let type = item.parts_type;
      let key = item.variable || null;
      let val = item.parts_text;

      // 处理row[company_owner=张宁].store_contact格式的key
      if (key?.includes("row[")) {
        if (this.getValByExprFromRow(this.cellData, key)) {
          val = this.getValByExprFromRow(this.cellData, key);
        }
      }

      switch (type) {
        case "iconImg":
        case "图片":
          val = item.parts_img;
          break;
        case "icon":
        case "字体图标":
          val = item.parts_icon || val;
          break;
        default:
          break;
      }
      if (key && key.startsWith("user.")) {
        key = key.replace("user.", "");
        if (this.loginUser && this.loginUser[key]) {
          val = this.loginUser[key] || val || "";
        }
      } else if (item && itemData && !!map) {
        let data = itemData;
        let optionsType = "";
        if (item.hasOwnProperty("sys_fun") && item?.sys_fun) {
          optionsType = item?.sys_fun;
        }
        switch (optionsType) {
          case "下载":
          case "预览":
            if (getTrueValue === true) {
              key = item.variable;
              if (
                key &&
                map.hasOwnProperty(key) &&
                itemData.hasOwnProperty(map[key]) &&
                itemData[map[key]]
              ) {
                val = itemData[map[key]];
              } else if (itemData[key]) {
                val = itemData[key];
              } else {
                val = undefined;
              }
            } else {
              val = item.parts_text;
            }
            break;
          case "拨打电话":
            key = item?.para_phone_col || item.variable;
            if (
              key &&
              map.hasOwnProperty(key) &&
              itemData.hasOwnProperty(map[key]) &&
              itemData[map[key]]
            ) {
              val = itemData[map[key]];
            }
            break;
          case "地图导航":
            let lgtKey = item?.para_map_lon;
            let latKey = item?.para_map_lat;
            // key = item?.para_phone_col || item.variable
            val = null;
            val = {};
            if (
              lgtKey &&
              map.hasOwnProperty(lgtKey) &&
              itemData.hasOwnProperty(map[lgtKey]) &&
              itemData[map[lgtKey]]
            ) {
              val["lgt"] = itemData[map[lgtKey]];
            } else {
              val = null;
            }
            if (
              latKey &&
              map.hasOwnProperty(latKey) &&
              itemData.hasOwnProperty(map[latKey]) &&
              itemData[map[latKey]]
            ) {
              val["lat"] = itemData[map[latKey]];
            } else {
              val = null;
            }
            break;
          default:
            if (
              item?.variable &&
              key &&
              this.comColMap?.[key] &&
              this.queryOptions?.[this.comColMap[key]]
            ) {
              val = this.queryOptions[this.comColMap[key]] || "";
            } else if (
              item?.variable &&
              key &&
              map?.[key] &&
              itemData.hasOwnProperty(map[key]) &&
              itemData[map[key]]
            ) {
              val = itemData[map[key]] || "";
            } else if (
              item?.variable &&
              key &&
              itemData?.[key] &&
              itemData[key]
            ) {
              val = itemData[key] || "";
            } else if (
              item?.variable &&
              key &&
              this.queryOptions?.[key] &&
              this.queryOptions[key]
            ) {
              val = this.queryOptions[key] || "";
            } else if (
              ["string", "时间日期"].includes(item.parts_type) &&
              item.parts_text
            ) {
              val =
                this.renderStr(item.parts_text, {
                  data: itemData,
                  user: this.loginUser || {},
                  top: {
                    user: this.loginUser || {},
                  },
                  ...(this.queryOptions || {}),
                }) || "";
            }
            break;
        }
      } else if (item && itemData && !map) {
        if (item.hasOwnProperty("variable") && key && itemData?.[key]) {
          val = itemData[key] || "";
        } else if (
          item.hasOwnProperty("variable") &&
          key &&
          this.queryOptions?.[key]
        ) {
          val = this.queryOptions[key] || "";
        } else if (
          ["string", "时间日期"].includes(item.parts_type) &&
          item.parts_text
        ) {
          val =
            this.renderStr(item.parts_text, {
              data: itemData,
              user: this.loginUser || {},
              top: {
                user: this.loginUser || {},
              },
              ...this.queryOptions,
            }) || "";
        }
      }
      if (type === "时间日期" && item.date_format_rule) {
        // 校验 val 是否为有效日期，不是的话置为空
        if (val && dayjs(val).isValid()) {
          val = dayjs(val).format(item.date_format_rule);
        } else {
          val = dayjs().format(item.date_format_rule);
        }
      }
      if (val && type === "iconImg" && item?.img_amount_limit === "多张") {
        // 展示多张图片
        if (this.fileNoMap[val] === undefined) {
          this.$set(this.fileNoMap, val, null);
          this.getFiles(val, item?.img_dpi);
        }
      }
      if (type === "水球图") {
        if (isNaN(parseFloat(val))) {
          val = 0;
        }
        return parseFloat(val);
      }
      if (
        val &&
        typeof val === "string" &&
        this.cellItem?.more_options?.includes("中间4位脱敏")
      ) {
        const digits = val.match(/\d/g);
        if (digits && digits.length >= 4) {
          const totalDigits = digits.length;

          if (totalDigits === 11) {
            // 11位数字：使用特定正则表达式脱敏
            val = val.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
          } else if (totalDigits > 6) {
            // 大于6位且非11位数字：按1/3-1/3-1/3比例脱敏
            let digitIndex = 0;
            val = val.replace(/\d/g, (match) => {
              const position = digitIndex++;
              let result = match;

              const prefixDigits = Math.ceil(totalDigits / 3);
              const suffixDigits = Math.ceil(totalDigits / 3);

              if (
                position >= prefixDigits &&
                position < totalDigits - suffixDigits
              ) {
                result = "*";
              }

              return result;
            });
          } else {
            // 4-6位数字：保留首尾，中间脱敏
            let digitIndex = 0;
            val = val.replace(/\d/g, (match) => {
              const position = digitIndex++;
              let result = match;

              if (position > 0 && position < totalDigits - 1) {
                result = "*";
              }

              return result;
            });
          }
        }
      }
      // 解析 _encrypt_param 配置进行脱敏处理
      const realKey = (map && map[key]) ? map[key] : key;
      return applyEncryptParam(itemData, [realKey, key, item?.variable, item?.para_phone_col], val);
    },
    getSubJson(cellItem) {
      if (Array.isArray(cellItem?.sub_card_parts_json)) {
        return cellItem.sub_card_parts_json;
      }
      if (Array.isArray(cellItem?.children)) {
        return cellItem.children;
      }
    },
    onMouseenter(event) {
      this.$emit("mouse-enter", event);
    },
    onMouseleave() {
      // this.$emit('update:active-accordion-seq', 0);
    },
    buildStyleJson(styleJson) {
      const cellLayoutJson = this.cellLayoutJson;
      let style = {};
      if (styleJson) {
        for (let key in styleJson) {
          style[key.replace(/_/g, "-")] = styleJson[key];
          // console.log('styleJson',key)
        }
      }
      let bgImg =
        cellLayoutJson && cellLayoutJson.background_image
          ? cellLayoutJson.background_image
          : "";

      // if (bgImg) {
      //   // 单元背景图 补偿样式。
      //   style['background-image'] = `url(${this.getImagePath(bgImg)})`;
      //   style['background-size'] = '100% 100%';
      //   style['background-repeat'] = 'no';
      // }
      // if (cellLayoutJson && !style.hasOwnProperty('min-height') && bgImg) {
      //   style['min-height'] = '40rpx'
      // };
      if (!style["background-color"]) {
        style["background-color"] = "transparent";
      }
      if (!style["overflow"]) style["overflow"] = "hidden";
      return style || {};
    },
    onClickCell(data, layout) {
      this.$emit("on-click-cell", data, layout);
      this.$emit("onClickSubBlock", data, layout);
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
      this.$emit("show-dialog", { rect, data, jumpJson });
    },
    onClickSubBlock: throttle(
      function (itemData, subCol, cellLayoutJson, parentCol, originCol) {
        this.$emit("on-click-row", itemData, cellLayoutJson);
        const self = this;
        itemData = itemData || this.cellItemData;
        subCol = subCol || this.cellItem;
        cellLayoutJson = cellLayoutJson || this.cellLayoutJson;
        if (this.readOnly) {
          return;
        }
        // 关闭弹窗：直接向上冒泡关闭事件，不再走后续 sys_fun 逻辑
        if (subCol?.sys_fun === "关闭弹窗") {
          this.$emit("close-popup");
          return;
        }
        if (subCol?.sys_fun === "登录") {
          this.toLogin();
        } else if (subCol?.sys_fun === "退出登录") {
          this.$confirm("确认退出登录吗?", "提示", {
            confirmButtonText: "确认",
            cancelButtonText: "取消",
            type: "warning",
          }).then(() => {
            this.$store.dispatch("loginInfo/logout");
          });
        } else if (
          (!subCol?.sys_fun || subCol?.sys_fun === "无") &&
          !subCol?.jump_json
        ) {
          // 如果沒有配置系統功能 也没配置跳转 将事件传递到父部件
          if (this.parentPart?.parts_type) {
            this.$emit(
              "on-click-part",
              itemData,
              this.parentPart,
              cellLayoutJson,
              null,
              subCol
            );
          } else if (this.parentPart?.jump_json) {
            // 如果父部件配置了跳转 执行跳转
            this.jumpAction(this.parentPart?.jump_json, itemData);
            return;
          } else {
            // 没有父部件配置 点击事件传到卡片单元
            this.onClickCell(itemData, cellLayoutJson);
          }
          return;
        } else if (subCol?.jump_json) {
          // 执行自定义跳转
          if (subCol?.jump_json?.click_type === "弹框") {
            if (subCol?.jump_json?.popup_type === "卡片") {
              const { popup_card_json, popup_placement } = subCol?.jump_json;
              this.showCardPopupDialog(
                event,
                itemData,
                popup_card_json,
                popup_placement
              );
            } else {
              const element = this.$el;
              const rect = element.getBoundingClientRect();
              this.showDialog({
                rect,
                data: itemData,
                jumpJson: subCol.jump_json,
              });
            }
          } else {
            this.jumpAction(subCol?.jump_json, itemData);
          }
          return;
        }
        let type = "";
        let optionsType = "";
        let text = "";
        let item = itemData;
        if (subCol) {
          type = subCol.parts_type;
          text = subCol.card_parts_name;
          if (subCol.hasOwnProperty("sys_fun") && subCol.sys_fun) {
            optionsType = subCol.sys_fun;
          }
        }
        let map = this.setComColMap;
        let val = null;
        switch (optionsType) {
          case "下载":
          case "预览":
            val = this.getPartModelData(true);
            console.log(optionsType, val);
            if (val) {
              this.getFiles(val, "原图")
                .then((list) => {
                  if (Array.isArray(list) && list.length > 0) {
                    if (list.length === 1) {
                      downloadFile(
                        list[0].__url,
                        list[0].file_type,
                        list[0].src_name
                      );
                    } else {
                      this.showFileSelectionModal(list, "download");
                    }
                  } else {
                    this.$message.error(`没有可${optionsType}的文件`);
                  }
                })
                .catch((error) => {
                  console.error("获取文件列表失败:", error);
                  this.$message.error("获取文件失败");
                });
            } else {
              this.$message.error(`未配置${optionsType}链接`);
            }
            break;
            break;
          case "拨打电话":
            // val = this.setPartModelData(subCol, map, item)
            val = itemData[subCol.para_phone_col];
            console.log("拨打电话", val);
            if (val) {
              window.location.href = `tel:${val}`;
              // this.$message.error("功能开发中...");
            } else {
              this.$message.error("未配置电话号码");
            }
            break;
          case "发短信":
            // val = this.setPartModelData(subCol, map, item)
            val = this.setPartModelData;
            console.log("发短信", val);
            if (val) {
              window.location.href = `sms:${val}`;
              // this.$message.error("功能开发中...");
            } else {
              this.$message.error("未配置电话号码");
            }
            break;
          case "地图导航":
            val = this.setPartModelData;
            console.log("地图导航", val);
            if (val && val.hasOwnProperty("lat") && val.hasOwnProperty("lgt")) {
              this.$message.error("功能开发中...");
            }
            break;
          case "表单操作":
            // if (subCol?.form_srv) {
            //   this.openUpdateFormPopup(itemData.id, subCol?.form_srv);
            // }
            break;
          case "退出登录":
            this.$confirm("确认退出登录吗?", "提示", {
              confirmButtonText: "确认",
              cancelButtonText: "取消",
              type: "warning",
            }).then(() => {
              this.$store.dispatch("loginInfo/logout");
            });
            break;
          case "登录":
            this.$store.dispatch("loginInfo/logout");
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
            break;
          default:
            if (optionsType?.includes("刷新组件请求")) {
              console.log("刷新组件请求：", this.cellItem);
              this.$emit("refresh-component");
            }
            console.log("没有点击事件");
            break;
        }
        console.log("onClickSubBlock", text, type, optionsType, item);
      },
      500,
      true
    ),
    // PDF预览方法
    handlePreview(file) {
      let currLocation = window.location.href;
      let hashIndex = currLocation.indexOf("#");
      if (hashIndex > 0) {
        let pdfPreviewUrl =
          currLocation.substring(0, hashIndex) +
          "#/viewpdf?pdfsrc=" +
          encodeURIComponent(file.url);
        this.addTabByUrl(pdfPreviewUrl, "文件预览");
      }
    },
    // 预览文件方法
    previewFile(url, fileType, fileList, index) {
      const file = {
        url: url,
        file_type: fileType,
        src_name: fileList[index]?.src_name,
        fileurl: url,
      };

      // 根据文件类型进行不同的预览处理
      if (
        ["jpg", "jpeg", "png", "gif", "JPG", "JPEG", "PNG", "GIF"].includes(
          fileType
        )
      ) {
        // 图片预览
        // this.onPreView(file, index, fileList);
      } else if (fileType === "pdf") {
        // PDF预览
        this.handlePreview(file);
      } else if (["ppt", "pptx"].includes(fileType)) {
        // PPT预览
        const filePath = `${window.backendIpAddr}/file/forward?targetUrl=${url}`;
        const previewUrl = `${getBaseUrl()}/ppt/index.html?file=${encodeURIComponent(
          filePath
        )}`;
        this.addTabByUrl(previewUrl, "文件预览");
      } else {
        // 其他文件类型直接下载
        this.$message.warning("该文件类型不支持预览，将为您下载文件");
        this.downloadFile(url, fileType, file.src_name);
      }
    },
    // 显示文件选择弹窗（多文件时）
    showFileSelectionModal(fileList, action) {
      const fileNames = fileList
        .map((file, index) => `${index + 1}. ${file.src_name}`)
        .join("\n");
      this.$prompt(
        `请选择要${
          action === "download" ? "下载" : "预览"
        }的文件序号:\n${fileNames}`,
        "文件选择",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          inputPattern: /^[1-9]\d*$/,
          inputErrorMessage: "请输入有效的文件序号",
        }
      )
        .then(({ value }) => {
          const index = parseInt(value) - 1;
          if (index >= 0 && index < fileList.length) {
            const file = fileList[index];
            if (action === "download") {
              downloadFile(file.__url, file.file_type, file.src_name);
            } else {
              this.previewFile(file.__url, file.file_type, fileList, index);
            }
          } else {
            this.$message.error("文件序号超出范围");
          }
        })
        .catch(() => {
          // 用户取消操作
        });
    },
    getFileUrl(url) {
      if (url?.indexOf("http") === 0) {
        return url;
      } else if (url?.indexOf("data:image") === 0) {
        return url;
      } else {
        return `${
          this.serviceApi().downloadFile
        }${url}&bx_auth_ticket=${sessionStorage.getItem("bx_auth_ticket")}`;
      }
    },
    async getFiles(no, size) {
      let res = await getFilePathByNo(no);
      if (res?.length) {
        res = res.map((item) => {
          item.__url = this.getFileUrl(item.fileurl);
          if (size !== "原图") {
            if (
              size &&
              !isNaN(parseInt(size)) &&
              typeof parseInt(size) === "number"
            ) {
              item.__url += `&thumbnailType=fwfh_${size}`;
            } else {
              item.__url += `&thumbnailType=fwfh_150`;
            }
          }

          return item;
        });
        this.$set(this.fileNoMap, no, res);
        return res;
      }
    },
    /**
     * 加载文件列表（parts_type 为 “文件列表” 时使用）
     * 通过 file_no 调用 srvfile_attachment_select 接口获取该附件组下所有文件
     */
    loadAttachmentList() {
      const fileNo = this.getAttachmentFileNo();
      if (!fileNo) {
        this.attachmentList = [];
        return;
      }
      this.getFiles(fileNo, "原图")
        .then((list) => {
          this.attachmentList = Array.isArray(list) ? list : [];
        })
        .catch((err) => {
          console.error("加载文件列表失败:", err);
          this.attachmentList = [];
        });
    },
    /**
     * 解析当前文件列表部件绑定的 file_no
     * 优先级：comColMap 映射 -> 行数据直取 -> queryOptions -> setPartModelData
     */
    getAttachmentFileNo() {
      const item = this.cellItem || {};
      const itemData = this.cellItemData || {};
      const map = this.setComColMap || {};
      let key = (item.variable || "").trim();
      if (key) {
        if (map && map[key] && itemData && itemData[map[key]]) {
          return itemData[map[key]];
        }
        if (itemData && itemData[key]) {
          return itemData[key];
        }
        if (this.queryOptions && this.queryOptions[key]) {
          return this.queryOptions[key];
        }
      }
      const v = this.setPartModelData;
      // 排除 parts_text 占位文案
      if (v && v !== item.parts_text) return v;
      return "";
    },
    /**
     * 点击下载图标按钮：单独触发下载
     */
    onDownloadAttachmentItem(file) {
      if (!file || !file.__url) return;
      if (file._dl_auth === false) {
        this.$message.warning("暂无下载权限");
        return;
      }
      downloadFile(file.__url, file.file_type, file.src_name);
    },
    /**
     * 格式化附件创建时间，紧凑展示
     * 输入示例：2026-06-11 09:00:53 → 06-11 09:00
     */
    formatAttachmentTime(time) {
      if (!time) return "";
      const d = dayjs(time);
      if (d.isValid()) {
        return d.format("MM-DD HH:mm");
      }
      return String(time);
    },
    parseNumberToText() {
      if (this.numberPartTypes.includes(this.cellItem.parts_type)) {
        // 数字类型，解析配置，处理千分位、单位换算等
        const number = Number(this.setPartModelData);
        if (!isNaN(number)) {
          // 使用formatNumber函数处理数字格式化
          const formattedText = formatNumber(number, this.numberFormatOptions);

          // 更新DOM元素显示格式化后的数字
          this.$nextTick(() => {
            let ele = this.$refs?.[this.partsType];
            if (ele?.$el) {
              ele = ele?.$el;
            }
            if (ele) {
              ele.innerHTML = formattedText;
            }
          });
        }
      }
    },
    setNumberAnimation() {
      if (this.enableNumberRollAnimation) {
        // 使用数字滚动特效
        let ele = this.$refs?.[this.partsType];
        if (ele?.$el) {
          ele = ele?.$el;
        }
        if (ele) {
          // 使用计算属性配置简化代码
          const config = this.numberAnimationConfig;
          numberAnimationStop = animateNumberWithFormat({
            ...config,
            element: ele,
          });
        }
      }
    },
    showCardPopupDialog(event, itemData, popup_card_json, popup_placement) {
      // 设置弹窗数据
      const element = this.$el;
      this.popupItemData = itemData;
      this.popupCardJson = popup_card_json;
      this.popupPlacement = popup_placement || "下";
      // 获取点击元素的引用
      this.clickedElement = event.target;
      this.showCardPopup = true;
    },
    closeCardPopup() {
      this.showCardPopup = false;
      this.popupItemData = null;
      this.popupCardJson = null;
      this.popupPlacement = "下";
      this.clickedElement = null;
    },
    initPart() {
      if (this.cellItem.parts_type == "附件") {
        if (this.setPartModelData) {
          this.getFiles(this.setPartModelData, "原图").then((res) => {
            if (Array.isArray(res)) {
              this.fileList = res;
            }
          });
        }
      }
      if (["文件列表", "fileList"].includes(this.cellItem.parts_type)) {
        this.loadAttachmentList();
      }
      if (this.cellItem.parts_type === "倒计时") {
        this.startNativeCountdown();
      }
      if (this.enableNumberRollAnimation) {
        // 使用数字滚动特效
        this.$nextTick(() => {
          this.setNumberAnimation();
        });
      } else if (this.numberPartTypes.includes(this.cellItem.parts_type)) {
        // 数字类型，解析配置，处理千分位、单位换算等
        this.parseNumberToText();
      } else if (
        this.useChildAnimation &&
        this.childAnimationType === "跑马灯"
      ) {
        // 启动跑马灯动画
        const config = this.childAnimationConfig;
        setTimeout(() => {
          this.startMarqueeAnimation(config, "bxCellInnerContainer");
        }, 200);
      }
    },
  },
  watch: {
    setPartModelData() {
      this.initPart();
    },
  },
  mounted() {
    this.initPart();
  },
  beforeUnmount() {
    if (this._countdownTimer) {
      clearInterval(this._countdownTimer);
      this._countdownTimer = null;
    }
    numberAnimationStop?.();
    numberAnimationStop = null;
  },
};
</script>

<style lang="scss" scoped>
[class^="bx-cell-"] {
  &.cursor-pointer {
    &:hover {
      color: var(--primary-color, #409eff);
    }
  }
}

.bx-cell-video {
  width: 100%;
  height: 100%;
  background-color: #ccc;
  object-fit: cover;
}

.bx-cell-string {
  text-align: justify;
  overflow: hidden;
  /* 溢出隐藏 */
  overflow: hidden;
  /* 溢出显示省略号 */
  text-overflow: ellipsis;
  word-break: break-all;
  // &:after{
  // 	content:"...";
  // 	position:relative;
  // 	right:0;
  // 	bottom:0;
  // 	width:1em;
  // }
}

.bx-text-cell {
  overflow: hidden;

  .u-wrap {
    background-color: transparent !important;
  }
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  height: 100%;

  .image-item {
    margin-right: 10rpx !important;

    &.demo-layout {
      width: 100%;
      height: 100%;
    }

    &:last-child {
      margin-right: 0 !important;
    }
  }
}

/* 进度条样式 */
.progress-bar-container {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 10px;
}

.progress-bar-wrapper {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar-bg {
  flex: 1;
  height: var(--progress-bar-height, 12px);
  background-color: var(--progress-bg-color, #e4e7ed);
  border-radius: 6px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background-color: var(--progress-color, #409eff);
  border-radius: 6px;
  transition: width 0.3s ease;
}

.progress-bar-text {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

/* 卡片弹窗样式 */
.card-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  // background-color: rgba(0, 0, 0, 0.1);
  pointer-events: auto;
}

::v-deep .bx-cell-rich-text {
  img,
  svg,
  video,
  canvas,
  audio,
  iframe,
  embed,
  object {
    display: inline-block;
  }

  .w-e-text-container blockquote,
  .w-e-text-container li,
  .w-e-text-container p,
  .w-e-text-container td,
  .w-e-text-container th,
  .w-e-toolbar * {
    line-height: 1.5;
  }

  div[data-w-e-type="video"] {
    text-align: center;
  }
}

/* 文件列表样式（parts_type === '文件列表'） */
.bx-cell-file-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;

  .bx-cell-file-item {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    margin-bottom: 6px;
    background-color: #f4f5f6;
    border-radius: 6px;
    overflow: hidden;
    transition: background-color 0.2s ease;

    &:last-child {
      margin-bottom: 0;
    }

    &:hover {
      background-color: #ecf3ff;
    }

    .bx-cell-file-icon {
      font-size: 22px;
      color: #409eff;
      margin-right: 10px;
      flex-shrink: 0;
    }

    .bx-cell-file-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;

      .bx-cell-file-name {
        font-size: 14px;
        color: #303133;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        line-height: 1.4;
      }

      .bx-cell-file-meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        font-size: 12px;
        color: #909399;
        margin-top: 4px;
        line-height: 1.4;

        .bx-cell-file-tag {
          color: #ffffff;
          background-color: #409eff;
          padding: 0 6px;
          border-radius: 3px;
          font-size: 11px;
          line-height: 18px;
          margin-right: 8px;
        }

        .bx-cell-file-size,
        .bx-cell-file-user,
        .bx-cell-file-time {
          margin-right: 10px;

          &:last-child {
            margin-right: 0;
          }
        }

        .bx-cell-file-size {
          color: #606266;
        }
      }
    }

    .bx-cell-file-download-btn {
      margin-left: 12px;
      flex-shrink: 0;
      padding: 6px;

      ::v-deep .iconify {
        font-size: 16px;
      }
    }
  }

  .bx-cell-file-empty {
    font-size: 12px;
    color: #909399;
    text-align: center;
    padding: 8px 0;
  }
}
</style>
