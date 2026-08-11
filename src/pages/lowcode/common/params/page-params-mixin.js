import { rpx2px } from "../index";
export default {
  data() {
    return {
      // 移植参数相关
      loadPageMata: null, // 页面元数据
      pageParams: null,
      pageParamsModel: null,
    };
  },
  computed: {
    themeVariable() {
      // 样式全局配置
      let config = this.pageInfo?.page_style_json_data;
      return `
	  			--home-height:${rpx2px(config?.height) || "82px"};
	    --home-background:${rpx2px(config?.background)};
	    --home-background_color:${config?.background_color};
	    --home-background_image:${config?.background_image};
	    --home-border:${rpx2px(config?.border)};
	    --home-border_radius:${rpx2px(config?.border_radius)};
	    --home-padding:${rpx2px(config?.padding)};
	    --home-margin:${rpx2px(config?.margin)};
	    --home-position:${rpx2px(config?.position)};
	    --home-font:${config?.font};
	    --home-font_size:${rpx2px(config?.font_size) || "14px"};
	    --home-color:${config?.color || "#fff"};
	  `;
    },
    // 移植参数相关
    urlSearchQuery() {
      // url 参数
      let query = null;
      if (this.$route.query) {
        query = this.$route.query;
      }

      return query;
    },
    routeParams() {
      let params = null;
      if (this.$route.params) {
        params = this.$route.params;
      }
      return params;
    },
    pageInfo() {
      // 页面配置
      let obj = this.loadPageMata || null;
      return obj;
    },
  },
  methods: {
    // 根据配置的接口查询页面全局参数
    async getPageInitQueryOptions() {
      // 页面请求
      if (this.pageInfo.cols_map_json_data && this.pageInfo.srv_req_json_data) {
        const urlSearchParams = this.urlSearchParams || {};
        const params = {
          ...urlSearchParams,
        };
        const req = JSON.parse(
          this.renderStr(
            JSON.stringify(this.pageInfo.srv_req_json_data),
            params
          )
        );
        const url = `/${
          req.mapp || window.sessionStorage.getItem("activeApp")
        }/select/${req.serviceName}`;
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
        this.urlSearchParams &&
        Object.keys(this.urlSearchParams).length > 0
      ) {
        Object.keys(this.urlSearchParams).forEach((key) => {
          basicParamsModel[key] = {
            value: this.urlSearchParams[key],
          };
        });
      }
      return basicParamsModel;
    },
    async initPageParams() {
      // 初始化页面参数
      let self = this;
      let getInit = self.getInitParams();
      return await new Promise(function (resolve, reject) {
        //异步操做
        const pageInfo = self.pageConfig||self.pageInfo;
        let paraJson =
            pageInfo?.interface_json_data || pageInfo?.para_json;
        let paraJsonV2 = pageInfo?.para_with_map_json_data || null;
        console.log("new Promise( paraJson", paraJson);
        self.pageParams = {};
        if (
          (!self.urlSearchParams ||
            Object.keys(self.urlSearchParams).length === 0) &&
          Array.isArray(paraJson) &&
          paraJson.length > 0
        ) {
          paraJson.forEach((item) => {
            item.value = item.default_val || "";
          });
          for (let param of paraJson) {
            let keyName = param.para_name || param.para;
            let urlParamsKeys = self.urlSearchParams
              ? Object.keys(self.urlSearchParams)
              : [];
            if (urlParamsKeys.indexOf(keyName) !== -1) {
              param.value = self.urlSearchParams[keyName];
            } else {
              param.value = param.default_val;
            }

            self.$set(self.pageParams, keyName, param);
          }
          self.$set(self, "pageParamsModel", self.bxDeepClone(self.pageParams));
        } else if (Array.isArray(paraJson) && paraJson && paraJson.length > 0) {
          console.log("-- page paraJson  init SUCCESS --");
          console.log(paraJson, self.urlSearchParams);
          for (let param of paraJson) {
            let keyName = param.para_name || param.para;
            let urlParamsKeys = self.urlSearchParams
              ? Object.keys(self.urlSearchParams)
              : [];
            if (urlParamsKeys.indexOf(keyName) !== -1) {
              param.value = self.urlSearchParams[keyName];
            } else {
              param.value = param.default_val;
            }
            self.$set(self.pageParams, keyName, param);
          }
          self.$set(self, "pageParamsModel", self.bxDeepClone(self.pageParams));
        }
        if (paraJsonV2 && paraJsonV2.length > 0) {
          console.log("-- page paraJson V2  init SUCCESS --");
          let Model = {};
          for (let param of paraJsonV2) {
            for (let key in self.urlSearchParams) {
              if (key == param.para && self.urlSearchParams[key]) {
                param["value"] = self.urlSearchParams[key];
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
    setPageParams(key, val) {
      // 组件输入页面的参数
      let self = this;
      // this.pageParams[key] = val
      console.log("接受参数", key, val);
      if (self.pageParamsModel && key) {
        for (let p in self.pageParamsModel) {
          if (p == key && self.pageParamsModel[key]) {
            console.log("--", val);
            let item = self.bxDeepClone(self.pageParamsModel[key]);
            item.value = val;
            self.$set(self.pageParamsModel, key, item);
          }
        }
      }
    },
  },
};
