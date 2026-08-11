<template>
  <div
    class="page-item"
    :class="[
      {
        mobile: screenType === 'mobile',
        'inline-block':
          pageItemData &&
          pageItemData.com_type &&
          ['卡片部件'].includes(pageItemData.com_type),
      },
      enterAnimationClass,
    ]"
    v-if="pageItemData && pageItemData.com_type && !shouldHideWhenEmpty && isPageItemVisible"
    :style="[mixCompStyle, enterAnimationVariables]"
  >
    <!-- 遮罩层   卡片部件暂时不使用遮罩 -->
    <div
      class="overlay page-item__overlay"
      @click.stop="onTap"
      :class="{
        active: isActive,
      }"
      v-if="['卡片部件'].includes(pageItemData.com_type) && inEdit"
    >
      <!-- 删除按钮 -->
      <div class="com-name-overlay">
        <span class="name">
          {{ pageItem.com_name || "" }}
        </span>
        <i
          class="el-icon-close button close-icon"
          @click="onDelete"
        ></i>
      </div>
    </div>

    <!-- 弹窗模式（com_option 包含 "展示为弹窗"） -->
    <!-- 自定义弹窗（基于 teleport 实现 append-to-body），避免 el-dialog 的 lazy render 问题 -->
    <teleport v-if="isPopupComponent && pageItemData && isPageItemVisible" to="body">
      <transition name="com-popup-fade">
        <div
          v-show="showComPopup"
          class="com-popup-overlay"
          @click.self="onChildClosePopup"
        >
          <div class="com-popup-dialog" @click.stop>
            <!-- 标题栏 -->
            <div class="com-popup-header">
              <span class="com-popup-title">{{ pageItemData.com_label || pageItemData.component_label || '' }}</span>
              <span
                v-if="!hideComPopupCloseBtn"
                class="i-ep-close com-popup-close-btn"
                @click="onChildClosePopup"
              ></span>
            </div>
            <!-- 内容区 -->
            <div class="com-popup-body">
              <card-cell-part
                v-if="pageItemData.com_type === '卡片部件'"
                :page-item="pageItemData"
                :cell-item="pageItemData.card_parts_json || pageItemData"
                :page-params-model="pageParamsModel"
                :query-options="queryOptions"
                @close-popup="onChildClosePopup"
              ></card-cell-part>
              <card-group
                v-else-if="pageItemData.com_type === 'cardGroup'"
                :ref="pageItemData.com_type"
                :pageItem="pageItemData"
                :page-no="pageNo"
                :page-config="pageConfig"
                :page-params-model="pageParamsModel"
                :query-options="queryOptions"
                @data-loaded="onDataLoaded"
                @close-popup="onChildClosePopup"
              ></card-group>
              <List
                v-else-if="pageItemData.com_type === 'list'"
                :page-params-model="pageParamsModel"
                :query-options="queryOptions"
                @setPageParams="setPageParams"
                @data-loaded="onDataLoaded"
                @close-popup="onChildClosePopup"
                :ref="pageItemData.com_type"
                :pageItem="pageItemData"
              ></List>
              <form-add
                v-else-if="
                  pageItemData.com_type === 'form' &&
                  pageItemData.form_json &&
                  pageItemData.form_json.form_type === '新增'
                "
                :ref="pageItemData.com_type"
                :pageItem="pageItemData"
                :page-params-model="pageParamsModel"
                :query-options="queryOptions"
                @executor-complete="$emit('executor-complete', $event)"
                @data-loaded="$emit('data-loaded', $event)"
              ></form-add>
              <info-details
                v-else-if="pageItemData.com_type === 'detail'"
                :pageItem="pageItemData"
                :page-params-model="pageParamsModel"
                :query-options="queryOptions"
                @data-loaded="onDataLoaded"
              ></info-details>
              <page-item-chart
                v-else-if="pageItemData.com_type === 'chart'"
                :ref="pageItemData.com_type"
                :page-params-model="pageParamsModel"
                :query-options="queryOptions"
                :pageItem="pageItemData"
                :index="(layout && layout.i) || 1"
                :layout="layout"
              ></page-item-chart>
              <div
                v-else-if="pageItemData && pageItemData.com_label"
              >
                {{ pageItemData.com_label }}
              </div>
            </div>
          </div>
        </div>
      </transition>
    </teleport>

    <div
      class="page-item__label"
      v-if="
        !isPopupComponent &&
        inTabs !== true &&
        isMapList !== true &&
        pageItemData.show_label === '是' &&
        pageItemData.com_label
      "
    >
      <div
        class="page-item__label-text"
        :style="[
          mixTitleStyle,
          {
            flexDirection: mixTitleIcon === '下划线' ? 'column' : 'row',
          },
        ]"
      >
        <template v-if="mixTitleIcon && mixTitleIcon !== '无'">
          <span :style="[{ color: 'inherit' }, mixTitleIconStyle, ]">

            <span
              class="icon1"
              v-if="mixTitleIcon === '竖线'"
            ></span>
            <span
              class="icon2"
              v-else-if="mixTitleIcon === '圆形'"
            ></span>
            <span
              class="icon3"
              v-else-if="mixTitleIcon === '方块'"
            ></span>
            <span
              class="i-ri-arrow-drop-right-fill"
              v-else-if="mixTitleIcon === '三角形'"
            ></span>
            <Icon
              :icon="mixTitleIcon"
              v-else-if="mixTitleIcon && mixTitleIcon !== '下划线'"
            ></Icon>
          </span>
        </template>
        <span>
          {{ pageItemData.com_label }}
        </span>
        <span
          v-if="mixTitleIcon === '下划线'"
          class="under-line"
        ></span>
        <!-- 标题说明提示图标 -->
        <span
          v-if="showTitleTip"
          class="title-tip-icon"
          @click.stop="showTitleTipDialog = true"
        >
          <span class="i-ri-question-line" style="font-size: 16px; color: #999;"></span>
        </span>
      </div>

      <div
        class="more-btn"
        v-if="showMoreBtn && pageItemData.more_position !== '数据项后'"
      >
        <span @click="toMore">
          {{ pageItemData.more_label || "更多" }}
          <i class="el-icon-arrow-right"></i>
        </span>
      </div>
      <div
        class="expand-btn"
        v-if="showExpandBtn"
        @click="toggleExpand"
      >
        <span
          :class="isExpanded ? 'i-ri-arrow-up-s-line' : 'i-ri-arrow-down-s-line'"
        ></span>
      </div>
    </div>
    <transition
      v-if="!isPopupComponent"
      name="expand"
      @enter="onExpandEnter"
      @after-enter="onExpandAfterEnter"
      @leave="onExpandLeave"
      @after-leave="onExpandAfterLeave"
    >
      <div
        class="page-item__content"
        v-show="!showExpandBtn || isExpanded"
      >
    <card-cell-part
      v-if="pageItemData.com_type === '卡片部件'"
      :page-item="pageItemData"
      :cell-item="pageItemData.card_parts_json || pageItemData"
      :page-params-model="pageParamsModel"
      :query-options="queryOptions"
      :style="[mixInnerCompStyle]"
    ></card-cell-part>
    <nav-menu
      v-else-if="
        pageItemData.com_type === 'navBar' &&
        pageItemData.com_case_json &&
        pageItemData.com_case_json.disp_flag !== '否'
      "
      :follow-theme-color="followThemeColor"
      :config="pageItemData.com_case_json"
      :page-config="pageConfig"
      :title-style="mixTitleStyle"
      :title-icon="mixTitleIcon"
      :page-params-model="pageParamsModel"
      :query-options="queryOptions"
      :style="[mixInnerCompStyle]"
    >
      <!-- {{ pageItemData.com_case_json.label }} -->
    </nav-menu>
    <iframe
      :src="getExtPageUrl"
      frameborder="0"
      style="width: 100%; height: 100%; border: none"
      v-else-if="pageItemData.com_type === 'extPage' && getExtPageUrl"
      :style="[mixInnerCompStyle]"
    ></iframe>
    <video-card
      :class="{ mobile: screenType === 'mobile' }"
      v-else-if="pageItemData.com_type === 'videoCard'"
      :ref="pageItemData.com_type"
      :pageItem="pageItemData"
      :page-params-model="pageParamsModel"
      :query-options="queryOptions"
      :style="[mixInnerCompStyle]"
    ></video-card>
    <current-info
      :class="{ mobile: screenType === 'mobile' }"
      v-else-if="pageItemData.com_type === 'currentInfo'"
      :ref="pageItemData.com_type"
      :pageItem="pageItemData"
      :page-params-model="pageParamsModel"
      :query-options="queryOptions"
      :style="[mixInnerCompStyle]"
    ></current-info>
    <slide-list
      :class="{ mobile: screenType === 'mobile' }"
      v-else-if="pageItemData.com_type === 'swiper'"
      :ref="pageItemData.com_type"
      :pageItem="pageItemData"
      :page-params-model="pageParamsModel"
      :query-options="queryOptions"
      :style="[mixInnerCompStyle]"
    ></slide-list>
    <user-list
      :class="{ mobile: screenType === 'mobile' }"
      v-else-if="pageItemData.com_type === 'userList'"
      :ref="pageItemData.com_type"
      :pageItem="pageItemData"
      :page-params-model="pageParamsModel"
      :query-options="queryOptions"
      :style="[mixInnerCompStyle]"
    ></user-list>
    <notice-bar
      :class="{ mobile: screenType === 'mobile' }"
      v-else-if="pageItemData.com_type === 'noticeBar'"
      :ref="pageItemData.com_type"
      :pageItem="pageItemData"
      :page-params-model="pageParamsModel"
      :query-options="queryOptions"
      :style="[mixInnerCompStyle]"
    ></notice-bar>
    <map-card
      :class="{ mobile: screenType === 'mobile' }"
      v-else-if="pageItemData.com_type === 'map'"
      :ref="pageItemData.com_type"
      :pageItem="pageItemData"
      :page-params-model="pageParamsModel"
      :query-options="queryOptions"
      :in-edit="inEdit"
      :style="[mixInnerCompStyle]"
    ></map-card>
    <page-item-chart
      :class="{ mobile: screenType === 'mobile' }"
      v-else-if="pageItemData.com_type === 'chart'"
      :ref="pageItemData.com_type"
      :page-params-model="pageParamsModel"
      :query-options="queryOptions"
      :pageItem="pageItemData"
      :index="(layout && layout.i) || 1"
      :layout="layout"
      :style="[mixInnerCompStyle]"
    ></page-item-chart>
    <List
      :class="{ mobile: screenType === 'mobile' }"
      :is-map-list="isMapList"
      v-else-if="pageItemData.com_type === 'list'"
      :page-params-model="pageParamsModel"
      :query-options="queryOptions"
      @setPageParams="setPageParams"
      @data-loaded="onDataLoaded"
      @close-popup="onChildClosePopup"
      :ref="pageItemData.com_type"
      :pageItem="pageItemData"
      :style="[mixInnerCompStyle]"
    ></List>
    <tab-list
      :class="{ mobile: screenType === 'mobile' }"
      v-else-if="pageItemData.com_type === 'tabs'"
      :page-params-model="pageParamsModel"
      :query-options="queryOptions"
      :ref="pageItemData.com_type"
      :pageItem="pageItemData"
      :style="[mixInnerCompStyle]"
    ></tab-list>
    <!-- <mix-list
      v-if="pageItem.com_type === 'list'"
      :ref="pageItem.com_type"
      :pageItem="pageItem"
    ></mix-list> -->
    <page-widget
      :class="{ mobile: screenType === 'mobile' }"
      v-else-if="pageItemData.com_type === '控件'"
      :ref="pageItemData.com_type"
      :page-config="pageConfig"
      :pageItem="pageItemData"
      :page-params-model="pageParamsModel"
      :query-options="queryOptions"
      :page-no="pageNo"
      @resize="$emit('resize')"
      :style="[mixInnerCompStyle]"
    ></page-widget>
    <card-group
      :class="{ mobile: screenType === 'mobile' }"
      v-else-if="pageItemData.com_type === 'cardGroup'"
      :ref="pageItemData.com_type"
      :pageItem="pageItemData"
      :page-no="pageNo"
      :page-config="pageConfig"
      :page-params-model="pageParamsModel"
      :query-options="queryOptions"
      @data-loaded="onDataLoaded"
      @close-popup="onChildClosePopup"
      :style="[mixInnerCompStyle]"
    ></card-group>
    <grid-card
      :class="{ mobile: screenType === 'mobile' }"
      v-else-if="pageItemData.com_type === 'grid'"
      :ref="pageItemData.com_type"
      :pageItem="pageItemData"
      :page-params-model="pageParamsModel"
      :query-options="queryOptions"
      :style="[mixInnerCompStyle]"
    ></grid-card>
    <form-add
      :class="{ mobile: screenType === 'mobile' }"
      v-else-if="
        pageItemData.com_type === 'form' &&
        pageItemData.form_json &&
        pageItemData.form_json.form_type === '新增'
      "
      :ref="pageItemData.com_type"
      :pageItem="pageItemData"
      :page-params-model="pageParamsModel"
      :query-options="queryOptions"
      :style="[mixInnerCompStyle]"
      @executor-complete="$emit('executor-complete', $event)"
      @data-loaded="$emit('data-loaded', $event)"
    ></form-add>
    <info-details
      v-else-if="pageItemData.com_type === 'detail'"
      :pageItem="pageItemData"
      :page-params-model="pageParamsModel"
      :query-options="queryOptions"
      @data-loaded="onDataLoaded"
      :style="[mixInnerCompStyle]"
    >
    </info-details>
    <DhVideo
      v-else-if="pageItemData.com_type === '大华视频监控'"
      :pageItem="pageItemData"
      :page-config="pageConfig"
      :video_card_channels="pageItemData.video_card_channels"
      :division="pageItemData.division"
      :page-params-model="pageParamsModel"
      :query-options="queryOptions"
      :style="[mixInnerCompStyle]"
    ></DhVideo>
    <DescriptionsList
      v-else-if="pageItemData.com_type === '描述列表'"
      :pageItem="pageItemData"
      :page-params-model="pageParamsModel"
      :query-options="queryOptions"
      :style="[mixInnerCompStyle]"
    ></DescriptionsList>
    <!--    <chat-entrance-->
    <!--        v-else-if="pageItemData.com_type === '咨询入口'"-->
    <!--        :pageItem="pageItemData"-->
    <!--        :page-params-model="pageParamsModel"-->
    <!--        :query-options="queryOptions"-->
    <!--        @setOpenChat="setOpenChat"-->
    <!--    >-->
    <!--    </chat-entrance>-->
    <div
      v-else-if="pageItemData && pageItemData.com_label"
      :class="{ mobile: screenType === 'mobile' }"
      :page-params-model="pageParamsModel"
      :query-options="queryOptions"
    >
      {{ pageItemData.com_label }}
    </div>
    <canvasPage
      v-if="
        pageItemData.animation_type &&
        pageItemData.animation_type.includes('迁徙图')
      "
      :info="pageItemData.migration_json"
      :page-params-model="pageParamsModel"
      :query-options="queryOptions"
    />
    <div
      class="more-btn-bottom"
      v-if="showMoreBtn && pageItemData.more_position === '数据项后'"
      @click="toMore"
    >
      <span class="more-btn">
        {{ pageItemData.more_label || "更多" }}
      </span>
    </div>
      </div>
    </transition>

    <!-- 标题说明弹窗 -->
    <el-dialog
      :title="pageItemData.com_label || '说明'"
      :visible.sync="showTitleTipDialog"
      width="600px"
      append-to-body
    >
      <div class="title-tip-dialog-content" v-html="resetTitleTipHtml"></div>
    </el-dialog>
  </div>
