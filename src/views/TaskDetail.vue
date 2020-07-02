<template>
  <div class="taskDetail">
    <el-card class="box-card" v-loading="loading" >
      <div slot="header" class="header">
        <span class="section title">作业评教</span>
        <span class="section">学生姓名：{{courseData.studentName}}</span>
        <span class="section">{{courseData.courseTitle}} </span>
        <span class="section">{{courseData.chapterTitle}}</span>
        <div class="button-wrapper">
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
          <div slot="header" class="card-header">
            <div class="title">评教区</div>
            <el-button @click="preview(0)">{{previewModeState ? '退出预览' : '预览模式'}}<i class="el-icon-view"></i></el-button>
          </div>
          <transition name="el-zoom-in-top">
            <div class="toolArea" v-show="Object.keys(currentStep).length">
              <section v-show="Object.keys(currentStep).length && currentStep.type !== 'select'">
                <div class="title">颜色：</div>
                <div class="item red" :class="{selected: color === 'red'}" @click="changeColor('red')"></div>
                <div class="item green" :class="{selected: color === '#40bf40'}" @click="changeColor('#40bf40')"></div>
              </section>
              <section v-show="Object.keys(currentStep).length && currentStep.type !== 'select'">
                <div class="title">奖励：</div>
                  <i class="el-icon-trophy-1 item rewardIcon" @click="addReward('trophy')"></i>
                  <i class="el-icon-medal item rewardIcon" @click="addReward('medal')"></i>
              </section>
              <section v-show="Object.keys(currentStep).length">
                <div class="title">撤回：</div>
                <i class="el-icon-back item backIcon" @click="withdraw"></i>
              </section>
            </div>
          </transition>
          <div class="canvas-wrapper transition-box">
            <canvas ref="taskCanvas"
                    :width="taskCanvas.width"
                    :height="taskCanvas.height"
                    @mousedown="canvasMouseDown($event, taskCanvas)"
                    @mousemove="canvasMouseMove($event, taskCanvas)"
                    @mouseup="canvasMouseUp($event, taskCanvas)"
                    @mouseleave="canvasMouseUp($event, taskCanvas)">
            </canvas>
            <canvas ref="rectangleCanvas"
                    :width="rectangleCanvas.width"
                    :height="rectangleCanvas.height"
                    @mousedown="canvasMouseDown($event, rectangleCanvas)"
                    @mousemove="canvasMouseMove($event, rectangleCanvas)"
                    @mouseup="canvasMouseUp($event, rectangleCanvas)"
                    @mouseleave="canvasMouseUp($event, rectangleCanvas)"
                    class="rectangleCanvas"
                    v-show="currentStep.type === 'rectangleRecord' || rectanglePlay">
            </canvas>
            <div class="shake">
              <i class="el-icon-trophy-1 rewardIcon" :class="[trophyShow ? 'animation' : '']" ></i>
              <i class="el-icon-medal rewardIcon" :class="[medalShow ? 'animation' : '']" ></i>
            </div>
          </div>
          <section class="reward">
            <el-badge :value="computedReward.trophy" v-show="computedReward.trophy" class="item">
              <i class="el-icon-trophy-1 rewardIcon"></i>
            </el-badge>
            <el-badge :value="computedReward.medal" v-show="computedReward.medal" class="item">
              <i class="el-icon-medal rewardIcon"></i>
            </el-badge>
          </section>
          <section class="player" v-show="previewModeState">
            <i class="icon" @click="preview(2000)" :class="previewData.state ? 'el-icon-video-pause' : 'el-icon-video-play'"></i>
            <div class="duration">{{computedCurrentDuration}} / {{computedReviewDuration}}</div>
            <el-slider v-model="test" :show-tooltip="false" class="slider"></el-slider>
          </section>
        </el-card>
        <el-card class="reviewProcess" shadow="hover">
          <div slot="header" class="card-header">
            <div class="title">评教流程</div>
            <el-button>保存<i class="el-icon-view"></i></el-button>
          </div>
          <el-collapse class="collapse" v-model="collapseList">
            <el-collapse-item title="步骤一 简单介绍和问候" name="step1">
              <div class="collapse-item-content">
                <el-button @click="record('step1Record')" :loading="step.step1Record.state === 'loading'">{{computedRecordButtonValue(step.step1Record)}}</el-button>
                <div class="step1Record wave" v-show="!step.step1Record.recordData.blobData"></div>
                <audio ref="step1Record" controls @play="play($event, step.step1Record)" :src="step.step1Record.recordData.url"
                       @ended="end" @pause="pause" @timeupdate="timeUpdate($event)" v-show="step.step1Record.recordData.blobData"></audio>
              </div>
            </el-collapse-item>
            <el-collapse-item title="步骤二 整体评教" name="step2">
              <div class="collapse-item-content">
                整体分数：
                <el-input placeholder="0-100" v-model="step.step2Record.totalScore" class="totalScore"></el-input>
                <span>分</span>
              </div>
              <div class="collapse-item-content">
                <el-button @click="record('step2Record')" :loading="step.step2Record.state === 'loading'">{{computedRecordButtonValue(step.step2Record)}}</el-button>
                <div class="step2Record wave" v-show="!step.step2Record.recordData.blobData"></div>
                <audio ref="step2Record" controls @play="play($event, step.step2Record)" :src="step.step2Record.recordData.url"
                       @ended="end" @pause="pause" v-show="step.step2Record.recordData.blobData"></audio>
              </div>
            </el-collapse-item>
            <el-collapse-item title="步骤三 评教作业优秀部分" name="step3">
              <div class="collapse-item-content">
                <el-button @click="select('step3Select', 'step3Record')">{{computedSelectButtonValue(step.step3Select)}}</el-button>
              </div>
              <div class="collapse-item-content" v-show="step.step3Select.drawData.length">
                <el-button @click="record('step3Record', () => drawCircles(step.step3Select.drawData))" :loading="step.step3Record.state === 'loading'">
                  {{computedRecordButtonValue(step.step3Record)}}
                </el-button>
                <div class="step3Record wave" v-show="!step.step3Record.recordData.blobData"></div>
                <audio ref="step3Record" controls @play="play($event, step.step3Record, () => drawCircles(step.step3Select.drawData))"
                       @ended="end" @pause="pause" :src="step.step3Record.recordData.url" v-show="step.step3Record.recordData.blobData"></audio>
              </div>
              <div class="collapse-item-content" v-show="step.step3Record.recordData.blobData" v-for="(rectangleData, index) in step.step3Select.rectangleRecord" :key="index">
                <el-tag type="info" class="tag">{{index + 1}}</el-tag>
                <el-tag type="danger" class="tag" style="cursor: pointer" @click="deleteRectangle(step.step3Select, index)"><i class="el-icon-delete"></i></el-tag>
                <el-button @click="record('step3Select', () => showRectangleCanvas(step.step3Select, index), index)" :loading="rectangleData.state === 'loading'">
                  {{computedRecordButtonValue(rectangleData)}}
                </el-button>
                <div class="wave" :class="rectangleData.name" v-show="!rectangleData.recordData.blobData"></div>
                <audio :ref="rectangleData.name" controls @play="play($event, rectangleData, undefined,() => showRectangleCanvas(step.step3Select, index))"
                       @ended="end" @pause="pause" :src="rectangleData.recordData.url" v-show="rectangleData.recordData.blobData"></audio>
              </div>
            </el-collapse-item>
            <el-collapse-item title="步骤四 评教作业不足部分" name="step4">
              <div class="collapse-item-content">
                <el-button @click="select('step4Select', 'step4Record')">{{computedSelectButtonValue(step.step4Select)}}</el-button>
              </div>
              <div class="collapse-item-content" v-show="step.step4Select.drawData.length">
                <el-button @click="record('step4Record', () => drawCircles(step.step4Select.drawData))" :loading="step.step4Record.state === 'loading'">
                  {{computedRecordButtonValue(step.step4Record)}}
                </el-button>
                <div class="step4Record wave" v-show="!step.step4Record.recordData.blobData"></div>
                <audio ref="step4Record" controls @play="play($event, step.step4Record, () => drawCircles(step.step4Select.drawData))"
                       @ended="end" @pause="pause" :src="step.step4Record.recordData.url" v-show="step.step4Record.recordData.blobData"></audio>
              </div>
              <div class="collapse-item-content" v-show="step.step4Record.recordData.blobData" v-for="(rectangleData, index) in step.step4Select.rectangleRecord" :key="index">
                <el-tag type="info" class="tag">{{index + 1}}</el-tag>
                <el-tag type="danger" class="tag" style="cursor: pointer" @click="deleteRectangle(step.step4Select, index)"><i class="el-icon-delete"></i></el-tag>
                <el-button @click="record('step4Select', () => showRectangleCanvas(step.step4Select, index), index)" :loading="rectangleData.state === 'loading'">
                  {{computedRecordButtonValue(rectangleData)}}
                </el-button>
                <div class="wave" :class="rectangleData.name" v-show="!rectangleData.recordData.blobData"></div>
                <audio :ref="rectangleData.name" controls @play="play($event, rectangleData, undefined,() => showRectangleCanvas(step.step4Select, index))"
                       @ended="end" @pause="pause" :src="rectangleData.recordData.url" v-show="rectangleData.recordData.blobData"></audio>
              </div>
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
import 'recorder-core/src/extensions/waveview'

