/**
 * 通用纵向滚动混入
 * 提供高性能的纵向滚动功能，支持多种容器类型和配置方式
 * 
 * 使用方法：
 * 1. 在组件中引入并混入此mixin
 * 2. 调用 startVerticalScroll(config, options) 开始滚动
 * 3. 调用 stopVerticalScroll() 停止滚动
 * 
 * 配置参数：
 * - interval: 滚动间隔时间（毫秒）
 * - direction: 滚动方向（"由上至下" | "由下至上" | "down" | "up"）
 * - duration: 动画持续时间（毫秒）
 * 
 * 选项参数：
 * - containerSelector: 容器选择器（字符串）或容器引用名（字符串）
 * - containerType: 容器类型（"ref" | "selector"）
 * - rowSelector: 行元素选择器（可选，用于特定行选择）
 */

export default {
  data() {
    return {
      // 滚动定时器
      verticalScrollTimer: null,
      // Web Animations API 动画实例
      verticalScrollAnimation: null,
      // 滚动状态
      isVerticalScrolling: false,
      // 标签页可见性相关
      verticalScrollPaused: false,
      verticalScrollConfigSnapshot: null,
      verticalScrollOptionsSnapshot: null,
      visibilityListenerAdded: false,
    };
  },

  mounted() {
    // 监听标签页可见性变化，隐藏时暂停动画，可见时恢复
    this.addVisibilityListener();
  },

  beforeDestroy() {
    // 组件销毁前清理所有资源
    this.stopVerticalScroll();
    this.cleanupVerticalScrollStyles();
    this.removeVisibilityListener();
  },

  methods: {
    /**
     * 开始纵向滚动
     * @param {Object} config - 滚动配置
     * @param {number} config.interval - 滚动间隔时间（毫秒）
     * @param {string} config.direction - 滚动方向
     * @param {number} config.duration - 动画持续时间（毫秒）
     * @param {Object} options - 选项配置
     * @param {string} options.containerSelector - 容器选择器或引用名
     * @param {string} options.containerType - 容器类型（"ref" | "selector"）
     * @param {string} options.rowSelector - 行元素选择器（可选）
     */
    startVerticalScroll(config = {}, options = {}) {
      if (!config || this.isVerticalScrolling) return;

      // 默认配置
      const defaultConfig = {
        interval: 3000,
        direction: "up",
        duration: 2000
      };

      // 默认选项
      const defaultOptions = {
        containerSelector: "cardInnerContainer",
        containerType: "ref",
        rowSelector: null
      };

      const finalConfig = { ...defaultConfig, ...config };
      // 归一化：保证最小间隔，避免过快调度
      finalConfig.interval = Math.max(finalConfig.interval, 2000);
      const finalOptions = { ...defaultOptions, ...options };

      // 获取滚动容器
      const scrollContainer = this.getScrollContainer(finalOptions);
      if (!scrollContainer) {
        console.warn('纵向滚动：未找到滚动容器');
        return;
      }

      // 检查容器是否可见且有内容，如果不可见则延迟重试
      const rows = this.getScrollRows(scrollContainer, finalOptions);
      const rowHeight = rows.length > 0 ? this.getRowHeight(rows) : 0;
      
      if (rowHeight === 0 || scrollContainer.offsetHeight === 0) {
        // DOM 可能还没完全渲染，延迟重试
        setTimeout(() => {
          this.startVerticalScroll(config, options);
        }, 100);
        return;
      }

      // 停止之前的滚动
      this.stopVerticalScroll();

      // 设置滚动状态
      this.isVerticalScrolling = true;

      // 保存快照以便恢复
      this.verticalScrollConfigSnapshot = { ...finalConfig };
      this.verticalScrollOptionsSnapshot = { ...finalOptions };
      this.verticalScrollPaused = false;

      // 启动首次滚动，后续由动画完成后链式调度
      this.performVerticalScrollStep(finalConfig, finalOptions);
    },

    /**
     * 执行单步滚动
     * @param {Object} config - 滚动配置
     * @param {Object} options - 选项配置
     */
    performVerticalScrollStep(config, options) {
      const scrollContainer = this.getScrollContainer(options);
      if (!scrollContainer) return;

      // 获取行元素
      const rows = this.getScrollRows(scrollContainer, options);
      if (!rows.length) return;

      // 获取行高度
      const rowHeight = this.getRowHeight(rows);
      if (rowHeight === 0) return;

      // 确定滚动方向
      const isDownDirection = this.isDownDirection(config.direction);

      // 计算位移距离
      const translateY = isDownDirection ? rowHeight : -rowHeight;

      // 执行滚动动画
      this.executeScrollAnimation(scrollContainer, translateY, config.duration, () => {
        this.resetVerticalScrollPosition(scrollContainer, rows, isDownDirection);
        // 在动画完成后按设定间隔调度下一次滚动
        this.scheduleNextVerticalScroll(config, options);
      });
    },

    /**
     * 安排下一次滚动：在动画完成后等待 (interval - duration) 再触发，保持节奏不变
     */
    scheduleNextVerticalScroll(config, options) {
      if (!this.isVerticalScrolling) return;
      // 计算等待时间：确保整体节奏约等于每次 interval 触发
      const wait = Math.max((config.interval || 3000) - (config.duration || 2000), 0);
      if (this.verticalScrollTimer) {
        try { clearTimeout(this.verticalScrollTimer); } catch (_) { }
        this.verticalScrollTimer = null;
      }
      this.verticalScrollTimer = setTimeout(() => {
        if (!this.isVerticalScrolling) return;
        this.performVerticalScrollStep(config, options);
      }, wait);
    },

    /**
     * 执行滚动动画
     * @param {HTMLElement} container - 滚动容器
     * @param {number} translateY - Y轴位移距离
     * @param {number} duration - 动画持续时间
     * @param {Function} callback - 动画完成回调
     */
    executeScrollAnimation(container, translateY, duration, callback) {
      // 优先使用 Web Animations API，如果不可用则回退到 CSS 过渡
      if (this.supportsWebAnimations(container)) {
        this.executeWebAnimations(container, translateY, duration, callback);
      } else {
        this.executeCssTransitionAnimation(container, translateY, duration, callback);
      }
    },

    /**
     * 使用 Web Animations API 执行滚动动画
     */
    executeWebAnimations(container, translateY, duration, callback) {
      try {
        // 取消前一个动画，避免并发
        if (this.verticalScrollAnimation) {
          try { this.verticalScrollAnimation.cancel(); } catch (_) { }
          this.verticalScrollAnimation = null;
        }

        const keyframes = [
          { transform: 'translateY(0px)' },
          { transform: `translateY(${translateY}px)` }
        ];
        console.log('使用 Web Animations API 执行滚动动画');

        const options = {
          duration,
          easing: 'cubic-bezier(0.55, -0.25, 0.5, 1.1)',
          fill: 'forwards',
          iterations: 1
        };

        container.style.willChange = 'transform';
        const animation = container.animate(keyframes, options);
        this.verticalScrollAnimation = animation;

        const onFinish = () => {
          if (callback && typeof callback === 'function') {
            callback();
          }
          try { animation.cancel(); } catch (_) { }
          this.verticalScrollAnimation = null;
          container.style.willChange = 'auto';
        };

        if (animation.finished && typeof animation.finished.then === 'function') {
          animation.finished.then(onFinish).catch(() => onFinish());
        } else {
          animation.onfinish = onFinish;
        }
      } catch (e) {
        this.executeCssTransitionAnimation(container, translateY, duration, callback);
      }
    },

    /**
     * 使用 CSS 过渡执行滚动动画（回退方案）
     */
    executeCssTransitionAnimation(container, translateY, duration, callback) {
      container.style.transition = `transform ${duration}ms cubic-bezier(0.55, -0.25, 0.5, 1.1)`;
      container.style.transform = `translateY(${translateY}px)`;
      container.style.willChange = 'transform';
      setTimeout(() => {
        if (callback && typeof callback === 'function') {
          callback();
        }
        container.style.willChange = 'auto';
      }, duration);
    },

    /**
     * 重置滚动位置并调整DOM结构
     * @param {HTMLElement} scrollContainer - 滚动容器
     * @param {Array} rows - 行元素数组
     * @param {boolean} isDownDirection - 是否向下滚动
     */
    resetVerticalScrollPosition(scrollContainer, rows, isDownDirection) {
      // 移除过渡效果，立即重置transform
      scrollContainer.style.transition = "none";
      scrollContainer.style.transform = "translateY(0)";

      // 使用DocumentFragment批量操作DOM，减少重排
      const fragment = document.createDocumentFragment();

      if (isDownDirection) {
        // 向下滚动：将最后一行移到第一行
        const lastRow = rows[rows.length - 1];
        fragment.appendChild(lastRow);
        rows.slice(0, -1).forEach((row) => fragment.appendChild(row));
      } else {
        // 向上滚动：将第一行移到最后
        const firstRow = rows[0];
        rows.slice(1).forEach((row) => fragment.appendChild(row));
        fragment.appendChild(firstRow);
      }

      // 一次性更新DOM
      scrollContainer.innerHTML = "";
      scrollContainer.appendChild(fragment);
    },

    /**
     * 停止纵向滚动
     */
    stopVerticalScroll() {
      if (this.verticalScrollTimer) {
        clearTimeout(this.verticalScrollTimer);
        this.verticalScrollTimer = null;
      }
      if (this.verticalScrollAnimation) {
        try { this.verticalScrollAnimation.cancel(); } catch (_) { }
        this.verticalScrollAnimation = null;
      }
      this.isVerticalScrolling = false;
      this.cleanupVerticalScrollStyles();
    },

    /**
     * 清理滚动样式，防止内存泄漏
     */
    cleanupVerticalScrollStyles() {
      // 尝试清理所有可能的滚动容器样式
      const possibleContainers = [
        this.$refs.cardInnerContainer,
        this.$el?.querySelector('.table-body'),
        this.$el?.querySelector('.scroll-container')
      ];

      possibleContainers.forEach(container => {
        if (container) {
          container.style.transition = "";
          container.style.transform = "";
          container.style.willChange = "auto";
        }
      });
    },

    /**
     * 重启滚动动画（用于响应式更新）
     * @param {Object} config - 滚动配置
     * @param {Object} options - 选项配置
     */
    restartVerticalScroll(config, options) {
      this.stopVerticalScroll();
      this.$nextTick(() => {
        this.startVerticalScroll(config, options);
      });
    },

    /**
     * 获取滚动容器
     * @param {Object} options - 选项配置
     * @returns {HTMLElement|null} 滚动容器元素
     */
    getScrollContainer(options) {
      const { containerSelector, containerType } = options;

      if (containerType === 'ref') {
        // 通过Vue引用获取
        return this.$refs[containerSelector];
      } else if (containerType === 'selector') {
        // 通过选择器获取
        return this.$el?.querySelector(containerSelector);
      }

      return null;
    },

    /**
     * 获取滚动行元素
     * @param {HTMLElement} container - 滚动容器
     * @param {Object} options - 选项配置
     * @returns {Array} 行元素数组
     */
    getScrollRows(container, options) {
      const { rowSelector } = options;

      if (rowSelector) {
        // 使用指定的行选择器
        return Array.from(container.querySelectorAll(rowSelector));
      } else {
        // 使用直接子元素
        return Array.from(container.children);
      }
    },

    /**
     * 获取行高度
     * @param {Array} rows - 行元素数组
     * @returns {number} 行高度
     */
    getRowHeight(rows) {
      if (!rows.length) return 0;

      // 过滤掉可能的克隆元素
      const originalRows = rows.filter(row =>
        !row.classList.contains('vertical-scroll-clone') &&
        !row.classList.contains('scroll-clone')
      );

      const firstRow = originalRows[0] || rows[0];
      return firstRow?.offsetHeight || 0;
    },

    /**
     * 判断是否为向下滚动
     * @param {string} direction - 滚动方向
     * @returns {boolean} 是否向下滚动
     */
    isDownDirection(direction) {
      const downDirections = ["由上至下", "向下", "down"];
      return downDirections.includes(direction);
    },

    /** 检查浏览器是否支持 Web Animations API */
    supportsWebAnimations(el) {
      const target = el || (typeof Element !== 'undefined' ? Element.prototype : {});
      return !!(target && typeof target.animate === 'function');
    },

    /**
     * 标签页可见性：添加监听
     */
    addVisibilityListener() {
      if (this.visibilityListenerAdded) return;
      if (typeof document !== 'undefined' && document.addEventListener) {
        document.addEventListener('visibilitychange', this.onVisibilityChange);
        this.visibilityListenerAdded = true;
      }
    },

    /**
     * 标签页可见性：移除监听
     */
    removeVisibilityListener() {
      if (!this.visibilityListenerAdded) return;
      if (typeof document !== 'undefined' && document.removeEventListener) {
        document.removeEventListener('visibilitychange', this.onVisibilityChange);
        this.visibilityListenerAdded = false;
      }
    },

    /**
     * 标签页可见性变化处理：不可见时暂停，可见时恢复
     */
    onVisibilityChange() {
      if (typeof document === 'undefined') return;
      const isHidden = document.visibilityState === 'hidden';
      console.log("标签页可见性发生变化：", document.visibilityState);

      if (isHidden) {
        if (this.isVerticalScrolling) {
          // 标记暂停并停止当前滚动调度与动画
          this.verticalScrollPaused = true;
          this.stopVerticalScroll();
        }
      } else {
        // 可见，若之前处于暂停且有快照，恢复滚动
        if (this.verticalScrollPaused && this.verticalScrollConfigSnapshot && this.verticalScrollOptionsSnapshot) {
          this.verticalScrollPaused = false;
          this.startVerticalScroll(this.verticalScrollConfigSnapshot, this.verticalScrollOptionsSnapshot);
        }
      }
    },

    /**
     * 检查是否支持纵向滚动
     * @param {Object} config - 配置对象
     * @returns {boolean} 是否支持纵向滚动
     */
    isVerticalScrollEnabled(config) {
      if (!config) return false;

      // 支持多种配置方式
      return config.animation_type === "纵向滚动" ||
        config.type === "纵向滚动" ||
        config.isVerticalScroll === true;
    }
  }
};