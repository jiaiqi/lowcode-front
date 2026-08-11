/** Commitlint：提交信息规范（Conventional Commits） */
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "perf", "refactor", "style", "docs", "test", "chore", "revert"],
    ],
    "subject-min-length": [2, "always", 4],
    "header-max-length": [2, "always", 100],
  },
};