export default {
  name: 'TaskDetail',
  data () {
    return {
      test: 100,
      testa: 0,
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
        name: 'taskCanvas',
        context: null,
        image: null,
        width: null,
        height: null,
        drawable: null
      },
      rectangleCanvas: {
        name: 'rectangleCanvas',
        context: null,
        imageWidth: null,
        imageHeight: null,
        imageLeft: null,
        imageTop: null,
        width: null,
        height: null,
        drawable: null
      },
      step: {
        step1Record: {
          name: 'step1Record',
          type: 'record',
          state: 'usable', // 'usable' || 'loading' || 'using' || 'counting'
          recordData: {
            blobData: null,
            url: null,
            duration: null
          },
          drawData: [],
          rewardData: [],
          tips: '步骤一简单介绍和问候提示简单介绍和问候提示简单介绍和问候提示简单介绍和问候提示'
        },
        step2Record: {
          name: 'step2Record',
          type: 'record',
          state: 'usable', // 'usable' || 'loading' || 'using' || 'counting'
          recordData: {
            blobData: null,
            url: null,
            duration: null
          },
          rewardData: [],
          totalScore: null,
          drawData: [],
          tips: '步骤二整体评价提示整体评价提示整体评价提示整体评价提示整体评价提示整体评价提示'
        },
        step3Record: {
          name: 'step3Record',
          type: 'record',
          state: 'usable', // 'usable' || 'loading' || 'using' || 'counting'
          recordData: {
            blobData: null,
            url: null,
            duration: null
          },
          rewardData: [],
          drawData: [],
          tips: '步骤三优秀部分整体评教步骤三优秀部分整体评教步骤三优秀部分整体评教步骤三优秀部'
        },
        step3Select: {
          name: 'step3Select',
          type: 'select',
          state: 'usable', // 'usable' || 'using'
          drawData: [],
          tips: '步骤三选取优秀的字选取优秀的字选取优秀的字选取优秀的字选取优秀的字选取优秀的字',
          color: '#40bf40',
          rectangleRecord: []
        },
        step4Record: {
          name: 'step4Record',
          type: 'record',
          state: 'usable', // 'usable' || 'loading' || 'using' || 'counting'
          recordData: {
            blobData: null,
            url: null,
            duration: null
          },
          rewardData: [],
          drawData: [],
          tips: '步骤四优秀部分整体评教步骤三优秀部分整体评教步骤三优秀部分整体评教步骤三优秀部'
        },
        step4Select: {
          name: 'step4Select',
          type: 'select',
          state: 'usable', // 'usable' || 'using'
          drawData: [],
          tips: '步骤四选取优秀的字选取优秀的字选取优秀的字选取优秀的字选取优秀的字选取优秀的字',
          color: 'red',
          rectangleRecord: []
        }
      },
      loading: null,
      rec: null,
      wave: {},
      color: 'red',
      currentStep: {},
      trophyShow: false,
      medalShow: false,
      collapseList: [],
      processStack: [], // stroke || reward || rectangle
      tempData: {
        count: null,
        drawData: [],
        rewardData: [],
        stroke: [],
        rectangle: {},
        position: {},
        time: null
      },
      rectanglePlay: false,
      previewModeState: false,
      previewData: {
        state: false,
        currentDuration: 0.00,
        duration: 0.00
      },
      startable: true
    }
  },
  computed: {
    computedRecordButtonValue () {
      return (step) => {
        let buttonValue = ''
        if (step.state === 'usable' && !step.recordData.blobData) buttonValue = '开始录制'
        if (step.state === 'usable' && step.recordData.blobData) buttonValue = '重新录制'
        if (step.state === 'using') buttonValue = '结束录制'
        if (step.state === 'counting') buttonValue = this.tempData.count === 0 ? '开始录制' : this.tempData.count
        return buttonValue
      }
    },
    computedSelectButtonValue () {
      return (step) => {
        return step.state === 'usable' ? step.drawData.length ? '重新选取' : '开始选取' : '结束选取'
      }
    },
    computedReward () {
      const result = {
        medal: 0,
        trophy: 0
      }
      this.tempData.rewardData.forEach(reward => {
        if (reward.name === 'medal') result.medal++
        if (reward.name === 'trophy') result.trophy++
      })
      return result
    },
    currentCanvas () {
      return this.currentStep && this.currentStep.type === 'rectangleRecord' ? 'rectangleCanvas' : this.currentStep ? 'taskCanvas' : null
    },
    computedReviewDuration () {
      let duration = 0
      Object.values(this.step).forEach(step => {
        if (step.type !== 'select') {
          if (step.recordData.duration) duration += step.recordData.duration
        } else {
          step.rectangleRecord.forEach(rectangleStep => {
            if (rectangleStep.recordData && rectangleStep.recordData.duration) duration += rectangleStep.recordData.duration
          })
        }
      })
      duration = duration ? `${Math.floor(duration / 60000)}: ${Math.floor(duration % 60000 / 1000 / 10)}${Math.floor(duration % 60000 / 1000 % 10)}` : '0:00'
      return duration
    },
    computedCurrentDuration () {
      let duration = 0
      Object.values(this.step).forEach(step => {
        if (step.type !== 'select') {
          if (step.recordData.blobData) {
            duration += this.$refs[step.name].currentTime
          }
        } else {
          step.rectangleRecord.forEach(rectangleStep => {
            if (rectangleStep.recordData && rectangleStep.recordData.duration) duration += this.$refs[rectangleStep.name][0].currentTime
          })
        }
      })
      return duration
    }
  },
  watch: {
    step: {
      handler () {
        let step3Finish = this.step.step3Select.rectangleRecord.length
        this.step.step3Select.rectangleRecord.map(rectangleData => {
          step3Finish = step3Finish && rectangleData.recordData.blobData
        })
        if (this.step.step1Record.recordData.blobData) this.collapseList.push('step2')
        if (this.step.step2Record.recordData.blobData) this.collapseList.push('step3')
        if (step3Finish) this.collapseList.push('step4')
      },
      deep: true
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
    initRectangleCanvas () {
      const rectangleCanvas = this.rectangleCanvas
      rectangleCanvas.context = this.$refs.rectangleCanvas.getContext('2d')
      rectangleCanvas.context.drawImage(this.taskCanvas.image, rectangleCanvas.imageLeft, rectangleCanvas.imageTop, rectangleCanvas.imageWidth, rectangleCanvas.imageHeight, 0, 0, rectangleCanvas.width, rectangleCanvas.height)
    },
    convertImage (rectangleData) {
      this.rectangleCanvas.imageWidth = Math.round(Math.abs(rectangleData.end.x - rectangleData.start.x) * this.taskCanvas.image.height / this.taskCanvas.height)
      this.rectangleCanvas.imageHeight = Math.round(Math.abs(rectangleData.end.y - rectangleData.start.y) * this.taskCanvas.image.width / this.taskCanvas.width)
      this.rectangleCanvas.imageLeft = Math.round(this.taskCanvas.image.width * rectangleData.start.x / this.taskCanvas.width)
      this.rectangleCanvas.imageTop = Math.round(this.taskCanvas.image.height * rectangleData.start.x / this.taskCanvas.height)
      this.rectangleCanvas.width = this.rectangleCanvas.imageWidth * 2
      this.rectangleCanvas.height = this.rectangleCanvas.imageHeight * 2
    },
    initRecorder () {
      this.rec = Recorder({
        type: 'mp3',
        sampleRate: 16000,
        bitRate: 16,
        onProcess: (buffers, powerLevel, bufferDuration, bufferSampleRate) => {
          this.wave.input(buffers[buffers.length - 1], powerLevel, bufferSampleRate)
        }
      })
    },
    initRecordStepData (step) {
      this.initRecorder()
      step.recordData.blobData = null
      if (step.rewardData.url) (window.URL || window.webkitURL).revokeObjectURL(step.rewardData.url)
      step.rewardData.url = null
      step.recordData.duration = null
      step.drawData = []
      step.rewardData = []
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
    canvasMouseDown (e, canvas) {
      if (Object.keys(this.currentStep).length) {
        if (this.currentCanvas === canvas.name) {
          canvas.drawable = true
          const position = { x: e.offsetX, y: e.offsetY }
          this.tempData.position = position
          if (this.currentStep.type === 'rectangleRecord' || this.currentStep.type === 'record') {
            this.tempData.stroke.push({
              position,
              time: new Date() - this.tempData.time,
              color: this.color
            })
          } else {
            this.tempData.rectangle.start = position
            this.tempData.rectangle.color = this.color
          }
        }
      }
    },
    canvasMouseMove (e, canvas) {
      if (Object.keys(this.currentStep).length) {
        if (canvas.drawable) {
          const position = { x: e.offsetX, y: e.offsetY }
          if (this.currentStep.type === 'rectangleRecord' || this.currentStep.type === 'record') {
            this.drawLineAndSaveItData(canvas.context, this.tempData.position, position, this.tempData.time)
          } else this.drawRectangleWhenMouseMove(canvas, position)
          this.tempData.position = position
        }
      }
    },
    canvasMouseUp (e, canvas) {
      if (Object.keys(this.currentStep).length && canvas.drawable) {
        canvas.drawable = false
        const position = { x: e.offsetX, y: e.offsetY }
        if (this.currentStep.type === 'rectangleRecord' || this.currentStep.type === 'record') {
          this.drawLineAndSaveItData(canvas.context, this.tempData.position, position, this.tempData.time)
          this.tempData.drawData.push(this.tempData.stroke)
          this.tempData.stroke = []
          this.processStack.push('stroke')
        } else {
          this.drawRectangleWhenMouseMove(canvas, position)
          this.tempData.rectangle.end = position
          this.tempData.drawData.push(this.tempData.rectangle)
          this.tempData.rectangle = {}
          this.processStack.push('rectangle')
        }
      }
    },
    drawLineAndSaveItData (context, start, end, startTime) {
      this.drawLine(context, start, end, this.color)
      this.tempData.stroke.push({
        position: end,
        time: new Date() - startTime,
        color: this.color
      })
    },
    drawLines (context, data) {
      data.map(stroke => {
        let previousPosition = stroke[0].position
        stroke.map(point => {
          this.drawLine(context, previousPosition, point.position, point.color)
          previousPosition = point.position
        })
      })
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
    drawRectangleWhenMouseMove (canvas, end) {
      this.clearCanvas(canvas)
      this.drawRectangles(this.tempData.drawData)
      this.drawRectangle(canvas.context, this.tempData.rectangle.start, end, this.tempData.rectangle.color)
      this.drawText(this.taskCanvas.context, this.tempData.rectangle.start, this.tempData.drawData.length + 1)
    },
    drawRectangles (data) {
      data.forEach((rectangle, index) => {
        this.drawText(this.taskCanvas.context, rectangle.start, index + 1)
        this.drawRectangle(this.taskCanvas.context, rectangle.start, rectangle.end, rectangle.color)
      })
    },
    drawRectangle (context, start, end, color) {
      context.beginPath()
      context.strokeStyle = color
      context.lineWidth = 1.5
      context.moveTo(start.x, start.y)
      context.lineTo(start.x, end.y)
      context.lineTo(end.x, end.y)
      context.lineTo(end.x, start.y)
      context.closePath()
      context.stroke()
    },
    drawText (context, position, text) {
      context.strokeStyle = 'black'
      context.font = '16px serif'
      context.fillText(text, position.x + 4, position.y + 16)
    },
    drawCircles (data) {
      data.forEach((rectangle, index) => {
        this.drawText(this.taskCanvas.context, rectangle.start, index + 1)
        this.drawCircle(this.taskCanvas.context, rectangle.start, rectangle.end, rectangle.color)
      })
    },
    drawCircle (context, start, end, color) {
      const x = (start.x + end.x) / 2
      const y = (start.y + end.y) / 2
      const a = Math.abs(start.x - end.x) / 2
      const b = Math.abs(start.y - end.y) / 2
      const step = (a > b) ? 1 / a : 1 / b
      context.beginPath()
      context.strokeStyle = color
      context.moveTo(x + a, y)
      for (let i = 0; i < 2 * Math.PI; i += step) {
        context.lineTo(x + a * Math.cos(i), y + b * Math.sin(i))
      }
      context.closePath()
      context.stroke()
    },
    addReward (name) {
      this.tempData.rewardData.push({
        name: name,
        time: new Date() - this.tempData.time
      })
      this.showReward(name)
      this.processStack.push('reward')
    },
    showReward (name) {
      this.trophyShow = false
      this.medalShow = false
      if (name === 'trophy') {
        this.trophyShow = true
        setTimeout(() => {
          if (this.trophyShow) this.trophyShow = false
        }, 600)
      } else if (name === 'medal') {
        this.medalShow = true
        setTimeout(() => {
          if (this.medalShow) this.medalShow = false
        }, 600)
      }
    },
    record (name, callback, index) {
      const step = this.step[name].type === 'record' ? this.step[name] : this.step[name].rectangleRecord[index]
      if (step.state === 'usable') this.startRecord(step, callback, index)
      if (step.state === 'using') this.endRecord(step, callback, index)
    },
    startRecord (step, callback) {
      if (this.stepStart()) return
      this.startable = false
      step.state = 'loading'
      this.initRecordStepData(step)
      this.rec.open(() => this.recordable(step, callback), error => this.disrecordable(error, step))
    },
    endRecord (step) {
      this.startable = true
      this.recStop()
        .then(res => {
          step.recordData.duration = res.duration
          step.recordData.blobData = res.blob
          step.recordData.url = (window.URL || window.webkitURL).createObjectURL(res.blob)
          this.showSuccessMessage('录制成功')
        }, error => this.$message.error('录制失败' + error))
        .then(() => this.afterStepFinish(step))
    },
    recordable (step, callback) {
      this.clearCanvas(this.taskCanvas)
      callback && callback()
      this.showNotify(step.tips)
      this.counting(step).then(() => {
        this.currentStep = step
        this.tempData.time = new Date()
        this.wave = Recorder.WaveView({ elem: '.' + step.name })
        this.rec.start()
      })
    },
    disrecordable (error, step) {
      this.$message.error(error + ' 请确保录音设备正常后刷新浏览器')
      step.state = 'usable'
    },
    showRectangleCanvas (step, index) {
      this.convertImage(step.drawData[index])
      this.$nextTick(() => {
        this.initRectangleCanvas()
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
    select (name, recordName) {
      this.rectanglePlay = false
      const step = this.step[name]
      if (step.state === 'usable') this.startSelect(step, recordName)
      else this.endSelect(step)
    },
    startSelect (step, name) {
      if (this.stepStart()) return
      this.startable = false
      this.showNotify(step.tips)
      this.clearCanvas(this.taskCanvas)
      this.currentStep = step
      this.color = step.color
      this.initRecordStepData(this.step[name])
      step.state = 'using'
      step.drawData = []
      step.rectangleRecord.forEach(r => {
        if (r.recordData.url) (window.URL || window.webkitURL).revokeObjectURL(r.recordData.url)
      })
      step.rectangleRecord = []
    },
    endSelect (step) {
      this.startable = true
      this.showSuccessMessage('选取成功')
      this.afterStepFinish(step)
      step.rectangleRecord = step.drawData.map((rectangle, index) => {
        return {
          rectangleData: rectangle,
          name: step.name + 'Record' + index,
          type: 'rectangleRecord',
          state: 'usable',
          recordData: {
            blobData: null,
            url: null,
            duration: null
          },
          rewardData: [],
          drawData: [],
          tips: '优秀部分单字点评录制提示优秀部分单字点评录制提示优秀部分单字点评录制提示优秀部分单字点评录制提示'
        }
      })
    },
    play (event, step, drawCircles, showRectangleCanvas) {
      if (this.stepStart(event)) return
      this.startable = false
      this.clearCanvas(this.taskCanvas)
      const time = new Date()
      this.tempData.time = time
      drawCircles && drawCircles()
      showRectangleCanvas && showRectangleCanvas()
      const canvas = showRectangleCanvas ? this.rectangleCanvas : this.taskCanvas
      this.rectanglePlay = !!showRectangleCanvas
      this.$nextTick(() => {
        step.drawData.forEach(stroke => {
          let previousPosition = stroke[0].position
          stroke.forEach(point => {
            if (point.time <= event.target.currentTime * 1000) {
              this.drawLine(canvas.context, previousPosition, point.position, point.color)
              previousPosition = point.position
            } else {
              setTimeout(() => {
                if (this.tempData.time === time && !event.target.paused) {
                  this.drawLine(canvas.context, previousPosition, point.position, point.color)
                  previousPosition = point.position
                }
              }, point.time - event.target.currentTime * 1000)
            }
          })
        })
        step.rewardData.forEach(rewardData => {
          if (rewardData.time > event.target.currentTime * 1000) {
            setTimeout(() => {
              if (this.tempData.time === time && !event.target.paused) {
                this.tempData.rewardData.push(rewardData)
                this.showReward(rewardData.name)
              }
            }, rewardData.time - event.target.currentTime * 1000)
          } else this.tempData.rewardData.push(rewardData)
        })
      })
    },
    pause () {
      this.startable = !this.startable
    },
    end () {
      this.rectanglePlay = false
      this.startable = true
      this.tempData.rewardData = []
    },
    openPreviewMode () {
      this.previewModeState = !this.previewModeState
    },
    preview (time) {
      if (this.stepStart()) return
      this.clearCanvas(this.taskCanvas)
      this.previewData.state = !this.previewData.state
      let waitTime = 0
      Object.values(this.step).forEach(step => {
        if (step.type !== 'select') {
          if (step.recordData.blobData) {
            if (waitTime < time && waitTime + step.recordData.duration > time) {
              this.$refs[step.name].currentTime = (time - waitTime) / 1000
              this.$refs[step.name].play()
            } else {
              setTimeout(() => {
                this.$refs[step.name].play()
              }, waitTime)
            }
            waitTime = waitTime + step.recordData.duration + 500
          }
        } else {
          step.rectangleRecord.forEach(rectangleStep => {
            if (rectangleStep.recordData && rectangleStep.recordData.duration) {
              if (waitTime < time && waitTime + rectangleStep.recordData.duration > time) {
                this.$refs[rectangleStep.name][0].currentTime = (time - waitTime) / 1000
                this.$refs[rectangleStep.name][0].play()
              } else {
                setTimeout(() => {
                  this.$refs[rectangleStep.name][0].play()
                }, waitTime)
              }
              waitTime = waitTime + rectangleStep.recordData.duration + 500
            }
          })
        }
      })
    },
    stepStart (event) {
      if (!this.startable) {
        this.$message.error('请先结束当前播放或录制')
        event && event.target.pause()
        return 1
      }
      return 0
    },
    afterStepFinish (step) {
      this.currentStep = {}
      if (this.tempData.rewardData.length) step.rewardData = this.tempData.rewardData
      step.drawData = this.tempData.drawData
      this.tempData.drawData = []
      this.tempData.rewardData = []
      step.state = 'usable'
      this.processStack = []
    },
    deleteRectangle (step, index) {
      step.rectangleRecord = step.rectangleRecord.filter((rectangleData, i) => {
        return i !== index
      })
      step.drawData = step.drawData.filter((rectangleData, i) => {
        return i !== index
      })
      this.clearCanvas(this.taskCanvas)
      this.drawCircles(step.drawData)
    },
    withdraw () {
      const process = this.processStack.slice(-1)[0]
      this.processStack.pop()
      if (process === 'reward') this.tempData.rewardData.pop()
      else {
        this.tempData.drawData.pop()
        if (this.currentStep.type === 'select') {
          this.clearCanvas(this.taskCanvas)
          this.drawRectangles(this.tempData.drawData)
        } else if (this.currentStep.type === 'record') {
          this.clearCanvas(this.taskCanvas)
          let rectangleData = null
          if (this.currentStep.name === 'step3Record') rectangleData = this.step.step3Select.drawData
          if (this.currentStep.name === 'step4Record') rectangleData = this.step.step4Select.drawData
          rectangleData && this.drawRectangles(rectangleData)
          this.drawLines(this.taskCanvas.context, this.tempData.drawData)
        } else {
          this.initRectangleCanvas()
          this.drawLines(this.rectangleCanvas.context, this.tempData.drawData)
        }
      }
    },
    showNotify (message) {
      this.$notify.closeAll()
      this.$notify({
        title: '录制提示',
        message,
        duration: 15000,
        offset: 300,
        position: 'top-left'
      })
    },
    changeColor (color) {
      this.color = color
    },
    clearCanvas (canvas) {
      canvas.context.clearRect(0, 0, canvas.width, canvas.height)
      canvas.context.drawImage(canvas.image, 0, 0, canvas.width, canvas.height)
    },
    showSuccessMessage (message) {
      this.$message({
        message,
        type: 'success'
      })
    },
    timeUpdate (event) {
      this.testa += event.target.currentTime
    }
  },
  destroyed () {
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
          align-self: flex-start;
          width: 540px;
          min-height: 775px;
          .toolArea {
            height: 60px;
            border: 1px solid #EBEEF5;
            margin-bottom: 20px;
            border-radius: 20px;
            display: flex;
            flex-direction: row;
            align-items: center;
            section {
              display: flex;
              flex-direction: row;
              align-items: center;
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
                font-size: 25px;
              }
              .red {
                background-color: red;
              }
              .green {
                background-color: #40bf40;
              }
              .selected {
                border: 2px solid #30313330;
                box-shadow: 0px 0px 8px #303133;
              }
              .rewardIcon {
                background-color: #fcc640;
                color: #fff;
              }
              .backIcon {
                border: 1px solid #DCDFE6;
                border-radius: 0;
                color: #303133;
              }
            }
          }
          .canvas-wrapper {
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            .shake {
              position: absolute;
              .rewardIcon {
                display: none;
                background-color: #fcc640;
                color: #fff;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                box-sizing: border-box;
                line-height: 40px;
                text-align: center;
                font-size: 25px;
              }
              .animation{
                display: block;
                animation: shake 200ms linear;
                transform-origin: top center;
                animation-iteration-count: 3;
              }
            }
            .rectangleCanvas {
              position: absolute;
            }
          }
          .reward {
            margin: 10px;
            height: 55px;
            .item {
              margin: 10px;
              .rewardIcon {
                background-color: #fcc640;
                color: #fff;
                width: 35px;
                height: 35px;
                border-radius: 50%;
                box-sizing: border-box;
                line-height: 35px;
                text-align: center;
                font-size: 25px;
              }
            }
          }
          .player {
            box-sizing: border-box;
            margin: 10px;
            width: 480px;
            border-radius: 25px;
            background-color: #f1f3f4;
            height: 50px;
            display: flex;
            flex-direction: row;
            align-items: center;
            padding: 0 25px 0 12px;
            .icon {
              font-size: 30px;
            }
            .duration {
              padding: 0 15px 0 5px;
            }
            .slider {
              flex: 1;
            }
          }
        }
        .reviewProcess {
          width: 540px;
          height: 775px;
          padding-bottom: 0;
          .collapse {
            height: 698px;
            overflow-y: scroll;
            padding-bottom: 20px;
            .collapse-item-content {
              margin: 14px 0;
              display: flex;
              flex-direction: row;
              align-items: center;
              .totalScore {
                width: 70px;
                margin-right: 7px;
              }
              .el-button {
                width: 80px;
                padding: 12px;
                margin-right: 10px;
                text-align: center;
              }
              .tag {
                margin-right: 10px;
              }
            }
          }
        }
      }
    }
  }
  .card-header {
    display: flex;
    flex-direction: row;
    .title {
      flex: 1;
    }
  }
  .wave {
    height: 50px;
    width: 150px;
  }
  audio:focus {
    outline: none;
  }
  @keyframes shake {
    0% {
      transform: rotate(0deg) translate3d(0, 0, 0);
    }
    25% {
      transform: rotate(20deg) translate3d(0, 0, 0);
    }
    50% {
      transform: rotate(0deg) translate3d(0, 0, 0);
    }
    75% {
      transform: rotate(-20deg) translate3d(0, 0, 0);
    }
    100% {
      transform: rotate(0deg) translate3d(0, 0, 0);
    }
  }
</style>
