/**
 * ClipboardService - 卡片部件剪贴板服务
 *
 * 设计目标：
 * 1. 支持跨域名复制粘贴（通过系统剪贴板 navigator.clipboard，操作系统级共享）
 * 2. 双通道写入：系统剪贴板（跨域）+ localStorage（同域降级缓存）
 * 3. 无副作用的权限检测（使用 navigator.permissions.query，而非 readText）
 * 4. 提供同步的 hasContent() 方法，供右键菜单状态判断
 * 5. 不支持系统剪贴板时，弹出 JSON 让用户手动复制
 */

const STORAGE_KEY = 'card_part_clipboard';

class ClipboardService {
  constructor() {
    this._hasContent = false;
  }

  /**
   * 写入剪贴板（双通道 + 手动复制兜底）
   * @param {Object|Array} data - 要写入的部件数据（已包含 _isCardPart 标记）
   * @returns {Promise<{success: boolean, manualCopy: boolean, json?: string}>}
   * - success: 是否写入成功
   * - manualCopy: 是否需要手动复制
   * - json: 需要手动复制的JSON字符串（当 manualCopy 为 true 时）
   */
  async write(data) {
    const json = JSON.stringify(data);
    let systemOk = false;

    if (this._isClipboardApiAvailable()) {
      try {
        const canWrite = await this._checkWritePermission();
        if (canWrite) {
          await navigator.clipboard.writeText(json);
          systemOk = true;
        }
      } catch (e) {
        console.warn('[ClipboardService] 系统剪贴板写入失败，将使用 localStorage 降级:', e);
      }
    }

    try {
      localStorage.setItem(STORAGE_KEY, json);
      this._hasContent = true;
    } catch (e) {
      if (!systemOk) {
        throw new Error('剪贴板写入失败：系统剪贴板和本地存储均不可用');
      }
      console.warn('[ClipboardService] localStorage 写入失败:', e);
    }

    if (!systemOk) {
      console.warn('[ClipboardService] 系统剪贴板不可用，需要手动复制');
      this._hasContent = true;
      return { success: true, manualCopy: true, json };
    }

    this._hasContent = true;
    return { success: true, manualCopy: false };
  }

