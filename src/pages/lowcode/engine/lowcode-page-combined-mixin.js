/**
 * @fileoverview 低代码页面合并混入器 - 提供页面配置、组件管理、主题设置、参数管理等通用功能
 * @author jq
 * @version 1.0.0
 * @since 2025
 */

import {
  ref,
  computed,
  watch,
  onMounted,
  provide,
  getCurrentInstance,
  nextTick
} from 'vue'
import { useRoute, useRouter, useStore, useHttp, useMessage } from '@/common/vueApi.js'
import cloneDeep from "lodash/cloneDeep"
import "animate.css"

import { addCollection } from "@iconify/vue2"
// import carbon from "@iconify/json/json/carbon.json"
// import mdiLight from "@iconify/json/json/mdi-light.json"
// import ri from "@iconify/json/json/ri.json"

import { $selectOne } from "@/common/http"
import { formatStyleData } from "@/pages/lowcode/vendor/datav/common/index.js"

import { buildComponentsTree } from "../utils/common"
import { pageCompCols } from "../components/property/columns"

/**
 * 低代码页面组合式函数
 * @function useLowcodePage
 * @description 使用 Composition API 实现的低代码页面功能
 * @returns {Object} 包含所有响应式数据、计算属性和方法的对象
 */
export function useLowcodePage() {
  const instance = getCurrentInstance()
  const { $set, $nextTick } = instance.proxy
  
  // 使用 vueApi 工具函数
  const $route = useRoute()
  const $store = useStore()
  const $http = useHttp()
  const $message = useMessage()

  // ===== 响应式数据 =====
  /**
   * 页面编号
   * @type {import('vue').Ref<string|null>}
   */
  const pageNo = ref(null)

  /**
   * 页面配置对象
   * @type {import('vue').Ref<Object|null>}
   */
  const pageConfig = ref(null)

  /**
   * 页面组件列表
   * @type {import('vue').Ref<Array>}
   */
  const components = ref([])

  /**
   * 锚点名称
   * @type {import('vue').Ref<string>}
   */
  const anchorName = ref("")

  /**
   * 路由参数
   * @type {import('vue').Ref<Object>}
   */
  const queryOptions = ref({})

  /**
   * 页面公共参数
   * @type {import('vue').Ref<Object>}
   */
  const pageParams = ref({})

  /**
   * 页面公共参数模型
   * @type {import('vue').Ref<Object>}
   */
  const pageParamsModel = ref({})

  // ===== 计算属性 =====
  /**
   * 获取当前主题
   * @returns {string} 当前主题名称
   */
  const currentTheme = computed(() => $store.state.theme.currentTheme)

  /**
   * 获取主题列表
   * @returns {Array} 主题列表
   */
  const themeList = computed(() => $store.getters['theme/themeList'])

  /**
   * 获取主题变量
   * @returns {Object} 主题变量对象
   */
  const themeVariable = computed(() => $store.getters['theme/themeVariable'])

  /**
   * 计算内容区域宽度
   * @returns {string} 格式化后的宽度值（px或%）
   */
  const contentAreaWidth = computed(() => {
    let width = pageConfig.value?.content_area_width || 1400
    return typeof width === "string" && width?.includes("%")
      ? width
      : `${parseFloat(width)}px`
  })

  /**
   * 获取页面样式配置
   * @returns {Object} 格式化后的样式对象
   */
  const setStyle = computed(() => {
    let style = {}
    if (pageConfig.value?.page_style_json_data) {
      style = cloneDeep(pageConfig.value?.page_style_json_data)
    }
    return formatStyleData(style)
  })

  /**
   * 获取应用配置
   * @returns {Object} 应用配置对象
   */
  const appConfig = computed(() => {
    return pageConfig.value?.app_json_data || {}
  })

  /**
   * 获取页面信息
   * @returns {Object} 页面配置信息
   */
  const pageInfo = computed(() => {
    return pageConfig.value || {}
  })

  // ===== 监听器 =====
  /**
   * 监听当前主题变化
   */
  watch(currentTheme, (newValue, oldValue) => {
    console.log("currentTheme", newValue)
    if (newValue !== oldValue) {
      setThemeVariable()
    }
  })

  // ===== 方法 =====
  /**
   * 设置主题变量到DOM
   * @description 将主题变量转换为CSS样式并应用到body元素
   */
  const setThemeVariable = () => {
    const themeVariableValue = Object.keys(themeVariable.value).reduce(
      (pre, cur) => {
        pre += `${cur}: ${themeVariable.value[cur]};`
        return pre
      },
      ""
    )
    document.body.setAttribute("style", themeVariableValue)
  }

  /**
   * 获取页面配置数据
   * @async
   * @description 从服务器获取页面配置，并初始化页面组件和参数
   * @throws {Error} 当请求失败时抛出错误
   */
  const getPageConfig = async () => {
    console.log("initPage")
    const url = `/config/select/srvpage_cfg_page_guest_select`
    const req = {
      serviceName: "srvpage_cfg_page_guest_select",
      colNames: ["*"],
      condition: [
        {
          colName: "page_no",
          ruleType: "eq",
          value: pageNo.value,
        },
      ],
    }
    const { data, ok, msg } = await $selectOne(url, req)
    if (ok) {
      let newData = initPageConfig(data)
      initComponents(newData)
      initPageParams()
    } else if (msg) {
      $message.error(msg)
    } else {
      $message.info("无数据！")
    }
  }

  /**
   * 初始化页面配置
   * @param {Object} data - 原始页面配置数据
   * @returns {Object} 处理后的页面配置数据
   * @description 解析JSON字段，设置页面配置，初始化主题
   */
  const initPageConfig = (data) => {
    Object.keys(data).forEach((key) => {
      if (key && data[key] && key.indexOf("_json") !== -1) {
        try {
          data[`${key}_data`] = JSON.parse(data[key])
        } catch (e) {
          console.error(e)
        }
      }
    })
    pageConfig.value = data
    // 使用Vuex初始化主题
    if (data?.app_json_data) {
      let currentThemeValue = data.app_json_data.current_theme
      if (
        localStorage.currentTheme &&
        localStorage.getItem("currentTheme") !== currentThemeValue
      ) {
        currentThemeValue = localStorage.getItem("currentTheme")
      }
      if (!currentThemeValue && data?.app_json_data?.theme_list) {
        currentThemeValue = data.app_json_data.theme_list[0].name
      }
      $store.dispatch('theme/initTheme', {
        currentTheme: currentThemeValue,
        themeList: data.app_json_data.theme_list || [],
      })
    }

    return data
  }

  /**
   * 初始化页面组件
   * @async
   * @param {Object} data - 页面配置数据
   * @description 处理组件配置，设置组件类型和属性，构建组件树
   */
  const initComponents = async (data) => {
    let list = data?.page_row_json_data?.component_json
    if (instance.proxy.getPageComponents && typeof instance.proxy.getPageComponents === "function") {
      list = await instance.proxy.getPageComponents(list)
    }
    const component_json = list?.map(
      (item) => {
        if (item.com_type === "layout") {
          const layout_party = item?.layout_json?.layout_party
          if (layout_party === "页面") {
            item.type = "container"
            item.component = "lc-container"
          } else if (layout_party === "布局") {
            item.type = "layout"
            item.component = "lc-block"
          } else {
            item.type = "content"
            item.component = "lc-content"
          }
          if (item.layout_json?.child_num) {
            item.child_num = item.layout_json.child_num
          }
        } else {
          item.component = "page-item"
          if (item.com_option?.includes("悬浮可拖动")) {
            item.component = "float-component"
          }
        }
        item.data = {}
        pageCompCols.forEach((col) => {
          if (item[col]) {
            item.data[col] = item[col]
          }
        })
        if (item.id) {
          item.data.id = item.id
        }
        const keys = ["component", "type", "_type"]
        keys.forEach((key) => {
          if (item.data[key]) {
            delete item.data[key]
          }
        })

        return item
      }
    )
    if (!Array.isArray(component_json)) {
      components.value = []
      return
    }
    components.value = buildComponentsTree(component_json)?.sort(
      (a, b) => a.com_seq - b.com_seq
    )
  }

  /**
   * 根据页面配置的请求查询页面全局参数
   * @async
   * @returns {Object|undefined} 查询到的页面全局参数数据，如果没有配置或查询失败则返回undefined
   * @description 通过页面配置的服务请求获取全局参数，并更新queryOptions
   */
  const getPageInitQueryOptions = async () => {
    // 页面请求
    if (pageInfo.value.cols_map_json_data && pageInfo.value.srv_req_json_data) {
      const queryOptionsValue = queryOptions.value || {}
      const params = {
        ...queryOptionsValue,
      }
      const req = JSON.parse(
        instance.proxy.renderStr(
          JSON.stringify(pageInfo.value.srv_req_json_data),
          params
        )
      )
      const app = req.mapp || sessionStorage.getItem("activeApp")
      const url = `/${app}/select/${req.serviceName}`
      const res = await $http.post(url, req)
      if (res?.data?.data?.length) {
        const data = res?.data?.data[0]
        const keys = Object.keys(pageInfo.value.cols_map_json_data)
        if (keys.length > 0) {
          keys.forEach((key) => {
            $set(
              queryOptions.value,
              key,
              data[pageInfo.value.cols_map_json_data[key]]
            )
          })
        }
        return data
      }
    } else {
      return
    }
  }

  /**
   * 根据页面配置的接口参数初始化页面参数
   * @returns {Object} 初始化的基础参数模型
   * @description 获取登录用户信息和路由参数，构建基础参数模型
   */
  const getInitParams = () => {
    // 获取登录用户信息
    const loginUserInfoStr = window.sessionStorage.getItem("current_login_user")
    let loginUserInfo = null
    try {
      loginUserInfo = loginUserInfoStr ? JSON.parse(loginUserInfoStr) : null
    } catch (e) {
      console.warn('解析登录用户信息失败:', e)
    }

    // 构建基础参数模型
    const basicParamsModel = {
      _isBindMobile: loginUserInfo?.mobile, // 是否绑定手机号
      _isAnonymLogin: loginUserInfo?.login_state === "anon_login", // 是否匿名登录
      _isVerified: // 是否已认证用户
        loginUserInfo &&
        loginUserInfo?.login_state !== "anon_login" &&
        loginUserInfo.mobile &&
        loginUserInfo.hasOwnProperty("otherTenantInfos") &&
        loginUserInfo.otherTenantInfos.length > 0,
    }

    // 将路由参数添加到基础参数模型中
    if (queryOptions.value && Object.keys(queryOptions.value).length > 0) {
      Object.keys(queryOptions.value).forEach((key) => {
        basicParamsModel[key] = {
          value: queryOptions.value[key],
        }
      })
    }

    return basicParamsModel
  }

  /**
   * 初始化页面参数
   * @async
   * @returns {Promise<boolean>} 初始化完成后返回true
   * @description 根据页面配置的参数定义初始化页面参数，支持V1和V2两种参数格式
   */
  const initPageParams = async () => {
    const initParams = getInitParams()

    return new Promise((resolve) => {
      const pageInfoValue = pageConfig.value || pageInfo.value
      // V1版本参数配置
      const paraJson = pageInfoValue?.interface_json_data || pageInfoValue?.para_json
      // V2版本参数配置
      const paraJsonV2 = pageInfoValue?.para_with_map_json_data || null

      console.log("初始化页面参数 paraJson:", paraJson)
      pageParams.value = {}

      // 处理V1版本参数（无URL参数时）
      if (
        (!queryOptions.value || Object.keys(queryOptions.value).length === 0) &&
        Array.isArray(paraJson) &&
        paraJson.length > 0
      ) {
        // 设置默认值
        paraJson.forEach((item) => {
          item.value = item.default_val || ""
        })

        // 处理每个参数
        for (const param of paraJson) {
          const keyName = param.para_name || param.para
          const urlParamsKeys = queryOptions.value ? Object.keys(queryOptions.value) : []

          // 优先使用URL参数，否则使用默认值
          param.value = urlParamsKeys.includes(keyName)
            ? queryOptions.value[keyName]
            : param.default_val

          $set(pageParams.value, keyName, param)
        }

        pageParamsModel.value = instance.proxy.bxDeepClone
          ? instance.proxy.bxDeepClone(pageParams.value)
          : cloneDeep(pageParams.value)
      }
      // 处理V1版本参数（有URL参数时）
      else if (Array.isArray(paraJson) && paraJson.length > 0) {
        console.log("-- 页面参数V1初始化成功 --")
        console.log(paraJson, queryOptions.value)

        for (const param of paraJson) {
          const keyName = param.para_name || param.para
          const urlParamsKeys = queryOptions.value ? Object.keys(queryOptions.value) : []

          // 优先使用URL参数，否则使用默认值
          param.value = urlParamsKeys.includes(keyName)
            ? queryOptions.value[keyName]
            : param.default_val

          $set(pageParams.value, keyName, param)
        }

        pageParamsModel.value = cloneDeep(pageParams.value)
      }

      // 处理V2版本参数
      if (paraJsonV2 && paraJsonV2.length > 0) {
        console.log("-- 页面参数V2初始化成功 --")
        const model = {}

        for (const param of paraJsonV2) {
          // 检查URL参数中是否有对应值
          let hasUrlValue = false
          for (const key in queryOptions.value) {
            if (key === param.para && queryOptions.value[key]) {
              param.value = queryOptions.value[key]
              hasUrlValue = true
              break
            }
          }

          // 如果URL中没有对应参数，使用默认值
          if (!hasUrlValue) {
            param.value = param.default_val || ""
          }

          model[param.para] = param
          $set(pageParams.value, param.para, param)
        }

        pageParamsModel.value = instance.proxy.deepClone
          ? instance.proxy.deepClone(model)
          : cloneDeep(model)
      }

      // 合并初始化参数
      pageParamsModel.value = {
        ...pageParamsModel.value,
        ...initParams,
      }

      resolve(true)
    })
  }

  /**
   * 设置页面参数
   * @param {string} key - 参数键名
   * @param {*} val - 参数值
   * @description 更新指定键名的页面参数值
   */
  const setPageParams = (key, val) => {
    // 组件输入页面的参数
    // pageParams.value[key] = val
    console.log("接收参数", key, val)
    if (pageParamsModel.value && key) {
      for (let p in pageParamsModel.value) {
        if (p == key && pageParamsModel.value[key]) {
          console.log("--", val)
          let item = cloneDeep(pageParamsModel.value[key])
          item.value = val
          $set(pageParamsModel.value, key, item)
        }
      }
    }
  }

  /**
   * 页面初始化函数
   * @async
   * @description 初始化页面参数、获取页面配置，并处理锚点跳转
   */
  const pageInit = async () => {
    // 获取路由查询参数
    queryOptions.value = $route.query
    // 获取页面编号（优先从query获取，其次从params获取）
    pageNo.value = $route.query.pageNo || $route.params.pageNo

    if (pageNo.value) {
      // 获取页面配置并初始化组件
      getPageConfig().then(() => {
        // 等待DOM更新后处理锚点跳转
        nextTick(() => {
          const anchorNameValue = $route.query.anchorName || $route.params.anchorName
          if (anchorNameValue) {
            anchorName.value = anchorNameValue
            const ele = document.getElementById(anchorNameValue)
            if (ele) {
              // 平滑滚动到锚点位置
              ele.scrollIntoView({
                behavior: "smooth",
                block: "start",
                inline: "nearest",
              })
            } else {
              console.error("未找到锚点:", anchorNameValue)
            }
          }
        })
      })
    }
  }

  // 立即执行页面初始化
  pageInit()

  /**
   * 组件挂载后的初始化操作
   */
  onMounted(async () => {
    // 异步加载并添加图标集合
    const [
      carbon,
      mdiLight,
      ri
    ] = await Promise.all([
      import(/* webpackChunkName: "iconify" */ "@iconify/json/json/carbon.json"),
      import(/* webpackChunkName: "iconify" */ "@iconify/json/json/mdi-light.json"),
      import(/* webpackChunkName: "iconify" */ "@iconify/json/json/ri.json")
    ]);
    
    addCollection(carbon.default || carbon);
    addCollection(mdiLight.default || mdiLight);
    addCollection(ri.default || ri);
    // 设置主题变量
    setThemeVariable()
  })

  // ===== Provide =====
  /**
   * 向子组件提供页面配置和参数的访问方法
   */
  provide('getPageConfig', () => pageConfig.value)
  provide('getPageParams', () => pageParams.value)

  return {
    // 响应式数据
    pageNo,
    pageConfig,
    components,
    anchorName,
    queryOptions,
    pageParams,
    pageParamsModel,
    // 计算属性
    currentTheme,
    themeList,
    themeVariable,
    contentAreaWidth,
    setStyle,
    appConfig,
    pageInfo,
    // 方法
    setThemeVariable,
    getPageConfig,
    initPageConfig,
    initComponents,
    getPageInitQueryOptions,
    getInitParams,
    initPageParams,
    setPageParams,
  }
}

