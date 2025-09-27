/**
 * Performance monitoring utilities for tracking component performance
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map()
    // Enable basic monitoring in production for critical metrics
    this.enabled = true
    this.developmentMode = import.meta.env.DEV
  }

  // Start timing a component load
  startTiming(componentName) {
    if (!this.enabled) return

    this.metrics.set(componentName, {
      startTime: performance.now(),
      endTime: null,
      duration: null,
    })
  }

  // End timing a component load
  endTiming(componentName) {
    if (!this.enabled) return

    const metric = this.metrics.get(componentName)
    if (metric) {
      metric.endTime = performance.now()
      metric.duration = metric.endTime - metric.startTime

      // Log slow loading components (>1 second)
      if (metric.duration > 1000) {
        // Only log warnings in development, use lightweight tracking in production
        if (this.developmentMode) {
          console.warn(`Slow component load: ${componentName} took ${metric.duration.toFixed(2)}ms`)
        } else {
          // In production, just track without verbose logging
          console.info(`Component load: ${componentName} - ${metric.duration.toFixed(2)}ms`)
        }
      }
    }
  }

  // Get metrics for a component
  getMetrics(componentName) {
    return this.metrics.get(componentName)
  }

  // Get all metrics
  getAllMetrics() {
    return Object.fromEntries(this.metrics)
  }

  // Clear all metrics
  clearMetrics() {
    this.metrics.clear()
  }

  // Log performance report
  logReport() {
    if (!this.enabled || !this.developmentMode) return

    const metrics = this.getAllMetrics()
    const sortedComponents = Object.entries(metrics)
      .filter(([, metric]) => metric.duration !== null)
      .sort(([, a], [, b]) => b.duration - a.duration)

    if (sortedComponents.length > 0) {
      console.group('📊 Component Load Performance')
      console.table(
        sortedComponents.reduce((acc, [name, metric]) => {
          acc[name] = {
            'Load Time (ms)': metric.duration.toFixed(2),
            Status: metric.duration > 1000 ? '⚠️ Slow' : '✅ Fast',
          }
          return acc
        }, {}),
      )
      console.groupEnd()
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * Higher-order component wrapper to monitor performance
 * @param {Function} componentLoader - The component loader function
 * @param {string} componentName - Name for tracking
 * @returns {Function} - Wrapped loader function
 */
export function withPerformanceTracking(componentLoader, componentName) {
  return async () => {
    performanceMonitor.startTiming(componentName)

    try {
      const component = await componentLoader()
      performanceMonitor.endTiming(componentName)
      return component
    } catch (error) {
      performanceMonitor.endTiming(componentName)
      throw error
    }
  }
}

/**
 * Vue composable for component performance tracking
 * @param {string} componentName - Name of the component
 * @returns {Object} - Composable object with tracking functions
 */
export function usePerformanceTracking(componentName) {
  const startTracking = () => performanceMonitor.startTiming(componentName)
  const endTracking = () => performanceMonitor.endTiming(componentName)
  const getMetrics = () => performanceMonitor.getMetrics(componentName)

  return {
    startTracking,
    endTracking,
    getMetrics,
  }
}
