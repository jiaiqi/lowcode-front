<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="_width"
    :height="_height"
    viewBox="0 0 24 24"
  >
    <!-- Icon from TDesign Icons by TDesign - https://github.com/Tencent/tdesign-icons/blob/main/LICENSE -->
    <path
      fill="currentColor"
      fill-rule="evenodd"
      d="M2 2h20v7H2zm0 9h9v11H2zm20 0h-9v11h9z"
      clip-rule="evenodd"
    />
  </svg>
  <!-- <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
  >
    <g fill="none">
      <path
        d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"
      />
      <path
        fill="currentColor"
        d="M9 10v11H5a2 2 0 0 1-1.995-1.85L3 19v-9zm12 0v9a2 2 0 0 1-1.85 1.995L19 21h-8V10zm-2-7a2 2 0 0 1 2 2v3H3V5a2 2 0 0 1 2-2z"
      />
    </g>
  </svg> -->
</template>

<script>
// @ts-nocheck
import Vue from "vue";
const Card = {
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
export default /*#__PURE__*/ Vue.extend(Card);
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
