<template>
  <svg xmlns="http://www.w3.org/2000/svg" 
    :width="_width" 
    :height="_height"
    :spin="spin"
    :rtl="rtl"
    viewBox="0 0 48 48"
    preserveAspectRatio="xMidYMid meet"
    fill="none"
    role="presentation"
    ref="host"
  >
    <g><path data-follow-stroke="currentColor" clip-rule="evenodd" d="M5 10a2 2 0 0 1 2-2h34a2 2 0 0 1 2 2v28a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V10Z" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" :stroke="_stroke"/><path data-follow-stroke="currentColor" clip-rule="evenodd" d="M14.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" :stroke="_stroke"/><path data-follow-stroke="currentColor" data-follow-fill="currentColor" d="m15 24 5 4 6-7 17 13v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-4l10-10Z" stroke-width="4" stroke-linejoin="round" :fill="_fill" :stroke="_stroke"/></g>
  </svg>
</template>

<script>
// @ts-nocheck
import Vue from 'vue'
const Pic = {
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
  mounted: function() {
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
export default /*#__PURE__*/Vue.extend(Pic)
</script>

<style scoped>
svg[spin] {animation: iconpark-spin 1s infinite linear;}
svg[spin][rtl] {animation: iconpark-spin-rtl 1s infinite linear;}
svg[rtl] {
  transform: scaleX(-1);
}
@keyframes iconpark-spin {
  0% { -webkit-transform: rotate(0); transform: rotate(0);} 100% {-webkit-transform: rotate(360deg); transform: rotate(360deg);}
}
@keyframes iconpark-spin-rtl {
  0% {-webkit-transform: scaleX(-1) rotate(0); transform: scaleX(-1) rotate(0);} 100% {-webkit-transform: scaleX(-1) rotate(360deg); transform: scaleX(-1) rotate(360deg);}
}
</style>
