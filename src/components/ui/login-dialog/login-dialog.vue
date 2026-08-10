<template>
  <transition name="lock-screen-enter">
    <div v-if="dialogVisible" class="lock-screen-overlay" @click.self="handleClose">
      <div class="lock-screen" :class="{ 'show-form': true, 'tenant-select-mode': isTenantSelectMode }">
        <div class="bg-canvas">
          <canvas ref="bgCanvas"></canvas>
        </div>

        <template v-if="!isTenantSelectMode">
          <div class="login-container">
            <div class="time-section">
              <span class="time">{{ currentTime }}</span>
              <span class="date">{{ currentDate }}</span>
              <span class="weekday">{{ currentWeekday }}</span>
            </div>
            <div class="login-expired">登录过期或未登录，请重新登录</div>

            <div class="login-card">
              <div class="login-header">
                <div class="user-avatar" @click="focusUsername">
                  <img v-if="avatarUrl" :src="avatarUrl" alt="avatar" />
                  <i v-else class="el-icon-user-solid"></i>
                </div>
                <div class="username-display">{{ loginForm.username || '点击输入用户名' }}</div>
              </div>
              
              <div class="login-form">
                <div class="form-group">
                  <el-input
                    v-model="loginForm.username"
                    placeholder="用户名"
                    prefix-icon="el-icon-user"
                    clearable
                    @focus="inputFocused = 'username'"
                    @blur="inputFocused = ''"
                    class="login-input"
                  ></el-input>
                </div>
                
                <div class="form-group">
                  <el-input
                    v-model="loginForm.password"
                    type="password"
                    placeholder="密码"
                    prefix-icon="el-icon-lock"
                    show-password
                    @focus="inputFocused = 'password'"
                    @blur="inputFocused = ''"
                    @keyup.enter.native.prevent="submitForm('loginForm')"
                    class="login-input"
                  ></el-input>
                </div>
                
                <div class="form-footer">
                  <el-checkbox v-model="rememberMe" class="remember-check">记住我</el-checkbox>
                </div>
                
                <el-button
                  type="primary"
                  :loading="loading"
                  class="login-btn"
                  @click="submitForm('loginForm')"
                >
                  <i v-if="!loading" class="el-icon-right"></i>
                  <span v-if="loading">登录中...</span>
                  <span v-else>登录</span>
                </el-button>
              </div>
            </div>
          </div>
        </template>

        <template v-if="isTenantSelectMode">
          <div class="tenant-header">
            <div class="tenant-header-content">
              <div class="tenant-icon">
                <i class="el-icon-office-building"></i>
              </div>
              <div class="tenant-header-text">
                <h3>选择要进入的租户</h3>
                <p>您拥有多个租户权限，请选择要进入的租户</p>
              </div>
            </div>
          </div>
          <div class="tenant-list-container">
            <div class="tenant-list">
              <div
                v-for="tenant in tenantList"
                :key="tenant.tenant_no"
                class="tenant-card"
                @click="selectTenant(tenant)"
              >
                <div class="tenant-card-header">
                  <div class="tenant-icon-small">
                    <i class="el-icon-office-building"></i>
                  </div>
                  <div class="tenant-card-title">
                    <h4>{{ tenant.tenant_name || '未命名租户' }}</h4>
                    <span v-if="tenant.tenant_app_name && tenant.tenant_app_name !== tenant.tenant_name" class="tenant-app-badge">
                      {{ tenant.tenant_app_name }}
                    </span>
                  </div>
                  <div class="tenant-card-arrow">
                    <i class="el-icon-right"></i>
                  </div>
                </div>
                <div class="tenant-card-body">
                  <div class="tenant-app-info">
                    <span class="tenant-app-label">应用：</span>
                    <span class="tenant-app-name">{{ tenant.application_name || tenant.application || '默认应用' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="tenant-footer">
            <el-button size="small" class="tenant-skip-btn" @click="skipTenantSelect">
              <i class="el-icon-right"></i>
              暂不选择，直接登录
            </el-button>
          </div>
        </template>
      </div>
    </div>
  </transition>
</template>

<script>
import { ElInput, ElButton, ElCheckbox, ElMessage, ElFormItem } from "element-ui";
import { mapActions } from "vuex";
import { $http } from "../../../common/http";

export default {
  name: "LoginDialog",
  components: {
    ElFormItem,
  },
  data() {
    return {
      cb: null,
      dialogVisible: false,
      loading: false,
      rememberMe: false,
      isTenantSelectMode: false,
      tenantList: [],
      inputFocused: "",
      avatarUrl: "",
      currentTime: "",
      currentDate: "",
      currentWeekday: "",
      statusTime: "",
      timeTimer: null,
      loginForm: {
        username: "",
        password: "",
      },
      loginRules: {
        username: [
          { required: true, message: "请输入用户名", trigger: "blur" },
        ],
        password: [
          { required: true, message: "请输入密码", trigger: "blur" },
          { min: 6, message: "密码至少6个字符", trigger: "blur" },
        ],
      },
    };
  },
  mounted() {
    this.updateTime();
    this.timeTimer = setInterval(this.updateTime, 1000);
  },
  beforeDestroy() {
    if (this.timeTimer) {
      clearInterval(this.timeTimer);
    }
  },
  methods: {
    ...mapActions("loginInfo", ["initLoginInfo"]),
    updateTime() {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      this.currentTime = `${hours}:${minutes}`;
      this.statusTime = `${hours}:${minutes}`;
      
      const month = now.getMonth() + 1;
      const day = now.getDate();
      this.currentDate = `${month}月${day}日`;
      
      const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
      this.currentWeekday = weekdays[now.getDay()];
    },
    initBackground() {
      const canvas = this.$refs.bgCanvas;
      if (!canvas) return;
      
      const ctx = canvas.getContext("2d");
      const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      resize();
      window.addEventListener("resize", resize);

      const colors = [
        { h: 210, s: 90, l: 65 },
        { h: 280, s: 65, l: 65 },
        { h: 340, s: 80, l: 65 },
        { h: 30, s: 90, l: 60 },
        { h: 180, s: 70, l: 55 },
      ];

      const bubbles = [];
      const bubbleCount = 5;

      for (let i = 0; i < bubbleCount; i++) {
        bubbles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 300 + 200,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          color: colors[i % colors.length],
        });
      }

      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        bubbles.forEach((bubble) => {
          bubble.x += bubble.vx;
          bubble.y += bubble.vy;

          if (bubble.x < -bubble.r) bubble.x = canvas.width + bubble.r;
          if (bubble.x > canvas.width + bubble.r) bubble.x = -bubble.r;
          if (bubble.y < -bubble.r) bubble.y = canvas.height + bubble.r;
          if (bubble.y > canvas.height + bubble.r) bubble.y = -bubble.r;

          const gradient = ctx.createRadialGradient(
            bubble.x, bubble.y, 0,
            bubble.x, bubble.y, bubble.r
          );
          gradient.addColorStop(0, `hsla(${bubble.color.h}, ${bubble.color.s}%, ${bubble.color.l}%, 0.4)`);
          gradient.addColorStop(0.5, `hsla(${bubble.color.h}, ${bubble.color.s}%, ${bubble.color.l}%, 0.2)`);
          gradient.addColorStop(1, `hsla(${bubble.color.h}, ${bubble.color.s}%, ${bubble.color.l}%, 0)`);

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(bubble.x, bubble.y, bubble.r, 0, Math.PI * 2);
          ctx.fill();
        });

        requestAnimationFrame(draw);
      };
      draw();
    },
    focusUsername() {
      const usernameInput = document.querySelector('.lock-screen .el-input input');
      if (usernameInput) {
        usernameInput.focus();
      }
    },
    handleClose() {
      // 不allow关闭，除非在tenant select模式
    },
    closeTenantSelect() {
      this.isTenantSelectMode = false;
      this.skipTenantSelect();
    },
    listenerStorage(event) {
      if (event.key === "bx_auth_ticket") {
        console.log("bx_auth_ticket变化了");
        if (this.cb && typeof this.cb === "function") {
          this.cb();
          window.removeEventListener("storage", this.listenerStorage);
        }
      }
    },
    open(callback) {
      this.cb = callback;
      this.isTenantSelectMode = false;
      this.tenantList = [];
      this.loginForm.password = "";
      this.updateTime();
      
      const getRootWindow = function (_window) {
        _window = _window || window;
        if (_window.top !== _window) {
          return getRootWindow(_window.top);
        } else {
          return _window;
        }
      };
      if (getRootWindow()?.layer) {
        let login_page = "/main/login.html";
        if (getRootWindow()?.getLoginAddress) {
          login_page = `/${getRootWindow().getLoginAddress()}`;
        }
        getRootWindow().layer.open({
          title: false,
          type: 2,
          content: window.location.origin + login_page,
          closeBtn: 0,
          area: ["299px", "350px"],
          shade: 0.9,
        });
        window.addEventListener("storage", this.listenerStorage);
      } else {
        this.dialogVisible = true;
        this.$nextTick(() => {
          this.initBackground();
        });
      }
    },
    loadSavedCredentials() {
      const savedUsername = sessionStorage.getItem("saved_username");
      const savedRemember = sessionStorage.getItem("remember_login");
      if (savedUsername) {
        this.loginForm.username = savedUsername;
      }
      this.rememberMe = savedRemember === "true";
    },
    saveCredentials() {
      if (this.rememberMe) {
        sessionStorage.setItem("saved_username", this.loginForm.username);
        sessionStorage.setItem("remember_login", "true");
      } else {
        sessionStorage.removeItem("saved_username");
        sessionStorage.removeItem("remember_login");
      }
    },
    submitForm() {
      if (!this.loginForm.username) {
        ElMessage.error("请输入用户名");
        return;
      }
      if (!this.loginForm.password) {
        ElMessage.error("请输入密码");
        return;
      }
      if (this.loginForm.password.length < 6) {
        ElMessage.error("密码至少6个字符");
        return;
      }
      this.login();
    },
    getTenantInfo() {
      // 参考 main/login.js 中 loginProc 的逻辑，按优先级获取已记录的租户信息
      let tenantInfo = null;
      // 1. sessionStorage 中的 _tenant_info
      if (sessionStorage.getItem("_tenant_info")) {
        try {
          const info = JSON.parse(sessionStorage.getItem("_tenant_info"));
          if (info && info.tenant && info.application) {
            tenantInfo = info;
          }
        } catch (error) {
          console.error("解析租户信息失败:", error);
        }
      }
      // 2. top._tenant_info
      if (
        !tenantInfo &&
        top._tenant_info &&
        top._tenant_info.tenant &&
        top._tenant_info.application
      ) {
        tenantInfo = top._tenant_info;
      }
      // 3. top.user
      if (
        !tenantInfo &&
        top.user &&
        top.user.tenant &&
        top.user.application
      ) {
        tenantInfo = {
          tenant: top.user.tenant,
          application: top.user.application,
          tenant_name: top.user.tenant_name || "",
        };
      }
      if (tenantInfo) {
        sessionStorage.setItem("_tenant_info", JSON.stringify(tenantInfo));
        top._tenant_info = tenantInfo;
      }
      return tenantInfo;
    },
    async login() {
      this.loading = true;
      try {
        const url = `/sso/operate/srvuser_login`;
        const data = {
          user_no: this.loginForm.username,
          pwd: this.loginForm.password,
          terminal_type: "PC",
        };
        // 获取已记录的租户信息（_tenant_info），登录过期重新登录时直接使用对应租户
        const tenantInfo = this.getTenantInfo();
        if (tenantInfo) {
          data.tenant = tenantInfo.tenant;
          data.application = tenantInfo.application;
          console.log("登录时使用租户信息:", tenantInfo);
        }
        const req = [{ serviceName: "srvuser_login", data: [data] }];
        const res = await $http.post(url, req);
        if (res?.data?.state === "SUCCESS") {
          const resData = res.data.response[0].response;
          sessionStorage.setItem("bx_auth_ticket", resData.bx_auth_ticket);
          sessionStorage.setItem(
            "current_login_user",
            JSON.stringify(resData.login_user_info)
          );
          window.user = resData.login_user_info;
          sessionStorage.setItem("logined", true);

          this.$nextTick(() => {
            this.initLoginInfo(resData);
          });

          const otherTenants = resData.login_user_info?.otherTenantInfos;
          // 若已记录了租户信息（_tenant_info），则直接使用对应租户登录，不再弹出租户选择
          if (
            !tenantInfo &&
            otherTenants &&
            Array.isArray(otherTenants) &&
            otherTenants.length > 0
          ) {
            this.showTenantSelector(otherTenants);
            return true;
          }

          this.dialogVisible = false;
          if (this.cb && typeof this.cb === "function") {
            this.cb(resData);
          }
          return true;
        } else {
          ElMessage.error(res.data.resultMessage || "登录失败");
        }
      } catch (error) {
        console.error("登录错误:", error);
        ElMessage.error("登录失败，请检查网络连接");
      } finally {
        this.loading = false;
      }
    },
    showTenantSelector(tenants) {
      this.tenantList = tenants;
      this.isTenantSelectMode = true;
    },
    selectTenant(tenant) {
      const tenantNo = tenant.tenant_no;
      const appNo = tenant.application;
      const tenantName = tenant.tenant_name;
      
      if (tenantNo && appNo) {
        if (top.user?.tenant != tenantNo || top.user?.application !== appNo) {
          const tenantInfo = {
            tenant: tenantNo,
            tenant_name: tenantName,
            application: appNo
          };
          top.sessionStorage.setItem("_tenant_info", JSON.stringify(tenantInfo));
          top._tenant_info = tenantInfo;

          const callBack = function (data) {
            if (data.state == "SUCCESS") {
              var res = data.response;
              if (res.length > 0) {
                var resList = res[0].response;
                top.sessionStorage.setItem('bx_auth_ticket', resList.bx_auth_ticket)
                top.sessionStorage.setItem('current_login_user', JSON.stringify(resList.login_user_info))
                top.location.reload()
                top.user = resList.login_user_info
                setTimeout(() => {
                  top.document.title = top.user.tenant_name
                }, 50);
              }
            }
          }
          var bxReq = [
            {
              serviceName: "srvuser_app_tenant_swh_login",
              data: [
                {
                  tenant_no: tenantNo,
                  tenant_name: tenantName,
                  application: appNo,
                },
              ],
            },
          ];
          var path = top.pathConfig.gateway + "/sso/operate/srvuser_app_tenant_swh_login";
          this.crosAjax(path, "POST", bxReq, callBack);
          return;
        } else if (top.user.tenant_name) {
          setTimeout(() => {
            top.document.title = top.user.tenant_name
          }, 50);
        }
      }
    },
    skipTenantSelect() {
      location.reload();
    },
    crosAjax(url, method, jsonData, succFun, asyncFlag) {
      var bx_auth_ticket = sessionStorage.getItem("bx_auth_ticket");
      //如果为退出接口则清理回话数据
      if (url.endsWith("/srvuser_exit")) {
        sessionStorage.clear();
      }

      const config = {
        url: url,
        method: method,
        data: jsonData,
        headers: {
          "Content-Type": "application/json;charset=utf-8"
        },
        withCredentials: true
      };

      if (bx_auth_ticket) {
        config.headers["bx_auth_ticket"] = bx_auth_ticket;
        config.headers["bx-auth-ticket"] = bx_auth_ticket;
      }

      $http(config)
        .then(response => {
          const data = response.data;
          if (data.state == "FAILURE" && data.resultCode == "0011") {
            if (url.endsWith("/srvauth_user_app_menu_select") || url.endsWith('/srvuser_app_tenant_swh_login')) {
              sessionStorage.setItem("need_main_refresh", true);
            }

            if (top.user && top.user.tenant && top.user.application) {
              const tenantInfo = {
                tenant: top.user.tenant,
                tenant_name: top.user.tenant_name,
                application: top.user.application
              };
              sessionStorage.setItem("_tenant_info", JSON.stringify(tenantInfo));
              top._tenant_info = tenantInfo;
            }

            // 直接调用登录弹窗
            this.open();
          } else {
            if (succFun != null) {
              succFun(data);
            }
          }
        })
        .catch(error => {
          console.log("error", error);
          if (error.response && error.response.status === 429) {
            if (window.top.limitingTips) {
              window.top.limitingTips();
            }
          }
          console.log("请求失败:请检查后台服务器地址是否正确。", error);
        });
    },
  },
};
</script>

