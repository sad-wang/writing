<template>
  <div>
    <el-card class="box-card" shadow="hover" v-loading="loading">
      <div class="title" slot="header">
        <span>登录</span>
      </div>
      <el-form :model="loginForm" ref="loginForm" label-width="100px">
        <el-form-item label="账号" prop="accountID">
          <el-input v-model="loginForm.accountID" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="确认密码" prop="password">
          <el-input type="password" v-model="loginForm.password" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitForm">提交</el-button>
          <el-button @click="resetForm('loginForm')">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import Axios from 'axios'
import tcb from 'tcb-js-sdk'
import router from '@/router'
export default {
  name: 'Login',
  data () {
    return {
      loginForm: {
        accountID: null,
        password: null
      },
      loading: null
    }
  },
  mounted () {
    this.initForm()
  },
  methods: {
    submitForm () {
      this.login()
    },
    resetForm (formName) {
      this.$refs[formName].resetFields()
    },
    login () {
      this.loading = true
      this.getToken((data) => {
        tcb.init({
          env: 'happy-writing-env-id'
        }).auth({ persistence: 'session' }).signInWithTicket(data.ticket).then(res => {
          this.toTaskList(data.operatorID)
        }, this.loginFail)
      })
    },
    getToken (callback) {
      const url = 'https://happy-writing-env-id.service.tcloudbase.com/operatorLogin'
      const loginData = {
        accountID: this.loginForm.accountID,
        password: this.loginForm.password
      }
      Axios.post(url, loginData).then(res => {
        callback(res.data)
      }, this.loginFail)
    },
    initForm () {
      this.loading = false
      this.loginForm.accountID = ''
      this.loginForm.password = ''
    },
    loginFail (error) {
      console.error(error)
      this.$message.error('登陆失败')
      this.initForm()
    },
    toTaskList (operatorID) {
      this.$message({ message: '登录成功', type: 'success' })
      router.push({
        name: 'TaskList',
        query: { operatorID }
      })
    }
  }
}
</script>

<style scoped lang="scss">
  .el-card {
    width: 450px;
    height: 300px;
    margin-top: calc(50vh - 200px);
    .title {
      text-align: center;
      font-weight: bold
    }
    .el-form {
      height: 100%;
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      margin-top: 22px;
      .el-form-item {
        width: 360px;
      }
    }
  }
</style>
