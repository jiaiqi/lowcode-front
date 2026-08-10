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
    <g><path data-follow-stroke="currentColor" data-follow-fill="currentColor" d="M24 6v36c-7 0-12.201-9.16-12.201-9.16H6a2 2 0 0 1-2-2V17.01a2 2 0 0 1 2-2h5.799S17 6 24 6Z" stroke-width="4" stroke-linejoin="round" :fill="_fill" :stroke="_stroke"/><path data-follow-stroke="currentColor" d="M32 15h0a11.91 11.91 0 0 1 1.684 1.859A12.07 12.07 0 0 1 36 24c0 2.654-.846 5.107-2.278 7.09A11.936 11.936 0 0 1 32 33" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" :stroke="_stroke"/><path data-follow-stroke="currentColor" d="M34.236 41.186C40.084 37.696 44 31.305 44 24c0-7.192-3.796-13.496-9.493-17.02" stroke-width="4" stroke-linecap="round" :stroke="_stroke"/></g>
  </svg>
</template>

<script>
// @ts-nocheck
import Vue from 'vue'
const Notice = {
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
export default /*#__PURE__*/Vue.extend(Notice)
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