<style lang="scss">
.lock-screen-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
}

.lock-screen {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  background: #1a1a2e;

  .bg-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;

    canvas {
      width: 100%;
      height: 100%;
    }
  }

  .login-container {
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 40px 20px;
  }
  .login-expired{
    font-size: 24px;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 10px;
    text-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  }
  .time-section {
    text-align: center;
    margin-bottom: 20px;
    animation: fadeIn 0.8s ease;

    .time {
      display: block;
      font-size: 100px;
      font-weight: 700;
      color: white;
      text-shadow: 0 8px 40px rgba(0, 0, 0, 0.3);
      letter-spacing: -2px;
      line-height: 1;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif;
    }

    .date {
      display: block;
      font-size: 28px;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.9);
      margin-top: 8px;
      text-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }

    .weekday {
      display: block;
      font-size: 20px;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.65);
      margin-top: 4px;
    }
  }

  .login-card {
    width: 100%;
    max-width: 400px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(30px);
    border-radius: 30px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.2);
    padding: 40px;
    animation: fadeIn 0.8s ease 0.2s both;

    .login-header {
      text-align: center;
      margin-bottom: 30px;

      .user-avatar {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: linear-gradient(145deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%);
        backdrop-filter: blur(20px);
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.2);
        border: 2px solid rgba(255, 255, 255, 0.2);
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          transform: scale(1.05);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.25);
        }

        img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        i {
          font-size: 48px;
          color: white;
          text-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
      }

      .username-display {
        font-size: 24px;
        font-weight: 600;
        color: white;
        text-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
      }
    }

    .login-form {
      .form-group {
        margin-bottom: 20px;

        .login-input {
          width: 100%;

          .el-input__inner {
            height: 52px;
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.15);
            background: rgba(0, 0, 0, 0.25);
            color: white;
            font-size: 16px;
            transition: all 0.3s ease;

            &::placeholder {
              color: rgba(255, 255, 255, 0.5);
            }

            &:hover {
              background: rgba(0, 0, 0, 0.35);
              border-color: rgba(255, 255, 255, 0.3);
            }

            &:focus {
              background: rgba(0, 0, 0, 0.4);
              border-color: rgba(255, 255, 255, 0.4);
              box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.15);
            }
          }

          .el-input__prefix {
            color: rgba(255, 255, 255, 0.6);
            font-size: 18px;
          }

          .el-input__suffix {
            .el-input__suffix-inner {
              i {
                color: rgba(255, 255, 255, 0.6);
              }
            }
          }
        }
      }

      .form-footer {
        margin-bottom: 24px;

        .remember-check {
          display: flex;
          align-items: center;

          .el-checkbox__label {
            color: rgba(255, 255, 255, 0.8);
            font-size: 14px;
          }

          .el-checkbox__inner {
            background: rgba(0, 0, 0, 0.3);
            border-color: rgba(255, 255, 255, 0.3);
          }

          &.is-checked .el-checkbox__inner {
            background: white;
            border-color: white;
          }
        }
      }

      .login-btn {
        width: 100%;
        height: 56px;
        font-size: 18px;
        font-weight: 600;
        border-radius: 16px;
        background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
        border: none;
        color: white;
        transition: all 0.3s ease;
        box-shadow: 0 8px 25px rgba(52, 152, 219, 0.3);

        &:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 35px rgba(52, 152, 219, 0.4);
          background: linear-gradient(135deg, #2980b9 0%, #1f618d 100%);
        }

        i {
          font-size: 18px;
        }
      }
    }
  }

  .status-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    padding-top: 12px;
    z-index: 20;

    .status-item {
      color: white;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 0 12px;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);

      &.time {
        font-weight: 500;
      }
    }
  }

  &.tenant-select-mode {
    justify-content: flex-start;
    height: 100vh;
    background: #1a1a2e;

    .tenant-header {
      background: #2c3e50;
      padding: 30px;
      position: relative;
      border-radius: 0 0 20px 20px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);

      .tenant-header-content {
        display: flex;
        align-items: center;
        gap: 16px;
        max-width: 1200px;
        margin: 0 auto;
      }

      .tenant-icon {
        width: 60px;
        height: 60px;
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);

        i {
          font-size: 28px;
          color: white;
        }
      }

      .tenant-header-text {
        flex: 1;

        h3 {
          font-size: 24px;
          font-weight: 700;
          color: white;
          margin: 0 0 8px;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }

        p {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
          margin: 0;
          text-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
        }
      }

      .tenant-close {
        position: absolute;
        top: 20px;
        right: 20px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);

        i {
          color: white;
          font-size: 18px;
        }

        &:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }
      }
    }

    .tenant-list-container {
      flex: 1;
      overflow-y: auto;
      padding: 30px;

      .tenant-list {
        max-width: 1200px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 20px;

        .tenant-card {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);

          &:hover {
            background: rgba(255, 255, 255, 0.12);
            transform: translateY(-4px);
            border-color: rgba(255, 255, 255, 0.2);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
          }

          .tenant-card-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 10px;

            .tenant-icon-small {
              width: 40px;
              height: 40px;
              background: #3498db;
              border-radius: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);

              i {
                font-size: 20px;
                color: white;
              }
            }

            .tenant-card-title {
              flex: 1;
              display: flex;
              align-items: center;
              gap: 8px;

              h4 {
                font-size: 16px;
                font-weight: 600;
                color: white;
                margin: 0;
              }

              .tenant-app-badge {
                display: inline-flex;
                background: #e74c3c;
                color: white;
                padding: 2px 8px;
                border-radius: 16px;
                font-size: 10px;
                font-weight: 600;
                box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
              }
            }

            .tenant-card-arrow {
              color: rgba(255, 255, 255, 0.6);
              font-size: 16px;
              transition: all 0.3s ease;

              i {
                transition: transform 0.3s ease;
              }
            }

            &:hover .tenant-card-arrow i {
              transform: translateX(5px);
              color: white;
            }
          }

          .tenant-card-body {
            padding-left: 52px;

            .tenant-app-info {
              display: flex;
              align-items: center;
              gap: 6px;

              .tenant-app-label {
                font-size: 12px;
                color: rgba(255, 255, 255, 0.6);
              }

              .tenant-app-name {
                font-size: 12px;
                color: rgba(255, 255, 255, 0.9);
                font-weight: 500;
              }
            }
          }
        }
      }
    }

    .tenant-footer {
      padding: 20px 30px;
      max-width: 1200px;
      margin: 0 auto;
      text-align: center;

      .tenant-skip-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: rgba(255, 255, 255, 0.9);
        padding: 8px 20px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);

        &:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        i {
          margin-left: 6px;
          transition: transform 0.3s ease;
        }

        &:hover i {
          transform: translateX(3px);
        }
      }
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.lock-screen-enter-enter-active {
  transition: all 0.6s ease;
}

.lock-screen-enter-leave-active {
  transition: all 0.4s ease;
}

.lock-screen-enter-enter {
  opacity: 0;
}

.lock-screen-enter-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .lock-screen {
    .time-section {
      padding-top: 15vh;

      .time {
        font-size: 72px;
      }

      .date {
        font-size: 24px;
      }

      .weekday {
        font-size: 18px;
      }
    }

    .login-section {
      .login-form {
        width: 85%;
        padding: 24px 28px;
      }
    }
  }
}
</style>