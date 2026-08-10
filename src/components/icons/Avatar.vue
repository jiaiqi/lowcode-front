<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="_width"
    :height="_height"
    viewBox="0 0 30 30"
  >
    <!-- Icon from Carbon by IBM - undefined -->
    <path
      fill="none"
      d="M8.007 24.93A4.996 4.996 0 0 1 13 20h6a4.996 4.996 0 0 1 4.993 4.93a11.94 11.94 0 0 1-15.986 0M20.5 12.5A4.5 4.5 0 1 1 16 8a4.5 4.5 0 0 1 4.5 4.5"
    />
    <path
      fill="currentColor"
      d="M26.749 24.93A13.99 13.99 0 1 0 2 16a13.9 13.9 0 0 0 3.251 8.93l-.02.017c.07.084.15.156.222.239c.09.103.187.2.28.3q.418.457.87.87q.14.124.28.242q.48.415.99.782c.044.03.084.069.128.1v-.012a13.9 13.9 0 0 0 16 0v.012c.044-.031.083-.07.128-.1q.51-.368.99-.782q.14-.119.28-.242q.451-.413.87-.87c.093-.1.189-.197.28-.3c.071-.083.152-.155.222-.24ZM16 8a4.5 4.5 0 1 1-4.5 4.5A4.5 4.5 0 0 1 16 8M8.007 24.93A4.996 4.996 0 0 1 13 20h6a4.996 4.996 0 0 1 4.993 4.93a11.94 11.94 0 0 1-15.986 0"
    />
  </svg>
</template>

<script>
// @ts-nocheck
import Vue from "vue";
const Avatar = {
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
export default /*#__PURE__*/ Vue.extend(Avatar);
</script>

<style lang="scss" scoped></style>
