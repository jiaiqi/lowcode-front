<template>
  <div class="get-page-address">
    <!-- 主要内容区域 - 左右布局 -->
    <div class="main-content">
      <!-- 左侧设备区域 -->
      <div class="left-panel">
        <!-- 手机外壳容器 -->
        <div
          class="phone-container"
          :class="{ 'fullscreen': isFullscreen }"
        >
          <div
            class="exist-fullscreen"
            @click="toggleFullscreen"
          >
            <i class="el-icon-close"></i>
          </div>
          <div class="phone-shell">
            <!-- 手机屏幕区域 -->
            <div class="phone-screen">
              <!-- 状态栏 -->
              <div class="status-bar">
                <div class="status-left">
                  <span class="time">{{ currentTime }}</span>
                </div>
                <div class="status-center">
                  <div class="camera-area">
                    <div class="camera-lens">
                      <div class="camera-outer-ring"></div>
                      <div class="camera-inner-lens"></div>
                      <div class="camera-highlight"></div>
                    </div>
                    <div class="camera-lens">
                      <div class="camera-outer-ring"></div>
                      <div class="camera-inner-lens"></div>
                      <div class="camera-highlight"></div>
                    </div>
                  </div>
                </div>
                <div class="status-right">
                  <span class="wifi">📶</span>
                  <span class="battery">🔋 {{ batteryLevel }}%</span>
                </div>
              </div>
              <!-- iframe内容区域 -->
              <div
                class="screen-content"
                v-if="currentUrl"
              >
                <iframe
                  ref="pageIframe"
                  :src="currentUrl"
                  frameborder="0"
                  @load="onIframeLoad"
                ></iframe>
                <div
                  v-if="isLoading"
                  class="loading-overlay"
                >
                  <div class="loading-spinner"></div>
                  <p>页面加载中...</p>
                </div>
              </div>
            </div>
            <!-- 侧边按钮 -->
            <!-- <div class="side-buttons">
              <div class="power-button"></div>
              <div class="volume-buttons">
                <div class="volume-up"></div>
                <div class="volume-down"></div>
              </div>
            </div> -->
          </div>
        </div>
      </div>

      <!-- 右侧内容区域 -->
      <div
        class="right-panel"
        v-if="!($route.query.url && $route.query.fullscreen === 'true')"
      >
        <!-- URL输入区域 -->
        <div
          class="url-input-section"
          v-if="showUrlInput"
        >
          <el-card shadow="hover">
            <div
              slot="header"
              class="card-header"
            >
              <span>输入页面地址</span>
              <div
                class="header-actions"
                v-if="currentUrl"
              >
                <el-button
                  size="mini"
                  @click="refreshIframe"
                >刷新页面</el-button>
              </div>
            </div>
            <div class="input-group">
              <el-input
                v-model="inputUrl"
                placeholder="请输入要监听的H5页面地址"
                clearable
                @keyup.enter.native="loadUrl"
              >
                <template slot="prepend">URL</template>
              </el-input>
              <el-button
                type="primary"
                @click="loadUrl"
                :disabled="!inputUrl.trim()"
              >
                加载页面
              </el-button>
            </div>
          </el-card>
        </div>

        <!-- 当通过路由参数加载时显示的信息区域 -->
        <div
          class="route-url-info"
          v-if="!showUrlInput && currentUrl"
        >
          <el-card shadow="hover">
            <div
              slot="header"
              class="card-header"
            >
              <span>当前加载的页面</span>
              <div class="header-actions">
                <el-button
                  size="mini"
                  @click="refreshIframe"
                >刷新页面</el-button>
              </div>
            </div>
            <div class="route-url-display">
              <el-input
                :value="currentUrl"
                readonly
                type="textarea"
                :rows="2"
                resize="none"
              ></el-input>
            </div>
          </el-card>
        </div>

        <!-- URL展示和复制区域 -->
        <div
          class="url-display-section"
          v-if="detectedUrl"
        >
          <el-card shadow="hover">
            <div
              slot="header"
              class="card-header"
            >
              <span>检测到的页面地址</span>
              <div class="header-actions">
                <el-tag
                  :type="urlChangeCount > 0 ? 'success' : 'info'"
                  size="mini"
                >
                  变化次数: {{ urlChangeCount }}
                </el-tag>
              </div>
            </div>

            <!-- 当前URL显示 -->
            <div class="url-item">
              <label>当前URL:</label>
              <div class="url-content">
                <el-input
                  v-model="detectedUrl"
                  readonly
                  type="textarea"
                  :rows="2"
                  resize="none"
                ></el-input>
                <div class="copy-buttons">
                  <el-button
                    size="mini"
                    type="primary"
                    @click="copyFullUrl()"
                  >
                    <i class="el-icon-copy-document"></i>
                    复制完整H5地址
                  </el-button>
                  <el-button
                    size="mini"
                    type="info"
                    @click="copySimpleUrl()"
                  >
                    <i class="el-icon-copy-document"></i>
                    复制简化H5地址
                  </el-button>
                  <el-button
                    size="mini"
                    type="success"
                    @click="copyUrl('miniprogram')"
                  >
                    <i class="el-icon-copy-document"></i>
                    复制小程序地址
                  </el-button>
                </div>
              </div>
            </div>

            <!-- URL历史记录 -->
            <div
              class="url-history"
              v-if="urlHistory.length > 1"
            >
              <el-divider content-position="left">URL变化历史</el-divider>
              <div class="history-list">
                <div
                  v-for="(historyItem, index) in urlHistory.slice().reverse()"
                  :key="index"
                  class="history-item"
                >
                  <div class="history-info">
                    <span class="history-time">{{ historyItem.time }}</span>
                    <span class="history-url">{{ historyItem.url }}</span>
                  </div>
                  <div class="history-actions">
                    <el-button
                      size="mini"
                      type="primary"
                      @click="copyHistoryFullUrl(historyItem.url)"
                    >
                      完整地址
                    </el-button>
                    <el-button
                      size="mini"
                      type="info"
                      @click="copyHistorySimpleUrl(historyItem.url)"
                    >
                      简化地址
                    </el-button>
                    <el-button
                      size="mini"
                      type="success"
                      @click="copyHistoryUrl(historyItem.url, 'miniprogram')"
                    >
                      小程序
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 使用说明 -->
        <div class="help-section">
          <el-card shadow="hover">
            <div
              slot="header"
              class="card-header"
            >
              <span>使用说明</span>
            </div>
            <div class="help-content">
              <ol>
                <li v-if="showUrlInput">在上方输入框中输入要监听的H5页面地址</li>
                <li v-if="showUrlInput">点击"加载页面"按钮，页面将在左侧手机设备中显示</li>
                <!-- <li>页面将在左侧手机设备中以453×912尺寸显示</li> -->
                <li>当iframe内的页面URL发生变化时，会自动检测并显示新的地址</li>
                <li>可以复制H5地址或转换为小程序地址格式</li>
                <li>支持查看URL变化历史记录</li>
              </ol>
              <el-alert
                title="注意事项"
                type="warning"
                :closable="false"
                show-icon
              >
                <p>由于浏览器同源策略限制，某些网站可能无法在iframe中正常显示或监听URL变化。</p>
              </el-alert>
            </div>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GetPageAddress',
  data() {
    return {
      inputUrl: '',
      currentUrl: '',
      detectedUrl: '',
      urlHistory: [],
      urlChangeCount: 0,
      isLoading: false,
      isFullscreen: false,
      messageListener: null,
      // 手机外壳相关数据
      currentTime: '',
      batteryLevel: 85,
      timeInterval: null
    }
  },
  computed: {
    // 判断是否显示URL输入框
    showUrlInput() {
      return !this.$route.query.url
    },
    // 判断是否应该自动全屏
    shouldAutoFullscreen() {
      return this.$route.query.url && this.$route.query.fullscreen === 'true'
    }
  },
  mounted() {
    // 检查路由参数中是否有URL
    if (this.$route.query.url) {
      this.inputUrl = this.$route.query.url
      this.loadUrlFromRoute(this.$route.query.url)
    }
    // // 检查是否需要自动全屏
    // if (this.shouldAutoFullscreen) {
    //   this.isFullscreen = true
    // }
    this.setupMessageListener()
    this.updateTime()
    this.timeInterval = setInterval(this.updateTime, 1000)
  },
  beforeDestroy() {
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener)
    }
    if (this.timeInterval) {
      clearInterval(this.timeInterval)
    }
  },
  methods: {
    // 设置消息监听器
    setupMessageListener() {
      this.messageListener = (event) => {
        // 验证消息来源
        if (event.data && event.data.type === 'urlChange') {
          this.handleUrlChange(event.data.url)
        }
      }
      window.addEventListener('message', this.messageListener)
    },

    // 从路由参数加载URL
    loadUrlFromRoute(routeUrl) {
      let url = routeUrl.trim()
      // 如果没有协议，默认添加当前协议+ip
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = window.location.origin + url
      }

      this.currentUrl = url
      this.detectedUrl = url
      this.isLoading = true

      // 添加到历史记录
      this.addToHistory(url)

      this.$message.success('页面加载中...')
    },

    // 加载URL
    loadUrl() {
      if (!this.inputUrl.trim()) {
        this.$message.warning('请输入有效的URL地址')
        return
      }

      let url = this.inputUrl.trim()
      // 如果没有协议，默认添加https
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'http://' + url
      }

      this.currentUrl = url
      this.detectedUrl = url
      this.isLoading = true

      // 添加到历史记录
      this.addToHistory(url)

      this.$message.success('页面加载中...')
    },

    // iframe加载完成
    onIframeLoad() {
      this.isLoading = false
      this.$message.success('页面加载完成')

      // 尝试注入监听脚本（如果同源的话）
      this.injectUrlMonitor()
    },

    // 注入URL监听脚本
    injectUrlMonitor() {
      try {
        const iframe = this.$refs.pageIframe
        if (iframe && iframe.contentWindow) {
          const script = `
            (function() {
              let lastUrl = location.href;
              const checkUrlChange = () => {
                if (location.href !== lastUrl) {
                  lastUrl = location.href;
                  window.parent.postMessage({
                    type: 'urlChange',
                    url: location.href
                  }, '*');
                }
              };
              
              // 监听pushState和replaceState
              const originalPushState = history.pushState;
              const originalReplaceState = history.replaceState;
              
              history.pushState = function() {
                originalPushState.apply(history, arguments);
                setTimeout(checkUrlChange, 0);
              };
              
              history.replaceState = function() {
                originalReplaceState.apply(history, arguments);
                setTimeout(checkUrlChange, 0);
              };
              
              // 监听popstate事件
              window.addEventListener('popstate', checkUrlChange);
              
              // 定期检查URL变化
              const monitorInterval = setInterval(checkUrlChange, 1000);
              
              // 尽力而为的清理：iframe 导航离开/被移除（src 变化、v-if 卸载、组件销毁）时，
              // 浏览器会随文档回收一并销毁其中的定时器与监听；pagehide 用于提前显式清理。
              window.addEventListener('pagehide', function() {
                clearInterval(monitorInterval);
                window.removeEventListener('popstate', checkUrlChange);
              });
            })();
          `

          iframe.contentWindow.eval(script)
        }
      } catch (error) {
        console.warn('无法注入URL监听脚本，可能是跨域限制:', error)
      }
    },

    // 处理URL变化
    handleUrlChange(newUrl) {
      if (newUrl && newUrl !== this.detectedUrl) {
        this.detectedUrl = newUrl
        this.urlChangeCount++
        this.addToHistory(newUrl)
        this.$message.info(`检测到URL变化: ${newUrl}`)
      }
    },

    // 添加到历史记录
    addToHistory(url) {
      const now = new Date()
      const timeStr = now.toLocaleString()

      // 避免重复添加相同的URL
      if (this.urlHistory.length === 0 || this.urlHistory[this.urlHistory.length - 1].url !== url) {
        this.urlHistory.push({
          url: url,
          time: timeStr
        })

        // 限制历史记录数量
        if (this.urlHistory.length > 20) {
          this.urlHistory.shift()
        }
      }
    },

    // 复制完整H5地址
    copyFullUrl() {
      this.copyToClipboard(this.detectedUrl, 'h5-full')
    },

    // 复制简化H5地址
    copySimpleUrl() {
      this.copyToClipboard(this.detectedUrl, 'h5-simple')
    },

    // 复制小程序地址
    copyUrl(type) {
      this.copyToClipboard(this.detectedUrl, type)
    },

    // 复制历史记录完整地址
    copyHistoryFullUrl(url) {
      this.copyToClipboard(url, 'h5-full')
    },

    // 复制历史记录简化地址
    copyHistorySimpleUrl(url) {
      this.copyToClipboard(url, 'h5-simple')
    },

    // 复制历史URL
    copyHistoryUrl(url, type) {
      this.copyToClipboard(url, type)
    },

    // 复制到剪贴板
    copyToClipboard(url, type) {
      let copyText = url

      if (type === 'miniprogram') {
        // 转换为小程序地址格式（这里可以根据实际需求调整格式）
        if (url.indexOf('xmp') !== -1) {
          copyText = url.split('xmp')[1]
        } else {
          return this.$message.error('当前页面没有对应的小程序页面')
        }
      } else if (type === 'h5-full') {
        // 完整H5地址，保持原样
        copyText = url
      } else if (type === 'h5-simple') {
        // 简化H5地址，去掉协议部分
        copyText = url.replace(window.location.origin, '')
      }

      // 创建临时文本域
      const textArea = document.createElement('textarea')
      textArea.value = copyText
      document.body.appendChild(textArea)
      textArea.select()

      try {
        document.execCommand('copy')
        let message = ''
        if (type === 'h5-full') {
          message = '完整H5地址已复制到剪贴板'
        } else if (type === 'h5-simple') {
          message = '简化H5地址已复制到剪贴板'
        } else if (type === 'miniprogram') {
          message = '小程序地址已复制到剪贴板'
        } else {
          message = 'H5地址已复制到剪贴板'
        }
        this.$message.success(message)
      } catch (err) {
        this.$message.error('复制失败，请手动复制')
      }

      document.body.removeChild(textArea)
    },

    // 刷新iframe
    refreshIframe() {
      if (this.$refs.pageIframe) {
        this.isLoading = true
        this.$refs.pageIframe.src = this.currentUrl
      }
    },

    // 切换全屏
    toggleFullscreen() {
      this.isFullscreen = !this.isFullscreen
    },

    // 更新时间
    updateTime() {
      const now = new Date()
      this.currentTime = now.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })

      // 模拟电池电量变化
      if (Math.random() < 0.01) { // 1%的概率变化
        this.batteryLevel = Math.max(20, Math.min(100, this.batteryLevel + (Math.random() > 0.5 ? 1 : -1)))
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.get-page-address {
  padding: 10px;
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  .page-header {
    text-align: center;
    margin-bottom: 10px;

    h2 {
      color: #303133;
      margin-bottom: 10px;
    }

    .description {
      color: #606266;
      font-size: 14px;
    }
  }

  // 主要内容区域 - 左右布局
  .main-content {
    display: flex;
    gap: 20px;
    padding: 20px;
    align-items: center;
    height: 100%;
    ::v-deep .el-card__header {
      padding: 0;
    }

    ::v-deep .el-card__body {
      padding: 5px 15px;
    }

    // 左侧面板 - 设备区域
    .left-panel {
      // flex: 0 0 500px;

      .device-controls {
        .control-group {
          .device-info {
            display: flex;
            justify-content: space-between;
            align-items: center;

            span {
              color: #606266;
              font-size: 14px;
            }
          }
        }
      }
    }

    // 右侧面板 - 内容区域
    .right-panel {
      flex: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 10px;
      .url-input-section {
        margin-bottom: 10px;

        .input-group {
          display: flex;
          gap: 10px;

          .el-input {
            flex: 1;
          }
        }
      }
    }
  }

  // 手机外壳容器样式调整
  .left-panel .phone-container {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0px;
    min-height: 600px;
    position: relative;
    width: fit-content;

    .exist-fullscreen {
      display: none;
    }

    // // 钛合金边框效果
    // &::before {
    //   content: '';
    //   position: absolute;
    //   top: -3px;
    //   left: -3px;
    //   right: -3px;
    //   bottom: -3px;
    //   border-radius: 33px;
    //   background: linear-gradient(135deg,
    //       #8a8a8a 0%,
    //       #b8b8b8 25%,
    //       #d4d4d4 50%,
    //       #b8b8b8 75%,
    //       #8a8a8a 100%);
    //   z-index: -1;
    //   box-shadow:
    //     0 0 20px rgba(0, 0, 0, 0.4),
    //     inset 0 1px 2px rgba(255, 255, 255, 0.3),
    //     inset 0 -1px 2px rgba(0, 0, 0, 0.2);
    // }

    // 内层边框高光
    &::after {
      content: '';
      position: absolute;
      top: -1px;
      left: -1px;
      right: -1px;
      bottom: -1px;
      border-radius: 31px;
      background: linear-gradient(135deg,
          rgba(255, 255, 255, 0.4) 0%,
          rgba(255, 255, 255, 0.1) 25%,
          rgba(255, 255, 255, 0.05) 50%,
          rgba(255, 255, 255, 0.1) 75%,
          rgba(255, 255, 255, 0.3) 100%);
      z-index: -1;
      box-shadow:
        inset 0 1px 1px rgba(255, 255, 255, 0.5),
        inset 0 -1px 1px rgba(0, 0, 0, 0.3);
    }

    &.fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 9999;
      background: #f5f5f5;
      padding: 20px;

      .exist-fullscreen {
        display: inline-block;
        position: absolute;
        top: 50px;
        right: 50px;
        background-color: #666;
        width: 40px;
        height: 40px;
        line-height: 40px;
        text-align: center;
        color: #eee;
        border-radius: 50%;
        cursor: pointer;

        &:hover {
          background-color: #888;
          color: #fff;
          scale: 1.1;
          font-size: 24px;
        }
      }
    }


  }

  // 手机外壳主体
  .phone-shell {
    position: relative;
    // width: 362.4px;
    // height: 729.6px;
    width: 375px;
    height: 707px; // 667 + 40px边框
    // width: 407.7px;
    // height: 828.8px;
    // width: 453px;
    // height: 912px; 
    // width: 473px; // 453 + 20px边框
    // height: 952px; // 912 + 40px边框
    border-radius: 30px;
    box-shadow:
      0 20px 40px rgba(0, 0, 0, 0.3),
      inset 0 2px 4px rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
    // background-size: cover;

    // &:hover {
    //   transform: translateY(-2px);
    //   box-shadow:
    //     0 25px 50px rgba(0, 0, 0, 0.4),
    //     inset 0 2px 4px rgba(255, 255, 255, 0.1);
    // }

    overflow: hidden;


    // 手机顶部元素
    .phone-top {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 40px;
      display: flex;
      justify-content: center;
      align-items: center;

      .speaker {
        position: absolute;
        width: 60px;
        height: 3px;
        background: linear-gradient(90deg, #333, #555, #333);
        border-radius: 3px;
        top: 0px;
        left: 50%;
        transform: translateX(-50%);
      }

      .camera {
        position: absolute;
        width: 80px;
        height: 10px;
        border-radius: 12px;
        background: #000;
        top: 6px;
        left: 50%;
        transform: translateX(-50%);
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);

        &::before {
          content: '';
          position: absolute;
          width: 6px;
          height: 6px;
          background: #333;
          border-radius: 50%;
          top: 50%;
          left: 15px;
          transform: translateY(-50%);
          box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.1);
        }

        &::after {
          content: '';
          position: absolute;
          width: 6px;
          height: 6px;
          background: #333;
          border-radius: 50%;
          top: 50%;
          right: 15px;
          transform: translateY(-50%);
          box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.1);
        }
      }

      .sensor {
        position: absolute;
        width: 8px;
        height: 8px;
        background: #222;
        border-radius: 50%;
        top: 16px;
        left: 60px;
      }
    }
  }



  // 手机屏幕
  .phone-screen {
    width: 100%;
    height: 100%;
    // border-radius: 25px;
    // overflow: hidden;
    position: relative;
    // padding: 20px 24px 85px;
    display: flex;
    flex-direction: column;
    // &:after {
    //   content: '';
    //   position: absolute;
    //   top: 0;
    //   left: 0;
    //   right: 0;
    //   bottom: 0;
    //   background-image: url('~@/pages/lowcode/get-page-address/iPhoneBezel.png');
    //   background-size: 100% 100%;
    //   background-repeat: no-repeat;
    //   z-index: 10;
    //   pointer-events: none;
    // }

    // 状态栏
    .status-bar {
      // height: 60px;
      height: 40px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.1), transparent);
      background-color: #333;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 25px;
      font-size: 12px;
      color: #fff;
      z-index: 10;
      position: relative;
      backdrop-filter: blur(10px);
      border-radius: 30px 30px 0 0;

      .status-left {
        flex: 1;

        .time {
          font-weight: bold;
        }
      }

      .status-center {
        display: flex;
        align-items: center;
        justify-content: center;

        .camera-area {
          background: #000;
          border-radius: 12px;
          padding: 3px 8px;
          display: flex;
          gap: 8px;
          align-items: center;
          justify-content: center;
          box-shadow:
            inset 0 1px 2px rgba(255, 255, 255, 0.1),
            0 1px 3px rgba(0, 0, 0, 0.3);
          border: 1px solid #1a1a1a;
        }

        .camera-lens {
          position: relative;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #1a1a1a;
          border: 1px solid #333;
          box-shadow:
            inset 0 1px 2px rgba(0, 0, 0, 0.8),
            0 0 3px rgba(0, 0, 0, 0.5);

          .camera-outer-ring {
            position: absolute;
            top: -1px;
            left: -1px;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            border: 1px solid #444;
            background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 50%, #0a0a0a 100%);
          }

          .camera-inner-lens {
            position: absolute;
            top: 1px;
            left: 1px;
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, #333 0%, #111 40%, #000 100%);
            box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.9);
          }

          .camera-highlight {
            position: absolute;
            top: 1.5px;
            left: 2px;
            width: 1.5px;
            height: 1.5px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            box-shadow: 0 0 1px rgba(255, 255, 255, 0.2);
          }
        }
      }

      .status-right {
        display: flex;
        gap: 8px;
        align-items: center;
        flex: 1;
        justify-content: flex-end;

        .signal,
        .wifi,
        .battery {
          font-size: 10px;
        }
      }
    }

    // 屏幕内容区域
    .screen-content {
      position: relative;
      width: 100%;
      // height: 100%;
      overflow: hidden;
      flex: 1;

      iframe {
        width: 100%;
        height: 100%;
        border: none;
        background: #fff;
      }

      .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.95);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 20;

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #409eff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 15px;
        }

        p {
          color: #606266;
          font-size: 14px;
        }
      }
    }
  }

  // 手机底部
  .phone-bottom {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 50px;
    display: flex;
    justify-content: center;
    align-items: center;

    .home-button {
      width: 50px;
      height: 50px;
      background: #333;
      border-radius: 50%;
      border: 2px solid #555;
      cursor: pointer;
      transition: all 0.2s;
      position: absolute;
      bottom: 15px;

      &:hover {
        background: #444;
        transform: scale(1.05);
      }

      &::after {
        content: '';
        position: absolute;
        width: 30px;
        height: 30px;
        border: 2px solid #666;
        border-radius: 50%;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
    }
  }

  // 侧边按钮
  .side-buttons {
    .power-button {
      position: absolute;
      right: -3px;
      top: 120px;
      width: 6px;
      height: 60px;
      background: linear-gradient(90deg, #3a3a3a, #2a2a2a, #3a3a3a);
      border-radius: 0 3px 3px 0;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.1);

      &:hover {
        background: linear-gradient(90deg, #4a4a4a, #3a3a3a, #4a4a4a);
      }
    }

    .volume-buttons {
      position: absolute;
      left: -3px;
      top: 100px;

      .volume-up,
      .volume-down {
        width: 6px;
        height: 35px;
        background: linear-gradient(90deg, #3a3a3a, #2a2a2a, #3a3a3a);
        border-radius: 3px 0 0 3px;
        margin-bottom: 15px;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.1);

        &:hover {
          background: linear-gradient(90deg, #4a4a4a, #3a3a3a, #4a4a4a);
        }
      }
    }
  }
}

// 动画效果
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .main-content {
    .left-panel {
      flex: 0 0 350px;
    }
  }
}

@media (max-width: 992px) {
  .main-content {
    flex-direction: column;

    .left-panel {
      flex: none;
      width: 100%;

      .phone-container {
        justify-content: center;
      }
    }

    .right-panel {
      flex: none;
      width: 100%;
    }
  }
}

@media (max-width: 768px) {
  .main-content {
    .left-panel {
      .phone-container {
        min-height: 450px;
      }
    }
  }
}

@media (max-width: 480px) {
  .main-content {
    .left-panel {
      .device-controls {
        .control-group {
          .el-button {
            width: 100%;
            margin-right: 0;
            margin-bottom: 10px;
          }
        }
      }

      .phone-container {
        min-height: 350px;
      }
    }

    .right-panel {
      .input-group {
        flex-direction: column;

        .el-button {
          margin-top: 10px;
        }
      }
    }
  }
}

.url-display-section {
  margin-bottom: 20px;

  .url-item {
    margin-bottom: 20px;

    label {
      display: block;
      margin-bottom: 8px;
      font-weight: bold;
      color: #303133;
    }

    .url-content {
      .copy-buttons {
        margin-top: 10px;
        display: flex;
        gap: 10px;
      }
    }
  }

  .url-history {
    .history-list {
      max-height: 300px;
      overflow-y: auto;

      .history-item {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 10px;
        border: 1px solid #ebeef5;
        border-radius: 4px;
        margin-bottom: 8px;

        .history-info {
          flex: 1;

          .history-time {
            display: block;
            font-size: 12px;
            color: #909399;
            margin-bottom: 4px;
          }

          .history-url {
            font-size: 14px;
            color: #303133;
            word-break: break-all;
          }
        }

        .history-actions {
          display: flex;
          gap: 5px;
          margin-left: 10px;
        }
      }
    }
  }
}

.help-section {
  .help-content {
    ol {
      margin-bottom: 15px;
      padding-left: 20px;

      li {
        margin-bottom: 8px;
        color: #606266;
      }
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 15px;

  .header-actions {
    display: flex;
    gap: 10px;
  }
}
</style>