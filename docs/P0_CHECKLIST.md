# P0 开工清单（feat/nuxt-p0）

> 关联：`docs/NUXT_MIGRATION_PLAN.md` §10 P0；分支：`feat/nuxt-p0`（从 master 拉出，完成后 PR 评审合入）
> 目标：monorepo 骨架 + 规范体系 + CI 流水线 + git-cliff 升级日志骨架，**且旧工程完全不受影响**

---

## 0. P0 目标与出口标准

| #   | 出口标准（全部满足才算 P0 完成）                                      | 验证方式                              |
| --- | --------------------------------------------------------------------- | ------------------------------------- |
| E1  | 根 `pnpm install` 成功，**旧工程 `pnpm dev` / `pnpm build` 回归正常** | 本地跑通；lockfile 中旧依赖版本无变化 |
| E2  | `apps/web` Nuxt 4 dev 服务可启动（页面可访问）                        | 浏览器打开 `http://localhost:3000`    |
| E3  | 全仓 `pnpm lint:all` 通过（新代码零 error）                           | CI + 本地                             |
| E4  | 全仓 `pnpm typecheck:all` 通过                                        | CI + 本地                             |
| E5  | `pnpm test:all`（Vitest 冒烟）通过                                    | CI + 本地                             |
| E6  | 新工程 `pnpm build:web` 成功（Nuxt build 产物生成）                   | CI + 本地                             |
| E7  | Gitee Go 流水线跑通（PR 显示绿色）                                    | Gitee Go 控制台                       |
| E8  | commitlint + lint-staged 对新文件类型（.ts/.vue/.mjs）生效            | 故意违规提交被拦截                    |
| E9  | `pnpm changelog` 能从现有 commits 生成 `docs/CHANGELOG.md`            | 产物含旧工程历史提交分组              |
| E10 | `@lowcode/shared` 协议种子类型编译通过                                | typecheck                             |

## 1. 准备工作（先摸底，别急着建文件）

- [ ] 摸清现有规范设施：`git config core.hooksPath`、`.husky/` 是否存在、`package.json` 中 husky/lint-staged/commitlint 配置位置（旧工程 commit 时 hooks 在跑，必须找到载体）
- [ ] 记录 `.npmrc`、`.gitignore` 现有内容（P0 在其上补充，不破坏）
- [ ] 确认构建机/CI Node 版本 ≥ 20.19（建议 22 LTS）；新增 `.nvmrc`（内容 `22`）
- [ ] 本地确认 `git status` 干净，`master` 为最新

## 2. 执行步骤（每步含验证点）

### 步骤 1：分支与环境

```bash
git checkout master && git pull
git checkout -b feat/nuxt-p0
```

### 步骤 2：workspace 骨架（旧工程保持原位）

- 新建 `pnpm-workspace.yaml`：
  ```yaml
  packages:
    - "apps/*"
    - "packages/*"
  ```
- **根 `package.json` 原样保留**（旧工程 manifest，`dev`/`build`/`preview` 等旧脚本不动）；仅**追加**编排脚本（命名避开旧脚本，防止覆盖）：
  ```json
  "scripts": {
    "lint:all": "pnpm -r lint",
    "typecheck:all": "pnpm -r typecheck",
    "test:all": "pnpm -r test",
    "build:web": "pnpm --filter @lowcode/web build",
    "changelog": "git-cliff -o docs/CHANGELOG.md",
    "changelog:json": "git-cliff -o apps/web/public/changelog.json"
  }
  ```
- 补充 `.gitignore`：`.output/`、`.nuxt/`、`.nitro/`、`coverage/`、`*.tsbuildinfo`、`.eslintcache`
- 新建 `.nvmrc`（`22`）
- **验证**：`pnpm install` → 旧工程 `pnpm dev`（vite 8088 起来）→ `pnpm build`（dist 生成）。检查 `git diff pnpm-lock.yaml` 确认旧依赖版本号无变化（lockfile 结构变化正常，版本变化=异常）

### 步骤 3：TS 骨架

- 根 `tsconfig.json`（solution style）：
  ```json
  {
    "files": [],
    "references": [
      { "path": "./packages/shared" },
      { "path": "./packages/runtime" },
      { "path": "./packages/runtime-ui" },
      { "path": "./packages/widgets" },
      { "path": "./packages/studio" },
      { "path": "./apps/web" }
    ]
  }
  ```
- `tsconfig.base.json`：strict、ES2022、moduleResolution bundler、paths 别名 `@lowcode/*`
- 各包 `tsconfig.json`：extends base + composite
- **验证**：`tsc -b` 空跑通过（P0 阶段各包有占位文件）

### 步骤 4：包骨架（P1 起填充，P0 只建壳）

每个包：`package.json` + `tsconfig.json` + `src/index.ts`（占位导出）

