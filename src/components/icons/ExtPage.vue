<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="_width"
    :height="_height"
    viewBox="0 0 48 48"
  >
    <!-- Icon from IconPark Solid by ByteDance - https://github.com/bytedance/IconPark/blob/master/LICENSE -->
    <defs>
      <mask id="ipSWebPage0">
        <g fill="none">
          <rect
            width="40"
            height="32"
            x="4"
            y="8"
            stroke="#fff"
            stroke-linejoin="round"
            stroke-width="4"
            rx="3"
          />
          <path
            fill="#fff"
            stroke="#fff"
            stroke-width="4"
            d="M4 11a3 3 0 0 1 3-3h34a3 3 0 0 1 3 3v9H4z"
          />
          <circle r="2" fill="#000" transform="matrix(0 -1 -1 0 10 14)" />
          <circle r="2" fill="#000" transform="matrix(0 -1 -1 0 16 14)" />
        </g>
      </mask>
    </defs>
    <path fill="currentColor" d="M0 0h48v48H0z" mask="url(#ipSWebPage0)" />
  </svg>
</template>

<script>
// @ts-nocheck
import Vue from "vue";
const ExtPage = {
  props: {
    size: {
      type: [Number, String],
      default: "1em",
    },
    width: {
      type: [Number, String],
    },
    height: {
      type: [Number, String],
    },
    color: {
      type: String,
    },
    fill: {
      type: String,
    },
    stroke: {
      type: String,
    },
    spin: {
      type: Boolean,
      default: false,
    },
    rtl: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    _width() {
      return this.width || this.size;
    },
    _height() {
      return this.height || this.size;
    },
    _stroke() {
      return this.stroke || this.color;
    },
    _fill() {
      return this.fill || this.color;
    },
  },
  mounted: function () {
    // @ts-ignore
    if (!this._fill) {
      // @ts-ignore
      this.$refs.host
        ?.querySelectorAll("[data-follow-fill]")
        .forEach((item) => {
          item.setAttribute(
            "fill",
            item.getAttribute("data-follow-fill") || ""
          );
        });
    }
    // @ts-ignore
    if (!this._stroke) {
      // @ts-ignore
      this.$refs.host
        ?.querySelectorAll("[data-follow-stroke]")
        .forEach((item) => {
          item.setAttribute(
            "stroke",
            item.getAttribute("data-follow-stroke") || ""
          );
        });
    }
  },
  updated() {
    // @ts-ignore
    if (!this._fill) {
      // @ts-ignore
      this.$refs.host
        ?.querySelectorAll("[data-follow-fill]")
        .forEach((item) => {
          item.setAttribute(
            "fill",
            item.getAttribute("data-follow-fill") || ""
          );
        });
    }
    // @ts-ignore
    if (!this._stroke) {
      // @ts-ignore
      this.$refs.host
        ?.querySelectorAll("[data-follow-stroke]")
        .forEach((item) => {
          item.setAttribute(
            "stroke",
            item.getAttribute("data-follow-stroke") || ""
          );
        });
    }
  },
};
export default /*#__PURE__*/ Vue.extend(ExtPage);
</script>

<style scoped>
svg[spin] {
  animation: iconpark-spin 1s infinite linear;
}
svg[spin][rtl] {
  animation: iconpark-spin-rtl 1s infinite linear;
}
svg[rtl] {
  transform: scaleX(-1);
}
@keyframes iconpark-spin {
  0% {
    -webkit-transform: rotate(0);
    transform: rotate(0);
  }
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
@keyframes iconpark-spin-rtl {
  0% {
    -webkit-transform: scaleX(-1) rotate(0);
    transform: scaleX(-1) rotate(0);
  }
  100% {
    -webkit-transform: scaleX(-1) rotate(360deg);
    transform: scaleX(-1) rotate(360deg);
  }
}
</style>
