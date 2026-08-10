
  import { $http } from "@/common/http.js";
  export default {
    props: { 
        "pageParamsModel":{
          type: Object
        },
        "pageNo":{
            type: String
        }
    },
      data(){
          return {
              "_currentDataModel":null,  // 单元组件数据 激活的，标识当前组件活动的数据对象，列表则为选中行（）
          }
      },
      computed:{
            // 移植参数相关
            compInitParams: function() {
                // 组件参数初始化 this.srvReq && Object.keys(this.srvReq).length == 0 &&
                let obj = {}
                let model = {}
                if ( this.pageItem && this.pageItem.com_para_with_map_json) {
                    let params = this.pageItem?.com_para_with_map_json
                    params = this.pageItem?.com_para_with_map_json || []
            
                    let paramsObj = {}
                    paramsObj = {}
                    if (params && params.length > 0 && this.pageParamsModel) {
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
                                paramsObj[key.para]['value'] = this.pageParamsModel[sItem.col_from] ? this.pageParamsModel[sItem
                                    .col_from].value : ''
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
        setPageParams(key, val) {
            // 输出参数更新到页面
            let self = this
            self.$emit('setPageParams', key, val)
        },
      }
    
    };
    