| 包                  | 包名                  | 依赖（P0 阶段） | 占位内容                                                                                           |
| ------------------- | --------------------- | --------------- | -------------------------------------------------------------------------------------------------- |
| packages/shared     | `@lowcode/shared`     | 无（零依赖）    | **协议种子类型**：`PageConfig`/`ComponentNode`/`schemaVersion` 常量/后端契约常量 + vitest 冒烟测试 |
| packages/runtime    | `@lowcode/runtime`    | shared          | 空导出                                                                                             |
| packages/runtime-ui | `@lowcode/runtime-ui` | shared          | 空导出                                                                                             |
| packages/widgets    | `@lowcode/widgets`    | shared          | 空导出                                                                                             |
| packages/studio     | `@lowcode/studio`     | shared          | 空导出                                                                                             |

- 包内 `package.json` 关键字段：`"type": "module"`、`"exports"`、`"scripts": { "lint": "...", "typecheck": "vue-tsc --noEmit || tsc --noEmit", "test": "vitest run" }`
- **验证**：`pnpm --filter @lowcode/shared test` 通过

### 步骤 5：apps/web（Nuxt 4 应用骨架）

- 用官方脚手架生成标准 Nuxt 4 骨架后移入（比手写可靠）：
  ```bash
  pnpm dlx nuxi@latest init apps/web-tmp --packageManager pnpm
  # 移入 apps/web，删除生成器的 git 初始化和多余文件
  ```
- 裁剪为最小骨架：`nuxt.config.ts`（清空演示模块）、`app/app.vue`（占位页）、`app/pages/index.vue`（占位）、`app/plugins/.gitkeep`、`server/` 占位
- `nuxt.config.ts` 预埋（P7 前可全注释，仅留基础）：
  ```ts
  export default defineNuxtConfig({
    // routeRules 混合渲染（§4.1）——P7 前可只留基础，此处预埋注释说明
    ssr: true, // Nuxt 4 默认，P3 起按 §4.1 配置 routeRules
  });
  ```
- 包名 `@lowcode/web`，scripts：`dev`/`build`/`preview`/`lint`/`typecheck`
- **验证**：`pnpm --filter @lowcode/web dev` 页面可访问；`build` 成功

### 步骤 6：规范体系（在步骤 1 摸底结果上扩展）

- **ESLint**（flat config，`eslint.config.mjs` 在根）：typescript-eslint + eslint-plugin-vue（vue3 推荐集）+ eslint-config-prettier；ignore 排除 `legacy` 旧工程目录（旧工程维持现有 lint 现状，不强迁移）
- **Prettier**：`.prettierrc` + `.prettierignore`（忽略旧工程 src、dist、pnpm-lock.yaml）
- **commitlint**：扩展现有配置（或新建），scope 允许值加入 `shared/runtime/runtime-ui/widgets/studio/web`（组件目录 scope）
- **husky + lint-staged**：在现有 hooks 上扩展 lint-staged 匹配 `*.{ts,vue,mjs,cjs}`（执行 eslint --fix + prettier --write）
- **验证**：故意提交一个 lint 违规文件 → 被 pre-commit 拦截；commit-msg 违规 → 被拦截

### 步骤 7：git-cliff 升级日志骨架（F21a）

- 新建 `cliff.toml`：conventional commits 解析、按 tag 分组、scope 分类、`--with-commit-file-changes`（文件清单）
- 双产物：`docs/CHANGELOG.md`（完整）+ `apps/web/public/changelog.json`（精简模板）
- 根 scripts 已加 `changelog`/`changelog:json`（步骤 2）
- **验证**：`pnpm changelog` 生成包含旧工程历史 commit 的 CHANGELOG.md

### 步骤 8：CI 流水线（Gitee Go 为主，兼容 GitHub Actions）

- `.github/workflows/ci.yml`（GitHub Actions 语法，**一套为准**）：
  ```yaml
  name: ci
  on: { push: { branches: [master] }, pull_request: {} }
  jobs:
    ci:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: pnpm/action-setup@v4 # 版本取 package.json packageManager
        - uses: actions/setup-node@v4
          with: { node-version: 22, cache: pnpm }
        - run: pnpm install --frozen-lockfile
        - run: pnpm lint:all
        - run: pnpm typecheck:all
        - run: pnpm test:all
        - run: pnpm build:web # 新工程构建
  ```
  （golden 视觉回归在 P2 追加 job；旧工程构建暂不进 CI，P7 前旧工程维持现状发布）
- **Gitee Go 兼容**：执行时确认 Gitee Go 2.0 对 `.github/workflows` 的识别方式——直接识别则无需额外文件；否则复制一份到 `.gitee/workflows/ci.yml`（同一内容）
- **验证**：推分支 → 开 PR → Gitee Go 跑绿

