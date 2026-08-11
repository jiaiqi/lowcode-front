/**
 * 纯工具函数集合
 * 与 Vue 响应式无关，可在任何上下文中调用
 */
import cloneDeep from "lodash/cloneDeep";

/**
 * 深拷贝对象
 * @param {Object} obj - 要拷贝的对象
 * @returns {Object} 拷贝后的新对象
 */
export function deepClone(obj) {
  return cloneDeep(obj);
}

/**
 * 生成唯一ID
 * 使用时间戳 + 随机字符串组合，避免浮点数精度问题及批量操作时的碰撞
 * @returns {string} 唯一标识
 */
export function generateUniqueId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * 递归处理子部件
 * @param {Array} children - 子部件数组
 * @param {Function} processFn - 处理函数
 * @returns {Array} 处理后的子部件数组
 */
export function processChildren(children, processFn) {
  if (!Array.isArray(children)) return children;
  return children.map((child) => {
    const newChild = processFn(child);
    if (newChild.children?.length) {
      newChild.children = processChildren(newChild.children, processFn);
    }
    return newChild;
  });
}

/**
 * 查找父节点
 * @param {Array} list - 部件列表
 * @param {Object} targetPart - 目标部件
 * @returns {Object|null} 父节点信息 { parent, isRoot }
 */
export function findParentNode(list, targetPart) {
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (item.children?.length) {
      const childIndex = item.children.findIndex(
        (child) =>
          (child._id && child._id === targetPart._id) ||
          (child.id && child.id === targetPart.id)
      );
      if (childIndex !== -1) {
        return { parent: item, isRoot: false };
      }
      const result = findParentNode(item.children, targetPart);
      if (result) return result;
    }
  }
  const rootIndex = list.findIndex(
    (item) =>
      (item._id && item._id === targetPart._id) ||
      (item.id && item.id === targetPart.id)
  );
  return rootIndex !== -1 ? { parent: list, isRoot: true } : null;
}

/**
 * 在部件树中查找部件索引信息
 * @param {Array} list - 部件列表
 * @param {Object} targetPart - 目标部件
 * @returns {Object|null} { index, list }
 */
export function findPartIndex(list, targetPart) {
  for (let i = 0; i < list.length; i++) {
    if (
      list[i]._id === targetPart._id ||
      list[i].id === targetPart.id
    ) {
      return { index: i, list };
    }
    if (list[i].children?.length) {
      const result = findPartIndex(list[i].children, targetPart);
      if (result) return result;
    }
  }
  return null;
}

/**
 * 根据 ID 在部件树中查找部件
 * @param {Array} list - 部件列表
 * @param {string|number} id - 部件 _id 或 id
 * @returns {Object|null}
 */
export function findPartById(list, id) {
  if (!id) return null;
  for (const item of list) {
    if (item._id === id || item.id === id) {
      return item;
    }
    if (item.children?.length) {
      const found = findPartById(item.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * 构建部件 ID 到部件对象的映射表
 * @param {Array} list - 部件列表
 * @param {Map} map - 可选的现有 Map（用于递归累积）
 * @returns {Map<string, Object>}
 */
export function buildPartMap(list, map = new Map()) {
  for (const item of list) {
    if (item._id) map.set(item._id, item);
    if (item.id) map.set(item.id, item);
    if (item.children?.length) {
      buildPartMap(item.children, map);
    }
  }
  return map;
}
