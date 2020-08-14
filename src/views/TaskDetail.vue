<template>
  <div class="taskDetail">
    <div style="font-family: handwritting;color: white">.</div>
    <el-card class="box-card" v-loading="loading" >
      <div slot="header" class="header">
        <div @click="copyToClip">
          <span class="section title">作业评教</span>
          <span class="section">{{worksData.schoolName}}</span>
          <span class="section">{{worksData.gradeName + worksData.className}}</span>
          <span class="section">{{worksData.userName}}</span>
          <span class="section">{{worksData.title}} </span>
        </div>
        <div class="button-wrapper">
          <el-button v-if="false">评教下一个<i class="el-icon-arrow-right"></i></el-button>
          <el-button @click="finishRevise">完成评教<i class="el-icon-finished"></i></el-button>
        </div>
      </div>
      <el-card shadow="hover" class="homeworkContent">
        <div slot="header">作业内容</div>
        <span>{{worksData.content}}</span>
      </el-card>
      <div class="main">
        <el-card class="reviewArea" shadow="hover">
          <div slot="header" class="card-header">
            <div class="title">评教区</div>
          </div>
          <transition name="el-zoom-in-top">
            <div class="toolArea" >
              <section v-if="false">
                <div class="title">颜色：</div>
                <div class="item red" :class="{selected: color === 'red'}" @click="changeColor('red')"></div>
                <div class="item green" :class="{selected: color === '#40bf40'}" @click="changeColor('#40bf40')"></div>
              </section>
              <section>
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
          </div>
        </el-card>
        <el-card class="reviewProcess" shadow="hover">
          <div slot="header" class="card-header">
            <div class="title">评教流程</div>
            <el-button v-if="false">保存<i class="el-icon-view"></i></el-button>
            <el-button @click="deleteWorks">删除作业</el-button>
          </div>
          <div class="title">步骤一 输入字并勾选对应字图片</div>
          <div class="content">
            <div v-for="(item, index) in characters" v-bind:key="index">
              {{index+1}}
              <el-input v-model="item.id" class="totalScore"></el-input>
              <el-button @click="selectCharacter(item)">{{item.state ? item.images.length ? '重新选取' : '开始选取' : '完成选取'}}</el-button>
              <i class="el-icon-delete deleteIcon" @click="deleteCharacter(index)"></i>
              <div class="images">
                <div class="item" v-for="(image, index) in item.images" v-bind:key="index">
                    <img :src="image.url" class="character">
                    <el-input type="number" v-model="image.score" class="totalScore"></el-input>分
                </div>
              </div>
            </div>
            <el-button @click="addCharacter">添加字</el-button>
          </div>
          <div class="title">步骤二 生成分数及批改痕迹</div>
          <div class="content">
            <el-button @click="generateTrack">生成</el-button>
            <div v-if="scoreDataPanelState">
              整体分数： {{totalScore}}
              <div v-for="(item, index) in characters" v-bind:key="index">
                {{index+1}}. {{item.id}} 平均分 {{item.score}}分
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </el-card>
  </div>
</template>

<script>
import tcb from 'tcb-js-sdk'
import router from '../router'
import canvs2Image from '../lib/canvas2Image'

