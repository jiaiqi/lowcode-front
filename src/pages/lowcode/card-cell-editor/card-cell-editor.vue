<template>
  <div class="card-cell-editor" ref="cardCellEditor">
    <header class="header">
      <div class="header-left">
        <h1 class="title">卡片单元设计器</h1>
        <el-tooltip content="组件大纲" placement="bottom">
          <div
            @click.stop="outlineVisible = true"
            class="handle-btn"
          >
            <Icon icon="ri-node-tree" />
          </div>
        </el-tooltip>
      </div>
      <div class="header-center">
        <template v-if="cardInfo && cardInfo.card_name">
          {{ cardInfo.card_name || "" }}
        </template>
      </div>
      <div class="header-right">
        <el-tooltip content="撤销 (Ctrl+Z)" placement="bottom">
          <div
            @click="handleUndo"
            class="handle-btn"
            :class="{ disabled: !historyInfo.canUndo }"
          >
            <Icon icon="ri:arrow-go-back-line" />
          </div>
        </el-tooltip>
        <el-tooltip content="重做 (Ctrl+Y)" placement="bottom">
          <div
            @click="handleRedo"
            class="handle-btn"
            :class="{ disabled: !historyInfo.canRedo }"
          >
            <Icon icon="ri:arrow-go-forward-line" />
          </div>
        </el-tooltip>
        <el-tooltip content="切换主题模式" placement="bottom">
          <div @click="changeTheme" class="handle-btn">
            <Icon :icon="isDarkMode ? 'ri:sun-fill' : 'ri:moon-fill'" />
          </div>
        </el-tooltip>
        <el-tooltip content="刷新" placement="bottom">
          <div
            @click="refresh"
            class="handle-btn"
            :class="{ loading: onSaving }"
          >
            <Icon icon="ri:refresh-line" />
          </div>
        </el-tooltip>
        <el-tooltip content="保存" placement="bottom">
          <div
            @click="saveCard"
            class="handle-btn"
            :class="{ loading: onSaving || propertyLoading }"
          >
            <Icon icon="ri:save-fill" />
          </div>
        </el-tooltip>
        <el-tooltip content="预览" placement="bottom">
          <div @click="previewCard" class="handle-btn">
            <Icon icon="ri:eye-fill" />
          </div>
        </el-tooltip>
      </div>
    </header>
    <main class="main">
      <aside class="materials-panel">
        <div class="panel-header">
          <h2 class="panel-title">部件</h2>
        </div>
        <div class="panel-content">
          <div class="materials-groups">
            <div
              v-for="(group, groupIndex) in cardParts"
              :key="groupIndex"
              class="material-group"
            >
              <div 
                class="group-header" 
                :class="{ 'group-header--expanded': isGroupExpanded(group.label) }"
                @click="toggleGroup(group.label)"
              >
                <div class="group-icon">
                  <Icon :icon="group.icon"></Icon>
                </div>
                <h3 class="group-title">{{ group.label }}</h3>
                <div class="group-toggle" :class="{ 'group-toggle--expanded': isGroupExpanded(group.label) }">
                  <Icon :icon="isGroupExpanded(group.label) ? 'ri:arrow-down-s-fill' : 'ri:arrow-right-s-fill'"></Icon>
                </div>
              </div>
              <div 
                v-if="isGroupExpanded(group.label)" 
                class="group-items"
              >
                <div
                  v-for="(item, itemIndex) in group.items"
                  :key="itemIndex"
                  class="material-item"
                  draggable="true"
                  @dragstart="onDragStart($event, item)"
                >
                  <div class="material-icon">
                    <Icon :icon="item.icon"></Icon>
                  </div>
                  <div class="material-name">{{ item.label }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
      <section class="editor-area">
        <div
          class="editor-container"
          ref="editorContainer"
          @click="handleContainerClick"
          tabindex="0"
          @focus="handleContainerFocus"
        >
          <div
            class="editor-content"
            :style="[setStyle]"
            ref="editorContent"
            @dragover.prevent
            @drop="onDrop($event, null)"
            @dragenter="onDragEnter($event, 'editor')"
            @dragleave="onDragLeave($event, 'editor')"
            @mouseleave="onDragLeave($event, 'editor')"
            @click.stop="handleEditorClick"
          >
            <div
              class="card-part-header"
              :style="optimizedPartHeaderStyle"
              v-if="selectedPart && !isPreview"
            >
              <span class="part-label">{{
                selectedPart.label ||
                selectedPart.card_parts_name ||
                selectedPart.parts_type ||
                ""
              }}</span>
              <div class="part-delete">
                <el-tooltip content="复制" placement="bottom">
                  <i>
                    <Icon
                      icon="ri:file-copy-2-fill"
                      @click.native.stop="handleCopyPart()"
                    ></Icon>
                  </i>
                </el-tooltip>
                <el-tooltip content="粘贴" placement="bottom">
                  <i>
                    <Icon
                      icon="ri:file-copy-2-line"
                      @click.native.stop="handlePastePart()"
                    ></Icon>
                  </i>
                </el-tooltip>

                <el-tooltip content="删除" placement="bottom">
                  <i>
                    <Icon
                      icon="ri:delete-bin-line"
                      @click.native="deletePart(selectedPart)"
                    ></Icon>
                  </i>
                </el-tooltip>
              </div>
            </div>
            <div
              class="overlay"
              :class="{ 'overlay--active': isEditorActive && !selectedPart }"
              @click.stop="handleEditorClick"
            ></div>
            <card-part
              v-for="(part, index) in partsList"
              :key="part._id || part.id || index"
              :part="part"
              :index="index"
              :selected-part="selectedPart"
              :hiddenPartsVisible="hiddenPartsVisible"
              :has-clipboard-content="hasClipboardContent"
              @delete-part="deletePart"
              @select-part="selectPart"
              @mouseenter="onDragLeave($event, 'editor')"
              @copy-part="handleContextCopyPart"
              @paste-part="handleContextPastePart"
              @cut-part="handleCutPart"
              @move-part="handleMovePart"
              @show-properties="handleShowProperties"
              @drop-part="pushHistory"
            />
          </div>
        </div>
      </section>
      <aside class="property-panel">
        <div class="panel-header">
          <h2 class="panel-title">
            {{ selectedPart ? "卡片部件" : "卡片单元" }}属性
          </h2>
        </div>
        <div class="panel-content">
          <property-editor
            :card-unit="cardInfo"
            :current-cell="selectedPart"
            :list="partsList"
            ref="propertyEditorRef"
            @saved="saved"
            @unit-update="onUnitUpdate"
            @parts-update="onPartsUpdate"
            @loading-change="onPropertyLoadingChange"
          ></property-editor>
        </div>
      </aside>
    </main>
    <el-dialog
      title="预览"
      :visible="isPreview"
      @update:visible="val => isPreview.value = val"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :destroy-on-close="true"
      fullscreen
      :before-close="handlePreviewClose"
    >
      <div class="preview-mode" v-if="isPreview">
        <div class="preview-content">
          <card-cell :card-cell="cardInfo"></card-cell>
        </div>
      </div>
    </el-dialog>
    <el-drawer
      title="组件大纲"
      :visible="outlineVisible"
      @update:visible="val => outlineVisible.value = val"
      direction="ltr"
      size="400px"
      :modal="false"
      class="outline-container"
    >
      <el-tree
        :highlight-current="true"
        :default-expand-all="true"
        :expand-on-click-node="false"
        :current-node-key="
          selectedPart ? selectedPart._id || selectedPart.id : null
        "
        :data="outlineTree"
        :props="outlineTreeProps"
        @node-click="clickPart"
      >
        <span
          class="custom-tree-node"
          style="width: 100%; display: flex"
          slot-scope="{ node, data }"
        >
          <span style="flex: 1">{{ node.label }}</span>
          <span class="right-btn">
            <el-button
              type="text"
              size="mini"
              @click.stop="() => removePart(node, data)"
            >
              删除
            </el-button>
          </span>
        </span>
      </el-tree>
    </el-drawer>
  </div>
</template>

<script>
import clickoutside from "@/pages/lowcode/common/clickoutside.js";
export default {
  name: "CardCellEditor",
  directives: { clickoutside },
};
</script>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, set, getCurrentInstance } from "vue";
import DynamicIcon from "@/pages/lowcode/widgets/common/DynamicIcon.vue";
import { ensureCollection } from "@/pages/lowcode/widgets/common/icon-store";
import { materialsTree } from "../components/materials/materials";
const materialsCardParts = materialsTree.find((item) => item.value === "cardPart");
import { $selectOne, $selectList, $delete } from "@/common/http";
import { formatStyleData } from "@/pages/lowcode/common";
import CardPart from "./components/CardPart.vue";
import propertyEditor from "./components/propertyEditor.vue";
import cloneDeep from "lodash/cloneDeep";
import CardCell from "./components/CardCell.vue";
import clipboardService from "./services/ClipboardService";
import { usePartTree } from "./composables/usePartTree";
import { useHistory } from "./composables/useHistory";
import {
  validateClipboardData,
  clearClipboardMarkers,
  filterStyleNo,
} from "./composables/useClipboard";
import { useTheme } from "./composables/useTheme";
import { useKeyboard } from "./composables/useKeyboard";
import { usePartPosition } from "./composables/usePartPosition";
import { useDragDrop } from "./composables/useDragDrop";

