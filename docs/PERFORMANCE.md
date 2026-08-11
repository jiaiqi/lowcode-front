# 性能优化方案与验收

## 已实现（按优化批次）

| 优化项 | 说明 | 实测效果 |
|---|---|---|
| Vite 构建 | webpack4 → Vite5，`manualChunks` 拆分渲染/编辑器/echarts/iconify | 构建快 3-10 倍，dev 秒级启动 |
| 渲染一致性 | tailwind preflight + utilities 全局样式、marquee 全局化 | 首页与旧工程 14/14 指标一致 |
| 图标方案重构 | unocss presetIcons 静态内联 + icon-store 本地集合（**完全离线**） | iconify chunk 2.3MB → **19kB** |
| 构建产物修复 | Vue 统一 ESM + vue 生态自包含 chunk | 消除循环依赖/TDZ 生产报错 |
| IndexedDB SWR | schema + app 配置落 IndexedDB（`utils/snapshot-db.js`，纯 JS 零 Vue 依赖） | 刷新加载 1.62s → **0.57s** |
| 图片懒加载 | 内容图片 `loading="lazy"`（轮播/导航保持 eager） | 首屏图片 53 → **29 张** |
| 死代码清理 | import 图分析 + 构建兜底验证 | 删除 59 文件（-20,138 行） |
| 双副本收敛 | widgets/vendor 合并为单目录，vendor 整体删除 | 维护成本大幅下降 |
| 站内导航 SPA | `location.href` → `$router.push` / router-link（a 标签） | 导航不再整页刷新，命中 SWR 秒开 |
| Object.freeze | 只读 `*_json_data` 深度冻结 | 减少响应式依赖收集开销 |
| sass 警告清理 | `api: modern-compiler` + `@use` | dev 日志噪音 50KB → 0 |
| 跳转逻辑收敛 | `nav-jump.js` 统一 navTo/navToPath/登录拦截 | 消除 3 组件重复实现（-120 行） |

## 构建产物（当前基线）

| chunk | 体积 | gzip |
|---|---|---|
| vue-vendor（vue+element-ui+vue 生态） | 924 kB | 254 kB |
| vendor（axios/lodash 等） | 266 kB | 97 kB |
| page-item（业务组件） | 365 kB | 104 kB |
| view（渲染引擎） | 96 kB | 23 kB |
| echarts-vendor（异步，图表页才加载） | 756 kB | 294 kB |
| iconify（仅 @iconify 残留小模块） | 19 kB | 8 kB |
| 图标集合 JSON（ep/ri/mdi-light/material-symbols，按需 fetch） | — | 独立资源 |

**首屏 JS 总量约 2.0 MB（gzip ~500 kB）**；dev 首屏渲染 1.38s（本机 preview）。

## 已验证不可行的方案（避免重复尝试）

| 方案 | 结论 |
|---|---|
| element-ui 按需引入 | 子路径导入经 commonjs 转换后反而膨胀（1250kB > 全量 924kB），element-ui 2.x 全量 webpack bundle 为最优；按需需等 element-plus |
| 组件树拍平 | lc-container/lc-content 自带默认 flex/overflow 语义，"无样式"容器拍平会破坏 overflow 裁剪（实测 20px 横向溢出） |

## 后续可选优化（纯前端）

1. **导航 prefetch**：hover 导航目标页预取 schema（当前 SPA + SWR 已秒开，收益有限）
2. **代码级清理**：继续按 import 图裁剪未引用文件（现有 331 → 272 文件）
3. **Vue3/Nuxt 迁移**（建议单独立项）：结构障碍已清除（单组件目录、纯函数工具、composable 化）

## 后端配合（可选，非阻塞）

- schema 接口 ETag/304 + 图片 Cache-Control + Brotli（element-ui 重复代码多，Brotli 可再压 ~15%）
- BFF 单飞接口：schema + app 配置 + 首屏组件数据一次返回
- 发布期 SSG 预渲染官网页

## 验收清单

- [x] `pnpm build` 通过，产物含独立 chunk
- [x] `/`、`/site/:pageNo`、`/:pageNo` 渲染正常，与旧工程视觉一致
- [x] 首页/编辑器/移动端/卡片编辑器渲染正常
- [x] 图标（静态 unocss + 配置动态本地 SVG）离线可用，零外部请求
- [x] 站内导航 SPA 无刷新（router-link + $router.push）
- [x] 刷新页面秒开（IndexedDB SWR），站内切换命中内存缓存
- [ ] 组件类型全量走查：列表/详情/图表/地图/视频/表单(iframe)（部分完成）
