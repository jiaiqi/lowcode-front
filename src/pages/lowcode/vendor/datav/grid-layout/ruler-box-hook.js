// import { onMounted, onUnmounted, ref, computed } from "vue";

// export function useCtrlDown() {
//   // 监听ctrl+鼠标拖拽

//   let curScrollElement = null;


//   const onCtrlKeyDown = ref(false);
//   const cursorValue = computed(() => {
//     return onCtrlKeyDown.value ? "cursor:grab;" : "cursor:default;";
//   });

//   // 设置ctrl键按下状态
//   const setKeyDown = (e) => {
//     if (e?.ctrlKey) {
//       onCtrlKeyDown.value = true;
//     } else {
//       onCtrlKeyDown.value = false;
//     }
//   };
//   // 拖拽滚动
//   const onDrag = (e) => {
//     curScrollElement?.scrollBy(-e.movementX, -e.movementY);
//   };
//   // 鼠标抬起 重置curScrollElement
//   const resetCurElement = () => {
//     curScrollElement = null;
//   };
//   onMounted(() => {
//     const scrollElement = document.querySelector("#screens");
//     scrollElement.addEventListener("mousedown", function (e) {
//       if (e.ctrlKey && e.button === 0) {
//         e.preventDefault();
//         curScrollElement = scrollElement;
//       }
//     });
//     document.addEventListener("keydown", setKeyDown);
//     document.addEventListener("keyup", setKeyDown);
//     document.addEventListener("mousemove", onDrag);
//     document.addEventListener("mouseup", resetCurElement);
//   });

//   onUnmounted(() => {
//     document.removeEventListener("keydown", setKeyDown);
//     document.removeEventListener("keyup", setKeyDown);
//     document.removeEventListener("mousemove", onDrag);
//     document.removeEventListener("mouseup", resetCurElement);
//   });

//   return {
//     onCtrlKeyDown,
//     cursorValue,
//   };
// }

import { onMounted, onUnmounted, ref, computed } from "vue";

export function useSpaceDrag() { // 重命名函数
  let curScrollElement = null;
  const isSpacePressed = ref(false); // 改用空格状态变量
  const isDragging = ref(false); // 新增拖拽状态标识

  // 计算光标样式（保持原有逻辑结构）
  const cursorValue = computed(() => {
    return isSpacePressed.value ? "cursor:grab;" : "cursor:default;";
  });

  // 键盘事件处理（核心修改点）
  const handleKey = (e) => {
    // 针对空格键的状态更新
    if (e.code === 'Space') {
      isSpacePressed.value = e.type === 'keydown';
      
      // 阻止空格键默认滚动行为（重要！）
      if (e.type === 'keydown') {
        e.preventDefault();
      }
    }
  };

  // 鼠标拖动逻辑（修改判断条件）
  const onDrag = (e) => {
    if (isSpacePressed.value && isDragging.value) {
      curScrollElement?.scrollBy(-e.movementX, -e.movementY);
    }
  };

  // 鼠标按下事件（核心修改点）
  const startDrag = (e) => {
    if (isSpacePressed.value && e.button === 0) {
      isDragging.value = true;
      curScrollElement = document.querySelector("#screens");
      e.preventDefault();
    }
  };

  // 鼠标释放事件（新增状态重置）
  const stopDrag = () => {
    isDragging.value = false;
    curScrollElement = null;
  };

  // 生命周期钩子（调整事件监听器）
  onMounted(() => {
    document.addEventListener("keydown", handleKey);
    document.addEventListener("keyup", handleKey);
    document.addEventListener("mousedown", startDrag);
    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", stopDrag);
  });

  onUnmounted(() => {
    document.removeEventListener("keydown", handleKey);
    document.removeEventListener("keyup", handleKey);
    document.removeEventListener("mousedown", startDrag);
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", stopDrag);
  });

  return {
    isSpacePressed, // 返回状态变量供外部使用
    cursorValue,
  };
}