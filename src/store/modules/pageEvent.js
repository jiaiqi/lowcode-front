import Vue from 'vue'
import { $http } from '@/common/http'
const state = {
  // 页面变量
  pageVariables: {},
  // 事件表
  events: [],
  finalEvents: [],
  compEventsMap: {},
  // 组件变量
  compVariables: {},
  // 页面配置
  pageConfig: {},
}

const mutations = {
  // 设置页面变量
  SET_PAGE_VARIABLE(state, { key, value }) {
    if (!key) return;
    Vue.set(state.pageVariables, key, value)
  },
  // 批量设置页面变量
  SET_PAGE_VARIABLES(state, variables) {
    if (!variables || typeof variables !== 'object') return;
    state.pageVariables = { ...state.pageVariables, ...variables }
  },
  // 清空页面变量
  CLEAR_PAGE_VARIABLES(state) {
    state.pageVariables = {}
  },
  // 设置事件表
  SET_EVENTS(state, events) {
    state.events = Array.isArray(events) ? events : []
  },
  // 设置最终事件表
  SET_FINAL_EVENTS(state, events) {
    state.finalEvents = Array.isArray(events) ? events : []
  },
  // 添加事件
  ADD_EVENT(state, event) {
    if (event && typeof event === 'object') {
      state.events.push(event)
    }
  },
  // 移除事件
  REMOVE_EVENT(state, eventId) {
    if (eventId) {
      state.events = state.events.filter(event => event.id !== eventId)
    }
  },
  // 清空事件表
  CLEAR_EVENTS(state) {
    state.events = []
    state.finalEvents = []
  },
  // 设置组件事件映射
  SET_COMP_EVENTS_MAP(state, data) {
    state.compEventsMap = data || {}
  },
  // 清空组件事件映射
  CLEAR_COMP_EVENTS_MAP(state) {
    state.compEventsMap = {}
  },
  // 设置组件变量
  SET_COMP_VARIABLE(state, { componentId, key, value }) {
    if (!componentId || !key) return;
    if (!state.compVariables[componentId]) {
      Vue.set(state.compVariables, componentId, {})
    }
    Vue.set(state.compVariables[componentId], key, value)
  },
  // 设置组件变量（带页面变量同步）
  SET_COMP_VARIABLE_WITH_PAGE_SYNC(state, { componentId, key, value }) {
    if (!componentId || !key) return;

    // 设置组件变量
    if (!state.compVariables[componentId]) {
      Vue.set(state.compVariables, componentId, {})
    }
    Vue.set(state.compVariables[componentId], key, value)

    // 同步到页面变量
    const pageVarKey = state.finalEvents.find(
      item => item.event_handler === '设置页面变量' &&
        item.own_page_com_no === componentId &&
        item.colCol === key
    )?.pageCol;

    if (pageVarKey) {
      Vue.set(state.pageVariables, pageVarKey, value)
    }
  },
  // 清空组件变量
  CLEAR_COMP_VARIABLES(state, componentId) {
    if (componentId) {
      Vue.set(state.compVariables, componentId, {})
    } else {
      state.compVariables = {}
    }
  },
  // 设置页面配置
  SET_PAGE_CONFIG(state, config) {
    state.pageConfig = config || {}
    // 初始化页面变量
    if (Array.isArray(config?.interface_json_data) && config.interface_json_data.length) {
      config.interface_json_data.forEach(item => {
        if (item?.para) {
          Vue.set(state.pageVariables, item.para, item.value || item.default_val || null)
        }
      })
    }
  },
}

