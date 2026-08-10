/**
 * @fileoverview 低代码页面混入器 (Composition API版本) - 提供页面配置、组件管理、主题设置等通用功能
 * @author jq
 * @version 1.0.0
 * @since 2025
 */

import { ref, computed, watch, onMounted, provide, nextTick } from 'vue'
import { useRoute, useStore } from '@/common/vueApi.js'
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
 * @description 为低代码页面提供通用的配置管理、组件初始化、主题设置等功能
 * @returns {Object} 包含页面相关的响应式数据和方法
 */
export function useLowcodePage() {
  const store = useStore()
  const route = useRoute()

  // 响应式数据
  const pageNo = ref(null)
  const pageConfig = ref(null)
  const components = ref([])
  const anchorName = ref("")

  // 计算属性
  const currentTheme = computed(() => store.state.theme.currentTheme)
  const themeList = computed(() => store.getters['theme/themeList'])
  const themeVariable = computed(() => store.getters['theme/themeVariable'])

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
      await initComponents(newData)
      // initPageParams() // 需要在使用的组件中实现
    } else if (msg) {
      // this.$message.error(msg) // 需要在使用的组件中实现消息提示
      console.error(msg)
    } else {
      // this.$message.info("无数据！") // 需要在使用的组件中实现消息提示
      console.info("无数据！")
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
      store.dispatch('theme/initTheme', {
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

    // 如果有自定义的getPageComponents方法，需要在使用的组件中传入
    // if (getPageComponents && typeof getPageComponents === "function") {
    //   list = await getPageComponents(list)
    // }

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
   * 初始化页面
   * @description 获取页面编号并初始化页面配置
   */
  const initPage = async () => {
    pageNo.value = route.query.pageNo || route.params.pageNo
    if (pageNo.value) {
      await getPageConfig()
      await nextTick(() => {
        let anchorNameValue = route.query.anchorName || route.params.anchorName
        if (anchorNameValue) {
          anchorName.value = anchorNameValue
          let ele = document.getElementById(anchorNameValue)
          if (ele) {
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
    }
  }

  // 监听主题变化
  watch(currentTheme, (newValue, oldValue) => {
    console.log("currentTheme", newValue)
    if (newValue !== oldValue) {
      setThemeVariable()
    }
  })

  // 组件挂载时的操作
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
    setThemeVariable()
  })

  // 提供给子组件的方法
  provide('getPageConfig', () => pageConfig.value)
  provide('getPageParams', () => {
    // 需要在使用的组件中实现pageParams
    return {}
  })

  return {
    // 响应式数据
    pageNo,
    pageConfig,
    components,
    anchorName,

    // 计算属性
    currentTheme,
    themeList,
    themeVariable,
    contentAreaWidth,
    setStyle,
    appConfig,

    // 方法
    setThemeVariable,
    getPageConfig,
    initPageConfig,
    initComponents,
    initPage
  }
}

/**
 * 默认导出的混入器（兼容原有用法）
 * @mixin LowcodePageMixin
 * @description 为低代码页面提供通用的配置管理、组件初始化、主题设置等功能
 */
export default {
  setup() {
    const {
      pageNo,
      pageConfig,
      components,
      anchorName,
      currentTheme,
      themeList,
      themeVariable,
      contentAreaWidth,
      setStyle,
      appConfig,
      setThemeVariable,
      getPageConfig,
      initPageConfig,
      initComponents,
      initPage
    } = useLowcodePage()

    // 在created生命周期中初始化页面
    initPage()

    return {
      pageNo,
      pageConfig,
      components,
      anchorName,
      currentTheme,
      themeList,
      themeVariable,
      contentAreaWidth,
      setStyle,
      appConfig,
      setThemeVariable,
      getPageConfig,
      initPageConfig,
      initComponents
    }
  }
}