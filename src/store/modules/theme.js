import Vue from 'vue';

const state = {
  currentTheme: localStorage.getItem('currentTheme') || '',
  themeList: JSON.parse(localStorage.getItem('themeList') || '[]')
};

const mutations = {
  SET_CURRENT_THEME(state, theme) {
    state.currentTheme = theme;
    localStorage.setItem('currentTheme', theme);
  },
  SET_THEME_LIST(state, list) {
    state.themeList = list;
    localStorage.setItem('themeList', JSON.stringify(list));
  }
};

const actions = {
  setCurrentTheme({ commit }, theme) {
    commit('SET_CURRENT_THEME', theme);
  },
  setThemeList({ commit }, list) {
    commit('SET_THEME_LIST', list);
  },
  initTheme({ commit, state }, { currentTheme, themeList }) {
    if (themeList && themeList.length) {
      commit('SET_THEME_LIST', themeList);
    }

    if (currentTheme) {
      commit('SET_CURRENT_THEME', currentTheme);
    } else if (state.currentTheme && themeList && themeList.length) {
      // 如果没有指定当前主题但有存储的主题，使用存储的主题
      const themeExists = themeList.some(item => item.name === state.currentTheme);
      if (!themeExists && themeList.length > 0) {
        // 如果存储的主题不在列表中，使用第一个主题
        commit('SET_CURRENT_THEME', themeList[0].name);
      }
    }
  }
};

const getters = {
  currentTheme: state => state.currentTheme,
  themeList: state => state.themeList,
  themeVariable: state => {
    let style = {};
    let themeVariable = {};

    if (state.themeList.length && state.currentTheme) {
      const theme = state.themeList.find(item => item.name === state.currentTheme);
      themeVariable = theme?.variable || {};
    }

    if (themeVariable && typeof themeVariable === "object") {
      Object.keys(themeVariable).forEach(key => {
        if (key.startsWith('--')) {
          style[key] = Vue.prototype.getColor(themeVariable[key]);
        } else {
          style[`--${key}`] = Vue.prototype.getColor(themeVariable[key]);
        }
      });
    }

    return style;
  }
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};