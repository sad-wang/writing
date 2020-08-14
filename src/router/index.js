import Vue from 'vue'
import VueRouter from 'vue-router'
import TaskDetail from '../views/TaskDetail'
import TaskList from '../views/TaskList'
import Login from '../views/Login'
import postTask from '../views/postTask'
import classData from '../views/classData'
import taskData from '../views/taskData'
import tcb from 'tcb-js-sdk'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'TaskList',
    component: TaskList,
    props: true
  },
  {
    path: '/taskDetail',
    name: 'TaskDetail',
    component: TaskDetail,
    props: true
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/postTask',
    name: 'postTask',
    component: postTask
  },
  {
    path: '/classData',
    name: 'classData',
    component: classData
  },
  {
    path: '/taskData',
    name: 'taskData',
    component: taskData
  }
]

const router = new VueRouter({
  base: process.env.BASE_URL,
  routes
})

router.beforeEach(async (to, from, next) => {
  const loginState = await tcb.init({
    env: 'happy-writing-env-id'
  }).auth().getLoginState()
  if (to.name !== 'Login' && !loginState) next({ name: 'Login' })
  else next()
})

export default router
