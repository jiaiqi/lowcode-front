<template>
  <div class="changelog-page">
    <div class="changelog-header">
      <h1 class="changelog-title">升级日志</h1>
      <p class="changelog-sub">版本更新记录 · 最近 {{ versions.length }} 个版本</p>
    </div>

    <div class="changelog-list" v-if="versions.length">
      <section
        class="version-block"
        v-for="(ver, i) in versions"
        :key="ver.version"
      >
        <header class="version-head">
          <span class="version-tag">v{{ ver.version }}</span>
          <span class="version-date">{{ ver.date }}</span>
          <span class="version-new" v-if="i === 0">最新</span>
        </header>
        <ul class="version-items">
          <li v-for="(item, j) in ver.items" :key="j">{{ item }}</li>
        </ul>
      </section>
    </div>

    <div class="changelog-empty" v-else>
      <p>暂无版本记录</p>
    </div>
  </div>
</template>

<script>
export default {
  name: "ChangelogPage",
  data() {
    return { versions: [] };
  },
  created() {
    fetch("/changelog.json")
      .then((r) => r.json())
      .then((data) => {
        this.versions = Array.isArray(data?.versions) ? data.versions : [];
      })
      .catch(() => {
        this.versions = [];
      });
  },
};
</script>

<style lang="scss" scoped>
.changelog-page {
  max-width: 760px;
  margin: 0 auto;
  padding: 40px 24px 80px;
  font-size: 14px;
  color: #4a5568;
}

.changelog-header {
  margin-bottom: 32px;
}

.changelog-title {
  font-size: 24px;
  font-weight: 500;
  color: #2d3748;
  margin: 0 0 8px;
}

.changelog-sub {
  font-size: 13px;
  color: #a0aec0;
  margin: 0;
}

.version-block {
  margin-bottom: 28px;
}

.version-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #edf2f7;
}

.version-tag {
  font-size: 15px;
  font-weight: 600;
  color: #2d3748;
}

.version-date {
  font-size: 12px;
  color: #a0aec0;
}

.version-new {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 10px;
  background: rgba(126, 166, 242, 0.12);
  color: #7ea6f2;
}

.version-items {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
}

.version-items li {
  position: relative;
  padding: 5px 0 5px 16px;
  line-height: 1.7;
  word-break: break-all;
}

.version-items li::before {
  content: "";
  position: absolute;
  left: 2px;
  top: 13px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #cbd5e0;
}

.changelog-empty {
  text-align: center;
  padding: 60px 0;
  color: #a0aec0;
}
</style>
