<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { preloadCriticalComponents } from './utils/componentLoader'

// Polyfill for requestIdleCallback
const requestIdleCallback =
  window.requestIdleCallback ||
  ((cb) => {
    const start = Date.now()
    return setTimeout(() => {
      cb({
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
      })
    }, 1)
  })

const authStore = useAuthStore()

onMounted(async () => {
  // Initialize authentication state from localStorage
  authStore.initAuth()

  // Preload critical components for faster navigation
  const preloadPromise = preloadCriticalComponents({
    Home: () => import('./views/Home.vue'),
    Dashboard: () => import('./views/Dashboard.vue'),
    FileUpload: () => import('./components/FileUpload.vue'),
  })

  // Don't wait for preloading to complete, let it happen in background
  // This ensures the app is ready faster
  preloadPromise
    .then((results) => {
      const successCount = results.filter(Boolean).length
      const totalCount = results.length
      if (successCount < totalCount) {
        console.info(`Preloaded ${successCount}/${totalCount} critical components`)
      }
    })
    .catch((error) => {
      console.warn('Failed to preload some components:', error)
    })

  // Prefetch likely-needed resources using idle callback
  requestIdleCallback(() => {
    // Prefetch other views that might be needed
    Promise.all([
      import('./views/Login.vue').catch(() => null),
      import('./components/FileManager.vue').catch(() => null)
    ]).then(() => {
      console.debug('Additional components prefetched')
    })
  })
})
</script>

<style scoped>
#app {
  width: 100%;
  height: 100%;
}
</style>
