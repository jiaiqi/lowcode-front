<template>
  <div class="chat_en" :style="[setPosition]"
       @click.stop="onTap"
       @mousedown.stop="handleMouseDown"
       ref="chatEntranceRef"
       :class="{ 'draggable': isPreview || isView, 'editable': !isPreview && !isView }"
  >
    <!-- 编辑模式下的操作工具栏 -->
    <div
      v-if="isActive && !isPreview && !isView"
      class="action-toolbar"
    >
      <div
        class="action-button delete-btn"
        @click.stop="onDelete"
        title="删除组件"
      >
        <i class="el-icon-close"></i>
      </div>
      <div
        class="action-button drag-btn"
        @mousedown.stop="startDrag"
        title="拖动组件"
      >
        <i class="el-icon-rank"></i>
      </div>
    </div>

     <li v-for="(item,index) in chatList" class="chat_list" @click="handleChatClick(item, $event)" :style="[chatStyleJson]">
       <span><img loading="lazy" :src="chatBg" alt="" :class="{'chat_ds': true, 'blink': item.isOpen}"></span>
       <span>{{item.chat_type}}</span>
     </li>
  </div>
</template>

<script>
import { formatStyleData } from "@/pages/lowcode/common";
import chaImg from '@/assets/img/chat.png'
export default {
  name: "chat-entrance",
  data(){
    return {
      chatCount:0,
      chatType:0,
      chatList:[],
      left: this.position.x || 0,
      top: this.position.y || 0,
      isDragging: false,
      startX: 0,
      startY: 0,
      startLeft: 0,
      startTop: 0,
      dragStartTime: 0,
      hasMoved: false,
      // 鼠标相对于组件的偏移量
      offsetX: 0,
      offsetY: 0,
      // 拖动结束后的延迟标志，防止立即触发点击
      dragEndTime: 0,
      // 存储背景图片URL
      chatBg:chaImg,
    }
  },
  props: {
    position: {
      type: Object,
      default: () => ({
        x: 0,
        y: 0,
      }),
    },
    currentId: {
      type: [String, Number],
      default: "",
    },
    id: {
      type: [String, Number],
      default: "",
    },
    pageItem:{
      type:Object,
    },
    pageParamsModel:{
      type:Object,
    },
    isPreview: {
      type: Boolean,
      default: false,
    },
    isView: {
      type: Boolean,
      default: false,
    },
  },
  computed:{
    isActive() {
      return this.currentId && this.id === this.currentId;
    },
    setPosition() {
      // 当isPreview为真时，强制定位到右侧距离边缘20px的位置
      if (this.isPreview) {
        return {
          position: "fixed",
          left: "auto",
          right: "0px", // 距离右边缘20px
          top: this.top + "%",
        };
      }
      return {
        position: "fixed",
        left: this.left + "%",
        top: this.top + "%",
      };
    },
    props() {
      return { ...this.$props, ...(this.$attrs || {}) };
    },

    chatStyleJson() {
      // 安全检查：确保pageItem存在且有style_json属性
      if (!this.pageItem || !this.pageItem.style_json) {
        return {};
      }
      let style = {};
      try {
        style = formatStyleData(this.pageItem.style_json);

        // 从样式对象中移除background-image属性，背景图片将单独处理
        if (style && style['background-image']) {
          delete style['background-image'];
        }
      } catch (error) {
        console.warn('处理样式时出错:', error);
        return {};
      }

      return style || {};
    },
    chartStore(){
      return this.$store.state.chatInfo.chatBase
    },
    storeChatList(){
      return this.$store.state.chatInfo.chatList
    },
    setDataInfo(){
      return this.pageItem.srv_req_type==='请求数据'? this.pageItem.srv_req_json:null

    },
  },
  watch:{
    storeChatList:{
      handler(newVal){
        this.handelSetChatList(newVal)
      },
      deep:true,
      immediate:true
    },
    chartStore:{
      handler(newVal){
        if(newVal.msg&&newVal.msg.groupId){
          this.handelSetChatOpenStatus(true,newVal.msg);
        }
      },
      deep:true,
      immediate:true
    },
    // 监听pageItem变化，提取背景图片
    pageItem: {
      handler(newVal) {
        // 默认使用chaImg
        this.chatBg = chaImg;

        // 尝试提取自定义背景图片
        if (newVal && newVal.style_json) {
          try {
            const style = formatStyleData(newVal.style_json);
            if (style && style['background-image']) {
              const backgroundImage = style['background-image'];
              const urlMatch = backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
              if (urlMatch && urlMatch[1]) {
                this.chatBg = urlMatch[1];
              }
            }
          } catch (error) {
            // 出错时保持默认值
          }
        }
      },
      deep: true,
      immediate: true
    }
  },
   mounted(){
    this.getChatList()
    // 初始化位置
    if (this.pageItem?.layout_x !== undefined) {
      this.left = parseFloat(this.pageItem.layout_x);
    }
    if (this.pageItem?.layout_y !== undefined) {
      this.top = parseFloat(this.pageItem.layout_y);
    }

    // 添加全局事件监听
    window.addEventListener("mousemove", this.onDrag);
    window.addEventListener("mouseup", this.stopDrag);
  },
  beforeDestroy() {
    // 移除全局事件监听
    window.removeEventListener("mousemove", this.onDrag);
    window.removeEventListener("mouseup", this.stopDrag);
  },
  methods:{
    getParentContainer() {
      // 由于这是全屏拖动的浮动组件，直接使用视口作为容器
      return {
        element: null,
        rect: {
          left: 0,
          top: 0,
          width: window.innerWidth,
          height: window.innerHeight
        }
      };
    },
    onDelete() {
      this.$emit("delete", this.props);
    },
    onTap(event) {
      // 如果刚刚拖动过，不触发点击事件
      if (this.hasMoved) return;

      // 在编辑模式下，总是触发选中事件
      if (!this.isPreview && !this.isView) {
        let val = this.props;
        console.log("onTap:", val);
        this.$emit("click", val);
        return;
      }

      // 预览模式下不触发选中事件
    },
    handleMouseDown(event) {
      // 只有在预览和查看模式下，组件本身才可以拖动
      if (this.isPreview || this.isView) {
        this.startDrag(event);
      }
    },
    startDrag(event) {
      this.isDragging = true;
      this.startX = event.clientX;
      this.startY = event.clientY;
      this.startLeft = this.left;
      this.startTop = this.top;
      this.dragStartTime = Date.now();
      this.hasMoved = false;
      this.dragEndTime = 0;
      if (this.isPreview || this.isView) {
        const elementRect = this.$el.getBoundingClientRect();
        const mouseX = event.clientX;
        const mouseY = event.clientY;
        const elementX = elementRect.left;
        const elementY = elementRect.top;
        this.offsetX = mouseX - elementX;
        this.offsetY = mouseY - elementY;
      }

      event.preventDefault();
    },

    onDrag(event) {
      if (!this.isDragging) return;
      const deltaX = event.clientX - this.startX;
      const deltaY = event.clientY - this.startY;

      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        this.hasMoved = true;
      }

      const container = this.getParentContainer();
      const elementRect = this.$el.getBoundingClientRect();
      const parentRect = container.rect;

      if (this.isPreview || this.isView) {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const mouseX = event.clientX;
        const mouseY = event.clientY;

        const newLeft = mouseX - this.offsetX;
        const newTop = mouseY - this.offsetY;
        const maxLeft = viewportWidth - elementRect.width;
        const maxTop = viewportHeight - elementRect.height;

        const constrainedLeft = Math.max(0, Math.min(maxLeft, newLeft));
        const constrainedTop = Math.max(0, Math.min(maxTop, newTop));
        this.left = (constrainedLeft / viewportWidth) * 100;
        this.top = (constrainedTop / viewportHeight) * 100;

      } else {
        const percentX = (deltaX / parentRect.width) * 100;
        const percentY = (deltaY / parentRect.height) * 100;

        this.left = this.startLeft + percentX;
        this.top = this.startTop + percentY;
        const elementWidthPercent = (elementRect.width / parentRect.width) * 100;
        const elementHeightPercent = (elementRect.height / parentRect.height) * 100;

        this.left = Math.max(0, Math.min(100 - elementWidthPercent, this.left));
        this.top = Math.max(0, Math.min(100 - elementHeightPercent, this.top));
      }
    },
    stopDrag() {
      //使用时间戳来增加一个边界延迟条件，防止拖完立刻被打开弹窗
      if (!this.isDragging) return;
      if (this.hasMoved) {
        this.updateComponentProps();
        this.dragEndTime = Date.now();
      }
      this.isDragging = false;
      setTimeout(() => {
        this.hasMoved = false;
      }, 100); // 100ms延迟
    },
    updateComponentProps() {
      const updatedProps = {
        ...this.props,
        layout_x: parseFloat(this.left.toFixed(2)),
        x: parseFloat(this.left.toFixed(2)),
        layout_y: parseFloat(this.top.toFixed(2)),
        y: parseFloat(this.top.toFixed(2)),
      };

      if (this.isPreview || this.isView) {
        this.$emit("resize", updatedProps);
      } else {
        this.$emit("resize", updatedProps);
        this.$emit("click", updatedProps);
      }
    },
    async getChatList(){
      if(this.setDataInfo){
        let req= typeof this.pageItem.srv_req_json==='string'?JSON.parse(this.pageItem.srv_req_json):this.pageItem.srv_req_json
        let setParams={
          serviceName:req.serviceName,
          colNames:['*'],
          condition:req.condition?req.condition:[],
          page:req.page,
          draft: false,
          order: []
        }
        const url = `/${req.mapp}/select/${req.serviceName}`;
        const res = await this.$http.post(url, setParams);
        if(res.data.state!=='SUCCESS') return;
        let ls = res.data.data
        if(ls && ls.length>0){
          let base={};
          let tep =[];
          ls.map(d=>{
            base={
              chat_type:d.name,
              code:d.id,
              groupId:null,
              isOpen:false,
            }
            tep.push(base);
          })
          this.chatList = [...tep]
        }
      }
    },

    handelSetChatList(storeChatList){
      console.log('storeChatList',storeChatList)
      // 遍历本地chatList，根据store中的数据更新groupId
      this.chatList.forEach(localItem => {
        // 在store的chatList中查找对应的项
        const storeItem = storeChatList.find(storeItem => storeItem.setId === localItem.code);
        if (storeItem) {
          // 如果找到对应项，更新groupId
          localItem.groupId = storeItem.groupId;
        }
      });
      console.log('---这是重新组合后的会话类型',this.chatList)
    },

    handelSetChatOpenStatus(flag,item){
      this.chatList.map(d=>{
        if(!flag){
          if(d.code === item.code){
             d.isOpen = flag
          }
        }else {
          if(d.groupId === item.groupId){
             d.isOpen=true
          }
        }
      })
    },

    handleChatClick(item, event) {
      // 在编辑模式下，阻止聊天功能，但允许事件冒泡到父组件
      if (!this.isPreview && !this.isView) {
        console.log('编辑模式下，阻止聊天功能，但允许选中组件');
        // 不调用 event.stopPropagation()，让事件冒泡到父组件的 onTap
        return;
      }

      // 预览模式下，阻止事件冒泡，执行聊天功能
      event.stopPropagation();
      this.handleSetChat(item);
    },
    handleSetChat(item){
      // 如果刚刚拖动过，不触发聊天功能
      if (this.hasMoved) return;

      // 如果拖动刚结束（200ms内），也不触发聊天功能
      const timeSinceDragEnd = Date.now() - this.dragEndTime;
      if (this.dragEndTime > 0 && timeSinceDragEnd < 200) {
        console.log('拖动刚结束，忽略点击事件');
        return;
      }

      // 执行聊天功能
      this.handelSetChatOpenStatus(false,item)
      this.chatCount = 0
      // this.$store.commit('chatInfo/handleCleaCount')
      this.$emit('setOpenChat',item)
      console.log(item)
    }
  }
}
</script>



