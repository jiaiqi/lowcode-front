<template>
  <div class="grid" :style="'--grid-cols:' + pageItem.grid_json.max_cols" v-if="cardStyle === '上图下文'">
    <div class="grid-item" :class="{ 'no-image': !baseListItem.image }" v-for="(baseListItem, baseListIndex) in buttons"
      :key="baseListIndex" @click="onGridItem(baseListItem)" :custom-style="{ padding: '15rpx 0' }">
      <img loading="lazy" :src="getImagePath(baseListItem.image)" style="width: 40px;height:40px;" alt="" srcset="">
      <span class="grid-text" style="padding: 10upx 0;color: #323232;">{{ baseListItem.label || baseListItem.child_name
      }}</span>
    </div>
  </div>
  <div class="grid" :style="'--grid-cols:' + pageItem.grid_json.max_cols" v-else-if="cardStyle === '仅图片'">
    <div class="grid-item" :class="{ 'no-image': !baseListItem.image }" v-for="(baseListItem, baseListIndex) in buttons"
      :key="baseListIndex" @click="onGridItem(baseListItem)">
      <img loading="lazy" :src="getImagePath(baseListItem.image)" alt="" srcset="">
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {

    }
  },
  props: {
    pageItem: {
      type: Object
    },
  },
  computed: {
    buttons: function () {
      let type = this.pageItem?.grid_json?.grid_src
      let buttonList = []
      if (type == '组件子节点') {
        buttonList = this.pageItem?.child_json?.map(item => item)
      }
      if ((!buttonList || buttonList?.length === 0) && this.pageItem?.grid_json?.max_cols) {
        buttonList = []
        const length = this.pageItem?.grid_json?.max_cols
        for (let index = 0; index < length; index++) {
          buttonList.push({
            child_name: '按钮' + index,
          })
        }
      }
      return buttonList
    },
    cardStyle: function () {
      let style = this.pageItem?.grid_json?.card_style || ''
      return style
    }
  },
  methods: {
    onGridItem(item) {
      let jumpJson = item?.jump_json || null
      this.jumpAction(jumpJson, item)
    }
  }
}
</script>

<style scoped lang="scss">
.grid {
  height: 100%;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-column-gap: 10px;

  &-item {
    width: 100%;
    display: flex;
    flex-direction: column;
    cursor: pointer;
    text-align: center;
    img {
      width: 100%;
      min-height: 40px;
      margin: 0 auto;
      // background-color: #333;

      //flex: 1;
    }

    &.no-image {
      img {
        background-color: #999;
        border-radius: 6px;
      }
    }

    .grid-text {
      margin-top: 10px;
    }
  }
}</style>
