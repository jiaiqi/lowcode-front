/**
 * useTheme - 主题切换 Composable
 *
 * 职责：
 * 1. 管理深色/浅色模式状态
 * 2. 执行带圆形扩散动画的主题切换
 */

import { ref } from "vue";

export function useTheme(containerRef) {
  const isDarkMode = ref(false);

  function toggleTheme(e) {
    isDarkMode.value = !isDarkMode.value;
    const ele = containerRef.value;
    if (!ele) return;

    if (!document.startViewTransition) {
      ele.classList.toggle("dark-mode");
      return;
    }

    const transition = document.startViewTransition(() => {
      ele.classList.toggle("dark-mode");
    });

    transition.ready.then(() => {
      const { clientX, clientY } = e;
      const radius = Math.hypot(
        Math.max(clientX, innerWidth - clientX),
        Math.max(clientY, innerHeight - clientY)
      );
      ele.animate(
        {
          clipPath: [
            `circle(0% at ${clientX}px ${clientY}px)`,
            `circle(${radius}px at ${clientX}px ${clientY}px)`,
          ],
        },
        {
          duration: 500,
          pseudoElement: "::view-transition-new(.card-cell-editor)",
        }
      );
    });
  }

  return { isDarkMode, toggleTheme };
}
