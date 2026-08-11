/** ESLint 配置（Vue 2.7 + Vite）——小团队协作规范，渐进式启用 */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  extends: [
    "eslint:recommended",
    "plugin:vue/recommended", // Vue 2 推荐规则（eslint-plugin-vue 9）
    "prettier", // 关闭与 prettier 冲突的格式规则
  ],
  rules: {
    // ===== 团队规范（error） =====
    "no-console": ["warn", { allow: ["error", "warn"] }], // 禁 console.log（允许 error/warn）
    "no-debugger": "error",
    eqeqeq: ["error", "always", { null: "ignore" }], // 强制 ===（null 除外）
    curly: ["error", "multi-line"], // 大括号风格
    "no-unused-vars": ["warn", { args: "none" }], // 未使用变量（先 warn 渐进清理）
    "no-duplicate-imports": "error",
    "no-var": "error", // 禁 var，用 let/const
    "prefer-const": "warn",
    "prefer-template": "warn", // 字符串拼接用模板串

    // ===== Vue 规范 =====
    "vue/require-v-for-key": "warn", // v-for 必须 key（已知痛点，渐进补齐）
    "vue/no-unused-components": "warn",
    "vue/multi-word-component-names": "off", // 低代码组件名风格，关闭
    "vue/singleline-html-element-content-newline": "off",
    "vue/max-attributes-per-line": "off",
    "vue/html-self-closing": "off",
    "vue/html-indent": "off", // 交给 prettier
  },
  ignorePatterns: [
    "dist/",
    "node_modules/",
    "public/",
    "src/pages/low-app/", // 遗留不维护
    "scripts/",
  ],
};
