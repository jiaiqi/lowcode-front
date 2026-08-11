<template>
  <div class="stack-swiper">
    <!-- Loading组件 -->
    <div
      v-if="isLoading"
      class="loading-overlay"
    >
      <div class="loading-text">图片加载中...</div>
    </div>

    <div
      class="swiperPanel"
      @touchstart="startMove"
      @touchmove="touchMove"
      @touchend="endMove"
      @mousedown="startMouseMove"
      @mousemove="mouseMove"
      @mouseup="endMouseMove"
      @mouseleave="endMouseMove"
      :style="{
        height: swiperStyle && swiperStyle.height ? `calc(${swiperStyle.height} + 20px)` : 'unset',
        paddingBottom: layoutMode === '堆叠1' ? '0px' : '40px'
      }"
      ref="swiperPanel"
    >
      <div
        class="swiperItem"
        v-for="(item, index) in swiperList"
        :key="index"
        :class="{
          current: currentIndex === index,
          'layout1': layoutMode === '堆叠1',
          'layout2': layoutMode === '堆叠2',
          'layout3': layoutMode === '堆叠3',
        }"
        :style="{
          transform: itemStyle[index] ? itemStyle[index].transform : '',
          zIndex: itemStyle[index] ? itemStyle[index].zIndex : 0,
          opacity: itemStyle[index] ? itemStyle[index].opacity : 1
        }"
        @click.stop="onTap(item, $event)"
      >
        <div
          class="children"
          :style="swiperStyle"
          :class="{
            'hidePre': hidePre,
            'hideNext': hideNext
          }"
        >
          <card-group-cell
            :page-item="pageItem"
            :cellsLayout="[getCardJson]"
            :cell-data="[item]"
            @on-click-cell="onClickCell"
            v-if="getCardJson"
          ></card-group-cell>
          <img
            class="pic"
            :src="item.url"
            v-else-if="item.url"
            @load="onImageLoad(index)"
            @error="onImageError(index)"
          />
        </div>
      </div>
    </div>

    <!-- 轮播图指示器 -->
    <div
      class="swiper-indicators"
      v-if="showIndicators && swiperList.length > 1"
      :style="{
        bottom: indicatorBottom
      }"
    >
      <div
        class="indicator-dot"
        v-for="(item, index) in swiperList"
        :key="index"
        :class="{
          'active': index === currentIndex
        }"
        @click="goToSlide(index)"
      ></div>
    </div>
  </div>
</template>

<script>
import cloneDeep from "lodash/cloneDeep";
import cardGroupCell from "../card-group-cell/card-group-cell.vue";

