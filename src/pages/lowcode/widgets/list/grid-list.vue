<template>
  <div
    class="grid-list"
    :style="[setStyle]"
    v-if="config && setList && setList.length"
  >
    <div
      class="grid-item"
      v-for="(item, index) in setList"
      :key="index"
      :class="{
        'cursor-pointer':
          config.matrix_jump_url_col && item[config.matrix_jump_url_col],
      }"
      :style="[getElementStyle(item)]"
      @mouseenter="item.isHovered = true"
      @mouseleave="item.isHovered = false"
      @click="openUrl(item[config.matrix_jump_url_col])"
    >
      <img loading="lazy"
        class="grid-item-img"
        :src="getImagePath(item[config.matrix_icon_col])"
        :style="[iconStyle]"
        alt=""
        v-if="config.matrix_icon_col"
      />
      <!-- <span v-if="config.matrix_label_col"> -->
      {{ getDisplayLabel(item) }}
      <!-- </span> -->
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { formatStyleData, applyEncryptParam } from "@/pages/lowcode/common/index.js";
import { MessageBox } from "element-ui";
import { getFullBaseUrl } from "@/common/common";
const props = defineProps({
  config: Object,
  list: Array,
  pageItem: Object,
});

const getDisplayLabel = (item) => {
  const colName = props?.config?.matrix_label_col;
  const val = item?.[colName] || "";
  return applyEncryptParam(item, colName, val);
};

const setList = ref([]);
watch(
  () => props.list,
  (newVal) => {
    if (Array.isArray(newVal)) {
      setList.value = getList(newVal);
    } else {
      setList.value = [];
    }
  }
);
const getList = (list) => {
  const layout = props?.config?.layout_json || {};
  if (layout?.rows_max && layout?.cols_num > 0) {
    list = props.list.slice(0, layout.rows_max * layout.cols_num);
  }
  return list.map((item) => {
    const obj = { ...item };
    obj.isHovered = false;
    return obj;
  });
};

const setStyle = computed(() => {
  const layout = props?.config?.layout_json || {};
  let style = {};
  style["display"] = "grid";
  let height =
    layout.hasOwnProperty("style_json") &&
    layout.style_json.hasOwnProperty("height")
      ? layout.style_json.height
      : "auto";

  if (layout["rows_max"]) {
    style["grid-template-rows"] = `repeat(${layout["rows_max"]},${height})`;
  }
  style["grid-template-columns"] = `repeat(${layout["cols_num"] || 4}, 1fr)`;
  if (typeof layout["style_json"] === "object") {
    style = { ...style, ...layout["style_json"] };
  }
  if (typeof layout["style_json_diy"] === "object") {
    style = { ...style, ...layout["style_json_diy"] };
  }
  return formatStyleData(style);
});
const getElementStyle = function (item) {
  const config = props?.config;
  let style = {};
  if (config["element_style_json"]) {
    style = config["element_style_json"];
  }
  style = formatStyleData(style);
  if (item.isHovered && config["mouse_hover_style_json"]) {
    let hoverStyle = formatStyleData(config["mouse_hover_style_json"]);
    style = { ...style, ...hoverStyle };
  }
  return style;
};

// 鼠标悬浮时的样式
const hoverStyle = computed(() => {
  const config = props?.config;
  let style = {};
  if (config["mouse_hover_style_json"]) {
    style = config["mouse_hover_style_json"];
  }
  return formatStyleData(style);
});
const iconStyle = computed(() => {
  const config = props?.config;
  let style = {};
  if (config["list_icon_json"]) {
    style = config["list_icon_json"];
  } else if (config["list_icon_style_json"]) {
    style = config["list_icon_style_json"];
  }
  return formatStyleData(style);
});
function openUrl(url) {
  if (props?.pageItem?.com_option?.includes("强制登录")) {
    sessionStorage.setItem("targetPage", url);
    MessageBox.confirm("需要登录才能继续操作，是否跳转到登录？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    }).then(() => {
      top.window.location.href = `${location.origin}/${getFullBaseUrl()}/lowcode-grid/view/PG2503180001`;
    });

    return;
  }
  if (url) {
    window.open(url);
  }
}
</script>

<style lang="scss" scoped>
.grid-item {
  display: flex;
  flex-direction: column;
}
.grid-item-img {
  width: 100%;
}
.cursor-pointer {
  cursor: pointer;
}
</style>