</template>

<script>
import { formatStyleData } from "@/pages/lowcode/common/index.js";
import videoCard from "./video-card.vue";
import currentInfo from "./current-info.vue";
import slideList from "./slide-list.vue";
import userList from "./user-list.vue";
import noticeBar from "./notice-bar.vue";
import mapCard from "./map-card/index.vue";
// import basicChart from "./chart-basic.vue";
// import pageItemChart from "./chart/page-item-chart.vue";
import mixList from "./mix-list/list.vue";
import List from "./list/list.vue";
import DescriptionsList from "./descriptions-list/descriptions-list.vue";
import pageWidget from "./widget.vue";
import cardGroup from "./card-group/card-group.vue";
import tabList from "./tabs/tabs.vue";
import gridCard from "./grid-card.vue";
import formAdd from "./form/add.vue";
import NavMenu from "./nav-menu/nav-menu.vue";
import CardCellPart from "./card-group-cell/card-cell-part-without-card-group.vue";
import InfoDetails from "@/pages/lowcode/widgets/info-details.vue";
import DhVideo from "@/pages/lowcode/widgets/dahua-video/video-home.vue";
// 页面组件级 参数交互处理
import pageItemParams from "@/pages/lowcode/common/params/page-item-params-mixin.js";
// 页面组件级 显示隐藏控制
import pageItemVisible from "@/pages/lowcode/common/params/page-item-visible-mixin.js";
import CanvasPage from "@/components/common/canvas-line/canvasPage.vue";
import Teleport from "vue2-teleport";
import DynamicIcon from "@/pages/lowcode/widgets/common/DynamicIcon.vue";
import {
  setEnterAnimationClass,
  setEnterAnimationVariables,
} from "@/common/common.js";

