# 部署说明（独立域名 + 二级目录）

## 部署形态

- **独立域名**：如 `https://site.example.com`
- **二级目录**：可能部署在非根路径，如 `https://site.example.com/lowcode/`

构建产物使用**相对路径**（`base: './'`），任意二级目录均可直接部署，无需改配置。

## 构建

```bash
pnpm install
pnpm build          # 输出 dist/
```

产物结构：

```
dist/
├── index.html
├── config/config_dev.js     # 环境配置（构建期无改动，需随产物部署）
├── favicon.ico
└── assets/                  # 带 hash 的 JS/CSS chunk
```

## Nginx 示例

```nginx
server {
    listen 443 ssl;
    server_name site.example.com;

    # 二级目录部署
    location /lowcode/ {
        alias /data/www/lowcode-front/dist/;
        try_files $uri $uri/ /lowcode/index.html;
        # 静态资源长缓存（hash 文件名）
        location ~* /lowcode/assets/.*\.(js|css|png|jpg|svg|ico)$ {
            expires 30d;
            add_header Cache-Control "public, max-age=2592000";
        }
    }
}
```

> 说明：hash 路由模式（默认）下 `try_files` 兜底到 index.html 即可；若后续切换 history 模式需调整。

## 环境配置（public/config/config_dev.js）

| 配置项 | 说明 |
|---|---|
| `APP_CONFIG.ssoLoginUrl` | SSO 登录地址（未登录时跳转） |
| `APP_CONFIG.allowedOrigins` | 允许 postMessage 注入登录态的父窗口 origin 白名单 |
| `APP_CONFIG.legacyFormHost` | 旧工程前端入口（表单 iframe 嵌入目标） |

## 接口网关

网关地址**静态配置**在 `src/common/envList.js` 的 `pathConfigMap`，不再依赖 `window.top.pathConfig`（跨域不可访问）。按环境通过 `?env=xxx` / `dev_env` / `VUE_APP_DEFAULT_ENV` 切换。

## 生产环境注意

1. `index.html` 中 `./config/config_dev.js` 为相对引用，随 dist 部署即可
2. 若网关与页面跨域，确认后端 CORS 允许 `bx_auth_ticket` 请求头
3. CDN 部署时只需保持相对路径结构一致