<style scoped lang="scss">
li{
  list-style: none;
}
.chat_en{
  position: fixed;
  z-index: 999;
  top:0.625rem;
  left:0.625rem;
  padding:0.625rem;
  box-sizing: border-box;
  font-size:0.875rem;
  color:#fff;
  text-align: center;
  user-select: none;

  // 预览模式下可拖动
  &.draggable {
    cursor: move;

    &:hover {
      opacity: 0.9;
      transform: scale(1.02);
      transition: all 0.2s ease;
    }

    &:active {
      transform: scale(0.98);
      opacity: 0.8;
    }
  }

  // 编辑模式下默认指针
  &.editable {
    cursor: pointer;
  }

  // 预览模式下的右侧定位样式
  &.draggable[style*="right: 20px"] {
    left: auto !important;
    right: 20px !important;
  }

  // 操作工具栏样式
  .action-toolbar {
    position: absolute;
    top: -12px;
    right: -12px;
    display: flex;
    gap: 4px;
    z-index: 1000;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    padding: 2px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.8);
  }

  .action-button {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: white;
    transition: all 0.2s ease;
    border: 1px solid rgba(255, 255, 255, 0.8);

    &:hover {
      transform: scale(1.1);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }

    &:active {
      transform: scale(0.95);
    }

    i {
      font-size: 9px;
    }
  }

  .delete-btn {
    background: linear-gradient(135deg, #ff6b6b, #ee5a52);
    cursor: pointer;

    &:hover {
      background: linear-gradient(135deg, #ff5252, #e53935);
    }
  }

  .drag-btn {
    background: linear-gradient(135deg, #4ecdc4, #44a08d);
    cursor: move;

    &:hover {
      background: linear-gradient(135deg, #26d0ce, #2a9d8f);
    }
  }
}
.chat_list{
  display: flex;
  width:100%;
  align-items: center;
  margin:0.125rem 0;
  background:#f7c25c;
  border:1px solid #d3ebf6;
  cursor: pointer;
  padding:0.0625rem 0.125rem;
  img{
    display: block;
    width:1.875rem;
    margin-right:0.1875rem;
  }
}
.chat_ds{
  &.blink {
    animation: messageAlert 1s infinite;
  }
}

@keyframes messageAlert {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0.3;
  }
}
</style>