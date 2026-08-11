/**
 * @fileoverview 低代码页面混入 - 提供页面配置、组件管理、主题设置等通用功能
 * @author jq
 * @version 1.0.0
 * @since 2025
 */

import { mapState, mapGetters, mapActions } from "vuex";

import cloneDeep from "lodash/cloneDeep";
import "animate.css";

import { addCollection } from "@iconify/vue2";

/**
 * iconify 单集合按需加载器（替代原 mounted 全量加载 3 个全集 JSON ≈2.3MB）。
 * - 静态图标已由 unocss 内联（含 material-symbols，故不再运行时加载该集合）
 * - 动态图标（页面配置里的 icon 字段）：?url 静态资源 + 运行时 fetch，
 *   避免 Vite 对动态 import 注入 preload 导致首屏预取大 JSON
 */
import epIconsUrl from "@iconify-json/ep/icons.json?url";
import riIconsUrl from "@iconify-json/ri/icons.json?url";
import mdiLightIconsUrl from "@iconify-json/mdi-light/icons.json?url";

const iconSetUrls = {
  ep: epIconsUrl,
  ri: riIconsUrl,
  "mdi-light": mdiLightIconsUrl,
};
const loadedIconSets = new Set();

async function ensureIconCollection(iconName) {
  if (typeof iconName !== "string" || !iconName.includes(":")) return;
  const prefix = iconName.split(":")[0];
  const url = iconSetUrls[prefix];
  if (!url || loadedIconSets.has(prefix)) return;
  loadedIconSets.add(prefix);
  try {
    const json = await (await fetch(url)).json();
    addCollection(json);
  } catch (e) {
    loadedIconSets.delete(prefix); // 失败允许重试
    console.warn(`iconify 集合加载失败: ${prefix}`, e);
  }
}

/**
 * 从组件配置中收集动态图标名（com_icon / title_icon / icon_name 等字段），
 * 逐个按需加载对应集合；addCollection 后已挂载的 Icon 组件会自动刷新。
 * @param {Array|Object} components - 页面组件树
 */
function loadPageIcons(components) {
  if (!components) return;
  try {
    const raw = JSON.stringify(components);
    const re = /"(?:com_icon|title_icon|icon_name|icon)"\s*:\s*"([a-z0-9-]+:[a-z0-9-]+)"/gi;
    const seen = new Set();
    let m;
    while ((m = re.exec(raw))) {
      if (seen.has(m[1])) continue;
      seen.add(m[1]);
      ensureIconCollection(m[1]);
    }
  } catch (e) {
    console.warn("收集页面图标失败", e);
  }
}

import { $selectOne, getHomePageNo, getImagePath } from "@/common/http";
import { formatStyleData } from "@/pages/lowcode/common/index.js";

import { buildComponentsTree } from "../utils/common";
import { getPageSnapshot, setPageSnapshot } from "../utils/snapshot-db";
import { pageCompCols } from "../components/property/columns";

/**
 * 应用配置内存缓存：appNo -> appCfg
 * 模块级共享，避免多页面导航切换时重复请求相同的应用全局配置
 */
const appConfigCache = new Map();

/**
 * 页面快照缓存：pageNo -> { fingerprint, prepared }
 * 模块级共享，组件重建后仍可用；仅用于"秒开"体验，
 * 每次命中都会后台重新校验，配置有变化时立即整帧更新，不会停在旧内容上。
 */
const pageSnapshotCache = new Map();
const PAGE_CACHE_MAX = 15;

/**
 * 深度冻结只读配置对象（样式/主题类 *_json_data）
 * @description 仅冻结"配置类"JSON：样式（style）、主题（theme）、
 *              描述（description）、参数（params）等只读字段；
 *              组件实例配置（component/page/row/cols 等）可能被编辑器修改，跳过
 * @param {Object} obj - 待冻结对象
 * @returns {boolean} 是否冻结
 */
// 可安全深度冻结的 *_json_data 字段名特征（样式/主题/描述/参数等只读配置）
const FROZEN_JSON_KEY = /(style|theme|description|desc|param|option|icon|title|more|popup|dialog|auth|srv|event|anchor|hidden|visib|cols|app|event)/i;

/**
 * 深度冻结配置对象（Vue 2 对 frozen 对象跳过响应式代理，减少依赖收集开销）
 * @param {Object} obj - 待冻结对象（仅处理普通对象/数组）
 */
