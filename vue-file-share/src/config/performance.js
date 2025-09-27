/* eslint-env browser */
// Performance configuration for the application
export const PERFORMANCE_CONFIG = {
  // Component loading delays (reduced for faster loading)
  COMPONENT_LOAD_DELAY: 100, // ms before showing loading state (reduced from 200)
  COMPONENT_TIMEOUT: 8000, // ms before component load fails (reduced from 10000)

  // Prefetch configuration
  PREFETCH_DELAY: 500, // ms delay before prefetching (reduced from 1000)
  CRITICAL_ROUTES: ['Home', 'Dashboard'], // Routes to preload

  // Bundle splitting
  CHUNK_SIZE_WARNING: 800, // KB (reduced from 1000)

  // API performance
  API_TIMEOUT: 15000, // ms (reduced from 30000)
  REQUEST_RETRY_DELAY: 500, // ms (reduced from 1000)
  MAX_RETRIES: 2, // reduced from 3

  // File upload
  CHUNK_SIZE: 1024 * 1024, // 1MB chunks for large files
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB max file size

  // UI performance
  DEBOUNCE_DELAY: 250, // ms for search inputs (reduced from 300)
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
