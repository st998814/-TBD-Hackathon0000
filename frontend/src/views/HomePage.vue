<template>
  <div class="home-page">
    <CityWalk />
  </div>
</template>

<script setup>
import CityWalk from '../components/CityWalk.vue'
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px 0;
}
</style>