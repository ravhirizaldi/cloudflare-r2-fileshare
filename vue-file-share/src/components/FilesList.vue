<template>
  <div class="w-full">
    <!-- Loading State -->
    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-8">
      <div class="relative">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <div
          class="absolute inset-0 rounded-full h-12 w-12 border-2 border-blue-200 mx-auto animate-pulse"
        ></div>
      </div>
      <p class="mt-4 text-gray-600 font-medium">Loading files...</p>
      <div class="mt-2 w-32 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
        <div
          class="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-pulse"
        ></div>
      </div>
    </div>

    <!-- Files List -->
    <div v-else-if="filesList.length > 0" class="space-y-4">
      <div
        v-for="file in filesList"
        :key="file.token || file.id"
        class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <component
              :is="getFileIcon(file.mime, file.file || file.originalName)"
              :class="['h-10 w-10', getIconColor(file.mime)]"
            />
            <div>
              <h3 class="font-medium text-gray-900">
                {{ file.file || file.originalName }}
                <span
                  v-if="isFileExpired(file)"
                  class="ml-2 px-2 py-1 text-xs bg-red-100 text-red-600 rounded"
                >
                  EXPIRED
                </span>
              </h3>
              <div class="text-sm text-gray-500 space-y-1">
                <div class="flex items-center space-x-4">
                  <p v-if="file.size">{{ formatFileSize(file.size) }}</p>
                  <div v-if="file.mime" class="flex items-center space-x-1 relative group">
                    <span>{{ getShortMimeType(file.mime) }}</span>
                    <InformationCircleIcon class="h-3 w-3 text-gray-400 cursor-help" />
                    <div
                      class="absolute bottom-full left-0 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10"
                    >
                      {{ file.mime }}
                    </div>
                  </div>
                  <p v-if="file.createdAt">{{ formatDate(file.createdAt) }}</p>
                </div>
                <div class="flex items-center space-x-4">
                  <p v-if="file.expiresAt">Expires: {{ formatExpiryDisplay(file) }}</p>
                  <p v-else-if="file.expiresIn === 'never'">
                    <span class="text-green-600 font-medium">✨ Never expires</span>
                  </p>
                  <p v-else-if="file.expiresIn">Expires in: {{ file.expiresIn }}</p>
                  <p v-if="file.remainingDownloads !== undefined">
                    Downloads: {{ file.unlimited ? '∞' : file.remainingDownloads }} left
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center space-x-2">
            <button
              :class="[
                'px-3 py-1.5 text-sm rounded-md transition-colors flex items-center space-x-1.5 font-medium',
                isFileExpired(file)
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200',
              ]"
              :disabled="isFileExpired(file)"
              @click="!isFileExpired(file) && copyLink(file.token || file.downloadToken)"
            >
              <ClipboardDocumentIcon class="h-4 w-4" />
              <span>Copy</span>
            </button>
            <button
              :class="[
                'px-3 py-1.5 text-sm rounded-md transition-colors flex items-center space-x-1.5 font-medium',
                isFileExpired(file)
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-100 text-green-700 hover:bg-green-200',
              ]"
              :disabled="isFileExpired(file)"
              @click="!isFileExpired(file) && downloadFile(file.token || file.downloadToken)"
            >
              <ArrowDownTrayIcon class="h-4 w-4" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="flex justify-center items-center space-x-2 mt-6">
        <button
          :disabled="pagination.currentPage === 1"
          class="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50 flex items-center space-x-1"
          @click="changePage(pagination.currentPage - 1)"
        >
          <ChevronLeftIcon class="h-4 w-4" />
          <span>Previous</span>
        </button>

        <span class="text-sm text-gray-600">
          Page {{ pagination.currentPage }} of {{ pagination.totalPages }}
        </span>

        <button
          :disabled="pagination.currentPage === pagination.totalPages"
          class="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50 flex items-center space-x-1"
          @click="changePage(pagination.currentPage + 1)"
        >
          <span>Next</span>
          <ChevronRightIcon class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <svg
        class="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No files</h3>
      <p class="mt-1 text-sm text-gray-500">Get started by uploading your first file.</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useFilesStore } from '../stores/files'
import { useToast } from '../composables/useToast'
import { useFileIcon } from '../composables/useFileIcon'
import {
  ClipboardDocumentIcon,
  ArrowDownTrayIcon,
  InformationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/vue/24/outline'

const filesStore = useFilesStore()
const { success, error } = useToast()
const { getFileIcon, getIconColor } = useFileIcon()

// Access reactive properties directly from store
const files = computed(() => filesStore.files)
const isLoading = computed(() => filesStore.isLoading)
const pagination = computed(() => filesStore.pagination)

// Make files reactive with computed
const filesList = computed(() => files.value || [])

// Check if a file is expired
const isFileExpired = (file) => {
  // Never expires files
  if (file.expiresIn === 'never' || !file.expiresAt) return false

  // Check if expiresIn is "0s" or if remaining downloads is 0 (and not unlimited)
  if (file.expiresIn === '0s') return true
  if (!file.unlimited && file.remainingDownloads !== undefined && file.remainingDownloads <= 0)
    return true

  // Check if expiry date has passed
  if (file.expiresAt) {
    const expiryDate = new Date(file.expiresAt)
    if (expiryDate <= new Date()) return true
  }

  return false
}

onMounted(() => {
  filesStore.fetchFiles()
})

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

const formatExpiryDisplay = (file) => {
  if (!file.expiresAt) return 'Never'
  if (file.expiresIn === 'never') return 'Never'

  const expiryDate = new Date(file.expiresAt)
  const now = new Date()

  if (expiryDate <= now) return 'Expired'

  return expiryDate.toLocaleString()
}

const getShortMimeType = (mimeType) => {
  if (!mimeType) return ''

  // Common MIME type mappings to shorter versions
  const mimeMap = {
    'application/pdf': 'PDF',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.ms-excel': 'XLS',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    'application/vnd.ms-powerpoint': 'PPT',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
    'application/zip': 'ZIP',
    'application/x-rar-compressed': 'RAR',
    'application/x-7z-compressed': '7Z',
    'text/plain': 'TXT',
    'text/csv': 'CSV',
    'text/html': 'HTML',
    'text/css': 'CSS',
    'text/javascript': 'JS',
    'application/json': 'JSON',
    'application/xml': 'XML',
  }

  // Check if we have a specific mapping
  if (mimeMap[mimeType]) {
    return mimeMap[mimeType]
  }

  // For image, video, audio types, use the subtype
  const [type, subtype] = mimeType.split('/')
  if (type === 'image' || type === 'video' || type === 'audio') {
    return subtype.toUpperCase()
  }

  // For other types, try to extract a meaningful part
  if (subtype) {
    // Remove common prefixes and get the main part
    const cleanSubtype = subtype.replace(/^(vnd\.|x-|application\.)/, '')
    return cleanSubtype.toUpperCase().substring(0, 4)
  }

  return type.toUpperCase().substring(0, 4)
}

const copyLink = async (token) => {
  try {
    const link = filesStore.copyDownloadLink(token)
    success('Download link copied to clipboard!')
    return link
  } catch {
    error('Failed to copy link')
  }
}

const downloadFile = async (token) => {
  try {
    await filesStore.downloadFile(token)
    success('Download started!')
  } catch (err) {
    error('Failed to download file: ' + (err.response?.data?.message || err.message))
  }
}

const changePage = (page) => {
  filesStore.fetchFiles(page)
}
</script>
