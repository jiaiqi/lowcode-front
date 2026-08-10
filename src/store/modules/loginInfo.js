
const state = {
  logined: sessionStorage.getItem('isLogin') === 'true' || sessionStorage.getItem('logined') === 'true' || false,
  loginUser: sessionStorage.getItem('current_login_user')?JSON.parse(sessionStorage.getItem('current_login_user')) : {},
  bx_auth_ticket: sessionStorage.getItem('bx_auth_ticket') || '',
  expire_time: sessionStorage.getItem('expire_time') || '',
};

const mutations = {
  SET_LOGINED(state, logined) {
    state.logined = logined;
    sessionStorage.setItem('isLogin', logined);
    sessionStorage.setItem('logined', logined);
  },
  SET_LOGIN_USER(state, loginUser) {
    state.loginUser = loginUser;
    sessionStorage.setItem('current_login_user', JSON.stringify(loginUser));
  },
  SET_BX_AUTH_TICKET(state, bx_auth_ticket) {
    state.bx_auth_ticket = bx_auth_ticket;
    sessionStorage.setItem('bx_auth_ticket', bx_auth_ticket);
  },
  SET_EXPIRE_TIME(state, expire_time) {
    state.expire_time = expire_time;
    sessionStorage.setItem('expire_time', expire_time);
  }
};

const actions = {
  setLogined({ commit }, logined) {
    commit('SET_LOGINED', logined);
  },
  setLoginUser({ commit }, loginUser) {
    commit('SET_LOGIN_USER', loginUser);
  },
  setBxAuthTicket({ commit }, bx_auth_ticket) {
    commit('SET_BX_AUTH_TICKET', bx_auth_ticket);
  },
  setExpireTime({ commit }, expire_time) {
    commit('SET_EXPIRE_TIME', expire_time);
  },
  initLoginInfo({ commit },loginResponse) {
    const logined = !!loginResponse?.bx_auth_ticket;
    if(logined){
      commit('SET_LOGINED', logined);
      commit('SET_LOGIN_USER', loginResponse?.login_user_info);
      commit('SET_BX_AUTH_TICKET', loginResponse?.bx_auth_ticket);
      commit('SET_EXPIRE_TIME', loginResponse?.expire_time);
    }
  },
  logout({ commit }) {
    commit('SET_LOGINED', false);
    commit('SET_LOGIN_USER', {});
    commit('SET_BX_AUTH_TICKET', '');
    commit('SET_EXPIRE_TIME', '');
  },
  clearLoginInfo({ commit }) {
    commit('SET_LOGINED', false);
    commit('SET_LOGIN_USER', {});
    commit('SET_BX_AUTH_TICKET', '');
    commit('SET_EXPIRE_TIME', '');
  }
};

const getters = {
  logined: state => state.logined,
  loginUser: state => state.loginUser,
  bx_auth_ticket: state => state.bx_auth_ticket,
  expire_time: state => state.expire_time,
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};