  /**
   * 读取剪贴板数据
   * 优先读取系统剪贴板（支持跨域场景），降级到 localStorage
   * @returns {Promise<Object|Array|null>} 返回解析后的数据，或 null（数据为空/格式不符）
   */
  async read() {
    // 优先尝试系统剪贴板（跨域场景依赖此通道）
    if (this._isClipboardApiAvailable()) {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          const parsed = this._safeParseJSON(text);
          if (parsed !== null) {
            return parsed;
          }
        }
      } catch (e) {
        // 用户拒绝了 clipboard-read 权限，或其他原因
        console.warn('[ClipboardService] 系统剪贴板读取失败，降级到 localStorage:', e);
      }
    }

    // 降级：读取 localStorage 缓存（同域场景）
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return this._safeParseJSON(stored);
  }

  /**
   * 同步检测是否有剪贴板内容（不触发权限请求）
   * 用途：右键菜单"粘贴"项的 disabled 状态判断
   * @returns {boolean}
   */
  hasContent() {
    // 优先使用运行时缓存（本次会话内已复制过）
    if (this._hasContent) return true;
    // 再检查 localStorage（应对页面刷新后的状态恢复）
    try {
      return !!localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return false;
    }
  }

  /**
   * 清空剪贴板缓存（仅清除本地缓存，不影响系统剪贴板）
   */
  clear() {
    this._hasContent = false;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // 忽略
    }
  }

  // ─── 内部方法 ────────────────────────────────────────────

  /**
   * 检查 Clipboard API 是否可用（HTTPS 或 localhost 下才可用）
   * @returns {boolean}
   */
  _isClipboardApiAvailable() {
    return !!(navigator.clipboard && window.isSecureContext);
  }

  /**
   * 无副作用地检测 clipboard-write 权限
   * 使用 navigator.permissions.query，不触发实际读写操作
   * @returns {Promise<boolean>}
   */
  async _checkWritePermission() {
    if (!navigator.permissions) return true; // 不支持 permissions API，乐观假设可用
    try {
      const result = await navigator.permissions.query({ name: 'clipboard-write' });
      return result.state !== 'denied';
    } catch (e) {
      // 部分浏览器不支持 clipboard-write 权限查询，乐观返回 true
      return true;
    }
  }

  /**
   * 安全解析 JSON，解析失败时返回 null
   * @param {string} text
   * @returns {any|null}
   */
  _safeParseJSON(text) {
    try {
      return JSON.parse(text);
    } catch (e) {
      return null;
    }
  }

  /**
   * 检测当前环境是否支持系统剪贴板
   * @returns {boolean}
   */
  isSecureContext() {
    return window.isSecureContext;
  }

  /**
   * 显示手动复制弹窗
   * 在不支持系统剪贴板的环境中调用，显示 JSON 内容供用户手动复制
   * @param {string} json - 要复制的 JSON 字符串
   * @returns {Promise<void>} 用户关闭弹窗后 resolve
   */
  showManualCopyDialog(json) {
    return new Promise((resolve) => {
      const existingDialog = document.getElementById('clipboard-manual-dialog');
      if (existingDialog) {
        existingDialog.remove();
      }

      const overlay = document.createElement('div');
      overlay.id = 'clipboard-manual-dialog';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      const dialog = document.createElement('div');
      dialog.style.cssText = `
        background: #fff;
        border-radius: 8px;
        padding: 20px;
        max-width: 600px;
        max-height: 80vh;
        width: 90%;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        display: flex;
        flex-direction: column;
      `;

      const title = document.createElement('div');
      title.style.cssText = `
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 15px;
        color: #333;
      `;
      title.textContent = '当前环境不支持自动复制，请手动复制下方内容';

      const textarea = document.createElement('textarea');
      textarea.style.cssText = `
        flex: 1;
        min-height: 200px;
        max-height: 400px;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-family: monospace;
        font-size: 12px;
        resize: none;
        margin-bottom: 15px;
        background: #f5f5f5;
      `;
      textarea.value = json;
      textarea.readOnly = true;

      const buttonContainer = document.createElement('div');
      buttonContainer.style.cssText = `
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      `;

      const copyBtn = document.createElement('button');
      copyBtn.textContent = '已复制';
      copyBtn.style.cssText = `
        padding: 8px 20px;
        background: #409eff;
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      `;
      copyBtn.onclick = () => {
        try {
          const textareaForCopy = document.createElement('textarea');
          textareaForCopy.value = json;
          textareaForCopy.style.cssText = 'position:fixed;top:-9999px;left:-9999px;';
          document.body.appendChild(textareaForCopy);
          textareaForCopy.select();
          document.execCommand('copy');
          document.body.removeChild(textareaForCopy);
          copyBtn.textContent = '已复制 ✓';
          copyBtn.style.background = '#67c23a';
        } catch (e) {
          copyBtn.textContent = '复制失败';
          copyBtn.style.background = '#f56c6c';
        }
      };

      const closeBtn = document.createElement('button');
      closeBtn.textContent = '关闭';
      closeBtn.style.cssText = `
        padding: 8px 20px;
        background: #909399;
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      `;
      closeBtn.onclick = () => {
        overlay.remove();
        resolve();
      };

      overlay.onclick = (e) => {
        if (e.target === overlay) {
          overlay.remove();
          resolve();
        }
      };

      buttonContainer.appendChild(copyBtn);
      buttonContainer.appendChild(closeBtn);
      dialog.appendChild(title);
      dialog.appendChild(textarea);
      dialog.appendChild(buttonContainer);
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
    });
  }

  /**
   * 显示手动粘贴弹窗
   * 在不支持系统剪贴板的环境中调用，让用户粘贴 JSON 数据
   * @returns {Promise<string|null>} 用户输入的 JSON 字符串，取消返回 null
   */
  showManualPasteDialog() {
    return new Promise((resolve) => {
      const existingDialog = document.getElementById('clipboard-manual-paste-dialog');
      if (existingDialog) {
        existingDialog.remove();
      }

      const overlay = document.createElement('div');
      overlay.id = 'clipboard-manual-paste-dialog';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      const dialog = document.createElement('div');
      dialog.style.cssText = `
        background: #fff;
        border-radius: 8px;
        padding: 20px;
        max-width: 600px;
        max-height: 80vh;
        width: 90%;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        display: flex;
        flex-direction: column;
      `;

      const title = document.createElement('div');
      title.style.cssText = `
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 15px;
        color: #333;
      `;
      title.textContent = '请在下方粘贴之前手动复制的 JSON 数据';

      const textarea = document.createElement('textarea');
      textarea.style.cssText = `
        flex: 1;
        min-height: 200px;
        max-height: 400px;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-family: monospace;
        font-size: 12px;
        resize: none;
        margin-bottom: 15px;
      `;
      textarea.placeholder = '请在此处粘贴 JSON 数据...';

      const hint = document.createElement('div');
      hint.style.cssText = `
        font-size: 12px;
        color: #909399;
        margin-bottom: 10px;
      `;
      hint.textContent = '提示：仅支持有效的卡片部件 JSON 数据';

      const buttonContainer = document.createElement('div');
      buttonContainer.style.cssText = `
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      `;

      const pasteBtn = document.createElement('button');
      pasteBtn.textContent = '粘贴';
      pasteBtn.style.cssText = `
        padding: 8px 20px;
        background: #409eff;
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      `;
      pasteBtn.onclick = () => {
        const value = textarea.value.trim();
        if (!value) {
          pasteBtn.textContent = '请输入内容';
          pasteBtn.style.background = '#f56c6c';
          setTimeout(() => {
            pasteBtn.textContent = '粘贴';
            pasteBtn.style.background = '#409eff';
          }, 1500);
          return;
        }
        overlay.remove();
        resolve(value);
      };

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = '取消';
      cancelBtn.style.cssText = `
        padding: 8px 20px;
        background: #909399;
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      `;
      cancelBtn.onclick = () => {
        overlay.remove();
        resolve(null);
      };

      overlay.onclick = (e) => {
        if (e.target === overlay) {
          overlay.remove();
          resolve(null);
        }
      };

      buttonContainer.appendChild(pasteBtn);
      buttonContainer.appendChild(cancelBtn);
      dialog.appendChild(title);
      dialog.appendChild(hint);
      dialog.appendChild(textarea);
      dialog.appendChild(buttonContainer);
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      textarea.focus();
    });
  }

  /**
   * 检查是否可以从系统剪贴板读取
   * @returns {boolean}
   */
  canReadFromSystem() {
    return this._isClipboardApiAvailable();
  }
}

// 单例导出，整个应用共享同一个剪贴板服务实例
export const clipboardService = new ClipboardService();
export default clipboardService;
