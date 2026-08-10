<template>
  <ui-scaler
    :design-size="{ width: setStyle.width, height: setStyle.height }"
    :disabled="pageConfig && pageConfig.page_options && pageConfig.page_options.includes('不缩放')"
    :keep-original-size-classes="[
      `div[com_name*='环图'] canvas`,
      `div[com_name*='饼图'] canvas`,
      `div[com_name*='仪表盘'] canvas`,
      `div[com_name*='水球图'] canvas`
    ]"
  >
    <div
      class="page-wrap"
      :style="[setStyle, { '--content-width': contentAreaWidth }]"
    >
      <lc-view
        v-for="item in components"
        :key="item.com_no || item.id"
        v-bind="item"
        :content-width="contentAreaWidth"
        :query-options="queryOptions"
        :page-params-model="pageParamsModel"
        :page-no="pageNo"
        :page-config="pageConfig"
        :isPreview="true"
        :page-route="pageRoute"
        @executor-complete="$emit('executor-complete', $event)"
      ></lc-view>

      <!-- 浮动编辑按钮组件 -->
      <floating-edit-button />
    </div>
  </ui-scaler>
</template>

<script>
import lcView from "@/pages/lowcode/components/materials/view.vue";
import FloatingEditButton from "@/pages/lowcode/components/floating-edit-button.vue";
import UiScaler from "@/pages/lowcode/components/ui-scaler.vue";

import lowCodePageMixin from "../mixins/lowcode-page-mixin";
import pageParamsMixin from "../mixins/page-params-mixin";

export default {
  name: "lowCodeView",
  components: {
    lcView,
    FloatingEditButton,
    UiScaler,
  },
  mixins: [lowCodePageMixin, pageParamsMixin],
  props: {
    pageRoute: {
      type: Object,
      default: () => ({})
    }
  },
  watch: {
    // 核心：pageNo 变化时重新拉取 pageConfig（不缓存）。
    // 不清空 components / pageConfig：准备阶段旧页面保持原样，
    // mixin 的 loadPageConfig 会在新数据+首屏图片就绪后整帧替换，天然无闪烁。
    "$route.params.pageNo": {
      async handler(newNo, oldNo) {
        if (newNo && newNo !== oldNo) {
          await this.loadPageConfig(newNo);
          this.handleAnchor();
        }
      }
    },
    // 仅锚点变化时平滑滚动
    "$route.params.anchorName": {
      handler(newAnchor) {
        if (newAnchor) {
          this.handleAnchor();
        }
      }
    },
    // query 变化时同步更新 queryOptions（不重新加载 pageConfig）
    "$route.query": {
      deep: true,
      handler(newQuery) {
        const queryObj = { ...(newQuery || {}) };
        this.queryOptions = queryObj;
        this.urlSearchParams = { ...queryObj };
      }
    }
  },
  methods: {
    /**
     * 锚点跳转（切换完成后执行）
     */
    handleAnchor() {
      this.$nextTick(() => {
        const anchorName =
          this.$route.query?.anchorName || this.$route.params?.anchorName;
        if (anchorName) {
          const ele = document.getElementById(anchorName);
          if (ele) {
            ele.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      });
    }
  }
};
</script>

<style lang="scss">
.animate__animated {
  animation-delay: var(--animate-delay);
  animation-iteration-count: var(--animate-repeat);
}

// page-wrap 只保留必要定位；切换不做任何视觉过渡，靠整帧替换避免闪烁
.page-wrap {
  position: relative;
  min-height: 100%;
}

// 导航切换顶部进度条：挂在 body::after 上（body 不受 ui-scaler transform 影响）。
// 新配置/首屏图片未就绪期间淡入滑动，就绪后淡出；只做活动指示，不遮挡、不变淡内容。
body::after {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  z-index: 99999;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
  // 两层背景：滑动的亮段 + 常驻的半透明轨道（保证任何动画阶段都可见）
  background-image: linear-gradient(
      90deg,
      transparent 0%,
      var(--primary-color, #409eff) 35%,
      #fff 50%,
      var(--primary-color, #409eff) 65%,
      transparent 100%
    ),
    linear-gradient(
      rgba(255, 255, 255, 0.35),
      rgba(255, 255, 255, 0.35)
    );
  background-size: 50% 100%, 100% 100%;
  background-repeat: no-repeat;
  background-position: -50% 0, 0 0;
}

body.lc-page-switching::after {
  opacity: 1;
  transition: opacity 0.12s ease;
  animation: lc-nav-switch-slide 0.9s ease-in-out infinite;
}

@keyframes lc-nav-switch-slide {
  0% {
    background-position: -50% 0, 0 0;
  }
  100% {
    background-position: 150% 0, 0 0;
  }
}
</style>
