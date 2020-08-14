<template>
  <div style="width: 100%; display: flex;flex-direction: row">
    <div v-for="item in table1" v-bind:key="item.userName" style="margin-right: 40px">
      <el-table
        :data="item"
        style="width: 100%">
        <el-table-column
          prop="schoolName"
          label="学校"
          width="180">
        </el-table-column>
        <el-table-column
          prop="gradeName"
          label="年级"
          width="180">
        </el-table-column>
        <el-table-column
          prop="className"
          label="班级"
          width="180">
        </el-table-column>
        <el-table-column
          prop="userName"
          label="姓名"
          width="180">
        </el-table-column>
      </el-table>
    </div>
    <div v-for="item in table2" v-bind:key="item.userName" style="margin-right: 40px">
      <el-table
        :data="item"
        style="width: 100%">
        <el-table-column
          prop="schoolName"
          label="学校"
          width="180">
        </el-table-column>
        <el-table-column
          prop="gradeName"
          label="年级"
          width="180">
        </el-table-column>
        <el-table-column
          prop="className"
          label="班级"
          width="180">
        </el-table-column>
        <el-table-column
          prop="userName"
          label="姓名"
          width="180">
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
import tcb from 'tcb-js-sdk'

<script>
import tcb from 'tcb-js-sdk'

export default {
  name: 'classData',
  data () {
    return {
      table1: [],
      table2: []
    }
  },
  async mounted () {
    const app = tcb.init({ env: 'happy-writing-env-id' })
    app.auth()
    const db = app.database()
    const liGongFushu = await db.collection('grade').where({
      school_id: '2dddb6b55f0ecb9e0041de2358b88593'
    }).get()
    await Promise.all(liGongFushu.data.map(async grade => {
      const classData = await db.collection('class').where({
        grade_id: grade._id
      }).get()
      await Promise.all(classData.data.map(async classs => {
        const userData = await db.collection('user').where({
          class_id: classs._id
        }).get()
        const classDetail = userData.data.map(user => {
          return {
            schoolName: '桂林理工大学附属小学',
            gradeName: grade.name,
            className: classs.name,
            userName: user.name
          }
        })
        this.table1.push(classDetail)
      }))
    }))
    const chuanshan = await db.collection('grade').where({
      school_id: '2dddb6b55f0ecb9e0041de2459ba12c4'
    }).get()
    await Promise.all(chuanshan.data.map(async grade => {
      const classData = await db.collection('class').where({
        grade_id: grade._id
      }).get()
      await Promise.all(classData.data.map(async classs => {
        const userData = await db.collection('user').where({
          class_id: classs._id
        }).get()
        const classDetail = userData.data.map(user => {
          return {
            schoolName: '桂林市穿山小学',
            gradeName: grade.name,
            className: classs.name,
            userName: user.name
          }
        })
        this.table2.push(classDetail)
      }))
    }))
  }
}
</script>

<style scoped>

</style>
