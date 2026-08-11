<template>
  <div class="data-view-list">
    <!-- 自定义加载动画 -->
    <div
      class="custom-loading"
      v-if="loading"
    >
      <div class="loading-spinner">
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
      </div>
      <div class="loading-text">数据加载中...</div>
    </div>

    <div
      class="map-card-container"
      v-if="listOptions && listOptions.includes('关联地图筛选')"
    >
      <map-card
        class="map-card"
        :tree-req="listConfig && listConfig.map_tree_req_json"
        :pageItem="{
          map_json: listConfig && listConfig.map_json,
        }"
        @select="onSelect"
      ></map-card>
    </div>
    <div class="list-container">
      <div
        class="list-title"
        v-if="
          isMapList &&
          pageItem &&
          pageItem.show_label === '是' &&
          pageItem.com_label
        "
      >
        {{ pageItem.com_label }}
      </div>
      <div
        class="statistic-box"
        v-if="stasticData.length"
      >
        <div
          class="statistic-item"
          v-for="(item, index) in stasticData"
          :key="index"
        >
          <div class="label">{{ item.label }}</div>
          <div class="value">
            {{ item.value || "0" }}
            <span v-if="
              v2Data &&
              v2Data.cfgJson &&
              v2Data.cfgJson.statistics_card_col_unit
            ">{{ v2Data.cfgJson.statistics_card_col_unit }}</span>
          </div>
        </div>
      </div>
      <div
        class="handler-bar"
        v-if="showSearchBar"
      >
        <div></div>
        <div class="flex items-center">
          <el-input
            placeholder="搜索"
            class="search-input mr-2"
            clearable
            v-model="searchKey"
            size="mini"
          ></el-input>
          <el-button
            type="primary"
            class="search-btn"
            @click="onSearch"
            size="mini"
          >搜索</el-button>
          <el-button
            type="primary"
            class="search-btn"
            v-if="addBtn"
            plain
            size="mini"
            @click="showAddDialog = true"
          >{{ addBtn.button_name }}</el-button>
        </div>
      </div>
      <div class="list-view">
        <!-- 多行列宫格 -->
        <grid-list
          class=""
          v-if="'多行列宫格' === listType || '多行列文本' === listType"
          :config="listConfig"
          :list="tableData"
          :page-item="pageItem"
        >
        </grid-list>
        <!-- 卡片列表 -->
        <div
          class="bx-card-list"
          ref="cardListRef"
          :style="[styleWidthPictures]"
          v-else-if="listType == '卡片'"
        >
          <el-carousel
            trigger="click"
            :height="setSwiperHeight"
            :style="[setSwiperStyle]"
            v-if="setListSwiperImg && setListSwiperImg.length"
            class="swiper-container"
            :autoplay="true"
          >
            <el-carousel-item
              v-for="(item, index) in setListSwiperImg"
              :key="index"
            >
              <img loading="lazy"
                :src="getImagePath(item._img_url)"
                alt=""
                style="width: 100%; height: 100%"
              />
              <div
                class="swiper-title"
                v-if="
                  listConfig &&
                  listConfig.swiper_title_col &&
                  item[listConfig.swiper_title_col]
                "
              >
                {{ applyEncryptParam(item, listConfig.swiper_title_col, item[listConfig.swiper_title_col]) }}
              </div>
            </el-carousel-item>
          </el-carousel>
          <div v-if="listOptions?.includes('聚合搜索') && listConfig?.multi_search_cols" :style="getCardGroupStyle">
            <div style="display: flex; align-items: center;justify-content: space-between; padding-bottom: 10px;">
               <el-input
              placeholder="搜索关键字"
              class="search-input mr-2"
              clearable
              style="width: 85%;"
              v-model="searchKey2"
              @change="handleSearchChange"
              @keyup.enter.native="handleSearch"
            ></el-input>
            <el-button icon="el-icon-search" style="width: 15%;" @click="handleSearch"></el-button>
            </div>
          </div>
          <cardGroupCell
            :pageParamsModel="pageParamsModel"
            :queryOptions="queryOptions"
            v-if="pageItem && listType == '卡片'"
            ref="cardGroupCell"
            :pageItem="pageItem"
            :cellsLayout="[cardUnitJson]"
            :active-cell-layout="activeCardJson"
            :cellData="tableData"
            :comColMap="comColMapJson"
            :cardLayout="layoutJson"
            :rowButtons="listV2RowButtons"
            :is-vertical-scroll="isVerticalScroll"
            :display-row-limit="displayRowLimit"
            :list-config="listConfig"
            @on-click-cell="onClickCell"
            @on-click-block="onClickBlock"
            @on-row-button-click="onRowButtonClick"
            @on-click-icon="onClickBlock"
            @setPageParams="setPageParams"
          >
          </cardGroupCell>
        </div>
        <!-- 表格 -->
        <BxTable
          v-else
          :table-column="tableColumn"
          :display-table-data="displayTableData"
          :set-style="setStyle"
          :set-table-style="setTableStyle"
          :striped="striped"
          :show-row-buttons="showRowButtons"
          :set-row-buttons="setRowButtons"
          :row-button-box-style="rowButtonBoxStyle"
          :is-vertical-scroll="isVerticalScroll"
          :display-row-limit="displayRowLimit"
          :list-config="listConfig"
          @row-button-click="onRowButtonClick"
        />
           <div class="empty-data" v-if="loaded && tableData.length === 0">
            暂无数据
           </div>
      </div>
      <div
        class="pagination-box"
        v-if="showPagination"
      >
        <el-pagination
          background
          class="el-pagination"
          @current-change="handleCurrentChange"
          :current-page="pageInfo.pageNo"
          :page-size="pageInfo.rownumber"
          layout="total, prev, pager, next"
          :total="pageInfo.total"
        >
        </el-pagination>
      </div>
   
    </div>

    <el-dialog
      class="customDialogClass"
      title="添加"
      width="90%"
      :close-on-click-modal="1 == 2"
      append-to-body
      :visible="showAddDialog"
      @close="showAddDialog = false"
    >
      <legacy-form
        v-if="showAddDialog"
        mode="simple-add"
        :service="getAddService"
        :srv-app="addBtn.application"
        @executor-complete="onActionComplete"
        @form-loaded="onFormLoaded"
      >
      </legacy-form>
    </el-dialog>
  </div>
