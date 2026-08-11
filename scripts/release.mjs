#!/usr/bin/env node
/**
 * 一键发布：bump version → 固化 CHANGELOG → git tag
 *
 * 用法：
 *   node scripts/release.mjs                  # 自动推断版本（feat→minor，fix/perf→patch）
 *   node scripts/release.mjs --version 0.3.0  # 指定版本
 *   node scripts/release.mjs --major          # 强制 major
 *   node scripts/release.mjs --dry-run        # 只预览不执行
 *
 * 版本推断：自上次 tag 起，有 feat → minor；否则有 fix/perf → patch；否则 patch
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { generateRange, updateChangelog, writeChangelogJson } from "./changelog.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PKG_PATH = path.join(ROOT, "package.json");

function git(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: "utf8" }).trim();
}

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (name) => {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : undefined;
  };
  return { version: get("--version"), major: args.includes("--major"), dryRun: args.includes("--dry-run") };
}

function lastTag() {
  try {
    return git("git describe --tags --abbrev=0 2>/dev/null") || null;
  } catch {
    return null;
  }
}

function nextVersion(current, { hasFeat, hasFix, forceMajor }) {
  const [major, minor, patch] = current.split(".").map(Number);
  if (forceMajor) return `${major + 1}.0.0`;
  if (hasFeat) return `${major}.${minor + 1}.0`;
  if (hasFix) return `${major}.${minor}.${patch + 1}`;
  return `${major}.${minor}.${patch + 1}`;
}

function main() {
  const { version: explicitVersion, major, dryRun } = parseArgs();
  const pkg = JSON.parse(readFileSync(PKG_PATH, "utf8"));
  const current = pkg.version;
  const tag = lastTag();

  // 分析上次 tag 后的提交类型
  const range = tag ? `${tag}..HEAD` : "";
  const log = git(`git log --pretty=format:"%s" ${range}`);
  const hasFeat = /^feat(\(|:)/m.test(log);
  const hasFix = /^fix(\(|:)/m.test(log) || /^perf(\(|:)/m.test(log);

  const version = explicitVersion || nextVersion(current, { hasFeat, hasFix, forceMajor: major });

  console.log(`当前版本: v${current} → 发布版本: v${version}`);
  console.log(`范围: ${tag ? tag + "..HEAD" : "全量"} | feat: ${hasFeat} | fix/perf: ${hasFix}`);

  if (dryRun) {
    console.log("[dry-run] 不执行变更");
    return;
  }

  // 1) bump package.json version
  pkg.version = version;
  writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + "\n", "utf8");

  // 2) 固化 CHANGELOG（生成该版本块并清空 Unreleased 手动区）
  const { body, count } = generateRange(tag, "HEAD", version);
  updateChangelog(body, version);
  writeChangelogJson();

  // 3) git commit + tag
  const files = [PKG_PATH, "CHANGELOG.md", path.join(ROOT, "public", "changelog.json")]
    .map((f) => path.relative(ROOT, f))
    .join(" ");
  execSync(`git add ${files}`, { cwd: ROOT, stdio: "pipe" });
  execSync(`git commit -m "chore(release): v${version}（${count} 个变更）"`, { cwd: ROOT, stdio: "pipe" });
  execSync(`git tag v${version}`, { cwd: ROOT, stdio: "pipe" });

  console.log(`✅ 发布完成: v${version}`);
  console.log(`   提交: chore(release): v${version}`);
  console.log(`   Tag:  v${version}`);
  console.log(`   下一步: git push origin master --tags`);
}

main();
