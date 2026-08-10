<template>
  <div class="property-pane" :key="card_parts_no" v-loading="saveLoading" element-loading-text="保存中...">
    <legacy-form
      mode="simple-update"
      :service="cardUnitService.update"
      :pk="card_no"
      srv-app="config"
      @executor-complete="onUnitUpdate"
      @form-loaded="pageLoading = false"
      v-if="card_no && !currentCell"
    >
    </legacy-form>
    <legacy-form
      mode="simple-update"
      :service="cardPartService.update"
      :pk="card_parts_no"
      srv-app="config"
      @executor-complete="onPartsUpdate"
      @form-loaded="pageLoading = false"
      v-else-if="card_parts_no"
    >
    </legacy-form>
    <div v-else class="py-4 text-center">请先保存</div>
  </div>
</template>

<script setup>
import { ref, computed, watch, getCurrentInstance } from "vue";
import LegacyForm from "@/components/common/legacy-form.vue";
import cloneDeep from "lodash/cloneDeep";

const props = defineProps({
  cardUnit: Object,
  currentCell: Object,
  list: Array,
});

const emit = defineEmits(["saved", "unit-update", "parts-update", "loading-change"]);

const instance = getCurrentInstance();

const saveLoading = ref(false);
const cardUnitService = ref({
  select: "srvpage_cfg_card_unit_select",
  add: "srvpage_cfg_card_unit_add",
  update: "srvpage_cfg_card_unit_update",
  delete: "srvpage_cfg_card_unit_delete",
});
const cardPartService = ref({
  select: "srvpage_cfg_card_parts_select",
  add: "srvpage_cfg_card_parts_add",
  update: "srvpage_cfg_card_parts_update",
  delete: "srvpage_cfg_card_parts_delete",
});

const unitId = computed(() => props.cardUnit?.id);
const cellId = computed(() => props.currentCell?.id);
const card_no = computed(() => props.cardUnit?.card_no);
const card_parts_no = computed(() => props.currentCell?.card_parts_no);

watch(saveLoading, (newVal) => {
  emit("loading-change", newVal);
});

async function onSave() {
  console.log("保存");
  saveLoading.value = true;
  try {
    if (Array.isArray(props.list) && props.list.length) {
      const oldList = cloneDeep(props.list);
      const deleteIds = findDataByType(oldList, "delete").map((item) => item.id);
      if (deleteIds?.length) {
        const deleteObj = { serviceName: cardPartService.value.delete };
        await httpOperate("delete", deleteObj, deleteIds.toString());
      }
      const updateList = findDataByType(oldList, "update");
      console.log("updateList", updateList);
      if (updateList?.length) {
        const updateObj = [];
        const updateKeys = ["seq", "style_no", "parent_no", "card_parts_name"];
        updateList.forEach((item) => {
          const data = {};
          updateKeys.forEach((key) => {
            if (item[key]) {
              data[key] = item[key];
            }
          });
          if (!Object.keys(data).length) {
            return;
          }
          const obj = {
            serviceName: cardPartService.value.update,
            condition: [{ colName: "id", ruleType: "eq", value: item.id }],
            data: [data],
          };
          if (!item.id && item.card_parts_no) {
            obj.condition = [
              { colName: "card_parts_no", ruleType: "eq", value: item.card_parts_no },
            ];
          }
          updateObj.push(obj);
        });
        await httpOperate("update", updateObj);
      }
      const addList = findDataByType(oldList, "add");
      console.log("addList", addList);
      if (addList.length) {
        const addObj = {
          serviceName: cardPartService.value.add,
          data: buildAddReqData(addList),
        };
        const _duplicate_id = addList.find((item) => item._duplicate_id)?._duplicate_id;
        if (_duplicate_id) {
          addObj.condition = [{ colName: "id", ruleType: "eq", value: _duplicate_id }];
          addObj.duplicate = true;
        }
        const result = await httpOperate("add", addObj, null, true, false);
        console.log("result", result);
        if (result) {
          emit("saved");
        }
      }
      if (!deleteIds?.length && !updateList?.length && !addList?.length) {
        instance.proxy.$message.error("没有需要保存的内容！");
      }
    }
  } catch (error) {
    console.error("保存失败:", error);
    instance.proxy.$message.error("保存失败，请重试");
  } finally {
    saveLoading.value = false;
  }
}

function onValueChange(value, type) {
  console.log("值变化", value, type);
}

function onUnitUpdate(event) {
  console.log("卡片单元更新完成", event);
  emit("unit-update");
}

function onPartsUpdate(event) {
  console.log("卡片部件更新完成", event);
  emit("parts-update");
}

