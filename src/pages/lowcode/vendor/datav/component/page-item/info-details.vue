<template>
  <div class="info_details">
<!--    <div class="del_title">-->
<!--      <span class="del_icon"><i class="el-icon-tickets"></i></span>-->
<!--      <span>基本信息</span>-->
<!--    </div>-->
    <div class="del_content" v-if="infoDetails.length>0">
      <div class="del_rows" v-for="(item,index) in infoDetails" :key="item.code" :style="textStyle">
        <span>{{item.label+'：'}}</span>
        <span>{{item.value?item.value:'暂无信息'}}</span>
      </div>
    </div>
    <div v-else class="del_des">
       暂无数据详情
    </div>
  </div>
</template>

<script>
import {$http} from "@/common/http";
export default {
  name: "info-detailsl",
  data() {
    return {
      infoDetails:[]
    }
  },
  props: {
    pageItem:{
      type:Object,
    },
    pageParamsModel:{
      type:Object,
    }
  },

  computed:{
    setDataInfo(){
      return this.pageItem.srv_req_type==='请求数据'? this.pageItem.srv_req_json:null
    },
    textStyle(){
      let style = this.pageItem.style_json
      if(style){
        return{
          color:style.color,
          fontSize:style.font_size,
          fontWeight:style.font_weight,
          textAlign:style.text_align
        }
      }else {
        return {}
      }
    },
  },
  created(){
   let operate_params = this.$route.query;
   console.log('---当前组件信息',this.pageItem);
    this.initInfoDetails(operate_params?operate_params:null);
  },
  methods:{
    initInfoDetails(params){
      if(!this.setDataInfo) return this.infoDetails=[]
      const req = this.setDataInfo ? this.buildRequestParams(this.setDataInfo) : this.setDataInfo;
      let baseQuery = req.condition?req.condition[0].colName:"";
      let keys=Object.keys(params);
      let condition=[]
      if(keys){
        let tep=keys.find(item=>item===baseQuery);
        condition=[{"colName": baseQuery, "ruleType": "eq", value:params[tep]}]
      }
      let setParams={
        page:req.page,
        serviceName:req.serviceName,
        mdata:true,
        colNames:['*'],
        condition:condition,
      }
     this.getInfoData(req,setParams)
    },
   async getInfoData (req,params){
      const url = `/${req.mapp}/select/${req.serviceName}`;
      try {
        const res = await $http.post(url, params);
        if(res.data.state!=='SUCCESS') {
          this.$emit('data-loaded', { count: 0 });
          return;
        }
        let columns=res.data.mdata
        let rows=res.data.data[0]
        let ls = this.handleFilterData(columns,rows)
        this.infoDetails=ls
        // 通知父组件数据已加载（用于"没数据时隐藏"）
        this.$emit('data-loaded', { count: ls && ls.length > 0 ? 1 : 0 });
      } catch (error) {
        console.error("info-details getInfoData error:", error);
        this.$emit('data-loaded', { count: 0 });
      }
   },

    handleFilterData(cl,row){
      return cl.map(item => {
        return {
          label: item.label,
          code: Object.keys(row).find(key => key === item.columns),
          value: row[item.columns],
          desc: item.label || item.columns
        }
      }).filter(item => item.code && item.code !== 'id') // 过滤掉不存在于row中的键和code为'id'的项
    },
    buildRequestParams(e){
      // 处理请求中变量 根据参数关系 获取动态值
      let condition = this.bxDeepClone(e.condition);
      if (Array.isArray(condition)) {
        for (let cond of condition) {
          // console.log("buildRequestParams", cond.colName, cond.value);
          if (
              cond.value &&
              cond.value.startsWith("${") &&
              cond.value.endsWith("}")
          ) {
            // 根据${} 格式转移变量名称
            let par = cond.value.replace("${", "");

            par = par.replace("}", "");
            let params = this.bxDeepClone(this.pageParamsModel);
            if (params && Object.keys(params).length > 0) {
              for (let key in params) {
                // console.log('key',key,par)
                if (key === par) {
                  let mapsCol = mapsJonss.filter(
                      (item) => item.col_to === par || item.col_from === par
                  );
                  if (Array.isArray(mapsCol) && mapsCol.length > 0) {
                    // 遍历组件参数 映射
                    let model = null;
                    for (let col of mapsCol) {
                      switch (col.from_type) {
                        case "页面":
                          // 来源为页面
                          model = this.pageParamsModel;
                          switch (col.to_type) {
                            case "组件":
                              // 目标为组件的参数，设置动态获取的值
                              cond.value = this.pageParamsModel[key].value;
                              if (
                                  cond.value === undefined &&
                                  cond.ruleType === "eq"
                              ) {
                                cond.ruleType = "like";
                              }
                              break;
                            case "页面":
                              break;

                            default:
                              break;
                          }
                          break;

                        default:
                          break;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      e.condition = this.bxDeepClone(condition);
      // console.log(e.serviceName,condition)
      return e;
    }
  }
}
</script>
<style scoped lang="scss">
.info_details {
  box-sizing: border-box;
  width: 100%;
  height:auto;
  overflow: auto;
}
.del_icon{
  color: #0e77ea;
  margin-right:0.625rem;
  font-size:1.5rem;
}
.del_title{
  width:100%;
  box-sizing: border-box;
  padding:0.3125rem 0;
  font-size:1.125rem;
  color:#000;
  font-weight:700;
  display: flex;
  align-items: center;
}
.del_des{
  padding:0.9375rem 0;
  width:100%;
  text-align:center;
}
.del_rows{
  margin:0.25rem 0;
}
</style>