</template>

<script>
import { $http } from "@/common/http";
import cardGroupCell from "@/pages/lowcode/widgets/card-group-cell/card-group-cell.vue";
import { formatStyleData, applyEncryptParam } from "@/pages/lowcode/common/index";
import GridList from "./grid-list.vue";
import LegacyForm from "@/components/common/legacy-form.vue";
import MapCard from "../map-card/index.vue";
import BxTable from "./BxTable.vue";
import { getFullBaseUrl } from "@/common/common";
import { getDateByKey, getDateKeys } from "@/common/date_util";
import pageItemComponentMixin from '@/pages/lowcode/engine/pageItemComponentMixin.js'
export default {
  name: "data-view-list",
  components: {
    cardGroupCell,
    GridList,
    LegacyForm,
    MapCard,
    BxTable,
  },
  mixins:[pageItemComponentMixin],
  props: {
    pageItem: {
      type: Object,
    },
    queryOptions: {
      type: Object,
    },
    readOnly: {
      type: Boolean,
      default: false,
    },
    pageParamsModel: {
      type: Object,
    },
    isMapList: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      stasticData: [],
      v2Data: null,
      tableData: [],
      pageInfo: { pageNo: 1, rownumber: 10, total: 0 },
      searchKey: "",
      searchKey2: "",
      mapSearchKey: "",
      showAddDialog: false,
      // 滚动相关数据
      scrollTimer: null,
      loading: false,
      loaded: false,
    };
  },
  computed: {
    showMoreBtn() {
      return (
        this.listOptions?.includes("更多按钮") &&
        this.listConfig?.jump_page_json
      );
    },
    styleWidthPictures() {
      const o = this.listOptions || "";
      if (
        o?.includes("顶部图片") ||
        o?.includes("底部图片") ||
        o?.includes("左侧图片") ||
        o?.includes("右侧图片")
      ) {
        let obj = {
          display: "flex",
        };
        if (o?.includes("顶部图片") || o?.includes("底部图片")) {
          obj["flex-direction"] = "column";
        }
        if (o?.includes("底部图片")) {
          obj["flex-direction"] = "column-reverse";
        }
        if (o?.includes("左侧图片") || o?.includes("右侧图片")) {
          obj["flex-direction"] = "row";
          obj["align-items"] = "flex-start";
        }
        if (o?.includes("右侧图片")) {
          obj["flex-direction"] = "row-reverse";
          obj["align-items"] = "flex-start";
        }
        return obj;
      }
    },
    listConfig() {
      return this.pageItem?.list_json || {};
    },
    listType() {
      return this.listConfig.list_type || "表格";
    },
    listOptions() {
      return this.listConfig.list_options || "";
    },
    showPagination() {
      return this.listConfig?.list_options?.includes("分页");
    },
    showRowButtons() {
      let show = false;
      if (
        (this.listConfig?.list_options?.includes("单元按钮") || this.listConfig?.list_options?.includes("表格按钮")) &&
        this.setRowButtons.length > 0
      ) {
        show = true;
      }
      return show;
    },
    showSearchBar() {
      return (
        this.listConfig?.list_options?.includes("快捷筛选") &&
        this.listConfig?.filter_cols
      );
    },
    setRowButtons() {
      let buttons = this.listV2RowButtons || [];
      const ignoreBtns = ["duplicate", "delete", "edit"];
      return buttons.filter(
        (item) => item.permission && !ignoreBtns.includes(item.button_type)
      );
    },
    tableColumn() {
      if (
        this.listOptions?.includes("自定义表头") &&
        this.listConfig?.custom_table_head_cols &&
        this.listConfig?.custom_table_head_label
      ) {
        const cols = this.listConfig?.custom_table_head_cols.split(",");
        const labels = this.listConfig?.custom_table_head_label.split(",");
        let tbl_head_col_width = this.listConfig?.tbl_head_col_width?.split(',') || "";
        return labels?.map((label, index) => {
          let width = undefined
          const _colWidth = tbl_head_col_width?.[index]
          if (_colWidth) {
            if (!isNaN(Number(_colWidth))) {
              width = _colWidth + '%'
            } else {
              width = _colWidth
            }
          }
          return {
            label,
            columns: cols[index],
            width: width || undefined,
          };
        });
      }
      let cols = this.v2Data?.srv_cols || [];
      cols = cols.filter((item) => item.in_list === 1);
      return cols.slice(0, 6);
    },
    striped() {
      return this.listConfig?.list_options?.indexOf("斑马纹") != -1;
    },
    carousel() {
      return this.listConfig?.list_options?.includes("滚动");
    },
    config() {
      let res = {
        header: [],
        data: [],
      };
      if (this.tableColumn?.length) {
        res.header = this.tableColumn.map((item) => item.label);
        if (this.tableData?.length) {
          res.data = this.tableData.map((item) => {
            let val = [];
            this.tableColumn.forEach((col) => {
              val.push(item[col.columns]);
            });
            return val;
          });
        }
      }
      return res;
    },
    layoutJson: function () {
      let json = this.listConfig?.layout_json || null;
      return json;
    },
    getCardGroupStyle() {
      let style = {}
      if (this.layoutJson?.gap_style) {
        style["display"] =this.layoutJson?.gap_style
      }
      if (this.layoutJson?.style_json_diy?.gap) {
        style["grid-gap"] = this.layoutJson?.style_json_diy?.gap
      }
      if (this.layoutJson?.cols_num) {
        style["grid-template-columns"] = `repeat(${this.layoutJson?.cols_num}, 1fr)`
      }
      if (style.display === 'gap') style.display = 'grid';
      return Object.entries(style).map(([key, value]) => `${key}: ${value};`).join('')
    },
    cardUnitJson: function () {
      let json = this.listConfig?.card_unit_json || null;
      return json;
    },
    activeCardJson() {
      return this.listConfig?.active_card_list_json || null;
    },
    comColMap: function () {
      let json = this.pageItem?.cols_map_json || null;
      console.log("comColMap", this.tableLayoutType, json);
      return json;
    },
    comColMapJson: function () {
      let json = this.pageItem?.cols_map_json?.cols_map_json || null;
      return json;
    },
    listV2RowButtons() {
      let buttons =
        this.v2Data?.rowButton?.filter((item) => item.permission) || [];
      if (this.readOnly) {
        //只读列表指控功能按钮
        buttons = [];
      }
      return buttons;
    },
    listV2GridButtons() {
      let buttons =
        this.v2Data?.gridButton?.filter((item) => item.permission) || [];
      if (this.readOnly) {
        //只读列表指控功能按钮
        buttons = [];
      }
      return buttons;
    },
    addBtn() {
      let btn = this.listV2GridButtons.find(
        (item) => item.button_type === "add"
      );
      return this.listOptions?.includes("添加") && btn;
    },
    getAddService() {
      return this.addBtn?.service_name;
    },
    colsMapDetailJson() {
      // 组件参数 的map array  接口返回数据格式 无法确定接口时啥样子，小程序 逻辑使用com_para_with_map_json 但没值，改用有值的 page_com_cols_map_json
      let pageComColsMapJson = this.pageItem.page_com_cols_map_json || null;
      let colsMapDetailJson = null;
      if (pageComColsMapJson) {
        // 识别、处理组件到页面参数联动
        if (
          pageComColsMapJson.cols_map_detail_json &&
          Array.isArray(pageComColsMapJson.cols_map_detail_json)
        ) {
          colsMapDetailJson = pageComColsMapJson.cols_map_detail_json;
          console.log("colsMapDetailJson", colsMapDetailJson);
        }
      }
      return colsMapDetailJson;
    },
    setStyle() {
      return formatStyleData(this.pageItem?.style_json || {});
    },
    setSwiperStyle() {
      if (this.listConfig?.swiper_style_json) {
        return formatStyleData(this.listConfig?.swiper_style_json);
      }
    },
    setSwiperHeight() {
      return this.setSwiperStyle?.height?.includes("px")
        ? this.setSwiperStyle.height
        : "150px";
    },

    setListSwiperImg() {
      if (
        Array.isArray(this.tableData) &&
        typeof this.listOptions === "string" &&
        (this.listOptions?.includes("顶部图片") ||
          this.listOptions?.includes("底部图片") ||
          this.listOptions?.includes("左侧图片") ||
          this.listOptions?.includes("右侧图片")) &&
        this.listConfig?.swiper_col
      ) {
        return this.tableData
          .filter((item) => !!item[this.listConfig?.swiper_col])
          .map((item) => {
            item._img_url = item[this.listConfig?.swiper_col];
            return item;
          });
      }
    },
    // 是否为纵向滚动
    isVerticalScroll() {
      const displayLimit = this.listConfig.data_disp_limit || 5;
      return (this.listConfig.use_animation!=='否' &&
        (this.listConfig.animation_type === "纵向滚动" || this.listConfig.child_animation_type === "纵向滚动") &&
        this.tableData.length > displayLimit
      );
    },
    // 显示行数限制
    displayRowLimit() {
      return this.listConfig.data_disp_limit || 5;
    },
    // 显示的表格数据（用于滚动）
    displayTableData() {
      // 直接返回原始数据，不进行数据操作
      return this.tableData;
    },
    setTableStyle() {
      return {
        "--tbl_head_bg":
          this.listConfig?.tbl_head_bg ||
          this.setStyle?.["--tbl_head_bg"] ||
          null,
        "--tbl_head_color":
          this.listConfig?.tbl_head_color || this.setStyle?.["--tbl_head_bg"] || null,
        "--cell_bg":
          this.listConfig?.cell_bg || this.setStyle?.["--cell_bg"] || null,
        "--cell_color":
          this.listConfig?.cell_color ||
          this.setStyle?.["--cell_color"] ||
          null,
        "--cell_bg2":
          this.listConfig?.cell_bg2 || this.listConfig?.cell_bg_2 || this.setStyle?.["--cell_bg2"] || null,
        "--cell_color2":
          this.listConfig?.cell_color2 || this.listConfig?.cell_color_2 ||
          this.setStyle?.["--cell_color2"] ||
          null,
      };
    },
    // 动态计算操作列宽度
    rowButtonBoxWidth() {
      if (!this.showRowButtons || !this.setRowButtons.length) {
        return '0px';
      }

      // 基础按钮宽度（包含padding、margin等）
      const baseButtonWidth = 60; // mini按钮基础宽度
      const buttonMargin = 8; // 按钮间距
      const containerPadding = 16; // 容器内边距
      const buttonPadding = 10; // 按钮内边距

      // 计算所有按钮文字的总长度
      let totalTextWidth = 0;
      this.setRowButtons.forEach(btn => {
        const textWidth = this.measureTextWidth(btn.button_name || '', '12px');
        const buttonWidth = textWidth + buttonPadding;
        totalTextWidth += buttonWidth
      });

      // 计算总宽度：按钮数量 * 基础宽度 + 文字宽度 + 间距
      const totalWidth =
        this.setRowButtons.length * baseButtonWidth +
        totalTextWidth +
        (this.setRowButtons.length - 1) * buttonMargin +
        containerPadding;

      // 设置最小和最大宽度限制
      const minWidth = 80;
      const maxWidth = 200;

      return Math.min(Math.max(totalWidth, minWidth), maxWidth) + 'px';
    },

    // 操作列样式
    rowButtonBoxStyle() {
      return {
        width: this.rowButtonBoxWidth,
        minWidth: this.rowButtonBoxWidth,
        maxWidth: this.rowButtonBoxWidth,
        color: this.setStyle && this.setStyle.color,
        'font-size': this.setStyle && this.setStyle['font-size'],
      };
    },
  },
  methods: {
    async refresh() {
      // 刷新列表
      this.$set(this.pageInfo, 'pageNo', 1)
      let itemReqJson = this.pageItem.srv_req_json
        ? this.bxDeepClone(this.pageItem.srv_req_json)
        : null;
      const req = itemReqJson
        ? this.buildRequestParams(itemReqJson)
        : itemReqJson;
      // console.log("列表请求", req);
      this.getListData(req);
    },
    handleSearchChange(val) {
      this.searchKey2 = val;
    },
    handleSearch() {
      this.onSearch();
    },
    // 精确测量文字宽度
    measureTextWidth(text, fontSize = '12px', fontFamily = 'Arial') {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      context.font = `${fontSize} ${fontFamily}`;
      return context.measureText(text).width;
    },
    onSelect(item) {
      console.log("onSelect", item);
      if (
        this.listConfig?.map_filter_val_field &&
        item[this.listConfig?.map_filter_val_field]
      ) {
        // this.mapSearchKey = item[this.listConfig?.map_filter_val_field];
        this.mapSearchKey = item.path;
        this.onSearch();
      }
    },
    onActionComplete(event) {
      console.log("onActionComplete", event);
      this.showAddDialog = false;
      this.onSearch();
    },
    onFormLoaded(event) {
      console.log("onFormLoaded", event);
    },
    onSearch() {
      this.pageInfo.pageNo = 1;
      let itemReqJson = this.pageItem.srv_req_json
        ? this.bxDeepClone(this.pageItem.srv_req_json)
        : null;
      // 组件请求
      if (itemReqJson) {
        itemReqJson.condition = itemReqJson.condition || [];
        if (this.listConfig?.filter_cols && this.searchKey) {
          itemReqJson.condition.push({
            colName: this.listConfig?.filter_cols,
            ruleType: "like",
            value: this.searchKey,
          });
        }
        if(this.listConfig?.multi_search_cols && this.searchKey2){
          let multiSearchCols = this.listConfig?.multi_search_cols.split(",");
          itemReqJson.relation_condition = {
              relation: 'OR',
              data: []
            }
          multiSearchCols.forEach(col => {
            itemReqJson.relation_condition.data.push({
              colName: col,
              ruleType: "like",
              value: this.searchKey2,
            });
          });
        }
        if (this.listConfig?.map_filter_field && this.mapSearchKey) {
          // itemReqJson.condition.push({
          //   colName: this.listConfig?.map_filter_field,
          //   ruleType: "eq",
          //   value: this.mapSearchKey,
          // });
          itemReqJson.condition.push({
            colName: "path",
            ruleType: "[like]",
            value: this.mapSearchKey,
          });
        }
        const req = this.buildRequestParams(itemReqJson);
        this.getListData(req);
      }
    },
    toMore() {
      const { jump_page_json: jumpJson } = this.listConfig || {};
      if (
        jumpJson?.click_jump_option?.includes("先登录") ||
        jumpJson.auth_type === "注册用户" ||
        jumpJson.auth_type === "指定用户"
      ) {
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
            const currentUrl = window.location.pathname + window.location.hash;
            sessionStorage.setItem("login_redirect_url", currentUrl);
            const loginUrl = window.location.origin + "/main/login.html";
            window.location.href = loginUrl;
          });
          return;
        }
      }
      if (jumpJson?.obj_type === "内部页面") {
        let pageNo = jumpJson?.dest_page_no;
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
      this.$emit("toMore", this.listConfig?.jump_page_json);
    },
    // 透传参数
    setPageParams(key, val) {
      // 接受透传参数
      this.$emit("setPageParams", key, val);
    },
    handleCurrentChange(val) {
      this.pageInfo.pageNo = val;
      let itemReqJson = this.pageItem.srv_req_json
        ? this.bxDeepClone(this.pageItem.srv_req_json)
        : null;
      if (itemReqJson?.page) {
        itemReqJson.page.pageNo = val;
      } else if (itemReqJson) {
        itemReqJson.page = {
          pageNo: val,
          rownumber: this.pageInfo.rownumber || 10,
        };
      }
      const req = itemReqJson
        ? this.buildRequestParams(itemReqJson)
        : itemReqJson;
      // console.log("列表请求", req);
      this.getListData(req);
    },
    async getListData(req) {
      const url = `/${req.mapp}/select/${req.serviceName}`;
      if (Array.isArray(req.condition) && req.condition.length) {
        const data = Object.keys(this.pageParamsModel).reduce((res, key) => {
          res[key] = this.pageParamsModel[key]?.value;
          return res;
        }, {});
        let userInfo = sessionStorage.getItem('login_user_info') || sessionStorage.getItem('current_login_user')
        if(userInfo){
          try{
            userInfo = JSON.parse(userInfo)
          }catch(e){
            userInfo = null
            console.error('解析用户信息失败', e)
          }
        }
        data.user = userInfo
        data.userInfo = userInfo
        data.user_no = userInfo?.user_no || ''
        req.condition.forEach((item) => {
          item.value = this.renderStr(item.value, data);
        });
      }
      this.loading = true;

      const isFirstPage = !this.pageInfo || !this.pageInfo.pageNo || this.pageInfo.pageNo === 1;

      try {
        const res = await $http.post(url, req);
        // 组件已销毁，响应不再写入 state
        if (this._isDestroyed) return;
        this.loading = false;
        this.loaded = true;


        if (res.data.state === "SUCCESS") {
          this.tableData = Array.isArray(res.data.data) ? res.data.data : [];
          console.log("列表数据1111111", this.tableData);
          if (res.data.page) {
            this.pageInfo = res.data.page;
          }
          // 数据更新后重新启动滚动
          if (this.isVerticalScroll) {
            this.$nextTick(() => {
              // this.startVerticalScroll();
            });
          }
          // 首页加载完成时通知父组件数据已加载（用于"没数据时隐藏"）
          if (isFirstPage) {
            this.$emit("data-loaded", { count: this.tableData.length });
          }
        } else {
          // 请求失败 / 数据异常
          if (isFirstPage) {
            this.$emit("data-loaded", { count: 0 });
          }
        }
      } catch (error) {
        console.error("list getListData error:", error);
        if (this._isDestroyed) return;
        this.loading = false;
        this.loaded = true;
        this.tableData = [];
        if (isFirstPage) {
          this.$emit("data-loaded", { count: 0 });
        }
      }
    },
    async getV2Data(srvCfg) {
      try {
        const url = `/${srvCfg.mapp}/select/srvsys_service_columnex_v2_select?colsel_v2=${srvCfg.serviceName}`;
        const req = {
          serviceName: "srvsys_service_columnex_v2_select",
          colNames: ["*"],
          condition: [
            {
              colName: "service_name",
              ruleType: "eq",
              value: srvCfg.serviceName,
            },
            { colName: "use_type", ruleType: "eq", value: "list" },
          ],
          order: [{ colName: "seq", orderType: "asc" }],
        };
        const res = await $http.post(url, req);
        if (res?.data?.state === "SUCCESS" && res?.data?.data) {
          if (res.data.data.cfg_json) {
            try {
              res.data.data.cfgJson = JSON.parse(res.data.data.cfg_json);
            } catch (error) { }
          }
          if (this._isDestroyed) return;
          this.v2Data = res.data.data;
        }
      } catch (error) {
        console.warn("list getV2Data error:", error);
      }
    },
    async getStatisticData(req) {
      try {
        const colName = this.v2Data?.cfgJson?.statistics_card_col;
        const col = this.v2Data?.srv_cols?.find(
          (item) => item.columns === colName
        );
        if (col && col.col_type === "Enum") {
          const group = [
            {
              colName: colName,
              type: "by",
            },
            {
              colName: colName,
              type: "count",
              aliasName: "count",
            },
          ];
          req.condition = req.condition || [];
          req.condition.push({
            colName,
            ruleType: "notnull",
            value: null,
          });
          const url = `/${req.mapp}/select/${req.serviceName}`;
          req.group = group;
          const res = await $http.post(url, req);
          if (res?.data?.state === "SUCCESS") {
            if (Array.isArray(res.data.data) && res.data.data.length > 0) {
              if (this._isDestroyed) return;
              this.stasticData = [];
              res.data.data.forEach((item) => {
                item.label = applyEncryptParam(item, colName, item[colName]);
                item.value = item.count;
                this.stasticData.push(item);
              });
            }
          }
        }
      } catch (error) {
        console.warn("list getStatisticData error:", error);
      }
    },
    applyEncryptParam(row, colName, val) {
      return applyEncryptParam(row, colName, val);
    },

    onClickBlock(e) {
      console.log("onClickBlock", e);
    },
    onRowButtonClick(e, data) {
      console.log(e, data);
      if (e?.button_type === 'detail') {
        if (e.service_name && data?.id) {
          let address = `${getFullBaseUrl()}/detail/${e.service_name}/${data.id}`
          if (e.application) {
            address += `?srvApp=${e.application}`
          }
          let title = `${e.service_view_name}[${data.id}]`
          if (this.v2Data?.key_disp_col && data[this.v2Data?.key_disp_col]) {
            title = `${data[this.v2Data?.key_disp_col]}(${e.service_view_name})`
          }
          this.addTabByUrl(address, title)
        }
      } else if (e?.operate_mode === "跳转") {
        if (e.operate_type === "URL跳转") {
          const result = this.pre_data_handle(e, [data]);
          if (result) {
            window.open(result);
          }
        }
      }
    },
    pre_data_handle(butinfo, operateData) {
      var me = this;
      var pre_data_handle = butinfo.pre_data_handle;
      if (
        pre_data_handle != undefined &&
        pre_data_handle != null &&
        pre_data_handle != ""
      ) {
        if (operateData) {
          if (operateData.length == 0) {
            operateData = [{}];
          }
        }
        const url = eval("var zz=" + pre_data_handle + "(operateData,me); zz");
        return url;
      }
      return operateData;
    },
    onClickCell(e = {}) {
      console.log("onClickCell", e);
      const { cellsLayout, data } = e;
      if (data) {
        const comNo = this.pageItem?.com_no;
        if (comNo && this.pageCompVarMap && Object.keys(this.pageCompVarMap).length > 0) {
          Object.entries(this.pageCompVarMap).forEach(([pageCol, comCol]) => {
            const value = data[comCol];
            this.$store.commit("pageEvent/SET_COMP_VARIABLE_WITH_PAGE_SYNC", {
              com_no: comNo,
              componentId: comNo,
              key: comCol,
              value: value,
            });
          });
        }
      }
      if (data && cellsLayout?.jump_json) {
        const jumpJson = cellsLayout.jump_json;
        return this.jumpAction(jumpJson, data);
      }
    },
    buildRequestParams(e) {
      // 处理请求中变量 根据参数关系 获取动态值
      let condition = this.bxDeepClone(e.condition);
      let mapsJonss = this.colsMapDetailJson || [];

      if (Array.isArray(condition)) {
        for (let cond of condition) {
          // console.log("buildRequestParams", cond.colName, cond.value);
            if (cond.var_src === '页面接口参数') {
              const value_key = cond.value;
              // 页面接口参数 从页面参数中取值
              delete cond.var_src;
              delete cond.value;
              if (this.pageParamsModel && typeof this.pageParamsModel === 'object' && value_key && this.pageParamsModel[value_key]?.value) {
                cond.value = this.pageParamsModel[value_key].value;
              }
            } else if (
            cond.value &&
            cond.value.startsWith("${") &&
            cond.value.endsWith("}")
          ) {
            // 根据${} 格式转移变量名称
            let par = cond.value.replace("${", "");

            par = par.replace("}", "");
            let params = this.bxDeepClone(this.pageParamsModel);
            if (params && Object.keys(params).length > 0) {
              for (let key in params) {
                // console.log('key',key,par)
                if (key === par) {
                  let mapsCol = mapsJonss.filter(
                    (item) => item.col_to === par || item.col_from === par
                  );
                  if (Array.isArray(mapsCol) && mapsCol.length > 0) {
                    // 遍历组件参数 映射
                    let model = null;
                    for (let col of mapsCol) {
                      switch (col.from_type) {
                        case "页面":
                          // 来源为页面
                          model = this.pageParamsModel;
                          switch (col.to_type) {
                            case "组件":
                              // 目标为组件的参数，设置动态获取的值
                              cond.value = this.pageParamsModel[key].value;
                              if (
                                cond.value === undefined &&
                                cond.ruleType === "eq"
                              ) {
                                cond.ruleType = "like";
                              }
                              break;
                            case "页面":
                              break;

                            default:
                              break;
                          }
                          break;

                        default:
                          break;
                      }
                    }
                  }
                }
              }
            }
          }
             // 日期关键词 转换为对应的时间字符
            if (typeof cond.value === 'string' && getDateKeys().includes(cond.value)) {
              cond.value = getDateByKey(cond.value);
            }

            if (Array.isArray(cond.value) && cond.value.length === 2) {
              // 范围查询 ruleType改为between
              cond.ruleType = 'between'
            }
        }
      }
      e.condition = this.bxDeepClone(condition);
      if (e.page) {
        this.pageInfo.pageNo = e.page.pageNo;
        this.pageInfo.rownumber = e.page.rownumber;
      } else {
        e.page = {
          pageNo: this.pageInfo.pageNo,
          rownumber: this.pageInfo.rownumber,
        };
      }
      // console.log(e.serviceName,condition)
      return e;
    },
    paramsLinkage() {
      let itemReqJson = this.pageItem.srv_req_json
        ? this.bxDeepClone(this.pageItem.srv_req_json)
        : null;
      // 组件请求
      const req = itemReqJson
        ? this.buildRequestParams(itemReqJson)
        : itemReqJson;
      // console.log('列表请求',req,req.serviceName)
      let mapsJonss = this.colsMapDetailJson || [];
      if (Array.isArray(mapsJonss)) {
        for (let p of mapsJonss) {
          if (p.from_type === "页面" && p.trigger_time === "联动") {
            // 设置了与页面联动参数值时
            this.getListData(req);
          }
        }
      }
    },


    // 错误处理包装器
    safeExecute(fn, errorMessage = "操作执行失败") {
      try {
        return fn();
      } catch (error) {
        console.error(errorMessage, error);
        this.error = errorMessage;
        return null;
      }
    },
  },
  mounted() {
    if (this.pageItem?.srv_req_type === "模拟数据") {
      this.tableData = this.pageItem?.mock_srv_data_json || [];
      this.pageInfo.total = this.tableData.length;
      this.loaded = true;
    } else if (this.pageItem?.srv_req_json) {
      let itemReqJson = this.pageItem.srv_req_json
        ? this.bxDeepClone(this.pageItem.srv_req_json)
        : null;
      const req = itemReqJson
        ? this.buildRequestParams(itemReqJson)
        : itemReqJson;
      // console.log("列表请求", req);
      this.getListData(req);
      if (
        this.listConfig?.list_options?.includes("自定义表头") ||
        this.listType !== "表格"
      ) {
        // 不请求v2
      } else {
        this.getV2Data(req).then((_) => {
          this.getStatisticData(req);
        }).catch((error) => {
          console.warn("list v2数据加载失败:", error);
        });
      }
    }
    // else if(Array.isArray(this.pageItem.list_json?.mock_data_json)&&this.pageItem.list_json?.mock_data_json.length){
    //   this.tableData = this.pageItem.list_json?.mock_data_json;
    // }

  },

  beforeDestroy() {
    // 标记组件已销毁，异步回调不再写入 state
    this._isDestroyed = true;
  },

  watch: {
    // pageParamsModel: {
    //   deep: true,
    //   immediate: true,
    //   handler: function (newVal, oldVal) {
    //     // 页面参数更新后调用
    //     this.paramsLinkage();
    //   },
    // },

  },
};
</script>

