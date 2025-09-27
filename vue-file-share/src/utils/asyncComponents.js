import { defineAsyncComponent, h } from 'vue'

// Lightweight loading component
const LoadingSpinner = {
  render() {
    return h(
      'div',
      {
        class: 'flex items-center justify-center p-8 min-h-[200px]',
      },
      [
        h('div', {
          class: 'animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent',
        }),
        h(
          'span',
          {
            class: 'ml-3 text-gray-600 font-medium',
          },
          'Loading...',
        ),
      ],
    )
  },
}

// Error fallback component
const ErrorFallback = {
  render() {
    return h(
      'div',
      {
        class: 'p-6 bg-red-50 border border-red-200 rounded-lg text-center',
      },
      [
        h(
          'div',
          {
            class: 'text-red-600 mb-2',
          },
          '⚠️',
        ),
        h(
          'p',
          {
            class: 'text-red-700 font-medium mb-2',
          },
          'Failed to load component',
        ),
        h(
          'p',
          {
            class: 'text-red-600 text-sm',
          },
          'Please try refreshing the page',
        ),
      ],
    )
  },
}

/**
 * Creates an optimized async component with better performance
 * @param {Function} loader - Component loader function
 * @param {Object} options - Configuration options
 * @returns {Object} Vue async component
 */
export function createOptimizedAsyncComponent(loader, options = {}) {
  return defineAsyncComponent({
    loader,
    loadingComponent: LoadingSpinner,
    errorComponent: ErrorFallback,
    delay: options.delay || 50, // Reduced delay for faster perceived performance
    timeout: options.timeout || 5000, // Reduced timeout
    suspensible: true, // Enable suspense by default
    onError:
      options.onError ||
      ((error, retry, fail, attempts) => {
        console.warn(`Failed to load component (attempt ${attempts}):`, error)
        if (attempts <= 2) {
          // Retry up to 2 times
          setTimeout(retry, 500)
        } else {
          fail()
        }
      }),
  })
}

/**
 * Preload a component for better performance
 * @param {Function} loader - Component loader function
 * @returns {Promise} Component promise
 */
export function preloadComponent(loader) {
  return loader().then((module) => {
    // Cache the module for faster subsequent loads
    return module
  })
}

/**
 * Creates a map of async components with consistent loading behavior
 * @param {Object} components - Object mapping component names to loaders
 * @param {Object} globalOptions - Global options for all components
 * @returns {Object} Object mapping component names to async components
 */
export function createAsyncComponents(components, globalOptions = {}) {
  const asyncComponents = {}

  for (const [name, loader] of Object.entries(components)) {
    asyncComponents[name] = createOptimizedAsyncComponent(loader, {
      ...globalOptions,
      ...components[`${name}Options`], // Allow per-component options
    })
  }

  return asyncComponents
}

export { LoadingSpinner, ErrorFallback }
