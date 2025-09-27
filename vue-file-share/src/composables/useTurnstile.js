// Simplified Turnstile Composable using vue-turnstile library
import { ref, computed } from 'vue'

export function useTurnstile(siteKey = null) {
  const turnstileToken = ref('')
  const isLoading = ref(true)
  const error = ref('')

  // Get effective site key
  const effectiveSiteKey = computed(() => {
    let key = siteKey || import.meta.env.VITE_TURNSTILE_SITE_KEY

    // Validate and provide fallback
    if (!key || typeof key !== 'string' || !key.trim()) {
      console.warn('Turnstile site key is missing or invalid. Using development key.')
      // Use Cloudflare's test site key for development (always passes)
      key = '1x00000000000000000000FF'
    }

    return String(key).trim()
  })

  // Handle verification success
  const onVerify = (token) => {
    console.log('Turnstile verification successful', token)
    turnstileToken.value = token
    error.value = ''
    isLoading.value = false
  }

  // Handle verification error
  const onError = (errorCode) => {
    console.error('Turnstile error:', errorCode)
    error.value = `Verification failed: ${errorCode}`
    turnstileToken.value = ''
    isLoading.value = false
  }

  // Handle token expiration
  const onExpire = () => {
    console.warn('Turnstile token expired')
    turnstileToken.value = ''
    error.value = 'Token expired, please try again'
    isLoading.value = false
  }

  // Reset Turnstile state
  const resetTurnstile = () => {
    turnstileToken.value = ''
    error.value = ''
    isLoading.value = true
  }

  // Get current token
  const getToken = () => turnstileToken.value

  // Check if token is valid
  const isTokenValid = () => !!turnstileToken.value && !error.value

  return {
    turnstileToken,
    isLoading,
    error,
    effectiveSiteKey,
    onVerify,
    onError,
    onExpire,
    resetTurnstile,
    getToken,
    isTokenValid,
  }
}