export default {
  mixins: [pageItemParams, pageItemVisible],
  components: {
    CanvasPage,
    videoCard,
    currentInfo,
    slideList,
    userList,
    noticeBar,
    mapCard,
    basicChart: () => import(/* webpackChunkName: "echarts-vendor" */ "./chart-basic.vue"),
    pageItemChart: () => import(/* webpackChunkName: "echarts-vendor" */ "./chart/page-item-chart.vue"),
    mixList,
    List,
    pageWidget,
    cardGroup,
    tabList,
    gridCard,
    formAdd,
    NavMenu,
    Teleport,
    Icon: DynamicIcon,
    CardCellPart,
    InfoDetails,
    DhVideo,//大华视频监控
    DescriptionsList, //描述列表
  },
  props: {
    pageItem: {
      type: Object,
    },
    layout: {
      type: Object,
    },
    screenType: String,
    pageConfig: Object,
    inTabs: Boolean, // 是否在tabs中
    inEdit: Boolean,
    currentId: [String, Number],
  },
  computed: {

    isMapList() {
      return (
        this.pageItemData.com_type === "list" &&
        this.pageItemData.list_json?.list_options?.includes("关联地图筛选")
      );
    },

    // 是否为弹窗模式：com_option 包含 "展示为弹窗" 且非编辑态
    isPopupComponent() {
      return !this.inEdit && this.pageItem?.com_option?.includes("展示为弹窗");
    },

    // 是否隐藏自定义弹窗关闭按钮
    hideComPopupCloseBtn() {
      return this.pageItem?.com_option?.includes("隐藏弹窗关闭按钮");
    },

    // 没数据时隐藏：com_option 含 "没数据时隐藏" 且已返回结果且条数为 0
    shouldHideWhenEmpty() {
      return (
        this.pageItem?.com_option?.includes("没数据时隐藏") &&
        this.dataLoadedCount !== null &&
        this.dataLoadedCount === 0
      );
    },

    // 弹窗模式 + 没数据时隐藏：需要先等数据回来再决定是否打开弹窗
    shouldDelayPopup() {
      return (
        this.isPopupComponent &&
        this.pageItem?.com_option?.includes("没数据时隐藏")
      );
    },

    isActive() {
      return (
        this.inEdit && this.currentId && this.currentId === this.pageItem.id
      );
    },

    followThemeColor() {
      return this.pageItemData.com_option?.includes("配色不跟随主题") !== true;
    },

    showMoreBtn() {
      if (this.showExpandBtn) {
        return false;
      }
      return (
        this.pageItem?.com_option?.includes("更多") &&
        this.pageItem?.more_jump_json
      );
    },

    showExpandBtn() {
      return (
        this.pageItem?.com_option?.includes("展开收起") &&
        this.pageItemData?.more_position !== "数据项后"
      );
    },

    showTitleTip() {
      return this.pageItemData?.com_option?.includes("显示标题说明") && this.pageItemData?.com_title_tip;
    },

    resetTitleTipHtml() {
      if (this.pageItemData?.com_title_tip && typeof this.pageItemData.com_title_tip === 'string') {
        let str = this.pageItemData.com_title_tip.replace(/nowrap/ig, 'wrap');
        if (str && str.indexOf('<img loading="lazy"') > -1) {
          let imgIndex = 0;
          str = str.replace(/<img loading="lazy"([^>]*)>/gi, (match, attributes) => {
            const srcMatch = attributes.match(/src=["']([^"']*)["']/i);
            const imgSrc = srcMatch ? srcMatch[1] : '';
            return match.replace('<img loading="lazy"', `<img style="display:block;width:100%;" data-preview-img="${imgSrc}" data-img-index="${imgIndex++}"`);
          });
        }
        if (str && str.indexOf('<video') > -1) {
          let imgIndex = 0;
          str = str.replace(/<video([^>]*)>/gi, (match, attributes) => {
            const srcMatch = attributes.match(/src=["']([^"']*)["']/i);
            const imgSrc = srcMatch ? srcMatch[1] : '';
            return match.replace('<video', `<video style="display:block;width:100%;" data-preview-img="${imgSrc}" data-img-index="${imgIndex++}"`);
          });
        }
        return this.recoverFileAddress4richText(str);
      }
      return '';
    },

    getExtPageUrl() {
      let url = '';
      if (this.pageItemData?.ext_page_json?.ext_page_url) {
        url = this.pageItemData?.ext_page_json?.ext_page_url;
      } else if (this.pageItemData?.com_case_json?.ext_page_url) {
        url = this.pageItemData?.com_case_json?.ext_page_url;
      } else if (this.pageItemData?.ext_page_url) {
        url = this.pageItemData?.ext_page_url;
      }
      if(typeof this.queryOptions === 'object'){
        if(url.includes('?')){
          url += '&' + new URLSearchParams(this.queryOptions).toString();
        } else {
          url += '?' + new URLSearchParams(this.queryOptions).toString();
        }
      }
      return url;
    },

    mixTitleIcon() {
      return this.pageItemData?.com_icon || this.pageConfig?.dv_com_icon;
    },
    titleIconStyle() {
      return formatStyleData(this.pageItemData?.title_icon_style_json|| "");
    },
    mixTitleIconStyle() {
      return formatStyleData(this.pageItemData?.title_icon_style_json || this.pageConfig?.t_icon_style_json || "");
    },
    mixTitleStyle() {
      let style = {};
      if(this.pageItemData?.show_label === '否'){
        return style;
      } else if (this.pageItemData?.com_title_style_json) {
        style = this.pageItemData?.com_title_style_json;
      }else if (this.pageConfig?.dv_com_title_style_json_data && !this.pageItemData?.com_option?.includes("不使用公共标题样式")) {
        style = {...this.pageConfig?.dv_com_title_style_json_data,...style,};
      } 
      return formatStyleData(style);
    },

    mixCompStyle() {
      let style = {};
      if (this.pageItemData?.style_json) {
        style = this.pageItemData?.style_json;
      } else if (this.pageItemData?.com_style_json) {
        style = this.pageItemData?.com_style_json;
      } else if (this.pageConfig?.dv_com_style_json_data && !this.pageItemData?.com_option?.includes("不使用公共组件样式")) {
        style = { ...this.pageConfig?.dv_com_style_json_data,...style,};
      }

      if (this.pageItemData.com_type === "navBar") {
        // if (style.padding) {
        //   delete style.padding;
        // }
        // if (style.border_radius) {
        //   delete style.border_radius;
        // }
      }
      return formatStyleData(style);
    },
    mixInnerCompStyle() {
      let style = {};
      // 组件内样式 不包含标题范围
      if (this.pageConfig?.dv_com_in_style_json) { // 页面上配置的全局组件内样式
        style = formatStyleData(this.pageConfig.dv_com_in_style_json);
      }
      if (this.pageItemData?.com_in_style_json) { // 组件上配置的组件内样式
        style = {...style, ...formatStyleData(this.pageItemData.com_in_style_json)};
      }
      return style;
    },

    mixNavStyle() {
      let style = {};
      if (this.pageItemData?.com_case_json?.nav_style_json) {
        style = formatStyleData(this.pageItemData.com_case_json.nav_style_json);
      }
      return style;
    },

    enterAnimationClass() {
      return setEnterAnimationClass(this.pageItemData);
    },

    enterAnimationVariables() {
      return setEnterAnimationVariables(this.pageItemData);
    },
  },
  data() {
    return {
      pageItemData: {},
      isExpanded: true,
      // 标题说明弹窗
      showTitleTipDialog: false,
      // 组件作为弹窗展示（com_option 包含"展示为弹窗"）时的可见性
      showComPopup: false,
      // 子组件数据加载结果条数（用于"没数据时隐藏"）
      dataLoadedCount: null,
    };
  },
  mounted() {
    // 弹窗模式：始终在挂载后打开弹窗，确保 el-dialog 的 body 渲染（el-dialog 内部
    // 有 v-if="rendered" 机制，visible 首次为 true 时才渲染 slot 内容，子组件才能
    // mounted 并发起数据请求）。如果配置了"没数据时隐藏"，onDataLoaded 回调中会
    // 根据 count 决定是否关闭弹窗。
    if (this.isPopupComponent) {
      this.$nextTick(() => {
        this.showComPopup = true;
      });
    }
  },
  watch: {
    pageItem: {
      immediate: true,
      deep: true,
      handler(newValue) {
        // 直接同步 pageItemData：依赖 pageItemData.com_type / pageItemData.card_group_json 的
        // 弹窗内 v-if 链需要它在第一次 render 之前就有值
        this.pageItemData = newValue || {};
      },
    },
  },
  methods: {
    handleWindowChannelsChange(channels) {
       console.log('窗口通道信息变化:', data.windowChannels);
  // 在这里保存或处理窗口通道映射信息
  // 例如：保存到 localStorage 或发送到服务器

    },
    onDelete() {
      this.$emit("delete", this.pageItem);
    },
    onTap() {
      console.log(this.$parent.props, "OnTap");

      this.$emit("click", this.$parent.props);
    },
    toMore() {
      const { more_jump_json: jumpJson } = this.pageItem || {};
      if (jumpJson?.obj_type === "内部页面") {
        let pageNo = jumpJson?.dest_page_no;
        if (jumpJson?.click_jump_option?.includes("先登录")) {
          if (this.$store.state?.loginInfo?.logined !== true) {
            // 您还未登录,需要登录才能进入,点击确认前往登录
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
              const loginUrl = window.location.origin + "/main/login.html";
              window.location.href = loginUrl;
            });
            return;
          }
        }
        if (jumpJson?.tmpl_page_json?.file_path) {
          let url = `${jumpJson?.tmpl_page_json?.file_path}?page_no=${pageNo}`;
          this.$router.push({
            name: "website",
            params: {
              pageNo: pageNo,
            },
          });
        }
      }
    },
    toggleExpand() {
      this.isExpanded = !this.isExpanded;
      this.$emit("expand-change", this.isExpanded);
    },
    onExpandEnter(el) {
      el.style.height = '0';
      el.style.overflow = 'hidden';
    },
    onExpandAfterEnter(el) {
      el.style.height = el.scrollHeight + 'px';
      setTimeout(() => {
        el.style.height = '';
        el.style.overflow = '';
      }, 300);
    },
    onExpandLeave(el) {
      el.style.height = el.scrollHeight + 'px';
      el.style.overflow = 'hidden';
      setTimeout(() => {
        el.style.height = '0';
      }, 10);
    },
    onExpandAfterLeave(el) {
      el.style.height = '';
      el.style.overflow = '';
    },
    onResize(i) {
      // console.log(this.$refs);
      // this.$refs[this.pageItem.com_type].onResize?.();
    },

    stylefn(style) {
      if (style) {
        let res = formatStyleData(style);
        if (this.layout?.h && this.layout?.w) {
          res.height = "100%";
          res.width = "100%";
        }
        return res;
      }
    },
    // 子组件数据加载完成回调（用于"没数据时隐藏"功能）
    onDataLoaded({ count }) {
      if (typeof count === 'number') {
        this.dataLoadedCount = count;
        // 弹窗模式 + 没数据时隐藏：弹窗已在 mounted 时打开（让子组件正常渲染并发请求）。
        // 数据回来后若 count === 0，关闭弹窗（shouldHideWhenEmpty 会同步隐藏整组件）
        if (this.shouldDelayPopup && count === 0) {
          this.showComPopup = false;
        }
      }
    },
    // 子组件请求关闭弹窗（卡片部件 sys_fun === '关闭弹窗' 时触发）
    onChildClosePopup() {
      this.showComPopup = false;
    },
  },
};
</script>

