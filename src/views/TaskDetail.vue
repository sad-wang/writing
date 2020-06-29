<template>
  <div class="taskDetail">
    <el-card class="box-card" v-loading="loading" >
      <div slot="header" class="header">
        <span class="section title">作业评教</span>
        <span class="section">学生姓名：{{courseData.studentName}}</span>
        <span class="section">{{courseData.courseTitle}} </span>
        <span class="section">{{courseData.chapterTitle}}</span>
        <div class="button-wrapper">
          <el-button>预览<i class="el-icon-view"></i></el-button>
          <el-button>上墙<i class="el-icon-finished"></i></el-button>
          <el-button>评教下一个<i class="el-icon-arrow-right"></i></el-button>
          <el-button>完成评教<i class="el-icon-finished"></i></el-button>
        </div>
      </div>
      <el-card shadow="hover" class="homeworkContent">
        <div slot="header">作业内容</div>
        <span>{{courseData.homeworkContent}}</span>
      </el-card>
      <div class="main">
        <el-card class="reviewArea" shadow="hover">
          <div slot="header">评教区</div>
            <transition name="el-zoom-in-top">
              <div class="toolArea" v-show="toolShow">
                <div class="title">颜色：</div>
                <div class="item red" :class="{selected: color === 'red'}" @click="changeColor('red')"></div>
                <div class="item green" :class="{selected: color === 'green'}" @click="changeColor('green')"></div>
                <div class="title">奖励：</div>
                <div></div>
                <i class="el-icon-trophy-1 item rewardIcon"></i>
                <i class="el-icon-medal item rewardIcon"></i>
              </div>
            </transition>
            <div class="canvas-wrapper transition-box">
              <canvas ref="taskCanvas"
                      :width="computeTaskCanvas.width"
                      :height="computeTaskCanvas.height"
                      @mousedown="canvasMouseDown"
                      @mousemove="canvasMouseMove($event, taskCanvas.context)"
                      @mouseup="canvasMouseUp($event, taskCanvas.context)"
                      @mouseleave="canvasMouseUp($event, taskCanvas.context)">
              </canvas>
            </div>
        </el-card>
        <el-card class="reviewProcess" shadow="hover">
          <div slot="header">评教流程</div>
          <el-collapse>
            <el-collapse-item title="步骤一 简单介绍和问候" name="step1">
              <div class="collapse-item-content">
                <el-button @click="record('step1Record')" :loading="step.step1Record.state === 'loading'">{{computedButtonValue(step.step1Record)}}</el-button>
                <audio ref="step1Record" controls :src="blobToUrl(step.step1Record.recordData.blobData)" v-show="step.step1Record.recordData.blobData"></audio>
              </div>
            </el-collapse-item>
            <el-collapse-item title="步骤二 整体评教" name="step2">
              <div class="collapse-item-content">
                整体分数：
                <el-input placeholder="0-100" v-model="step.step2Record.totalScore" class="totalScore"></el-input>
                <span>分</span>
              </div>
              <div class="collapse-item-content">
                <el-button @click="record('step2Record')" :loading="step.step2Record.state === 'loading'">{{computedButtonValue(step.step2Record)}}</el-button>
                <audio ref="step2Record" controls :src="blobToUrl(step.step2Record.recordData.blobData)" v-show="step.step2Record.recordData.blobData"></audio>
              </div>
            </el-collapse-item>
            <el-collapse-item title="步骤三 评教作业优秀部分" name="step3">
            </el-collapse-item>
            <el-collapse-item title="步骤四 评教作业不足部分" name="step4">
            </el-collapse-item>
          </el-collapse>
        </el-card>
      </div>
    </el-card>
  </div>
</template>

<script>
import tcb from 'tcb-js-sdk'
import router from '../router'
import Recorder from 'recorder-core'
import 'recorder-core/src/engine/mp3'
import 'recorder-core/src/engine/mp3-engine'

