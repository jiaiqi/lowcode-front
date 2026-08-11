<template>
  <video
    controls
    :src="getFileUrl"
    v-if="widgetType === '视频'"
    :controls="videoAttribute.controls === true"
    :muted="videoAttribute.muted === true"
    :loop="videoAttribute.loop === true"
    :controlslist="videoAttribute.controlslist"
    :autoplay="videoAttribute.autoplay === true"
    :poster="videoPoster"
    :style="[widgetStyleJson]"
  ></video>
  <el-select
    :value="currentTheme"
    placeholder="请选择"
    v-else-if="widgetType === '下拉切换主题'"
    class="theme-select"
    :style="[widgetStyleJson]"
    @change="handleThemeChange"
  >
    <el-option
      v-for="item in options"
      :key="item.value"
      :label="item.label"
      :value="item.value"
    >
    </el-option>
  </el-select>
  <div
    v-else-if="widgetType === '文本'"
    :style="[widgetStyleJson]"
  >
    <span v-if="pageItem && pageItem.widget_json">{{
      pageItem.widget_json.init_val || ""
    }}</span>
  </div>
  <div
    class="rich-text"
    v-else-if="widgetType === '富文本'"
    :style="[widgetStyleJson]"
    v-html="recoverFileAddress4richText(initRichText)"
  ></div>
  <div
    v-else-if="widgetType === 'navigate'"
    class="text-btn"
    @click="navTo"
    :style="[widgetStyleJson]"
  >
    {{ buttonWidgetJson.btn_label }}
  </div>
  <date-time
    v-else-if="widgetType === '时间日期'"
    :page-config="pageConfig"
    :show-seconds="showSeconds"
    :parts-set="timeWidgetJson['parts-set']"
    :color="widgetColor"
  ></date-time>
  <div
    class="full-screen"
    @click="openFullscreen"
    v-else-if="widgetType === 'fullscreen'"
    :style="[widgetStyleJson]"
  >
    <span
      class="el-icon-rank"
      v-if="isFullScreen"
      title="退出全屏"
      style="transform: rotate(45deg)"
    ></span>
    <span
      class="el-icon-full-screen"
      v-else
      title="全屏"
    ></span>
  </div>
  <weather
    v-else-if="widgetType === '天气'"
    :page-item="pageItem"
    :container-style="widgetStyleJson"
  ></weather>

</template>

