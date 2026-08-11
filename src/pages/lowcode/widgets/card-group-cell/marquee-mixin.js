/**
 * 跑马灯动画混入 - 使用纯CSS动画实现高性能跑马灯效果
 */

export default {
  data() {
    return {
      // 跑马灯相关状态
      marqueeDelayTimer: null, // 延迟启动定时器
      marqueeIsRunning: false, // 动画运行状态
    };
  },

  mounted() {
    // 记录组件已挂载，供异步流程判断组件是否仍存活
    this._mounted = true;
  },

  beforeDestroy() {
    // 清理定时器和动画
    this._mounted = false; // 组件销毁后，异步 await 恢复时据此中断后续逻辑
    this.stopMarqueeAnimation();
  },

  methods: {
    /**
     * 启动跑马灯动画
     * @param {Object} config - 动画配置
     * @param {string} containerRef - 容器引用名称
     */
    async startMarqueeAnimation(config, containerRef = 'cardInnerContainer') {
      if (!config || this.marqueeIsRunning) return;

      const marqueeElement = this.$refs[containerRef];
      if (!marqueeElement) return;

      // 延迟启动动画，避免初始渲染时触发动画
      await this.$nextTick();
      this.setMarqueeItemWidth(marqueeElement);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 组件已销毁则不再继续（该 await 不可取消，销毁后仍会恢复执行，需检查标志）
      if (!this._mounted) return;

      this.marqueeDelayTimer = setTimeout(() => {
        this.initCSSMarqueeLayout(config, containerRef);
        this.marqueeIsRunning = true;
      }, config.delay || 100);
    },
    addEvent(ele) {
      ele.addEventListener('click', (ele) => {
        let jumpJson = ele?.currentTarget?.dataset?.jumpJson
        let itemData = ele?.currentTarget?.dataset?.itemData
        try {
          jumpJson && (jumpJson = JSON.parse(jumpJson))
        } catch (e) {
          console.log('jumpJson格式错误', e)
        }
        try {
          itemData && (itemData = JSON.parse(itemData))
        } catch (e) {
          console.log('itemData格式错误', e)
        }
        console.log('click', jumpJson, itemData)
        this.jumpAction(jumpJson, itemData);

      })
    },
    /**
     * 初始化CSS跑马灯布局
     * @param {Object} config - 动画配置
     * @param {string} containerRef - 容器引用名称
     */
    setMarqueeItemWidth(marqueeElement) {
      const visibleCount = Number(this.listConfig?.data_disp_limit);
      const parentWidth = marqueeElement.parentElement?.clientWidth || 0;
      const gap = parseFloat(getComputedStyle(marqueeElement).gap) || 0;

      if (visibleCount <= 0 || parentWidth <= 0) return;

      const itemWidth = (parentWidth - gap * (visibleCount - 1)) / visibleCount;
      Array.from(marqueeElement.children).forEach(child => {
        child.style.width = `${itemWidth}px`;
        child.style.flex = `0 0 ${itemWidth}px`;
      });
    },
    initCSSMarqueeLayout(config, containerRef = 'cardInnerContainer') {
      const marqueeElement = this.$refs[containerRef];
      if (!marqueeElement) return;

      // 设置容器样式
      marqueeElement.style.gridTemplateColumns = `repeat(${marqueeElement.children.length}, 1fr)`;
      // 复制子元素之前，先计算平均宽度并设置到每个子元素的style上
      const children = Array.from(marqueeElement.children);
      let avgWidth = null
      let totalWidth = 0
      const gap = parseFloat(getComputedStyle(marqueeElement).gap) || 0;
      if (children.length > 0) {
        this.setMarqueeItemWidth(marqueeElement);
        // 计算平均宽度
        const childrenWidth = children.reduce((sum, c) => sum + c.offsetWidth, 0);
        totalWidth = childrenWidth + gap * (children.length - 1);
        avgWidth = childrenWidth / children.length;
      }

      const isRightDirection = config.direction === '由左往右';

      // 复制子元素实现无缝滚动
      if (children.length > 0 && !marqueeElement._marqueeCloned) {
        if (isRightDirection) {
          children.forEach(child => {
            const clone = child.cloneNode(true);
            clone.style.width = avgWidth + 'px'
            clone.style.flex = child.style.flex
            clone.classList.add('marquee-clone');
            this.addEvent(clone)
            marqueeElement.appendChild(clone);
          });
          children.forEach(child => {
            const clone = child.cloneNode(true);
            clone.style.width = avgWidth + 'px'
            clone.style.flex = child.style.flex
            clone.classList.add('marquee-clone');
            this.addEvent(clone)
            marqueeElement.appendChild(clone);
          });
        } else {
          children.forEach(child => {
            const clone = child.cloneNode(true);
            clone.style.width = avgWidth + 'px'
            clone.style.flex = child.style.flex
            clone.classList.add('marquee-clone');
            this.addEvent(clone)
            marqueeElement.prepend(clone);
          });
          children.forEach(child => {
            const clone = child.cloneNode(true);
            clone.style.width = avgWidth + 'px'
            clone.style.flex = child.style.flex
            clone.classList.add('marquee-clone');
            this.addEvent(clone)
            marqueeElement.prepend(clone);
          });
        }

        marqueeElement._marqueeCloned = true;


        marqueeElement.style.gridTemplateColumns = `repeat(${marqueeElement.children.length}, 1fr)`;
      }

      // 步进动画参数
      const step = (children[0]?.offsetWidth || 0) + gap;
      const interval = config.interval || 2000;

      // 移除旧定时器
      if (marqueeElement._marqueeTimer) {
        clearInterval(marqueeElement._marqueeTimer);
      }
      let position = 0;
      const timingFunction = 'ease';
      const move = () => {
        if (isRightDirection) {
          position -= step;
          // 当滚动到第一组元素完全消失时，无缝重置到起始位置
          if (Math.abs(position) > totalWidth * 2) {
            // 暂时移除过渡效果，实现瞬间重置
            marqueeElement.style.transition = 'none';
            position = 0;
            marqueeElement.style.transform = `translateX(0px)`;
            // 强制重绘后恢复过渡效果
            setTimeout(() => {
              requestAnimationFrame(() => {
                marqueeElement.style.transition = `transform 1s ${timingFunction}`;
              });
            }, 100);
          } else {
            marqueeElement.style.transform = `translateX(${position}px)`;
          }
        } else {
          position += step;
          // 当滚动到第一组元素完全消失时，无缝重置到起始位置
          if (position > totalWidth * 2) {
            // 暂时移除过渡效果，实现瞬间重置
            marqueeElement.style.transition = 'none';
            position = 0;
            marqueeElement.style.transform = `translateX(${position}px)`;
            // 强制重绘后恢复过渡效果
            setTimeout(() => {
              requestAnimationFrame(() => {
                marqueeElement.style.transition = `transform 1s ${timingFunction}`;
              });
            }, 100);
          } else {
            marqueeElement.style.transform = `translateX(${position}px)`;
          }
        }
      };
      marqueeElement._marqueeTimer = setInterval(move, interval);
      // 初始化位置
      marqueeElement.style.transform = `translateX(0px)`;
      marqueeElement.style.transition = `transform 1s ${timingFunction}`;
      move()
    },

    /**
     * 停止跑马灯动画
     * @param {string} containerRef - 容器引用名称
     */
    stopMarqueeAnimation(containerRef = 'cardInnerContainer') {
      // 停止动画循环
      this.marqueeIsRunning = false;

      // 清理定时器
      if (this.marqueeDelayTimer) {
        clearTimeout(this.marqueeDelayTimer);
        this.marqueeDelayTimer = null;
      }

      // 获取容器元素
      const marqueeElement = this.$refs[containerRef];
      if (marqueeElement) {
        // 清除定时器
        if (marqueeElement._marqueeTimer) {
          clearInterval(marqueeElement._marqueeTimer);
          marqueeElement._marqueeTimer = null;
        }
        // 移除克隆节点
        if (marqueeElement._marqueeCloned) {
          Array.from(marqueeElement.querySelectorAll('.marquee-clone')).forEach(clone => clone.remove());
          marqueeElement._marqueeCloned = false;
        }
      }
    },

    /**
     * 暂停跑马灯动画
     * @param {string} containerRef - 容器引用名称
     */
    pauseMarqueeAnimation(containerRef = 'cardInnerContainer') {
      const marqueeElement = this.$refs[containerRef];
      if (marqueeElement) {
        marqueeElement.style.animationPlayState = 'paused';
      }
    },

    /**
     * 恢复跑马灯动画
     * @param {string} containerRef - 容器引用名称
     */
    resumeMarqueeAnimation(containerRef = 'cardInnerContainer') {
      const marqueeElement = this.$refs[containerRef];
      if (marqueeElement) {
        marqueeElement.style.animationPlayState = 'running';
      }
    },

    /**
     * 重新启动跑马灯动画（响应式处理）
     * @param {Object} config - 动画配置
     * @param {string} containerRef - 容器引用名称
     */
    restartMarqueeAnimation(config, containerRef = 'cardInnerContainer') {
      this.stopMarqueeAnimation(containerRef);
      this.$nextTick(() => {
        this.startMarqueeAnimation(config, containerRef);
      });
    }
  }
};
