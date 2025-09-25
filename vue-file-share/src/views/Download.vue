<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4"
  >
    <div class="w-full max-w-lg space-y-8">
      <!-- Loading -->
      <div v-if="isLoading" class="flex flex-col items-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
        <p class="mt-4 text-gray-600 font-medium">Checking file...</p>
      </div>

      <!-- File Card -->
      <div
        v-else-if="fileStatus"
        class="bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl p-8 border border-gray-100 animate-fadeIn"
      >
        <div class="flex flex-col items-center text-center mb-6">
          <ArrowDownTrayIcon class="h-12 w-12 text-blue-600 mb-3" />
          <h1 class="text-2xl font-extrabold text-gray-900">File Download</h1>
        </div>

        <!-- Valid File -->
        <div v-if="fileStatus.valid" class="space-y-8">
          <!-- File Info -->
          <div class="divide-y divide-gray-100">
            <div class="flex justify-between py-2 text-sm">
              <span class="flex items-center gap-1 text-gray-500">
                <DocumentTextIcon class="h-4 w-4" /> File
              </span>
              <span class="font-medium text-gray-900">{{ fileStatus.fileName }}</span>
            </div>
            <div class="flex justify-between py-2 text-sm">
              <span class="flex items-center gap-1 text-gray-500">
                <ArchiveBoxIcon class="h-4 w-4" /> Size
              </span>
              <span class="font-medium">{{ formatFileSize(fileStatus.fileSize) }}</span>
            </div>
            <div class="flex justify-between py-2 text-sm">
              <span class="flex items-center gap-1 text-gray-500">
                <ArrowDownTrayIcon class="h-4 w-4" /> Downloads
              </span>
              <span class="font-medium">{{ fileStatus.downloadCount }}</span>
            </div>
            <div v-if="fileStatus.expiresAt" class="flex justify-between py-2 text-sm">
              <span class="flex items-center gap-1 text-gray-500">
                <ClockIcon class="h-4 w-4" /> Expires
              </span>
              <span class="font-medium">{{ formatDate(fileStatus.expiresAt) }}</span>
            </div>
          </div>

          <!-- Download Button / Controls -->
          <div class="text-center">
            <div v-if="!isDownloading">
              <button
                class="px-8 py-3 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-md hover:from-blue-700 hover:to-purple-700 transition flex items-center justify-center gap-2"
                @click="downloadFile"
              >
                <ArrowDownTrayIcon class="h-5 w-5" />
                Download
              </button>
            </div>

            <div v-else class="space-y-4">
              <div class="flex justify-center gap-3">
                <button
                  v-if="!isPaused"
                  class="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center gap-1"
                  @click="pauseDownload"
                >
                  <PauseIcon class="h-4 w-4" /> Pause
                </button>
                <button
                  v-else
                  class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-1"
                  @click="resumeDownload"
                >
                  <PlayIcon class="h-4 w-4" /> Resume
                </button>
                <button
                  class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-1"
                  @click="stopDownload"
                >
                  <StopIcon class="h-4 w-4" /> Stop
                </button>
              </div>
              <p class="text-sm text-gray-600 text-center">
                {{
                  isPaused
                    ? 'Download paused - Resume to continue from current position'
                    : 'Downloading...'
                }}
              </p>
            </div>
          </div>

          <!-- Progress -->
          <div v-if="isDownloading" class="pt-4">
            <div class="flex justify-between text-xs font-medium text-gray-500 mb-2">
              <span>{{ formatFileSize(downloadedBytes) }} / {{ formatFileSize(totalBytes) }}</span>
              <span v-if="!isPaused && downloadSpeed > 0"
                >{{ formatFileSize(downloadSpeed) }}/s</span
              >
              <span v-if="isPaused" class="text-yellow-600 font-semibold">Paused</span>
            </div>
            <div class="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                class="h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
                :style="{ width: downloadProgress + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Invalid File -->
        <div v-else class="flex flex-col items-center text-center py-8">
          <XCircleIcon class="h-12 w-12 text-red-500 mb-3" />
          <h2 class="text-lg font-bold text-red-600">File Not Available</h2>
          <p class="text-gray-500 mt-2 text-sm">
            This file may have expired, been removed, or the link is invalid.
          </p>
        </div>
      </div>

      <!-- Error -->
      <div
        v-else
        class="bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl p-8 text-center border border-red-100"
      >
        <ExclamationCircleIcon class="h-12 w-12 text-red-500 mb-3 mx-auto" />
        <h2 class="text-lg font-bold text-red-600">Something went wrong</h2>
        <p class="mt-2 text-gray-500">{{ error }}</p>
        <button
          class="mt-4 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center gap-2 mx-auto"
          @click="checkFile"
        >
          <ArrowPathIcon class="h-4 w-4" /> Try Again
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
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ArchiveBoxIcon,
  ClockIcon,
  PauseIcon,
  PlayIcon,
  StopIcon,
  XCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const filesStore = useFilesStore()
