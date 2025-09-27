<template>
  <div class="w-full space-y-8">
    <!-- Dropzone -->
    <div
      :class="[
        'relative flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed transition-all duration-300',
        isUploading
          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
          : isDragOver
            ? 'border-blue-500 bg-blue-50/70 scale-[1.01] shadow-lg cursor-pointer'
            : 'border-gray-300 bg-white hover:bg-gray-50 cursor-pointer',
      ]"
      @click="!isUploading && openFileDialog()"
      @drop="!isUploading && handleDrop($event)"
      @dragover.prevent
      @dragenter.prevent="!isUploading && (isDragOver = true)"
      @dragleave.prevent="isDragOver = false"
    >
      <ArrowUpTrayIcon class="h-12 w-12 text-blue-500 animate-bounce mb-4" />
      <p class="text-lg font-semibold text-gray-800">
        {{ isUploading ? 'Upload in progress...' : 'Drop files here' }}
      </p>
      <div v-if="!isUploading" class="flex justify-center">
        <p class="text-sm text-gray-500 text-center">
          or click to browse <br />
          (multiple files supported)
        </p>
      </div>
      <input
        ref="fileInput"
        type="file"
        multiple
        :disabled="isUploading"
        class="hidden"
        @change="handleFileSelect"
      />
    </div>

    <!-- Files Selected -->
    <div v-if="selectedFiles.length > 0" class="space-y-6">
      <!-- Files List -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-medium text-gray-700">
            Selected Files ({{ selectedFiles.length }})
            <span class="text-gray-500">- Total: {{ formatFileSize(totalSize) }}</span>
          </h3>
          <button
            :disabled="isUploading"
            :class="[
              'text-red-500 hover:text-red-700 transition flex items-center gap-1',
              isUploading ? 'opacity-50 cursor-not-allowed' : '',
            ]"
            @click="clearAllFiles"
          >
            <XMarkIcon class="h-4 w-4" />
            <span class="text-sm">Clear All</span>
          </button>
        </div>

        <div class="max-h-64 overflow-y-auto space-y-2">
          <div
            v-for="(file, index) in selectedFiles"
            :key="file.id"
            class="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 shadow-sm"
          >
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <component
                :is="getFileIcon(file.type, file.name)"
                :class="['h-8 w-8 flex-shrink-0', getIconColor(file.type)]"
              />
              <div class="min-w-0 flex-1">
                <p class="font-medium text-gray-900 truncate" :title="file.name">
                  {{ file.name }}
                </p>
                <p class="text-xs text-gray-500">{{ formatFileSize(file.size) }}</p>
              </div>
            </div>
            <button
              :disabled="isUploading"
              :class="[
                'text-red-500 hover:text-red-700 transition flex items-center gap-1 flex-shrink-0 ml-3',
                isUploading ? 'opacity-50 cursor-not-allowed' : '',
              ]"
              @click="removeFile(index)"
            >
              <XMarkIcon class="h-4 w-4" />
              <span class="hidden sm:inline text-sm">Remove</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Expiry Options -->
      <div class="space-y-4">
        <h3 class="text-sm font-medium text-gray-700">Expiry</h3>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="opt in quickOptions"
            :key="opt.value"
            type="button"
            :disabled="isUploading"
            :class="[
              'px-3 py-1.5 text-sm rounded-full border transition',
              uploadOptions.expiryType === 'quick' && uploadOptions.quickExpiry === opt.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
              isUploading ? 'opacity-50 cursor-not-allowed' : '',
            ]"
            @click="setExpiry('quick', opt.value)"
          >
            {{ opt.label }}
          </button>
          <button
            type="button"
            :disabled="isUploading"
            :class="[
              'px-3 py-1.5 text-sm rounded-full border transition',
              uploadOptions.expiryType === 'never'
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
              isUploading ? 'opacity-50 cursor-not-allowed' : '',
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
            :disabled="isUploading"
          />
          <p class="text-xs text-gray-500 mt-1">Expires on: {{ formatCustomExpiry }}</p>
        </div>
      </div>

      <!-- Unlimited Downloads -->
      <label
        :class="[
          'inline-flex items-center gap-2 text-sm text-gray-700',
          isUploading ? 'opacity-50 cursor-not-allowed' : '',
        ]"
      >
        <input
          v-model="uploadOptions.unlimited"
          type="checkbox"
          class="rounded text-blue-600"
          :disabled="isUploading"
        />
        Unlimited downloads
      </label>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <button
          class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1"
          @click="clearAllFiles"
        >
          <XCircleIcon class="h-4 w-4" /> Clear All
        </button>
        <button
          :disabled="isUploading || selectedFiles.length === 0"
          class="px-4 py-2 rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 flex items-center gap-1 transition"
          @click="uploadFiles"
        >
          <ArrowUpTrayIcon class="h-4 w-4" />
          {{
            isUploading
              ? selectedFiles.length === 1
                ? 'Uploading...'
                : `Uploading ${Math.min(currentUploadIndex + 1, selectedFiles.length)}/${selectedFiles.length}...`
              : `Upload ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`
          }}
        </button>
      </div>

      <!-- Progress -->
      <div v-if="isUploading" class="mt-4 space-y-4">
        <!-- Overall Progress -->
        <div>
          <div class="flex items-center justify-between text-sm font-medium mb-2 text-gray-700">
            <span>Overall Progress</span>
            <span class="text-blue-600"
              >{{ Math.min(currentUploadIndex + 1, selectedFiles.length) }} /
              {{ selectedFiles.length }}</span
            >
          </div>
          <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-green-500 to-blue-600 transition-all duration-300"
              :style="{
                width:
                  Math.min(
                    ((currentUploadIndex + (uploadProgress > 0 ? uploadProgress / 100 : 0)) /
                      selectedFiles.length) *
                      100,
                    100,
                  ) + '%',
              }"
            ></div>
          </div>
        </div>

        <!-- Current File Progress -->
        <div v-if="currentUploadFile">
          <div class="flex items-center justify-between text-sm font-medium mb-2 text-gray-700">
            <span class="truncate">Uploading {{ currentUploadFile.name }}...</span>
            <span class="text-blue-600">{{ uploadProgress }}%</span>
          </div>
          <div class="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out"
              :style="{ width: uploadProgress + '%' }"
            ></div>
          </div>
        </div>

        <!-- Upload Results -->
        <div v-if="uploadResults.length > 0 || failedUploads.length > 0" class="pt-2">
          <div class="text-sm space-y-2">
            <div v-if="uploadResults.length > 0" class="text-green-600">
              ✓ Successfully uploaded: {{ uploadResults.length }}
              <div
                v-if="uploadResults.length > 0"
                class="text-xs text-green-500 mt-1 max-h-20 overflow-y-auto"
              >
                <div
                  v-for="result in uploadResults.slice(-3)"
                  :key="result.filename"
                  class="truncate"
                >
                  {{ result.filename }}
                </div>
                <div v-if="uploadResults.length > 3" class="text-gray-400">
                  ...and {{ uploadResults.length - 3 }} more
                </div>
              </div>
            </div>
            <div v-if="failedUploads.length > 0" class="text-red-600">
              ✗ Failed uploads: {{ failedUploads.length }}
              <div class="text-xs text-red-500 mt-1">
                <div v-for="failed in failedUploads" :key="failed.filename" class="truncate">
                  {{ failed.filename }}: {{ failed.error }}
                </div>
              </div>
            </div>
          </div>
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
const selectedFiles = ref([])
const isDragOver = ref(false)
const currentUploadIndex = ref(0)
const currentUploadFile = ref(null)
const uploadResults = ref([])
const failedUploads = ref([])
const uploadLimits = ref(null)

