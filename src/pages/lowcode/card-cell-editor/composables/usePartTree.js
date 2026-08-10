/**
 * usePartTree - 部件树操作 Composable
 *
 * 职责：
 * 1. 部件数据生成与处理（复制/新增时的标记处理）
 * 2. 部件树查找（父节点、原始对象、索引）
 * 3. 部件信息设置（seq、parent_no）
 * 4. 部件比较（判断是否为同一部件）
 *
 * 纯逻辑层，不依赖 Vue 响应式系统
 */

import { deepClone, processChildren, findParentNode, findPartIndex, findPartById, generateUniqueId } from "../utils";

const CONSTANTS = {
  IGNORE_KEYS: [
    "create_user_disp",
    "create_time",
    "create_user",
    "modify_time",
    "modify_user_disp",
    "modify_user",
    "card_parts_no",
    "del_flag",
    "is_leaf",
    "parent_no",
  ],
};

export function usePartTree() {
  /**
   * 初始化复制/新增的卡片部件数据
   * @param {Object} part - 部件数据
   * @returns {Object} 处理后的部件数据
   */
  function generatePartData(part) {
    const newPart = deepClone(part);
    newPart._editType = "add";
    const _duplicate_id = newPart._duplicate_id || newPart.id;
    if (_duplicate_id) {
      newPart._duplicate_id = _duplicate_id;
    }
    newPart._id = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    delete newPart.id;
    CONSTANTS.IGNORE_KEYS.forEach((key) => {
      delete newPart[key];
    });
    return newPart;
  }

  /**
   * 处理部件数据（含递归处理子部件）
   * @param {Object} part - 部件数据
   * @returns {Object} 处理后的部件数据
   */
  function processPartData(part) {
    const newPart = generatePartData(part);
    if (Array.isArray(newPart.children)) {
      newPart.children = processChildren(newPart.children, (child) => {
        return generatePartData(child);
      });
    }
    return newPart;
  }

  /**
   * 设置部件序号和父级信息
   * @param {Object} part - 部件数据（会原地修改）
   * @param {Object} parent - 父级部件
   * @param {number} index - 序号
   * @returns {Object} 处理后的部件数据
   */
  function setupPartInfo(part, parent, index) {
    part.seq = (index + 1) * 100;
    if (parent?.card_parts_no) {
      part.parent_no = parent.card_parts_no;
    }
    if (parent?.card_no) {
      part.card_no = parent.card_no;
    }
    return part;
  }

  /**
   * 从 partsList 中查找原始部件对象
   * 用于解决 cloneDeep 后引用不一致的问题
   * @param {Array} partsList - 原始部件列表
   * @param {Object} target - 目标部件（可能是克隆对象）
   * @returns {Object|null} 原始部件对象
   */
  function findOriginalPart(partsList, target) {
    return findPartById(partsList, target._id) || findPartById(partsList, target.id);
  }

  /**
   * 判断是否是同一个部件
   * @param {Object} part1 - 部件1
   * @param {Object} part2 - 部件2
   * @returns {boolean} 是否是同一个部件
   */
  function isSamePart(part1, part2) {
    return (
      (part1._id && part1._id === part2._duplicate_id) ||
      (part1.id && part1.id === part2._duplicate_id)
    );
  }

  return {
    generatePartData,
    processPartData,
    setupPartInfo,
    findParentNode,
    findPartIndex,
    findPartById,
    findOriginalPart,
    isSamePart,
    processChildren,
    deepClone,
    generateUniqueId,
  };
}
