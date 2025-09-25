<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { preloadCriticalComponents } from './utils/componentLoader'

const authStore = useAuthStore()

onMounted(() => {
  // Initialize authentication state from localStorage
  authStore.initAuth()

  // Preload critical components for faster navigation
  preloadCriticalComponents({
    Home: () => import('./views/Home.vue'),
    Dashboard: () => import('./views/Dashboard.vue'),
  })
})
</script>

<style scoped>
#app {
  width: 100%;
  height: 100%;
}
</style>
