import { ref, computed } from 'vue'
import { performanceUtils } from '../config/performance'

/**
 * Composable for optimized file operations with performance considerations
 * @param {Object} options - Configuration options
 * @returns {Object} - File operation utilities
 */
export function useOptimizedFiles(options = {}) {
  const files = ref([])
  const isLoading = ref(false)
  const searchTerm = ref('')

  // Debounced search for better performance
  const debouncedSearch = performanceUtils.debounce((term) => {
    searchTerm.value = term
  }, options.searchDelay || 300)

  // Computed filtered files with memoization
  const filteredFiles = computed(() => {
    if (!searchTerm.value) return files.value

    const term = searchTerm.value.toLowerCase()
    return files.value.filter((file) => {
      const fileName = (file.file || file.originalName || '').toLowerCase()
      const fileType = (file.mime || '').toLowerCase()
      return fileName.includes(term) || fileType.includes(term)
    })
  })

  // Paginated files for virtual scrolling
  const paginatedFiles = computed(() => {
    const pageSize = options.pageSize || 20
    const totalPages = Math.ceil(filteredFiles.value.length / pageSize)

    return {
      files: filteredFiles.value.slice(0, pageSize),
      totalPages,
      hasMore: totalPages > 1,
      total: filteredFiles.value.length,
    }
  })

  // File size formatting with caching
  const formatFileSize = (() => {
    const cache = new Map()

    return (bytes) => {
      if (cache.has(bytes)) return cache.get(bytes)

      if (bytes === 0) return '0 Bytes'

      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      const formatted = `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`

      cache.set(bytes, formatted)
      return formatted
    }
  })()

  // Optimized date formatting with caching
  const formatDate = (() => {
    const cache = new Map()

    return (dateString) => {
      if (cache.has(dateString)) return cache.get(dateString)

      const formatted = new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })

      cache.set(dateString, formatted)
      return formatted
    }
  })()

  // Check if file is expired (optimized)
  const isFileExpired = (file) => {
    if (!file.expiresAt) return false
    return new Date(file.expiresAt) < new Date()
  }

  // Batch file operations
  const updateFiles = (newFiles) => {
    // Use requestIdleCallback for non-critical updates
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        files.value = newFiles
      })
    } else {
      files.value = newFiles
    }
  }

  // Optimized search function
  const search = (term) => {
    debouncedSearch(term)
  }

  // Load more files for infinite scrolling
  const loadMore = () => {
    const currentLength = paginatedFiles.value.files.length
    const pageSize = options.pageSize || 20
    const nextBatch = filteredFiles.value.slice(currentLength, currentLength + pageSize)

    // Simulate loading state for UX
    isLoading.value = true
    setTimeout(() => {
      paginatedFiles.value.files.push(...nextBatch)
      isLoading.value = false
    }, 100)
  }

  // Clear cache functions
  const clearCache = () => {
    formatFileSize.cache?.clear()
    formatDate.cache?.clear()
  }

  return {
    files,
    isLoading,
    searchTerm: searchTerm,
    filteredFiles,
    paginatedFiles,
    formatFileSize,
    formatDate,
    isFileExpired,
    updateFiles,
    search,
    loadMore,
    clearCache,
  }
}