const isUploading = computed(() => filesStore.isUploading)
const uploadProgress = computed(() => filesStore.uploadProgress)

const totalSize = computed(() =>
  selectedFiles.value.reduce((sum, file) => sum + (file.size || 0), 0),
)

// Load upload limits on component mount
const loadUploadLimits = async () => {
  try {
    const response = await filesStore.getUploadLimits()
    uploadLimits.value = response
  } catch (error) {
    console.warn('Could not load upload limits:', error)
    // Set default limits if API call fails
    uploadLimits.value = {
      maxFileSize: 100 * 1024 * 1024, // 100MB
      maxFilesPerUpload: 10,
      maxTotalSizePerUpload: 500 * 1024 * 1024, // 500MB
    }
  }
}

// Load limits when component mounts
loadUploadLimits()

const quickOptions = [
  { value: '1m', label: '1 min' },
  { value: '1h', label: '1 hour' },
  { value: '1d', label: '1 day' },
  { value: '7d', label: '1 week' },
  { value: '30d', label: '1 month' },
]

const uploadOptions = ref({
  expiryType: 'quick',
  quickExpiry: '1h',
  customExpiry: null,
  unlimited: false,
})

const formatCustomExpiry = computed(() =>
  uploadOptions.value.customExpiry
    ? new Date(uploadOptions.value.customExpiry).toLocaleString()
    : 'No date selected',
)

const handleDrop = (e) => {
  e.preventDefault()
  isDragOver.value = false
  const files = Array.from(e.dataTransfer.files)
  addFiles(files)
}