<style lang="scss" scoped>
.data-view-list {
  position: relative;
  width: 100%;
  display: flex;
  overflow: hidden;
  flex: 1;

  .map-card-container {
    width: 70%;
  }

  .list-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;

    .list-title {
      font-size: 18px;
      padding: 10px 20px;
      font-weight: bold;
    }

    .list-view {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      scrollbar-width: none;
      scrollbar-width: thin;
      scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
      display: flex;
      flex-direction: column;
      &::-webkit-scrollbar {
        width: 3px;
        height: 0;
      }

      &::-webkit-scrollbar-thumb {
        background-color: rgba(0, 0, 0, 0.1);
        border-radius: 4px;
      }

      .empty-data {
        min-height: 60px;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #909399;
        font-size: 14px;
      }
    }
  }
}

.more-btn {
  position: absolute;
  top: 15px;
  right: 0;
  margin: 0 15px;
  cursor: pointer;
  color: inherit;

  // transition: scale 0.3s ease-in-out;
  &:hover {
    scale: 1.05;
    // font-weight: bold;
    // border-bottom: 1px dashed currentColor;
  }
}

.handler-bar {
  display: flex;
  justify-content: space-between;

  .search-input {
    min-width: 300px;
  }

  .search-btn {
    min-width: 80px;
  }
}



