// import paramsModelsMixin from '@/common/paramsModelsMixin.js';
import { mapGetters } from "vuex";
import { getDateByKey, getDateKeys } from "@/common/date_util";
import isEmpty from "lodash/isEmpty";

export default {
  data() {
    return {
      cellData: [{

      }],
      componentParamsModels: null
    };
  },
  // mixins: [paramsModelsMixin],
  components: {},
  props: {
    pageParams: {
      type: [Array, Object]
    },
    pageItem: {
      type: Object
    },
    pageItemParams: {
      type: Object
    },
    pageParamsModel: {
      type: Object,
      default() {
        return {}
      }
    },
    "pageNo": {
      type: String
    }

  },

  computed: {
    ...mapGetters("pageEvent", [
      "getCompEventsMap", "getAllPageVariables"
    ]),
    pageCompEvents() {
      return this.getCompEventsMap?.[this.pageItem.com_no] || []
    },
    pageCompVarMap() {
      try {
        if (!Array.isArray(this.pageCompEvents)) {
          return {};
        }
        return this.pageCompEvents.reduce((prev, cur) => {
          if (cur.com_interface_cols && cur.page_interface_cols) {
            try {
              let pageCols = cur.page_interface_cols.split(",");
              let compCols = cur.com_interface_cols.split(",");
              if (Array.isArray(pageCols) && Array.isArray(compCols) && pageCols.length && pageCols.length === compCols.length) {
                pageCols.forEach((col, index) => {
                  if (col && compCols[index]) {
                    prev[col] = compCols[index];
                  }
                });
              }
            } catch (error) {
              console.warn('Error processing component event mapping:', error);
            }
          }
          return prev;
        }, {});
      } catch (error) {
        console.warn('Error creating component variable map:', error);
        return {};
      }
    },
    comParamsLoaded: function () {
      // 校验组件参数是否转载完成
      let type = this.compType
      let params = this.compInitParams
      let loading = false
      switch (type) {
        case 'list':
          break;
        case 'form':
          if (params && params.hasOwnProperty('type') && params.hasOwnProperty('serviceName')) {
            loading = true
          }
          break;
        default:
          loading = true
          break;
      }
      if (loading) {
        console.debug('comloading SUCCESS:', this.pageItem.com_name, params)
      } else {
        console.error('comloading ERROR:', this.pageItem.com_name, params)
      }
      return loading
    },
    comDataFormType: function () {
      //  数据源从哪里来，比如从用户信息来？
      let jsons = this.pageItem?.com_para_with_map_json
      let modeParamsFormType = {}
      let type = []
      if (jsons && jsons.length > 0) {
        for (let p of jsons) {
          let src = p.src_map

          for (let s of src) {
            modeParamsFormType[p.para] = s.from_type
          }
        }
      }
      // for(let val of modeParamsFormType){
      //  type.push(val)
      // }
      // type = Array.from(new Set(type));
      return type
    },
    comColMapRun: function () {
      // 1.0版本 字段col 部件映射
      let jsons = this.pageItem?.com_para_with_map_json || this.pageItem?.cols_map_json
      if (isEmpty(jsons) && this.pageItem?.cols_map_json?.cols_map_detail_json?.length) {
        jsons = this.pageItem?.cols_map_json
      }
      // let maps = this.paramsBuild(json)?.target?.com || {}
      let maps = {}
      if (this.serviceName == 'srvwuliu_car_select' && this.componentParamsModels && this.compType == 'currentInfo') {
        maps = {
          "title_col_name": this.componentParamsModels.title_col_name,
          "subtitle_col_name": this.componentParamsModels.subtitle_col_name,
          "image_col_name": this.componentParamsModels.image_col_name,
        }
      } else if (Array.isArray(jsons) && jsons.length > 0) {
        for (let p of jsons) {
          let src = p.src_map
          maps[p.para] = p.para
          for (let s of src) {
            maps[p.para] = s.col_from
          }
        }
      } else if (typeof jsons === 'object' && jsons?.cols_map_detail_json) {
        for (let p of jsons?.cols_map_detail_json) {
          maps[p.col_to] = p.col_from
        }
      }

      //  组件事件映射
      if (this.pageCompVarMap && Object.keys(this.pageCompVarMap).length > 0) {
        for (let key of Object.keys(this.pageCompVarMap)) {
          maps[this.pageCompVarMap[key]] = key
        }
      }

      return maps || {}
    },
    compType: function () {
      // 组件类型
      let type = this.pageItem?.com_type || this.pageItem?.com_type
      return type || ''
    },

    cardLayoutJson: function () {
      // 组件布局 单元、部件
      let json = this.pageItem?.card_group_json?.card_layout_json || {}
      let compType = this.compType

      switch (compType) {
        case 'currentInfo':
          json = this.pageItem?.current_info_json?.tmpl_card_unit_json
          break;
        default:
          break;
      }
      return json
    },
    datasfromType: function () {
      let cfgfrom = this.pageItem.card_unit_cfg_from || '静态配置'
      switch (cfgfrom) {
        case '模板动态加载':
          return this.pageItem?.srv_req_type
          break;
        default:
          break;
      }
    },
    fromType: function () {
      let cfgfrom = this.pageItem.card_unit_cfg_from || ''
      return cfgfrom
    },
    cellsLayoutJson: function () {
      let cfgfrom = this.pageItem.card_unit_cfg_from
      let cells = []
      switch (cfgfrom) {
        case '静态配置':
          cells = this.pageItem?.card_unit_merge_json || [this.pageItem?.card_group_json?.card_unit_json]
          break;
        case '模板动态加载':
          cells = this.pageItem?.card_group_json?.card_unit_json ? [this.pageItem?.card_group_json?.card_unit_json] :
            []
          break;
        default:
          let compType = this.compType

          switch (compType) {
            case 'currentInfo':
              cells = this.pageItem?.current_info_json?.tmpl_card_unit_json ? [this.pageItem?.current_info_json
                ?.tmpl_card_unit_json
              ] : []
              break;
            default:
              break;
          }
          break;
      }
      return cells
    },
    srvReq: function () {
      let self = this
      let params = this.componentParamsModels ? this.bxDeepClone(this.componentParamsModels) : {};

      if (this.pageParamsModel && typeof this.pageParamsModel === 'object') {
        params = {
          ...this.deepClone(this.pageParamsModel),
          ...params
        }
      }

      // 同步页面变量到组件参数
      if (this.pageCompVarMap && typeof this.pageCompVarMap === 'object' && this.queryOptions && typeof this.queryOptions === 'object') {
        const allPageVariables = this.getAllPageVariables || {};
        Object.keys(params).forEach((key) => {
          const comCol = this.pageCompVarMap[key];
          const pageVarValue = this.queryOptions[comCol] !== undefined ? this.queryOptions[comCol] : allPageVariables[comCol];
          if (comCol && pageVarValue !== undefined && params[key] && typeof params[key] === 'object' && 'value' in params[key] && params[key].value !== pageVarValue) {
            params[key].value = pageVarValue;
          }
        });
      }
      // let page = this.bxDeepClone(this.page)
      let req = this.bxDeepClone(this.pageItem?.srv_req_json) || {}
      let conds = []
      let userInfo = sessionStorage.getItem('login_user_info') || sessionStorage.getItem('current_login_user')
      if (userInfo) {
        try {
          userInfo = JSON.parse(userInfo)
        } catch (e) {
          userInfo = null
          console.error('解析用户信息失败', e)
        }
      }
      const globalParams = {
        ...params,
        user: userInfo,
        user_no: userInfo?.user_no || '',
        userInfo: userInfo || '',
      }

      if (req.hasOwnProperty('condition') && req.condition.length > 0) {
        for (let cond of req.condition) {
          try {
            let condModel = this.bxDeepClone(cond)
            if (cond.var_src === '页面接口参数') {
              cond.value_key = cond.value;
              // 页面接口参数 从页面参数中取值
              delete condModel.var_src;
              delete condModel.value;
              if (this.pageParamsModel && typeof this.pageParamsModel === 'object' && cond.value_key && this.pageParamsModel[cond.value_key]?.value) {
                condModel.value = this.pageParamsModel[cond.value_key].value;
              }
            } else if (cond && condModel.value && condModel.value.indexOf('${') !== -1 && condModel.value.indexOf('}') !== -
              1 && params) {
              try {
                const renderedValue = this.renderStr(condModel.value, globalParams);
                if (renderedValue && renderedValue.indexOf('[object') == -1) {
                  condModel.value = renderedValue
                } else {
                  let key = condModel.value
                  var sreg = new RegExp("\\${", "g"); // 加'g'，删除字符串里所有的"a"
                  var ereg = new RegExp("\\}", "g"); // 加'g'，删除字符串里所有的"a"
                  key = key.replace(sreg, "");
                  key = key.replace(ereg, "");
                  condModel.value = params && params.hasOwnProperty(key) ? params[key] : ""
                  if (condModel.value?.value) {
                    condModel.value = condModel.value.value
                  }
                }
              } catch (renderError) {
                console.warn('Error rendering condition value:', renderError);
              }

            }

            // 日期关键词 转换为对应的时间字符
            if (typeof condModel.value === 'string' && getDateKeys().includes(condModel.value)) {
              condModel.value = getDateByKey(condModel.value);
            }

            if (Array.isArray(condModel.value) && condModel.value.length === 2) {
              // 范围查询 ruleType改为between
              condModel.ruleType = 'between'
            }

            conds.push(this.bxDeepClone(condModel))

          } catch (condError) {
            console.error();
            console.warn('Error processing condition:', condError);
            // 出错时添加原始条件，避免请求失败
            conds.push(this.deepClone(cond));
          }


        }
        req.condition = conds.map(item => item)
      }
      let type = this.comType
      switch (type) {
        case 'list':
          break;
        default:
          break;
      }

      return req
    },
    serviceName: function () {
      let srv = this.srvReq?.serviceName || ''
      return srv
    }
  },

  methods: {
    // Vue.prototype.
    paramsBuild(json) {
      if (!json) {
        return
      }
      let configJson = json
      //  url   sys user page com srv_col srv_cond
      let target = configJson?.dest_owner // 目标
      let source = configJson?.src_owner // 源
      let map = configJson?.cols_map_json || {}
      let maps = {
        target: {},
        source: {}
      }
      maps['target'][target] = map
      return maps


    },
    refreshComponent() {
      let type = this.compType
      if ((type == 'list' || type == 'form' || type == 'cardGroup') && this.hasOwnProperty('refresh')) {
        this.refresh()
      }

    },
    initItemParams() {
      let itemParams = {}
      let type = this.compType
      switch (type) {
        case value:
          break;
        default:
          break;
      }
      // 	if (!this.urlSearchParams || Object.keys(this.urlSearchParams).length === 0) {
      // 		this.pageParams.forEach(item => {
      // 			item.value = item.default_val || ''
      // 		})
      // 	} else if(this.pageParams){
      // for(let param of this.pageParams){
      // 	for (let key in this.urlSearchParams) {
      // 		if (key == param.para_name && this.urlSearchParams[key]) {
      // 			param.value = this.urlSearchParams[key]
      // 		}
      // 	}
      // }
      // 	}
    },

  },
  created() {
    if (this.$route.query) {
      this.componentParamsModels = this.$route.query;
    }
  },
  mounted() {
    this.$on('refresh-component', (data) => {
      this.refreshComponent()
    });
    this.$on('pageItemParamsComponent', (data) => {
    });
  },

  watch: {
    "srvReq": {
      deep: true,
      handler: function (newVal, oldVal) {
        if (!this.isisIndexedList && JSON.stringify(newVal.condition) !== JSON.stringify(oldVal.condition)) {

          this.refreshComponent()
        }
      }
    }
  }
};