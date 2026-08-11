<template>
  <div
    class="notice-bar"
    v-if="pageItem.notice_bar_json && list && list.length"
  >
    <img loading="lazy"
      :src="getImagePath(pageItem.notice_bar_json.icon)"
      class="notice-icon"
      v-if="pageItem.notice_bar_json"
    />
    <el-alert
      :title="item"
      type="warning"
      v-for="item in list"
      :key="item"
    >
    </el-alert>
    <!-- <u-notice-bar class="notice-item" bg-color="#fff" color="#333" font-size="26" padding="9px 0 9px 30px" :mode="mode" :list="list"
			:volume-icon="false" :more-icon="showLinkIcon" :duration="duration" :speed="speed" :is-circular="false">
		</u-notice-bar> -->
  </div>
  <div
    class="notice-bar"
    v-else-if="pageItem && pageItem.com_label"
  >
    {{ pageItem.com_label }}
  </div>
</template>

<script>
export default {
  name: "notice-bar",
  props: {
    pageItem: {
      type: Object,
    },
  },
  data() {
    return {
      listData: [],
      duration: this.pageItem.notice_bar_json?.duration || 2000,
      speed: this.pageItem.notice_bar_json?.speed || 160,
      showLinkIcon: this.pageItem.notice_bar_json?.jump_json ? true : false,
    };
  },
  mounted() {
    let params = {};
    if (this.pageItem?.srv_req_json) {
      params = this.pageItem.srv_req_json;
    }
    this.getNoticeBarData(params);
  },
  computed: {
    list() {
      let arr = [];
      this.listData.forEach((item) => {
        if (item.title) arr.push(item.title);
      });
      return arr;
    },
    mode() {
      if (this.pageItem.notice_bar_json.direction === "横向") {
        return "horizontal";
      } else {
        return "vertical";
      }
    },
    linkTo(index) {
    },
  },
  methods: {
    async getNoticeBarData(p) {
      if (!p.serviceName || !p.mapp) {
        this.listData = this.pageItem?.notice_bar_json?.mock_data_json || [];
        if (!this.listData.length && this.pageItem.mock_data_json) {
          this.listData = JSON.parse(this.pageItem.mock_data_json);
        }
        return;
      }

      const url = `/${p.mapp}/select/${p.serviceName}`;
      const req = p;
      const res = await this.$axios.post(url, req);
      if (
        res?.data?.state === "SUCCESS" &&
        Array.isArray(res?.data?.data) &&
        res?.data?.data.length > 0
      ) {
        this.listData = res.data.data;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.notice-bar {
  position: relative;

  .notice-icon {
    width: 28px;
    height: 28px;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
  }

  .notice-item {
    font-weight: bold;
  }
}

::v-deep {
  .u-notice-bar {
    height: 100%;
  }
}
</style>