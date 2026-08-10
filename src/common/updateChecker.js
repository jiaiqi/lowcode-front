
// import { Notification } from 'element-ui';
// 本地版本信息
let localVersionInfo = null;
const baseUrl = location.origin + '/vpages/';
const versionFileName = 'version.json';
const versionStorageKey = 'VERSION_INFO';

const getStoredVersionInfo = () => {
  try {
    const rawVersionInfo = sessionStorage.getItem(versionStorageKey);
    return rawVersionInfo ? JSON.parse(rawVersionInfo) : null;
  } catch (e) {
    return null;
  }
};

const getTopWindow = () => {
  try {
    return window.top || window;
  } catch (e) {
    return window;
  }
};

const exposeVersionInfo = (versionInfo) => {
  const topWindow = getTopWindow();
  try {
    if (versionInfo) {
      topWindow.VERSION_INFO = versionInfo;
    }
    topWindow.getVersionInfo = () => localVersionInfo || getStoredVersionInfo();
    topWindow.fetchVersionInfo = getLocalVersion;
    topWindow.getVersion = checkVersion;
  } catch (e) {
    if (versionInfo) {
      window.VERSION_INFO = versionInfo;
    }
    window.getVersionInfo = () => localVersionInfo || getStoredVersionInfo();
    window.fetchVersionInfo = getLocalVersion;
    window.getVersion = checkVersion;
  }
};

const setVersionInfo = (versionInfo) => {
  if (!versionInfo) {
    return null;
  }
  localVersionInfo = versionInfo;
  try {
    sessionStorage.setItem(versionStorageKey, JSON.stringify(versionInfo));
  } catch (e) {}
  exposeVersionInfo(versionInfo);
  return versionInfo;
};

// 获取本地版本信息
const getLocalVersion = async () => {
  if (localVersionInfo) {
    exposeVersionInfo(localVersionInfo);
    return localVersionInfo;
  }
  const storedVersionInfo = getStoredVersionInfo();
  if (storedVersionInfo) {
    return setVersionInfo(storedVersionInfo);
  }
  console.info('获取本地版本信息:', baseUrl);
  try {
    const url = `${baseUrl}${versionFileName}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'no-cache'
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return setVersionInfo(await response.json());
  } catch (error) {
    console.error('获取本地版本信息失败:', error);
    return null;
  }
};

// 获取远程版本信息
const getRemoteVersion = async () => {
  // console.info('获取远程版本信息:', baseUrl);
  try {
    const url = `${baseUrl}${versionFileName}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('获取远程版本信息失败:', error);
    return null;
  }
};

const parseVersionParts = (version) => {
  if (typeof version !== 'string' || version === 'latest') {
    return null;
  }

  const normalizedVersion = version.trim().replace(/^v/i, '');
  if (!/^\d+(?:\.\d+)*$/.test(normalizedVersion)) {
    return null;
  }

  return normalizedVersion.split('.').map(Number);
};

// 比较版本信息
const compareVersions = (localVersion, remoteVersion) => {
  if (!localVersion || !remoteVersion) {
    return false;
  }

  // 远程版本号为空时，不认为有更新
  if (typeof remoteVersion !== 'object' || !remoteVersion?.version) {
    return false;
  }

  // 比较 commit hash
  if (localVersion.build !== remoteVersion.build) {
    return true;
  }

  // 比较版本号（如果有 tag）
  if (localVersion.version !== 'latest' && remoteVersion.version !== 'latest') {
    const localParts = parseVersionParts(localVersion.version);
    const remoteParts = parseVersionParts(remoteVersion.version);

    if (!localParts || !remoteParts) {
      return false;
    }

    for (let i = 0; i < Math.max(localParts.length, remoteParts.length); i++) {
      const localNum = localParts[i] || 0;
      const remoteNum = remoteParts[i] || 0;

      if (remoteNum > localNum) {
        return true;
      } else if (remoteNum < localNum) {
        return false;
      }
    }
  }

  return false;
};

// 检查更新
const checkUpdate = async () => {
  try {
    const [localVersion, remoteVersion] = await Promise.all([
      getLocalVersion(),
      getRemoteVersion()
    ]);

    const hasUpdate = compareVersions(localVersion, remoteVersion);

    return {
      hasUpdate,
      localVersion,
      remoteVersion
    };
  } catch (error) {
    console.error('检查更新失败:', error);
    return {
      hasUpdate: false,
      error
    };
  }
};

