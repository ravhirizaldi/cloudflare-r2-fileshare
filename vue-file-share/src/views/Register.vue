<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-md w-full space-y-6">
      <!-- Icon / Logo -->
      <div class="flex justify-center">
        <div class="p-2.5 bg-gradient-to-r from-purple-500 to-blue-600 rounded-2xl shadow-lg">
          <UserPlusIcon class="h-7 w-7 text-white" />
        </div>
      </div>

      <!-- Heading -->
      <div class="text-center">
        <h2 class="mt-2 text-2xl font-extrabold text-gray-900 tracking-tight">
          Create Your Account
        </h2>
        <p class="mt-1 text-xs text-gray-600">
          Already registered?
          <router-link to="/login" class="font-medium text-blue-600 hover:text-blue-500 transition">
            Sign in
          </router-link>
        </p>
      </div>

      <!-- Form Card -->
      <div
        class="bg-white/70 backdrop-blur-lg shadow-xl rounded-xl p-6 space-y-5 border border-gray-100"
      >
        <form class="space-y-4" @submit.prevent="handleRegister">
          <!-- Inputs -->
          <div class="space-y-3">
            <div>
              <label for="name" class="block text-xs font-medium text-gray-700">Full Name</label>
              <input
                id="name"
                v-model="form.name"
                type="text"
                autocomplete="name"
                required
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label for="username" class="block text-xs font-medium text-gray-700">Username</label>
              <input
                id="username"
                v-model="form.username"
                type="text"
                autocomplete="username"
                required
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                placeholder="johndoe"
              />
            </div>
            <div>
              <label for="password" class="block text-xs font-medium text-gray-700">Password</label>
              <input
                id="password"
                v-model="form.password"
                type="password"
                autocomplete="new-password"
                required
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label for="confirmPassword" class="block text-xs font-medium text-gray-700"
                >Confirm Password</label
              >
              <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                type="password"
                autocomplete="new-password"
                required
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <!-- Turnstile -->
          <div class="flex justify-center">
            <div ref="turnstileRef" class="cf-turnstile"></div>
            <div v-if="turnstileLoading" class="flex items-center justify-center h-16">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            </div>
          </div>
          <div v-if="turnstileError" class="text-red-600 text-xs text-center font-medium">
            {{ turnstileError }}
          </div>

          <!-- Errors -->
          <div v-if="error" class="text-red-600 text-xs text-center font-medium">
            {{ error }}
          </div>
          <div v-if="formError" class="text-red-600 text-xs text-center font-medium">
            {{ formError }}
          </div>

          <!-- Submit -->
          <div>
            <button
              type="submit"
              :disabled="isLoading || !isFormValid || !isTokenValid"
              class="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-md text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-purple-500 transition disabled:opacity-60"
            >
              <UserPlusIcon v-if="!isLoading" class="h-4 w-4" />
              {{ isLoading ? 'Creating account...' : 'Create Account' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useToast } from '../composables/useToast'
import { useTurnstile } from '../composables/useTurnstile'
import { UserPlusIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const { success, error: showError } = useToast()

// Turnstile integration
const {
  turnstileRef,
  isLoading: turnstileLoading,
  error: turnstileError,
  getToken,
  isTokenValid,
  resetTurnstile,
} = useTurnstile()

const formError = ref('')
const form = reactive({
  name: '',
  username: '',
  password: '',
  confirmPassword: '',
})

const { isLoading, error } = authStore

const isFormValid = computed(
  () =>
    form.password === form.confirmPassword &&
    form.password.length >= 6 &&
    form.username &&
    form.name,
)

const handleRegister = async () => {
  formError.value = ''

  if (form.password !== form.confirmPassword) {
    formError.value = 'Passwords do not match'
    return
  }

  if (form.password.length < 6) {
    formError.value = 'Password must be at least 6 characters long'
    return
  }

  if (!isTokenValid()) {
    formError.value = 'Please complete the security verification'
    return
  }

  try {
    await authStore.register({
      name: form.name,
      username: form.username,
      password: form.password,
      turnstileToken: getToken(),
    })
    success('Account created successfully!')
    router.push('/dashboard')
  } catch (err) {
    resetTurnstile()
    showError('Registration failed: ' + (err.response?.data?.message || err.message))
  }
}
</script>
