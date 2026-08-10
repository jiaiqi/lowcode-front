<template>
  <div class="date-time-container">
    <a
      class="el-icon-arrow-left back-button"
      @click="goBack"
      v-if="partsSet.indexOf('返回按钮') > -1"
    ></a>
    <a
      class="el-icon-s-home back-button"
      style="font-size: 30px;"
      :href="calcHomePath"
      v-if="partsSet.indexOf('首页按钮') > -1 && homePageNo"
      @click.prevent="goHome"
    ></a>
    <div class="date-time" :style="{ color: color }">
      <div class="time">{{ time }}</div>
      <div class="date">
        <div class="ymd">{{ date }}</div>
        <div class="week">{{ week }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import dayjs from "dayjs";
import { getHomePageNo } from "@/common/http";

let timer = "";
export default {
  data() {
    return {
      time: "",
    };
  },
  props: {
    pageConfig: {
      type: Object,
      default: () => {},
    },
    showSeconds: {
      type: Boolean, //是否显示秒数
      default: false,
    },
    partsSet: {
      type: String,
      default: "年,月,日,时,分,秒",
    },
    color: {
      type: String,
      default: "#fff",
    },
  },
  computed: {
    homePageNo() {
      let result = "";
      console.log("homePageNo", this.pageConfig);
      let homePageNo = getHomePageNo() || "BX2508041432140001"; //暂时写死
      if(this.pageConfig?.path && this.pageConfig?.path.split("/").length > 1){
        homePageNo = this.pageConfig?.path.split("/")[1];
      }
      if (this.pageConfig.page_no && this.pageConfig.page_no !== homePageNo) {
        result = homePageNo;
      }
      return result;
    },
    calcHomePath(){
      return `/site/${this.homePageNo}`;
    },
    date() {
      let format = "";
      if (this.partsSet.indexOf("年") > -1) {
        format += "YYYY-";
      }
      if (this.partsSet.indexOf("月") > -1) {
        format += "MM-";
      }
      if (this.partsSet.indexOf("日") > -1) {
        format += "DD";
      }
      return dayjs(new Date()).format(format || "YYYY-MM-DD");
    },
    week() {
      let arr = [
        "星期天",
        "星期一",
        "星期二",
        "星期三",
        "星期四",
        "星期五",
        "星期六",
      ];
      return arr[new Date().getDay()];
    },
  },
  mounted() {
    if (this.partsSet) {
      let timeFormat = "";
      if (this.partsSet.indexOf("时") > -1) {
        timeFormat += "HH:";
      }
      if (this.partsSet.indexOf("分") > -1) {
        timeFormat += "mm:";
      }
      if (this.partsSet.indexOf("秒") > -1) {
        timeFormat += "ss";
      }
      this.time = dayjs(new Date()).format(timeFormat || "HH:mm:ss");
      timer = setInterval(() => {
        this.time = dayjs(new Date()).format(timeFormat || "HH:mm:ss");
      }, 1000);
    } else if (this.showSeconds) {
      this.time = dayjs(new Date()).format("HH:mm:ss");
      timer = setInterval(() => {
        this.time = dayjs(new Date()).format("HH:mm:ss");
      }, 1000);
    } else {
      this.time = dayjs(new Date()).format("HH:mm");
      timer = setInterval(() => {
        this.time = dayjs(new Date()).format("HH:mm");
      }, 1000);
    }
  },
  beforeDestroy() {
    clearInterval(timer);
  },
  methods: {
    goHome() {
      if (this.homePageNo) {
        this.$router.push(this.calcHomePath);
      }
    },
    goBack() {
      // 优先使用 Vue Router 的后退功能，如果不可用则使用浏览器原生后退
      if (this.$router) {
        this.$router.go(-1);
      } else {
        window.history.back();
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.date-time-container {
  display: flex;
  align-items: center;
}

.back-button {
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 5px;
  border-radius: 4px;
  margin-right: 10px;
  color: currentColor;
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    transform: translateX(-2px);
    text-decoration: none;
  }

  &:active {
    transform: translateX(-1px);
  }
}

.date-time {
  display: flex;
  width: auto;
  flex-wrap: nowrap;
}

.time {
  font-size: 40px;
}

.date {
  font-size: 14px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding-left: 5px;

  .ymd,
  .week {
    line-height: 1;
    text-align: left;
  }

  .ymd {
    margin-bottom: 5px;
  }
}
</style>