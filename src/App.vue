<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
import Element from 'element-ui'
import Vue from 'vue'
Vue.use(Element)
export default {
  name: 'App'
}
</script>

<style lang="scss">
  #app {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
</style>