const handleFileSelect = (e) => {
  const files = Array.from(e.target.files)
  addFiles(files)
}

const addFiles = (files) => {
  if (!uploadLimits.value) {
    error('Upload limits not loaded yet. Please try again.')
    return
  }

  const validFiles = []

  for (const file of files) {
    // Check if file already exists
    if (selectedFiles.value.some((f) => f.name === file.name && f.size === file.size)) {
      continue // Skip duplicates
    }

    // Validate file size
    if (file.size > uploadLimits.value.maxFileSize) {
      error(
        `File "${file.name}" is too large! Maximum allowed size is ${formatFileSize(uploadLimits.value.maxFileSize)}.`,
      )
      continue
    }

    // Check empty file
    if (file.size === 0) {
      error(`File "${file.name}" is empty and cannot be uploaded.`)
      continue
    }

    validFiles.push({
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      id: Date.now().toString() + Math.random().toString(36), // Add unique ID for tracking
      file: file, // Keep reference to actual File object
    })
  }

  // Check total number of files
  const newTotal = selectedFiles.value.length + validFiles.length
  if (newTotal > uploadLimits.value.maxFilesPerUpload) {
    error(
      `Too many files! Maximum ${uploadLimits.value.maxFilesPerUpload} files allowed. You're trying to add ${newTotal} files.`,
    )
    return
  }

  // Check total size
  const newTotalSize = totalSize.value + validFiles.reduce((sum, f) => sum + (f.size || 0), 0)
  if (newTotalSize > uploadLimits.value.maxTotalSizePerUpload) {
    error(
      `Total size too large! Maximum ${formatFileSize(uploadLimits.value.maxTotalSizePerUpload)} allowed.`,
    )
    return
  }

  // Add valid files
  selectedFiles.value.push(...validFiles)

  if (validFiles.length > 0) {
    success(`Added ${validFiles.length} file${validFiles.length > 1 ? 's' : ''} for upload.`)
  }
}

const removeFile = (index) => {
  selectedFiles.value.splice(index, 1)
}

const clearAllFiles = () => {
  selectedFiles.value = []
  uploadResults.value = []
  failedUploads.value = []
  currentUploadIndex.value = 0
  currentUploadFile.value = null
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

const uploadFiles = async () => {
  if (selectedFiles.value.length === 0) return

  // Reset tracking variables
  uploadResults.value = []
  failedUploads.value = []
  currentUploadIndex.value = 0

  try {
    // Prepare expiry value
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

    // Upload files one by one or in bulk depending on count
    if (selectedFiles.value.length === 1) {
      // Single file upload (existing API)
      currentUploadFile.value = selectedFiles.value[0]
      try {
        await filesStore.uploadFile(selectedFiles.value[0].file, options)
        uploadResults.value.push({
          filename: selectedFiles.value[0].name,
          success: true,
        })
        success('File uploaded successfully!')
      } catch (err) {
        failedUploads.value.push({
          filename: selectedFiles.value[0].name,
          error: err.response?.data?.message || err.message,
        })
        error('Upload failed: ' + (err.response?.data?.message || err.message))
      }
    } else {
      // Multiple files upload (sequential for individual progress)
      try {
        // Convert to actual File objects for upload
        const filesToUpload = selectedFiles.value.map((f) => f.file)

        // Set up progress tracking
        const onFileProgress = (progressInfo) => {
          currentUploadIndex.value = progressInfo.currentFileIndex
          currentUploadFile.value = {
            name: progressInfo.currentFileName,
          }
        }

        const result = await filesStore.uploadMultipleFiles(filesToUpload, options, onFileProgress)

        // Process results
        if (result.files) {
          uploadResults.value = result.files.map((f) => ({ ...f, success: true }))
        }
        if (result.failedFiles) {
          failedUploads.value = result.failedFiles
        }

        if (result.summary) {
          const { successful, failed, total } = result.summary
          if (failed > 0) {
            error(
              `Upload completed with issues: ${successful}/${total} files uploaded successfully.`,
            )
          } else {
            success(`All ${successful} files uploaded successfully!`)
          }
        }
      } catch (err) {
        error('Bulk upload failed: ' + (err.response?.data?.message || err.message))
      }
    }

    // Clear files on successful upload (or mixed results)
    if (uploadResults.value.length > 0) {
      emit('file-uploaded')
      // Clear files after a short delay to show results
      setTimeout(() => {
        clearAllFiles()
      }, 3000)
    }
  } catch (err) {
    error('Upload failed: ' + (err.response?.data?.message || err.message))
  } finally {
    currentUploadFile.value = null
  }
}
</script>
