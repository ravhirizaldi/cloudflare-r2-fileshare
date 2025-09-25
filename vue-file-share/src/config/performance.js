/* eslint-env browser */
// Performance configuration for the application
export const PERFORMANCE_CONFIG = {
  // Component loading delays
  COMPONENT_LOAD_DELAY: 200, // ms before showing loading state
  COMPONENT_TIMEOUT: 10000, // ms before component load fails

  // Prefetch configuration
  PREFETCH_DELAY: 1000, // ms delay before prefetching
  CRITICAL_ROUTES: ['Home', 'Dashboard'], // Routes to preload

  // Bundle splitting
  CHUNK_SIZE_WARNING: 1000, // KB

  // API performance
  API_TIMEOUT: 30000, // ms
  REQUEST_RETRY_DELAY: 1000, // ms
  MAX_RETRIES: 3,

  // File upload
  CHUNK_SIZE: 1024 * 1024, // 1MB chunks for large files
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB max file size

  // UI performance
  DEBOUNCE_DELAY: 300, // ms for search inputs
  VIRTUAL_SCROLL_THRESHOLD: 100, // number of items before virtualization
}

// Performance utilities
export const performanceUtils = {
  // Debounce function for search inputs
  debounce(func, delay = PERFORMANCE_CONFIG.DEBOUNCE_DELAY) {
    let timeoutId
    return function (...args) {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func.apply(this, args), delay)
    }
  },

  // Throttle function for scroll events
  throttle(func, delay = 100) {
    let lastCall = 0
    return function (...args) {
      const now = Date.now()
      if (now - lastCall >= delay) {
        lastCall = now
        return func.apply(this, args)
      }
    }
  },

  // Intersection observer for lazy loading
  createIntersectionObserver(callback, options = {}) {
    if (typeof IntersectionObserver === 'undefined') {
      console.warn('IntersectionObserver not supported')
      return null
    }
    return new IntersectionObserver(callback, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options,
    })
  },

  // Check if device has reduced motion preference
  prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  },
}
