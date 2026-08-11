export default {
  data() {
    return {
      cellData: [{

      }],
      componentParamsModels: null
    };
  },
  components: {},
  props: {
    modelLevelType: {
      type: [String],
      default () {
        return 'page' // page  pageComp compTemp
      }
    },
  },

  computed: {
    componentParamsModelsRun() {
      let model = this.deepClone(this.componentParamsModels) || {}
      return model
    },
    loginUserInfo: function() {
      let isLogin = uni.getStorageSync('isLogin')
      let userInfo = isLogin ? this.deepClone(this.$store?.state?.user?.loginUserInfo || {}) : {}
      return userInfo
    },
    tenantList() {
      return this.loginUserInfo?.otherTenantInfos || []
    },
    paramsMedley: function() {
      let type = this.modelLevelType
      let model = {}
      switch (type) {
        case 'page':
          // 页面级参数
          break;
        case 'pageComp':
          //组件级参数
          break;
        case 'compTemp':
          // 组件模版级参数处理
          model = this.compInitParams
          break;
        default:
          break;
      }

      return model
    },
    paramsModels: function() {
      let models = {}
      return models
    },
    // '_destParamsModel':function(){
    //  // 输出参数
    //  let type = this.modelLevelType
    //  let models = []  // 所处mode的参数
    //  let params = {}
    //  switch (type){
    //  	case 'page':
    //  			// 页面级参数
    // 		models = this.pageParamsModel
    // 		for(let key in models){

    // 			if(models[key].hasOwnProperty('dest_map') && models[key].dest_map.length > 0){

    // 				let srcs = models[key].dest_map
    // 				let keyVals = {}
    // 				for(let item of srcs){
    // 					if(item.to_type == '组件' && params.hasOwnProperty(item.com_no)){
    // 						// 以组件编号封装来源于组件的参数映射
    // 						params[item.com_no][item.col_to] = models[key].para
    // 					}else if(item.to_type == '组件' && !params.hasOwnProperty(item.com_no)){
    // 						params[item.com_no] = keyVals
    // 						keyVals[item.col_to] = models[key].para
    // 					}
    // 				}
    // 			}
    // 		}
    //  		break;
    //  	case 'pageComp':
    //  			//组件级参数
    //  		break;
    //  	case 'compTemp':
    //  			// 组件模版级参数处理
    //  		models = this.compInitParams
    // 		// for(let key in models){
    // 		// 	if(models[key].hasOwnProperty('dest_map') && models[key].dest_map.length > 0){
    // 		// 		let srcs = models[key].dest_map
    // 		// 		let keyVals = {}
    // 		// 		for(let item of srcs){
    // 		// 			if(item.to_type == '组件' && params.hasOwnProperty(item.com_no)){
    // 		// 				// 以组件编号封装来源于组件的参数映射
    // 		// 				params[item.com_no][item.col_to] = models[key].para
    // 		// 			}else if(item.to_type == '组件' && !params.hasOwnProperty(item.com_no)){
    // 		// 				params[item.com_no] = keyVals
    // 		// 				keyVals[item.col_to] = models[key].para
    // 		// 			}
    // 		// 		}
    // 		// 	}
    // 		// }
    //  		break;
    //  	default:
    //  		break;
    //  }
    //  return params
    // },
    // '_srcParamsModel':function(){
    // 	 // 输入参数 
    //  let type = this.modelLevelType
    //  let models = []  // 所处mode的参数
    //  let params = {}
    //  switch (type){
    //  	case 'page':
    //  			// 页面级参数
    // 		models = this.pageParamsModel
    // 		for(let key in models){

    // 			if(models[key].hasOwnProperty('src_map') && models[key].src_map.length > 0){

    // 				let srcs = models[key].src_map
    // 				let keyVals = {}
    // 				for(let item of srcs){
    // 					if(item.from_type == '组件' && params.hasOwnProperty(item.com_no)){
    // 						// 以组件编号封装来源于组件的参数映射
    // 						params[item.com_no][item.col_from] = models[key].para
    // 					}else if(item.from_type == '组件' && !params.hasOwnProperty(item.com_no)){
    // 						params[item.com_no] = keyVals
    // 						keyVals[item.col_from] = models[key].para
    // 					}
    // 				}
    // 			}
    // 		}
    //  		break;
    //  	case 'pageComp':
    //  			//组件级参数
    //  		break;
    //  	case 'compTemp':
    //  			// 组件模版级参数处理
    //  			params = this.compInitParams
    //  		break;
    //  	default:
    //  		break;
    //  }
    //  return params
    // },
    compInitParams: function() {
      let type = this.compType
      let obj = {}
      let levelType = this.modelLevelType
      let model = {}
      if (levelType == 'compTemp' && this.srvReq && Object.keys(this.srvReq).length > 2 && this.pageParamsModel) {
        // 组件模版级参数处理
        obj['serviceName'] = this.srvReq?.serviceName
        obj['srvApp'] = this.srvReq?.mapp
        let params = this.pageItem?.com_para_with_map_json
        params = this.pageItem?.com_para_with_map_json || []

        let paramsObj = {}
        paramsObj = {}
        if (params && params.length > 0) {
          for (let key of params) {
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
                if (sItem.from_type == '页面' && sItem.trigger_time == '联动' && this.pageParamsModel[sItem.col_from]) {
                  paramsObj[key.para]['value'] = this.pageParamsModel[sItem.col_from] ? this.pageParamsModel[sItem
                    .col_from].value : ''
                }
              }
            }
          }
        }
        switch (type) {
          case 'form':
            let formType = this.pageItem?.form_json?.form_type
            obj['type'] = ''
            switch (formType) {
              case '详情':
                obj['type'] = 'detail'
                break;
              case '新增':
                obj['type'] = 'add'
                break;
              case '修改':
                obj['type'] = 'update'
                break;
              default:
                obj['type'] = 'add'
                break;
            }

            obj['serviceName'] = this.srvReq?.serviceName
            // obj['id'] = null
            // obj['idCol'] = 'id'
            obj['srvApp'] = this.srvReq?.mapp
            obj['success'] = function(success) {
            }
            obj = {
              ...obj,
              ...paramsObj
            }
            break;
          case 'currentInfo':
            obj['click'] = this.pageItem?.current_info_json?.on_click && this.pageItem?.current_info_json?.on_click ==
              '选择切换' ? 'select' : 'none'
            obj['serviceName'] = this.srvReq?.serviceName
            obj['srvApp'] = this.srvReq?.mapp
            obj['success'] = function(success) {
            }
            obj['optionsDatas'] = []

            obj['optionsType'] = this.pageItem?.current_info_json?.on_click && this.pageItem?.current_info_json
              ?.on_click == '选择切换' && this.pageItem?.current_info_json?.options ? this.pageItem?.current_info_json
              ?.options : 'reqData'
            if (obj['optionsType'] == '租户') {
              obj['optionsDatas'] = this.loginUserInfo.otherTenantInfos
            }

            obj = {
              ...obj,
              ...paramsObj
            }

            break;
          case 'list':
            obj['serviceName'] = this.srvReq?.serviceName
            obj['srvApp'] = this.srvReq?.mapp
            obj['success'] = function(success) {
            }
            obj = {
              ...obj,
              ...paramsObj
            }

            break;
          default:
            break;
        }
      } else if (this.srvReq && Object.keys(this.srvReq).length == 0 && this.pageItem && this.pageItem
        .com_para_with_map_json) {
        let params = this.pageItem?.com_para_with_map_json
        params = this.pageItem?.com_para_with_map_json || []

        let paramsObj = {}
        paramsObj = {}
        if (params && params.length > 0 && this.pageParamsModel) {
          for (let key of params) {
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
                if (sItem.from_type == '页面' && sItem.trigger_time == '联动' && this.pageParamsModel[sItem.col_from]) {
                  paramsObj[key.para]['value'] = this.pageParamsModel[sItem.col_from] ? this.pageParamsModel[sItem
                    .col_from].value : ''
                }
              }
            }
          }
        }
        switch (type) {
          case 'form':
            obj['type'] = 'add'
            obj['serviceName'] = this.srvReq?.serviceName
            obj['id'] = null
            obj['idCol'] = 'id'
            obj['srvApp'] = this.srvReq?.mapp
            obj['success'] = function(success) {
            }
            break;
          case 'currentInfo':
            obj['click'] = this.pageItem?.current_info_json?.on_click && this.pageItem?.current_info_json?.on_click ==
              '选择切换' ? 'select' : 'none'
            obj['serviceName'] = this.srvReq?.serviceName
            obj['srvApp'] = this.srvReq?.mapp
            obj['success'] = function(success) {
            }
            obj['optionsDatas'] = []

            obj['optionsType'] = this.pageItem?.current_info_json?.on_click && this.pageItem?.current_info_json
              ?.on_click == '选择切换' ? this.pageItem?.current_info_json?.options : 'reqData'
            if (obj['optionsType'] == '租户') {
              obj['optionsDatas'] = this.deepClone(this.loginUserInfo.otherTenantInfos)
            }

            obj = {
              ...obj,
              ...paramsObj
            }

            break;
          case 'list':
            obj['serviceName'] = this.srvReq?.serviceName
            obj['srvApp'] = this.srvReq?.mapp
            obj['success'] = function(success) {
            }
            obj = {
              ...obj,
              ...paramsObj
            }

            break;
          default:
            break;
        }
      }


      return obj
    },
  },

  methods: {
    getParamsDestKey(key, type) {
      // Cannot set reactive property on undefined, null, or primitive value: undefined  
      let list = this.compInitParams
      let toKey
      for (let p in list) {
        if (p == key && typeof list[p] == 'object') {
          let dest = list[p]
          if (dest.hasOwnProperty('dest_map') && dest.dest_map.length > 0) {
            for (let d of dest.dest_map) {
              if (d.to_type == type && d.trigger_time == '联动') {
                toKey = d.col_to
                return toKey
                break
              }
            }
          }
        }
      }
    },
    itemParamsBuild() {
      let itemParams = {}
      let paramList = null
      let type = this.modelLevelType
      switch (type) {
        case 'compTemp':
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

          break;
        case 'page':
          if (this.pageParamsModel) {
            paramList = this.pageParamsModel
            for (let item in paramList) {
              if (typeof paramList[item] == 'string' || typeof paramList[item] == 'function') {
                itemParams[item] = paramList[item]
              } else if (paramList[item]) {
                itemParams[item] = paramList[item].value ? paramList[item].value : paramList[item].initValue ?
                  paramList[item].initValue : itemParams[item]
              }
            }
          }

          break;
        default:
          break;
      }
      this.componentParamsModels = this.deepClone(itemParams)
      for (let key in itemParams) {
        this.$set(this.componentParamsModels, key, itemParams[key])
      }

    },

  },
  mounted() {
    this.itemParamsBuild()
  },
  watch: {
    "componentParamsModelsRun": {
      deep: true,
      immediate: true,
      handler: function(newVal, oldVal) {
        for (let o in oldVal) {
          for (let n in newVal) {
            if (o == n && newVal[n] != oldVal[o]) {
              let key = this.getParamsDestKey(n, '页面')

              if (key) {
                this.$emit('setPageParams', key, newVal[n])
              }

            }
          }
        }
      }
    },
    "compInitParams": {
      deep: true,
      immediate: true,
      handler: function(newVal, oldVal) {
        if (newVal && newVal.click && newVal.click == 'select') {
          this.getOptionsData()
        }
      }
    },
    "pageParamsModel": {
      deep: true,
      immediate: true,
      handler: function(newVal, oldVal) {
        if (this.hasOwnProperty('itemParamsBuild')) {
          this.itemParamsBuild()
        }
        // this.$emit('multiple-Selection-change',newVal)
      }
    }
  }
};