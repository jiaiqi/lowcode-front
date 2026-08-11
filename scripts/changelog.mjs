#!/usr/bin/env node
/**
 * CHANGELOG.md 生成器（基于 Conventional Commits）
 *
 * 用法：
 *   node scripts/changelog.mjs                 # 生成"上次 tag → HEAD"的变更，更新 [Unreleased] 区
 *   node scripts/changelog.mjs --from v0.1.0   # 指定起始 ref
 *   node scripts/changelog.mjs --to <sha>      # 指定结束 ref
 *   node scripts/changelog.mjs --json          # 同时输出 public/changelog.json（应用内升级日志数据源）
 *
 * 说明：
 * - 依赖 commitlint 已强制的 Conventional Commits 提交规范（type(scope): subject）
 * - [Unreleased] 区的"手动补充"内容保留；自动生成的变更按 type 分组、scope 标注、
 *   附加文件清单（basename + 增删行数）
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHANGELOG_PATH = path.join(ROOT, "CHANGELOG.md");
const JSON_PATH = path.join(ROOT, "public", "changelog.json");

const TYPE_ORDER = ["feat", "fix", "perf", "refactor", "style", "docs", "test", "chore", "revert"];
const TYPE_TITLE = {
  feat: "新功能",
  fix: "修复",
  perf: "性能",
  refactor: "重构",
  style: "样式",
  docs: "文档",
  test: "测试",
  chore: "工程",
  revert: "回滚",
};
const COMMIT_RE = /^(\w+)(?:\(([^)]+)\))?:\s*(.+)$/;

function git(cmd) {
  // Windows 下 node execSync 用 cmd.exe，shell 重定向(2>/dev/null)无效，
  // 用 stdio 抑制 stderr 代替
  return execSync(cmd, {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
    stdio: ["pipe", "pipe", "ignore"],
  }).trim();
}

/** 解析命令行参数 */
function parseArgs() {
  const args = process.argv.slice(2);
  const get = (name) => {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : undefined;
  };
  return {
    from: get("--from"),
    to: get("--to") || "HEAD",
    json: args.includes("--json"),
    silent: args.includes("--silent"),
  };
}

/** 最近一个 tag（无则 null） */
function lastTag() {
  try {
    return git("git describe --tags --abbrev=0 2>/dev/null") || null;
  } catch {
    return null;
  }
}

/** 获取提交列表并解析 Conventional Commits */
function getCommits(from, to) {
  const range = from ? `${from}..${to}` : "";
  const log = git(`git log --pretty=format:"%H|%s|%an|%ad" --date=short ${range}`);
  return log
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [hash, subject, author, date] = line.split("|");
      const m = subject.match(COMMIT_RE);
      if (!m) return null;
      return {
        hash: hash.slice(0, 7),
        subject,
        author,
        date,
        type: m[1],
        scope: m[2] || "",
        desc: m[3],
      };
    })
    .filter(Boolean)
    .filter((c) => TYPE_TITLE[c.type]); // 仅规范提交
}

/** 获取提交的文件清单（basename + 增删行数） */
function getFiles(hash) {
  try {
    const stat = git(`git show --stat --format= ${hash}`);
    return stat
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => /\|/.test(l) && !l.includes("file(s) changed"))
      .map((l) => {
        const [file, changes] = l.split("|").map((s) => s.trim());
        const basename = path.basename(file);
        const delta = changes.match(/(\d+) \+(\d+) -(\d+)/);
        return delta ? `${basename}(+${delta[2]}/-${delta[3]})` : basename;
      });
  } catch {
    return [];
  }
}

/** 文件清单摘要（最多 6 个，超出显示总数） */
function filesSummary(files) {
  if (!files.length) return "";
  const shown = files.slice(0, 6).join(", ");
  const extra = files.length > 6 ? ` 等 ${files.length} 个文件` : "";
  return `files: ${shown}${extra}`;
}

