/**
 * 页面快照 IndexedDB 持久化缓存（SWR 的 stale 层）
 *
 * 设计约束（为 Vue3/Nuxt 升级预留）：
 * - 纯 JS 模块，零 Vue/浏览器全局依赖（仅 indexedDB），Vue2/Vue3/Nuxt 通用
 * - SSR 安全：非浏览器环境（typeof indexedDB === "undefined"）全部降级为 no-op
 * - 只缓存纯 JSON 数据（data / appCfg / fingerprint），components 由调用方
 *   从 data 重建（见 lowcode-page-mixin），避免序列化边界问题（函数/undefined 丢失）
 * - 缓存带过期时间（MAX_AGE），命中后由调用方后台 revalidate 保证新鲜度
 */

const DB_NAME = "lowcode-page-snapshots";
const STORE_NAME = "pages";
const DB_VERSION = 1;
const MAX_AGE = 60 * 60 * 1000; // 1 小时：超过则视为过期，不返回

let dbPromise = null;

/** 打开（并惰性创建）IndexedDB 连接；非浏览器环境返回 null */
function openDb() {
  if (typeof indexedDB === "undefined") return null;
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "pageNo" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

/**
 * 读取页面快照（过期返回 null）
 * @param {string} pageNo
 * @returns {Promise<{pageNo, fingerprint, data, appCfg, savedAt}|null>}
 */
export async function getPageSnapshot(pageNo) {
  const db = await openDb();
  if (!db || !pageNo) return null;
  try {
    const row = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(pageNo);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    if (!row) return null;
    // 过期判断
    if (!row.savedAt || Date.now() - row.savedAt > MAX_AGE) {
      await removePageSnapshot(pageNo);
      return null;
    }
    return row;
  } catch (e) {
    console.warn("[snapshot-db] 读取失败", e);
    return null;
  }
}

/**
 * 写入页面快照
 * @param {string} pageNo
 * @param {{fingerprint: string, data: Object, appCfg?: Object|null}} snapshot
 */
export async function setPageSnapshot(pageNo, snapshot) {
  const db = await openDb();
  if (!db || !pageNo || !snapshot?.data) return;
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put({
        pageNo,
        fingerprint: snapshot.fingerprint || "",
        data: snapshot.data,
        appCfg: snapshot.appCfg || null,
        savedAt: Date.now(),
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    // 写库失败不影响功能（仅失去刷新秒开能力）
    console.warn("[snapshot-db] 写入失败", e);
  }
}

/** 删除单页快照 */
export async function removePageSnapshot(pageNo) {
  const db = await openDb();
  if (!db || !pageNo) return;
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(pageNo);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    /* 忽略 */
  }
}

/** 清空全部快照（登录态切换/版本升级时使用） */
export async function clearPageSnapshots() {
  const db = await openDb();
  if (!db) return;
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    /* 忽略 */
  }
}
