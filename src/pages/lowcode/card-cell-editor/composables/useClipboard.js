/**
 * useClipboard - 剪贴板操作 Composable
 *
 * 职责：
 * 1. 复制部件到剪贴板（系统剪贴板 + localStorage 双通道）
 * 2. 从剪贴板读取并校验数据
 * 3. 管理剪贴板内容状态（响应式）
 *
 * 依赖：ClipboardService（单例服务）
 */

import { ref } from "vue";
import clipboardService from "../services/ClipboardService";
import { deepClone } from "../utils";

const CONSTANTS = {
  PART_IDENTIFIER: "_isCardPart",
};

/**
 * 校验剪贴板数据是否是有效的卡片部件（纯函数）
 * @param {Object|Array} data - 剪贴板数据
 * @returns {boolean}
 */
export function validateClipboardData(data) {
  if (Array.isArray(data)) {
    return data.every((item) => item[CONSTANTS.PART_IDENTIFIER]);
  }
  return !!data[CONSTANTS.PART_IDENTIFIER];
}

/**
 * 清除剪贴板数据中的标记（纯函数）
 * @param {Object|Array} data - 剪贴板数据
 */
export function clearClipboardMarkers(data) {
  if (Array.isArray(data)) {
    data.forEach((item) => delete item[CONSTANTS.PART_IDENTIFIER]);
  } else {
    delete data[CONSTANTS.PART_IDENTIFIER];
  }
}

/**
 * 递归过滤掉部件数据中的 style_no 字段（纯函数）
 * @param {Object|Array} data - 部件数据
 */
export function filterStyleNo(data) {
  const ignoreFields = ["style_no"];
  if (Array.isArray(data)) {
    data.forEach((item) => filterStyleNo(item));
  } else if (data && typeof data === "object") {
    ignoreFields.forEach((field) => {
      if (data[field]) {
        delete data[field];
      }
    });
    if (data.children && Array.isArray(data.children)) {
      filterStyleNo(data.children);
    }
  }
}

export function useClipboard() {
  const hasContent = ref(false);

  /**
   * 同步剪贴板内容状态
   */
  function syncHasContent() {
    hasContent.value = clipboardService.hasContent();
  }

  /**
   * 复制单个部件
   * @param {Object} part - 要复制的部件
   * @returns {Promise<{success: boolean, manualCopy: boolean, json?: string}>}
   */
  async function copyPart(part) {
    const data = deepClone(part);
    filterStyleNo(data);
    data[CONSTANTS.PART_IDENTIFIER] = true;

    const result = await clipboardService.write(data);
    hasContent.value = true;
    return result;
  }

  /**
   * 复制全部部件
   * @param {Array} partsList - 部件列表
   * @returns {Promise<{success: boolean, manualCopy: boolean, json?: string}>}
   */
  async function copyAllParts(partsList) {
    const allParts = deepClone(partsList);
    filterStyleNo(allParts);
    allParts.forEach((part) => (part[CONSTANTS.PART_IDENTIFIER] = true));

    const result = await clipboardService.write(allParts);
    hasContent.value = true;
    return result;
  }

  /**
   * 获取并验证剪贴板数据
   * @returns {Promise<Object|Array|null>} 剪贴板数据，非法或为空时返回 null
   */
  async function getClipboardData() {
    const clipboardData = await clipboardService.read();

    if (!clipboardData) {
      return null;
    }

    // 校验数据合法性：必须包含 _isCardPart 标记
    if (Array.isArray(clipboardData)) {
      const isParts = clipboardData.every(
        (item) => item[CONSTANTS.PART_IDENTIFIER]
      );
      if (!isParts) {
        return null;
      }
    } else if (!clipboardData[CONSTANTS.PART_IDENTIFIER]) {
      return null;
    }

    // 清除标记后返回（标记只用于校验，不参与业务逻辑）
    clearClipboardMarkers(clipboardData);
    return clipboardData;
  }

  return {
    hasContent,
    syncHasContent,
    copyPart,
    copyAllParts,
    getClipboardData,
    validateClipboardData,
    clearClipboardMarkers,
    filterStyleNo,
  };
}
