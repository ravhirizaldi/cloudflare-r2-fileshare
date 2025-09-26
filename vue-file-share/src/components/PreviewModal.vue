<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0"
    role="dialog"
    aria-modal="true"
    style="
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
    "
    @contextmenu.prevent
    @dragstart.prevent
    @selectstart.prevent
  >
    <!-- Background overlay -->
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" @click="close"></div>

    <!-- Modal panel -->
    <div
      class="preview-modal relative w-full sm:max-w-4xl bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 animate-fadeIn overflow-hidden"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 id="modal-title" class="text-lg font-bold text-gray-900 flex items-center gap-2">
          <DocumentIcon class="h-5 w-5 text-blue-600" />
          Preview: <span class="truncate max-w-xs">{{ fileName }}</span>
        </h3>
        <div class="flex items-center gap-2">
          <!-- Download button -->
          <button
            :disabled="isDownloading"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium shadow hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition"
            @click="downloadFile"
          >
            <ArrowDownTrayIcon class="h-4 w-4" />
            <span>{{ isDownloading ? 'Downloading...' : 'Download' }}</span>
          </button>
          <!-- Close button -->
          <button
            class="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition"
            @click="close"
          >
            <XMarkIcon class="h-5 w-5" />
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="px-6 py-6 bg-gray-50/50 max-h-[80vh] overflow-y-auto">
        <!-- Loading -->
        <div
          v-if="isLoading || isContentLoading"
          class="flex flex-col items-center justify-center h-64 space-y-4"
        >
          <div
            class="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"
          ></div>
          <div class="text-center">
            <h3 class="text-sm font-medium text-gray-900">
              {{ isLoading ? 'Generating preview...' : 'Loading content...' }}
            </h3>
            <p class="text-xs text-gray-500 mt-1">
              {{
                isLoading
                  ? 'Please wait while we prepare your file'
                  : 'Loading media content, this may take a moment'
              }}
            </p>
          </div>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="flex flex-col items-center justify-center h-64 text-center">
          <ExclamationTriangleIcon class="h-12 w-12 text-red-500 mb-3" />
          <h3 class="text-base font-semibold text-gray-900">Preview failed</h3>
          <p class="mt-1 text-sm text-gray-500">{{ error }}</p>
          <button
            class="mt-4 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium shadow hover:from-blue-700 hover:to-purple-700 transition"
            @click="generatePreview"
          >
            Try again
          </button>
        </div>

        <!-- Preview content -->
        <div v-else-if="previewUrl" class="relative space-y-6">
          <!-- Image -->
          <div v-if="isImage" class="text-center relative">
            <img
              :src="previewUrl"
              :alt="fileName"
              class="max-h-[70vh] mx-auto rounded-xl shadow-lg select-none pointer-events-none"
              style="
                user-select: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
              "
              @load="onPreviewLoad"
              @error="onPreviewError"
              @loadstart="onLoadStart"
              @contextmenu.prevent
              @dragstart.prevent
              @selectstart.prevent
            />
            <!-- Invisible overlay to prevent right-click and interactions -->
            <div
              class="absolute inset-0 z-10 cursor-default"
              @contextmenu.prevent
              @dragstart.prevent
              @selectstart.prevent
              @mousedown.prevent
            >
              <!-- Subtle watermark -->
              <div
                class="absolute top-2 right-2 text-xs text-gray-400 opacity-50 pointer-events-none select-none"
              >
                Preview Only
              </div>
            </div>
          </div>

          <!-- Video -->
          <div v-else-if="isVideo" class="text-center relative">
            <video
              :src="previewUrl"
              controls
              preload="metadata"
              class="max-h-[70vh] mx-auto rounded-xl shadow-lg"
              style="
                user-select: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
              "
              controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
              disablePictureInPicture
              @load="onPreviewLoad"
              @error="onPreviewError"
              @loadstart="onLoadStart"
              @canplay="onPreviewLoad"
              @contextmenu.prevent
              @dragstart.prevent
              @selectstart.prevent
            ></video>
            <!-- Invisible overlay to prevent right-click (positioned to not block video controls) -->
            <div
              class="absolute inset-0 z-10 cursor-default pointer-events-none"
              style="padding-bottom: 60px"
              @contextmenu.prevent
              @dragstart.prevent
              @selectstart.prevent
            ></div>
          </div>

          <!-- Audio -->
          <div
            v-else-if="isAudio"
            class="max-w-md mx-auto bg-white/70 backdrop-blur-md p-6 rounded-xl shadow-lg text-center relative"
          >
            <MusicalNoteIcon class="h-12 w-12 text-blue-500 mx-auto mb-3" />
            <h4 class="text-base font-semibold text-gray-900 mb-3">{{ fileName }}</h4>
            <audio
              :src="previewUrl"
              controls
              preload="metadata"
              class="w-full"
              style="
                user-select: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
              "
              controlsList="nodownload"
              @loadedmetadata="onPreviewLoad"
              @error="onPreviewError"
              @loadstart="onLoadStart"
              @canplay="onPreviewLoad"
              @contextmenu.prevent
              @dragstart.prevent
              @selectstart.prevent
            ></audio>
            <!-- Invisible overlay to prevent right-click (positioned to not block audio controls) -->
            <div
              class="absolute inset-0 z-10 cursor-default pointer-events-none"
              style="padding-bottom: 40px"
              @contextmenu.prevent
              @dragstart.prevent
              @selectstart.prevent
            ></div>
          </div>

          <!-- Unsupported -->
          <div v-else class="flex flex-col items-center justify-center py-12 text-center">
            <DocumentIcon class="h-12 w-12 text-gray-400 mb-3" />
            <h3 class="text-sm font-semibold text-gray-900">Preview not available</h3>
            <p class="text-xs text-gray-500">This file type cannot be previewed</p>
          </div>

          <!-- Loading overlay while content loads -->
          <div
            v-if="isContentLoading"
            class="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-xl"
          >
            <div class="flex flex-col items-center space-y-2">
              <div
                class="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-600"
              ></div>
              <p class="text-sm text-gray-600">Loading content...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { filesAPI } from '../services/api'
