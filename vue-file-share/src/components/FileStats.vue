<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
        <svg
          class="w-6 h-6 text-blue-600"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 17v-6h13M9 11V5h13M3 17h.01M3 11h.01M3 5h.01"
          />
        </svg>
        File Statistics
      </h2>
      <button
        class="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
        @click="refreshStats"
      >
        Refresh
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center py-12">
      <div
        class="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"
      ></div>
      <p class="text-gray-600 mt-3">Loading statistics...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12">
      <p class="text-red-600 font-medium">{{ error }}</p>
      <button
        class="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        @click="refreshStats"
      >
        Try Again
      </button>
    </div>

    <!-- Stats -->
    <div v-else-if="stats" class="grid grid-cols-2 md:grid-cols-4 gap-6">
      <!-- Total Files -->
      <div
        class="flex flex-col items-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-sm transform hover:-translate-y-1 transition duration-200"
      >
        <svg
          class="w-8 h-8 text-blue-600 mb-2 animate-pulse"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M4 4v16c0 .55.45 1 1 1h14c.55 0 1-.45 1-1V8l-6-4H5c-.55 0-1 .45-1 1z"
          />
        </svg>
        <h3 class="text-sm font-medium text-blue-800">Total Files</h3>
        <p class="text-2xl font-extrabold text-blue-900 mt-1">{{ stats.total_files || 0 }}</p>
      </div>

      <!-- Downloads -->
      <div
        class="flex flex-col items-center bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 shadow-sm transform hover:-translate-y-1 transition duration-200"
      >
        <svg
          class="w-8 h-8 text-green-600 mb-2 animate-bounce"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 4h16v12H4zM4 16l8 4 8-4" />
        </svg>
        <h3 class="text-sm font-medium text-green-800">Total Downloads</h3>
        <p class="text-2xl font-extrabold text-green-900 mt-1">{{ stats.total_downloads || 0 }}</p>
      </div>

      <!-- Storage -->
      <div
        class="flex flex-col items-center bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 shadow-sm transform hover:-translate-y-1 transition duration-200"
      >
        <svg
          class="w-8 h-8 text-purple-600 mb-2 animate-spin-slow"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 20h9M3 20h9M4 4h16v12H4z" />
        </svg>
        <h3 class="text-sm font-medium text-purple-800">Storage Used</h3>
        <p class="text-2xl font-extrabold text-purple-900 mt-1">
          {{ formatBytes(stats.total_bytes || 0) }}
        </p>
      </div>

      <!-- Expired -->
      <div
        class="flex flex-col items-center bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 shadow-sm transform hover:-translate-y-1 transition duration-200"
      >
        <svg
          class="w-8 h-8 text-red-600 mb-2 animate-ping"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 9v2m0 4h.01M10.29 3.86l-7.1 12.27a1 1 0 00.86 1.49h14.2a1 1 0 00.86-1.49l-7.1-12.27a1 1 0 00-1.72 0z"
          />
        </svg>
        <h3 class="text-sm font-medium text-red-800">Expired Files</h3>
        <p class="text-2xl font-extrabold text-red-900 mt-1">{{ stats.expired_files || 0 }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'

const loading = ref(false)
const error = ref(null)
const stats = ref(null)

const refreshStats = async () => {
  loading.value = true
  error.value = null
  try {
    const res = await api.get('/user/stats')
    const data = res.data
    stats.value = data.stats
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

onMounted(refreshStats)

defineExpose({ refreshStats })
</script>

<style>
/* custom slow spin */
.animate-spin-slow {
  animation: spin 5s linear infinite;
}
</style>
