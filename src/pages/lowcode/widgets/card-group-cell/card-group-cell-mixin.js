// import paramsModelsMixin from '@/common/paramsModelsMixin.js';
import { mapGetters, } from "vuex";

export default {
  data() {
    return {
      componentParamsModels: null
    };
  },
  mixins: [],
  components: {},
  props: {


  },

  computed: {
    ...mapGetters("loginInfo", ["logined", "loginUser"]),
    colsMapDetailJson() {
      // 组件参数 的map array  接口返回数据格式 无法确定接口时啥样子，小程序 逻辑使用com_para_with_map_json 但没值，改用有值的 page_com_cols_map_json
      let pageComColsMapJson = this.pageItem.page_com_cols_map_json || null
      let colsMapDetailJson = null
      if (pageComColsMapJson) {
        // 识别、处理组件到页面参数联动
        if (pageComColsMapJson.cols_map_detail_json && Array.isArray(pageComColsMapJson.cols_map_detail_json)) {
          colsMapDetailJson = pageComColsMapJson.cols_map_detail_json
          console.log('colsMapDetailJson', colsMapDetailJson)
        }

      }
      return colsMapDetailJson

    },
    componentParamsModelsRun() {
      let model = this.bxDeepClone(this.componentParamsModels) || {}
      return model
    },
    // 移植参数相关
    compInitParams: function () {
      // 组件参数初始化 this.srvReq && Object.keys(this.srvReq).length == 0 &&
      let obj = {}
      let model = {}
      let pageComColsMapJson = this.pageItem.page_com_cols_map_json || null
      let colsMapDetailJson = null
      if (pageComColsMapJson) {
        // 识别、处理组件到页面参数联动
        if (pageComColsMapJson.cols_map_detail_json && Array.isArray(pageComColsMapJson.cols_map_detail_json)) {
          colsMapDetailJson = pageComColsMapJson.cols_map_detail_json
          console.log('colsMapDetailJson', colsMapDetailJson)
        }

      }
      if (this.pageItem && this.pageItem.com_para_with_map_json) {
        let params = this.pageItem?.com_para_with_map_json
        params = this.pageItem?.com_para_with_map_json || []

        let paramsObj = {}
        paramsObj = {}
        if (Array.isArray(params) && params.length > 0 && this.pageParamsModel) {
          for (let key of params) {
            console.log('srcs', key)
            paramsObj[key.para] = {
              "type": key.p_type,
              "value": key.value || key.default_val,
              "initValue": key.default_val,
              "dest_map": key.dest_map,
              "src_map": key.src_map,
            }
            let srcs = key.src_map
            if (srcs.length > 0) {
              for (let sItem of srcs) {
                console.log('srcs', srcs, sItem)
                if (sItem.from_type == '页面' && sItem.trigger_time == '联动' && this.pageParamsModel[sItem.col_from]) {
                  paramsObj[key.para]['value'] = this.pageParamsModel[sItem.col_from] ? this.pageParamsModel[sItem.col_from].value : ''
                }
              }
            }
          }
          obj = {
            // ...obj,
            ...paramsObj
          }
        }
      }


      return obj
    }
  },

  methods: {
    itemParamsBuild() {
      let itemParams = {}
      let paramList = null
      if (this.compInitParams) {
        paramList = this.compInitParams
        for (let item in paramList) {
          if (typeof paramList[item] == 'string' || typeof paramList[item] == 'function') {
            itemParams[item] = paramList[item]
          } else if (paramList[item]) {
            itemParams[item] = paramList[item].value ? paramList[item].value : paramList[item].initValue
          }
        }
      }
      this.componentParamsModels = this.bxDeepClone(itemParams)
      for (let key in itemParams) {
        this.$set(this.componentParamsModels, key, itemParams[key])
      }

    },
    partsShow(item, map, itemData) {
      let show = true
      // 根据显示条件判断是否显示 islogin代表是否登录
      if (item.disp_flag && item?.disp_variable?.toLowerCase() === 'islogin') {
        if (item.disp_flag === '显示') {
          return item.disp_compare_value === '是' ? !!this.logined : !this.logined
        } else if (item.disp_flag === '隐藏') {
          return item.disp_compare_value === '是' ? !this.logined : !!this.logined
        }
      }
      // console.log('dispValue', item, map, itemData)
      if (item && itemData) {
        if (item.disp_flag == '显示' && item.disp_variable && map.hasOwnProperty(item.disp_variable)) {
          show = false
          let val = itemData[map[item.disp_variable]] || this.queryOptions[map[item.disp_variable]] || null
          let dispValue = item.disp_compare_value || null // 显示值
          if (dispValue && val) {
            dispValue = dispValue.split(',')
            // console.log('dispValue1',dispValue,val,itemData.target_name)
            if (dispValue.indexOf(val) !== -1) {
              show = true
            }
          }

        } else if (item.disp_flag == '隐藏' && item.disp_variable && map.hasOwnProperty(item.disp_variable)) {
          show = true
          let val = itemData[map[item.disp_variable]] || this.queryOptions[map[item.disp_variable]] || null
          let dispValue = item.disp_compare_value || null // 隐藏值
          if (dispValue && val) {
            dispValue = dispValue.split(',')
            // console.log('dispValue',dispValue,val,itemData,itemData.target_name)
            if (dispValue.indexOf(val) !== -1) {
              show = false
            }

          }
        }

      }
      // console.log('dispValue2',itemData.rent_type,itemData.rent_status,show)
      if (!show) {
        console.log('dispValue2', itemData.rent_type, itemData.rent_status, show)
      }
      return show
    }
  },
  mounted() {
    this.itemParamsBuild()
  },

  watch: {
    "componentParamsModelsRun": {
      deep: true,
      immediate: true,
      handler: function (newVal, oldVal) {
        // console.log('componentParamsModelsRun',this.deepClone(newVal).current_value,this.deepClone(oldVal).current_value)
        for (let o in oldVal) {
          for (let n in newVal) {
            if (o == n && newVal[n] != oldVal[o]) {
              let key = this.getParamsDestKey(n, '页面')

              // console.log('value updateed :',key,n,newVal[n])
              if (key) {
                console.log('value updateed set $emit:', key, n, newVal[n])
                this.$emit('setPageParams', key, newVal[n])
              }

            }
          }
        }
      }
    },
    "activeMode": {
      deep: true,
      immediate: true,
      handler: function (newVal, oldVal) {
        // console.log('componentParamsModelsRun',this.deepClone(newVal).current_value,this.deepClone(oldVal).current_value)
        // 选中数据更新后 进行参数更新输出逻辑
        let pageParams = this.colsMapDetailJson
        if (Array.isArray(pageParams)) {
          for (let p of pageParams) {
            if (p && p.to_type == '页面' && p.from_type == '业务' && newVal && newVal.hasOwnProperty(p.col_from)) {
              // 目前先支持业务代表选中行 到 页面参数 输出到页面
              this.$emit('setPageParams', p.col_to, newVal[p.col_from])

            }
          }
        }
      }
    },
    // "pageParamsModel": {
    //   deep: true,
    //   immediate: true,
    //   handler: function(newVal, oldVal) {
    //     // console.log('componentParamsModelsRun',this.deepClone(newVal).current_value,this.deepClone(oldVal).current_value)
    //     // 选中数据更新后 进行参数更新输出逻辑
    //     // let pageParams = this.colsMapDetailJson
    //     console.log('输入参数更新pageParamsModel',newVal,this.bxDeepClone(oldVal))
    //     // if(Array.isArray(pageParams)){
    //     //   for(let p of pageParams){
    //     //      if(p && p.to_type == '页面' && p.from_type == '业务' && newVal && newVal.hasOwnProperty(p.col_from)){
    //     //       // 目前先支持业务代表选中行 到 页面参数 输出到页面
    //     //       this.$emit('setPageParams', p.col_to, newVal[p.col_from])
    //     //      }
    //     //   }
    //     // }
    //   }
    // },
  }
};