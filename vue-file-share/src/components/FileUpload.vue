<template>
  <div class="w-full space-y-8">
    <!-- Dropzone -->
    <div
      :class="[
        'relative flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300',
        isDragOver
          ? 'border-blue-500 bg-blue-50/70 scale-[1.01] shadow-lg'
          : 'border-gray-300 bg-white hover:bg-gray-50'
      ]"
      @click="openFileDialog"
      @drop="handleDrop"
      @dragover.prevent
      @dragenter.prevent="isDragOver = true"
      @dragleave.prevent="isDragOver = false"
    >
      <ArrowUpTrayIcon class="h-12 w-12 text-blue-500 animate-bounce mb-4" />
      <p class="text-lg font-semibold text-gray-800">Drop a file here</p>
      <p class="text-sm text-gray-500">or click to browse</p>
      <input ref="fileInput" type="file" class="hidden" @change="handleFileSelect" />
    </div>

    <!-- File Selected -->
    <div v-if="selectedFile" class="space-y-6">
      <!-- File Info -->
      <div
        class="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 shadow-sm"
      >
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <component
            :is="getFileIcon(selectedFile.type, selectedFile.name)"
            :class="['h-10 w-10 flex-shrink-0', getIconColor(selectedFile.type)]"
          />
          <div class="min-w-0 flex-1">
            <p class="font-medium text-gray-900 truncate" :title="selectedFile.name">
              {{ selectedFile.name }}
            </p>
            <p class="text-xs text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
          </div>
        </div>
        <button
          class="text-red-500 hover:text-red-700 transition flex items-center gap-1 flex-shrink-0 ml-3"
          @click="clearFile"
        >
          <XMarkIcon class="h-4 w-4" />
          <span class="hidden sm:inline">Remove</span>
        </button>
      </div>

      <!-- Expiry Options -->
      <div class="space-y-4">
        <h3 class="text-sm font-medium text-gray-700">Expiry</h3>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="opt in quickOptions"
            :key="opt.value"
            type="button"
            :class="[
              'px-3 py-1.5 text-sm rounded-full border transition',
              uploadOptions.expiryType === 'quick' && uploadOptions.quickExpiry === opt.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            ]"
            @click="setExpiry('quick', opt.value)"
          >
            {{ opt.label }}
          </button>
          <button
            type="button"
            :class="[
              'px-3 py-1.5 text-sm rounded-full border transition',
              uploadOptions.expiryType === 'never'
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            ]"
            @click="uploadOptions.expiryType = 'never'"
          >
            Never
          </button>
        </div>

        <div v-if="uploadOptions.expiryType === 'custom'" class="pt-2">
          <VueDatePicker
            v-model="uploadOptions.customExpiry"
            :min-date="new Date()"
            :enable-time-picker="true"
            :format="'yyyy-MM-dd HH:mm'"
            placeholder="Pick expiry date & time"
            class="w-full"
          />
          <p class="text-xs text-gray-500 mt-1">Expires on: {{ formatCustomExpiry }}</p>
        </div>
      </div>

      <!-- Unlimited Downloads -->
      <label class="inline-flex items-center gap-2 text-sm text-gray-700">
        <input v-model="uploadOptions.unlimited" type="checkbox" class="rounded text-blue-600" />
        Unlimited downloads
      </label>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <button
          class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1"
          @click="clearFile"
        >
          <XCircleIcon class="h-4 w-4" /> Clear
        </button>
        <button
          :disabled="isUploading"
          class="px-4 py-2 rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 flex items-center gap-1 transition"
          @click="uploadFile"
        >
          <ArrowUpTrayIcon class="h-4 w-4" />
          {{ isUploading ? 'Uploading...' : 'Upload' }}
        </button>
      </div>

      <!-- Progress -->
      <div v-if="isUploading" class="mt-4">
        <div class="flex items-center justify-between text-sm font-medium mb-2 text-gray-700">
          <span class="truncate">Uploading {{ selectedFile?.name }}...</span>
          <span class="text-blue-600">{{ uploadProgress }}%</span>
        </div>
        <div class="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out"
            :style="{ width: uploadProgress + '%' }"
          ></div>
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
import { ArrowUpTrayIcon, XMarkIcon, XCircleIcon } from '@heroicons/vue/24/outline'
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

const emit = defineEmits(['file-uploaded'])

const filesStore = useFilesStore()
const { success, error } = useToast()
const { getFileIcon, getIconColor } = useFileIcon()

const fileInput = ref(null)
const selectedFile = ref(null)
const isDragOver = ref(false)

const isUploading = computed(() => filesStore.isUploading)
const uploadProgress = computed(() => filesStore.uploadProgress)

const quickOptions = [
  { value: '1m', label: '1 min' },
  { value: '1h', label: '1 hour' },
  { value: '1d', label: '1 day' },
  { value: '7d', label: '1 week' },
  { value: '30d', label: '1 month' }
]

const uploadOptions = ref({
  expiryType: 'quick',
  quickExpiry: '1h',
  customExpiry: null,
  unlimited: false
})

const formatCustomExpiry = computed(() =>
  uploadOptions.value.customExpiry
    ? new Date(uploadOptions.value.customExpiry).toLocaleString()
    : 'No date selected'
)

const handleDrop = (e) => {
  e.preventDefault()
  isDragOver.value = false
  const files = Array.from(e.dataTransfer.files)
  if (files.length > 0) selectFile(files[0])
}
const handleFileSelect = (e) => {
  const files = Array.from(e.target.files)
  if (files.length > 0) selectFile(files[0])
}
const selectFile = (file) => (selectedFile.value = file)
const clearFile = () => {
  selectedFile.value = null
  if (fileInput.value) fileInput.value.value = ''
}
const openFileDialog = () => fileInput.value?.click()

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const setExpiry = (type, val) => {
  uploadOptions.value.expiryType = type
  uploadOptions.value.quickExpiry = val
}

const uploadFile = async () => {
  if (!selectedFile.value) return
  try {
    let expiryValue = 'never'
    if (uploadOptions.value.expiryType === 'quick') {
      expiryValue = uploadOptions.value.quickExpiry
    } else if (uploadOptions.value.expiryType === 'custom' && uploadOptions.value.customExpiry) {
      expiryValue = new Date(uploadOptions.value.customExpiry).toISOString()
    }
    const options = { expiry: expiryValue, unlimited: uploadOptions.value.unlimited }
    await filesStore.uploadFile(selectedFile.value, options)
    success('File uploaded successfully!')
    clearFile()
    emit('file-uploaded')
  } catch (err) {
    error('Upload failed: ' + (err.response?.data?.message || err.message))
  }
}
</script>
