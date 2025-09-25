import { defineAsyncComponent } from 'vue'
import { PERFORMANCE_CONFIG } from '../config/performance.js'

// Loading component for async components
const LoadingComponent = {
  template: `
    <div class="flex items-center justify-center p-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-2 text-gray-600">Loading...</span>
    </div>
  `,
}

// Error component for failed loads
const ErrorComponent = {
  template: `
    <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-red-600">Failed to load component. Please try refreshing the page.</p>
    </div>
  `,
}

/**
 * Creates an optimized async component with loading and error states
 * @param {Function} loader - The dynamic import function
 * @param {Object} options - Additional options
 * @returns {Object} - Vue async component definition
 */
export function createAsyncComponent(loader, options = {}) {
  return defineAsyncComponent({
    loader,
    loadingComponent: LoadingComponent,
    errorComponent: ErrorComponent,
    delay: options.delay || PERFORMANCE_CONFIG.COMPONENT_LOAD_DELAY,
    timeout: options.timeout || PERFORMANCE_CONFIG.COMPONENT_TIMEOUT,
    suspensible: options.suspensible !== false, // Enable suspense by default
  })
}

/**
 * Pre-loads a component for better performance
 * @param {Function} loader - The dynamic import function
 * @returns {Promise} - Promise that resolves when component is loaded
 */
export function preloadComponent(loader) {
  return loader()
}

/**
 * Creates a map of preloaded components for critical routes
 * @param {Object} routes - Object with route names and their loaders
 * @returns {Object} - Object with preloaded component promises
 */
export function preloadCriticalComponents(routes) {
  const preloaded = {}

  Object.keys(routes).forEach((routeName) => {
    preloaded[routeName] = preloadComponent(routes[routeName])
  })

  return preloaded
}
