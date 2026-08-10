const state = {
      chatBase:{
          chatCount: 0,
          msg:{}
      },
      chatList:[],
      // 存储打开过的会话信息，避免组件销毁时丢失
      setChatList:[]
}


const mutations = {
    handleSetChatCount(state, payload) {
        state.chatBase = payload
    },
    handleCleaCount(state, payload) {
        state.chatBase = {
            chatCount: 0,
            msg:{}
        }
    },

    handleSetChatList(state, payload) {
        state.chatList = payload
        console.log('----这是目前打开过的会话',state.chatList)
    },

    handleClearChatList(state, payload) {
        state.chatList = []
    },

    // 管理setChatList的mutations
    handleSetChatListData(state, payload) {
        state.setChatList = payload
        console.log('----这是目前打开过的会话setChatList',state.setChatList)
    },

    handleClearChatListData(state, payload) {
        state.setChatList = []
    },

    // 添加或更新setChatList中的项
    handleUpdateChatListItem(state, payload) {
        const { setId, groupId } = payload;
        let existingIndex = state.setChatList.findIndex(item => item.setId === setId);
        if (existingIndex !== -1) {
            state.setChatList[existingIndex].groupId = groupId;
        } else {
            state.setChatList.push({ setId, groupId });
        }
        console.log('----更新setChatList',state.setChatList)
    },

}

export default {
    namespaced: true,
    state,
    mutations,
}