<style lang="scss">
@use "../styles/layout.common.scss" as layout;

.overlay {
  @include layout.overlay;
  z-index: 99;
  $primary-color: #17d57e;

  &.page-item__overlay {
    .el-icon-close {
      // transform: translateX(100%);
    }

    // .name,.el-icon-close {
    //   position: absolute;
    //   top: 0;
    //   width: 100%;
    //   min-width: 50px;
    //   transform: translateY(-100%);
    // }
  }

  &:hover {
    border: 2px dashed rgba($color: $primary-color, $alpha: 1);
    background-color: rgba($color: $primary-color, $alpha: 0.1);
  }

  &.active {
    border: 2px solid $primary-color;
  }

  .name {
    background-color: rgba($color: $primary-color, $alpha: 0.7);
  }

  .close-icon {
    height: 28px;
    width: 28px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba($color: $primary-color, $alpha: 0.7);
    cursor: pointer;

    &:hover {
      font-size: 1.2em;
    }
  }
}

.page-item {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-size: 100% 100%;
  color: #333;
  display: flex;
  flex-direction: column;
  @media screen and (max-width: 768px) {
    width: 100%;
    height: unset;
  }
  &.mobile {
    background-color: #eee;
    border: 1px solid #ccc;
    box-sizing: border-box;

    .mobile {
      text-align: center;
    }
  }

  &.inline-block {
    width: unset;
    height: unset;
    display: inline-block;
  }

  .more-btn-bottom {
    text-align: center;
    background: rgba($color: #000000, $alpha: 0.05);
    margin-top: 4px;

    &:hover {
      background: rgba($color: #000000, $alpha: 0.1);
      cursor: pointer;

      .more-btn {
        color: var(--primary-color, #409eff);
        text-decoration: underline;
        text-decoration-color: var(--primary-color, #409eff);
      }
    }

    .more-btn {
      padding: 2px 10px;
      border-radius: 4px;
      font-size: 12px;

      // background-color: var(--primary-color, #409eff);
      // color: #fff;
      &:hover {
        color: var(--primary-color, #409eff);
        text-decoration: underline;
        text-decoration-color: var(--primary-color, #409eff);
      }
    }
  }

  .page-item__label {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .more-btn {
    cursor: pointer;

    &:hover {
      color: var(--primary-color, #409eff);
    }
  }

  .expand-btn {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    transition: transform 0.3s ease;

    &:hover {
      color: var(--primary-color, #409eff);
    }
  }

  .page-item__content {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    transition: height 0.3s ease;
  }

  .expand-enter-active,
  .expand-leave-active {
    transition: height 0.3s ease;
    overflow: hidden;
  }

  .expand-enter,
  .expand-leave-to {
    height: 0;
  }

  .title-tip-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: 6px;
    cursor: pointer;

    &:hover {
      color: var(--primary-color, #409eff);
    }
  }

  .title-tip-dialog-content {
    max-height: 60vh;
    overflow-y: auto;
    font-size: 14px;
    line-height: 1.6;
    color: #666;

    img,
    video {
      max-width: 100%;
    }
  }

  .page-item__label-text {
    display: flex;
    position: relative;
    align-items: center;

    .icon1 {
      display: inline-block;
      width: 4px;
      height: 1em;
      border-radius: 2px;
      background: currentColor;
      margin-right: 6px;
      flex-shrink: 0;
    }

    .icon2 {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
      margin-right: 6px;
      flex-shrink: 0;
    }

    .icon3 {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 2px;
      background: currentColor;
      margin-right: 6px;
      flex-shrink: 0;
    }

    .under-line {
      position: relative;
      display: flex;
      bottom: 0;
      left: 0;
      width: 100%;
      display: inline-block;
      height: 4px;
      border-radius: 2px;
      background: currentColor;
      // padding: inherit;
    }
  }
}
/* ====== 弹窗模式样式（com_option 包含 "展示为弹窗"） ====== */
/* 注意：teleport 到 body，所以样式不能在 .page-item 嵌套内 */
.com-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  overflow: hidden;
}

.com-popup-dialog {
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
  display: inline-block;
}

.com-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
}

.com-popup-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.com-popup-close-btn {
  width: 32px;
  height: 32px;
  padding: 6px;
  border-radius: 50%;
  cursor: pointer;
  color: #909399;
  transition: all 0.2s;

  &:hover {
    color: #409eff;
    background: rgba(64, 158, 255, 0.1);
  }
}

.com-popup-body {
  padding: 0;
}

/* transition 动画 */
.com-popup-fade-enter-active {
  transition: opacity 0.3s ease;

  .com-popup-dialog {
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
}

.com-popup-fade-leave-active {
  transition: opacity 0.3s ease;

  .com-popup-dialog {
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
}

.com-popup-fade-enter,
.com-popup-fade-leave-to {
  opacity: 0;

  .com-popup-dialog {
    transform: scale(0.9);
    opacity: 0;
  }
}
</style>