const CONSTANTS = {
  SAVE_DEBOUNCE_TIME: 300,
  PART_IDENTIFIER: "_isCardPart",
};

const {
  deepClone,
  generateUniqueId,
  processChildren,
  findParentNode,
  processPartData,
  generatePartData,
  setupPartInfo,
  isSamePart,
} = usePartTree();

const utils = {
  deepClone,
  generateUniqueId,
  processChildren,
  findParentNode,
  processPartData,
  generatePartData,
  setupPartInfo,
  isSamePart,
};

const history = useHistory();

const instance = getCurrentInstance();
const proxy = instance?.proxy;

// Template refs
const cardCellEditor = ref(null);
const editorContainer = ref(null);
const editorContent = ref(null);
const propertyEditorRef = ref(null);

// State
const cardNo = ref("");
const cardInfo = ref(null);
const type = ref("add");
const partsList = ref([]);
const selectedPart = ref(null);
const onSaving = ref(false);
const propertyLoading = ref(false);
const isPreview = ref(false);
const hiddenPartsVisible = ref(false);
const partHeaderStyle = ref({});
const hasClipboardContent = ref(false);
const saveTimer = ref(null);
const partHeaderStyleCache = ref(new Map());
const isEditorActive = ref(false);
const outlineVisible = ref(false);
const expandedGroups = ref({});
const historyInfo = ref({ canUndo: false, canRedo: false });

// Computed
const setStyle = computed(() => {
  let style = {};
  if (cardInfo.value?.style_json) {
    style = formatStyleData(cardInfo.value?.style_json);
  }
  let backgroundImage = cardInfo.value?.background_image;
  if (backgroundImage) {
    style["background-image"] = backgroundImage;
  }
  return formatStyleData(style);
});

const cardParts = computed(() => {
  const rowItem = {
    label: "row",
    icon: "ri-rectangle-line",
    parts_type: "行容器",
  };
  if (materialsCardParts?.groups && materialsCardParts.groups.length) {
    const groups = cloneDeep(materialsCardParts.groups);
    if (groups.length > 0) {
      groups[0].items.unshift(rowItem);
    }
    return groups;
  } else {
    let arr = cloneDeep(materialsCardParts?.comList || []);
    arr.unshift(rowItem);
    return [{ label: "所有组件", items: arr }];
  }
});