/** 按 type 分组的 markdown */
function groupMarkdown(commits) {
  const groups = {};
  for (const c of commits) {
    (groups[c.type] ||= []).push(c);
  }
  const lines = [];
  for (const type of TYPE_ORDER) {
    const list = groups[type];
    if (!list?.length) continue;
    lines.push(`### ${TYPE_TITLE[type]}`);
    for (const c of list) {
      const scope = c.scope ? `**${c.scope}**: ` : "";
      lines.push(`- ${scope}${c.desc}（${c.filesSummary}）`);
    }
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

/**
 * 生成指定范围的 changelog 块（版本标题 + 分组内容）
 * @returns {{version: string|null, date: string, body: string}}
 */
export function generateRange(from, to, version) {
  const commits = getCommits(from, to).map((c) => ({ ...c, filesSummary: filesSummary(getFiles(c.hash)) }));
  const date = new Date().toISOString().slice(0, 10);
  const body = groupMarkdown(commits);
  return { version: version || null, date, body, count: commits.length };
}

/**
 * 更新 CHANGELOG.md：
 * - 保留 [Unreleased] 手动补充区
 * - 生成的新变更插入 [Unreleased] 区（自动部分）
 * @param {string} body - 分组后的变更内容
 * @param {string|null} version - 发布版本（固化 Unreleased 到新版本）
 */
export function updateChangelog(body, version) {
  const today = new Date().toISOString().slice(0, 10);
  let changelog = existsSync(CHANGELOG_PATH) ? readFileSync(CHANGELOG_PATH, "utf8") : "";

  const header = `# Changelog\n\n本项目所有重要变更均记录于此。格式基于 [Conventional Commits](https://www.conventionalcommits.org/)，由 \`scripts/changelog.mjs\` 自动生成；\`[Unreleased]\` 区可手动补充发布说明。\n\n`;

  if (version) {
    // 发布模式：生成新版本块，插在 [Unreleased] 之后
    const block = `## [${version}] - ${today}\n\n${body || "_无规范提交_"}  \n`;
    if (changelog.includes("## [Unreleased]")) {
      // Unreleased 区的手动补充固化到新版本块顶部，清空 Unreleased
      const unreleasedMatch = changelog.match(/## \[Unreleased\][\s\S]*?(?=\n## \[|$)/);
      if (unreleasedMatch) {
        const manual = unreleasedMatch[0]
          .replace(/^## \[Unreleased\]\s*/, "")
          .replace(/### 手动补充\s*/, "")
          .trim();
        const manualBlock = manual ? `\n### 手动补充\n${manual}\n` : "";
        const newBlock = `## [Unreleased]\n\n## [${version}] - ${today}\n${manualBlock}\n${body || "_无规范提交_"}  \n`;
        changelog = changelog.replace(unreleasedMatch[0], newBlock);
      }
    } else {
      changelog = header + `## [Unreleased]\n\n## [${version}] - ${today}\n${body || "_无规范提交_"}  \n` + changelog.replace(/^# Changelog.*?\n\n/s, "");
    }
  } else {
    // 更新模式：替换 [Unreleased] 区的自动部分（保留手动补充）
    if (changelog.includes("## [Unreleased]")) {
      changelog = changelog.replace(
        /## \[Unreleased\][\s\S]*?(?=\n## \[|$)/,
        `## [Unreleased]\n\n### 手动补充\n（发布前在此补充说明、升级注意事项）\n\n${body}`
      );
    } else {
      changelog = header + `## [Unreleased]\n\n### 手动补充\n（发布前在此补充说明、升级注意事项）\n\n${body}\n` + changelog.replace(/^# Changelog.*?\n\n/s, "");
    }
  }

  writeFileSync(CHANGELOG_PATH, changelog, "utf8");
  return changelog;
}

/** 生成 public/changelog.json（应用内升级日志数据源） */
export function writeChangelogJson() {
  const changelog = existsSync(CHANGELOG_PATH) ? readFileSync(CHANGELOG_PATH, "utf8") : "";
  // 解析版本块 → JSON（最近 6 个版本）
  const blocks = [];
  const re = /## \[([^\]]+)\]\s*-\s*([\d-]+)([\s\S]*?)(?=\n## \[|$)/g;
  let m;
  while ((m = re.exec(changelog)) && blocks.length < 6) {
    const body = m[3].trim();
    const items = body
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.startsWith("- "))
      .map((l) => l.replace(/^- /, ""));
    if (m[1] !== "Unreleased") {
      blocks.push({ version: m[1], date: m[2], items });
    }
  }
  writeFileSync(JSON_PATH, JSON.stringify({ updatedAt: new Date().toISOString().slice(0, 10), versions: blocks }, null, 2), "utf8");
}

/** CLI 入口 */
function main() {
  const { from, to, json, silent } = parseArgs();
  const fromRef = from || lastTag();
  const { body, count } = generateRange(fromRef, to);
  if (!silent) {
    console.log(`范围: ${fromRef ? fromRef + ".." : "（全量）"}${to} | 规范提交: ${count} 个`);
    if (body) console.log(body.slice(0, 600));
  }
  updateChangelog(body, null);
  if (json) writeChangelogJson();
  if (!silent) console.log("已更新 CHANGELOG.md");
}

// 被 import 时不执行 CLI
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
