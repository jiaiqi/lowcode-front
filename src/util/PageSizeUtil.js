/**
 * 获取默认的 pageSize
 * 优先从 sessionStorage 中的 list_display.pagesize 读取
 * 如果没有配置则使用传入的默认值
 * @param {number} defaultSize - 默认的 pageSize，如果不传则为 10
 * @returns {number}
 */
export function getDefaultPageSize(defaultSize = 10) {
  try {
    const userInfo = sessionStorage.getItem('current_login_user');
    if (userInfo) {
      const userData = JSON.parse(userInfo);
      const pagesize = userData?.theme?.app_style_json?.list_display?.pagesize;
      if (pagesize) {
        const size = parseInt(pagesize, 10);
        return isNaN(size) ? defaultSize : size;
      }
    }
  } catch (e) {
    console.warn('读取 list_display.pagesize 失败:', e);
  }
  return defaultSize;
}