const optimizedPartHeaderStyle = computed(() => {
  if (!selectedPart.value) return {};
  const style = calcPartHeaderPosition(selectedPart.value);
  return style;
});

const outlineTreeProps = computed(() => ({
  label: "card_parts_name",
  children: "children",
}));

const outlineTree = computed(() => partsList.value);

// Methods
function onPropertyLoadingChange(loading) {
  propertyLoading.value = loading;
}

function handleContainerFocus() {
  hasClipboardContent.value = clipboardService.hasContent();
}

function handleError(error, message = "操作失败") {
  console.error(message, error);
  proxy?.$message.error(message);
}

function handleContextCopyPart(part) {
  if (part) {
    selectPart(part);
  }
  handleCopyPart();
}

function handleContextPastePart(part) {
  if (part) {
    selectPart(part);
  }
  handlePastePart();
}

async function handleCutPart(part) {
  if (!part) return;
  selectPart(part);
  try {
    await handleCopyPart();
    deletePart(part);
    proxy?.$message.success("已剪切部件");
  } catch (e) {
    proxy?.$message.error("剪切失败，部件未被删除");
  }
}

function handleMovePart(part, direction) {
  pushHistory();
  const parentInfo = utils.findParentNode(partsList.value, part);
  if (!parentInfo) return;

  const { parent, isRoot } = parentInfo;
  const list = isRoot ? partsList.value : parent.children;
  const currentIndex = list.findIndex(
    (item) =>
      (item._id && item._id === part._id) ||
      (item.id && item.id === part.id)
  );

  if (currentIndex === -1) return;

  let targetIndex;
  if (direction === "up" && currentIndex > 0) {
    targetIndex = currentIndex - 1;
  } else if (direction === "down" && currentIndex < list.length - 1) {
    targetIndex = currentIndex + 1;
  } else {
    proxy?.$message.warning(`无法${direction === "up" ? "上" : "下"}移`);
    return;
  }

  const temp = list[currentIndex];
  const tempSeq = list[currentIndex].seq;

  set(list[currentIndex], "seq", list[targetIndex].seq);
  set(list[targetIndex], "seq", tempSeq);
  set(list, currentIndex, list[targetIndex]);
  set(list, targetIndex, temp);

  proxy?.$message.success(`已${direction === "up" ? "上" : "下"}移部件`);
}

function handleShowProperties(part) {
  selectPart(part);
  nextTick(() => {
    const propertyPanel = document.querySelector(".property-panel");
    if (propertyPanel) {
      propertyPanel.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  });
}

async function withLoading(operation, loadingMessage = "加载中...") {
  onSaving.value = true;
  try {
    await operation();
  } catch (error) {
    handleError(error);
  } finally {
    onSaving.value = false;
  }
}

async function saveCard() {
  if (!partsList.value.length) {
    proxy?.$message.warning("请先添加卡片部件");
    return;
  }
  if (propertyLoading.value) {
    return;
  }
  if (saveTimer.value) {
    clearTimeout(saveTimer.value);
  }
  saveTimer.value = setTimeout(async () => {
    await withLoading(async () => {
      await propertyEditorRef.value?.onSave();
      await getCardInfo();
    }, "保存中...");
  }, CONSTANTS.SAVE_DEBOUNCE_TIME);
}

function clickPart(data) {
  selectPart(data);
}

function removePart(node, data) {
  deletePart(data);
}

function init() {
  clearCache();
  if (proxy?.$route?.params?.cardNo) {
    type.value = "edit";
    cardNo.value = proxy.$route.params.cardNo;
    getCardInfo();
  }
}

async function getCardInfo() {
  const url = `/config/select/srvpage_cfg_card_unit_select`;
  const req = {
    serviceName: "srvpage_cfg_card_unit_select",
    colNames: ["*"],
    condition: [
      {
        colName: "card_no",
        ruleType: "eq",
        value: cardNo.value,
      },
    ],
    page: { pageNo: 1, rownumber: 1 },
  };
  const { ok, data, msg } = await $selectOne(url, req);
  if (ok) {
    cardInfo.value = data;
    function buildPartsTree(list) {
      if (Array.isArray(list) && list.length) {
        return list.map((item) => {
          if (item?.sub_card_parts_json?.length) {
            item.children = buildPartsTree(item.sub_card_parts_json);
          }
          return item;
        });
      }
      return list;
    }
    if (data.parts_json) {
      try {
        partsList.value = buildPartsTree(JSON.parse(data.parts_json));
      } catch (e) {
        console.error("解析卡片部件数据失败", e);
      }
    }
    getCardParts();
  } else if (msg) {
    proxy?.$message.error(msg);
  }
}

async function getCardParts() {
  const url = `/config/select/srvpage_cfg_card_parts_select`;
  const req = {
    serviceName: "srvpage_cfg_card_parts_select",
    colNames: ["*"],
    treeData: true,
    condition: [
      {
        colName: "card_no",
        ruleType: "eq",
        value: cardNo.value,
      },
    ],
  };
  const { ok, data, msg } = await $selectList(url, req);
  if (ok) {
    partsList.value = data;
  } else if (msg) {
    proxy?.$message.error(msg);
  }
}

function duplicatePart(part) {
  pushHistory();
  const duplicatedPart = utils.processPartData(part);
  const parentInfo = utils.findParentNode(partsList.value, part);
  if (parentInfo) {
    if (parentInfo.isRoot) {
      duplicatedPart.seq = (partsList.value.length + 1) * 100;
      partsList.value.push(duplicatedPart);
    } else {
      duplicatedPart.seq = (parentInfo.parent.children.length + 1) * 100;
      if (parentInfo.parent.card_parts_no) {
        duplicatedPart.parent_no = parentInfo.parent.card_parts_no;
      }
      if (parentInfo.parent.card_no) {
        duplicatedPart.card_no = parentInfo.parent.card_no;
      }
      parentInfo.parent.children.push(duplicatedPart);
    }
  } else {
    duplicatedPart.seq = (partsList.value.length + 1) * 100;
    partsList.value.push(duplicatedPart);
  }

  nextTick(() => {
    selectPart(duplicatedPart);
  });
}

function deletePart(part, index) {
  if (part._id || part.id) {
    partHeaderStyleCache.value.delete(part._id || part.id);
  }
  if (selectedPart.value) {
    selectedPart.value = null;
  }
  if (!index && index !== 0 && part._id) {
    pushHistory();
    set(part, "_is_delete", true);
    return;
  }
  if (part?.id || part?.card_parts_no) {
    return proxy?.$confirm("确定要删除吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    }).then(() => {
      const params = {
        service: "srvpage_cfg_card_parts_delete",
        app: "config",
        key: part.id ? "id" : "card_parts_no",
        value: part.id || part.card_parts_no,
      };
      if (part?.children && part?.children?.length) {
        const flatChildren = (list) => {
          let res = [];
          if (Array.isArray(list) && list.length) {
            list.forEach((item) => {
              res.push(item);
              if (Array.isArray(item?.children) && item?.children.length) {
                res = res.concat(flatChildren(item?.children));
              }
            });
          }
          return res;
        };
        const children = flatChildren(part?.children);
        if (children.length) {
          params.value =
            `${part.id || part.card_parts_no},` +
            children.map((item) => item.id || item.card_parts_no).join(",");
        }
      }
      $delete(params)
        .then(({ ok, msg }) => {
          if (ok) {
            proxy?.$message.success("删除成功");
            getCardInfo();
          } else {
            proxy?.$message.error(msg || "删除失败");
          }
        })
        .catch(() => {
          proxy?.$message.error("删除失败");
        });
    });
  }
  pushHistory();
  partsList.value.splice(index, 1);
}

