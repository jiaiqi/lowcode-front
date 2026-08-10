
  import { $http } from "@/common/http.js";
export default {
    data(){
        return {
            pageInitStatus:false,
            comList:[],
        }
    },
    methods: {
        
          async getComList() {
            // 组件模板初始化
            const url = `/config/select/srvpage_cfg_com_cus_type_select`;
            const req = {
              serviceName: "srvpage_cfg_com_cus_type_select",
              colNames: ["*"],
            };
            const res = await $axios.post(url, req);
            if (
              res.data.state === "SUCCESS" &&
              Array.isArray(res.data.data) &&
              res.data.data.length > 0
            ) {
              this.comList = res.data.data;
              this.comList.forEach((item, i) => {
                item.timestamp = new Date().getTime() + i;
                this.comList[i]["com_type"] = item.com_type_no;
              });
              this.loading = false
            }
          },
        
  
    }
  
  };
  