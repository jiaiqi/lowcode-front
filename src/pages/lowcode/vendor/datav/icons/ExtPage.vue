<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="_width"
    :height="_height"
    viewBox="0 0 48 48"
  >
    <!-- Icon from All by undefined - undefined -->
    <path
      fill="currentColor"
      d="M19 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6a2 2 0 0 0-2-2m0 14H5V8h14z"
    />
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