export default {
  name: 'TaskDetail',
  data () {
    return {
      courseData: {
        taskID: null,
        studentName: null,
        courseTitle: null,
        chapterTitle: null,
        homeworkContent: null,
        homeworkImageURL: null,
        state: null,
        reviewData: null,
        recommend: null
      },
      taskCanvas: {
        context: null,
        image: null,
        width: null,
        height: null
      },
      step: {
        step1Record: {
          name: 'step1Record',
          type: 'record',
          state: 'usable', // 'usable' || 'loading' || 'using' || 'counting'
          recordData: {
            blobData: null,
            duration: null
          },
          drawData: [],
          tips: '简单介绍和问候提示简单介绍和问候提示简单介绍和问候提示简单介绍和问候提示'
        },
        step2Record: {
          name: 'step1Record',
          type: 'record',
          state: 'usable', // 'usable' || 'loading' || 'using' || 'counting'
          recordData: {
            blobData: null,
            duration: null
          },
          totalScore: null,
          drawData: [],
          tips: '整体评价提示整体评价提示整体评价提示整体评价提示整体评价提示整体评价提示'
        }
      },
      loading: null,
      toolShow: false,
      rec: null,
      color: 'red',
      tempData: {
        count: null,
        drawData: [],
        stroke: [],
        position: {},
        time: null,
        drawable: null
      }
    }
  },
  computed: {
    computeTaskCanvas () {
      return {
        width: this.taskCanvas.width,
        height: this.taskCanvas.height
      }
    },
    computedButtonValue () {
      return function (step) {
        let buttonValue = ''
        if (step.state === 'usable' && !step.recordData.blobData) buttonValue = '开始录制'
        if (step.state === 'usable' && step.recordData.blobData) buttonValue = '重新录制'
        if (step.state === 'using') buttonValue = '结束录制'
        if (step.state === 'counting') buttonValue = this.tempData.count === 0 ? '开始！' : this.tempData.count
        return buttonValue
      }
    }
  },
  mounted () {
    this.init()
  },
  methods: {
    initRouter () {
      if (!this.$route.query.taskID) {
        router.push({
          name: 'Login'
        })
      } else this.courseData.taskID = this.$route.query.taskID
    },
    initCloudAPP () {
      this.cloudAPP = tcb.init({ env: 'happy-writing-env-id' })
    },
    initTaskCanvas () {
      this.loading = true
      const taskCanvas = this.taskCanvas
      taskCanvas.context = this.$refs.taskCanvas.getContext('2d')
      taskCanvas.image = new Image()
      taskCanvas.image.src = this.courseData.homeworkImageURL
      taskCanvas.image.onload = () => {
        taskCanvas.width = 480
        taskCanvas.height = taskCanvas.image.height * 480 / taskCanvas.width
        this.$nextTick(() => {
          taskCanvas.context.drawImage(taskCanvas.image, 0, 0, taskCanvas.width, taskCanvas.height)
          this.loading = false
        })
      }
    },
    initRecorder () {
      this.rec = Recorder({
        type: 'mp3', sampleRate: 16000, bitRate: 16
      })
    },
    initStepData (step) {
      step.recordData.blobData = null
      step.recordData.duration = null
      step.drawData = []
    },
    getTaskDetail () {
      this.loading = true
      return new Promise((resolve, reject) => this.cloudAPP.callFunction({
        name: 'getTaskDetail',
        data: { taskID: this.courseData.taskID }
      }).then(res => {
        resolve()
        Object.assign(this.courseData, res.result)
        this.loading = false
      }, error => {
        reject(error)
      }))
    },
    init () {
      this.initRouter()
      this.initCloudAPP()
      this.getTaskDetail().then(this.initTaskCanvas, () => this.$message.error('加载失败'))
    },
    canvasMouseDown (e) {
      if (this.toolShow) {
        this.tempData.drawable = true
        const position = { x: e.offsetX, y: e.offsetY }
        this.tempData.position = position
        this.tempData.stroke.push({
          position,
          time: new Date() - this.time,
          color: this.color
        })
      }
    },
    canvasMouseMove (e, context) {
      if (this.tempData.drawable) {
        if (this.toolShow) {
          const position = { x: e.offsetX, y: e.offsetY }
          this.drawLine(context, this.tempData.position, position, this.color)
          this.tempData.position = position
          this.tempData.stroke.push({
            position,
            time: new Date() - this.time,
            color: this.color
          })
        }
      }
    },
    canvasMouseUp (e, context) {
      this.tempData.drawable = false
      if (this.toolShow) {
        this.tempData.drawData.push({
          type: 'stroke',
          data: this.tempData.stroke
        })
        this.tempData.stroke = []
      }
    },
    drawLine (context, start, end, color) {
      context.beginPath()
      context.strokeStyle = color
      context.lineWidth = 2
      context.moveTo(start.x, start.y)
      context.lineTo(end.x, end.y)
      context.stroke()
      context.closePath()
    },
    record (name) {
      const step = this.step[name]
      if (step.state === 'usable') this.startRecord(step)
      if (step.state === 'using') this.endRecord(step)
    },
    startRecord (step) {
      step.state = 'loading'
      this.initRecorder()
      this.initStepData(step)
      this.rec.open(() => {
        this.$notify.close()
        this.$notify({
          title: '录制提示',
          message: step.tips,
          duration: 15000,
          offset: 300,
          position: 'top-left'
        })
        this.counting(step).then(() => {
          this.tempData.time = new Date()
          this.toolShow = true
          this.rec.start()
        })
      }, error => {
        this.$message.error(error + ' 请确保录音设备正常后刷新浏览器')
        step.state = 'usable'
      })
    },
    endRecord (step) {
      this.recStop()
        .then(res => {
          step.recordData.duration = res.duration
          step.recordData.blobData = res.blob
          this.$refs[step.name].onplay = () => {
            console.log('开始播放')
          }
          this.$refs[step.name].onpause = () => {
            console.log('暂停')
          }
        }, error => this.$message.error('录制失败' + error))
        .then(() => {
          this.toolShow = false
          step.state = 'usable'
          this.clearCanvas(this.taskCanvas)
        })
    },
    recStop () {
      return new Promise((resolve, reject) => {
        this.rec.stop((blob, duration) => {
          this.rec.close()
          resolve({ blob, duration })
        }, error => {
          this.rec.close()
          reject(error)
        })
      })
    },
    counting (step) {
      return new Promise(resolve => {
        this.tempData.count = 3
        step.state = 'counting'
        const interval = setInterval(() => {
          if (this.tempData.count < 1) {
            clearInterval(interval)
            step.state = 'using'
            resolve()
          }
          this.tempData.count--
        }, 1000)
      })
    },
    blobToUrl (blob) {
      return blob ? (window.URL || window.webkitURL).createObjectURL(blob) : ''
    },
    changeColor (color) {
      this.color = color
    },
    clearCanvas (canvas) {
      canvas.context.clearRect(0, 0, canvas.width, canvas.height)
      canvas.context.drawImage(canvas.image, 0, 0, canvas.width, canvas.height)
    }
  }
}
</script>

