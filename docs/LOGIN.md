# 跨域登录方案（A + B 结合）

新工程为独立域名部署，与主工程跨域。登录态核心是 **`bx_auth_ticket`**（请求头 `bx_auth_ticket`），原实现从 `sessionStorage` 读取（同源），跨域后需要两个通道注入。

## 方案 A：iframe postMessage 注入（主）

主站业务页 iframe 嵌入低代码页面时，父窗口向 iframe 发送登录态：

```js
// 主站侧（父窗口）
const iframe = document.querySelector("#lowcode-frame");
iframe.contentWindow.postMessage(
  {
    type: "LC_AUTH_INJECT",
    bx_auth_ticket: sessionStorage.getItem("bx_auth_ticket"),
    user: JSON.parse(sessionStorage.getItem("current_login_user") || "{}"),
  },
  "https://site.example.com" // 低代码域名
);
```

新工程侧（`src/common/http.js`）监听 `message` 事件：

- 校验 `data.type === "LC_AUTH_INJECT"`
- 校验 `event.origin` 在白名单 `APP_CONFIG.allowedOrigins`（未配置时默认接受，生产建议配置）
- 写入本域 `sessionStorage`（`bx_auth_ticket` / `current_login_user`）

## 方案 B：SSO 跳转（兜底，直接访问独立域名）

用户直接访问低代码域名且未登录时：

1. 接口返回 `resultCode === "0011"`（登录失效）
2. 非 iframe 场景 → 弹登录对话框（本域登录）
3. iframe 场景 → 跳转 `APP_CONFIG.ssoLoginUrl?redirect=<当前URL>`，登录成功回跳后带票据

配置（`public/config/config_dev.js`）：

```js
window.APP_CONFIG = {
  // ...
  allowedOrigins: ["https://www.100xsys.cn"], // 主站 origin 白名单
  ssoLoginUrl: "https://sso.100xsys.cn/login", // SSO 登录地址
};
```

## 网关配置（静态化）

原 `http.js` 从 `window.top.pathConfig.gateway` 读取网关地址——独立域名后跨域访问 top 会抛异常。改造后：

```
优先级：window.backendIpAddr（部署注入）> sessionStorage.pathConfig > envList 静态配置
```

同源顶层窗口注入的 `pathConfig` 仍兼容（try/catch 包裹）。

## 其他改动

| 项 | 说明 |
|---|---|
| `top.limitingTips()` | 429 限流提示，跨域 try/catch |
| `getRootWindow` | 已删除（仅用于 layer 登录弹窗，新工程不需要） |
| `layer.open` 登录 | 已删除 |
| 登录成功刷新 | 保留（`window.confirm` 票据更新刷新） |