function buildAddReqData(list) {
  if (!list?.length) {
    return [];
  }
  const ignoreField = [
    "label", "icon", "children", "value", "type", "component",
    "_editType", "_id", "id", "_is_delete", "_duplicate_id", "chart_json",
  ];
  return list
    .filter((item) => item && !item._is_delete)
    .map((item) => {
      let data = { ...item };
      ignoreField.forEach((field) => delete data[field]);
      return {
        ...data,
        card_no: card_no.value,
        child_data_list: item?.children?.length
          ? buildAddChildren(item.children)
          : [],
      };
    });
}

function buildAddChildren(list) {
  const ignoreField = [
    "label", "icon", "children", "value", "type", "component",
    "_editType", "_id", "id", "_is_delete", "_duplicate_id", "chart_json",
  ];
  if (Array.isArray(list) && list.length) {
    return list
      .filter((item) => item && !item._is_delete)
      .map((item) => {
        if (!item) {
          console.log(list);
        }
        let data = { ...item };
        ignoreField.forEach((field) => delete data[field]);
        let obj = {
          serviceName: cardPartService.value.add,
          condition: [],
          depend_keys: [
            { type: "column", add_col: "parent_no", depend_key: "card_parts_no" },
          ],
          data: [
            {
              ...data,
              card_no: card_no.value,
              child_data_list: item?.children?.length
                ? buildAddChildren(item.children)
                : [],
            },
          ],
        };
        if (item._duplicate_id) {
          obj.condition = [
            { colName: "id", ruleType: "eq", value: item._duplicate_id },
          ];
          obj.duplicate = true;
        }
        return obj;
      });
  }
  return [];
}

async function httpOperate(type, o, id, returnData, returnChildren) {
  let params = [];
  switch (type) {
    case "add": {
      let obj = {
        serviceName: o.serviceName,
        srvApp: "config",
        data: o.data,
      };
      if (o.condition) {
        obj.condition = o.condition;
      }
      if (o.duplicate) {
        obj.duplicate = o.duplicate;
      }
      params = [obj];
      break;
    }
    case "update":
    case "batch_add":
      params = o;
      break;
    case "delete":
      params = [
        {
          serviceName: o.serviceName,
          srvApp: "config",
          condition: [{ colName: "id", ruleType: "in", value: id }],
        },
      ];
      break;
  }

  const response = await instance.proxy.operate(params);
  if (response.data.state === "SUCCESS") {
    if (type === "batch_add") {
      return response.data.response;
    }
    if (returnChildren) {
      return response.data.response[0].child_data_list;
    }
    if (returnData) {
      return response.data.response[0].response.effect_data[0];
    }
    return response.data.response[0].response;
  } else {
    instance.proxy.$message.error(response.body.resultMessage);
  }
}

function findDataByType(list, type) {
  let result = [];
  if (!type) {
    return [];
  }
  if (Array.isArray(list) && list.length) {
    list.forEach((item) => {
      if (item?._editType === type && !item._is_delete) {
        let obj = {};
        Object.keys(item).forEach((key) => {
          if (
            item[key] &&
            typeof key === "string" &&
            (!key?.startsWith("_") || key === "_duplicate_id")
          ) {
            obj[key] = item[key];
          }
        });
        result.push(obj);
        if (
          type === "delete" &&
          Array.isArray(item?.children) &&
          item?.children.length
        ) {
          const flatChildren = (list) => {
            let res = [];
            if (Array.isArray(list) && list.length) {
              list.forEach((item) => {
                if (item?._editType === "delete") {
                  res.push(item);
                }
                if (Array.isArray(item?.children) && item?.children.length) {
                  res = res.concat(flatChildren(item?.children));
                }
              });
            }
            return res;
          };
          const children = flatChildren(item?.children);
          if (children.length) {
            result = result.concat(children);
          }
        }
      } else if (Array.isArray(item?.children) && item?.children.length) {
        result = result.concat(findDataByType(item?.children, type));
      }
    });
  }
  return result;
}

// 暴露方法供父组件调用
defineExpose({ onSave });
</script>

<style lang="scss" scoped>
.property-pane {
  background-color: #fff;
  ::v-deep .form-view-wrapper {
    max-height: calc(100vh - 175px);
    overflow-y: auto;
  }
  :deep(.el-form) {
    > .el-row {
      border: none;
    }
    .el-col {
      width: 100%;
      .el-form-item {
        display: flex;
        flex-direction: column;
      }
      .el-form-item__label {
        width: 100% !important;
        text-align: left;
      }
      .el-form-item__content {
        width: 100% !important;
        margin-left: 0 !important;
      }
    }
  }
}
</style>