<style scoped lang="scss">
  * {
    user-select: none;
  }
  .taskDetail {
    width: 1200px;
    margin: 10px 0;
    .box-card {
      .header {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 0 20px;
        .section {
          width: 150px;
          text-align: center;
        }
        .title {
          font-weight: bold;
          text-align: left;
          font-size: 20px;
          width: 100px;
        }
        .button-wrapper {
          flex: 1;
          text-align: right;
        }
      }
      .homeworkContent {
        margin: 0 20px;
      }
      .main {
        display: flex;
        flex-direction: row;
        margin-top: 20px;
        justify-content: space-between;
        padding: 0 20px;
        .reviewArea {
          width: 540px;
          min-height: 710px;
          .toolArea {
            height: 60px;
            border: 1px solid #EBEEF5;
            margin-bottom: 20px;
            display: flex;
            flex-direction: row;
            align-items: center;
            border-radius: 20px;
            .title {
              padding-left: 10px;
              border-left: 4px solid;
              margin-left: 15px;
            }
            .item {
              width: 35px;
              height: 35px;
              border-radius: 50%;
              margin: 5px;
              box-sizing: border-box;
              line-height: 35px;
              text-align: center;
            }
            .red {
              background-color: red;
            }
            .green {
              background-color: green;
            }
            .selected {
              border: 2px solid #30313330;
              box-shadow: 0px 0px 8px #303133;
            }
            .rewardIcon {
              font-size: 25px;
              background-color: #fcc640;
              color: #fff;
            }
          }
          .canvas-wrapper {
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
          }
        }
        .reviewProcess {
          width: 540px;
          min-height: 720px;
          padding-bottom: 0;
          .totalScore {
            width: 70px;
            margin-right: 7px;
          }
          .collapse-item-content {
            margin-bottom: 14px;
            .el-button {
              width: 100px;
              margin-right: 20px;
            }
            display: flex;
            flex-direction: row;
            align-items: center;
          }
        }
      }
    }
  }
  audio:focus {
    outline: none;
  }
</style>
