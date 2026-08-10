/**
 * useHistory - 撤销重做 Composable
 *
 * 职责：
 * 1. 维护操作历史栈（partsList + selectedPartId 的快照）
 * 2. 支持 undo/redo/clear
 * 3. 限制栈深度防止内存溢出
 *
 * 与 Pinia/Vuex 解耦，可作为通用 history 管理器使用
 */

import { ref, computed } from "vue";
import cloneDeep from "lodash/cloneDeep";

const DEFAULT_MAX_HISTORY = 50;

export function useHistory(options = {}) {
  const maxHistory = options.maxHistory || DEFAULT_MAX_HISTORY;

  const stack = ref([]);
  const index = ref(-1);

  const canUndo = computed(() => index.value > 0);
  const canRedo = computed(() => index.value < stack.value.length - 1);

  /**
   * 压入新的历史快照
   * @param {Array} partsList - 部件列表（会被深拷贝）
   * @param {string|null} selectedPartId - 当前选中的部件 ID
   */
  function push(partsList, selectedPartId = null) {
    // 如果当前不在栈顶，丢弃 redo 分支
    if (index.value < stack.value.length - 1) {
      stack.value = stack.value.slice(0, index.value + 1);
    }

    stack.value.push({
      partsList: cloneDeep(partsList),
      selectedPartId,
      timestamp: Date.now(),
    });

    // 超出最大深度时，从头部移除
    if (stack.value.length > maxHistory) {
      stack.value.shift();
    } else {
      index.value++;
    }
  }

  /**
   * 撤销一步
   * @returns {{ partsList: Array, selectedPartId: string|null }|null}
   */
  function undo() {
    if (!canUndo.value) return null;
    index.value--;
    return cloneDeep(stack.value[index.value]);
  }

  /**
   * 重做一步
   * @returns {{ partsList: Array, selectedPartId: string|null }|null}
   */
  function redo() {
    if (!canRedo.value) return null;
    index.value++;
    return cloneDeep(stack.value[index.value]);
  }

  /**
   * 清空历史栈
   */
  function clear() {
    stack.value = [];
    index.value = -1;
  }

  /**
   * 获取当前历史信息（用于调试）
   * @returns {Object}
   */
  function getInfo() {
    return {
      size: stack.value.length,
      index: index.value,
      canUndo: canUndo.value,
      canRedo: canRedo.value,
    };
  }

  return {
    stack,
    index,
    canUndo,
    canRedo,
    push,
    undo,
    redo,
    clear,
    getInfo,
  };
}
