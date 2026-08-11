// 构建组件树
export function buildComponentsTree(components) {
  let list = components.filter((item) => !item.parent_no);
  function buildTree(list, parentId) {
    const result = [];
    if (Array.isArray(list) && list.length) {
      list.forEach((item) => {
        if (parentId && item.parent_no === parentId) {
          item.children = buildTree(list, item.com_no);
          result.push(item);
        }
      });
    }
    return result;
  }
  list = list.map((item) => {
    item.children = buildTree(components, item.com_no)?.sort(
      (a, b) => a.com_seq - b.com_seq
    );
    return item;
  });
  return list;
}
