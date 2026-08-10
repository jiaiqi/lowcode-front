<template>
    <div>
        <div class="statistic-box">
            <div class="statistic-item" v-for="item in stasticData">
                <div class="label">{{ item.label }}</div>
                <div class="value">{{ item.value || '0' }}
                    <span
                        v-if="v2Data && v2Data.cfgJson && v2Data.cfgJson.statistics_card_col_unit">{{ v2Data.cfgJson.statistics_card_col_unit }}</span>
                </div>
            </div>
        </div>
        <div class="bx-table">
            <div class="table-head">
                <div class="table-column" v-for="col in tableColumn">
                    {{ col.label }}
                </div>
            </div>
            <div class="table-row" v-for="item in tableData" :class="{stripe:stripe}">
                <div class="table-column" v-for="col in tableColumn">
                    {{ formatValue(item, col) }}
                </div>
            </div>
        </div>

        <!-- <dv-scroll-board :config="config" style="width:500px;height:220px" /> -->
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { $http } from "@/common/http.js";
import { applyEncryptParam } from "@/pages/lowcode/vendor/datav/common/index.js";

const props = defineProps({
    pageItem: {
        type: Object,
    },
});

const list_options = props.pageItem?.list_json?.list_options || ''

const stripe = computed(()=>{
    return props.pageItem?.list_json?.list_options&&props.pageItem?.list_json?.list_options.indexOf('斑马纹')>-1
})

const carousel = computed(()=>{
    return props.pageItem?.list_json?.list_options&&props.pageItem?.list_json?.list_options.indexOf('滚动')>-1
})

const config = computed(() => {
    let res = {
        header: [],
        data: []
    }
    if (Array.isArray(tableColumn.value) && tableColumn.value.length > 0) {
        res.header = tableColumn.value.map(item => item.label)
        if (Array.isArray(tableData.value) && tableData.value.length > 0) {
            res.data = tableData.value.map(item => {
                let val = []
                tableColumn.value.forEach(col => {
                    val.push(item[col.columns])
                })
                return val
            })
        }
    }

    return res
})
const formatValue = (row, col) => {
    const colName = col?.columns || col?.column || col?.col_name || col?.name;
    let res = row?.[colName];
    return applyEncryptParam(row, [colName, col?.columns, col?.column], res);
}
const tableData = ref(null);
const tableColumn = computed(() => {
    let cols = v2Data.value?.srv_cols || [];
    cols = cols.filter((item) => item.in_list === 1);
    return cols.slice(0, 6);
});

const statisticList = computed(() => {
    let res = []
    if (v2Data.value?.cfgJson?.statistics_card_col) {
        let col = v2Data.value.srv_cols.find(item => item.columns === v2Data.value.cfgJson?.statistics_card_col)
        if (col && Array.isArray(col.option_list_v2)) {
            res = col.option_list_v2
        }

    }
    return res

})
const stasticData = ref([])
const getStatisticData = async (req) => {
    const colName = v2Data.value?.cfgJson?.statistics_card_col
    const col = v2Data.value?.srv_cols.find(item => item.columns === colName)
    if (col && col.col_type==='Enum') {
        const group = [
            {
                "colName": colName,
                "type": "by"
            },
            {
                "colName": colName,
                "type": "count",
                'aliasName': 'count'
            }
        ]
        req.condition = req.condition||[]
        req.condition.push({
            colName,
            ruleType:'notnull',
            value:null
        })
        const url = `/${req.mapp}/select/${req.serviceName}`;
        req.group = group
        const res = await $http.post(url, req);
        if (res.data.state === "SUCCESS") {
            if (Array.isArray(res.data.data) && res.data.data.length > 0) {
                // stasticData
                res.data.data.forEach(item => {
                    item.label = item[colName]
                    item.value = item.count
                    stasticData.value.push(item)
                    // stasticData.value[item[colName]]=item.count
                })
            }
        }
    }
}

const v2Data = ref(null);

const getListData = async (req) => {
    const url = `/${req.mapp}/select/${req.serviceName}`;
    const res = await $http.post(url, req);
    if (res.data.state === "SUCCESS") {
        tableData.value = res.data.data;
    }
};
const getV2Data = async (srvCfg) => {
    const url = `/${srvCfg.mapp}/select/srvsys_service_columnex_v2_select?colsel_v2=${srvCfg.serviceName}`;
    const req = {
        serviceName: "srvsys_service_columnex_v2_select",
        colNames: ["*"],
        condition: [
            {
                colName: "service_name",
                ruleType: "eq",
                value: srvCfg.serviceName,
            },
            { colName: "use_type", ruleType: "eq", value: "list" },
        ],
        order: [{ colName: "seq", orderType: "asc" }],
    };
    const res = await $http.post(url, req);
    if (res?.data?.state === "SUCCESS") {
        if (res.data.data?.cfg_json) {
            try {
                res.data.data.cfgJson = JSON.parse(res.data.data.cfg_json)
            } catch (error) {

            }
        }
        v2Data.value = res.data.data;
    }
};
onMounted(() => {
    if (props.pageItem?.srv_req_json) {
        const req = props.pageItem.srv_req_json;
        getListData(req);
        getV2Data(req).then(_ => {
            getStatisticData(req)
        });
    }
});
</script>


<style lang="scss" scoped>
.bx-table {
    .table-head {
        background-color: rgba($color: #fff, $alpha: 0.1);
    }

    .table-head,
    .table-row {
        display: flex;
        &.stripe{
            &:nth-child(2n+1){
                background-color: rgba($color: #fff, $alpha: 0.1);
            }
        }

        .table-column {
            flex: 1;
            padding: 8px;
            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;
        }
    }
}

.statistic-box {
    display: flex;
    padding: 10px;

    .statistic-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 10px;
        background-color: #1E2750;
        margin-right: 20px;
        cursor: pointer;

        &:last-child {
            margin: 0;
        }

        .label {
            line-height: 30px;
            color: #6BA1FF;
            text-align: left;
        }

        .value {
            text-align: left;

        }
    }
}
</style>
<!-- <style lang="scss" scoped>
::v-deep .el-table,
.el-table__expanded-cell {
  background-color: transparent;
}

::v-deep .el-table {
  tr,
  th.el-table__cell {
    background-color: transparent;
  }

  th.el-table__cell {
  }

  td.el-table__cell,
  th.el-table__cell.is-leaf {
    border: none;
  }
} -->
</style>
