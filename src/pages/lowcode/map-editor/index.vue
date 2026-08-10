<template>
  <div
    v-if="mapJson"
    class="map-editor"
  >
    <MapViewContent
      :map-json="mapJson"
      :marker-list="markerList"
    />
  </div>
</template>

<script>
import MapViewContent from '@/pages/lowcode/vendor/datav/component/page-item/map-card/components/MapViewContent.vue';
import { $http, $selectOne, $selectList, $delete } from "@/common/http";

export default {
  components: {
    MapViewContent,
  },
  data() {
    return {
      mapConfig: {},
      markerList: []
    }
  },
  methods: {
    async getMapConfig() {
      const url = `/config/select/srvpage_cfg_com_map_select`
      const req = {
        "serviceName": "srvpage_cfg_com_map_select",
        "colNames": ["*"],
        "condition": [{ "colName": "map_no", "ruleType": "like", "value": this.$route.params.mapNo }],
        "page": { "pageNo": 1, "rownumber": 1 }
      }
      const res = await $selectOne(url, req)
      if (res.ok) {
        this.mapConfig = res.data
      } else if (res.msg) {
        MessageBox.error(res.msg)
      }
    },

    async fetchAllMarkers(sourceJson) {
      let successCount = 0
      this.markerList = []
      for (let src of sourceJson) {
        try {
          const res = await this.getMarkers(src)
          if (res.ok) {
            successCount++
          }
          if (Array.isArray(res.data)) {
            this.markerList.push(...res.data)
          }
        } catch (error) {
          console.error(`数据源 ${src.poi_name} 请求失败：`, error)
        }
      }
    },

    /**
     * 获取标记点数据
     * @param {Object} params - 请求参数
     * @param {Object} params.srv_req_json - 服务请求配置
     * @param {string} params.poi_name - POI名称
     * @param {string} params.poi_type - POI类型
     * @param {Object} params.col_map - 列映射配置
     */
    async getMarkers(params = {}) {
      let { srv_req_json: p, poi_name, poi_type, col_map } = params
      if (params.srv_req_info) {
        // 配置变动,srv_req_json改为从srv_req_info中获取
        p = params.srv_req_info.srv_req_json
      } else {
        console.warn('获取标记点数据：缺少必要的服务配置参数', params)
        return
      }


      // 参数验证
      if (!p || !p.mapp || !p.serviceName) {
        console.warn('获取标记点数据：缺少必要的服务配置参数', params)
        return
      }

      const reqInfo = params.srv_req_info
      const {
        map_filter_poi_col: filterCol, // condition中的colName
        map_filter_poi_rule: ruleType, // 比较规则
        poi_refer_map_filter_col: dataCol // 数据中对应的字段
      } = reqInfo;

      // if (filterCol && ruleType && dataCol && props.mapData[dataCol]) {
      //   const obj = {
      //     colName: filterCol,
      //     value: props.mapData[dataCol],
      //     ruleType: ruleType === '等于' ? 'eq' : 'like]'
      //   }
      //   if (p.condition) {
      //     p.condition.push(obj)
      //   } else {
      //     p.condition = [obj]
      //   }
      // }
      // let pageParamsModel = cloneDeep(props.pageParamsModel)

      // if (pageParamsModel && typeof pageParamsModel === 'object') {
      //   for (let key in pageParamsModel) {
      //     if (pageParamsModel[key]?.value) {
      //       pageParamsModel[key] = pageParamsModel[key].value
      //     }
      //   }
      // }

      // if (p.condition?.length) {
      //   const globalParams = {
      //     ...pageParamsModel || {},
      //     ...props.mapData || {}
      //   }
      //   const conditions = cloneDeep(p.condition)
      //   const conds = []
      //   for (let cond of conditions) {
      //     let condModel = cloneDeep(cond)
      //     condModel._raw_value = condModel.value
      //     if (cond && condModel.value && condModel.value.indexOf('${') !== -1 && condModel.value.indexOf('}') !== -
      //       1 && params) {
      //       if (renderStr(condModel.value, globalParams) && renderStr(condModel.value, globalParams).indexOf('[object') == -1) {
      //         condModel.value = renderStr(condModel.value, globalParams)
      //       } else {
      //         let key = condModel.value
      //         var sreg = new RegExp("\\${", "g"); // 加'g'，删除字符串里所有的"a"
      //         var ereg = new RegExp("\}", "g"); // 加'g'，删除字符串里所有的"a"
      //         key = key.replace(sreg, "");
      //         key = key.replace(ereg, "");
      //         console.log('--srvReq', params, key)
      //         condModel.value = params && params.hasOwnProperty(key) ? params[key] : ""
      //         if (condModel.value?.value) {
      //           condModel.value = condModel.value.value
      //         }
      //       }
      //     }
      //     conds.push(cloneDeep(condModel))
      //   }
      //   p.condition = conds
      // }
      try {
        const url = `/${p.mapp}/select/${p.serviceName}`
        const res = await $http.post(url, p)

        if (res?.data?.state === 'SUCCESS') {
          const data = res.data.data

          // 数据验证
          if (!Array.isArray(data)) {
            console.warn('获取标记点数据：返回数据格式不正确', data)
            return
          }

          // 处理数据，添加POI信息和列映射
          const list = data.map(item => ({
            ...item,
            _poi_info: {
              poi_name,
              poi_type,
              ...params
            },
            _col_map: col_map || {}
          }))
          return {
            ok: true,
            data: list
          }
        } else {
          const errorMsg = res?.data?.resultMessage || '获取标记点数据失败'
          console.error('获取标记点数据失败：', errorMsg)
          MessageBox.error(errorMsg)
          error.value = errorMsg
        }
      } catch (err) {
        const errorMsg = `获取标记点数据异常：${err.message}`
        console.error(errorMsg, err)
        MessageBox.error(errorMsg)
        error.value = errorMsg
      }
    },
  },
  computed: {
    mapJson() {
      let row_json = this.mapConfig?.row_json
      if (row_json) {
        return JSON.parse(row_json)
      }
    },
    markerSourceConfig() {
      return this.mapJson?.multi_src_poi_json
    },
  },
  watch: {
    markerSourceConfig: {
      immediate: true,
      deep: true,
      handler(newValue, oldValue) {
        if (Array.isArray(newValue) && newValue.length) {
          this.fetchAllMarkers(newValue)
        }
      }
    }
  },
  created() {
    if (this.$route.params.mapNo) {
      this.getMapConfig()
    }
  },
}
</script>

<style lang="scss" scoped>
.map-editor {
  width:80vw;
  height: 80vh;
  border: 1px solid #ccc;
}
</style>