<template>
  <div class="taskList">
    <div>
      <el-button type="danger" :class="tabStyle.submitted" @click="getTaskList('submitted')">未批改</el-button>
      <el-button type="success" :class="tabStyle.reviewed" @click="getTaskList('reviewed')">已批改</el-button>
    </div>
    <div v-loading="loading">
      <el-table v-if="taskType === 'submitted'" :data='submitted' class="table">
        <el-table-column label='提交时间' prop="date" width='180'>
          <template slot-scope='scope'>
            <i class='el-icon-time'></i>
            <span>{{ scope.row.submitDate }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label='姓名' width='180'>
          <template slot-scope='scope'>
            <div slot='reference' class='name-wrapper'>
              <el-tag size='medium'>{{ scope.row.userName }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label='课程' prop="course" width="180">
          <template slot-scope='scope'>
            <div slot='reference' class='name-wrapper'>
              <span>{{ scope.row.courseTitle }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label='章节' width='180'>
          <template slot-scope='scope'>
            <div slot='reference' class='name-wrapper'>
              <span>{{ scope.row.courseSubtitle }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label='操作'>
          <template slot-scope='scope'>
            <el-button size='mini' @click='toTaskDetail(scope.row.id)'>批改</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-table v-if="taskType === 'reviewed'" :data='reviewed' class="table">
        <el-table-column label='点评时间' prop="date" width='180'>
          <template slot-scope='scope'>
            <i class='el-icon-time'></i>
            <span>{{ scope.row.reivewDate }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label='姓名' width='180'>
          <template slot-scope='scope'>
            <div slot='reference' class='name-wrapper'>
              <el-tag size='medium'>{{ scope.row.userName }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label='课程' prop="course" width="180">
          <template slot-scope='scope'>
            <div slot='reference' class='name-wrapper'>
              <span>{{ scope.row.courseTitle }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label='章节' width='180'>
          <template slot-scope='scope'>
            <div slot='reference' class='name-wrapper'>
              <span>{{ scope.row.courseSubtitle }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label='操作'>
          <template slot-scope='scope'>
            <el-button size='mini' @click='toTaskDetail(scope.row.id)'>查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
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
      submitted: null,
      reviewed: null,
      loading: null
    }
  },
  computed: {
    tabStyle: function () {
      return {
        submitted: this.taskType === 'submitted' ? '' : 'is-plain',
        reviewed: this.taskType === 'reviewed' ? '' : 'is-plain'
      }
    }
  },
  methods: {
    init () {
      this.taskType = 'submitted'
    },
    getTaskList (type) {
      this.taskType = type
      this.loading = true
      tcb.init({ env: 'happy-writing-env-id' }).callFunction({
        name: 'getTaskList',
        data: {
          operatorID: this.$route.query.operatorID,
          type
        }
      }).then(res => {
        this[type] = res.result
        this.loading = false
      }, error => {
        console.error(error)
        this.loading = false
      })
    },
    predicateRouteQuery () {
      if (!this.$route.query.operatorID) {
        router.push({
          name: 'Login'
        })
      }
    },
    toTaskDetail (taskID) {
      router.push({
        name: 'TaskDetail',
        query: { taskID }
      })
    }
  },
  mounted () {
    this.init()
    this.predicateRouteQuery()
    this.getTaskList('submitted')
  }
}
</script>

<style scoped lang="scss">
  .taskList{
    width: 1000px;
    .table {
      min-height: 200px;
    }
  }
</style>