async function deleteAllParts() {
  if (!partsList.value.length) {
    proxy?.$message.info("当前没有可删除的部件");
    return;
  }

  const flatAll = (list) => {
    let res = [];
    list.forEach((item) => {
      res.push(item);
      if (item?.children?.length) {
        res = res.concat(flatAll(item.children));
      }
    });
    return res;
  };

  const allParts = flatAll(partsList.value);
  const savableParts = allParts.filter((item) => item.id || item.card_parts_no);

  if (!savableParts.length) {
    proxy?.$message.info("当前没有已保存的部件，无法执行服务端删除");
    return;
  }

  try {
    await proxy?.$confirm(
      `确定要删除该卡片单元下的所有卡片部件吗？共 ${savableParts.length} 个已保存部件（含子部件）。`,
      "提示",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    pushHistory();

    const ids = savableParts.filter((item) => item.id).map((item) => item.id);
    const partNos = savableParts.filter((item) => !item.id && item.card_parts_no).map((item) => item.card_parts_no);

    const deleteByKey = async (key, values) => {
      if (!values.length) return { ok: true };
      const params = {
        service: "srvpage_cfg_card_parts_delete",
        app: "config",
        key,
        value: values.join(","),
      };
      return $delete(params);
    };

    const [idRes, noRes] = await Promise.all([
      deleteByKey("id", ids),
      deleteByKey("card_parts_no", partNos),
    ]);

    if ((idRes?.ok || !ids.length) && (noRes?.ok || !partNos.length)) {
      proxy?.$message.success("删除成功");
      selectedPart.value = null;
      partHeaderStyle.value = null;
      partHeaderStyleCache.value.clear();
      await getCardInfo();
    } else {
      proxy?.$message.error(idRes?.msg || noRes?.msg || "删除失败");
    }
  } catch {
    // 用户取消，静默处理
  }
}

async function selectPart(part) {
  if (selectedPart.value === part) return;
  selectedPart.value = part;
  partHeaderStyle.value = optimizedPartHeaderStyle.value;
}

function onUnitUpdate() {
  getCardInfo();
}

function onPartsUpdate() {
  getCardInfo();
}

async function saved() {
  proxy?.$message.success("保存成功");
  onSaving.value = false;
  await getCardInfo();
  selectPart();
}

function refresh() {
  clearCache();
  getCardInfo();
}

function previewCard() {
  if (!partsList.value.length) {
    proxy?.$message.warning("请先添加卡片部件");
    return;
  }
  const transition = document.startViewTransition(() => {
    isPreview.value = !isPreview.value;
  });
  transition.ready.then(() => {
    const previewContent = document.querySelector(".preview-content");
    if (previewContent) {
      previewContent.animate(
        [
          { opacity: 0, transform: "scale(0.95)" },
          { opacity: 1, transform: "scale(1)" },
        ],
        {
          duration: 300,
          easing: "ease-out",
        }
      );
    }
  });
}

function handlePreviewClose(done) {
  isPreview.value = false;
  done?.();
}

async function handleCopyPart() {
  if (isEditorActive.value && !selectedPart.value) {
    const allParts = utils.deepClone(partsList.value);
    filterStyleNo(allParts);
    allParts.forEach((part) => (part[CONSTANTS.PART_IDENTIFIER] = true));
    try {
      const result = await clipboardService.write(allParts);
      hasClipboardContent.value = true;
      if (result.manualCopy) {
        proxy?.$message.warning("系统剪贴板不可用，已生成 JSON 数据");
        await clipboardService.showManualCopyDialog(result.json);
      } else {
        proxy?.$message.success("已复制所有部件到剪贴板");
      }
    } catch (e) {
      handleError(e, "复制失败");
      throw e;
    }
    return;
  }

  if (!selectedPart.value) {
    proxy?.$message.warning("请先选择要复制的部件");
    return;
  }

  try {
    const data = utils.deepClone(selectedPart.value);
    filterStyleNo(data);
    data[CONSTANTS.PART_IDENTIFIER] = true;
    const result = await clipboardService.write(data);
    hasClipboardContent.value = true;
    if (result.manualCopy) {
      proxy?.$message.warning("系统剪贴板不可用，已生成 JSON 数据");
      await clipboardService.showManualCopyDialog(result.json);
    } else {
      proxy?.$message.success("已复制到剪贴板");
    }
  } catch (e) {
    handleError(e, "复制失败");
    throw e;
  }
}

function pushHistory() {
  history.push(partsList.value, selectedPart.value?._id || selectedPart.value?.id || null);
  historyInfo.value = history.getInfo();
}

function handleUndo() {
  const snapshot = history.undo();
  historyInfo.value = history.getInfo();
  if (!snapshot) {
    proxy?.$message.info("没有可撤销的操作");
    return;
  }
  partsList.value = snapshot.partsList;
  if (snapshot.selectedPartId) {
    selectedPart.value = utils.findPartById(partsList.value, snapshot.selectedPartId) || null;
  } else {
    selectedPart.value = null;
  }
  proxy?.$message.success("已撤销");
}

function handleRedo() {
  const snapshot = history.redo();
  historyInfo.value = history.getInfo();
  if (!snapshot) {
    proxy?.$message.info("没有可重做的操作");
    return;
  }
  partsList.value = snapshot.partsList;
  if (snapshot.selectedPartId) {
    selectedPart.value = utils.findPartById(partsList.value, snapshot.selectedPartId) || null;
  } else {
    selectedPart.value = null;
  }
  proxy?.$message.success("已重做");
}

async function handlePastePart() {
  try {
    let clipboardData = await clipboardService.read();

    if (!clipboardData) {
      if (!clipboardService.canReadFromSystem()) {
        proxy?.$message.info("系统剪贴板不可用，请手动粘贴 JSON 数据");
        const jsonStr = await clipboardService.showManualPasteDialog();
        if (!jsonStr) return;
        try {
          clipboardData = JSON.parse(jsonStr);
        } catch (e) {
          proxy?.$message.error("JSON 格式错误");
          return;
        }
        if (!validateClipboardData(clipboardData)) {
          proxy?.$message.error("粘贴的数据不是有效的卡片部件");
          return;
        }
        clearClipboardMarkers(clipboardData);
      } else {
        proxy?.$message.warning("剪贴板为空");
        return;
      }
    } else {
      if (Array.isArray(clipboardData)) {
        const isParts = clipboardData.every(
          (item) => item[CONSTANTS.PART_IDENTIFIER]
        );
        if (!isParts) {
          proxy?.$message.warning("剪贴板数据不是有效的卡片部件");
          return;
        }
      } else if (!clipboardData[CONSTANTS.PART_IDENTIFIER]) {
        proxy?.$message.warning("剪贴板数据不是有效的卡片部件");
        return;
      }
      clearClipboardMarkers(clipboardData);
    }

    if (Array.isArray(clipboardData)) {
      let lastPasted = null;
      for (const partData of clipboardData) {
        const newPart = utils.processPartData(partData);
        lastPasted = newPart;
        if (!selectedPart.value) {
          duplicatePart(newPart);
        } else if (utils.isSamePart(selectedPart.value, newPart)) {
          await pasteToSameLevel(newPart);
        } else {
          await pasteToSelectedPart(newPart);
        }
      }
      proxy?.$message.success(`已粘贴${clipboardData.length}个部件`);
      if (lastPasted) {
        nextTick(() => selectPart(lastPasted));
      }
      return;
    }

    const newPart = utils.processPartData(clipboardData);
    if (!selectedPart.value) {
      return duplicatePart(newPart);
    }
    if (utils.isSamePart(selectedPart.value, newPart)) {
      await pasteToSameLevel(newPart);
    } else {
      await pasteToSelectedPart(newPart);
    }
    proxy?.$message.success("已粘贴部件");
    nextTick(() => {
      selectPart(newPart);
    });
  } catch (e) {
    handleError(e, "粘贴失败，数据格式错误");
  }
}

async function pasteToSameLevel(newPart) {
  pushHistory();
  const parentInfo = utils.findParentNode(partsList.value, selectedPart.value);
  if (parentInfo) {
    if (parentInfo.isRoot) {
      utils.setupPartInfo(newPart, null, partsList.value.length);
      partsList.value.push(newPart);
    } else {
      utils.setupPartInfo(
        newPart,
        parentInfo.parent,
        parentInfo.parent.children.length
      );
      parentInfo.parent.children.push(newPart);
    }
  } else {
    utils.setupPartInfo(newPart, null, partsList.value.length);
    partsList.value.push(newPart);
  }
}

async function pasteToSelectedPart(newPart) {
  pushHistory();
  if (
    ["row", "block", "行容器", "块容器"].includes(
      selectedPart.value.parts_type
    )
  ) {
    if (!selectedPart.value.children) {
      set(selectedPart.value, "children", []);
    }
    utils.setupPartInfo(
      newPart,
      selectedPart.value,
      selectedPart.value.children.length
    );
    selectedPart.value.children.push(newPart);
  } else {
    await pasteToSameLevel(newPart);
  }
}

function clearCache() {
  partHeaderStyleCache.value.clear();
}

function handleEditorClick() {
  isEditorActive.value = true;
  selectedPart.value = null;
  partHeaderStyle.value = null;
  partHeaderStyleCache.value.clear();
}

function toggleGroup(groupLabel) {
  set(expandedGroups.value, groupLabel, !expandedGroups.value[groupLabel]);
}

function isGroupExpanded(groupLabel) {
  return expandedGroups.value[groupLabel] !== false;
}

function handleContainerClick(event) {
  outlineVisible.value = false;
  if (event.target === event.currentTarget) {
    selectPart();
    isEditorActive.value = false;
  }
}

function initExpandedGroups() {
  if (cardParts.value && cardParts.value.length) {
    const groups = {};
    cardParts.value.forEach((group) => {
      groups[group.label] = true;
    });
    expandedGroups.value = groups;
  }
}

// Composable instances
const { isDarkMode, toggleTheme: changeTheme } = useTheme(cardCellEditor);
const { calcPartHeaderPosition } = usePartPosition(editorContent);
const { draggedPart, onDragStart, onDrop, onDragEnter, onDragLeave } = useDragDrop({
  partsList,
  pushHistory,
  utils,
  nextTick,
  onError: handleError,
});
const { handleKeyDown } = useKeyboard({
  selectedPart,
  partsList,
  handleUndo,
  handleRedo,
  handleCopyPart,
  handlePastePart,
  handleEditorClick,
  deletePart,
  onDeleteAll: deleteAllParts,
  $message: proxy?.$message,
});

// Initialize
init();
initExpandedGroups();

// Lifecycle
onMounted(async () => {
  editorContainer.value?.addEventListener("keydown", handleKeyDown);

  // 图标集合本地加载（icon-store：构建产物静态资源，零网络请求，离线可用）
  await Promise.all([
    ensureCollection("carbon"),
    ensureCollection("mdi-light"),
    ensureCollection("ri"),
  ]);
});

onBeforeUnmount(() => {
  if (saveTimer.value) {
    clearTimeout(saveTimer.value);
  }
  clearCache();
  editorContainer.value?.removeEventListener("keydown", handleKeyDown);
});
</script>
<style lang="scss" scoped>
.drag-image {
  position: fixed;
  top: -1000px;
  left: -1000px;
  padding: 8px 12px;
  background-color: var(--primary-color, #409eff);
  color: white;
  border-radius: 4px;
  font-size: 14px;
  pointer-events: none;
  z-index: 9999;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

::view-transition-new(root),
::view-transition-old(root) {
  animation: none;
}

.card-cell-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  --bg-color: #fff;
  background-color: var(--bg-color);

  &.dark-mode {
    --bg-color: #1a1a1a;
    --primary-color: #4a90e2;
    --menu-bg-color: var(--primary-color);

    .header {
      background-color: rgba($color: #2d2d2d, $alpha: 0.5);
      border-bottom-color: #444;

      .title {
        color: #ffffff;
      }

      .header-right,
      .header-center {
        button {
          color: #ffffff;
          border-color: #444;
          background-color: #333;

          &.save-btn {
            background-color: #4a90e2;
            border-color: #4a90e2;
          }
        }

        .theme-toggle-btn {
          background-color: #333;
          border-color: #444;

          &:hover {
            background-color: #444;
          }

          .theme-icon {
            color: #ffffff;
          }
        }
      }
    }

    .main {
      .materials-panel,
      .property-panel {
        background-color: #252525;
        border-right-color: #444;

        .panel-header {
          border-bottom-color: #444;

          .panel-title {
            color: #ffffff;
          }
        }

        .panel-content {
          color: #dddddd;
          scrollbar-color: #444 #252525;

          :deep(.property-pane) {
            background-color: #252525;
          }

          &::-webkit-scrollbar-track {
            background: #252525;
          }

          &::-webkit-scrollbar-thumb {
            background: #444;
          }

          &::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        }

        .group-header {
          background-color: rgba(255, 255, 255, 0.05);

          &:hover {
            background-color: rgba(255, 255, 255, 0.1);
            transform: translateX(2px);
          }

          &::before {
            background-color: #777;
          }

          &:hover::before {
            background-color: #999;
          }

          .group-title {
            font-weight: 500;
            color: #ffffff;
          }

          .group-icon {
            color: #aaa;
            background-color: rgba(255, 255, 255, 0.1);
          }

          &:hover .group-icon {
            background-color: rgba(255, 255, 255, 0.15);
            color: #fff;
          }

          .group-toggle {
            color: #999;
          }

          &:hover .group-toggle {
            color: #aaa;
            background-color: rgba(255, 255, 255, 0.1);
          }
        }

        .group-items {
          &::before {
            background-color: #333;
          }
        }

        .group-header--expanded {
          background-color: rgba(255, 255, 255, 0.08);
        }

        .group-header--expanded::before {
          background-color: #999;
        }

        .group-header--expanded .group-title {
          font-weight: 600;
          color: #fff;
        }

        .group-toggle--expanded {
          color: #aaa;
          background-color: rgba(255, 255, 255, 0.15);
        }

        .material-item {
          background-color: #333;
          border-color: #444;

          .material-name {
            color: #dddddd;
          }
        }
      }

      .editor-area {
        background-color: #1e1e1e;
      }

      .editor-content {
        background-color: rgba($color: #2d2d2d, $alpha: 0.5);
        border-color: #444;

        .overlay {
          background-color: rgba(0, 0, 0, 0.1);
        }
      }

      .property-panel {
        border-left-color: #444;
        background-color: #252525;

        :deep(.form-view-wrapper) {
          background-color: #2d2d2d;

          .raw_field_editor input {
            --custom-input-color: #ddd;
          }

          .el-autocomplete-suggestion {
            background-color: #2d2d2d;
            color: #ffffff;
          }

          .el-button {
            background-color: #333;
            border-color: #444;
            color: #dddddd;

            &.el-button--primary {
            }
          }

          .el-checkbox,
          .el-upload__tip {
            color: #dddddd;
          }

          .el-input-group__append {
            background-color: #333;
            border-color: #444;
          }

          .el-input__inner {
            background-color: #333;
            border-color: #444;
          }

          .el-upload--picture-card {
            background-color: #252525;
            border-color: #444;
          }
        }
      }
    }

    :deep(.el-dialog__wrapper) {
      .el-dialog {
        background-color: #2d2d2d;

        .el-dialog__title,
        .el-dialog__headerbtn,
        .el-dialog__close {
          color: #ddd;
        }

        .el-dialog__body,
        .preview-mode {
          height: 80vh;
        }
      }
    }

    .editor-container,
    .preview-mode {
      background-color: #18181c;
      background-image: linear-gradient(#18181c 19px, transparent 0),
        linear-gradient(90deg, transparent 19px, #86909c 0);
    }
  }
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 50px;
  padding: 0 20px;
  background-color: var(--bg-color);
  border-bottom: 1px solid #e8e8e8;

  .header-left {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;

    .title {
      font-size: 16px;
      font-weight: bold;
      color: #333;
      margin: 0;
    }
  }

  .header-center {
    justify-content: center;
  }

  .header-right {
    justify-content: flex-end;
  }

  .header-center,
  .header-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;

    .theme-toggle-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 4px;
      border: 1px solid #dcdfe6;
      background-color: var(--bg-color);
      cursor: pointer;
      transition: all 0.3s ease;
      padding: 0;
      margin-right: 10px;

      &:hover {
        background-color: #f5f7fa;
      }

      .theme-icon {
        font-size: 20px;
        color: #606266;
        transition: all 0.3s ease;

        &:hover {
          transform: rotate(15deg);
        }
      }
    }
  }

  .header-right {
    display: flex;

    button {
      padding: 8px 15px;
      background-color: var(--bg-color);
      cursor: pointer;
      transition: all 0.2s ease-in-out;
      min-width: 80px;

      &:active {
        transform: scale(0.98);
      }

      &.save-btn {
        background-color: var(--primary-color, #409eff);
        color: #fff;
        border-color: var(--primary-color, #409eff);
      }
    }
  }
}

.main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.materials-panel,
.property-panel {
  width: 200px;
  padding: 0 10px;
  background-color: #f5f7fa;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
}
.materials-panel{
  padding:0;
}

.property-panel {
  padding: 0;
  width: 360px;
  border-right: none;
  border-left: 1px solid #e8e8e8;
}

.panel-header {
  padding: 10px 15px;
  border-bottom: 1px solid #e8e8e8;

  .panel-title {
    font-size: 14px;
    font-weight: bold;
    color: #333;
  }
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #dcdfe6 #f5f7fa;
}

.panel-content::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: #f5f7fa;
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
  transition: background 0.3s ease;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: #c0c4cc;
}

.materials-groups {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 0;
}

.material-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-right: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 6px;
  background-color: transparent;
  position: relative;
  overflow: hidden;
}

.group-header:hover {
  background-color: rgba(0, 0, 0, 0.08);
  transform: scale(0.98);
}

.group-header::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: transparent;
  transition: background-color 0.2s ease;
}

.group-header:hover::before {
  background-color: #333;
}

.group-icon {
  width: 20px;
  height: 20px;
  line-height: 20px;
  text-align: center;
  font-size: 14px;
  color: #666;
  flex-shrink: 0;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.group-header:hover .group-icon {
  transform: scale(1.05);
  background-color: rgba(0, 0, 0, 0.15);
  color: #333;
}

.group-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin: 0;
  flex: 1;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}

.group-toggle {
  width: 20px;
  height: 20px;
  line-height: 20px;
  text-align: center;
  font-size: 18px;
  color: #909399;
  flex-shrink: 0;
  transition: all 0.2s ease;
  border-radius: 4px;
  background-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

.group-toggle--expanded {
  color: #333;
  background-color: rgba(0, 0, 0, 0.15);
  transform: rotate(0deg);
}

.group-header:hover .group-toggle {
  color: #333;
  background-color: rgba(0, 0, 0, 0.1);
}

.group-header {
  background-color: rgba(0, 0, 0, 0.03);
}

.group-header::before {
  background-color: #999;
}

.group-header .group-title {
  font-weight: 500;
  color: #333;
}

.group-header--expanded {
  background-color: rgba(0, 0, 0, 0.05);
}

.group-header--expanded::before {
  background-color: #666;
}

.group-header--expanded .group-title {
  font-weight: 600;
  color: #333;
}

.group-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 12px 8px 14px;
  animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.group-items::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 0;
  bottom: 0;
  width: 1px;
  background-color: #e4e7ed;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
    max-height: 0;
  }
  to {
    opacity: 1;
    transform: translateY(0);
    max-height: 500px;
  }
}

.materials-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.material-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #fff;
  cursor: move;
  transition: all 0.2s ease;
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
    border-color: #666;
    transform: scale(0.98);
  }
  .material-icon {
    width: 24px;
    height: 24px;
    line-height: 24px;
    text-align: center;
    margin-right: 8px;
    font-size: 20px;
  }

  .material-name {
    font-size: 12px;
    color: #333;
  }
}