function deepFreezeConfig(obj) {
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    obj.forEach(deepFreezeConfig);
  } else {
    Object.keys(obj).forEach((k) => {
      const v = obj[k];
      if (v && typeof v === "object") deepFreezeConfig(v);
    });
  }
  try {
    Object.freeze(obj);
  } catch (e) {
    /* 忽略 */
  }
}

/**
 * 低代码页面混入器
 * @mixin LowcodePageMixin
 * @description 为低代码页面提供通用的配置管理、组件初始化、主题设置等功能
 */
export default {
  props: {
    propPageNo: {
      type: String,
      default: ''
    },
  },
  /**
   * 向子组件提供页面配置和参数的访问方法
   * @returns {Object} 包含获取页面配置和参数方法的对象
   */
  provide() {
    return {
      getPageConfig: () => this.pageConfig,
      getPageParams: () => this.pageParams,
    };
  },
  /**
   * 组件数据
   * @returns {Object} 组件的响应式数据
   * @property {string|null} pageNo - 页面编号
   * @property {Object|null} pageConfig - 页面配置对象
   * @property {Array} components - 页面组件列表
   * @property {string} anchorName - 锚点名称
   */
  data() {
    return {
      appCfg: null,
      pageNo: null,
      pageConfig: null,
      components: [],
      anchorName: "",
      queryOptions: {},
      urlSearchParams: null,
      // 导航切换进行中（新配置/首屏图片未就绪），用于驱动顶部进度条
      pageSwitching: false
    }
  },
  computed: {
    ...mapState("theme", ["currentTheme"]),
    ...mapGetters("theme", ["themeList", "themeVariable"]),
    ...mapGetters("pageEvent", ["getAllPageVariables"]),
    /**
     * 计算内容区域宽度
     * @returns {string} 格式化后的宽度值（px或%）
     */
    contentAreaWidth() {
      let width = this.pageConfig?.content_area_width || 1400;
      return typeof width === "string" && width?.includes("%")
        ? width
        : `${parseFloat(width)}px`;
    },
    /**
     * 获取页面样式配置
     * @returns {Object} 格式化后的样式对象
     */
    setStyle() {
      let style = {};
      if (!this.isMobileView && this.pageConfig?.page_style_json_data) {
        style = cloneDeep(this.pageConfig?.page_style_json_data);
      }
      return formatStyleData(style);
    },
    /**
     * 获取应用配置
     * @returns {Object} 应用配置对象
     */
    appConfig() {
      return this.pageConfig?.app_json_data || {};
    },
  },
  watch: {
    /**
     * 切换进度标志联动 body class，
     * 顶部进度条样式挂在 body::after 上（body 不受 ui-scaler transform 影响）
     */
    pageSwitching(newValue) {
      if (typeof document !== "undefined") {
        document.body.classList.toggle("lc-page-switching", !!newValue);
      }
    },
    /**
     * 监听当前主题变化
     * @param {string} newValue - 新主题值
     * @param {string} oldValue - 旧主题值
     */
    currentTheme(newValue, oldValue) {
      console.log("currentTheme", newValue);
      if (newValue !== oldValue) {
        this.setThemeVariable();
      }
    },
    setStyle: {
      handler(newVal, oldVal) {
        if (newVal && newVal['font-size']) {
          document.body.style.fontSize = newVal['font-size']
          document.querySelector('html').style.fontSize = newVal['font-size']
        }
      },
      deep: true,
      immediate: true,
    },
    getAllPageVariables: {
      deep: true,
      handler(newVal, oldVal) {
        // 避免空值和非对象类型
        if (!newVal || typeof newVal !== 'object') {
          return;
        }
        // 页面全局变量发生变化 同步更新传到子组件
        try {
          if (this.pageParamsModel && typeof this.pageParamsModel === 'object') {
            for (let key in newVal) {
              if (this.pageParamsModel.hasOwnProperty(key) && this.pageParamsModel[key] && typeof this.pageParamsModel[key] === 'object' && 'value' in this.pageParamsModel[key]) {
                this.$set(this.pageParamsModel[key], 'value', newVal[key]);
              }
              if (this.pageParams && typeof this.pageParams === 'object' && this.pageParams.hasOwnProperty(key) && this.pageParams[key] && typeof this.pageParams[key] === 'object' && 'value' in this.pageParams[key]) {
                this.$set(this.pageParams[key], 'value', newVal[key]);
              }
              if (this.queryOptions && typeof this.queryOptions === 'object' && this.queryOptions.hasOwnProperty(key)) {
                this.$set(this.queryOptions, key, newVal[key]);
              }
            }
          }
        } catch (error) {
          console.warn('Error updating page variables:', error);
        }
      }
    }
  },
  async created() {
    const query = this.pageRoute?.query || this.$route.query
    const params = this.pageRoute?.params || this.$route.params

    // 存储原始query参数
    this.urlSearchParams = JSON.parse(JSON.stringify(query || {}))
    this.queryOptions = JSON.parse(JSON.stringify(query))
    if (this.lowCodeJson?.page_no) {
      this.pageNo = this.lowCodeJson.page_no
      this.pageConfig = {
        ...cloneDeep(this.lowCodeJson),
        page_row_json: cloneDeep(this.lowCodeJson)
      }
      const newData = await this.initPageConfig(this.pageConfig);
      this.initComponents(newData);
      this.initPageParams()
      this.setThemeVariable();
      return
    }
    if (this.propPageNo) {
      this.pageNo = this.propPageNo
    } else if (query?.pageNo || params?.pageNo) {
      this.pageNo = query?.pageNo || params?.pageNo;
    } else if (getHomePageNo?.()) {
      this.pageNo = getHomePageNo?.();
    }

    if (this.pageNo) {
      await this.getPageConfig()
      this.$nextTick(() => {
        let anchorName = query?.anchorName || params?.anchorName;
        if (anchorName) {
          this.anchorName = anchorName;
          let ele = document.getElementById(anchorName);
          if (ele) {
            ele.scrollIntoView({
              behavior: "smooth",
              block: "start",
              inline: "nearest",
            });
          } else {
            console.error("未找到锚点:", anchorName);
          }
        }
      });
      this.setThemeVariable();
    }
  },
  async mounted() {
    // 图标按需加载：收集本页组件配置中的动态图标并加载对应集合；
    // 静态图标已由 unocss 内联，不再全量下载 iconify 全集（原 ≈2.3MB）
    if (this.components && this.components.length) {
      loadPageIcons(this.components);
    }
  },
  beforeDestroy() {
    if (typeof document !== "undefined") {
      document.body.classList.remove("lc-page-switching");
    }
  },
  methods: {
    ...mapActions("theme", ["setCurrentTheme", "setThemeList", "initTheme"]),

    /**
     * 设置主题变量到DOM
     * @description 将主题变量转换为CSS样式并应用到body元素
     */
    setThemeVariable() {
      const appCfg = this.appCfg
      let appStyleJson = null
      if (appCfg?.app_style_json) {
        try {
          appStyleJson = JSON.parse(appCfg.app_style_json)
        } catch (error) {
          console.log(error);
        }
      }
      let appThemeInfo = {}
      if (appStyleJson?.theme_color) {
        Object.keys(appStyleJson?.theme_color).forEach(key => {
          if (appStyleJson?.theme_color[key]) {
            appThemeInfo[`--${key}`] = appStyleJson?.theme_color[key]
          }
        })
      }
      let themeVariable = Object.keys(this.themeVariable).reduce(
        (pre, cur) => {
          pre += `${cur}: ${this.themeVariable[cur]};`;
          if (cur?.includes('_')) {
            pre += `${cur.replace(/\_/g, '-')}: ${this.themeVariable[cur]};`;
          }
          return pre;
        },
        ""
      );
      if (appThemeInfo && Object.keys(appThemeInfo).length) {
        themeVariable += Object.keys(appThemeInfo).reduce((pre, cur) => {
          pre += `${cur}: ${appThemeInfo[cur]};`;
          if (cur?.includes('_')) {
            pre += `${cur.replace(/\_/g, '-')}: ${appThemeInfo[cur]};`;
          }
          return pre;
        }, '')
      }
      document.body.setAttribute("style", themeVariable);
    },
    /**
     * 获取应用配置
     * @description 从服务器获取应用配置，根据应用编号查询应用详情
     * @param {string} appNo - 应用编号
     * @returns {Promise<Object|null>} 应用配置对象，如果请求失败或未找到应用则返回null
     */
    async fetchAppConfig(appNo) {
      if (!appNo) return null;
      if (appConfigCache.has(appNo)) {
        return appConfigCache.get(appNo);
      }
      const service = 'srvpage_cfg_app_guest_select'
      const req = {
        "serviceName": service,
        "colNames": ["*"],
        "condition": [{
          colName: 'app_no',
          ruleType: "eq",
          value: appNo
        }],
        "page": {
          "pageNo": 1,
          "rownumber": 1
        },
      }
      try {
        const res = await this.$http.post(`/config/select/${service}`, req)
        if (res.data.state === 'SUCCESS' && Array.isArray(res.data.data) && res.data.data.length) {
          const appCfg = res.data.data[0];
          appConfigCache.set(appNo, appCfg);
          return appCfg;
        }
      } catch (error) {
        console.error(error);
      }
      return null
    },
    /**
     * 获取应用配置
     * @description 从服务器获取应用配置，根据应用编号查询应用详情
     * @param {string} appNo - 应用编号
     * @returns {Promise<Object|null>} 应用配置对象，如果请求失败或未找到应用则返回null
     */
    async getAppConfig(appNo) {
      const appCfg = await this.fetchAppConfig(appNo)
      if (appCfg) {
        sessionStorage.setItem('lowAppCfg', JSON.stringify(appCfg))
        this.appCfg = appCfg
      }
    },
    /**
     * 获取页面配置数据
     * @async
     * @description 从服务器获取页面配置，并初始化页面组件和参数
     * @throws {Error} 当请求失败时抛出错误
     */
    async getPageConfig() {
      // SWR：并行发起网络请求与本地快照读取（stale-while-revalidate），
      // 快照先到先渲染（刷新秒开），网络结果回来后后台比对指纹
      const netPromise = this.fetchPageData(this.pageNo);
      const dbCached = await getPageSnapshot(this.pageNo);
      if (dbCached?.data) {
        try {
          const prepared = await this.prepareFromData(dbCached.data, dbCached.appCfg);
          this.applyPageData(prepared);
          this.cacheSetPage(this.pageNo, prepared);
          await this.applyPageRuntimeOptions(prepared.data);
        } catch (e) {
          console.warn("IndexedDB 快照应用失败，走网络", e);
        }
        this.revalidateFromNetwork(netPromise, this.pageNo, dbCached.fingerprint);
        return;
      }
      const prepared = await netPromise;
      if (!prepared.ok) {
        if (prepared.msg) {
          this.$message.error(prepared.msg);
        } else {
          this.$message.info("无数据！");
        }
        return;
      }
      this.applyPageData(prepared);
      this.cacheSetPage(this.pageNo, prepared);
      await this.applyPageRuntimeOptions(prepared.data);
    },
    /**
     * 准备页面数据（两阶段提交的"准备阶段"）
     * @async
     * @description 按页面编号从服务端实时拉取最新配置并构建组件树，
     *              全程不修改 pageConfig / components / 主题等任何影响当前页面显示的状态，
     *              也不做任何缓存；调用方在过期检查通过后用 applyPageData 一次性应用。
     * @param {string} pageNo - 目标页面编号
     * @returns {Promise<{ok:boolean, msg?:string, data?:Object, components?:Array, appCfg?:Object|null}>}
     */
    async fetchPageData(pageNo) {
      const url = `/config/select/srvpage_cfg_page_guest_select`;
      const req = {
        serviceName: "srvpage_cfg_page_guest_select",
        colNames: ["*"],
        condition: [
          {
            colName: "page_no",
            ruleType: "eq",
            value: pageNo,
          },
        ],
      };
      const { data, ok, msg } = await $selectOne(url, req);
      if (!ok) return { ok: false, msg };

      const cfg = this.parsePageConfig(data);
      let list = cfg?.page_row_json_data?.component_json;
      if (this.getPageComponents && typeof this.getPageComponents === "function") {
        list = await this.getPageComponents(list)
      }
      const components = this.buildComponentList(list);
      const appCfg = cfg?.app_no ? await this.fetchAppConfig(cfg.app_no) : null;
      return { ok: true, data: cfg, components, appCfg };
    },
    /**
     * 应用页面数据（两阶段提交的"提交阶段"）
     * @description 将 fetchPageData 的结果在同一 tick 内整体赋值，
     *              Vue 在下一帧一次性渲染新页面，避免中间状态造成视觉跳变。
     * @param {Object} prepared - fetchPageData 的返回值
     */
    applyPageData(prepared) {
      const { data, components, appCfg } = prepared;
      this.pageNo = data.page_no;
      if (appCfg) {
        sessionStorage.setItem('lowAppCfg', JSON.stringify(appCfg))
        this.appCfg = appCfg
      }
      this.pageConfig = data;
      this.components = components || [];
      this.applyPageTheme(data);
      this.initPageParams()
      this.setThemeVariable();
      try {
        // 存储页面配置到store
        this.$store.commit('pageEvent/SET_PAGE_CONFIG', data)
        // 查找页面事件
        this.$store.dispatch('pageEvent/getPageEvents', data.page_no)
      } catch (error) {
        console.warn('Error initializing page event state:', error)
      }
    },
    /**
     * 应用页面运行时参数（全局参数查询 + 接口默认值）
     * @async
     * @param {Object} data - 解析后的页面配置
     */
    async applyPageRuntimeOptions(data) {
      await this.getPageInitQueryOptions()

      if (Array.isArray(data?.interface_json_data) && data.interface_json_data.length) {
        data.interface_json_data.forEach(item => {
          const val = this.queryOptions[item.para]
          if (item.default_val && [null, undefined, 'null', 'undefined'].includes(val)) {
            this.$set(this.queryOptions, item.para, item.default_val)
          }
        })
        let dim_no_field = data.interface_json_data.find(item => item.dim_no)
        if (dim_no_field?.dim_no && this.queryOptions[dim_no_field.para] && this.queryOptions[dim_no_field.para] !==
          '*') {
          // 维度编号
          this.$set(this.queryOptions, '_dim_no', this.queryOptions[dim_no_field.para])
          // await this.setPageDim(dim_no_field?.dim_no, this.queryOptions[dim_no_field.para])
        }
      }
    },
    /**
     * 导航切换页面（编排方法，view.vue 的 watch 直接调用）
     * @async
     * @description 准备阶段旧页面保持原样；新配置、组件树、首屏图片就绪后整帧替换；
     *              请求期间路由再次变化时丢弃过期结果，防止连点竞态。
     * @param {string} pageNo - 目标页面编号
     */
    async loadPageConfig(pageNo) {
      const targetNo = pageNo || this.$route.params.pageNo;
      if (!targetNo) return;

      const anchorName =
        this.$route.query?.anchorName || this.$route.params?.anchorName;

      // 命中缓存：立即整帧应用（秒开），再后台校验保证内容最新
      const cached = pageSnapshotCache.get(targetNo);
      if (cached) {
        if (!anchorName) window.scrollTo(0, 0);
        this.applyPageData(cached.prepared);
        await this.applyPageRuntimeOptions(cached.prepared.data);
        this.revalidatePage(targetNo);
        return;
      }

      // 未命中：并行发起网络请求与 IndexedDB 读取（stale-while-revalidate），
      // 本地快照先到则先渲染（刷新秒开），网络结果回来后后台比对指纹
      const netPromise = this.fetchPageData(targetNo);
      const dbCached = await getPageSnapshot(targetNo);
      if (dbCached?.data) {
        if (this.$route.params.pageNo !== targetNo) return;
        if (!anchorName) window.scrollTo(0, 0);
        try {
          // 从快照 data 重建组件树（组件配置为纯 JSON，直接可重建）
          const prepared = await this.prepareFromData(dbCached.data, dbCached.appCfg);
          this.applyPageData(prepared);
          this.cacheSetPage(targetNo, prepared);
          await this.applyPageRuntimeOptions(prepared.data);
        } catch (e) {
          console.warn("IndexedDB 快照应用失败，走网络", e);
        }
        // 后台等网络结果比对指纹，无变化则保持，有变化整帧更新
        this.revalidateFromNetwork(netPromise, targetNo, dbCached.fingerprint);
        return;
      }

      // 未命中：两阶段提交，准备期间旧页保持原样，顶部进度条提示活动
      this.pageSwitching = true;
      const startedAt = Date.now();
      const seq = (this._switchSeq = (this._switchSeq || 0) + 1);
      // 关闭进度条：保证最少展示时长，极快切换时不致"闪一下"；连续切换以最新一次为准
      const finish = () => {
        if (this._switchSeq !== seq) return;
        const remain = Math.max(0, 400 - (Date.now() - startedAt));
        setTimeout(() => {
          if (this._switchSeq === seq) this.pageSwitching = false;
        }, remain);
      };
      try {
        const prepared = await netPromise;
        // 请求期间路由又变化了，丢弃过期结果，以最后一次为准
        if (this.$route.params.pageNo !== targetNo) return finish();
        if (!prepared.ok) {
          if (prepared.msg) this.$message.error(prepared.msg);
          else this.$message.info("无数据！");
          return finish();
        }
        // 预载首屏图片（带上限），避免切换后图片逐张弹出
        await this.preloadImages(this.collectImageUrls(prepared.components));
        if (this.$route.params.pageNo !== targetNo) return finish();

        // 切换时回到顶部，避免新页面在旧滚动位置露出；有锚点则交给调用方平滑滚动
        if (!anchorName) window.scrollTo(0, 0);

        // 整帧替换：pageNo / pageConfig / components / 主题 一次性生效
        this.applyPageData(prepared);
        this.cacheSetPage(targetNo, prepared);
        await this.applyPageRuntimeOptions(prepared.data);
        // 新页面 DOM 渲染完成后再收起进度条
        this.$nextTick(finish);
      } catch (err) {
        console.error("loadPageConfig error", err);
        finish();
      }
    },
    /**
     * 写入页面快照缓存（带上限，超出淘汰最早条目）
     * @param {string} pageNo - 页面编号
     * @param {Object} prepared - fetchPageData 的返回值
     */
    cacheSetPage(pageNo, prepared) {
      if (!pageNo || !prepared) return;
      if (pageSnapshotCache.has(pageNo)) pageSnapshotCache.delete(pageNo);
      const fingerprint = this.fingerprintPage(prepared);
      pageSnapshotCache.set(pageNo, {
        fingerprint,
        prepared
      });
      // 持久化到 IndexedDB（刷新秒开）；失败不影响内存缓存
      setPageSnapshot(pageNo, {
        fingerprint,
        data: prepared.data,
        appCfg: prepared.appCfg,
      });
      if (pageSnapshotCache.size > PAGE_CACHE_MAX) {
        const oldest = pageSnapshotCache.keys().next().value;
        pageSnapshotCache.delete(oldest);
      }
    },
    /**
     * 计算页面快照指纹，用于后台校验比对是否有变化
     * @param {Object} prepared - fetchPageData 的返回值
     * @returns {string} 指纹
     */
    fingerprintPage(prepared) {
      try {
        return (
          JSON.stringify(prepared.data) + "|" + JSON.stringify(prepared.components)
        );
      } catch (e) {
        return String(Date.now());
      }
    },
    /**
     * 后台静默校验已缓存页面（SWR 的 revalidate）
     * @async
     * @description 重新拉取最新配置，与缓存指纹比对：
     *              无变化则什么都不做；有变化则整帧更新页面并刷新缓存，
     *              保证即使命中缓存也不会停在旧内容上。
     * @param {string} targetNo - 页面编号
     */
    async revalidatePage(targetNo) {
      try {
        const fresh = await this.fetchPageData(targetNo);
        // 用户已切走，不再应用
        if (this.$route.params.pageNo !== targetNo) return;
        if (!fresh.ok) return;
        const cached = pageSnapshotCache.get(targetNo);
        const fp = this.fingerprintPage(fresh);
        if (cached && cached.fingerprint === fp) return;
        this.cacheSetPage(targetNo, fresh);
        // 配置有变化：整帧更新到最新
        this.applyPageData(fresh);
        await this.applyPageRuntimeOptions(fresh.data);
      } catch (e) {
        // 后台校验失败不影响当前展示
        console.warn("revalidatePage error", e);
      }
    },
    /**
     * 从页面配置 data 重建组件树（IndexedDB 快照应用路径）
     * @param {Object} data - 解析后的页面配置
     * @param {Object|null} appCfg - 应用配置
     * @returns {Promise<Object>} 与 fetchPageData 同构的 prepared
     */
    async prepareFromData(data, appCfg) {
      let list = data?.page_row_json_data?.component_json;
      if (this.getPageComponents && typeof this.getPageComponents === "function") {
        list = await this.getPageComponents(list);
      }
      const components = this.buildComponentList(list);
      return { ok: true, data, components, appCfg: appCfg || null };
    },
    /**
     * 网络请求结果回来后与快照指纹比对（SWR revalidate 变体）
     * @async
     * @param {Promise} netPromise - 已在途的 fetchPageData Promise
     * @param {string} targetNo - 页面编号
     * @param {string} oldFp - 快照指纹
     */
    async revalidateFromNetwork(netPromise, targetNo, oldFp) {
      try {
        const fresh = await netPromise;
        if (this.pageNo !== targetNo) return;
        if (!fresh?.ok) return;
        const fp = this.fingerprintPage(fresh);
        if (oldFp && oldFp === fp) return; // 配置无变化，保持快照内容
        this.cacheSetPage(targetNo, fresh);
        this.applyPageData(fresh);
        await this.applyPageRuntimeOptions(fresh.data);
      } catch (e) {
        console.warn("revalidateFromNetwork error", e);
      }
    },
    /**
     * 收集组件树中的首屏图片地址，用于切换前预载
     * @param {Array} components - buildComponentList 构建的组件树
     * @param {number} limit - 最多预载的图片数量
     * @returns {string[]} 图片地址列表
     */
    collectImageUrls(components, limit = 12) {
      const urls = [];
      const seen = new Set();
      const push = (no) => {
        if (!no || seen.has(no) || urls.length >= limit) return;
        seen.add(no);
        const u = getImagePath(no);
        if (u) urls.push(u);
      };
      const walk = (node) => {
        if (!node || urls.length >= limit) return;
        if (typeof node === "string") {
          const m = node.match(/fileNo=([0-9]+)/);
          if (m) push(m[1]);
          else if (/^[0-9]{12,}$/.test(node)) push(node);
          return;
        }
        if (Array.isArray(node)) {
          node.forEach(walk);
          return;
        }
        if (typeof node === "object") {
          Object.keys(node).forEach((key) => {
            const val = node[key];
            if (typeof val === "string") {
              if (/image|img|icon|logo|background|photo|pic|src|url/i.test(key)) {
                const m = val.match(/fileNo=([0-9]+)/);
                if (m) push(m[1]);
                else if (/^[0-9]{12,}$/.test(val)) push(val);
              }
            } else if (val && typeof val === "object") {
              walk(val);
            }
          });
        }
      };
      (components || []).forEach(walk);
      return urls;
    },
    /**
     * 预载图片，带超时上限，慢图不阻塞页面切换
     * @param {string[]} urls - 图片地址列表
     * @param {number} timeout - 最长等待毫秒数
     */
    preloadImages(urls, timeout = 800) {
      if (!urls || !urls.length) return Promise.resolve();
      const tasks = urls.map(
        (src) =>
          new Promise((resolve) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = resolve;
            img.src = src;
          })
      );
      return Promise.race([
        Promise.all(tasks),
        new Promise((resolve) => setTimeout(resolve, timeout)),
      ]);
    },
    /**
     * 初始化页面配置
     * @param {Object} data - 原始页面配置数据
     * @returns {Object} 处理后的页面配置数据
     * @description 解析JSON字段，设置页面配置，初始化主题
     */
    async initPageConfig(data) {
      this.parsePageConfig(data);
      this.pageConfig = data;
      if (data?.app_no) {
        // 查找app信息
        await this.getAppConfig(data.app_no)
      }
      this.applyPageTheme(data);
      return data;
    },
    /**
     * 解析页面配置中的 JSON 字段（纯函数，不修改组件状态）
     * @param {Object} data - 原始页面配置数据
     * @returns {Object} 解析后的配置（*_json 字段生成对应的 *_data）
     */
    parsePageConfig(data) {
      Object.keys(data).forEach((key) => {
        if (key && data[key] && key.indexOf("_json") !== -1) {
          if (typeof data[key] === "object") {
            data[`${key}_data`] = data[key]
          } else {
            try {
              data[`${key}_data`] = JSON.parse(data[key]);
            } catch (e) {
              console.error(e);
            }
          }
          // 只读配置深度冻结（样式/主题/描述/参数类）：
          // 冻结后 Vue 2 跳过响应式代理（Object.defineProperty），
          // 减少大 JSON 的依赖收集与拦截开销
          // 组件配置（component/page/row 等）可能被编辑器修改，不冻结
          if (FROZEN_JSON_KEY.test(key)) {
            deepFreezeConfig(data[`${key}_data`]);
          }
        }
      });
      return data;
    },
    /**
     * 根据页面配置初始化主题（Vuex）
     * @param {Object} data - 解析后的页面配置数据
     */
    applyPageTheme(data) {
      // 使用Vuex初始化主题
      if (data?.app_json_data) {
        let currentTheme = data.app_json_data.current_theme;
        if (
          localStorage.currentTheme &&
          localStorage.getItem("currentTheme") !== currentTheme
        ) {
          currentTheme = localStorage.getItem("currentTheme");
        }
        if (!currentTheme && data?.app_json_data?.theme_list) {
          currentTheme = data.app_json_data.theme_list[0].name;
        }
        this.initTheme({
          currentTheme: currentTheme,
          themeList: data.app_json_data.theme_list || [],
        });
      }
    },
    // 根据配置的接口查询页面全局参数
    async getPageInitQueryOptions() {
      if (this.pageConfig.srv_req_json_data) {
        const urlSearchParams = this.urlSearchParams || {}
        const params = {
          ...urlSearchParams
        }
        const req = JSON.parse(this.renderStr(JSON.stringify(this.pageConfig.srv_req_json_data), params));
        const url = `/${req.mapp}/select/${req.serviceName}`
        const res = await this.$http.post(url, req)
        if (res?.data?.data?.length) {
          const data = res?.data?.data[0]
          // 直接赋值
          const keys = Object.keys(data)
          if (keys.length > 0) {
            this.pageData = data
          }
          if (this.pageConfig.cols_map_json_data) {
            // 处理字段映射
            const keys = Object.keys(this.pageConfig.cols_map_json_data)
            if (keys.length > 0) {
              keys.forEach(key => {
                this.$set(this.queryOptions, key, data[this.pageConfig.cols_map_json_data[key]])
              })
            }
          }
          return data
        }
      } else {
        return
      }

    },
    // 设置页面维度
    async setPageDim(dim_no, dim_value) {
      if (dim_no && dim_value) {
        // const page_instance = this.guid('page_instance_')
        // this.$emit('setDim', {
        //   [dim_no]: dim_value
        // })
        // const url = `/config/operate/srvwx_use_dim_set`
        // const req = [{
        //   "serviceName": "srvwx_use_dim_set",
        //   "data": [{
        //     dim_no,
        //     page_instance,
        //     dim_value,
        //     "dim_type": "page",
        //   }]
        // }]
        // const res = await this.$http.post(url, req)
        // this.pageInstance = page_instance
        // this.$store.commit('SET_PAGE_INSTANCE', page_instance)
        // return res
      }
    },
    /**
     * 初始化页面组件
     * @async
     * @param {Object} data - 页面配置数据
     * @description 处理组件配置，设置组件类型和属性，构建组件树
     */
    async initComponents(data) {
      let list = data?.page_row_json_data?.component_json
      if (this.getPageComponents && typeof this.getPageComponents === "function") {
        list = await this.getPageComponents(list)
      }
      this.components = this.buildComponentList(list) || [];
    },
    /**
     * 构建组件树（纯函数，不修改组件状态）
     * @param {Array} list - 原始组件配置列表
     * @returns {Array} 处理并排序后的组件树
     */
    buildComponentList(list) {
      const component_json = list?.map(
        (item) => {
          if (item.com_type === "layout") {
            const layout_party = item?.layout_json?.layout_party;
            if (layout_party === "页面") {
              item.type = "container";
              item.component = "lc-container";
            } else if (layout_party === "布局") {
              item.type = "layout";
              item.component = "lc-block";
            } else {
              item.type = "content";
              item.component = "lc-content";
            }
            if (item.layout_json?.child_num) {
              item.child_num = item.layout_json.child_num;
            }
          } else {
            item.component = "page-item";
            if (item.com_name !== '咨询入口' && item.com_option?.includes("悬浮可拖动")) {
              item.component = "float-component";
            }
            //在线咨询特别处理
            if (item.com_name === '咨询入口' && item.com_option?.includes("悬浮可拖动")) {
              item.component = "chat-entrance";
            }
          }
          item.data = {};
          pageCompCols.forEach((col) => {
            if (item[col]) {
              item.data[col] = item[col];
            }
          });
          if (item.id) {
            item.data.id = item.id;
          }
          const keys = ["component", "type", "_type"];
          keys.forEach((key) => {
            if (item.data[key]) {
              delete item.data[key];
            }
          });

          return item;
        }
      );
      if (!Array.isArray(component_json)) {
        return [];
      }
      return buildComponentsTree(component_json)?.sort(
        (a, b) => a.com_seq - b.com_seq
      );
    },
  },
}