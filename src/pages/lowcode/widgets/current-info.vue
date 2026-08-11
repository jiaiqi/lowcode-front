<template>
  <div class="welcome-box flex items-center">
    <img loading="lazy" class="avatar" :src="avatar" alt="" />
    <div v-if="logined" class="flex-1">
      <div class="user-name">{{ loginUser.real_name || "" }}</div>
      <div class="flex items-center handler justify-between">
        <div class="flex items-center handler">
          <span class="text-btn primary" @click="openChangePasswordDialog"
            >修改密码</span
          >
          <span class="">|</span>
          <span class="text-btn" @click="bindKey">绑定key</span>
          <span class="">|</span>
          <span class="text-btn primary" @click="toLogout">退出登录</span>
        </div>
        <!-- <div class="flex">
          <span class="text-btn primary" @click="toLogin">退出登录</span>
        </div> -->
      </div>
      <change-password-dialog ref="changePasswordDialog" />
    </div>
    <div v-else>
      <div class="user-name">未登录</div>
      <div class="flex items-center handler">
        <span class="text-btn primary" @click="toLogin">登录</span>
      </div>
    </div>
  </div>
</template>

<script>
import { formatStyleData } from "@/pages/lowcode/common/index.js";
import { mapGetters, mapActions } from "vuex";
import ChangePasswordDialog from "@/components/ui/change-password-dialog/change-password-dialog.vue";
export default {
  components: {
    ChangePasswordDialog,
  },
  props: {
    pageItem: {
      type: Object,
    },
  },
  data() {
    return {};
  },
  computed: {
    ...mapGetters("loginInfo", ["logined", "loginUser"]),
    avatar() {
      return (
        this.loginUser?.photo_url ||
        require("@/assets/image/user-img-default.png")
      );
    },
  },
  mounted() {},
  methods: {
    ...mapActions("loginInfo", ["initLoginInfo"]),
    toLogout() {
      this.$confirm("确认退出登录吗?", "提示", {
        confirmButtonText: "确认",
        cancelButtonText: "取消",
        type: "warning",
      }).then(() => {
        this.$store.dispatch("loginInfo/logout");
      });
    },
    toLogin() {
      if (process.env.NODE_ENV === "development") {
        return this.$loginRef?.open((res) => {
          console.log(res);
          if (res) {
            this.initLoginInfo(res);
          }
        });
      }
      const currentUrl = window.location.pathname + window.location.hash;
      sessionStorage.setItem("login_redirect_url", currentUrl);
      const loginUrl = window.location.origin + "/main/login.html";
      window.location.href = loginUrl;
    },
    bindKey() {
      this.$message.info("功能开发中...");
    },
    openChangePasswordDialog() {
      this.$refs.changePasswordDialog.open();
    },
  },
};
</script>

<style lang="scss" scoped>
.welcome-box {
  gap: 16px;
  width: 100%;
  .avatar {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    box-shadow: rgba(134, 156, 178, 0.2) 0px 1px 10px 0px;
    margin: 10px;
    border-style: solid;
    border-width: 4px;
    border-color: rgb(255, 255, 255);
    background-color: transparent;
  }
  .user-name {
    font-size: 20px;
    font-weight: 500;
    color: #303133;
  }
  .handler {
    gap: 8px;
  }
  .text-btn {
    font-size: 14px;
    cursor: pointer;
    &:hover {
      text-decoration: underline;
    }
    &.primary {
      color: var(--primary-color, #409eff);
    }
  }
}
</style>
