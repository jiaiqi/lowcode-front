import {$http} from "@/common/http";

export default class VideoUtil{
    //获取区域视频列表树
    async getVideoListByArea(params){
        //28环境地址
        let url = window.backendIpAddr +`/iot/select/srv_park_park_area_channel_select`
        let req={
            serviceName: "srv_park_park_area_channel_select",
            condition: [{"colName": "area_name", "ruleType": "like", "value": ""}],
            "treeData":true,
            colNames: ["*"],
        }

        return $http.post(url, req)
    }
    //测试详情
    async testDetails(params){
        let url= window.backendIpAddr+`/park/select/srvbu_store_person_apply_review_select`
        let req={
            colNames: ["*"],
            page:{pageNo: 1, rownumber: 10},
            serviceName:"srvbu_store_person_apply_review_select",
            mapp: "park",
            srv_type: "select",
            mdata: true
        }
        return $http.post(url,req)
    }
}