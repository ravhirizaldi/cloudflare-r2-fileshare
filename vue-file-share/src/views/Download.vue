<template>
  <div
    class="min-h-screen flex items-start justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 pt-16 pb-28"
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

          <!-- Turnstile -->
          <div
            v-show="!isDownloading && (!showDownloadButton || turnstileLoading)"
            class="flex justify-center mb-4"
          >
            <div
              ref="turnstileRef"
              class="cf-turnstile"
              :style="{ display: turnstileLoading ? 'none' : 'block' }"
            ></div>

            <div v-if="turnstileLoading" class="flex items-center justify-center h-16">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span class="ml-2 text-sm text-gray-600">Loading security verification...</span>
            </div>

            <!-- Show processing state after Turnstile completion -->
            <div
              v-if="turnstileCompleted && !showDownloadButton"
              class="flex items-center justify-center h-16"
            ></div>
          </div>
          <div
            v-if="turnstileError && !isDownloading && !showDownloadButton"
            class="text-red-600 text-sm text-center font-medium mb-4"
          >
            {{ turnstileError }}
          </div>

          <!-- Download Button -->
          <div v-if="!isDownloading && showDownloadButton && !turnstileLoading" class="text-center">
            <button
              class="px-8 py-3 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-md hover:from-blue-700 hover:to-purple-700 transition flex items-center justify-center gap-2"
              @click="downloadFile"
            >
              <ArrowDownTrayIcon class="h-5 w-5" />
              Download
            </button>
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

    <!-- Sticky Footer -->
    <footer
      v-if="isDownloading"
      class="fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-md border-t border-gray-200 shadow-lg p-4"
    >
      <div class="max-w-5xl mx-auto flex items-center">
        <!-- Progress Area -->
        <div class="flex-1 pr-6">
          <div class="flex justify-between text-xs font-medium text-gray-500 mb-1">
            <span>{{ formatFileSize(downloadedBytes) }} / {{ formatFileSize(totalBytes) }}</span>
            <div class="flex gap-3">
              <span v-if="!isPaused && downloadSpeed > 0">
                {{ formatFileSize(downloadSpeed) }}/s
              </span>
              <span v-if="remainingBytes > 0"> {{ formatFileSize(remainingBytes) }} left </span>
            </div>
          </div>
          <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              class="h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
              :style="{ width: downloadProgress + '%' }"
            ></div>
          </div>
        </div>

        <!-- Control Buttons -->
        <div class="flex items-center gap-2">
          <button
            v-if="!isPaused"
            class="px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center gap-1 text-sm"
            @click="pauseDownload"
          >
            <PauseIcon class="h-4 w-4" /> Pause
          </button>
          <button
            v-else
            class="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-1 text-sm"
            @click="resumeDownload"
          >
            <PlayIcon class="h-4 w-4" /> Resume
          </button>
          <button
            class="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-1 text-sm"
            @click="stopDownload"
          >
            <StopIcon class="h-4 w-4" /> Stop
          </button>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useFilesStore } from '../stores/files'
import { useToast } from '../composables/useToast'
import { useTurnstile } from '../composables/useTurnstile'
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

// Turnstile integration
const {
  turnstileRef,
  isLoading: turnstileLoading,
  error: turnstileError,
  getToken,
  isTokenValid,
  resetTurnstile,
} = useTurnstile()

const showDownloadButton = ref(false)
const turnstileCompleted = ref(false)

const isLoading = ref(true)
const isDownloading = ref(false)
const isPaused = ref(false)
const fileStatus = ref(null)
const error = ref('')
const downloadProgress = ref(0)
const downloadedBytes = ref(0)
const totalBytes = ref(0)
const remainingBytes = ref(0)
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

// Watch for Turnstile completion and add delay for better UX
watch(
  () => isTokenValid(),
  (newValue) => {
    if (newValue && !turnstileCompleted.value) {
      turnstileCompleted.value = true
      // Add a small delay to show the Turnstile success animation
      setTimeout(() => {
        showDownloadButton.value = true
      }, 1500) // 1.5 second delay to see the animation
    } else if (!newValue) {
      // Reset states when token becomes invalid
      turnstileCompleted.value = false
      showDownloadButton.value = false
    }
  },
  { immediate: true },
)

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
  if (!isTokenValid()) {
    showError('Please complete the security verification')
    // Only reset if Turnstile is properly initialized
    if (!turnstileLoading.value && turnstileRef.value) {
      resetTurnstile()
    }
    return
  }

  try {
    isDownloading.value = true
    if (!useResume) {
      isPaused.value = false
      downloadProgress.value = 0
      downloadedBytes.value = 0
      totalBytes.value = 0
      remainingBytes.value = 0
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
        // Throttle UI updates to prevent excessive re-rendering
        const shouldUpdate = !downloadFile.lastUpdate || Date.now() - downloadFile.lastUpdate > 100

        if (shouldUpdate) {
          downloadFile.lastUpdate = Date.now()
          downloadProgress.value = progressData.progress
          downloadedBytes.value = progressData.loaded
          totalBytes.value = progressData.total
          remainingBytes.value = progressData.total - progressData.loaded

          // Calculate download speed (throttled)
          const currentTime = Date.now()
          const timeDiff = currentTime - lastProgressTime

          if (timeDiff > 1000) {
            // Update speed every 1000ms instead of 500ms to reduce overhead
            const bytesDiff = progressData.loaded - lastDownloadedBytes
            downloadSpeed.value = Math.round((bytesDiff / timeDiff) * 1000) // bytes per second
            lastProgressTime = currentTime
            lastDownloadedBytes = progressData.loaded
          }
        }
      },
      downloadAbortController,
      startByte,
      chunks,
      getToken(), // Add Turnstile token
    )

    if (isDownloading.value && !isPaused.value) {
      success('File downloaded successfully!')
      resumeData.value = null

      // Reset progress immediately to prevent UI lag
      isDownloading.value = false
      downloadProgress.value = 0
      downloadedBytes.value = 0
      totalBytes.value = 0
      remainingBytes.value = 0
      downloadSpeed.value = 0

      // Refresh file status to update download count (non-blocking)
      checkFile().catch(console.error)
    }
  } catch (err) {
    if (err.message === 'Download cancelled' && err.resumeData) {
      // Store resume data for later use
      resumeData.value = err.resumeData
    } else if (err.message === 'Download cancelled') {
      console.log('Download was cancelled by user')
    } else {
      showError('Download failed: ' + (err.message || 'Unknown error'))
    }
  } finally {
    if (!isPaused.value) {
      isDownloading.value = false
      downloadAbortController = null

      // Clear resume data to free memory
      if (!isPaused.value) {
        resumeData.value = null
      }
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
  remainingBytes.value = 0
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
