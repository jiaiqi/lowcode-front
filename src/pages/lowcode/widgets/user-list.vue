<template>
  <div class="user-list">
    <div class="normal-images">
      <div v-for="(img, index) in arrImages" v-if="index < 5">
        <img loading="lazy" v-if="img" :src="img" :style="resImagesFn(index)" class="image" />
      </div>
    </div>
    <span class="num-text" v-if="showUserNum"
      >{{ userNum }}+{{ pageItem.user_list_json.usercount_label }}</span
    >
    <span class="button" v-if="showButton" @click="toLogin">{{
      pageItem.user_list_json.button_type
    }}</span>
  </div>
</template>

<script>
import { formatStyleData } from "@/pages/lowcode/vendor/datav/common/index.js";
export default {
  name: "user-list",
  props: {
    pageItem: {
      type: Object,
    },
  },
  data() {
    return {
      listData: [],
      arrImages: [],
      userNum: 0,
    };
  },
  mounted() {
    let params = {};
    if (this.pageItem?.user_list_json?.userlist_srv_req_json) {
      params = this.pageItem.user_list_json.userlist_srv_req_json;
    }
    this.getUserListData(params);
  },
  computed: {
    showUserNum() {
      if (
        this.pageItem.user_list_json.parts_set &&
        this.pageItem.user_list_json.parts_set.length > 0
      ) {
        const arr = this.pageItem.user_list_json.parts_set;
        return arr.indexOf("用户数") > -1 ? true : false;
      }
    },
    showButton() {
      return true;
      // if (this.pageItem.user_list_json.parts_set && this.pageItem.user_list_json.parts_set.length > 0) {
      // 	const arr = this.pageItem.user_list_json.parts_set
      // 	return (arr.indexOf('登陆按钮') > -1) && (!uni.getStorageSync('isLogin')) ? true : false
      // }
    },
  },
  methods: {
    tagStylefn(style) {
      if (style) {
        return formatStyleData(style);
      }
    },
    resImagesFn(i) {
      return {
        left: 22 * i + "px",
        "z-index": this.arrImages.length - i,
      };
    },
    async getUserListData(p) {
      if (!p.serviceName || !p.mapp) return;

      const url = `/${p.mapp}/select/${p.serviceName}`;
      const req = {
        serviceName: p.serviceName,
        colNames: p.colNames,
      };
      const res = await this.$axios.post(url, req);
      if (
        res?.data?.state === "SUCCESS" &&
        Array.isArray(res?.data?.data) &&
        res?.data?.data.length > 0
      ) {
        this.listData = res.data.data;
        const key = this.pageItem.user_list_json.usercount_col;
        this.userNum = this.listData[0][key];
        this.arrImages = [];
        this.listData.forEach((item) => {
          if (item.title_lmage) {
            let str = this.getImagePath(item.title_lmage);
            this.arrImages.push(str);
          }
        });
      }
    },
    toLogin() {
      // uni.navigateTo({
      // 	url: '/pages/login/login'
      // })
    },
  },
};
</script>

<style scoped lang="scss">
.user-list {
  height: 54px;
  margin: 10px 12px 0;
  border-radius: 10px;
  background: #fff;
  padding: 0 16px 0 16px;

  .normal-images {
    position: relative;
    top: 10px;

    .image {
      width: 34px;
      height: 34px;
      position: absolute;
      border-radius: 50%;
      border: 2px solid #fff;
    }
  }

  .cuIcon-right {
    float: right;
    line-height: 50px;
  }

  .num-text {
    font-weight: bold;
    position: relative;
    top: 17px;
    left: 153px;
  }

  .button {
    font-size: 12px;
    width: 72px;
    height: 24px;
    line-height: 24px;
    color: #fff;
    border-radius: 12px;
    float: right;
    text-align: center;
    margin-top: 15px;
    background: #395bce;
  }
}
</style>
