<template>
   <el-dialog
       class="customDialogClass"
       :title="safeChatItem.chat_type"
       @close="closeDialog"
       :visible="activeChat"
       width="800px"
       :append-to-body="true"
       :close-on-click-modal="false"
       :destroy-on-close="true"
   >
     <div style="height: 600px" v-if="externalUrl && showIframe">
       <iframe
         :key="iframeKey"
         width="100%"
         height="100%"
         :src="externalUrl"
         @load="onIframeLoad"
       ></iframe>
     </div>
   </el-dialog>
</template>
<script>
import * as sockApi from './wssocket.js'
//设置用于进行在线咨询的用户no
const userInfo =sessionStorage.getItem("current_login_user")
    ? JSON.parse(sessionStorage.getItem("current_login_user"))
    : null;
function getUserNo(vm) {
  if (userInfo && userInfo.user_no) {
    sessionStorage.setItem("chart_user_no", userInfo.user_no);
    return userInfo.user_no;
  }
  // 优先从 sessionStorage 获取 chart_user_no
  let sessionUserNo =sessionStorage.getItem("chart_user_no");
  if (sessionUserNo) {
    return sessionUserNo;
  }
  // 生成随机 user_no
  const randomNo = vm.handleRandom();
  sessionStorage.setItem("chart_user_no", randomNo);
  return randomNo;
}
export default{
  name: "chat-box",
  data(){
    return{
      baseInfo:{
        user_no: getUserNo(this),
        group_id:2,
        msgCount:0,
      },
      externalUrl:null,
      showIframe: false,
      iframeKey: 0,
    }
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    chatItem:{
      type:Object,
      default: () => {
        return {
          chat_type:'在线咨询',
          code:2
        };
      },
    }
  },
  computed: {
    activeChat: {
      get() {
        if(this.visible){
        }
        return this.visible;
      },
      set(val) {
        this.$emit('update:visible', val);
      }
    },
    safeChatItem() {
      return this.chatItem || { chat_type: '在线咨询', code: 2 };
    },
    // 从store中获取setChatList
    setChatList() {
      return this.$store.state.chatInfo.setChatList;
    }
  },
  watch: {
    visible: {
      handler(newVal) {
        if (newVal) {
          // 弹窗打开时初始化
          this.closeSkt();
          this.initLiveUser();
        } else {
          // 弹窗关闭时清理
          this.destroyIframe();
          this.externalUrl = null;
          this.initClientSkt();
        }
      },
      immediate: true
    }
  },
  methods:{
    //随机用户no
    handleRandom(){
      // 生成唯一的12位随机数字字符串
      let timestamp = Date.now().toString(); // 毫秒时间戳
      let random = Math.floor(Math.random() * 1e6).toString().padStart(6, '0'); // 6位随机数
      let uniqueNo = (timestamp + random).slice(-12); // 保证12位
      return uniqueNo;
    },
    async initLiveUser(){
       let urls =`/email/operate/srvim_live_chat_add`;
       let req= [
         {
           "serviceName": "srvim_live_chat_add",
           "data": [
             {
               user_no:this.baseInfo.user_no,
               group_id:this.safeChatItem.code?this.safeChatItem.code:this.baseInfo.group_id
             }
           ],
         }
       ]

       let res = await this.$http.post(urls,req)
       if(res.data.resultCode!=='SUCCESS') return
       let ls = res.data.response[0];
       if(ls && ls.response){
         sessionStorage.setItem("loginInfo",JSON.stringify(ls.response));
         sessionStorage.setItem("accessToken", ls.response.accessToken);
         sessionStorage.setItem("refreshToken",  ls.response.refreshToken);
         sessionStorage.setItem('is_customer',ls.response.is_customer);
         let ids = ls.response.group_id;
         sessionStorage.setItem("cur_group_id", ids);
         this.externalUrl=window.APP_CONFIG.chatUrl+`?accessToken=${encodeURIComponent(ls.response.accessToken)}&refreshToken=${encodeURIComponent(ls.response.refreshToken)}&groupId=${encodeURIComponent(ids)}&userNo=${this.baseInfo.user_no}&is_customer=${ls.response.is_customer}`
         let obj={
             setId:this.safeChatItem.code?this.safeChatItem.code:this.baseInfo.group_id,
             groupId:Number(ids)
         }
         //将目前打开过的所有的会话都重新进行记录一次返回的group_id
         this.$store.commit('chatInfo/handleUpdateChatListItem', obj);
         // 同时更新原有的chatList用于其他地方使用
         this.$store.commit('chatInfo/handleSetChatList',this.setChatList)
         // 创建新的iframe
         this.createIframe();
       }
     },
    //初始化一个在线咨询使用的长连接通道,下一步将live_add接口放在这里进行使用
    initClientSkt() {
      let url = window.APP_CONFIG.sock;
      let accessToken =sessionStorage.getItem('accessToken');
      sockApi.connect(url,accessToken);
      let count=0
      // if(this.baseInfo.msgCount===0){
      //   count=0;
      // }
      sockApi.onMessage((cmd, msgInfo) => {
        console.log('----这是lc_pc获取的信息',msgInfo);
        if(msgInfo){
          count++
          let obj={
            chatCount: count,
            msg:msgInfo
          }
          this.$store.commit('chatInfo/handleSetChatCount',obj)
        }
      })
    },
    closeSkt(){
      console.log('关闭lc_sock')
      sockApi.close()
    },
    createIframe() {
      this.showIframe = true;
      this.iframeKey = Date.now();
    },
    destroyIframe() {
      this.showIframe = false;
      this.externalUrl = null; // 清空URL
      this.$nextTick(() => {
        this.iframeKey = Date.now(); // 强制更新key
      });
    },
    onIframeLoad() {
      console.log('iframe加载完成');
    },
    closeDialog(){
      // 执行关闭时的清理逻辑
      this.destroyIframe();
      this.externalUrl = null;
      this.initClientSkt();
      // 通知父组件关闭弹窗
      this.activeChat = false;
      // 重置消息计数
      this.$store.commit('chatInfo/handleSetChatCount',0)
    }
  },
}
</script>



<style scoped lang="scss">

</style>