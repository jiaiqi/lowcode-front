<template>
  <div
    class="content-wrap"
    :class="setClassByPath"
    v-if="contentViewMode !== '空白'"
  >
    <div
      class="title"
      v-if="data && data.name"
    >
      <Icon
        icon="ri-arrow-right-s-fill"
        class="icon"
      ></Icon>
      <span class="ml-2 text">
        {{ data.name || "" }}
      </span>
    </div>
    <template v-if="contentViewMode === '详情'">
      <template v-if="showRichText">
        <div
          class="content rich-text-content"
          v-if="contentList && contentList.length"
          v-html="recoverFileAddress4richText(contentList && contentList[0].content)
            "
        ></div>
        <div v-else>
          <el-empty description="暂无数据"></el-empty>
        </div>
      </template>
      <template v-if="showCustomPage && customPageJson">
        <low-code-view
          :low-code-json="customPageJson"
          :low-code-params="contentList[0]"
        />
      </template>
    </template>
    <template v-else-if="contentViewMode === '列表'">
      <div class="quick-filter">
        <el-input
              placeholder="搜索关键字"
              class="search-input mr-2"
              clearable
              style="width: 300px;"
              size="small"
              v-model="searchKey"
              @change="handleSearchChange"
            ></el-input>
        <el-button
          class="filter-btn"
          size="small"
          :class="{ primary: dateType === '近一周' }"
          @click="changeDateType('近一周')"
        >近一周</el-button>
        <el-button
          class="filter-btn"
          size="small"
          :class="{ primary: dateType === '近一月' }"
          @click="changeDateType('近一月')"
        >近一月</el-button>
        <el-button
          class="filter-btn"
          size="small"
          :class="{ primary: dateType === '近半年' }"
          @click="changeDateType('近半年')"
        >近半年</el-button>
        <el-date-picker
          class="date-picker"
          size="small"
          v-model="dateRange"
          format="yyyy-MM-dd"
          value-format="yyyy-MM-dd HH:mm:ss"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="dateRangeChange"
        >
        </el-date-picker>
      </div>
      <template v-if="contentList && contentList.length">
        <div class="content-list">
          <template v-if="listStyle === 'style-1'">
            <div
              class="content-item style-1"
              @click="onTap(item)"
              v-for="(item, index) in contentList"
            >
              <div class="date-box">
                <div class="year">
                  {{ dayjs(item.release_time).format("YYYY") }}
                </div>
                <div class="month">
                  {{ dayjs(item.release_time).format("MM/DD") }}
                </div>
              </div>
              <div class="line"></div>
              <div class="content-box">
                <div class="title multi-line-ellipsis">{{ item.title }}</div>
                <div class="summary multi-line-ellipsis">
                  {{ item.summary }}
                </div>
              </div>
            </div>
          </template>
          <template v-if="listStyle === 'style-2'">
            <div
              class="content-item style-2"
              @click="onTap(item)"
              v-for="(item, index) in contentList"
            >
              <img
                class="img"
                :src="getImagePath(item.thn_img)"
                alt=""
                v-if="item.thn_img"
              />
              <div class="line"></div>
              <div class="content-box">
                <div class="title multi-line-ellipsis">{{ item.title }}</div>
                <div class="summary multi-line-ellipsis">
                  {{ item.summary }}
                </div>
                <div class="footer">
                  <span>来源：{{ item.source || "" }}</span>
                  <span class="separator"></span>
                  <span>{{
                    dayjs(item.release_time).format("YYYY-MM-DD")
                  }}</span>
                </div>
              </div>
            </div>
          </template>
        </div>
        <div class="pagination-box">
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
      </template>
      <div v-else>
        <el-empty description="暂无数据"></el-empty>
      </div>
    </template>
    <catalog-tabs
      :data="data"
      v-if="data && data.child_view_mode === 'tabs'"
    >
    </catalog-tabs>
  </div>
</template>

<script>
import dayjs from "dayjs";

import { Icon } from "@iconify/vue2";
import catalogTabs from "./tabs.vue";

