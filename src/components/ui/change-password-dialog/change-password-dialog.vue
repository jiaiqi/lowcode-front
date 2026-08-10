<template>
  <div>
    <el-dialog
      title="修改密码"
      center
      :visible.sync="dialogVisible"
      append-to-body
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      width="400px"
    >
      <el-form
        ref="passwordForm"
        :model="passwordForm"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="旧密码" prop="oldPwd">
          <el-input
            type="password"
            v-model="passwordForm.oldPwd"
            show-password
          ></el-input>
        </el-form-item>
        <el-form-item label="新密码" prop="newPwd">
          <el-input
            type="password"
            v-model="passwordForm.newPwd"
            show-password
          ></el-input>
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPwd">
          <el-input
            type="password"
            v-model="passwordForm.confirmPwd"
            show-password
            @keyup.enter.native.prevent="submitForm('passwordForm')"
          ></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm('passwordForm')"
          >确认修改</el-button
        >
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
  ElMessage,
} from "element-ui";
import { mapGetters } from "vuex";
import { $http } from "@/common/http";

export default {
  data() {
    // 验证确认密码是否与新密码一致
    const validateConfirmPwd = (rule, value, callback) => {
      if (value === "") {
        callback(new Error("请再次输入密码"));
      } else if (value !== this.passwordForm.newPwd) {
        callback(new Error("两次输入密码不一致!"));
      } else {
        callback();
      }
    };

    return {
      dialogVisible: false,
      passwordForm: {
        oldPwd: "",
        newPwd: "",
        confirmPwd: "",
      },
      rules: {
        oldPwd: [{ required: true, message: "请输入旧密码", trigger: "blur" }],
        newPwd: [
          { required: true, message: "请输入新密码", trigger: "blur" },
          { min: 6, message: "密码长度不能小于6个字符", trigger: "blur" },
        ],
        confirmPwd: [
          { required: true, message: "请再次输入新密码", trigger: "blur" },
          { validator: validateConfirmPwd, trigger: "blur" },
        ],
      },
    };
  },
  computed: {
    ...mapGetters("loginInfo", ["loginUser"]),
  },
  methods: {
    // 打开对话框
    open() {
      this.dialogVisible = true;
      // 重置表单
      if (this.$refs.passwordForm) {
        this.$refs.passwordForm.resetFields();
      }
    },
    // 提交表单
    submitForm(formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          this.changePassword();
        } else {
          return false;
        }
      });
    },
    // 修改密码请求
    changePassword() {
      const url = `/sso/operate/srvsso_user_pwd_reset`;
      const req = [
        {
          serviceName: "srvsso_user_pwd_reset",
          data: [
            { pwd: this.passwordForm.oldPwd, newpwd: this.passwordForm.newPwd },
          ],
        },
      ];
      this.$http
        .post(url, req)
        .then((res) => {
          if (res.data.state === "SUCCESS") {
            this.$message.success(res.data.resultMessage || "密码修改成功");
            this.dialogVisible = false;
            // 确认修改成功后，是否重新登录
            this.$confirm("密码修改成功，是否重新登录？", "提示", {
              confirmButtonText: "确定",
              cancelButtonText: "取消",
              type: "warning",
            }).then(() => {
              this.$store.dispatch("loginInfo/clearLoginInfo");
              const currentUrl =
                window.location.pathname + window.location.hash;
              sessionStorage.setItem("login_redirect_url", currentUrl);
              const loginUrl = window.location.origin + "/main/login.html";
              window.location.href = loginUrl;
            });
          } else if (res.data.resultMessage) {
            this.$message.error(res.data.resultMessage);
          }
        })
        .catch((err) => {
          this.$message.error("操作失败，请稍后重试");
          console.error(err);
        });
    },
  },
};
</script>

<style lang="scss" scoped>
.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 20px;
}
</style>
