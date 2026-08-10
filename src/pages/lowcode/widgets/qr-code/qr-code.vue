<template>
  <div class="qr-code-container">
    <!-- 使用div渲染二维码 -->
    <div 
      class="qr-wrapper"
      :style="{ width: size + 'px', height: size + 'px' }"
    >
      <!-- 绘制中, loading状态 -->
      <div class="qr-loading" v-if="loading">
        <div class="loading-text">生成中...</div>
      </div>
      
      <!-- 二维码内容 -->
      <div v-else class="qr-content">
        <div
          v-for="(row, rowI) in modules"
          :key="rowI"
          class="qr-row"
        >
          <div 
            v-for="(col, colI) in row" 
            :key="colI"
            class="qr-module"
            :style="{
              width: moduleSize + 'px',
              height: moduleSize + 'px',
              backgroundColor: col.isBlack ? color : background,
            }"
          >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import UQRCode from './uqrcode_latest.js'

export default {
  name: 'QrCode',
  data() {
    return {
      modules: [], // 二维码数据
      loading: true, // 绘制状态
      moduleSize: 1 // 每个模块的大小
    }
  },
  props: {
    // 二维码内容
    text: {
      type: String,
      required: true,
      default: ''
    },
    // 二维码大小
    size: {
      type: Number,
      default: 200
    },
    // 二维码颜色
    color: {
      type: String,
      default: '#000000'
    },
    // 二维码背景色
    background: {
      type: String,
      default: '#ffffff'
    }
  },
  
  mounted() {
    this.generateQRCode()
  },
  watch: {
    text() {
      this.generateQRCode()
    },
    size() {
      this.generateQRCode()
    },
    color() {
      this.generateQRCode()
    },
    background() {
      this.generateQRCode()
    }
  },

  methods: {
    // 使用UQRCode库生成二维码
    generateQRCode() {
      if (!this.text) return
      
      this.loading = true
      
      try {
        const qr = new UQRCode()
        qr.data = this.text
        qr.size = this.size
        qr.make()
        
        this.modules = qr.modules
        this.moduleSize = this.size / this.modules.length
      } catch (error) {
        console.error('生成二维码失败:', error)
      } finally {
        this.loading = false
      }
    },
  }
}
</script>

<style scoped>
.qr-code-container {
  display: inline-block;
}

.qr-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
}

.qr-content {
  display: flex;
  flex-direction: column;
}

.qr-row {
  display: flex;
}

.qr-module {
  flex-shrink: 0;
}

.qr-loading {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-text {
  color: #666;
  font-size: 14px;
}
</style>