export default {
  name: 'TaskDetail',
  data () {
    return {
      worksData: {
        worksID: null,
        studentName: null,
        courseTitle: null,
        chapterTitle: null,
        homeworkContent: null,
        works_url: null,
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
        drawable: null,
        state: ''
      },
      rectangleCanvas: {
        image: null,
        imageWidth: null,
        imageHeight: null,
        imageLeft: null,
        imageTop: null,
        width: null,
        height: null
      },
      loading: null,
      tempData: {
        count: null,
        drawData: [],
        rewardData: [],
        stroke: [],
        rectangle: {},
        position: {},
        time: null
      },
      characters: [],
      processStack: [],
      color: 'red',
      totalScore: 0,
      scoreData: {},
      scoreDataPanelState: false
    }
  },
  mounted () {
    this.init()
  },
  methods: {
    async init () {
      this.initRouter()
      this.initCloudAPP()
      await this.getTaskDetail()
      this.taskCanvas.context = this.$refs.taskCanvas.getContext('2d')
      this.initTaskCanvas()
    },
    initRouter () {
      if (!this.$route.query.worksID) {
        router.push({
          name: 'Login'
        })
      } else this.worksData.worksID = this.$route.query.worksID
    },
    initCloudAPP () {
      this.cloudAPP = tcb.init({ env: 'happy-writing-env-id' })
      this.cloudAPP.auth()
    },
    async getTaskDetail () {
      this.loading = true
      const getWorksDetail = await this.cloudAPP.callFunction({
        name: 'getWorksDetail',
        data: { worksID: this.worksData.worksID }
      })
      this.loading = false
      Object.assign(this.worksData, getWorksDetail.result.works)
      this.characters = this.worksData.correct_data.characters ? this.worksData.correct_data.characters : []
    },
    initTaskCanvas () {
      this.loading = true
      const taskCanvas = this.taskCanvas
      taskCanvas.image = new Image()
      taskCanvas.image.setAttribute('crossOrigin', 'anonymous')
      taskCanvas.image.src = this.worksData.works_url
      taskCanvas.image.onload = () => {
        taskCanvas.width = 480
        taskCanvas.height = taskCanvas.image.height * 480 / taskCanvas.image.width
        this.$nextTick(() => {
          taskCanvas.context.drawImage(taskCanvas.image, 0, 0, taskCanvas.width, taskCanvas.height)
          this.loading = false
        })
      }
    },
    initRectangleCanvas () {
      const rectangleCanvas = this.rectangleCanvas
      rectangleCanvas.context.drawImage(this.taskCanvas.image, rectangleCanvas.imageLeft, rectangleCanvas.imageTop, rectangleCanvas.imageWidth, rectangleCanvas.imageHeight, 0, 0, rectangleCanvas.width, rectangleCanvas.height)
    },
    convertImage (rectangleData) {
      this.rectangleCanvas.imageWidth = Math.round(Math.abs(rectangleData.end.x - rectangleData.start.x) * this.taskCanvas.image.height / this.taskCanvas.height)
      this.rectangleCanvas.imageHeight = Math.round(Math.abs(rectangleData.end.y - rectangleData.start.y) * this.taskCanvas.image.width / this.taskCanvas.width)
      this.rectangleCanvas.imageLeft = Math.round(this.taskCanvas.image.width * rectangleData.start.x / this.taskCanvas.width)
      this.rectangleCanvas.imageTop = Math.round(this.taskCanvas.image.height * rectangleData.start.y / this.taskCanvas.height)
      this.rectangleCanvas.width = this.rectangleCanvas.imageWidth
      this.rectangleCanvas.height = this.rectangleCanvas.imageHeight
    },
    canvasMouseDown (e, canvas) {
      if (canvas.state) {
        canvas.drawable = true
        const position = { x: e.offsetX, y: e.offsetY }
        this.tempData.position = position
        if (canvas.state === 'stroke') {
          this.tempData.stroke.push({
            position,
            time: new Date() - this.tempData.time,
            color: this.color
          })
        } else if (canvas.state === 'select') {
          this.tempData.rectangle.start = position
          this.tempData.rectangle.color = this.color
        }
      }
    },
    canvasMouseMove (e, canvas) {
      if (canvas.state && canvas.drawable) {
        const position = { x: e.offsetX, y: e.offsetY }
        if (canvas.state === 'stroke') {
          this.drawLineAndSaveItData(canvas.context, this.tempData.position, position, this.tempData.time)
        } else if (canvas.state === 'select') {
          this.drawRectangleWhenMouseMove(canvas, position)
        }
        this.tempData.position = position
      }
    },
    canvasMouseUp (e, canvas) {
      if (canvas.state && canvas.drawable) {
        canvas.drawable = false
        const position = { x: e.offsetX, y: e.offsetY }
        if (canvas.state === 'stroke') {
          this.drawLineAndSaveItData(canvas.context, this.tempData.position, position, this.tempData.time)
          this.tempData.drawData.push(this.tempData.stroke)
          this.tempData.stroke = []
          this.processStack.push('stroke')
        } else if (canvas.state === 'select') {
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
      context.lineWidth = 4
      context.moveTo(start.x, start.y)
      context.lineTo(end.x, end.y)
      context.stroke()
      context.closePath()
    },
    drawRectangleWhenMouseMove (canvas, end) {
      this.clearCanvas(canvas)
      this.drawRectangles(this.tempData.drawData)
      this.drawRectangle(canvas.context, this.tempData.rectangle.start, end, this.tempData.rectangle.color)
    },
    drawRectangles (data) {
      data.forEach((rectangle, index) => {
        this.drawRectangle(this.taskCanvas.context, rectangle.start, rectangle.end, rectangle.color)
      })
    },
    drawRectangle (context, start, end, color) {
      context.beginPath()
      context.strokeStyle = color
      context.lineWidth = 2
      context.moveTo(start.x, start.y)
      context.lineTo(start.x, end.y)
      context.lineTo(end.x, end.y)
      context.lineTo(end.x, start.y)
      context.closePath()
      context.stroke()
    },
    drawText (context, position, text) {
      context.fillStyle = '#ff0000'
      context.font = 'italic normal normal 60px handwritting'
      context.fillText(text, position.x, position.y)
    },
    drawCircles (data) {
      data.forEach((rectangle, index) => {
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
    clearCanvas (canvas) {
      this.scoreDataPanelState = false
      canvas.context.clearRect(0, 0, canvas.width, canvas.height)
      canvas.context.drawImage(canvas.image, 0, 0, canvas.width, canvas.height)
    },
    addCharacter () {
      this.characters.push({
        id: '',
        score: null,
        images: [],
        state: true
      })
      this.clearCanvas(this.taskCanvas)
    },
    selectCharacter (character) {
      if (character.state) {
        character.state = false
        this.taskCanvas.state = 'select'
        this.clearCanvas(this.taskCanvas)
        character.images = []
      } else {
        this.processStack = []
        character.state = true
        this.taskCanvas.state = ''
        this.tempData.drawData.map(async (rectangle, index) => {
          this.convertImage(rectangle)
          this.$set(rectangle, 'url', canvs2Image(this.taskCanvas.image, JSON.parse(JSON.stringify(this.rectangleCanvas))))
          this.$set(rectangle, 'score', '')
          character.images.push(rectangle)
        })
        this.tempData.drawData = []
        this.clearCanvas(this.taskCanvas)
      }
    },
    withdraw () {
      if (this.processStack.pop() === 'rectangle') {
        this.tempData.drawData.pop()
        this.clearCanvas(this.taskCanvas)
        this.drawRectangles(this.tempData.drawData)
      }
    },
    deleteCharacter (index) {
      if (this.characters[index].state) {
        this.clearCanvas(this.taskCanvas)
        this.characters.splice(index, 1)
      } else this.$message.error('请先结束当前选取')
    },
    generateTrack () {
      let state = this.characters.length
      if (state) {
        this.characters.forEach(character => {
          state = state && character.state
        })
        if (state) {
          if (this.scoreState() && this.characters.length) {
            this.clearCanvas(this.taskCanvas)
            this.totalScore = 0
            let totalScore = 0
            this.characters.forEach(character => {
              let score = 0
              character.images.forEach(image => {
                const icon = new Image()
                icon.setAttribute('crossOrigin', 'anonymous')
                icon.src = image.score < 80 ? './x.png' : './v.png'
                const offset = image.score < 80 ? 24 : 30
                icon.onload = () => {
                  this.taskCanvas.context.drawImage(icon, image.end.x - offset, image.end.y - offset, icon.width, icon.height)
                }
                score += image.score - 0
              })
              character.score = this.$set(character, 'score', Math.floor(score / character.images.length))
              totalScore = totalScore + character.score
            })
            this.totalScore = Math.floor(totalScore / this.characters.length)
            const icon = new Image()
            icon.setAttribute('crossOrigin', 'anonymous')
            icon.src = './pin.png'
            icon.onload = () => {
              this.taskCanvas.context.drawImage(icon, this.taskCanvas.width - 120, 20, icon.width, icon.height)
              this.drawText(this.taskCanvas.context, { x: this.taskCanvas.width - 110, y: 90 }, this.totalScore)
            }
            this.scoreDataPanelState = true
          } else this.$message.error('请填写所选字的具体信息')
        } else this.$message.error('请先结束当前选取')
      } else this.$message.error('请先选取具体字')
    },
    scoreState () {
      let state = this.characters.length
      this.characters.forEach(character => {
        state = state && character.id
        character.images.forEach(image => {
          state = state && image.score
        })
      })
      return state
    },
    async finishRevise () {
      this.loading = true
      this.worksData.correct_data.characters = JSON.parse(JSON.stringify(this.characters))
      await new Promise(resolve => this.$refs[this.taskCanvas.name].toBlob(async blob => {
        const correctImage = await this.cloudAPP.uploadFile({
          cloudPath: `works/${this.worksData.task_id}-${this.worksData.user_id}-${this.worksData.type}-correct.png`,
          filePath: blob
        })
        this.worksData.correct_data.correct_works_fileID = correctImage.fileID
        this.worksData.correct_data.score = this.totalScore
        this.worksData.submit_date = new Date()
        await Promise.all(this.worksData.correct_data.characters.map(async character => {
          await Promise.all(character.images.map(async (image, index) => {
            const uploadImage = await this.cloudAPP.uploadFile({
              cloudPath: `works/${this.worksData.task_id}-${this.worksData.user_id}-${this.worksData.type}-${character.id}-${index}.png`,
              filePath: this.dataURLtoBlob(image.url)
            })
            image.fileID = uploadImage.fileID
            delete image.url
          }))
        }))
        console.log(this.worksData.correct_data)
        await this.cloudAPP.callFunction({
          name: 'reviseWorks',
          data: {
            correct_data: this.worksData.correct_data,
            works_id: this.worksData._id,
            correct_state: true
          }
        })
        if (this.worksData.message === true) {
          await this.cloudAPP.database().collection('message').add({
            type: 'finish',
            done: false,
            title: this.worksData.title,
            open_id: this.worksData._openid,
            works_type: this.worksData.type
          })
        }
        resolve()
      }))
      this.loading = false
    },
    dataURLtoBlob (dataurl) {
      const arr = dataurl.split(',')
      const mime = arr[0].match(/:(.*?);/)[1]
      const bstr = atob(arr[1])
      let n = bstr.length
      const u8arr = new Uint8Array(n)
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
      }
      return new Blob([u8arr], { type: mime })
    },
    deleteWorks () {
      this.$confirm('此操作将删除该作业, 是否继续？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        center: true
      }).then(async action => {
        this.loading = true
        try {
          await this.cloudAPP.database().collection('works').doc(this.worksData._id).remove()
          this.$message('删除成功')
          if (this.worksData.message === true) {
            await this.cloudAPP.database().collection('message').add({
              type: 'delete',
              done: false,
              title: this.worksData.title,
              open_id: this.worksData._openid,
              works_type: this.worksData.type
            })
          }
          setTimeout(() => {
            this.$router.go(-1)
          }, 1000)
        } catch (e) {
          this.$message.error('删除失败')
        }
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消删除'
        })
      })
    },
    copyToClip () {
      const aux = document.createElement('input')
      aux.setAttribute('value', `${this.worksData.schoolName}\t${this.worksData.gradeName}${this.worksData.className}\t${this.worksData.userName}\t${this.worksData.title}`)
      document.body.appendChild(aux)
      aux.select()
      document.execCommand('copy')
      document.body.removeChild(aux)
      this.$message('复制成功')
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
          margin-right: 30px;
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
              border: 1px solid black;
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
          height: 900px;
          padding-bottom: 0;
          overflow-y: scroll;
          .deleteIcon {
            border: 1px solid #DCDFE6;
            padding: 10px;
            border-radius: 4px;
          }
          .images {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: space-between;
            .item {
              display: flex;
              flex-direction: row;
              align-items: center;
              flex: 1;
              .character {
                width: 60px;
                height: 60px;
                margin-right: 20px;
                margin-bottom: 20px;
                object-fit: cover;
              }
            }
          }
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
