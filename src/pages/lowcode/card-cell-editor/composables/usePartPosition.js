/**
 * usePartPosition - 部件头部定位 Composable
 *
 * 职责：
 * 1. 计算选中部件在编辑器中的绝对定位坐标
 * 2. 用于显示浮动操作栏（复制/粘贴/删除按钮）
 */

export function usePartPosition(editorContentRef) {
  function calcPartHeaderPosition(part) {
    if (!part) return null;

    const partElement = document.querySelector(
      `.card-part[data-part-id="${part._id || part.id}"]`
    );
    if (!partElement) return null;

    const parentElement = editorContentRef.value;
    if (!parentElement) return null;

    const { top, left, width, height } = partElement.getBoundingClientRect();
    const { top: parentTop, left: parentLeft } = parentElement.getBoundingClientRect();

    return {
      top: top - parentTop - 2 + "px",
      left: left - parentLeft + "px",
      minWidth: width - 2 + "px",
      _height: height,
    };
  }

  return { calcPartHeaderPosition };
}