export default {
  name: 'StackSwiperPC',
  components: {
    cardGroupCell
  },
  props: {
    swiperList: {
      type: Array,
      default: () => []
    },
    swiperStyle: {
      type: Object,
      default: () => ({})
    },
    hidePre: {
      type: Boolean,
      default: false
    },
    hideNext: {
      type: Boolean,
      default: false
    },
    layoutMode: {
      type: String,
      default: '堆叠1', // '堆叠1' 普通堆叠, '堆叠2' 偏移堆叠
      validator: function (value) {
        return ['堆叠1', '堆叠2', '堆叠3'].indexOf(value) !== -1
      }
    },
    // 指示器相关配置
    showIndicators: {
      type: Boolean,
      default: true // 是否显示指示器
    },
    indicatorColor: {
      type: String,
      default: 'var(--indicator-color, rgba(200, 200, 200, 0.5))' // 指示器默认颜色
    },
    indicatorActiveColor: {
      type: String,
      default: 'var(--indicator-active-color, #CCCCCC)' // 指示器激活颜色
    },
    indicatorBottom: {
      type: String,
      default: '20px' // 指示器距离底部距离
    },
    pageItem: {
      type: Object,
      default: () => ({})
    },
    cardJson: {
      type: Object,
      default: () => null
    },
  },
  computed: {
    getCardJson() {
      let json = null
      if(this.cardJson){
        json = cloneDeep(this.cardJson)
        if(this.hasDragged){
          delete json.jump_json
        }
      }
      return json
    }
  },
  data() {
    return {
      slideNote: {
        x: 0,
        y: 0
      },
      screenWidth: 0,
      itemStyle: [],
      isLoading: false, // 加载状态
      loadedImages: [], // 已加载完成的图片索引
      errorImages: [], // 加载失败的图片索引
      currentIndex: 0, // 当前显示的图片索引
      isDragging: false, // 是否正在拖动
      isMouseDragging: false, // 是否正在鼠标拖动
      dragOffset: 0, // 当前拖动偏移量
      originalStyles: [], // 保存原始样式用于拖动结束后恢复
      hasDragged: false // 标记是否发生了拖动
    };
  },
  watch: {
    swiperList: {
      handler(newList) {
        if (newList && newList.length > 0) {
          this.initLoading();
          this.initItemStyle();
        }
      },
      immediate: true
    }
  },
  mounted() {
    this.getScreenWidth();
    window.addEventListener('resize', this.getScreenWidth);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.getScreenWidth);
  },
  methods: {
    // 获取屏幕宽度
    getScreenWidth() {
      this.screenWidth = window.innerWidth;
    },

    onClickCell(e) {
      let url = ''
      let rowData = e.data
      if (e?.cellsLayout?.jump_json) {
        this.jumpAction(e.cellsLayout.jump_json, rowData)
      }
    },
    
    onTap(item, event) {
      // 如果发生了拖动，则阻止点击事件
      if (this.hasDragged) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      this.$emit('on-tap', item)
    },

    // 指示器点击跳转到指定图片
    goToSlide(targetIndex) {
      if (targetIndex === this.currentIndex) return;

      // 直接设置目标索引
      this.currentIndex = targetIndex;

      // 重新初始化样式以匹配新的索引
      this.initItemStyle();

      // 触发change事件
      this.$emit('change', {
        detail: {
          current: this.currentIndex
        }
      });
    },

    // 移动轮播图
    moveSlide(direction) {
      var newList = cloneDeep(this.itemStyle);

      if (direction > 0) {
        // 向右移动（下一张）
        var last = [newList.pop()];
        newList = last.concat(newList);
      } else {
        // 向左移动（上一张）
        newList.push(newList[0]);
        newList.splice(0, 1);
      }

      this.itemStyle = newList;
    },
    
    // 初始化加载状态
    initLoading() {
      this.loadedImages = [];
      this.errorImages = [];
      if (this.swiperList.every(item => item.url)) {
        this.isLoading = false;
      }
    },

    // 初始化样式
    initItemStyle() {
      this.itemStyle = [];
      this.swiperList.forEach((item, index) => {
        this.itemStyle.push(this.getStyle(index));
      });
    },

    // 图片加载完成
    onImageLoad(index) {
      if (!this.loadedImages.includes(index)) {
        this.loadedImages.push(index);
      }
      this.checkAllImagesLoaded();
    },

    // 图片加载失败
    onImageError(index) {
      if (!this.errorImages.includes(index)) {
        this.errorImages.push(index);
      }
      this.checkAllImagesLoaded();
    },

    // 检查所有图片是否加载完成
    checkAllImagesLoaded() {
      const totalImages = this.swiperList.filter(item => item.url).length;
      const processedImages = this.loadedImages.length + this.errorImages.length;
      if (processedImages >= totalImages) {
        this.isLoading = false;

        // 如果有图片加载失败，可以在这里处理
        if (this.errorImages.length > 0) {
          console.warn('部分图片加载失败:', this.errorImages);
        }
      }
    },

    getStyle(e) {
      // 计算相对于当前索引的位置
      let relativeIndex = e - this.currentIndex;

      // 处理循环，确保相对位置在合理范围内
      if (relativeIndex > this.swiperList.length / 2) {
        relativeIndex = relativeIndex - this.swiperList.length;
      } else if (relativeIndex < -this.swiperList.length / 2) {
        relativeIndex = relativeIndex + this.swiperList.length;
      }

      if (this.layoutMode === '堆叠2') {
        return this.getOffsetStyle(relativeIndex);
      } else {
        return this.getStackStyle(relativeIndex);
      }
    },

    // 普通堆叠样式
    getStackStyle(relativeIndex) {
      // relativeIndex为0表示当前图片
      if (relativeIndex === 0) {
        return {
          transform: 'scale(1) translate(0%, 0px)',
          zIndex: 25,
          opacity: 1
        }
      }

      // 处理后面的图片（正数索引）
      if (relativeIndex > 0) {
        // 如果hideNext为true，则隐藏后面的图片
        if (this.hideNext) {
          return {
            transform: `scale(${1 - relativeIndex / 10}) translate(${relativeIndex * 9}%, 0px)`,
            zIndex: 25 - relativeIndex,
            opacity: 0
          }
        }
        return {
          transform: `scale(${1 - relativeIndex / 10}) translate(${relativeIndex * 9}%, 0px)`,
          zIndex: 25 - relativeIndex,
          opacity: Math.max(0, 1 - (relativeIndex / 3))
        }
      } else {
        // 处理前面的图片（负数索引）
        const absIndex = Math.abs(relativeIndex);
        // 如果hidePre为true，则隐藏前面的图片
        if (this.hidePre) {
          return {
            transform: `scale(${1 - absIndex / 10}) translate(-${absIndex * 9}%, 0px)`,
            zIndex: 25 - absIndex,
            opacity: 0
          }
        }
        return {
          transform: `scale(${1 - absIndex / 10}) translate(-${absIndex * 9}%, 0px)`,
          zIndex: 25 - absIndex,
          opacity: Math.max(0, 1 - (absIndex / 3))
        }
      }
    },

    // 偏移堆叠样式
    getOffsetStyle(relativeIndex) {
      if (relativeIndex === 0) {
        // 当前图片，居中显示
        return {
          transform: 'translate(0, 0) scale(1)',
          zIndex: 25,
          opacity: 1
        }
      }
      const scale = 1;
      // 处理后面的图片（正数索引）
      if (relativeIndex > 0) {
        if (relativeIndex < 4) {
          // 后面的图片向右下偏移，营造层次感
          const offsetX = -relativeIndex * 10; // 向右偏移 (rpx改为px)
          const offsetY = -relativeIndex * 10;  // 向下偏移
          return {
            transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
            zIndex: 25 - relativeIndex,
            opacity: 0
          }
        } else {
          return {
            transform: `translate(10px, 10px) scale(${scale})`,
            zIndex: -99,
            opacity: 0
          }
        }
      } else {
        // 处理前面的图片（负数索引）
        const absIndex = Math.abs(relativeIndex);
        if (absIndex < 4) {
          // 前面的图片向左上偏移，保持水平层次
          const offsetX = absIndex * 10; // 向左偏移
          const offsetY = absIndex * 10;   // 向上偏移
          return {
            transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
            zIndex: 25 - absIndex,
            opacity: Math.max(0, 1 - absIndex * 0.5)
          }
        } else {
          return {
            transform: `translate(-10px, -10px) scale(${scale})`,
            zIndex: -99,
            opacity: 0
          }
        }
      }
    },

    // 触摸事件处理
    startMove(e) {
      this.slideNote.x = e.changedTouches[0] ? e.changedTouches[0].pageX : 0;
      this.slideNote.y = e.changedTouches[0] ? e.changedTouches[0].pageY : 0;
      this.isDragging = true;
      this.dragOffset = 0;
      this.hasDragged = false; // 重置拖动标记
      // 保存原始样式用于拖动结束后恢复
      this.originalStyles = cloneDeep(this.itemStyle);
    },

    touchMove(e) {
      if (!this.isDragging) return;
      e.preventDefault();

      const currentX = e.changedTouches[0] ? e.changedTouches[0].pageX : 0;
      const moveDistance = currentX - this.slideNote.x;
      this.dragOffset = moveDistance;

      // 如果移动距离超过5px，标记为已拖动
      if (Math.abs(moveDistance) > 5) {
        this.hasDragged = true;
      }

      // 更新当前元素的transform，使其跟随手指移动
      const newStyles = cloneDeep(this.originalStyles);

      // 当前元素跟随拖动
      if (newStyles[this.currentIndex]) {
        const currentTransform = newStyles[this.currentIndex].transform || '';
        // 移除原有的translateX，添加新的拖动偏移
        const cleanTransform = currentTransform.replace(/translateX\([^)]+\)/g, '').trim();
        newStyles[this.currentIndex].transform = `${cleanTransform} translateX(${moveDistance}px)`;
      }

      this.itemStyle = newStyles;
    },

    async endMove(e) {
      if(this.isDragging){
        e.preventDefault();
        e.stopPropagation();
      }
      this.isDragging = false;

      const clickX = e.changedTouches[0].pageX;
      const moveDistance = clickX - this.slideNote.x;
      await this.handleMoveEnd(moveDistance);
      
      // 延迟重置拖动标记，确保点击事件能正确判断
      setTimeout(() => {
        this.hasDragged = false;
      }, 100);
    },

    // 鼠标事件处理
    startMouseMove(e) {
      e.preventDefault();
      this.slideNote.x = e.pageX;
      this.slideNote.y = e.pageY;
      this.isMouseDragging = true;
      this.dragOffset = 0;
      this.hasDragged = false; // 重置拖动标记
      // 保存原始样式用于拖动结束后恢复
      this.originalStyles = cloneDeep(this.itemStyle);
    },

    mouseMove(e) {
      if (!this.isMouseDragging) return;
      e.preventDefault();

      const currentX = e.pageX;
      const moveDistance = currentX - this.slideNote.x;
      this.dragOffset = moveDistance;

      // 如果移动距离超过5px，标记为已拖动
      if (Math.abs(moveDistance) > 5) {
        this.hasDragged = true;
      }

      // 更新当前元素的transform，使其跟随鼠标移动
      const newStyles = cloneDeep(this.originalStyles);

      // 当前元素跟随拖动
      if (newStyles[this.currentIndex]) {
        const currentTransform = newStyles[this.currentIndex].transform || '';
        // 移除原有的translateX，添加新的拖动偏移
        const cleanTransform = currentTransform.replace(/translateX\([^)]+\)/g, '').trim();
        newStyles[this.currentIndex].transform = `${cleanTransform} translateX(${moveDistance}px)`;
      }

      this.itemStyle = newStyles;
    },

    async endMouseMove(e) {
      if (!this.isMouseDragging) return;
      e.preventDefault();
      e.stopPropagation();
      this.isMouseDragging = false;
      const clickX = e.pageX;
      const moveDistance = clickX - this.slideNote.x;
      await this.handleMoveEnd(moveDistance);
      
      // 延迟重置拖动标记，确保点击事件能正确判断
      setTimeout(() => {
        this.hasDragged = false;
      }, 100);
    },

    // 统一处理移动结束逻辑
    async handleMoveEnd(moveDistance) {
      let indexChange = 0; // 记录索引变化

      // 根据拖动距离决定是否切换图片（拖动超过屏幕宽度的20%则切换）
      const threshold = this.screenWidth * 0.2;

      if (Math.abs(moveDistance) > threshold) {
        // 根据布局模式执行不同的飞出动画
        if (this.layoutMode === '堆叠1') {
          await this.playStackFlyOutAnimation(moveDistance);
        } else {
          await this.playOffsetFlyOutAnimation(moveDistance);
        }
        // 拖动距离超过阈值，执行切换
        var newList = cloneDeep(this.originalStyles);

        if (moveDistance < 0) {
          // 向左滑动（从右往左），切换到下一张
          newList.push(newList[0]);
          newList.splice(0, 1);
          indexChange = 1; // 向前移动一位
        } else {
          // 向右滑动（从左往右），切换到上一张
          var last = [newList.pop()];
          newList = last.concat(newList);
          indexChange = -1; // 向后移动一位
        }
        
        this.itemStyle = newList;
        // 更新当前索引
        this.updateCurrentIndex(indexChange);
        // 重新初始化样式，确保下次滑动动画正常
        this.$nextTick(() => {
          this.initItemStyle();
        });
      } else {
        // 拖动距离不足，恢复原始位置
        this.itemStyle = cloneDeep(this.originalStyles);
      }
    },

    // 堆叠1模式的飞出动画
    async playStackFlyOutAnimation(moveDistance) {
      return new Promise((resolve) => {
        // 找到需要飞出的元素索引（切换前的当前元素）
        let flyOutIndex;
        if (moveDistance < 0) {
          // 向左滑动，最后一个元素飞出
          flyOutIndex = this.swiperList.length - 1;
        } else {
          // 向右滑动，第一个元素飞出
          flyOutIndex = 0;
        }

        const newStyles = cloneDeep(this.itemStyle);
        const flyOutItem = newStyles[flyOutIndex];

        if (flyOutItem) {
          // 根据滑动方向设置飞出方向和缩放
          let flyOutX, flyOutY, scale;

          if (moveDistance > 0) {
            // 从左往右滑动，向右飞出并逐渐变小
            flyOutX = this.screenWidth * 1.2; // 向右飞出
            flyOutY = 0; // 水平飞出
            scale = 0.3; // 逐渐变小
          } else {
            // 从右往左滑动，向左飞出并逐渐变小
            flyOutX = -this.screenWidth * 1.2; // 向左飞出
            flyOutY = 0; // 水平飞出
            scale = 0.3; // 逐渐变小
          }

          // 应用飞出动画样式
          const currentTransform = flyOutItem.transform || '';
          const cleanTransform = currentTransform.replace(/translateX\([^)]+\)/g, '').replace(/translateY\([^)]+\)/g, '').replace(/scale\([^)]+\)/g, '').trim();

          flyOutItem.transform = `${cleanTransform} translateX(${flyOutX}px) translateY(${flyOutY}px) scale(${scale})`;
          flyOutItem.opacity = 0;

          this.itemStyle = newStyles;

          // 动画持续时间后resolve
          setTimeout(() => {
            resolve();
          }, 300); // 300ms动画时间，稍长一些让缩放效果更明显
        } else {
          resolve();
        }
      });
    },

    // 飞出动画
    async playOffsetFlyOutAnimation(moveDistance) {
      return new Promise((resolve) => {
        // 找到需要飞出的元素索引（切换前的当前元素）
        let flyOutIndex;
        if (moveDistance < 0) {
          // 向左滑动，最后一个元素飞出
          flyOutIndex = this.swiperList.length - 1;
        } else {
          // 向右滑动，第一个元素飞出
          flyOutIndex = 0;
        }

        const newStyles = cloneDeep(this.itemStyle);
        const flyOutItem = newStyles[flyOutIndex];

        if (flyOutItem) {
          // 根据滑动方向设置飞出方向
          let flyOutX, flyOutY;

          if (moveDistance > 0) {
            // 从左往右滑动，往右下飞出
            flyOutX = this.screenWidth * 0.8; // 向右飞出
            flyOutY = 50; // 向下飞出
          } else {
            // 从右往左滑动，往左下飞出
            flyOutX = -this.screenWidth * 0.8; // 向左飞出
            flyOutY = 50; // 向下飞出
          }

          // 应用飞出动画样式
          const currentTransform = flyOutItem.transform || '';
          const cleanTransform = currentTransform.replace(/translateX\([^)]+\)/g, '').replace(/translateY\([^)]+\)/g, '').trim();

          flyOutItem.transform = `${cleanTransform} translateX(${flyOutX}px) translateY(${flyOutY}px) rotate(${moveDistance > 0 ? '25deg' : '-25deg'}) scale(.75)`;
          flyOutItem.opacity = 0;

          this.itemStyle = newStyles;

          // 动画持续时间后resolve
          setTimeout(() => {
            resolve();
          }, 300); // 300ms动画时间
        } else {
          resolve();
        }
      });
    },

    // 更新当前索引
    updateCurrentIndex(change) {
      this.currentIndex = (this.currentIndex + change + this.swiperList.length) % this.swiperList.length;
      this.$emit('change', {
        detail: {
          current: this.currentIndex
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.stack-swiper {
  width: 100%;
  position: relative;
  padding-bottom: 20px;
  overflow: visible; // 允许飞出动画显示
  user-select: none; // 防止拖拽时选中文本
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  
  .loading-text {
    color: #666;
    font-size: 14px;
  }
}

.swiperPanel {
  min-height: 172px; // rpx转换为px (344rpx ≈ 172px)
  width: 100%;
  overflow: visible; // 允许飞出动画显示
  position: relative;
  cursor: grab;
  
  &:active {
    cursor: grabbing;
  }

  .swiperItem {
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    transition: all .3s ease-in-out;

    &.current {
      position: relative;
    }

    .children {
      width: calc(100% - 40px); // rpx转换为px (80rpx ≈ 40px)
      margin: 1px auto; // rpx转换为px (2rpx ≈ 1px)

      &.hidePre {
        margin-right: 0;
        width: calc(100% - 20px); // rpx转换为px (40rpx ≈ 20px)
      }

      &.hideNext {
        margin-left: 0;
        width: calc(100% - 20px); // rpx转换为px (40rpx ≈ 20px)
      }

      .pic {
        height: 100%;
        width: 100%;
        object-fit: cover;
        border-radius: 8px;
        transition: transform 0.3s ease;
        
        &:hover {
          transform: scale(1.02);
        }
      }
    }

    &.layout2 {
      .children {
        width: calc(100% - 20px); // rpx转换为px (40rpx ≈ 20px)
        margin: 0;
      }
    }
  }
}

// 指示器样式
.swiper-indicators {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px; // rpx转换为px (12rpx ≈ 6px)
  z-index: 110;

  // CSS变量定义
  --indicator-color: rgba(200, 200, 200, 0.5);
  --indicator-active-color: var(--primary_color, #999);

  .indicator-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    transition: all 0.3s ease;
    cursor: pointer;
    background-color: var(--indicator-active-color);
    opacity: 0.3;

    &.active {
      width: 24px; 
      border-radius: 8px; 
      background-color: var(--indicator-active-color);
      opacity: 1;
    }

    &:hover {
      transform: scale(1.2);
      opacity: 0.8;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .swiperPanel {
    min-height: 150px;
    
    .swiperItem {
      .children {
        width: calc(100% - 20px);
        
        &.hidePre,
        &.hideNext {
          width: calc(100% - 10px);
        }
      }
    }
  }
  
  .swiper-indicators {
    gap: 4px;
    
    .indicator-dot {
      width: 4px;
      height: 4px;
      
      &.active {
        width: 8px;
        border-radius: 2px;
      }
    }
  }
}

@media (min-width: 1200px) {
  .swiperPanel {
    min-height: 200px;
    
    .swiperItem {
      .children {
        width: calc(100% - 60px);
        
        &.hidePre,
        &.hideNext {
          width: calc(100% - 30px);
        }
      }
    }
  }
  
  .swiper-indicators {
    gap: 8px;
    
    .indicator-dot {
      width: 8px;
      height: 8px;
      
      &.active {
        width: 16px;
        border-radius: 4px;
      }
    }
  }
}
</style>