/**
 * 默认导出的混入器（兼容原有用法）
 * @mixin LowcodePageCombinedMixin
 * @description 合并了低代码页面和页面参数的所有功能，同时支持 Vue 2.7 setup 语法糖和传统 mixin 方式
 */
export default {
  setup() {
    const {
      // 响应式数据
      pageNo,
      pageConfig,
      components,
      anchorName,
      queryOptions,
      pageParams,
      pageParamsModel,
      // 计算属性
      currentTheme,
      themeList,
      themeVariable,
      contentAreaWidth,
      setStyle,
      appConfig,
      pageInfo,
      // 方法
      setThemeVariable,
      getPageConfig,
      initPageConfig,
      initComponents,
      getPageInitQueryOptions,
      getInitParams,
      initPageParams,
      setPageParams,
    } = useLowcodePage()

    return {
      // 响应式数据
      pageNo,
      pageConfig,
      components,
      anchorName,
      queryOptions,
      pageParams,
      pageParamsModel,
      // 计算属性
      currentTheme,
      themeList,
      themeVariable,
      contentAreaWidth,
      setStyle,
      appConfig,
      pageInfo,
      // 方法
      setThemeVariable,
      getPageConfig,
      initPageConfig,
      initComponents,
      getPageInitQueryOptions,
      getInitParams,
      initPageParams,
      setPageParams,
    }
  }
}