import { $selectList, getImagePath } from "@/common/http";
// import lowCodeView from "@/pages/lowcode/view.vue";
export default {
  components: {
    Icon,
    catalogTabs,
    lowCodeView: () => import("@/pages/lowcode/view.vue")
  },
  computed: {
    tabs() {
      return this.data.children || [];
    },
    setClassByPath() {
      let path = this.data.path || "";
      if (path) {
        return `level-${path.split("/").filter((item) => !!item).length - 1}`;
      }
    },
    listStyle() {
      return this.data.list_ui?.includes("风格1") ? "style-1" : "style-2";
    },
    showRichText() {
      if (this.contentViewMode === "详情") {
        const content = this.contentList?.[0];
        if (content) {
          return !content?.content_show_method || content?.content_show_method?.includes("富文本");
        }
      }
    },
    showCustomPage() {
      if (this.contentViewMode === "详情") {
        const content = this.contentList?.[0];
        if (content) {
          return content?.content_show_method?.includes("自定义页面");
        }
      }
    },
    customPageJson() {
      if (this.showCustomPage && this.contentList?.[0].related_page_json) {
        return JSON.parse(this.contentList?.[0].related_page_json);
      }
    },
  },
  props: {
    data: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      dayjs,
      getImagePath,
      contentList: [],
      contentViewMode: null,
      pageInfo: {
        pageNo: 1,
        rownumber: 10,
        total: 0,
      },
      dateType: "",
      searchKey: "",
      dateRange: null,
    };
  },
  methods: {
    handleSearchChange(val) {
      this.searchKey = val;
      this.fetchContentData(this.data.no);
    },
    dateRangeChange(value) {
      console.log("dateRangeChange", value);
      if (value && value.length) {
        this.dateRange = value;
        this.dateType = null;
        this.fetchContentData(this.data.no);
      } else {
        this.dateType = null;
        this.dateRange = null;
      }
      this.fetchContentData(this.data.no);
    },
    changeDateType(type) {
      if (this.dateType !== type) {
        this.dateType = type;
        this.dateRange = null;
        switch (type) {
          case "近一周":
            this.dateRange = [
              dayjs().subtract(7, "day").format("YYYY-MM-DD 00:00:00"),
              dayjs().format("YYYY-MM-DD 23:59:59"),
            ];
            break;
          case "近一月":
            this.dateRange = [
              dayjs().subtract(1, "month").format("YYYY-MM-DD 00:00:00"),
              dayjs().format("YYYY-MM-DD 23:59:59"),
            ];
            break;
          case "近半年":
            this.dateRange = [
              dayjs().subtract(6, "month").format("YYYY-MM-DD 00:00:00"),
              dayjs().format("YYYY-MM-DD 23:59:59"),
            ];
            break;
        }
      } else {
        this.dateType = null;
        this.dateRange = null;
      }
      this.fetchContentData(this.data.no);
    },
    handleCurrentChange(val) {
      this.pageInfo.pageNo = val;
      this.fetchContentData(this.data.no);
    },
    onTap(item) {
      this.$emit("tap", item);
    },
    async fetchContentData(catalogNo) {
      const url = `/daq/select/srvdaq_pc_website_content_select`;
      const req = {
        serviceName: "srvdaq_pc_website_content_select",
        colNames: ["*"],
        condition: [
          { colName: "category_no", ruleType: "eq", value: catalogNo },
          { colName: "proc_status", ruleType: "eq", value: "完成" }
        ],
        relation_condition:{
          relation: 'OR',
          data: [
            { colName: "title", ruleType: "like", value: this.searchKey },
            { colName: "summary", ruleType: "like", value: this.searchKey },
          ]
        },
        page: { pageNo: this.pageInfo.pageNo || 1, rownumber: this.pageInfo.rownumber || 1 },
        order: [{
          colName: "release_time",
          orderType: "desc",
        }],
      };
      if (this.dateRange && this.dateRange.length) {
        req.condition.push({
          colName: "release_time",
          ruleType: "between",
          value: this.dateRange,
        });
      }
      const { data, ok, msg, page } = await $selectList(url, req);
      if (ok) {
        this.contentList = data;
        this.pageInfo.total = page?.total || 0;
      } else {
        this.$message.error(msg);
      }
    },
    init() {
      if (this.data?.is_leaf === "是") {
        this.contentViewMode = this.data.content_view_mode;
        if (this.data.content_view_mode === "详情") {
          this.fetchContentData(this.data.no);
        } else if (this.data.content_view_mode === "列表") {
          this.fetchContentData(this.data.no);
        }
      } else {
      }
    },
  },
  created() {
    this.init();
  },
  // watch: {
  //   data: {
  //     immediate: true,
  //     deep: true,
  //     handler(newValue, oldValue) {
  //       this.init()
  //     }
  //   }
  // },
};
</script>

