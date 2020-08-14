<template>
  <div id="app" v-loading="loading">
    <div class="title">发布作业</div>
    <el-form label-position="left" label-width="80px">
      <el-form-item label="选择班级">
        <el-cascader v-model="schoolData" :props="props" placeholder="请选择学校班级" class="cascader"></el-cascader>
      </el-form-item>
      <el-form-item label="作业标题">
        <el-input v-model="taskTitle" placeholder="请输入内容"></el-input>
      </el-form-item>
      <el-form-item label="作业内容">
        <el-date-picker
          v-model="taskDate"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期">
        </el-date-picker>
      </el-form-item>
      <el-form-item label="作业内容">
        <el-input type="textarea" v-model="taskContent"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button :loading="submitLoading" type="primary" @click="submitTask">发布</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import tcb from 'tcb-js-sdk'
export default {
  name: 'PostTask',
  data () {
    return {
      loading: false,
      submitLoading: false,
      schoolData: null,
      cloudAPP: null,
      taskDate: null,
      taskTitle: null,
      taskContent: null,
      props: {
        lazy: true,
        lazyLoad: this.lazyLoadClass,
        label: 'name',
        value: '_id',
        multiple: true
      }
    }
  },
  async mounted () {
    // this.cloudAPP.auth()
    // const db = this.cloudAPP.database()
    // const classIdData = await db.collection('class').get()
    // classIdData.data.forEach(async item => {
    //   const total = await db.collection('user').where({
    //     class_id: item._id
    //   }).count()
    //   console.log(`${item._id}: ${total.total}`)
    // })
    // const gradeData = await db.collection('grade').where({
    //   name: '一年级'
    // }).get()
    // gradeData.data.forEach()
  },
  methods: {
    lazyLoadClass (node, resolve) {
      this.cloudAPP = tcb.init({ env: 'happy-writing-env-id' })
      if (node.level === 0) this.getSchoolList(node, resolve)
      if (node.level === 1) this.getGradeList(node, resolve)
    },
    async getSchoolList (node, resolve) {
      this.loading = true
      const getSchoolList = await this.cloudAPP.callFunction({
        name: 'getSchoolList'
      })
      this.loading = false
      resolve(getSchoolList.result.map(item => {
        item.leaf = node.level >= 1
        return item
      }))
    },
    async getGradeList (node, resolve) {
      const getGradeList = await this.cloudAPP.callFunction({
        name: 'getGradeList',
        data: {
          schoolID: node.value
        }
      })
      resolve(getGradeList.result.map(item => {
        item.leaf = node.level === 1
        return item
      }))
    },
    async submitTask () {
      this.submitLoading = true
      if (this.schoolData && this.taskDate && this.taskTitle && this.taskContent) {
        const submitTask = await this.cloudAPP?.callFunction({
          name: 'submitTask',
          data: {
            title: this.taskTitle,
            content: this.taskContent,
            startTime: this.taskDate[0],
            deadline: this.taskDate[1],
            gradeIdArray: this.schoolData.map(item => item[1])
          }
        })
        if (submitTask.result.state === 200) {
          this.$message({
            message: '发布成功',
            type: 'success'
          })
          this.initData()
        } else this.$message.error('发布失败')
      } else this.$message.error('请输入完整信息')
      this.submitLoading = false
    },
    initData () {
      this.schoolData = null
      this.taskDate = null
      this.taskTitle = null
      this.taskContent = null
    }
  }
}
</script>

<style scoped lang="scss">
  #app {
    width: 996px;
    display: block;
    .title {
      font-size: 24px;
      text-align: center;
      margin: 20px;
    }
    .cascader {
      width: 100%;
    }
  }
</style>
