# 协作开发指南（3-5 人小团队）

## 分支模型（简化 Git Flow）

```
master（主分支，始终可部署）
  └── feat/xxx / fix/xxx（功能/修复分支，从 master 切出）
        └── 完成后合并回 master（MR/PR + CI 通过）
```

| 分支              | 用途                              | 合并方式          |
| ----------------- | --------------------------------- | ----------------- |
| `master`          | 生产可部署分支                    | 仅通过 MR/PR 合并 |
| `feat/<简短描述>` | 新功能（如 `feat/offline-icons`） | MR → master       |
| `fix/<简短描述>`  | Bug 修复（如 `fix/nav-jump`）     | MR → master       |
| `docs/<简短描述>` | 文档变更（可直推 master）         | 直推或 MR         |

**约定**：

- 分支名小写 kebab-case；一个分支只做一个逻辑变更
- 合并 MR 前必须通过 CI（lint + build）
- 不在 master 直接开发（文档类小改动除外）

## 提交规范（Conventional Commits）

```
<type>(<scope>): <subject>

- body 小项用 "- " 无序列表
- 例：fix(nav): 站内导航改为 $router.push（SPA 无刷新）
```

**type 类型**：

| type       | 含义                    |
| ---------- | ----------------------- |
| `feat`     | 新功能                  |
| `fix`      | Bug 修复                |
| `perf`     | 性能优化                |
| `refactor` | 重构（不改功能）        |
| `style`    | 样式/格式（无逻辑变化） |
| `docs`     | 文档                    |
| `test`     | 测试                    |
| `chore`    | 构建/工具/依赖          |
| `revert`   | 回滚                    |

由 **commitlint + husky** 强制校验（提交信息不合规会被拒绝）。

## 本地开发环境

```bash
pnpm install          # 安装依赖
pnpm dev              # 开发服务 http://localhost:8088
pnpm lint             # 全量 lint（渐进清理，warn 不阻塞）
pnpm lint:fix         # 自动修复
pnpm format           # prettier 格式化
pnpm build            # 生产构建
```

**环境切换**：见 README（`?env=xxx` / sessionStorage / `.env` 三级切换，默认 parkDev）。

## 提交前自动检查（husky）

| Hook         | 作用                                                                |
| ------------ | ------------------------------------------------------------------- |
| `pre-commit` | lint-staged：对暂存文件执行 eslint --fix + prettier（自动修复格式） |
| `commit-msg` | commitlint：校验提交信息格式                                        |

提交时格式问题会被自动修复；无法自动修复的（如 `no-console` warn）需要手动处理。

## 代码规范要点

- **禁 `console.log`**（允许 `console.error/warn`）——调试残留会污染控制台
- **禁 `var`**，用 `let/const`；优先 `const`
- **强制 `===`**（`null` 除外）
- **v-for 必须有 `:key`**（低代码组件已知痛点，渐进补齐）
- **格式化统一**：prettier（2 空格、单引号、100 列）——提交时自动格式化
- 历史代码遗留问题（如 console.log 残留）：改到哪个文件顺手清哪个，不批量重构

## MR/PR 流程

1. 从 master 切分支：`git checkout -b feat/xxx`
2. 小步提交（一个逻辑一个 commit）
3. 推送到远程：`git push origin feat/xxx`
4. 创建 MR/PR（title 用提交规范格式）
5. CI 通过后合并回 master

## 目录约定（防止冲突）

- `src/pages/lowcode/widgets/`：业务组件（**多人并行时按组件目录认领**，避免同文件并发）
- `src/pages/lowcode/common/`：引擎公共工具（改动需知会他人）
- `scripts/`：开发/验证脚本（Playwright 对比等）

## 文档

- `docs/ARCHITECTURE.md`：架构说明（改架构先更新）
- `docs/PERFORMANCE.md`：性能方案与基线（含已验证不可行的方案，避免重复尝试）
- `docs/DEPLOYMENT.md`：部署方案
