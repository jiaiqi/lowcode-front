<template>
  <div
    class="card-part"
    :class="{
      'card-part-row': ['row', '行容器'].includes(part.parts_type),
      'on-drag-over': isDraggingOver && !preview,
      'card-part-preview': preview,
    }"
    :data-part-id="part._id || part.id"
    :style="[setPartStyle]"
    @dragover.prevent
    @drop="onDrop($event, part)"
    @dragover.stop="onDragOver($event)"
    @dragleave.stop="onDragLeave($event)"
    @mouseover.stop=""
    v-if="partsShow"
  >
    <div
      class="overlay"
      :class="{ 'overlay--active': isSelected }"
      @click.stop="selectPart(part, $event)"
      @mouseenter="$emit('mouseenter')"
      v-context-menu="contextMenuConfig"
      v-if="!preview"
    ></div>

    <!-- 根据不同类型渲染不同内容 -->
    <template v-if="['block', 'row', '行容器','块容器'].includes(part.parts_type)">
      <card-part
        v-for="(childPart, childIndex) in part.children || []"
        :key="childPart._id || childPart.id || childIndex"
        :part="childPart"
        :index="childIndex"
        :selected-part="selectedPart"
        :preview="preview"
        :hiddenPartsVisible="hiddenPartsVisible"
        @mouseenter="$emit('mouseenter')"
        @delete-part="deleteChildPart"
        @select-part="selectPart"
        @contextmenu-item-click="handleContextMenuItemClick"
      />
    </template>

    <template v-else>
      <card-cell-part-without-card-group
        :cell-item="part"
        :page-item="{}"
        @on-click-cell="handleClickCell"
      />
    </template>
  </div>
</template>

<script>
import contextMenuDirective from "@/components/common/ContextMenu/context-menu";
export default {
  directives: {
    contextMenu: contextMenuDirective,
  },
};
</script>

<script setup>
import { ref, computed, getCurrentInstance } from "vue";
import { Icon } from "@iconify/vue2";
import CardCellPartWithoutCardGroup from "@/pages/lowcode/widgets/card-group-cell/card-cell-part-without-card-group.vue";
import { formatStyleData } from "@/pages/lowcode/common";