import { useToast } from '../composables/useToast'
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  DocumentIcon,
  MusicalNoteIcon,
} from '@heroicons/vue/24/outline'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  fileToken: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['close', 'download'])

const { success, error: showError } = useToast()

// State
const isLoading = ref(false)
const isDownloading = ref(false)
const isContentLoading = ref(false)
const error = ref(null)
const previewUrl = ref(null)
const loadingTimeout = ref(null)

// Computed properties for file type detection
const isImage = computed(() => props.mimeType?.startsWith('image/'))
const isVideo = computed(() => props.mimeType?.startsWith('video/'))
const isAudio = computed(() => props.mimeType?.startsWith('audio/'))

const isPreviewable = computed(() => {
  return isImage.value || isVideo.value || isAudio.value
})

// Methods
const generatePreview = async () => {
  if (!props.fileToken) return

  // Clear any existing timeout
  if (loadingTimeout.value) {
    clearTimeout(loadingTimeout.value)
    loadingTimeout.value = null
  }

  isLoading.value = true
  isContentLoading.value = false
  error.value = null
  previewUrl.value = null

  try {
    const response = await filesAPI.generatePreview(props.fileToken)
    const { previewToken } = response.data

    // Generate preview URL
    previewUrl.value = filesAPI.getPreviewUrl(props.fileToken, previewToken)

    // Set content loading state for media files with timeout
    if (isImage.value || isVideo.value || isAudio.value) {
      isContentLoading.value = true

      // Set a timeout to prevent infinite loading (reduced to 8 seconds)
      loadingTimeout.value = setTimeout(() => {
        console.warn('Preview loading timeout for:', props.fileName)
        if (isContentLoading.value) {
          isContentLoading.value = false
          error.value = 'Preview loading timeout. The file might be too large or corrupted.'
          showError('Preview loading timeout')
        }
      }, 8000) // 8 second timeout

      // Simple fallback - just clear loading state after 2 seconds if events don't fire
      setTimeout(() => {
        if (isContentLoading.value && previewUrl.value) {
          isContentLoading.value = false
        }
      }, 2000) // Auto-clear after 2 seconds
    } else {
      // For non-media files, don't set content loading
      console.log('Non-media file, no content loading needed')
    }
  } catch (err) {
    const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message
    error.value = errorMessage
    showError(errorMessage)
  } finally {
    isLoading.value = false
  }
}