const { success, error: showError } = useToast()

const isLoading = ref(true)
const isDownloading = ref(false)
const isPaused = ref(false)
const fileStatus = ref(null)
const error = ref('')
const downloadProgress = ref(0)
const downloadedBytes = ref(0)
const totalBytes = ref(0)
const downloadSpeed = ref(0)
const resumeData = ref(null) // Store resume data when paused

let downloadStartTime = 0
let lastProgressTime = 0
let lastDownloadedBytes = 0
let downloadAbortController = null

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

const downloadFile = async (useResume = false) => {
  try {
    isDownloading.value = true
    if (!useResume) {
      isPaused.value = false
      downloadProgress.value = 0
      downloadedBytes.value = 0
      totalBytes.value = 0
      downloadSpeed.value = 0
      resumeData.value = null
    }

    // Create new abort controller for this download
    if (typeof AbortController !== 'undefined') {
      downloadAbortController = new AbortController()
    } else {
      console.warn('AbortController is not supported in this browser')
      downloadAbortController = null
    }

    downloadStartTime = Date.now()
    lastProgressTime = downloadStartTime
    lastDownloadedBytes = useResume && resumeData.value ? resumeData.value.loaded : 0

    const startByte = useResume && resumeData.value ? resumeData.value.loaded : 0
    const chunks = useResume && resumeData.value ? resumeData.value.chunks : []

    await filesStore.downloadFileWithProgressResumable(
      token,
      (progressData) => {
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
      },
      downloadAbortController,
      startByte,
      chunks,
    )

    if (isDownloading.value && !isPaused.value) {
      success('File downloaded successfully!')
      resumeData.value = null

      // Reset progress after a delay
      setTimeout(() => {
        downloadProgress.value = 0
        downloadedBytes.value = 0
        totalBytes.value = 0
        downloadSpeed.value = 0
      }, 2000)

      // Refresh file status to update download count
      await checkFile()
    }
  } catch (err) {
    if (err.message === 'Download cancelled' && err.resumeData) {
      // Store resume data for later use
      resumeData.value = err.resumeData
      console.log('Download paused, resume data stored')
    } else if (err.message === 'Download cancelled') {
      console.log('Download was cancelled by user')
    } else {
      showError('Download failed: ' + (err.message || 'Unknown error'))
    }
  } finally {
    if (!isPaused.value) {
      isDownloading.value = false
      downloadAbortController = null
    }
  }
}

const pauseDownload = () => {
  // Abort the current download to trigger resume data storage
  if (downloadAbortController) {
    downloadAbortController.abort()
    downloadAbortController = null
  }

  isPaused.value = true
  downloadSpeed.value = 0
  success('Download paused - click Resume to continue from where you left off')
}

const resumeDownload = () => {
  // Resume the download from where it was paused
  isPaused.value = false
  downloadFile(true) // Pass true to indicate this is a resume
}

const stopDownload = () => {
  // Cancel the ongoing download request
  if (downloadAbortController) {
    downloadAbortController.abort()
    downloadAbortController = null
  }

  isDownloading.value = false
  isPaused.value = false
  downloadProgress.value = 0
  downloadedBytes.value = 0
  totalBytes.value = 0
  downloadSpeed.value = 0
  resumeData.value = null // Clear resume data
  showError('Download was cancelled')
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