<script>
import { formatStyleData } from "@/pages/lowcode/common/index";
import dateTime from "@/pages/lowcode/widgets/widgets/date-time.vue";
import { mapState, mapGetters, mapActions } from "vuex";
import weather from "./widgets/weather.vue";
export default {
  name: "widget",
  components: {
    dateTime,
    weather
  },
  props: {
    pageConfig: {
      type: Object,
      default: () => { },
    },
    pageItem: Object,
    pageNo: String,
  },
  mounted() {
    // 如果有主题列表但没有当前主题，设置默认主题
    if (this.themeList?.length && !this.currentTheme) {
      this.setCurrentTheme(this.themeList[0].name);
    }
  },
  data() {
    return {
      isFullScreen: false,
    };
  },
  computed: {
    ...mapState("theme", ["currentTheme"]),
    ...mapGetters("theme", ["themeList", "themeVariable"]),
    options() {
      if (this.widgetType === "下拉切换主题") {
        return (
          this.themeList?.map((item) => {
            return {
              value: item.name,
              label: item.name,
            };
          }) || []
        );
      }
      return [];
    },
    widgetJson() {
      return this.pageItem?.widget_json || {};
    },
    widgetStyleJson() {
      if (this.widgetJson?.col_text_pub_style_json) {
        return formatStyleData(this.widgetJson.col_text_pub_style_json);
      }
      return {};
    },
    initRichText() {
      return this.widgetJson?.init_mtext || this.widgetJson?.init_val || "";
    },
    buttonWidgetJson() {
      if (this.widgetJson?.button_cfg_json) {
        return this.widgetJson.button_cfg_json;
      }
      return {};
    },
    timeWidgetJson() {
      if (this.widgetJson?.col_type_time_json) {
        return formatStyleData(this.widgetJson.col_type_time_json);
      }
      return {};
    },
    showSeconds() {
      return this.timeWidgetJson &&
        this.timeWidgetJson["parts-set"] &&
        this.timeWidgetJson["parts-set"].indexOf("秒")
        ? true
        : false;
    },
    widgetType() {
      let type = this.widgetJson?.widget_type;
      if (type === "系统按钮") {
        type = this.widgetJson?.button_cfg_json?.sys_button_type;
      }
      return type;
    },
    widgetColor() {
      return this.widgetJson?.col_text_pub_style_json?.color;
    },
    getFileUrl() {
      if (this.widgetJson?.attachment) {
        return this.getImagePath(this.widgetJson?.attachment);
      } else if (this.widgetJson?.init_val) {
        return this.getImagePath(this.widgetJson.init_val);
      }
      return "";
    },
    videoPoster() {
      if (this.widgetJson?.thumbnail) {
        return this.getImagePath(this.widgetJson.thumbnail);
      }
      return "";
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
      if (this.widgetJson.video_attribute?.includes("自动播放")) {
        obj.autoplay = true;
      }
      if (this.widgetJson.video_attribute?.includes("控制面板")) {
        obj.controls = true;
      }
      if (this.widgetJson.video_attribute?.includes("不允许下载")) {
        obj.controlslist = "nodownload";
      }
      if (this.widgetJson.video_attribute?.includes("不允许全屏")) {
        obj.controlslist += obj.controlslist ? ",nofullscreen" : "nofullscreen";
      }
      if (obj.controlslist) {
        obj.controls = true;
      }
      if (this.widgetJson.video_attribute?.includes("自动循环播放")) {
        obj.loop = true;
      }
      if (this.widgetJson.video_attribute?.includes("默认静音")) {
        obj.muted = true;
      }
      return obj;
    },
  },
  created() {
    if (sessionStorage.theme_name) {
      this.currentTheme = sessionStorage.theme_name;
    }

    // 添加窗口大小变化监听
    window.addEventListener("resize", this.handleResize);
  },
  beforeDestroy() {
    // 移除窗口大小变化监听
    window.removeEventListener("resize", this.handleResize);
  },
  methods: {
    ...mapActions("theme", ["setCurrentTheme"]),
    addTabByUrl(url, tab_title, urlParams, type) {
      url = url || common_page_path[type] + "?data=" + urlParams;
      let page = {
        title: tab_title || "新标页签",
        url,
      };

      if (window.top.tab && window.top.tab.addTab) {
        window.top.tab.addTab(page);
      } else {
        let strWindowFeatures =
          "menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes";
        let newWindow = window.open(url, "CNN_WindowName", strWindowFeatures);
        newWindow.document.title = tab_title;
      }
    },
    navTo() {
      if (this.widgetJson?.jump_json?.jump_no) {
        // 使用配置的跳转事件
        const jumpJson = this.widgetJson.jump_json;
        if (jumpJson.obj_type === "内部页面" && this.pageNo) {
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
          window.open(
            location.href.replace(this.pageNo, jumpJson.dest_page_no)
          );
        }
      } else if (this.widgetJson?.nav_url) {
        this.addTabByUrl(this.widgetJson?.nav_url);
      } else if (this.widgetJson.button_cfg_json?.jump_json) {
        const jump_json = this.widgetJson.button_cfg_json.jump_json;
        if (jump_json.dest_page_no && this.pageNo) {
          window.open(
            location.href.replace(this.pageNo, jump_json.dest_page_no)
          );
        }
      }
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
      } else {
        this.exitFullScreen();
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
    handleResize() {
      if (!document.fullscreenElement) {
        this.isFullScreen = false;
      } else {
        this.isFullScreen = true;
      }
      this.$emit("resize");
    },

    // 处理主题变更
    handleThemeChange(value) {
      if (value && value !== this.currentTheme) {
        this.setCurrentTheme(value);

        // 应用主题变量到文档根元素
        // this.applyThemeVariables();

        // 触发主题变更事件，通知其他组件
        this.$emit("theme-change", value);
      }
    },

    // 应用主题变量到文档根元素
    applyThemeVariables() {
      if (this.themeVariable) {
        const root = document.documentElement;
        Object.entries(this.themeVariable).forEach(([key, value]) => {
          if (key.startsWith("--")) {
            root.style.setProperty(`${key}`, value);
          } else {
            root.style.setProperty(`--${key}`, value);
          }
        });
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.full-screen {
  cursor: pointer;
  font-size: 30px;
}

.text-btn {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.5s ease;
  background-color: #409eff;
  color: #fff;
  border-radius: 8px;
  min-height: 30px;

  &:active {
    transform: scale(1.1);
  }
}

.theme-select {
  width: 90px;
  color: var(--text-color, inherit); // 使用主题变量
  background-color: inherit; // 使用主题变量

  :deep(.el-input) {
    color: var(--text-color, inherit); // 使用主题变量
    background-color: inherit; // 使用主题变量

    .el-input__inner {
      border: none;
      background-color: transparent;
      color: var(--text-color, inherit); // 使用主题变量
      background-color: inherit; // 使用主题变量
      height: unset;
      line-height: inherit;
    }

    .el-input__icon {
      color: var(--text-color, inherit); // 使用主题变量
      line-height: inherit;
    }
  }
}
</style>
