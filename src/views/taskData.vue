<template>
  <div v-loading="loading" style="width: 100%">
    <el-cascader
      :options="classs"
      @change="getClassData"></el-cascader>
    <el-table
      :data="userData"
      style="width: 100%">
      <el-table-column
        prop="className"
        label="学校班级"
        width="240">
      </el-table-column>
      <el-table-column
        prop="name"
        label="姓名"
        width="180">
      </el-table-column>
      <el-table-column v-for="task in taskList" v-bind:key="task.title"
        :label="task.title"
        width="100">
        <template slot-scope='scope'>
          {{scope.row.taskData[task._id]}}
        </template>
      </el-table-column>
      <el-table-column
        label="规范字">
        <template slot-scope='scope'>
          <div style="display: flex; flex-direction: row;">
            <div v-for="(character,index) in Object.keys(scope.row.character)" v-bind:key="index">
                {{scope.row.character[character] ? character : ''}}
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        label="不规范字">
        <template slot-scope='scope'>
          <div style="display: flex; flex-direction: row;">
            <div v-for="(character,index) in Object.keys(scope.row.character)" v-bind:key="index">
              {{!scope.row.character[character] ? character : ''}}
            </div>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>

import tcb from 'tcb-js-sdk'

export default {
  name: 'taskData',
  data () {
    return {
      value: [],
      userData: [],
      loading: false,
      taskList: null,
      classs: [
        {
          label: '桂林理工大学附属小学一年级一班',
          value: {
            name: '桂林理工大学附属小学一年级一班',
            id: 'a7d38b365f0ecd8f004ee3b907bed055'
          }
        },
        {
          label: '桂林理工大学附属小学一年级二班',
          value: {
            name: '桂林理工大学附属小学一年级二班',
            id: 'a7d38b365f0ecd8f004ee3ba0faf06ec'
          }
        },
        {
          label: '桂林理工大学附属小学二年级二班',
          value: {
            name: '桂林理工大学附属小学二年级二班',
            id: 'a7d38b365f0ecd8f004ee3bd4c290dc7'
          }
        },
        {
          label: '桂林理工大学附属小学二年级三班',
          value: {
            name: '桂林理工大学附属小学二年级三班',
            id: 'a7d38b365f0ecd8f004ee3be719406ee'
          }
        },
        {
          label: '桂林穿山小学一年级六班',
          value: {
            name: '桂林穿山小学一年级六班',
            id: 'a7d38b365f0ecd8f004ee3c226864791'
          }
        },
        {
          label: '桂林穿山小学二年级五班',
          value: {
            name: '桂林穿山小学二年级五班',
            id: 'a7d38b365f0ecd8f004ee3c6081038db'
          }
        },
        {
          label: '桂林穿山小学三年级二班',
          value: {
            name: '桂林穿山小学三年级二班',
            id: 'a7d38b365f0ecd8f004ee3c7128692bb'
          }
        },
        {
          label: '桂林穿山小学三年级六班',
          value: {
            name: '桂林穿山小学三年级六班',
            id: 'a7d38b365f0ecd8f004ee3c8299cd5bb'
          }
        }
      ]
    }
  },
  async mounted () {
  },
  methods: {
    async getClassData (e) {
      console.log(e)
      this.loading = true
      const app = tcb.init({ env: 'happy-writing-env-id' })
      app.auth()
      const db = app.database()
      const userData = await db.collection('user').where({
        class_id: e[0].id
      }).get()
      const taskData = await db.collection('task').where({
        class_id: e[0].id
      }).get()
      this.taskList = taskData.data
      console.log(userData)
      await Promise.all(userData.data.map(async user => {
        const taskState = {}
        const c = {}
        await Promise.all(taskData.data.map(async task => {
          const worksData = await db.collection('works').where({
            task_id: task._id,
            user_id: user._id
          }).get()
          if (worksData && worksData.data.length) {
            worksData.data.map(works => {
              if (works && works.correct_data && Object.keys(works.correct_data) && works.correct_data.characters) {
                works.correct_data.characters.map(character => {
                  c[character.id] = character.score >= 80 || !!c[character.id]
                })
              }
            })
          }
          taskState[task._id] = worksData.data.length
        }))
        user.className = e[0].name
        user.taskData = taskState
        user.character = c
      }))
      this.userData = userData.data
      this.loading = false
    }
  }
}
</script>

<style>
  .el-table th>.cell  {
    user-select: text !important;
  }
</style>
