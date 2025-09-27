<template>
  <div class="space-y-4">
    <!-- File Actions Row -->
    <div
      class="flex items-center justify-between p-4 rounded-xl backdrop-blur-md bg-white/70 border border-gray-200 shadow-sm"
    >
      <div class="flex items-center gap-3">
        <button
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-red-500 to-pink-600 shadow hover:from-red-600 hover:to-pink-700 transition disabled:opacity-40"
          :disabled="!validSelectedFiles.length"
          @click="confirmDelete"
        >
          <TrashIcon class="h-4 w-4" />
          Delete ({{ validSelectedFiles.length }})
        </button>
      </div>
      <div class="text-sm text-gray-600">
        {{ validSelectedFiles.length }} of {{ files.length }} files selected
      </div>
    </div>

    <!-- Files List -->
    <div class="space-y-3">
      <div
        v-for="file in files"
        :key="file.token"
        class="flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm bg-white/80 shadow-sm hover:shadow-md transition"
        :class="{
          'border-blue-300 bg-blue-50/60':
            selectedFiles.includes(file.token) && !isFileExpired(file),
          'border-red-300 bg-red-50/70': isFileExpired(file),
          'border-gray-200': !selectedFiles.includes(file.token) && !isFileExpired(file),
        }"
      >
        <!-- Checkbox -->
        <input
          type="checkbox"
          :checked="selectedFiles.includes(file.token)"
          :disabled="isFileExpired(file)"
          class="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300"
          :class="{ 'opacity-50 cursor-not-allowed': isFileExpired(file) }"
          @change="toggleFileSelection(file.token)"
        />

        <!-- File Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <h3
              class="text-sm font-semibold truncate"
              :class="isFileExpired(file) ? 'text-red-600' : 'text-gray-900'"
            >
              {{ file.file }}
              <span
                v-if="isFileExpired(file)"
                class="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium"
              >
                EXPIRED
              </span>
            </h3>
            <div class="flex items-center gap-3 text-xs text-gray-500">
              <span>{{ file.downloads }} downloads</span>
              <span>{{ formatBytes(file.fileSize) }}</span>
            </div>
          </div>

          <div class="mt-1 flex items-center justify-between">
            <div class="flex flex-wrap gap-4 text-xs text-gray-500">
              <span v-if="file.remainingDownloads === '∞'"> Unlimited Download</span>
              <span v-else>{{ file.remainingDownloads }} Download(s) Left</span>
              <span
                >Expires: <span v-if="file.expiresAt">{{ formatDate(file.expiresAt) }}</span
                ><span v-else>Never</span></span
              >
              <span>Created: {{ formatDate(file.createdAt) }}</span>
            </div>

            <div class="flex items-center gap-2">
              <!-- Preview button for media files -->
              <button
                v-if="isPreviewable(file)"
                title="Preview file"
                :disabled="isFileExpired(file)"
                class="p-2 rounded-lg transition"
                :class="
                  isFileExpired(file)
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-purple-600 hover:text-purple-800 hover:bg-purple-50'
                "
                @click="!isFileExpired(file) && openPreview(file)"
              >
                <EyeIcon class="h-4 w-4" />
              </button>

              <button
                title="Download file"
                :disabled="isFileExpired(file)"
                class="p-2 rounded-lg transition"
                :class="
                  isFileExpired(file)
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                "
                @click="!isFileExpired(file) && downloadFile(file.token, file.file)"
              >
                <ArrowDownTrayIcon class="h-4 w-4" />
              </button>
              <button
                title="Copy download link"
                :disabled="isFileExpired(file)"
                class="p-2 rounded-lg transition"
                :class="
                  isFileExpired(file)
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                "
                @click="!isFileExpired(file) && copyDownloadLink(file.token, file.file)"
              >
                <LinkIcon class="h-4 w-4" />
              </button>
              <button
                title="View file statistics"
                class="p-2 rounded-lg text-green-600 hover:text-green-800 hover:bg-green-50 transition"
                @click="viewFileStats(file.token)"
              >
                <ChartBarIcon class="h-4 w-4" />
              </button>
              <button
                title="Delete permanently"
                :disabled="isFileExpired(file)"
                class="p-2 rounded-lg transition"
                :class="
                  isFileExpired(file)
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-red-600 hover:text-red-800 hover:bg-red-50'
                "
                @click="!isFileExpired(file) && deleteFile(file.token)"
              >
                <TrashIcon class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div
        class="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-5 border border-gray-200"
      >
        <div class="flex flex-col items-center text-center">
          <ExclamationTriangleIcon class="h-10 w-10 text-red-600 mb-3" />
          <h3 class="text-lg font-bold text-gray-900">Permanently Delete Files</h3>
          <p class="text-sm text-gray-600 mt-1">
            <span class="font-semibold">{{ filesToDelete.length }}</span> file(s) will be
            permanently deleted.
          </p>
          <p class="text-sm text-red-600 mt-2">
            This action cannot be undone. Files will be completely removed from storage.
          </p>
        </div>
        <div class="space-y-3">
          <button
            class="w-full px-4 py-2 rounded-lg text-white font-medium bg-gradient-to-r from-red-500 to-pink-600 shadow hover:from-red-600 hover:to-pink-700 transition"
            :disabled="deletingFiles"
            @click="executeDelete"
          >
            {{ deletingFiles ? 'Deleting...' : 'Permanently Delete' }}
          </button>
          <button
            class="w-full px-4 py-2 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
            :disabled="deletingFiles"
            :class="{ 'opacity-50 cursor-not-allowed': deletingFiles }"
            @click="cancelDelete"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- File Stats Modal -->
    <div
      v-if="showStatsModal"
      class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div
        class="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-6 border border-gray-200 space-y-6"
      >
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-bold text-gray-900">File Statistics</h3>
          <button
            class="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition"
            @click="showStatsModal = false"
          >
            <XMarkIcon class="h-5 w-5" />
          </button>
        </div>

        <div v-if="loadingStats" class="text-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p class="text-gray-600 mt-2">Loading statistics...</p>
        </div>

        <div v-else-if="fileStats" class="space-y-6">
          <!-- File info -->
          <div class="p-4 rounded-lg bg-gray-50 border border-gray-100">
            <h4 class="font-medium text-gray-900 mb-2">{{ fileStats.file.filename }}</h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span class="text-gray-500">Size:</span>
                <span class="font-medium">{{ formatBytes(fileStats.file.file_size) }}</span>
              </div>
              <div>
                <span class="text-gray-500">Downloads:</span>
                <span class="font-medium">{{ fileStats.stats.totalDownloads }}</span>
              </div>
              <div>
                <span class="text-gray-500">Unique IPs:</span>
                <span class="font-medium">{{ fileStats.stats.uniqueIPs }}</span>
              </div>
              <div>
                <span class="text-gray-500">Data:</span>
                <span class="font-medium">{{ formatBytes(fileStats.stats.totalBytes) }}</span>
              </div>
            </div>
          </div>

          <!-- Recent downloads -->
          <div>
            <h4 class="font-medium text-gray-900 mb-3">Recent Downloads</h4>
            <div
              class="p-4 rounded-lg bg-gray-50 border border-gray-100 max-h-64 overflow-y-auto space-y-2"
            >
              <div
                v-if="fileStats.recentDownloads.length === 0"
                class="text-gray-500 text-center py-4 text-sm"
              >
                No downloads yet
              </div>
              <div
                v-for="download in fileStats.recentDownloads"
                v-else
                :key="download.timestamp"
                class="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100 shadow-sm text-sm"
              >
                <div>
                  <span class="font-medium">{{ download.ip }}</span>
                  <span class="text-gray-500 ml-2">
                    {{ download.browserInfo?.browser }} on {{ download.browserInfo?.os }}
                  </span>
                </div>
                <div class="text-gray-400 text-xs">
                  {{ formatDate(download.timestamp) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <PreviewModal
      :show="showPreview"
      :file-token="selectedFile?.token || ''"
      :file-name="selectedFile?.file || ''"
      :mime-type="selectedFile?.mime || ''"
      @close="closePreview"
      @download="handlePreviewDownload"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useFilesStore } from '../stores/files'
import { filesAPI } from '../services/api'
import { useToast } from '../composables/useToast'
import PreviewModal from './PreviewModal.vue'
import {
  TrashIcon,
  LinkIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  EyeIcon,
} from '@heroicons/vue/24/outline'

const props = defineProps({
  files: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['refresh'])

const filesStore = useFilesStore()
const { showToast } = useToast()

const selectedFiles = ref([])
const showDeleteModal = ref(false)
const showStatsModal = ref(false)
const showPreview = ref(false)
const selectedFile = ref(null)
const filesToDelete = ref([])
const deletingFiles = ref(false)
const fileStats = ref(null)
const loadingStats = ref(false)

// Computed property to get valid selected files (files that still exist and are not expired)
const validSelectedFiles = computed(() => {
  const existingTokens = props.files.map((f) => f.token)
  return selectedFiles.value.filter((token) => {
    const file = props.files.find((f) => f.token === token)
    return existingTokens.includes(token) && file && !isFileExpired(file)
  })
})

// Watch for changes in files prop and update selectedFiles accordingly
watch(
  () => props.files,
  (newFiles) => {
    const existingTokens = newFiles.map((f) => f.token)
    selectedFiles.value = selectedFiles.value.filter((token) => existingTokens.includes(token))
  },
)

const toggleFileSelection = (fileToken) => {
  // Find the file to check if it's expired
  const file = props.files.find((f) => f.token === fileToken)
  if (file && isFileExpired(file)) return // Don't allow selection of expired files

  const index = selectedFiles.value.indexOf(fileToken)
  if (index > -1) {
    selectedFiles.value.splice(index, 1)
  } else {
    selectedFiles.value.push(fileToken)
  }
}

const isFileExpired = (file) => {
  // Check if file has expired
  if (!file.expiresAt) return false
  return new Date(file.expiresAt) <= new Date()
}

const confirmDelete = () => {
  // Use valid selected files for deletion
  filesToDelete.value = [...validSelectedFiles.value]
  showDeleteModal.value = true
}

const cancelDelete = () => {
  showDeleteModal.value = false
  filesToDelete.value = []
}

const deleteFile = (fileToken) => {
  filesToDelete.value = [fileToken]
  showDeleteModal.value = true
  // Remove from selection if it was selected
  const index = selectedFiles.value.indexOf(fileToken)
  if (index > -1) {
    selectedFiles.value.splice(index, 1)
  }
}

const executeDelete = async () => {
  deletingFiles.value = true

  try {
    // Use the new bulk delete function from the files store (now defaults to permanent deletion)
    const result = await filesStore.bulkDeleteFiles(filesToDelete.value, true)

    const { summary, failedFiles } = result

    if (summary.deleted > 0) {
      showToast(`Successfully permanently deleted ${summary.deleted} file(s)`, 'success')
      // Clear selected files that were successfully deleted
      selectedFiles.value = selectedFiles.value.filter(
        (token) => !filesToDelete.value.includes(token),
      )
      emit('refresh')
    }

    if (summary.failed > 0) {
      console.error('Some deletions failed:', failedFiles)
      const failedMessages = failedFiles.map((f) => f.error).join(', ')
      showToast(`Failed to delete ${summary.failed} file(s): ${failedMessages}`, 'error')
    }

    if (summary.deleted === 0 && summary.failed > 0) {
      showToast('All deletion attempts failed', 'error')
    }
  } catch (error) {
    showToast(`Delete failed: ${error.message}`, 'error')
  } finally {
    deletingFiles.value = false
    showDeleteModal.value = false
    filesToDelete.value = []
  }
}

const viewFileStats = async (fileToken) => {
  if (!selectedFiles.value.includes(fileToken)) {
    selectedFiles.value = [fileToken]
  }

  loadingStats.value = true
  showStatsModal.value = true
  fileStats.value = null

  try {
    const response = await filesAPI.getFileStats(fileToken)
    fileStats.value = response.data
  } catch (error) {
    showToast(`Failed to load statistics: ${error.message}`, 'error')
    showStatsModal.value = false
  } finally {
    loadingStats.value = false
  }
}

const copyDownloadLink = async (token, filename) => {
  try {
    const downloadUrl = `${window.location.origin}/r/${token}`
    await navigator.clipboard.writeText(downloadUrl)
    showToast(`Download link copied for ${filename}`, 'success')
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    showToast('Failed to copy link to clipboard', 'error')
  }
}

const downloadFile = (token, filename) => {
  const downloadUrl = `${window.location.origin}/r/${token}`
  window.open(downloadUrl, '_blank')
  showToast(`Opening download for ${filename}`, 'info')
}

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown'
  return new Date(dateString).toLocaleString()
}

// Preview functionality
const isPreviewable = (file) => {
  if (!file.mime) return false
  return (
    file.mime.startsWith('image/') ||
    file.mime.startsWith('video/') ||
    file.mime.startsWith('audio/')
  )
}

const openPreview = (file) => {
  selectedFile.value = file
  showPreview.value = true
}

const closePreview = () => {
  showPreview.value = false
  selectedFile.value = null
}

const handlePreviewDownload = async (token) => {
  const file = props.files.find((f) => f.token === token)
  if (file) {
    downloadFile(token, file.file)
    closePreview()
  }
}
</script>
