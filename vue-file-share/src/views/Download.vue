<template>
  <div class="min-h-screen bg-gray-50 py-12">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-2 text-gray-600">Checking file...</p>
      </div>

      <!-- File Info -->
      <div v-else-if="fileStatus" class="bg-white rounded-lg shadow p-8">
        <div class="text-center mb-8">
          <svg
            class="mx-auto h-16 w-16 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h1 class="mt-4 text-2xl font-bold text-gray-900">File Download</h1>
        </div>

        <div v-if="fileStatus.valid" class="space-y-6">
          <!-- File Details -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h2 class="text-lg font-medium text-gray-900 mb-3">File Information</h2>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">File Name:</span>
                <span class="font-medium">{{ fileStatus.fileName }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">File Size:</span>
                <span class="font-medium">{{ formatFileSize(fileStatus.fileSize) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Downloads:</span>
                <span class="font-medium">{{ fileStatus.downloadCount }}</span>
              </div>
              <div v-if="fileStatus.expiresAt" class="flex justify-between">
                <span class="text-gray-600">Expires:</span>
                <span class="font-medium">{{ formatDate(fileStatus.expiresAt) }}</span>
              </div>
            </div>
          </div>

          <!-- Download Button -->
          <div class="text-center">
            <button
              class="bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 rounded-lg text-lg font-medium transition-colors flex items-center justify-center space-x-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="isDownloading"
              @click="downloadFile"
            >
              <ArrowDownTrayIcon v-if="!isDownloading" class="h-5 w-5" />
              <div
                v-if="isDownloading"
                class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"
              ></div>
              <span>{{ isDownloading ? 'Downloading...' : 'Download File' }}</span>
            </button>
          </div>

          <!-- Download Progress -->
          <div v-if="isDownloading" class="mt-6">
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-medium text-gray-700">Download Progress</span>
                <span class="text-sm text-gray-500">{{ downloadProgress }}%</span>
              </div>

              <!-- Progress Bar -->
              <div class="w-full bg-gray-200 rounded-full h-3">
                <div
                  class="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                  :style="{ width: downloadProgress + '%' }"
                ></div>
              </div>

              <!-- Download Stats -->
              <div class="flex justify-between text-xs text-gray-500 mt-2">
                <span
                  >{{ formatFileSize(downloadedBytes) }} / {{ formatFileSize(totalBytes) }}</span
                >
                <span v-if="downloadSpeed > 0">{{ formatFileSize(downloadSpeed) }}/s</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Invalid File -->
        <div v-else class="text-center">
          <svg
            class="mx-auto h-16 w-16 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h2 class="mt-4 text-xl font-medium text-red-900">File Not Available</h2>
          <p class="mt-2 text-gray-600">
            This file may have expired, been removed, or the download link is invalid.
          </p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-white rounded-lg shadow p-8 text-center">
        <svg
          class="mx-auto h-16 w-16 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h2 class="mt-4 text-xl font-medium text-red-900">Error</h2>
        <p class="mt-2 text-gray-600">{{ error }}</p>
        <button
          class="mt-4 bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 rounded-md transition-colors flex items-center space-x-1 mx-auto"
          @click="checkFile"
        >
          <ArrowPathIcon class="h-4 w-4" />
          <span>Try Again</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useFilesStore } from '../stores/files'
import { useToast } from '../composables/useToast'
import { ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const filesStore = useFilesStore()
const { success, error: showError } = useToast()

const isLoading = ref(true)
const isDownloading = ref(false)
const fileStatus = ref(null)
const error = ref('')
const downloadProgress = ref(0)
const downloadedBytes = ref(0)
const totalBytes = ref(0)
const downloadSpeed = ref(0)

let downloadStartTime = 0
let lastProgressTime = 0
let lastDownloadedBytes = 0

const token = route.params.token

onMounted(() => {
  checkFile()
})

const checkFile = async () => {
  try {
    isLoading.value = true
    error.value = ''
    fileStatus.value = await filesStore.getPublicFileStatus(token)
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to check file status'
  } finally {
    isLoading.value = false
  }
}

const downloadFile = async () => {
  try {
    isDownloading.value = true
    downloadProgress.value = 0
    downloadedBytes.value = 0
    totalBytes.value = 0
    downloadSpeed.value = 0

    downloadStartTime = Date.now()
    lastProgressTime = downloadStartTime
    lastDownloadedBytes = 0

    await filesStore.downloadFileWithProgress(token, (progressData) => {
      downloadProgress.value = progressData.progress
      downloadedBytes.value = progressData.loaded
      totalBytes.value = progressData.total

      // Calculate download speed
      const currentTime = Date.now()
      const timeDiff = currentTime - lastProgressTime

      if (timeDiff > 500) {
        // Update speed every 500ms
        const bytesDiff = progressData.loaded - lastDownloadedBytes
        downloadSpeed.value = Math.round((bytesDiff / timeDiff) * 1000) // bytes per second
        lastProgressTime = currentTime
        lastDownloadedBytes = progressData.loaded
      }
    })

    success('File downloaded successfully!')

    // Reset progress after a delay
    setTimeout(() => {
      downloadProgress.value = 0
      downloadedBytes.value = 0
      totalBytes.value = 0
      downloadSpeed.value = 0
    }, 2000)

    // Refresh file status to update download count
    await checkFile()
  } catch (err) {
    showError('Download failed: ' + (err.message || 'Unknown error'))
  } finally {
    isDownloading.value = false
  }
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}
</script>
