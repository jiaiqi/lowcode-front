/**
 * 图标数据本地存储（离线友好，零网络依赖）
 *
 * 设计约束（离线部署 / Vue3-Nuxt 升级预留）：
 * - 纯 JS 模块，零 Vue 依赖，SSR 安全（fetch 仅浏览器触发）
 * - 集合 JSON 全部为构建产物内的静态资源（?url），运行时 fetch 本地文件，
 *   不发起任何外部网络请求（替代 @iconify/vue2 的 CDN 自动加载行为，已完全移除该依赖）
 * - 静态/固定图标已由 unocss 内联（见 icon-safelist.js），本模块仅服务
 *   safelist 未覆盖的动态图标兜底
 */

// 集合资源加载器（?url → 构建产物静态资源）
// 配置图标可选集合（可扩充：新增集合 = 安装 @iconify-json/xxx + 在此加一行）
const collectionLoaders = {
  ep: () => import("@iconify-json/ep/icons.json?url"),
  ri: () => import("@iconify-json/ri/icons.json?url"),
  "mdi-light": () => import("@iconify-json/mdi-light/icons.json?url"),
  "material-symbols": () => import("@iconify-json/material-symbols/icons.json?url"),
  // 编辑器图标选择器全集（仅编辑器场景按需加载）
  carbon: () => import("@iconify/json/json/carbon.json?url"),
};

const collections = new Map(); // prefix → collection JSON
const loading = new Map(); // prefix → Promise

/**
 * 确保集合已加载（本地资源 fetch，幂等）
 * @param {string} prefix - 图标集合前缀（ep / ri / mdi-light / carbon）
 * @returns {Promise<void>}
 */
export function ensureCollection(prefix) {
  if (collections.has(prefix)) return Promise.resolve();
  if (loading.has(prefix)) return loading.get(prefix);
  const loader = collectionLoaders[prefix];
  if (!loader) return Promise.resolve();
  const p = loader()
    // 动态 import("...?url") 返回模块对象 { default: url }，需取 default
    .then((mod) => fetch(mod.default || mod).then((r) => r.json()))
    .then((data) => {
      collections.set(prefix, data);
      loading.delete(prefix);
    })
    .catch((e) => {
      loading.delete(prefix); // 失败允许重试
      console.warn(`图标集合加载失败: ${prefix}`, e);
    });
  loading.set(prefix, p);
  return p;
}

/** 解析图标名："ep:close" / "ri-home-4-fill" → { prefix, name } */
export function parseIconName(iconName) {
  if (typeof iconName !== "string" || !iconName.trim()) return null;
  const name = iconName.trim();
  if (name.includes(":")) {
    const [prefix, icon] = name.split(":");
    return { prefix, icon };
  }
  // 无冒号格式：ri-xxx → prefix=ri
  const m = /^(ep|ri|mdi|mdi-light|carbon|material-symbols|ph|tabler)-(.+)$/i.exec(name);
  if (m) return { prefix: m[1].toLowerCase(), icon: m[2] };
  return null;
}

/** 递归解析别名指向的真实图标 */
function resolveIconData(col, iconName, seen = new Set()) {
  const icon = col.icons?.[iconName];
  if (icon) return icon;
  const alias = col.aliases?.[iconName];
  if (!alias || seen.has(iconName)) return null;
  seen.add(iconName);
  if (alias.parent) {
    const parent = resolveIconData(col, alias.parent, seen);
    return parent ? { ...parent, ...alias } : null;
  }
  return alias.body ? alias : null;
}

/**
 * 获取图标渲染数据（集合需先 ensureCollection）
 * @param {string} iconName - "ep:close" / "ri-home-4-fill"
 * @returns {{body: string, width: number, height: number}|null}
 */
export function getIconData(iconName) {
  const parsed = parseIconName(iconName);
  if (!parsed) return null;
  const col = collections.get(parsed.prefix);
  if (!col) return null;
  const icon = resolveIconData(col, parsed.icon);
  if (!icon) return null;
  return {
    body: icon.body,
    width: icon.width || col.width || 24,
    height: icon.height || col.height || 24,
  };
}