.statistic-box {
  display: flex;
  padding: 10px;

  .statistic-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 10px;
    background-color: #1e2750;
    margin-right: 20px;
    cursor: pointer;
    min-width: calc(20% - 80px / 5);

    &:last-child {
      margin: 0;
    }

    .label {
      line-height: 30px;
      color: #6ba1ff;
      text-align: left;
    }

    .value {
      text-align: left;
    }
  }
}

.bx-card-list {
  .swiper-container {
    position: relative;

    ::v-deep .el-carousel__indicators.el-carousel__indicators--horizontal {
      bottom: 20px;
    }

    .swiper-title {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 30px;
      line-height: 30px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      background: rgba($color: #000, $alpha: 0.3);
      padding: 0 10px;
      font-size: 14px;
      color: #fff;
    }
  }
}

.pagination-box {
  text-align: center;
  padding: 10px;

  :deep(.el-pagination) {
    &.is-background {
      .el-pager li:not(.disabled).active {
        background-color: var(--primary-color, #2196f3);
      }
    }
  }
}

/* 自定义加载动画样式 */
.custom-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.loading-spinner {
  position: relative;
  width: 60px;
  height: 60px;
  margin-bottom: 20px;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-radius: 50%;
  animation: spin 1.5s linear infinite;
}

.spinner-ring:nth-child(1) {
  border-top-color: #3498db;
  animation-delay: 0s;
}

.spinner-ring:nth-child(2) {
  border-top-color: #e74c3c;
  animation-delay: -0.5s;
  width: 80%;
  height: 80%;
  top: 10%;
  left: 10%;
}

.spinner-ring:nth-child(3) {
  border-top-color: #f39c12;
  animation-delay: -1s;
  width: 60%;
  height: 60%;
  top: 20%;
  left: 20%;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: #666;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 1px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 0.6;
  }

  50% {
    opacity: 1;
  }
}

/* 深色主题适配 */
.data-view-list[data-theme="dark"] .custom-loading {
  background: rgba(0, 0, 0, 0.8);
}

.data-view-list[data-theme="dark"] .loading-text {
  color: #ccc;
}
</style>