.editor-area {
  flex: 1;
  background-color: #f0f2f5;
  padding: 20px;
  overflow: auto;
  scrollbar-color: rgba(144, 146, 152, 0.3) transparent;
  scrollbar-width: thin;
}

.editor-container {
  height: 100%;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: auto;
  padding: 60px;
  scrollbar-color: rgba(144, 146, 152, 0.3) transparent;
  scrollbar-width: thin;
  background-color: #f5f5f9;
  background-size: 20px 20px, 20px 20px;
  background-image: linear-gradient(#f5f5f9 19px, transparent 0),
    linear-gradient(90deg, transparent 19px, #000 0);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  width: fit-content;
  min-width: 100%;
  cursor: pointer;

  &:hover {
    background-color: #f0f0f5;
  }
}

.preview-mode {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80vh;
  min-height: 800px;
  overflow: auto;
  background-color: #f5f5f9;
  background-size: 20px 20px, 20px 20px;
  background-image: linear-gradient(#f5f5f9 19px, transparent 0),
    linear-gradient(90deg, transparent 19px, #000 0);

  .preview-content {
  }
}

.editor-content {
  display: inline-block;
  padding: 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid #ddd;
  position: relative;
  transition: all 0.2s ease;
  min-width: 300px;
  min-height: 100px;

  .overlay {
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
      background-color: rgba(103, 194, 58, 0.05);
      border: 2px dashed #67c23a;
    }

    &--active {
      border: 2px solid #67c23a;
      box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.2);
      background-color: rgba(103, 194, 58, 0.1);
    }
  }

  .card-part-header {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 99;

    font-size: 12px;
    transform: translateY(-100%);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    border: none;
    line-height: 30px;
    gap: 1px;
    transition: all 0.2s ease;
    .part-label,
    .part-delete {
      background-color: var(--primary-color, #006cff);
      color: #fff;
      display: flex;
      align-items: center;
      height: 30px;
      padding: 0 10px;
    }

    .part-label {
      flex: 1;
      text-align: left;
      min-width: max-content;
    }

    .part-delete {
      cursor: pointer;
      font-size: 16px;
      min-width: 60px;
      justify-content: center;
      gap: 5px;

      .iconify {
        &:hover {
          font-weight: bold;
          font-size: 18px;
        }
      }
    }
  }
}

.editor-content.drag-over-editor {
  > .overlay {
    background-color: rgba(103, 194, 58, 0.1);
    border: 2px dashed #67c23a;
  }
}

.editor-content:empty {
  display: flex;
  justify-content: center;
  align-items: center;

  &:after {
    content: "拖拽组件到此处";
    color: #909399;
    font-size: 14px;
  }
}

.placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.image-placeholder {
  width: 200px;
  height: 200px;
  background-color: #f5f5f5;
  border: 1px dashed #d9d9d9;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;

  &:before {
    content: "+";
    font-size: 40px;
    color: #d9d9d9;
  }
}

.property-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-label {
  font-size: 12px;
  color: #606266;
}

.form-control {
  display: flex;
  align-items: center;
}

.no-selection {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  color: #909399;
  font-size: 14px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin: 10px 0;
}

.upload-btn {
  padding: 5px 10px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  background-color: #fafafa;
  color: #606266;
  font-size: 12px;
  cursor: pointer;
  text-align: center;
}

.switch-control {
  width: 40px;
  height: 20px;
  background-color: #dcdfe6;
  border-radius: 10px;
  position: relative;
  cursor: pointer;

  &:before {
    content: "";
    position: absolute;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background-color: #fff;
    top: 2px;
    left: 2px;
    transition: all 0.3s;
  }
}

/* 组件大纲按钮样式 */
.handle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  color: #606266;
  background-color: #f5f7fa;
  padding: 0 8px;
  gap: 4px;
  border: 1px solid transparent;

  .text {
    font-size: 12px;
  }

  &.loading {
    background-color: #f5f7fa;
    color: #666;
    pointer-events: none;
    position: relative;
    cursor: not-allowed;
    opacity: 0.7;
    background-color: rgba(45, 45, 45, 0.1);

    &::before {
      content: "";
      position: absolute;
      top: 50%;
      width: 18px;
      height: 18px;
      border: 2px solid transparent;
      border-top: 2px solid #666;
      border-radius: 50%;
      animation: loading-spin 1s linear infinite;
      transform: translate(-50%, -50%);
    }

    // 禁用状态下的图标样式
    .iconify {
      opacity: 0.5;
    }
  }
}

.handle-btn:hover {
  background-color: #f5f7fa;
  color: var(--primary-color, #409eff);
  border-color: var(--primary-color, #409eff);
}

.handle-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.dark-mode .handle-btn {
  color: #c0c4cc;
  background-color: #2d2d2d;

  &.loading {
    background-color: #1f1f1f;
    color: #999;
    border-color: #555;

    &::before {
      border-top-color: #999;
    }

    .iconify {
      opacity: 0.4;
    }
  }
}

.dark-mode .handle-btn:hover {
  background-color: #2d2d2d;
}

/* 组件大纲drawer样式 */
.el-drawer__wrapper {
  width: 400px;
}

.outline-container .custom-tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 8px;
}

.outline-container .right-btn {
  opacity: 0;
  transition: opacity 0.2s;
}

.outline-container .custom-tree-node:hover .right-btn {
  opacity: 1;
}

/* 暗色模式下的组件大纲样式 */
.dark-mode :deep(.outline-container) {
  .el-drawer__title,
  .el-drawer__body,
  .el-drawer {
    background-color: #2d2d2d;
    color: #333;
    margin-bottom: 0;
  }

  .el-drawer__header {
    background-color: #2d2d2d;
    border-bottom: 1px solid #4c4d4f;
    color: #e4e7ed;
    margin-bottom: 10px;
  }

  .el-drawer__body {
    background-color: #2d2d2d;
  }

  .el-tree {
    background-color: transparent;
  }

  .el-tree--highlight-current
    .el-tree-node.is-current
    > .el-tree-node__content {
    color: #fff;
    background-color: #3a3a3a;
  }

  .el-tree-node {
    .el-tree-node__content {
      &:hover {
        background-color: #3a3a3a;
        color: #c0c4cc;
      }
    }

    .el-tree-node__expand-icon {
      color: #c0c4cc;
    }
  }

  .custom-tree-node {
    color: #c0c4cc;

    .right-btn {
      .el-button--text {
        color: #c0c4cc;

        &:hover {
          color: #409eff;
        }
      }
    }
  }
}

@keyframes loading-spin {
  0% {
    transform: translateY(-50%) rotate(0deg);
  }
  100% {
    transform: translateY(-50%) rotate(360deg);
  }
}
</style>
