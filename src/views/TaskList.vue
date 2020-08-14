<template>
  <div class="taskList">
    <div class="buttonWrapper">
      <el-button type="danger" :class="tabStyle.submitted" @click="switchTab('submitted')">待批改</el-button>
      <el-button type="success" :class="tabStyle.revised" @click="switchTab('revised')">已批改</el-button>
    </div>
    <el-card class="table">
      <el-table :data='worksList' v-loading="loading">
        <el-table-column align="center" label='提交时间' prop="date">
          <template slot-scope='scope'>
            <i class='el-icon-time'></i>
            <span>{{ new Date(scope.row.submit_date).toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" prop="name" label='学校' >
          <template slot-scope='scope'>
            {{ scope.row.schoolName }}
          </template>
        </el-table-column>
        <el-table-column align="center" label='班级' prop="course" >
          <template slot-scope='scope'>
            <div slot='reference' class='name-wrapper'>
              <span>{{ scope.row.gradeName }}{{ scope.row.className }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column align="center" label='姓名'>
          <template slot-scope='scope'>
            <div slot='reference' class='name-wrapper' >
              <span>{{ scope.row.userName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column align="center" label='作业ID' :show-overflow-tooltip="true" min-width="130">
          <template slot-scope='scope'>
            <div slot='reference' class='name-wrapper'>
              <span>{{ scope.row._id }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column align="center" label='作业标题' :show-overflow-tooltip="true" min-width="130">
          <template slot-scope='scope'>
            <div slot='reference' class='name-wrapper'>
              <span>{{ scope.row.title }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column align="center" label='作业ID'>
          <template slot-scope='scope'>
            <el-button size='mini' @click='toTaskDetail(scope.row._id)'>{{taskType === 'submitted' ? '批改' : "查看"}}</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        :current-page.sync="currentPage"
        class="pagination"
        :page-size="10"
        layout="pager"
        @current-change="pageChange"
        :total="worksCount">
      </el-pagination>
    </el-card>
  </div>
</template>

<script>

import router from '../router'
import tcb from 'tcb-js-sdk'

export default {
  name: 'TaskList',
  data () {
    return {
      taskType: null,
      worksList: [],
      loading: null,
      index: null,
      worksCount: null,
      currentPage: 1
    }
  },
  computed: {
    tabStyle: function () {
      return {
        submitted: this.taskType === 'submitted' ? '' : 'is-plain',
        revised: this.taskType === 'revised' ? '' : 'is-plain'
      }
    }
  },
  methods: {
    init () {
      this.cloudAPP = tcb.init({ env: 'happy-writing-env-id' })
      this.predicateRouteQuery()
      this.taskType = 'submitted'
      this.index = 0
      this.getTaskList('submitted')
    },
    switchTab (type) {
      this.taskType = type
      this.getTaskList()
    },
    async getTaskList () {
      this.loading = true
      try {
        const response = await this.cloudAPP.callFunction({
          name: 'getWorksList',
          data: {
            operatorID: this.$route.query.operatorID,
            type: this.taskType,
            index: this.index,
            count: 10
          }
        })
        this.worksList = response.result.worksList
        this.worksCount = response.result.count
        this.loading = false
      } catch (e) {
        console.log(e)
        this.loading = false
        this.$message.error('获取任务列表失败')
      }
    },
    predicateRouteQuery () {
      if (!this.$route.query.operatorID) {
        router.push({
          name: 'Login'
        })
      }
    },
    async toTaskDetail (worksID) {
      this.loading = true
      const db = this.cloudAPP.database()
      const response = await db.collection('works').doc(worksID).field({ operator_id: true }).get()
      if (!response.data[0].operator_id) {
        try {
          await db.collection('works').doc(worksID).update({
            operator_id: this.$route.query.operatorID
          })
          this.loading = false
          router.push({
            name: 'TaskDetail',
            query: {
              worksID
            }
          })
        } catch (error) {
          this.loading = false
          console.log(error)
          this.$message.error('请稍后再试')
        }
      } else if (response.data[0].operator_id === this.$route.query.operatorID) {
        this.loading = false
        router.push({
          name: 'TaskDetail',
          query: { worksID }
        })
      } else {
        this.loading = false
        this.$message.error('作业已被抢走')
        await this.getTaskList()
      }
    },
    pageChange (page) {
      this.index = (page - 1) * 10
      this.getTaskList()
    }
  },
  async mounted () {
    this.init()
    this.cloudAPP.auth()
    // const db = this.cloudAPP.database()
    // const classIdData = await db.collection('class').get()
    // await Promise.all(classIdData.data.map(async item => {
    //   const total = await db.collection('user').where({
    //     class_id: item._id
    //   }).count()
    //   const classData = await db.collection('class').doc(item._id).get()
    //   const gradeData = await db.collection('grade').doc(classData.data[0].grade_id).get()
    //   const schoolData = await db.collection('school').doc(gradeData.data[0].school_id).get()
    //   console.log(`${schoolData.data[0].name}-${gradeData.data[0].name}-${classData.data[0].name}: ${total.total}`)
    // }))
  }
}
</script>

<style scoped lang="scss">
  .taskList{
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 1280px;
    .buttonWrapper {
      align-self: flex-start;
      margin: 20px 0;
    }
    .table {
      width: 100%;
      .pagination {
        margin: 20px;
        text-align: center;
      }
    }
  }
</style>
