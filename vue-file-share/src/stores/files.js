import { defineStore } from 'pinia'
import { ref } from 'vue'
import { filesAPI } from '../services/api'

export const useFilesStore = defineStore('files', () => {
  const files = ref([])
  const isLoading = ref(false)
  const isUploading = ref(false)
  const uploadProgress = ref(0)
  const error = ref(null)
  const pagination = ref({
    currentPage: 1,
    totalPages: 1,
    totalFiles: 0,
    limit: 10,
  })

  const uploadFiles = async (fileList) => {
    try {
      isUploading.value = true
      uploadProgress.value = 0
      error.value = null

      const formData = new FormData()
      Array.from(fileList).forEach((file) => {
        formData.append('files', file)
      })

      const response = await filesAPI.upload(formData, {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          uploadProgress.value = progress
        },
      })

      // Refresh the files list after upload
      await fetchFiles()

      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Upload failed'
      throw err
    } finally {
      isUploading.value = false
      uploadProgress.value = 0
    }
  }

  const uploadFile = async (file, options = { expiry: '1h', unlimited: false }) => {
    try {
      isUploading.value = true
      uploadProgress.value = 0
      error.value = null

      const formData = new FormData()
      formData.append('file', file)

      // Build query parameters
      const params = {
        unlimited: options.unlimited.toString(),
      }

      if (options.expiry && options.expiry !== 'never') {
        params.expiry = options.expiry
      }

      const response = await filesAPI.upload(formData, {
        params,
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          uploadProgress.value = progress
        },
      })

      // Refresh the files list after upload
      await fetchFiles()

      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Upload failed'
      throw err
    } finally {
      isUploading.value = false
      uploadProgress.value = 0
    }
  }

  const uploadMultipleFiles = async (
    files,
    options = { expiry: '1h', unlimited: false },
    onFileProgress = null,
  ) => {
    try {
      isUploading.value = true
      uploadProgress.value = 0
      error.value = null

      // For multiple files, we'll upload them sequentially to show individual progress
      const uploadResults = []
      const failedFiles = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        try {
          // Notify which file is currently being uploaded
          if (onFileProgress) {
            onFileProgress({
              currentFileIndex: i,
              currentFileName: file.name,
              totalFiles: files.length,
            })
          }

          // Upload individual file
          const formData = new FormData()
          formData.append('file', file)

          // If the file has an original name (for masked executables), include it
          if (file.originalName) {
            formData.append('originalName', file.originalName)
          }

          // Build query parameters
          const params = {
            unlimited: options.unlimited.toString(),
          }

          if (options.expiry && options.expiry !== 'never') {
            params.expiry = options.expiry
          }

          const response = await filesAPI.upload(formData, {
            params,
            onUploadProgress: (progressEvent) => {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
              uploadProgress.value = progress
            },
          })

          // Store successful upload result
          uploadResults.push({
            filename: file.name,
            token: response.data.link ? response.data.link.split('/').pop() : `token_${i}`,
            link: response.data.link,
            size: file.size || 0,
            mime: file.type,
          })
        } catch (fileError) {
          // Store failed upload
          failedFiles.push({
            filename: file.name,
            error: fileError.response?.data?.message || fileError.message,
          })
        }
      }

      // Refresh the files list after upload
      await fetchFiles()

      // Return results in the same format as the backend bulk API
      return {
        message: `Uploaded ${uploadResults.length} of ${files.length} files`,
        summary: {
          total: files.length,
          successful: uploadResults.length,
          failed: failedFiles.length,
          totalSize: files.reduce((sum, f) => sum + (f.size || 0), 0),
        },
        files: uploadResults,
        failedFiles: failedFiles,
        expiresIn: options.expiry === 'never' ? 'Never expires' : options.expiry,
        unlimited: options.unlimited,
        maxDownloads: options.unlimited ? '∞' : 5,
        remainingDownloads: options.unlimited ? '∞' : 5,
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Bulk upload failed'
      throw err
    } finally {
      isUploading.value = false
      uploadProgress.value = 0
    }
  }

  const getUploadLimits = async () => {
    try {
      const response = await filesAPI.getUploadLimits()
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to get upload limits'
      throw err
    }
  }

  const fetchFiles = async (page = 1) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await filesAPI.getMyFiles(page, pagination.value.limit)

      // Handle the actual API response structure
      const responseData = response.data
      files.value = responseData.files || []
      pagination.value = {
        currentPage: responseData.page || page,
        totalPages: Math.ceil((responseData.files?.length || 0) / pagination.value.limit) || 1,
        totalFiles: responseData.files?.length || 0,
        limit: responseData.limit || pagination.value.limit,
      }

      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch files'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const downloadFile = async (token) => {
    try {
      const response = await filesAPI.download(token)

      // Create blob URL and download
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = response.headers['content-disposition']?.split('filename=')[1] || 'download'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      return response
    } catch (err) {
      error.value = err.response?.data?.message || 'Download failed'
      throw err
    }
  }

  const downloadFileWithProgress = async (token, onProgress, abortController = null) => {
    try {
      error.value = null
      return await filesAPI.downloadWithProgress(token, onProgress, abortController)
    } catch (err) {
      error.value = err.message || 'Download failed'
      throw err
    }
  }

  const downloadFileWithProgressResumable = async (
    token,
    onProgress,
    abortController = null,
    startByte = 0,
    chunks = [],
  ) => {
    try {
      error.value = null
      return await filesAPI.downloadWithProgressResumable(
        token,
        onProgress,
        abortController,
        startByte,
        chunks,
      )
    } catch (err) {
      error.value = err.message || 'Download failed'
      throw err
    }
  }

  const getFileStatus = async (token) => {
    try {
      const response = await filesAPI.getFileStatus(token)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to get file status'
      throw err
    }
  }

  const getPublicFileStatus = async (token) => {
    try {
      const response = await filesAPI.getPublicFileStatus(token)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to get file status'
      throw err
    }
  }

  const copyDownloadLink = (token) => {
    const link = `${window.location.origin}/r/${token}`
    navigator.clipboard.writeText(link)
    return link
  }

  const bulkDeleteFiles = async (fileTokens, permanent = true) => {
    // Default to permanent deletion
    try {
      error.value = null
      const response = await filesAPI.bulkDelete(fileTokens, permanent)

      // Refresh the files list after deletion
      await fetchFiles()

      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Bulk deletion failed'
      throw err
    }
  }

  return {
    files,
    isLoading,
    isUploading,
    uploadProgress,
    error,
    pagination,
    uploadFiles,
    uploadFile,
    uploadMultipleFiles,
    getUploadLimits,
    fetchFiles,
    downloadFile,
    downloadFileWithProgress,
    downloadFileWithProgressResumable,
    getFileStatus,
    getPublicFileStatus,
    copyDownloadLink,
    bulkDeleteFiles,
  }
})
