<template>
  <div class="w-full">
    <div
      :class="[
        'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
        isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300',
      ]"
      @drop="handleDrop"
      @dragover.prevent
      @dragenter.prevent
    >
      <div class="mb-4">
        <svg
          class="mx-auto h-12 w-12 text-gray-400"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
      <div class="mb-4">
        <p class="text-lg font-medium text-gray-900">Drop a file here or click to select</p>
        <p class="text-sm text-gray-500">Single file upload only</p>
      </div>
      <input ref="fileInput" type="file" class="hidden" @change="handleFileSelect" />
      <button
        type="button"
        class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        @click="openFileDialog"
      >
        <FolderOpenIcon class="h-4 w-4 mr-2" />
        Select File
      </button>
    </div>

    <!-- Upload Options -->
    <div v-if="selectedFile" class="mt-6 bg-gray-50 p-4 rounded-lg">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Upload Options</h3>

      <!-- Expiry Options -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2"> File Expiry </label>
        <div class="space-y-3">
          <!-- Quick Options -->
          <div class="flex flex-wrap gap-2">
            <label class="inline-flex items-center">
              <input
                v-model="uploadOptions.expiryType"
                type="radio"
                value="quick"
                class="form-radio text-blue-600"
                @change="uploadOptions.quickExpiry = '1h'"
              />
              <span class="ml-2 text-sm">Quick Options</span>
            </label>
            <label class="inline-flex items-center">
              <input
                v-model="uploadOptions.expiryType"
                type="radio"
                value="custom"
                class="form-radio text-blue-600"
              />
              <span class="ml-2 text-sm">Custom Date</span>
            </label>
            <label class="inline-flex items-center">
              <input
                v-model="uploadOptions.expiryType"
                type="radio"
                value="never"
                class="form-radio text-blue-600"
              />
              <span class="ml-2 text-sm">Never Expires</span>
            </label>
          </div>

          <!-- Quick Options -->
          <div v-if="uploadOptions.expiryType === 'quick'" class="flex flex-wrap gap-2 pl-6">
            <label class="inline-flex items-center">
              <input
                v-model="uploadOptions.quickExpiry"
                type="radio"
                value="1m"
                class="form-radio text-blue-600"
              />
              <span class="ml-2 text-sm">1 minute</span>
            </label>
            <label class="inline-flex items-center">
              <input
                v-model="uploadOptions.quickExpiry"
                type="radio"
                value="1h"
                class="form-radio text-blue-600"
              />
              <span class="ml-2 text-sm">1 hour</span>
            </label>
            <label class="inline-flex items-center">
              <input
                v-model="uploadOptions.quickExpiry"
                type="radio"
                value="1d"
                class="form-radio text-blue-600"
              />
              <span class="ml-2 text-sm">1 day</span>
            </label>
            <label class="inline-flex items-center">
              <input
                v-model="uploadOptions.quickExpiry"
                type="radio"
                value="7d"
                class="form-radio text-blue-600"
              />
              <span class="ml-2 text-sm">1 week</span>
            </label>
            <label class="inline-flex items-center">
              <input
                v-model="uploadOptions.quickExpiry"
                type="radio"
                value="30d"
                class="form-radio text-blue-600"
              />
              <span class="ml-2 text-sm">1 month</span>
            </label>
          </div>

          <!-- Custom Date Picker -->
          <div v-if="uploadOptions.expiryType === 'custom'" class="pl-6">
            <VueDatePicker
              v-model="uploadOptions.customExpiry"
              :min-date="new Date()"
              :enable-time-picker="true"
              :format="'yyyy-MM-dd HH:mm'"
              placeholder="Select expiry date and time"
              class="w-full"
            />
            <p class="text-xs text-gray-500 mt-1">File will expire on: {{ formatCustomExpiry }}</p>
          </div>

          <!-- Never Expires Info -->
          <div v-if="uploadOptions.expiryType === 'never'" class="pl-6">
            <p class="text-sm text-green-600">
              ✨ This file will never expire and can be downloaded indefinitely
            </p>
          </div>
        </div>
      </div>

      <!-- Unlimited Downloads -->
      <div class="mb-4">
        <label class="inline-flex items-center">
          <input
            v-model="uploadOptions.unlimited"
            type="checkbox"
            class="form-checkbox text-blue-600"
          />
          <span class="ml-2 text-sm font-medium text-gray-700"> Unlimited downloads </span>
        </label>
      </div>
    </div>

    <!-- Selected File -->
    <div v-if="selectedFile" class="mt-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Selected File</h3>
      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div class="flex items-center space-x-3 min-w-0 flex-1">
          <component
            :is="getFileIcon(selectedFile.type, selectedFile.name)"
            :class="['h-8 w-8 flex-shrink-0', getIconColor(selectedFile.type)]"
          />
          <div class="min-w-0 flex-1">
            <p class="font-medium text-gray-900 truncate" :title="selectedFile.name">
              {{ selectedFile.name }}
            </p>
            <p class="text-sm text-gray-500">
              {{ formatFileSize(selectedFile.size) }}
            </p>
          </div>
        </div>
        <button
          class="text-red-500 hover:text-red-700 transition-colors flex items-center space-x-1 flex-shrink-0 ml-3"
          @click="clearFile"
        >
          <XMarkIcon class="h-4 w-4" />
          <span class="hidden sm:inline">Remove</span>
        </button>
      </div>

      <div class="mt-6 flex justify-end space-x-3">
        <button
          class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-1"
          @click="clearFile"
        >
          <XCircleIcon class="h-4 w-4" />
          <span>Clear</span>
        </button>
        <button
          :disabled="isUploading"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-1"
          @click="uploadFile"
        >
          <ArrowUpTrayIcon class="h-4 w-4" />
          <span>{{ isUploading ? 'Uploading...' : 'Upload File' }}</span>
        </button>
      </div>

      <!-- Upload Progress Bar -->
      <div v-if="isUploading" class="mt-4">
        <div class="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
          <span class="flex items-center space-x-2 min-w-0 flex-1">
            <ArrowUpTrayIcon class="h-4 w-4 animate-pulse text-blue-600 flex-shrink-0" />
            <span class="truncate" :title="selectedFile?.name">
              Uploading {{ selectedFile?.name }}...
            </span>
          </span>
          <span class="text-blue-600 flex-shrink-0 ml-2">{{ uploadProgress }}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
          <div
            class="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
            :style="{ width: uploadProgress + '%' }"
          >
            <div
              class="h-full w-full bg-gradient-to-r from-white/20 to-transparent rounded-full"
            ></div>
          </div>
        </div>
        <div class="text-xs text-gray-500 mt-1 text-center">
          {{ uploadProgress < 100 ? 'Please wait...' : 'Processing...' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useFilesStore } from '../stores/files'
import { useToast } from '../composables/useToast'
import { useFileIcon } from '../composables/useFileIcon'
import { FolderOpenIcon, XMarkIcon, XCircleIcon, ArrowUpTrayIcon } from '@heroicons/vue/24/outline'
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

const filesStore = useFilesStore()
const { success, error } = useToast()
const { getFileIcon, getIconColor } = useFileIcon()

const fileInput = ref(null)
const selectedFile = ref(null)
const isDragOver = ref(false)

// Access reactive properties directly from store
const isUploading = computed(() => filesStore.isUploading)
const uploadProgress = computed(() => filesStore.uploadProgress)

// Upload options
const uploadOptions = ref({
  expiryType: 'quick', // 'quick', 'custom', 'never'
  quickExpiry: '1h', // Duration string for quick options
  customExpiry: null, // Date object for custom expiry
  unlimited: false,
})

// Computed property to format custom expiry date
const formatCustomExpiry = computed(() => {
  if (!uploadOptions.value.customExpiry) return 'No date selected'
  return new Date(uploadOptions.value.customExpiry).toLocaleString()
})

const handleDrop = (e) => {
  e.preventDefault()
  isDragOver.value = false
  const files = Array.from(e.dataTransfer.files)
  if (files.length > 0) {
    selectFile(files[0]) // Only take the first file
  }
}

const handleFileSelect = (e) => {
  const files = Array.from(e.target.files)
  if (files.length > 0) {
    selectFile(files[0]) // Only take the first file
  }
}

const selectFile = (file) => {
  selectedFile.value = file
}

const clearFile = () => {
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const openFileDialog = () => {
  fileInput.value?.click()
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const uploadFile = async () => {
  if (!selectedFile.value) return

  try {
    // Determine expiry value based on selected type
    let expiryValue = 'never'

    if (uploadOptions.value.expiryType === 'quick') {
      expiryValue = uploadOptions.value.quickExpiry
    } else if (uploadOptions.value.expiryType === 'custom' && uploadOptions.value.customExpiry) {
      expiryValue = new Date(uploadOptions.value.customExpiry).toISOString()
    }

    const options = {
      expiry: expiryValue,
      unlimited: uploadOptions.value.unlimited,
    }

    await filesStore.uploadFile(selectedFile.value, options)
    success('File uploaded successfully!')
    clearFile()
  } catch (err) {
    error('Failed to upload file: ' + (err.response?.data?.message || err.message))
  }
}

// Drag events
const handleDragOver = () => {
  isDragOver.value = true
}

const handleDragLeave = () => {
  isDragOver.value = false
}

// Add event listeners
document.addEventListener('dragenter', handleDragOver)
document.addEventListener('dragleave', handleDragLeave)
</script>
