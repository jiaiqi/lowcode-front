/**
 * useKeyboard - 键盘快捷键 Composable
 *
 * 职责：
 * 1. 处理编辑器键盘事件（Ctrl+Z/Y/C/V/A、Delete/Backspace）
 * 2. 内部递归查找部件在树中的索引位置
 */

export function useKeyboard({
  selectedPart,
  partsList,
  handleUndo,
  handleRedo,
  handleCopyPart,
  handlePastePart,
  handleEditorClick,
  deletePart,
  onDeleteAll,
  $message,
}) {
  function findPartIndex(list, targetPart) {
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

  async function handleKeyDown(event) {
    if (event.ctrlKey) {
      if (event.key === "z" && !event.shiftKey) {
        event.preventDefault();
        handleUndo?.();
        return;
      }
      if (event.key === "y" || (event.key === "z" && event.shiftKey)) {
        event.preventDefault();
        handleRedo?.();
        return;
      }
      event.preventDefault();
      switch (event.key) {
        case "c":
          await handleCopyPart?.();
          break;
        case "v":
          await handlePastePart?.();
          break;
        case "a":
          handleEditorClick?.();
          break;
      }
      return;
    }

    if (event.key === "Delete" || event.key === "Backspace") {
      if (selectedPart.value) {
        const partInfo = findPartIndex(partsList.value, selectedPart.value);
        if (partInfo) {
          deletePart(selectedPart.value, partInfo.index);
        }
      } else {
        onDeleteAll?.();
      }
    }
  }

  return { handleKeyDown };
}
