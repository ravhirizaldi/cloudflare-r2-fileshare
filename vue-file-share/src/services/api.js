import axios from 'axios'

// Use environment variables for configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000

// Create axios instance with environment-based configuration
const baseURL = import.meta.env.DEV
  ? '/api' // Use proxy in development
  : API_BASE_URL // Use environment variable in production

const api = axios.create({
  baseURL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/me'),
}

// Files API
export const filesAPI = {
  // Helper function to detect if the file is likely to be intercepted by download managers
  _isExecutableFile: (fileName) => {
    const executableExtensions = ['.exe', '.msi', '.dmg', '.pkg', '.deb', '.rpm', '.app']
    return executableExtensions.some((ext) => fileName.toLowerCase().endsWith(ext))
  },

  // Helper function to mask executable files with safe extensions
  _maskExecutableFile: (file) => {
    const originalName = file.name
    if (filesAPI._isExecutableFile(originalName)) {
      // Change extension to something safe that IDM won't intercept
      const safeName = originalName.replace(/\.[^.]+$/, '.tmp')

      console.log(`🔒 Masking executable file: "${originalName}" → "${safeName}"`)

      // Create a new File object with the masked name
      const maskedFile = new File([file], safeName, {
        type: 'application/octet-stream',
        lastModified: file.lastModified,
      })

      // Store the original name for later restoration
      maskedFile.originalName = originalName
      return maskedFile
    }
    return file
  },

  // Enhanced upload function that masks executable files
  upload: (formData, config = {}) => {
    // Check if formData contains executable files and mask them
    const processedFormData = new FormData()

    // Copy all form data entries, masking executable files
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        const processedFile = filesAPI._maskExecutableFile(value)
        processedFormData.append(key, processedFile)

        // If we masked the file, also send the original name
        if (processedFile.originalName) {
          processedFormData.append('originalName', processedFile.originalName)
          console.log(`📤 Uploading masked file with original name: ${processedFile.originalName}`)
        }
      } else {
        processedFormData.append(key, value)
      }
    }

    return api.post('/upload', processedFormData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      ...config,
    })
  },
  getMyFiles: (page = 1, limit = 10) => api.get('/myfiles', { params: { page, limit } }),
  bulkDelete: (
    fileTokens,
    permanent = true, // Default to permanent deletion
  ) =>
    api.delete('/files/bulk-delete', {
      data: { fileTokens, permanent },
    }),
  download: (token) => api.get(`/r/${token}`, { responseType: 'blob' }),

  // Alternative download method using a hidden iframe (for very stubborn cases)
  _downloadViaIframe: (url, fileName) => {
    return new Promise((resolve) => {
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = url
      document.body.appendChild(iframe)

      // Clean up after a delay
      setTimeout(() => {
        document.body.removeChild(iframe)
        resolve({ fileName, total: 0, loaded: 0 })
      }, 1000)
    })
  },

  downloadWithProgress: (token, onProgress, abortController = null) => {
    return new Promise((resolve, reject) => {
      const apiToken = localStorage.getItem('token')

      // For executable files, use a completely different approach
      // First, let's check what type of file this is by getting file info
      fetch(`${api.defaults.baseURL}/status/${token}`, {
        headers: apiToken ? { Authorization: `Bearer ${apiToken}` } : {},
        signal: abortController?.signal,
      })
        .then((response) => response.json())
        .then((fileInfo) => {
          const isExecutable = filesAPI._isExecutableFile(fileInfo.name || '')

          if (isExecutable) {
            // Use fetch with specific anti-IDM techniques for executables
            filesAPI
              ._downloadExecutableViaFetch(token, onProgress, abortController)
              .then(resolve)
              .catch(reject)
          } else {
            // Use normal XMLHttpRequest for other files
            filesAPI
              ._downloadNormalFile(token, onProgress, abortController)
              .then(resolve)
              .catch(reject)
          }
        })
        .catch((error) => {
          if (error.name === 'AbortError') {
            reject(new Error('Download cancelled'))
          } else {
            // Fallback to normal download if status check fails
            filesAPI
              ._downloadNormalFile(token, onProgress, abortController)
              .then(resolve)
              .catch(reject)
          }
        })
    })
  },

  // New resumable download function with Range request support
  downloadWithProgressResumable: (
    token,
    onProgress,
    abortController = null,
    startByte = 0,
    chunks = [],
  ) => {
    return new Promise((resolve, reject) => {
      const apiToken = localStorage.getItem('token')

      fetch(`${api.defaults.baseURL}/r/${token}`, {
        method: 'GET',
        headers: {
          ...(apiToken && { Authorization: `Bearer ${apiToken}` }),
          ...(startByte > 0 && { Range: `bytes=${startByte}-` }),
        },
        signal: abortController?.signal,
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const reader = response.body?.getReader()
          if (!reader) {
            // Fallback for browsers without stream support
            return response.blob().then((blob) => {
              const allChunks = [...chunks]
              allChunks.push(blob)
              const finalBlob = new Blob(allChunks, { type: 'application/octet-stream' })

              filesAPI._triggerAntiIDMDownload(
                finalBlob,
                response.headers.get('x-original-name') ||
                  response.headers.get('x-file-name') ||
                  'download',
              )
              resolve({
                fileName:
                  response.headers.get('x-original-name') ||
                  response.headers.get('x-file-name') ||
                  'download',
                total: finalBlob.size,
                loaded: finalBlob.size,
                chunks: allChunks,
              })
            })
          }

          const contentLength =
            response.headers.get('content-length') || response.headers.get('x-file-size')
          const contentRange = response.headers.get('content-range')
          const fileName =
            response.headers.get('x-original-name') ||
            response.headers.get('x-file-name') ||
            'download'

          let total = contentLength ? parseInt(contentLength, 10) : 0
          let loaded = startByte

          // Parse content-range header if present (e.g., "bytes 200-1023/1024")
          if (contentRange) {
            const matches = contentRange.match(/bytes \d+-\d+\/(\d+)/)
            if (matches) {
              total = parseInt(matches[1], 10)
            }
          }

          const allChunks = [...chunks]

          function pump() {
            return reader
              .read()
              .then(({ done, value }) => {
                // Check if aborted
                if (abortController?.signal.aborted) {
                  reader.cancel()
                  throw new Error('Download cancelled')
                }

                if (done) {
                  const finalBlob = new Blob(allChunks, { type: 'application/octet-stream' })
                  filesAPI._triggerAntiIDMDownload(finalBlob, fileName)
                  resolve({ fileName, total, loaded, chunks: allChunks })
                  return
                }

                allChunks.push(value)
                loaded += value.length

                // Throttle progress updates to reduce UI overhead
                const now = Date.now()
                if (!pump.lastProgressUpdate || now - pump.lastProgressUpdate > 100) {
                  pump.lastProgressUpdate = now

                  if (onProgress) {
                    onProgress({
                      loaded,
                      total,
                      progress: total > 0 ? Math.round((loaded / total) * 100) : 0,
                      chunks: allChunks,
                    })
                  }
                }

                return pump()
              })
              .catch((error) => {
                if (error.message === 'Download cancelled' || abortController?.signal.aborted) {
                  reader.cancel()
                  // Return current state for potential resume
                  reject({
                    message: 'Download cancelled',
                    resumeData: {
                      loaded,
                      total,
                      chunks: allChunks,
                      fileName,
                    },
                  })
                } else {
                  reject(error)
                }
              })
          }

          return pump()
        })
        .catch((error) => {
          if (error.name === 'AbortError') {
            reject({
              message: 'Download cancelled',
              resumeData: {
                loaded: startByte + chunks.reduce((sum, chunk) => sum + chunk.size, 0),
                total: 0,
                chunks,
                fileName: 'download',
              },
            })
          } else {
            reject(error)
          }
        })
    })
  },

  // Special download method for executable files to avoid IDM
  _downloadExecutableViaFetch: (token, onProgress, abortController = null) => {
    return new Promise((resolve, reject) => {
      const apiToken = localStorage.getItem('token')

      // Use fetch with anti-IDM headers and techniques
      fetch(`${api.defaults.baseURL}/r/${token}`, {
        method: 'GET',
        headers: {
          ...(apiToken && { Authorization: `Bearer ${apiToken}` }),
          // Headers to make it look like a regular web request, not a download
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          // Anti-detection headers
          'Sec-Fetch-Site': 'same-origin',
          'Sec-Fetch-Mode': 'no-cors',
          'Sec-Fetch-Dest': 'empty',
          'X-Requested-With': 'XMLHttpRequest',
          // Make it look like a regular AJAX request
          'Content-Type': 'application/json',
        },
        // Don't set credentials to avoid triggering download manager detection
        credentials: 'same-origin',
        // Use no-cors mode to avoid preflight requests that IDM might detect
        mode: 'cors',
        signal: abortController?.signal,
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const reader = response.body?.getReader()
          if (!reader) {
            // Fallback for browsers without stream support
            return response.blob().then((blob) => {
              filesAPI._triggerAntiIDMDownload(
                blob,
                response.headers.get('x-original-name') ||
                  response.headers.get('x-file-name') ||
                  'download',
              )
              resolve({
                fileName:
                  response.headers.get('x-original-name') ||
                  response.headers.get('x-file-name') ||
                  'download',
                total: blob.size,
                loaded: blob.size,
              })
            })
          }

          const contentLength =
            response.headers.get('content-length') || response.headers.get('x-file-size')
          const fileName =
            response.headers.get('x-original-name') ||
            response.headers.get('x-file-name') ||
            'download'
          const total = contentLength ? parseInt(contentLength, 10) : 0
          let loaded = 0
          const chunks = []

          function pump() {
            return reader
              .read()
              .then(({ done, value }) => {
                // Check if aborted
                if (abortController?.signal.aborted) {
                  reader.cancel()
                  throw new Error('Download cancelled')
                }

                if (done) {
                  const blob = new Blob(chunks, { type: 'application/octet-stream' })
                  filesAPI._triggerAntiIDMDownload(blob, fileName)
                  resolve({ fileName, total, loaded })
                  return
                }

                chunks.push(value)
                loaded += value.length

                if (onProgress) {
                  onProgress({
                    loaded,
                    total,
                    progress: total > 0 ? Math.round((loaded / total) * 100) : 0,
                  })
                }

                return pump()
              })
              .catch((error) => {
                if (error.message === 'Download cancelled' || abortController?.signal.aborted) {
                  reader.cancel()
                  reject(new Error('Download cancelled'))
                } else {
                  reject(error)
                }
              })
          }

          return pump()
        })
        .catch((error) => {
          if (error.name === 'AbortError') {
            reject(new Error('Download cancelled'))
          } else {
            reject(error)
          }
        })
    })
  },

  // Anti-IDM download trigger - optimized for performance
  _triggerAntiIDMDownload: (blob, fileName) => {
    // Optimized single-method approach to reduce memory usage and lag
    const link = document.createElement('a')

    // Create object URL (more memory efficient than data URL for large files)
    const objectUrl = window.URL.createObjectURL(blob)

    // Set up the download link
    link.href = objectUrl
    link.download = fileName
    link.style.display = 'none'

    // Add to DOM, trigger download, then clean up immediately
    document.body.appendChild(link)

    // Use requestAnimationFrame to ensure DOM update before click
    window.requestAnimationFrame(() => {
      link.click()

      // Clean up immediately to prevent memory leaks
      window.requestAnimationFrame(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(objectUrl)
      })
    })
  },

  // Normal download method for non-executable files
  _downloadNormalFile: (token, onProgress, abortController = null) => {
    return new Promise((resolve, reject) => {
      const apiToken = localStorage.getItem('token')
      const fullUrl = `${api.defaults.baseURL}/r/${token}`

      // Use XMLHttpRequest for better control
      const xhr = new XMLHttpRequest()
      xhr.open('GET', fullUrl, true)
      xhr.responseType = 'blob'

      // Handle abort controller
      if (abortController) {
        abortController.signal.addEventListener('abort', () => {
          xhr.abort()
        })
      }

      // Set headers
      if (apiToken) {
        xhr.setRequestHeader('Authorization', `Bearer ${apiToken}`)
      }
      xhr.setRequestHeader('Cache-Control', 'no-cache')
      xhr.setRequestHeader('Pragma', 'no-cache')
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest')

      // Track progress
      xhr.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const loaded = event.loaded
          const total = event.total
          onProgress({
            loaded,
            total,
            progress: Math.round((loaded / total) * 100),
          })
        }
      }

      xhr.onabort = () => {
        reject(new Error('Download cancelled'))
      }

      xhr.onerror = () => {
        reject(new Error('Download failed'))
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const blob = xhr.response
          let fileName = xhr.getResponseHeader('x-file-name') || 'download'

          // Check if this is a masked executable file and restore original name
          const originalName = xhr.getResponseHeader('x-original-name')
          if (originalName && originalName !== fileName) {
            console.log(`🔓 Restoring original filename: "${fileName}" → "${originalName}"`)
            fileName = originalName
          }

          // Simple download approach for normal files
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.style.display = 'none'
          a.href = url
          a.download = fileName

          document.body.appendChild(a)
          a.click()

          // Cleanup
          setTimeout(() => {
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
          }, 100)

          resolve({ fileName, total: blob.size, loaded: blob.size })
        } else {
          reject(new Error(`HTTP error! status: ${xhr.status}`))
        }
      }

      xhr.onerror = () => {
        reject(new Error('Network error occurred'))
      }

      xhr.ontimeout = () => {
        reject(new Error('Download timeout'))
      }

      xhr.timeout = 300000 // 5 minutes
      xhr.send()
    })
  },
  getFileStatus: (token) => api.get(`/status/${token}`),
  getPublicFileStatus: (token) => api.get(`/public-status/${token}`),
}

export default api

// Export the API configuration for use in other parts of the app
export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  isDev: import.meta.env.DEV,
}
