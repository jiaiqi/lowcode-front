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
    <g><rect data-follow-stroke="currentColor" data-follow-fill="currentColor" x="6" y="6" width="36" height="36" rx="3" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" :fill="_fill" :stroke="_stroke"/><path d="M18.5 24v-7.794l6.75 3.897L32 24l-6.75 3.897-6.75 3.897V24Z" fill="#FFF" stroke="#FFF" stroke-width="4" stroke-linejoin="round"/></g>
  </svg>
</template>

<script>
// @ts-nocheck
import Vue from 'vue'
const Video = {
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
export default /*#__PURE__*/Vue.extend(Video)
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