const props = defineProps({
  part: {
    type: Object,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
  selectedPart: [Object, null],
  preview: {
    type: Boolean,
    default: false,
  },
  hiddenPartsVisible: {
    type: Boolean,
    default: false,
  },
  hasClipboardContent: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "mouseenter",
  "delete-part",
  "select-part",
  "copy-part",
  "paste-part",
  "cut-part",
  "move-part",
  "show-properties",
  "contextmenu-item-click",
  "drop-part",
]);

const instance = getCurrentInstance();
const isDraggingOver = ref(false);

const setPartStyle = computed(() => {
  let styleJson = props.part?.style_json || {};
  let style = { ...formatStyleData(styleJson) };
  const keys = ["padding", "margin"];
  // const keys = ["padding", "margin", "background-color"];
  if (style?.["padding"] || style?.["margin"]) {
    delete style.width;
    delete style.height;
  }
  keys.forEach((key) => {
    if (style?.[key]) {
      delete style[key];
    }
  });
  return style;
});

const partsShow = computed(() => {
  const item = props.part;
  if (item._is_delete === true) {
    return false;
  }
  const itemData = {};
  const proxy = instance?.proxy;
  const map =
    proxy?.comColMap ||
    Object.keys(itemData).reduce((acc, key) => {
      acc[key] = key;
      return acc;
    }, {});
  let show = true;
  if (item.disp_flag == "隐藏" && !item.disp_variable) {
    return false;
  }
  if (item.disp_flag && item?.disp_variable?.toLowerCase() === "islogin") {
    if (item.disp_flag === "显示") {
      return item.disp_compare_value === "是"
        ? !!proxy?.logined
        : !proxy?.logined;
    } else if (item.disp_flag === "隐藏") {
      return item.disp_compare_value === "是"
        ? !proxy?.logined
        : !!proxy?.logined;
    }
  } else if (item && itemData) {
    if (
      item.disp_flag == "显示" &&
      item.disp_variable &&
      map.hasOwnProperty(item.disp_variable)
    ) {
      show = false;
      let val =
        itemData[map[item.disp_variable]] ||
        proxy?.queryOptions?.[map[item.disp_variable]] ||
        null;
      let dispValue = item.disp_compare_value || null;
      if (dispValue === "notnull") {
        show = !!val;
      } else if (dispValue && val) {
        dispValue = dispValue.split(",");
        if (dispValue.indexOf(val) !== -1) {
          show = true;
        }
      }
    } else if (
      item.disp_flag == "隐藏" &&
      item.disp_variable &&
      map.hasOwnProperty(item.disp_variable)
    ) {
      show = true;
      let val =
        itemData[map[item.disp_variable]] ||
        proxy?.queryOptions?.[map[item.disp_variable]] ||
        null;
      let dispValue = item.disp_compare_value || null;
      if (["null", "false"].includes(dispValue)) {
        show = !!val;
      } else if (dispValue && val) {
        dispValue = dispValue.split(",");
        if (dispValue.indexOf(val) !== -1) {
          show = false;
        }
      }
    }
  }
  if (!show) {
    console.log("dispValue2", itemData.rent_type, itemData.rent_status, show);
  }
  return show;
});

const isSelected = computed(() => {
  if (!props.selectedPart) {
    return false;
  }
  if (props.selectedPart._id && props.selectedPart._id === props.part?._id) {
    return true;
  }
  if (
    props.selectedPart.card_parts_no &&
    props.selectedPart.card_parts_no === props.part.card_parts_no
  ) {
    return true;
  }
  if (props.selectedPart.id && props.selectedPart.id === props.part?.id) {
    return true;
  }
  return false;
});

const hasClipboardData = computed(() => props.hasClipboardContent);

const contextMenuItems = computed(() => [
  {
    label: "复制",
    icon: "ri:file-copy-2-fill",
    action: "copy",
    shortcut: "Ctrl+C",
  },
  {
    label: "粘贴",
    icon: "ri:file-copy-2-line",
    action: "paste",
    shortcut: "Ctrl+V",
    disabled: !hasClipboardData.value,
  },
  { divider: true },
  {
    label: "删除",
    icon: "ri:delete-bin-line",
    action: "delete",
    shortcut: "Delete",
  },
]);

const contextMenuConfig = computed(() => ({
  menuItems: contextMenuItems.value,
  onItemClick: handleContextMenuItemClick,
  context: props.part,
  disabled: props.preview,
  beforeShow: (event) => {
    selectPart(props.part, event);
    return true;
  },
}));

const isFirstChild = computed(() => props.index === 0);

const isLastChild = computed(() => {
  const parent = instance?.parent;
  if (parent && parent.partsList) {
    return props.index === parent.partsList.length - 1;
  }
  return false;
});

function selectPart(part, event) {
  event?.stopPropagation?.();
  console.log("选中", part?._id || part?.id);
  emit("select-part", part || props.part);
}

function onDrop(event, part) {
  event.stopPropagation();
  const partData = JSON.parse(event.dataTransfer.getData("part"));

  if (part && ["row", "行容器"].includes(part.parts_type)) {
    if (!part.children) {
      instance.proxy.$set(part, "children", []);
    }
    const newPart = JSON.parse(JSON.stringify(partData));

    if (["row", "行容器"].includes(newPart.parts_type)) {
      newPart.children = [];
    }

    newPart._id = new Date().getTime();
    newPart._editType = "add";
    newPart.seq = (part.children.length + 1) * 100;
    newPart.card_parts_name =
      part?.label ||
      part?.parts_type ||
      `卡片部件${props.part.children.length + 1}`;
    if (props.part.card_parts_no) {
      newPart.parent_no = props.part.card_parts_no;
    }
    Object.keys(newPart).forEach((key) => {
      if (key.startsWith("_default_")) {
        newPart[key.replace("_default_", "")] = newPart[key];
        console.log("newPart", newPart);
        delete newPart[key];
      }
    });

    part.children.push(newPart);
    emit("drop-part", newPart);
  }

  isDraggingOver.value = false;
  event.currentTarget?.classList?.remove("on-drag-over");
}

function onDragOver(event) {
  console.log("进入");
  if (["row", "行容器"].includes(props.part.parts_type)) {
    isDraggingOver.value = true;
    event.currentTarget?.classList?.add("on-drag-over");
  }
}

function onDragLeave(event) {
  console.log("离开");
  if (["row", "行容器"].includes(props.part.parts_type)) {
    isDraggingOver.value = false;
    event?.currentTarget?.classList?.remove("on-drag-over");
  }
}

function deleteChildPart(part, childIndex) {
  if (part?.id || part?.card_parts_no) {
    console.log("删除子部件", part);
    return emit("delete-part", part);
  }
  if (props.part.children) {
    props.part.children.splice(childIndex, 1);
  }
}

function handleClickCell(cell) {
  console.log("卡片点击事件", cell);
  emit("select-part", props.part);
}

function handleContextMenuItemClick(item, context, event, el) {
  console.log("右键菜单项点击:", item.action, context);

  switch (item.action) {
    case "copy":
      emit("copy-part", context);
      break;
    case "paste":
      emit("paste-part", context);
      break;
    case "cut":
      emit("cut-part", context);
      break;
    case "delete":
      emit("delete-part", context);
      break;
    case "moveUp":
      emit("move-part", context, "up");
      break;
    case "moveDown":
      emit("move-part", context, "down");
      break;
    case "properties":
      emit("show-properties", context);
      break;
    default:
      console.warn("未知的菜单操作:", item.action);
  }
  emit("contextmenu-item-click", item, context, event, el);
}
</script>

<style lang="scss" scoped>
.card-part {
  position: relative;
  display: flex;
  // margin: 5px;
  border: 1px dashed #ccc;
  border-radius: 2px;
  // background-color: #fff;
  min-height: 20px;
  height: 100%;
  transition: all 0.3s ease;
  // display: inline-block;
  --primary-color: rgb(0, 108, 255);
  $primary-color: var(--primary-color);
  &.card-part-preview {
    border: none;
    background-color: transparent;
    box-shadow: none;
    border-radius: 0;
    min-height: auto;
    margin: 0;
    padding: 0;
  }
  > .overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.2s ease;

    &:hover:not(&--active) {
      background-color: rgba(0, 108, 255, 0.1);
      border: 2px dashed var(--primary-color);
    }

    &--active {
      border: 2px solid var(--primary-color);
      box-shadow: 0 0 0 2px rgba(0, 108, 255, 0.1);
      background-color: rgba(0, 108, 255, 0.1);
    }
  }
  .card-part-header {
    position: absolute;
    bottom: 0;
    left: 0;
    transform: translateY(-100%);
    background-color: var(--primary-color, #006cff);
    color: #fff;
    padding: 2px 5px;
    border-radius: 2px;
    font-size: 12px;
    white-space: nowrap;
    transition: opacity 0.3s;
    z-index: 10;
    display: flex;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.4);
    color: #fff;
    opacity: 0;
    &.selected {
      opacity: 1;
      background-color: var(--primary-color);
    }
    .el-icon-delete {
      font-size: 16px;
      cursor: pointer;
    }
    .part-label {
      border-right: 1px solid #fff;
      padding-right: 10px;
      margin-right: 10px;
    }
  }

  &:hover .el-icon-delete {
    opacity: 1;
  }
}
.card-part-row {
  display: inline-block;
  padding: 10px;
}
.card-part-row {
  padding: 10px;
  min-height: 20px;
  display: block;
  position: relative;
  width: 100%;
  &.on-drag-over {
    > .overlay {
      border: 2px dashed var(--primary-color);
      background-color: rgba(64, 158, 255, 0.1);
    }
  }
  // width: 100%;
}
</style>
