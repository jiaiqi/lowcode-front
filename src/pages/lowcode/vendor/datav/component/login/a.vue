<template>
  <div class="login-container">
    <h2 class="login-title">登录系统</h2>
    <el-form @submit.prevent="handleLogin" :model="form" ref="loginForm" :rules="rules">
      <el-form-item prop="username">
        <el-input v-model="form.username" placeholder="请输入手机号/邮箱"></el-input>
      </el-form-item>
      <el-form-item prop="password">
        <el-input type="password" v-model="form.password" placeholder="请输入密码" show-password></el-input>
      </el-form-item>
      <div class="flex  justify-between">
        <el-checkbox v-model="form.rememberMe">记住密码</el-checkbox>
        <a class="forget-password">忘记密码</a>
      </div>
      <el-button class="bg-green" style="width: 100%; margin-top: 20px;" @click="handleLogin">登录</el-button>
    </el-form>
  </div>
</template>

<script>
export default {
  name: 'LoginA',
  data() {
    return {
      form: {
        username: '',
        password: '',
        rememberMe: false
      },
      rules: {
        username: [
          {required: true, message: '请输入手机号或邮箱', trigger: 'blur'}
        ],
        password: [
          {required: true, message: '请输入密码', trigger: 'blur'}
        ]
      }
    }
  },
  methods: {
    handleLogin() {
      this.$refs.loginForm.validate((valid) => {
        if (valid) {
          // 这里可以添加登录逻辑，例如调用API进行验证
          console.log('用户名:', this.form.username);
          console.log('密码:', this.form.password);
          console.log('记住密码:', this.form.rememberMe);
          this.$emit('submit', this.form)
        } else {
          console.log('表单验证失败');
          return false;
        }
      });
    }
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  --primary-color: #10613F;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 50px 30px;
  background-color: #fff;
  margin: 0 auto;
  min-width: 500px;

  border-radius: 8px;

  .login-title {
    font-size: 24px;
    margin-bottom: 20px;
    text-align: center;
    width: fit-content;
    position: relative;
    padding-bottom: 10px;

    &::after {
      content: '';
      position: absolute;
      width: 50%;
      left: 25%;
      bottom: 0;
      background-color: var(--primary-color);
      height: 4px;
      border-radius: 4px;
    }
  }

  .el-form {
    width: 100%;
    max-width: 400px;
  }

  .forget-password {
    cursor: pointer;
    color: var(--primary-color);
  }

  .bg-green {
    background-color: var(--primary-color);
    color: #fff;
  }
}
</style>