import Vue from "vue";
import Vuex from "vuex";
import theme from "./modules/theme";
import pageEvent from "./modules/pageEvent";
import loginInfo from "./modules/loginInfo";
import chatInfo from "./modules/chatInfo";

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    theme,
    pageEvent,
    loginInfo,
    chatInfo,
  },
  strict: false,
});