<style lang="scss" scoped>
.content-wrap {
  flex: 1;
  padding: 0 5px;
  overflow: hidden;
  &.level-2 {
    .title {
      display: none;
      // .text{
      //   font-size: 24px;
      // }
    }
  }

  .title {
    align-items: center;
    display: flex;
    margin-bottom: 20px;

    .text {
      line-height: 40px;
      color: rgba(16, 16, 16, 1);
      font-size: 28px;
      font-weight: 700;
    }

    .icon {
      color: var(--primary-color, #007aff);
    }
  }

  .quick-filter {
    margin-bottom: 20px;

    .date-picker {
      margin-left: 10px;
    }

    .filter-btn {
      &.primary {
        border-color: transparent;
        background: var(--primary-color,
            linear-gradient(151.99deg,
              rgba(0, 122, 255, 1) 29.59%,
              rgba(4, 71, 171, 1) 294.82%));
        color: #fff;
      }
    }
  }

  .content-list {
    margin-bottom: 50px;

    .multi-line-ellipsis {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      /* 设置行数 */
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: normal;
      /* 允许文本换行 */
    }

    .content-item {
      font-size: 20px;
      display: flex;
      align-items: center;
      padding: 20px;
      border: 1px solid #eeeeee;
      margin-bottom: 10px;
      cursor: pointer;

      &:hover {
        box-shadow: rgba(0, 0, 0, 0.1) 0px 2px 12px 0px;
        border-bottom-width: 4px;
        border-bottom-color: var(--primary-color, #0447ab);

        .title {
          color: var(--primary-color, #0447ab);
        }
      }

      .content-box {
        min-height: 100px;
        flex: 1;
        font-size: 16px;
        display: flex;
        flex-direction: column;
        justify-content: center;

        .title {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 10px;
        }

        .summary {
          color: #737373;
          margin: 5px 0;
        }

        .footer {
          color: #aeaeb2;
          display: flex;
          align-items: center;
          line-height: 24px;

          .separator {
            display: inline-block;
            width: 2px;
            height: 16px;
            background-color: #aeaeb2;
            margin: 0 10px;
            vertical-align: middle;
          }
        }
      }

      &.style-1 {
        .date-box {
          width: 80px;
          text-align: center;

          .year {
            font-size: 28px;
            font-weight: 600;
          }

          .month {
            font-size: 24px;
            font-weight: 600;
          }
        }

        .line {
          width: 4px;
          height: 100px;
          margin: 0 20px 0 10px;
          background-color: #f5f5f5;
        }
      }

      &.style-2 {
        display: flex;
        align-items: center;

        .img {
          width: 240px;
          background-color: #ccc;
          border-radius: 6px;
          overflow: hidden;
          object-fit: cover;
          margin-right: 20px;
        }

        border: none;
      }
    }
  }

  .pagination-box {
    text-align: center;
    padding: 10px;

    :deep(.el-pagination) {
      &.is-background {
        .el-pager li:not(.disabled).active {
          background-color: var(--primary-color, #0447ab);
        }
      }
    }
  }

  /* 富文本内容样式隔离 */
  .rich-text-content {
    /* 重置所有样式到浏览器默认值，避免外部样式干扰 */
    all: revert;

    /* 设置基础容器样式 */
    display: block;
    width: 100%;
    box-sizing: border-box;

    /* 为富文本内容创建新的样式上下文 */
    isolation: isolate;

    /* 重置字体和基础样式 */
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 16px;
    line-height: 1.6;
    color: #333;

    /* 确保内部元素样式重置 */
    :deep(*) {
      /* 重置所有内部元素的样式 */
      all: revert;
      box-sizing: border-box;
    }

    /* 为常见的富文本元素设置合理的默认样式 */
    :deep(p) {
      margin: 1em 0;
      line-height: 1.6;
    }

    :deep(h1) {
      font-size: 2em;
      font-weight: bold;
      margin: 0.67em 0;
    }

    :deep(h2) {
      font-size: 1.5em;
      font-weight: bold;
      margin: 0.75em 0;
    }

    :deep(h3) {
      font-size: 1.17em;
      font-weight: bold;
      margin: 1em 0;
    }

    :deep(h4) {
      font-size: 1em;
      font-weight: bold;
      margin: 1.33em 0;
    }

    :deep(h5) {
      font-size: 0.83em;
      font-weight: bold;
      margin: 1.67em 0;
    }

    :deep(h6) {
      font-size: 0.67em;
      font-weight: bold;
      margin: 2.33em 0;
    }

    :deep(ul),
    :deep(ol) {
      margin: 1em 0;
      padding-left: 2em;
    }

    :deep(li) {
      margin: 0.5em 0;

      &::marker {
        color: currentColor;
      }
    }

    :deep(blockquote) {
      margin: 1em 0;
      padding-left: 1em;
      border-left: 4px solid #ddd;
      color: #666;
    }

    :deep(table) {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }

    :deep(th),
    :deep(td) {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }

    :deep(th) {
      background-color: #f5f5f5;
      font-weight: bold;
    }

    :deep(img) {
      // max-width: 100%;
      // height: auto;
      // display: initial;
      // margin: 1em auto;
      all: revert;
      border-style: solid;
      border-color: transparent;
    }

    :deep(a) {
      color: #007aff;
      text-decoration: underline;
    }

    :deep(a:hover) {
      color: #0056b3;
    }

    :deep(code) {
      background-color: #f5f5f5;
      padding: 2px 4px;
      border-radius: 3px;
      font-family: 'Courier New', Courier, monospace;
    }

    :deep(pre) {
      background-color: #f5f5f5;
      padding: 1em;
      border-radius: 5px;
      overflow-x: auto;
      margin: 1em 0;
    }

    :deep(pre code) {
      background-color: transparent;
      padding: 0;
    }
  }
}
</style>