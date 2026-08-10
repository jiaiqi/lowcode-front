<template>
  <div class="com-label" v-if="showLabel">
    <div
      class="com-label__text"
      :style="[
        titleStyle,
        {
          flexDirection: titleIcon === '下划线' ? 'column' : 'row',
        },
      ]"
    >
      <template v-if="titleIcon && titleIcon !== '无'">
        <span :style="[titleIconStyle]">
          <span class="icon1" v-if="titleIcon === '竖线'"></span>
          <span class="icon2" v-else-if="titleIcon === '圆形'"></span>
          <span class="icon3" v-else-if="titleIcon === '方块'"></span>
          <span
            class="i-ri-arrow-drop-right-fill"
            v-else-if="titleIcon === '三角形'"
          ></span>
          <Icon
            :icon="titleIcon"
            v-else-if="titleIcon && titleIcon !== '下划线'"
          ></Icon>
        </span>
      </template>
      <span class="com-label__title">{{ label }}</span>
      <span v-if="titleIcon === '下划线'" class="under-line"></span>
    </div>
    <div
      class="more-btn"
      v-if="showMoreBtn && morePosition !== '数据项后'"
      :style="moreStyle"
      @click="toMore"
    >
      <span>
        {{ moreLabel || "更多" }}
      </span>
      <i class="el-icon-arrow-right"></i>
    </div>
  </div>
</template>

<script>
import { Icon } from "@iconify/vue2";
import { formatStyleData } from "@/pages/lowcode/vendor/datav/common/index.js";

export default {
  name: "ComLabel",
  components: {
    Icon,
  },
  props: {
    label: {
      type: String,
      default: "",
    },
    showLabel: {
      type: [Boolean, String],
      default: false,
    },
    titleStyleJson: {
      type: [Object, String],
      default: () => ({}),
    },
    titleIconStyleJson: {
      type: [Object, String],
      default: () => ({}),
    },
    icon: {
      type: String,
      default: "",
    },
    showMoreBtn: {
      type: Boolean,
      default: false,
    },
    moreLabel: {
      type: String,
      default: "更多",
    },
    morePosition: {
      type: String,
      default: "",
    },
    pageItem: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    moreStyle() {
      let style = {};
      if (this.pageItem?.more_style_json) {
        if (typeof this.pageItem?.more_style_json === "string") {
          try {
            style = JSON.parse(this.pageItem?.more_style_json);
          } catch (e) {
            style = {};
          }
        } else {
        }
      }
      return formatStyleData(style);
    },
    titleStyle() {
      let style = { ...this.titleStyleJson };
      return formatStyleData(style);
    },
    titleIconStyle() {
      let style = {};
      if (this.titleIconStyleJson) {
        if (typeof this.titleIconStyleJson === "string") {
          try {
            style = JSON.parse(this.titleIconStyleJson);
          } catch (e) {
            style = {};
          }
        } else {
          style = { ...this.titleIconStyleJson };
        }
      }
      return formatStyleData(style);
    },
    titleIcon() {
      return this.icon;
    },
  },
  methods: {
    toMore() {
      const { more_jump_json: jumpJson } = this.pageItem || {};
      if (jumpJson?.obj_type === "内部页面") {
        let pageNo = jumpJson?.dest_page_no;
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
              this.$router.push({
                path: "/login",
                query: { redirect: this.$route.fullPath },
              });
            });
            return;
          }
        }
        if (pageNo) {
          this.$router.push({ path: `/${pageNo}` });
        }
      } else if (jumpJson?.obj_type === "外部链接") {
        let url = jumpJson?.dest_url;
        if (url) {
          window.open(url, "_blank");
        }
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.com-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: fit-content;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  .more-btn {
    cursor: pointer;
    display: flex;
    align-items: center;
    &:hover {
      color: var(--primary-color, #409eff);
    }
  }

  .com-label__text {
    display: flex;
    position: relative;
    align-items: center;
    flex: 1;

    .icon1 {
      left: 0;
      width: 4px;
      height: 50%;
      position: absolute;
      top: 25%;
      border-radius: 2px;
      background: currentColor;
    }

    .icon2 {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      position: absolute;
      background: currentColor;
      left: 0;
      top: 25%;
    }

    .icon3 {
      width: 8px;
      height: 8px;
      border-radius: 2px;
      position: absolute;
      background: currentColor;
      left: 0;
      top: 25%;
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
    }
  }
}
</style>
