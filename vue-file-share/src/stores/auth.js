import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI } from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => !!token.value)

  // Initialize from localStorage
  const initAuth = () => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedToken !== 'undefined' && storedToken !== 'null') {
      token.value = storedToken
    }

    if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
      try {
        user.value = JSON.parse(storedUser)
      } catch (error) {
        console.warn('Failed to parse stored user data:', error)
        clearStoredAuth()
      }
    }
  }

  const login = async (credentials) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await authAPI.login(credentials)
      const { token: authToken, user: userData } = response.data || {}

      if (!authToken) {
        throw new Error('Invalid response from server - no token received')
      }

      token.value = authToken

      // If user data is provided, store it; otherwise create basic user info
      if (userData) {
        user.value = userData
        localStorage.setItem('user', JSON.stringify(userData))
      } else {
        // Create basic user object with username from credentials
        const basicUser = {
          username: credentials.username || credentials.email,
          name: credentials.username || credentials.email,
        }
        user.value = basicUser
        localStorage.setItem('user', JSON.stringify(basicUser))
      }

      localStorage.setItem('token', authToken)

      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Login failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const register = async (userData) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await authAPI.register(userData)
      const { token: authToken, user: newUser } = response.data || {}

      if (!authToken) {
        throw new Error('Invalid response from server - no token received')
      }

      token.value = authToken

      // If user data is provided, store it; otherwise create basic user info
      if (newUser) {
        user.value = newUser
        localStorage.setItem('user', JSON.stringify(newUser))
      } else {
        // Create basic user object from registration data
        const basicUser = {
          username: userData.username || userData.email,
          name: userData.name || userData.username || userData.email,
        }
        user.value = basicUser
        localStorage.setItem('user', JSON.stringify(basicUser))
      }

      localStorage.setItem('token', authToken)

      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Registration failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const logout = () => {
    token.value = null
    user.value = null
    try {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    } catch (error) {
      console.warn('Failed to clear localStorage:', error)
    }
  }

  const clearStoredAuth = () => {
    // Utility function to clear any corrupted auth data
    token.value = null
    user.value = null
    try {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    } catch (error) {
      console.warn('Failed to clear localStorage:', error)
    }
  }

  const fetchProfile = async () => {
    try {
      const response = await authAPI.getProfile()
      user.value = response.data
      localStorage.setItem('user', JSON.stringify(response.data))
      return response.data
    } catch (err) {
      logout()
      throw err
    }
  }

  return {
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    initAuth,
    login,
    register,
    logout,
    fetchProfile,
    clearStoredAuth,
  }
})

// Export alias for backward compatibility
export const useAuth = useAuthStore