const actions = {
  // 设置页面变量
  setPageVariable({ commit }, { key, value }) {
    if (!key) return;
    commit('SET_PAGE_VARIABLE', { key, value })
  },
  // 批量设置页面变量
  setPageVariables({ commit }, variables) {
    if (!variables || typeof variables !== 'object') return;
    commit('SET_PAGE_VARIABLES', variables)
  },
  // 清空页面变量
  clearPageVariables({ commit }) {
    commit('CLEAR_PAGE_VARIABLES')
  },
  // 设置事件表
  setEvents({ commit }, events) {
    commit('SET_EVENTS', events)
  },
  // 添加事件
  addEvent({ commit }, event) {
    if (event && typeof event === 'object') {
      commit('ADD_EVENT', event)
    }
  },
  // 移除事件
  removeEvent({ commit }, eventId) {
    if (eventId) {
      commit('REMOVE_EVENT', eventId)
    }
  },
  // 清空事件表
  clearEvents({ commit }) {
    commit('CLEAR_EVENTS')
    commit('CLEAR_COMP_EVENTS_MAP')
  },
  // 清空组件事件映射
  clearCompEventsMap({ commit }) {
    commit('CLEAR_COMP_EVENTS_MAP')
  },
  // 设置组件变量
  setCompVariable({ commit }, { componentId, key, value }) {
    if (!componentId || !key) return;
    commit('SET_COMP_VARIABLE', { componentId, key, value })
  },
  // 设置组件变量（带页面变量同步）
  setCompVariableWithPageSync({ commit }, { componentId, key, value }) {
    if (!componentId || !key) return;
    commit('SET_COMP_VARIABLE_WITH_PAGE_SYNC', { componentId, key, value })
  },
  // 清空组件变量
  clearCompVariables({ commit }, componentId) {
    commit('CLEAR_COMP_VARIABLES', componentId)
  },
  // 获取页面事件
  async getPageEvents({ commit }, pageNo) {
    if (!pageNo) {
      console.warn('getPageEvents: pageNo is required');
      return;
    }

    const req = {
      "serviceName": "srvpage_cfg_event_select",
      "colNames": ["*"],
      "condition": [{ "colName": "own_page_no", "ruleType": "eq", "value": pageNo }]
    }

    const url = `/config/select/srvpage_cfg_event_select`

    try {
      const response = await $http.post(url, req)

      if (response.data.state === 'SUCCESS') {
        const events = Array.isArray(response.data.data) ? response.data.data : [];
        commit('SET_EVENTS', events)

        if (events.length > 0) {
          // 处理最终事件表
          const finalEvents = [];
          events.forEach(item => {
            if (item.page_interface_cols && item.com_interface_cols) {
              try {
                const pageCols = item.page_interface_cols.split(',');
                const comCols = item.com_interface_cols.split(',');

                if (Array.isArray(pageCols) && Array.isArray(comCols) && pageCols.length && pageCols.length === comCols.length) {
                  pageCols.forEach((pageCol, index) => {
                    if (pageCol && comCols[index]) {
                      finalEvents.push({
                        own_page_no: item.own_page_no,
                        own_page_com_no: item.own_page_com_no,
                        event_handler: item.event_handler,
                        pageCol: pageCol,
                        colCol: comCols[index]
                      });
                    }
                  });
                }
              } catch (error) {
                console.warn('Error processing event columns:', error);
              }
            }
          });

          commit('SET_FINAL_EVENTS', finalEvents);

          // 构建组件事件映射
          const compEventsMap = events.reduce((acc, item) => {
            if (item.own_page_com_no) {
              if (!acc[item.own_page_com_no]) {
                acc[item.own_page_com_no] = [];
              }
              acc[item.own_page_com_no].push(item);
            }
            return acc;
          }, {});

          commit('SET_COMP_EVENTS_MAP', compEventsMap);
        } else {
          // 清空事件相关状态
          commit('SET_FINAL_EVENTS', []);
          commit('SET_COMP_EVENTS_MAP', {});
        }
      } else if (response.data.resultMessage) {
        console.warn('获取页面事件失败:', response.data.resultMessage);
        // 清空事件相关状态
        commit('SET_EVENTS', []);
        commit('SET_FINAL_EVENTS', []);
        commit('SET_COMP_EVENTS_MAP', {});
      }
    } catch (error) {
      console.error('获取页面事件失败:', error);
      // 清空事件相关状态
      commit('SET_EVENTS', []);
      commit('SET_FINAL_EVENTS', []);
      commit('SET_COMP_EVENTS_MAP', {});
    }
  }
}

const getters = {
  // 获取页面变量
  getPageVariable: (state) => (key) => {
    if (!key) return undefined;
    return state.pageVariables[key]
  },
  // 获取所有页面变量
  getAllPageVariables: (state) => {
    return state.pageVariables || {}
  },
  // 获取事件表
  getEvents: (state) => {
    return state.events || []
  },
  // 根据ID获取事件
  getEventById: (state) => (id) => {
    if (!id) return undefined;
    return state.events.find(event => event.id === id)
  },
  // 获取组件事件映射
  getCompEventsMap: (state) => {
    return state.compEventsMap || {}
  },
  // 根据组件ID获取事件
  getCompEvents: (state) => (componentId) => {
    if (!componentId) return [];
    return state.compEventsMap[componentId] || []
  },
  // 获取组件变量
  getCompVariable: (state) => (componentId, key) => {
    if (!componentId || !key) return undefined;
    return state.compVariables[componentId]?.[key]
  },
  // 根据组件ID获取所有变量
  getAllCompVariables: (state) => (componentId) => {
    if (!componentId) return {};
    return state.compVariables[componentId] || {}
  },
  // 获取所有组件变量
  getAllCompVariablesMap: (state) => {
    return state.compVariables || {}
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}