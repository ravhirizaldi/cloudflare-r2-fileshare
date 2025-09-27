// Turnstile Composable for handling Cloudflare Turnstile integration
import { ref, onMounted, onUnmounted } from 'vue'

export function useTurnstile(siteKey = null) {
  const turnstileRef = ref(null)
  const turnstileToken = ref('')
  const isLoading = ref(true)
  const error = ref('')
  const isRendered = ref(false) // Track if Turnstile has been rendered

  let effectiveSiteKey = siteKey || import.meta.env.VITE_TURNSTILE_SITE_KEY

  // Validate site key
  if (!effectiveSiteKey || typeof effectiveSiteKey !== 'string') {
    console.warn('Turnstile site key is missing or invalid. Using development key.')
    // Use Cloudflare's test site key for development
    effectiveSiteKey = '1x00000000000000000000AA'
  }

  // Load Turnstile script
  const loadTurnstileScript = () => {
    return new Promise((resolve, reject) => {
      if (window.turnstile) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      script.async = true
      script.defer = true

      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Turnstile script'))

      document.head.appendChild(script)
    })
  }

  // Initialize Turnstile widget
  const initTurnstile = async () => {
    if (!effectiveSiteKey) {
      error.value = 'Turnstile site key not configured'
      isLoading.value = false
      return
    }

    // Ensure sitekey is a string
    const siteKeyString = String(effectiveSiteKey).trim()

    if (!siteKeyString) {
      error.value = 'Turnstile site key is empty'
      isLoading.value = false
      return
    }

    console.log('Initializing Turnstile with site key:', siteKeyString)

    try {
      await loadTurnstileScript()

      if (turnstileRef.value && window.turnstile) {
        // Check if already rendered and clean up first
        if (isRendered.value) {
          console.log('Turnstile already rendered, cleaning up first...')
          try {
            window.turnstile.remove(turnstileRef.value)
          } catch (removeErr) {
            console.warn('Failed to remove existing Turnstile:', removeErr)
          }
          isRendered.value = false
        }

        // Clear the container to ensure clean state
        if (turnstileRef.value) {
          turnstileRef.value.innerHTML = ''
        }

        // Render with properly typed site key
        const widgetId = window.turnstile.render(turnstileRef.value, {
          sitekey: siteKeyString, // Ensure it's explicitly a string
          callback: (token) => {
            console.log('Turnstile verification successful')
            turnstileToken.value = token
            error.value = ''
          },
          'error-callback': (errorCode) => {
            console.error('Turnstile error:', errorCode)
            error.value = `Turnstile error: ${errorCode}`
            turnstileToken.value = ''
          },
          'expired-callback': () => {
            console.warn('Turnstile token expired')
            turnstileToken.value = ''
            error.value = 'Turnstile token expired'
          },
          'timeout-callback': () => {
            console.warn('Turnstile verification timeout')
            turnstileToken.value = ''
            error.value = 'Turnstile verification timeout'
          },
          theme: 'auto',
          size: 'normal',
        })

        console.log('Turnstile rendered with widget ID:', widgetId)
        isRendered.value = true
      } else if (!turnstileRef.value) {
        error.value = 'Turnstile container not found'
      } else if (!window.turnstile) {
        error.value = 'Turnstile script failed to load'
      }
      isLoading.value = false
    } catch (err) {
      console.error('Failed to initialize Turnstile:', err)
      error.value = `Failed to initialize Turnstile: ${err.message}`
      isLoading.value = false
      isRendered.value = false
    }
  }

  // Reset Turnstile
  const resetTurnstile = () => {
    try {
      if (window.turnstile && turnstileRef.value && isRendered.value) {
        window.turnstile.reset(turnstileRef.value)
        turnstileToken.value = ''
        error.value = ''
      }
    } catch (err) {
      console.warn('Failed to reset Turnstile:', err)
      // Don't throw error, just clear the token and error state
      turnstileToken.value = ''
      error.value = ''
      isRendered.value = false // Allow re-rendering after failed reset
    }
  }

  // Remove existing Turnstile widget completely
  const destroyTurnstile = () => {
    try {
      if (window.turnstile && turnstileRef.value && isRendered.value) {
        window.turnstile.remove(turnstileRef.value)
        isRendered.value = false
        turnstileToken.value = ''
        error.value = ''
      }
    } catch (err) {
      console.warn('Failed to destroy Turnstile:', err)
      isRendered.value = false
      turnstileToken.value = ''
      error.value = ''
    }
  }

  // Get current token
  const getToken = () => turnstileToken.value

  // Check if token is valid
  const isTokenValid = () => !!turnstileToken.value && !error.value

  onMounted(() => {
    // Try to initialize with retry mechanism
    let retries = 0
    const maxRetries = 20 // Max 1 second (20 * 50ms)

    const tryInit = () => {
      if (turnstileRef.value) {
        initTurnstile()
      } else if (retries < maxRetries) {
        retries++
        setTimeout(tryInit, 50)
      } else {
        // Give up after max retries
        error.value = 'Turnstile container not available'
        isLoading.value = false
      }
    }
    tryInit()
  })

  onUnmounted(() => {
    // Cleanup Turnstile widget
    destroyTurnstile()
  })

  return {
    turnstileRef,
    turnstileToken,
    isLoading,
    error,
    resetTurnstile,
    destroyTurnstile,
    getToken,
    isTokenValid,
    initTurnstile,
  }
}