### 步骤 9：团队规范文档

- 新建 `docs/CONTRIBUTING.md`：分支模型（GitHub Flow）、提交规范（conventional + body 文件说明，见 §9.5 示例）、PR 流程、目录职责（§3 包表）、lint/test 命令速查
- 新建 `docs/ARCHITECTURE.md`（新工程版）：monorepo 结构图 + 包边界 + 关键决策指针（ADR 0001/0002）

### 步骤 10：验收与收尾

- 按 §0 出口标准逐项核销（E1-E10）
- `git add -A && git commit -m "feat(web): nuxt4 monorepo 骨架与规范体系（P0）"`（body 按 §9.5 格式列文件）
- 推送 → 创建 PR（模板：改动摘要、出口核销表勾选、风险说明）→ 评审 → 合入 master

## 3. 文件清单总表

| 路径                                                   | 用途                                     |
| ------------------------------------------------------ | ---------------------------------------- |
| `pnpm-workspace.yaml`                                  | workspace 声明（apps/_、packages/_）     |
| `package.json`（根）                                   | 旧工程 manifest 原样 + 追加编排 scripts  |
| `tsconfig.json` / `tsconfig.base.json`                 | TS solution 引用 + 公共严格配置          |
| `.nvmrc`                                               | Node 22 固定                             |
| `.gitignore`（补充）                                   | .output/.nuxt/coverage 等                |
| `eslint.config.mjs`                                    | 全仓 ESLint flat config（忽略旧工程）    |
| `.prettierrc` / `.prettierignore`                      | 格式统一                                 |
| `commitlint.config.*`（扩展）                          | scope 含新包名                           |
| `.husky/*`、lint-staged 配置（扩展）                   | pre-commit/commit-msg 钩子覆盖新文件类型 |
| `cliff.toml`                                           | git-cliff 配置（文件清单/scope 分类）    |
| `.github/workflows/ci.yml` + `.gitee/workflows/`       | CI（一套语法双平台）                     |
| `packages/{shared,runtime,runtime-ui,widgets,studio}/` | 五个包骨架（shared 含协议种子类型）      |
| `apps/web/`                                            | Nuxt 4 应用骨架（nuxi init 生成后裁剪）  |
| `docs/CHANGELOG.md`                                    | git-cliff 首次生成（F21a 产物）          |
| `docs/CONTRIBUTING.md`                                 | 团队协作规范（分支/提交/PR）             |
| `docs/ARCHITECTURE.md`                                 | 新工程架构文档                           |
| `docs/P0_CHECKLIST.md`                                 | 本清单（核销后归档）                     |

## 4. P0 明确不做（边界，防止蔓延）

- ❌ 不搬旧工程进 `legacy/`（推迟到 P7 收尾）
- ❌ 不动旧工程 `src/` 任何文件、不改旧 vite 配置
- ❌ 不写引擎/widgets/studio 业务代码（P1 起）
- ❌ 不做 golden 用例与基线（P2）
- ❌ 不配置 routeRules 混合渲染细节（P3 起，P0 仅预埋注释）
- ❌ 不做应用内 `/changelog` 页（P4，F21b）
- ❌ 不引入 naive-ui（P4 studio 阶段）

## 5. 风险与注意事项

| 风险                                                | 对策                                                                                       |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| pnpm workspace 引入后旧工程构建异常（依赖提升变化） | E1 回归验证；lockfile diff 检查版本；若异常退路为旧工程移入 `apps/legacy/`（git mv，安全） |
| 根 package.json 脚本命名与旧工程冲突                | 编排脚本统一 `xxx:all` 后缀，旧 `dev/build/preview` 原义保留                               |
| 旧工程 hooks 机制位置不明（husky 载体未找到）       | 步骤 1 先摸底，找到后在其上扩展；找不到则 P0 重建一套（.husky + commitlint + lint-staged） |
| ESLint flat config 误伤旧工程代码                   | ignore 显式排除旧工程目录；新规则只对新目录生效                                            |
| nuxi init 生成器版本/交互问题                       | 用 `pnpm dlx nuxi@latest init`；生成后裁剪演示代码；若交互阻塞改用模板手动写最小骨架       |
| Gitee Go 识别 `.github/workflows` 方式不确定        | 步骤 8 执行时实测：直接识别或复制 `.gitee/workflows`，两种都验证                           |
| Nuxt 4 首次启动慢/依赖大                            | 正常，CI 缓存 pnpm store（actions/cache 已含）                                             |

## 6. 完成后

- 合入 master 后，新会话启动 **feat/nuxt-p1**：runtime 引擎 + runtime-ui 基础组件（token 提取）
- 本清单标记完成状态，保留在 docs/ 供后续里程碑参考