const onPreviewLoad = () => {
  // Clear timeout if preview loaded successfully
  if (loadingTimeout.value) {
    clearTimeout(loadingTimeout.value)
    loadingTimeout.value = null
  }

  // Preview loaded successfully
  isContentLoading.value = false
  error.value = null // Clear any previous errors
}

const onLoadStart = () => {
  console.log('Load start event for:', props.fileName)
}

const onPreviewError = (event) => {
  console.error('Preview error event triggered for:', props.fileName, event)

  // Clear timeout if preview failed
  if (loadingTimeout.value) {
    clearTimeout(loadingTimeout.value)
    loadingTimeout.value = null
    console.log('Cleared loading timeout due to error')
  }

  isContentLoading.value = false
  const errorMsg = 'Failed to load preview content. The file might be corrupted or unsupported.'
  error.value = errorMsg
  showError(errorMsg)
  console.error('Preview loading error:', event)
}

const downloadFile = async () => {
  isDownloading.value = true
  try {
    emit('download', props.fileToken)
    success('Download started')
  } catch {
    showError('Failed to start download')
  } finally {
    isDownloading.value = false
  }
}

const close = () => {
  // Clear any existing timeout
  if (loadingTimeout.value) {
    clearTimeout(loadingTimeout.value)
    loadingTimeout.value = null
  }

  previewUrl.value = null
  error.value = null
  isContentLoading.value = false
  isLoading.value = false
  emit('close')
}

// Prevent common keyboard shortcuts for saving/downloading
const handleKeydown = (event) => {
  // Prevent Ctrl+S (Save), Ctrl+Shift+S (Save As), Ctrl+A (Select All)
  if (event.ctrlKey || event.metaKey) {
    if (event.key === 's' || event.key === 'S' || event.key === 'a' || event.key === 'A') {
      event.preventDefault()
      event.stopPropagation()
      console.log('Prevented keyboard shortcut:', event.key)
      return false
    }
  }

  // Prevent F12 (Developer Tools), Ctrl+Shift+I (Developer Tools)
  if (event.key === 'F12' || (event.ctrlKey && event.shiftKey && event.key === 'I')) {
    event.preventDefault()
    event.stopPropagation()
    return false
  }
}

// Watch for show prop changes to generate preview
watch(
  () => props.show,
  (newValue) => {
    if (newValue && props.fileToken) {
      if (isPreviewable.value) {
        generatePreview()
      } else {
        // For non-previewable files, show error immediately
        error.value = 'This file type cannot be previewed'
        isLoading.value = false
        isContentLoading.value = false
      }
    } else if (!newValue) {
      // Clean up when modal is closed
      previewUrl.value = null
      error.value = null
      isContentLoading.value = false
      isLoading.value = false
    }
  },
)

// Check if file is previewable when component mounts
watch(
  () => props.mimeType,
  () => {
    if (!isPreviewable.value && props.show) {
      error.value = 'This file type cannot be previewed'
    }
  },
  { immediate: true },
)

// Add global keyboard event listener when modal is shown
watch(
  () => props.show,
  (newValue) => {
    if (newValue) {
      document.addEventListener('keydown', handleKeydown, true)
    } else {
      document.removeEventListener('keydown', handleKeydown, true)
    }
  },
)

// Cleanup on unmount
onMounted(() => {
  // Add event listener if modal is already shown
  if (props.show) {
    document.addEventListener('keydown', handleKeydown, true)
  }
})

onUnmounted(() => {
  // Clean up event listener
  document.removeEventListener('keydown', handleKeydown, true)
})
</script>

<style scoped>
/* Additional protection against content theft */
img,
video,
audio {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
  pointer-events: none;
}

/* Re-enable pointer events for video/audio controls */
video::-webkit-media-controls,
audio::-webkit-media-controls {
  pointer-events: auto;
}

/* Hide download button in video/audio controls */
video::-webkit-media-controls-download-button,
audio::-webkit-media-controls-download-button {
  display: none !important;
}

video::-webkit-media-controls-fullscreen-button {
  display: none !important;
}

/* Disable text selection globally in modal */
.preview-modal * {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

/* But allow text selection for error messages and buttons */
.preview-modal button,
.preview-modal .error-message {
  -webkit-user-select: auto;
  -moz-user-select: auto;
  -ms-user-select: auto;
  user-select: auto;
}
</style>
