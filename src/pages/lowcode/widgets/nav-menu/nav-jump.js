/**
 * 导航跳转统一工具（消除 nav-menu / nav-menu-list / nav-menu-child 三处重复实现）
 *
 * 设计约束（Vue3/Nuxt 升级预留）：
 * - 纯函数 + vm 参数（Options API 传 this，setup 传 proxy），与 Vue 2.7/3 均兼容
 * - 所有跳转入口统一：登录拦截 → 外部页面 / 锚点 / 站内跳转（router-link 或 $router.push）
 */
import { getFullBaseUrl, normalizeJumpFilePath, getRouterPath } from "@/common/common";

/**
 * 解析菜单配置的 jump_json（兼容字符串/对象）
 * @param {Object} config - 菜单配置（含 jump_json 字段）
 * @returns {Object|null} 跳转配置对象
 */
export function parseJumpJson(config) {
  if (!config?.jump_json) return null;
  try {
    return typeof config.jump_json === "string"
      ? JSON.parse(config.jump_json)
      : config.jump_json;
  } catch (e) {
    console.error("jump_json 解析失败", e);
    return null;
  }
}

/**
 * 计算站内直达路由目标（router-link 使用）
 * @description 仅"原页面 + 站内 + 无登录拦截"的跳转返回路由路径，其余返回 null
 * @param {Object} jumpJson - 解析后的跳转配置
 * @returns {string|null} router 路径（/site/xxx）
 */
export function resolveInternalRoute(jumpJson) {
  if (!jumpJson || !jumpJson.dest_page_no) return null;
  if (jumpJson.obj_type === "外部页面") return null;
  if (jumpJson.target_type && jumpJson.target_type !== "原页面") return null;
  if (jumpJson.click_jump_option?.includes("先登录")) return null;
  let path = "";
  if (jumpJson.tmpl_page_json?.file_path) {
    path = normalizeJumpFilePath(jumpJson.tmpl_page_json.file_path).replace(
      ":pageNo",
      jumpJson.dest_page_no
    );
  } else {
    path = `${getFullBaseUrl()}/${jumpJson.dest_page_no}?srvApp=config`;
  }
  return getRouterPath(path);
}

/**
 * 站内菜单直达路径（nav-menu-item：无 jump_json 且配置 page_no）
 * @param {Object} item - 菜单项数据
 * @returns {string|null} router 路径（/site/xxx）
 */
export function resolveDirectPath(item) {
  if (!item || item.jump_json || !item.page_no) return null;
  let path = `/site/${item.page_no}`;
  if (item.template_page_json?.file_path) {
    path = normalizeJumpFilePath(item.template_page_json.file_path)?.replace(
      ":pageNo",
      item.page_no
    );
    if (path.includes("#")) {
      path = path.split("#")[1];
    }
  }
  return path || null;
}

/**
 * 登录拦截（"先登录"跳转选项）
 * @param {Object} vm - 组件实例（提供 $confirm / $store）
 * @returns {Promise<boolean>} true=已登录可继续；false=未登录已拦截
 */
export function requireLogin(vm) {
  if (vm.$store.state?.loginInfo?.logined === true) return Promise.resolve(true);
  return vm
    .$confirm("您还未登录,需要登录才能进入,点击确认前往登录", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    })
    .then(() => {
      const currentUrl = window.location.pathname + window.location.hash;
      sessionStorage.setItem("login_redirect_url", currentUrl);
      const loginUrl = window.location.origin + "/main/login.html";
      window.location.href = loginUrl;
      return false;
    })
    .catch(() => false);
}

/**
 * 执行跳转（统一入口：登录拦截 → 外部页面 / 锚点 / 站内 SPA）
 * @param {Object} vm - 组件实例（提供 $router / $confirm / $store）
 * @param {Object} jumpConfig - 跳转配置（可传原始 jump_json 字符串）
 * @param {Object} [data] - 行数据（友情链接等场景）
 */
export function navToJump(vm, jumpConfig, data) {
  let jumpJson = jumpConfig;
  if (typeof jumpJson === "string") {
    try {
      jumpJson = JSON.parse(jumpJson);
    } catch (e) {
      console.error(e);
      return;
    }
  }
  if (!jumpJson) return;

  // 友情链接（data._url 且无跳转配置）
  if (data?._url && !jumpJson.obj_type) {
    if (data?.jump_option?.includes("先登录")) {
      requireLogin(vm);
      return;
    }
    window.open(data._url);
    return;
  }

  // 先登录拦截
  if (jumpJson?.click_jump_option?.includes("先登录")) {
    requireLogin(vm);
    return;
  }

  if (!jumpJson.obj_type) {
    if (jumpJson.dest_page_no) {
      jumpToSite(vm, jumpJson);
    }
    return;
  }

  switch (jumpJson.obj_type) {
    case "外部页面":
      if (jumpJson.outer_url) {
        if (jumpJson.target_type == "原页面") {
          window.location.href = jumpJson.outer_url;
        } else {
          window.open(jumpJson.outer_url);
        }
      }
      break;
    case "当前页锚点":
    case "当前页面锚点":
      if (jumpJson.anchor_com_name) {
        if (jumpJson.target_type === "新页面" && jumpJson.dest_page_no) {
          jumpToSite(vm, jumpJson);
        } else {
          const ele = document.getElementById(jumpJson.anchor_com_name);
          if (ele) {
            ele.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
          }
        }
      }
      break;
    default:
      if (jumpJson.dest_page_no) {
        jumpToSite(vm, jumpJson);
      }
      break;
  }
}

/**
 * 站内页面跳转（原页面走 SPA $router.push，新窗口 window.open）
 * @param {Object} vm - 组件实例
 * @param {Object} jumpJson - 跳转配置
 */
export function jumpToSite(vm, jumpJson) {
  const pageNo = jumpJson?.dest_page_no;
  if (!pageNo) return;
  let path = "";
  if (jumpJson?.tmpl_page_json?.file_path) {
    path = normalizeJumpFilePath(jumpJson.tmpl_page_json.file_path).replace(
      ":pageNo",
      pageNo
    );
  } else {
    path = `${getFullBaseUrl()}/${pageNo}?srvApp=config`;
  }
  if (jumpJson.target_type == "原页面") {
    // 站内路径走 SPA 无刷新跳转（配合 SWR 内存缓存秒开）；外部链接保持整页跳转
    const routerPath = getRouterPath(path);
    if (routerPath) {
      vm.$router.push(routerPath);
    } else {
      window.location.href = path;
    }
  } else {
    window.open(path);
  }
}
