<script>
import LoginA from  '../component/login/a.vue'
export default {
  name: "login",
  components: {
    LoginA
  },
  data() {
    return {

    }
  },
  methods: {
    toPage(){
      this.$message.success('登录成功')
      if(sessionStorage.getItem('targetPage')){
        top.window.open(sessionStorage.getItem('targetPage'))
        sessionStorage.removeItem('targetPage')
      }else{
        top.window.history.back()
      }
    },
  }
}
</script>

<template>
  <div class="login-page">
    <login-a @submit="toPage"></login-a>
  </div>
</template>

<style scoped lang="scss">
.login-page{
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>