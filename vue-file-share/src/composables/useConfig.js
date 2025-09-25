// useConfig.js - Composable for application configuration
import { computed } from 'vue'

export function useConfig() {
  const config = computed(() => ({
    // API Configuration
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787',
    apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,

    // App Configuration
    appTitle: import.meta.env.VITE_APP_TITLE || 'R2 File Share',
    maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE) || 100000000, // 100MB default
    allowedFileTypes: import.meta.env.VITE_ALLOWED_FILE_TYPES || '*',

    // Environment
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
    mode: import.meta.env.MODE,
  }))

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatMaxFileSize = computed(() => {
    return formatFileSize(config.value.maxFileSize)
  })

  const isValidFileSize = (size) => {
    return size <= config.value.maxFileSize
  }

  const isValidFileType = (type) => {
    const allowedTypes = config.value.allowedFileTypes
    if (allowedTypes === '*') return true

    // Support comma-separated MIME types
    const allowed = allowedTypes.split(',').map((t) => t.trim())
    return allowed.some((allowedType) => {
      // Support wildcards like image/*
      if (allowedType.endsWith('/*')) {
        const category = allowedType.replace('/*', '')
        return type.startsWith(category + '/')
      }
      return type === allowedType
    })
  }

  return {
    config,
    formatFileSize,
    formatMaxFileSize,
    isValidFileSize,
    isValidFileType,
  }
}
