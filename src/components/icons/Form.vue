<template>
  <svg xmlns="http://www.w3.org/2000/svg" :width="_width" :height="_height" :spin="spin" :rtl="rtl" viewBox="0 0 48 48"
    preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" ref="host">
    <rect x="8" y="4" width="32" height="40" rx="2"  fill="currentColor" stroke="currentColor"  stroke-width="4" stroke-linejoin="round" />
    <path d="M21 14H33" stroke="#FFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M21 24H33" stroke="#FFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M21 34H33" stroke="#FFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    <path fill-rule="evenodd" clip-rule="evenodd"
      d="M15 16C16.1046 16 17 15.1046 17 14C17 12.8954 16.1046 12 15 12C13.8954 12 13 12.8954 13 14C13 15.1046 13.8954 16 15 16Z"
      fill="#FFF" />
    <path fill-rule="evenodd" clip-rule="evenodd"
      d="M15 26C16.1046 26 17 25.1046 17 24C17 22.8954 16.1046 22 15 22C13.8954 22 13 22.8954 13 24C13 25.1046 13.8954 26 15 26Z"
      fill="#FFF" />
    <path fill-rule="evenodd" clip-rule="evenodd"
      d="M15 36C16.1046 36 17 35.1046 17 34C17 32.8954 16.1046 32 15 32C13.8954 32 13 32.8954 13 34C13 35.1046 13.8954 36 15 36Z"
      fill="#FFF" />
  </svg>
</template>

<script>
// @ts-nocheck
import Vue from 'vue'
const Card = {
  props: {
    size: {
      type: [Number, String],
      default: '1em'
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
      return this.width || this.size
    },
    _height() {
      return this.height || this.size
    },
    _stroke() {
      return this.stroke || this.color
    },
    _fill() {
      return this.fill || this.color
    },
  },
  mounted: function () {
    // @ts-ignore
    if (!this._fill) {
      // @ts-ignore
      this.$refs.host?.querySelectorAll('[data-follow-fill]').forEach(item => {
        item.setAttribute('fill', item.getAttribute('data-follow-fill') || '')
      })
    }
    // @ts-ignore
    if (!this._stroke) {
      // @ts-ignore
      this.$refs.host?.querySelectorAll('[data-follow-stroke]').forEach(item => {
        item.setAttribute('stroke', item.getAttribute('data-follow-stroke') || '')
      })
    }
  },
  updated() {
    // @ts-ignore
    if (!this._fill) {
      // @ts-ignore
      this.$refs.host?.querySelectorAll('[data-follow-fill]').forEach(item => {
        item.setAttribute('fill', item.getAttribute('data-follow-fill') || '')
      })
    }
    // @ts-ignore
    if (!this._stroke) {
      // @ts-ignore
      this.$refs.host?.querySelectorAll('[data-follow-stroke]').forEach(item => {
        item.setAttribute('stroke', item.getAttribute('data-follow-stroke') || '')
      })
    }
  },
};
export default /*#__PURE__*/Vue.extend(Card)
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
