/**
 * @fileoverview 页面参数混入器 - 提供页面参数管理、路由参数处理等通用功能
 * @author jq
 * @version 1.0.0
 * @since 2025
 */

import cloneDeep from 'lodash/cloneDeep'

/**
 * 页面参数混入器
 * @mixin PageParamsMixin
 * @description 为页面提供参数管理、路由参数处理、页面初始化参数等功能
 */
export default {
  /**
   * 组件数据
   * @returns {Object} 组件的响应式数据
   * @property {Object} queryOptions - 路由参数
   * @property {Object} pageParams - 页面公共参数
   * @property {Object} pageParamsModel - 页面公共参数模型
   */
  data() {
    return {
      queryOptions: {}, // 路由参数
      pageParams: {}, // 页面公共参数
      pageParamsModel: {}, // 页面公共参数
      isComponent: false, // 是否低代码组件
    };
  },
  props: {
    lowCodeJson: {
      type: Object,
    },
    lowCodeParams: {
      type: Object,
    },
  },
  computed: {
    /**
     * 获取页面信息
     * @returns {Object} 页面配置信息
     */
    pageInfo() {
      return this.pageConfig || {};
    }
  },
  created() {
    if (this.lowCodeJson?.page_no) {
      // 低代码页面作为组件
      this.isComponent = true
      this.queryOptions = this.lowCodeParams || {}
    } else {
      this.queryOptions = this.pageRoute?.query || this.$route.query
    }
  },
  methods: {
    /**
     * 根据页面配置的请求查询页面全局参数
     * @async
     * @returns {Object|undefined} 查询到的页面全局参数数据，如果没有配置或查询失败则返回undefined
     * @description 通过页面配置的服务请求获取全局参数，并更新queryOptions
     */
    async getPageInitQueryOptions() {
      // 页面请求
      if (this.pageInfo.cols_map_json_data && this.pageInfo.srv_req_json_data) {
        const queryOptions = this.queryOptions || {};
        let userInfo = sessionStorage.getItem('login_user_info') || sessionStorage.getItem('current_login_user')
        if(userInfo){
          try{
            userInfo = JSON.parse(userInfo)
          }catch(e){
            userInfo = null
            console.error('解析用户信息失败', e)
          }
        }
        const params = {
          ...queryOptions,
          user:userInfo,
          userInfo,
          user_no: userInfo?.user_no || '',
        };
        const req = JSON.parse(
          this.renderStr(
            JSON.stringify(this.pageInfo.srv_req_json_data),
            params
          )
        );
        const app = req.mapp || sessionStorage.getItem("activeApp");
        const url = `/${app}/select/${req.serviceName}`;
        const res = await this.$http.post(url, req);
        if (res?.data?.data?.length) {
          const data = res?.data?.data[0];
          const keys = Object.keys(this.pageInfo.cols_map_json_data);
          if (keys.length > 0) {
            keys.forEach((key) => {
              this.$set(
                this.queryOptions,
                key,
                data[this.pageInfo.cols_map_json_data[key]]
              );
            });
          }
          return data;
        }
      } else {
        return;
      }
    },
    /**
     * 根据页面配置的接口参数初始化页面参数
     * @returns {Object} 初始化的基础参数模型
     * @description 获取登录用户信息和路由参数，构建基础参数模型
     */
    getInitParams() {
      // 页面前端运行固定参数
      const loginUserInfo = window.sessionStorage.getItem("current_login_user");
      const basicParamsModel = {
        _isBindMobile: loginUserInfo?.mobile, // 登录用户
        _isAnonymLogin: loginUserInfo?.login_state === "anon_login", // 匿名,未登录用户
        _isVerified:
          loginUserInfo &&
          loginUserInfo?.login_state !== "anon_login" &&
          loginUserInfo.mobile &&
          loginUserInfo.hasOwnProperty("otherTenantInfos") &&
          loginUserInfo.otherTenantInfos.length > 0, // 被认证，认证用户
      };
      if (
        this.queryOptions &&
        Object.keys(this.queryOptions).length > 0
      ) {
        Object.keys(this.queryOptions).forEach((key) => {
          basicParamsModel[key] = {
            value: this.queryOptions[key],
          };
        });
      }
      return basicParamsModel;
    },

    /**
     * 初始化页面参数
     * @async
     * @returns {Promise<boolean>} 初始化完成后返回true
     * @description 根据页面配置的参数定义初始化页面参数，支持V1和V2两种参数格式
     */
    async initPageParams() {
      let self = this;
      let getInit = self.getInitParams();
      return await new Promise(function (resolve, reject) {
        //异步操做
        const pageInfo = self.pageConfig || self.pageInfo;
        document.title = pageInfo?.page_title;
        let paraJson =
          pageInfo?.interface_json_data || pageInfo?.para_json;
        let paraJsonV2 = pageInfo?.para_with_map_json_data || null;
        console.log("new Promise( paraJson", paraJson);
        self.pageParams = {};
        if (self.lowCodeJson?.page_no && typeof self.lowCodeParams == 'object' && Object.keys(self.lowCodeParams).length) {
          // 低代码页面作为组件，从父组件传来的全局参数
          Object.keys(self.lowCodeParams).forEach(key => {
            const obj = {};
            obj.value = self.lowCodeParams[key]
            self.pageParams[key] = obj
            self.pageParamsModel[key] = obj
          })
        }
        if (
          (!self.queryOptions ||
            Object.keys(self.queryOptions).length === 0) &&
          Array.isArray(paraJson) &&
          paraJson.length > 0
        ) {
          paraJson.forEach((item) => {
            item.value = item.default_val || "";
          });
          for (let param of paraJson) {
            let keyName = param.para_name || param.para;
            let urlParamsKeys = self.queryOptions
              ? Object.keys(self.queryOptions)
              : [];
            if (urlParamsKeys.indexOf(keyName) !== -1) {
              param.value = self.queryOptions[keyName];
            } else {
              param.value = param.default_val;
            }

            self.$set(self.pageParams, keyName, param);
          }
          self.$set(self, "pageParamsModel", self.bxDeepClone(self.pageParams));
        } else if (Array.isArray(paraJson) && paraJson && paraJson.length > 0) {
          console.log("-- page paraJson  init SUCCESS --");
          console.log(paraJson, self.queryOptions);
          for (let param of paraJson) {
            let keyName = param.para_name || param.para;
            let urlParamsKeys = self.queryOptions
              ? Object.keys(self.queryOptions)
              : [];
            if (urlParamsKeys.indexOf(keyName) !== -1) {
              param.value = self.queryOptions[keyName];
            } else {
              param.value = param.default_val;
            }
            self.$set(self.pageParams, keyName, param);
          }
          self.$set(self, "pageParamsModel", cloneDeep(self.pageParams));
        }
        if (paraJsonV2 && paraJsonV2.length > 0) {
          console.log("-- page paraJson V2  init SUCCESS --");
          let Model = {};
          for (let param of paraJsonV2) {
            for (let key in self.queryOptions) {
              if (key == param.para && self.queryOptions[key]) {
                param["value"] = self.queryOptions[key];
              } else {
                param["value"] = param.default_val || "";
              }
            }
            Model[param.para] = param;
            self.$set(self.pageParams, param.para, param);
          }

          self.$set(self, "pageParamsModel", self.deepClone(Model));
        }
        self.$set(self, "pageParamsModel", {
          ...self.pageParamsModel,
          ...getInit,
        });
        resolve(true);
      });
    },

    /**
     * 设置页面参数
     * @param {string} key - 参数键名
     * @param {*} val - 参数值
     * @description 更新指定键名的页面参数值
     */
    setPageParams(key, val) {
      // 组件输入页面的参数
      // this.pageParams[key] = val
      console.log("接收参数", key, val);
      if (this.pageParamsModel && key) {
        for (let p in this.pageParamsModel) {
          if (p == key && this.pageParamsModel[key]) {
            console.log("--", val);
            let item = cloneDeep(this.pageParamsModel[key]);
            item.value = val;
            this.$set(this.pageParamsModel, key, item);
          }
        }
      }
    },
  },
}