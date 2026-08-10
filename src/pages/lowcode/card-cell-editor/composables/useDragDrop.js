/**
 * useDragDrop - 拖拽放置 Composable
 *
 * 职责：
 * 1. 处理从物料面板拖拽开始（创建拖拽图像）
 * 2. 处理放置到编辑器画布（添加新部件并播放入场动画）
 * 3. 处理拖拽进入/离开的编辑器视觉反馈
 */

import { ref } from "vue";

export function useDragDrop({ partsList, pushHistory, utils, nextTick, onError }) {
  const draggedPart = ref(null);

  function onDragStart(event, item) {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("part", JSON.stringify(item));
    draggedPart.value = item;

    const dragImage = document.createElement("div");
    dragImage.className = "drag-image";
    dragImage.textContent = item.label || item.parts_type;
    document.body.appendChild(dragImage);
    event.dataTransfer.setDragImage(dragImage, 0, 0);

    setTimeout(() => {
      if (dragImage.parentNode) {
        document.body.removeChild(dragImage);
      }
    }, 0);
  }

  function onDrop(event, targetPart) {
    event.preventDefault();
    event.stopPropagation();

    try {
      const partData = JSON.parse(event.dataTransfer.getData("part"));
      if (!targetPart) {
        pushHistory?.();
        const newPart = utils.deepClone(partData);
        if (newPart.parts_type === "row") {
          newPart.children = [];
        }
        newPart._id = utils.generateUniqueId();
        newPart._editType = "add";
        newPart.seq = (partsList.value.length + 1) * 100;
        newPart.card_parts_name =
          newPart?.label ||
          newPart?.parts_type ||
          `卡片部件${partsList.value.length + 1}`;

        Object.keys(newPart).forEach((key) => {
          if (key.startsWith("_default_")) {
            newPart[key.replace("_default_", "")] = newPart[key];
            delete newPart[key];
          }
        });

        partsList.value.push(newPart);

        nextTick?.(() => {
          const newElement = document.querySelector(
            `[data-part-id="${newPart._id}"]`
          );
          if (newElement) {
            newElement.animate(
              [
                { transform: "scale(0.8)", opacity: 0 },
                { transform: "scale(1)", opacity: 1 },
              ],
              {
                duration: 300,
                easing: "ease-out",
              }
            );
          }
        });
      }
    } catch (error) {
      onError?.(error, "放置部件失败");
    }

    draggedPart.value = null;
    event?.currentTarget?.classList?.remove("drag-over-editor");
  }

  function onDragEnter(event, type) {
    if (type === "editor") {
      event?.currentTarget?.classList?.add("drag-over-editor");
    }
  }

  function onDragLeave(event, type) {
    if (type === "editor") {
      event?.currentTarget?.classList?.remove("drag-over-editor");
    }
  }

  return { draggedPart, onDragStart, onDrop, onDragEnter, onDragLeave };
}