// 显示更新提示
const showUpdateNotification = (updateInfo) => {
  const { localVersion, remoteVersion } = updateInfo;

  // 构造详细的更新信息
  const updateDetails = {
    本地版本: localVersion.version,
    本地构建号: localVersion.build,
    本地提交时间: localVersion.commitTime,
    远程版本: remoteVersion.version,
    远程构建号: remoteVersion.build,
    远程提交时间: remoteVersion.commitTime
  };
  if (updateInfo.hasUpdate) {

    // 在控制台打印详细信息
    if (localVersion.version && remoteVersion.version) {
      console.info('%c\n==================================================', 'color: #4CAF50; font-weight: bold;');
      console.info('%c🔄 发现新版本！', 'color: #2196F3; font-size: 16px; font-weight: bold;');
      console.info('%c==================================================', 'color: #4CAF50; font-weight: bold;');
      
      // 醒目显示版本对比
      console.info(`%c📌 本地版本：${localVersion.version}`, 'color: #4CAF50; font-size: 16px; font-weight: bold;');
      console.info(`%c📌 远程版本：${remoteVersion.version}`, 'color: #FF5722; font-size: 16px; font-weight: bold;');
      
      // 突出构建号和时间对比
      console.info('%c\n🏗️  构建信息：', 'color: #2196F3; font-weight: bold;');
      console.info(`%c📝 本地构建号：${localVersion.build}`, 'color: #4CAF50; font-size: 14px;');
      console.info(`%c📝 远程构建号：${remoteVersion.build}`, 'color: #FF5722; font-size: 14px;');
      
      console.info('%c\n⏰ 时间信息：', 'color: #2196F3; font-weight: bold;');
      console.info(`%c📅 本地提交时间：${localVersion.commitTime}`, 'color: #4CAF50; font-size: 14px;');
      console.info(`%c📅 远程提交时间：${remoteVersion.commitTime}`, 'color: #FF5722; font-size: 14px;');
      
      console.info('%c\n==================================================\n', 'color: #4CAF50; font-weight: bold;');

      // 只有在有新版本时才构造通知消息
      if (remoteVersion.version !== localVersion.version) {
        const notificationMessage = `
发现新版本，刷新页面以更新

本地版本: ${localVersion.version} (${localVersion.build})
本地提交时间: ${localVersion.commitTime}

远程版本: ${remoteVersion.version} (${remoteVersion.build})
远程提交时间: ${remoteVersion.commitTime}
    `.trim();

        // Notification({
        //   title: '更新提醒',
        //   message: notificationMessage,
        //   type: 'info',
        //   duration: 10000, // 延长显示时间，让用户有足够时间查看
        //   showClose: true,
        //   onClose: () => {
        //     // 可以在这里添加更新逻辑，比如强制刷新
        //     // window.location.reload();
        //   }
        // });
      }
    }
  } else {
    // console.info('%c\n========================================', 'color: #4CAF50; font-weight: bold;');
    // console.info('%c✅ 更新检测：当前已是最新版本', 'color: #4CAF50; font-size: 16px; font-weight: bold;');
    // console.table(updateDetails);
    // console.info('%c========================================\n', 'color: #4CAF50; font-weight: bold;');
  }
};

function checkVersion() {
  const url = `${baseUrl}${versionFileName}`;
  
  // 创建AbortController用于超时控制
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  
  return fetch(url, {
    signal: controller.signal,
    cache: 'no-cache'
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    if (typeof data === 'object' && data.version) {
      setVersionInfo(data);
      console.info('%c\n==================================================', 'color: #4CAF50; font-weight: bold;');
      console.info('%c✅ vpages版本信息：', 'color: #4CAF50; font-size: 16px; font-weight: bold;');
      
      // 显示版本号
      console.info(`%c📌 版本：${data.version}`, 'color: #FF5722; font-size: 18px; font-weight: bold; padding: 5px 0;');
      
      // 突出提交时间和构建时间
      console.info('%c\n⏰ 时间信息：', 'color: #2196F3; font-weight: bold;');
      console.info(`%c📝 提交时间：${data.commitTime}`, 'color: #4CAF50; font-size: 14px;');
      console.info(`%c🏗️ 构建时间：${data.buildTime}`, 'color: #FF9800; font-size: 14px;');
      
      if (data.tagDescription) {
        console.info('%c\n==================================================', 'color: #409EFF; font-weight: bold;');
        console.info("%c🚀 更新描述：\n" + data.tagDescription, 'color: #409EFF; font-weight: bold;')
        console.info('%c==================================================\n', 'color: #409EFF; font-weight: bold;');
      } else {
        console.info('%c\n==================================================\n', 'color: #4CAF50; font-weight: bold;');
      }
      return data;
    }
    return null;
  })
  .catch(err => {
    if (err.name === 'AbortError') {
      console.error('请求超时:', err);
    } else {
      console.error(err);
    }
    return null;
  })
  .finally(() => {
    clearTimeout(timeoutId);
  });
}

const initVersionInfo = async () => {
  exposeVersionInfo(localVersionInfo || getStoredVersionInfo());
  return getLocalVersion();
};

export {
  checkVersion,
  checkUpdate,
  showUpdateNotification,
  getLocalVersion,
  getLocalVersion as getVersionInfo,
  initVersionInfo,
  getRemoteVersion
};

export default {
  checkVersion,
  checkUpdate,
  showUpdateNotification,
  getLocalVersion,
  getVersionInfo: getLocalVersion,
  initVersionInfo,
  getRemoteVersion
};
