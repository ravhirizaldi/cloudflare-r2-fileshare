<template>
  <div class="h-screen grid grid-cols-1 lg:grid-cols-12">
    <!-- Left side (8/12) -->
    <div class="hidden lg:block lg:col-span-8">
      <img
        src="https://placehold.co/1200x720?text=R2+File+Share&font=roboto"
        alt="Illustration"
        class="w-full h-full object-cover"
      />
    </div>

    <!-- Right side (4/12) -->
    <div
      class="col-span-12 lg:col-span-4 h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 grid place-items-center"
      :class="{ 'cursor-wait': isLoading }"
    >
      <div class="w-full max-w-sm space-y-6">
        <!-- Heading -->
        <div class="text-center">
          <h2 class="text-xl font-extrabold text-gray-900">Welcome Back</h2>
          <p class="mt-1 text-sm text-gray-600">
            Don’t have an account?
            <router-link
              to="/register"
              class="font-medium text-blue-600 hover:text-blue-500 transition"
            >
              Create one
            </router-link>
          </p>
        </div>

        <!-- Form -->
        <form
          class="space-y-4"
          :class="{ 'cursor-wait pointer-events-none': isLoading }"
          @submit.prevent="handleLogin"
        >
          <div>
            <label for="username" class="block text-xs font-medium text-gray-700">Username</label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              autocomplete="username"
              required
              :disabled="isLoading"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label for="password" class="block text-xs font-medium text-gray-700">Password</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              autocomplete="current-password"
              required
              :disabled="isLoading"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
              placeholder="Enter your password"
            />
          </div>

          <!-- Turnstile -->
          <div v-if="effectiveSiteKey" class="flex justify-center">
            <VueTurnstile
              v-model="turnstileToken"
              :site-key="effectiveSiteKey"
              theme="light"
              size="flexible"
            />
          </div>
          <div v-if="turnstileError" class="text-red-600 text-xs text-center font-medium">
            {{ turnstileError }}
          </div>

          <!-- Error -->
          <div v-if="error" class="text-red-600 text-xs text-center font-medium">
            {{ error }}
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="isLoading || (effectiveSiteKey && !turnstileToken)"
            class="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-md text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
            :class="{ 'cursor-wait': isLoading }"
          >
            <!-- Loading spinner -->
            <svg
              v-if="isLoading"
              class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <!-- Login icon when not loading -->
            <ArrowRightOnRectangleIcon v-if="!isLoading" class="h-4 w-4" />
            {{ isLoading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useToast } from '../composables/useToast'
import { useTurnstile } from '../composables/useTurnstile'
import { ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline'
import VueTurnstile from 'vue-turnstile'

const router = useRouter()
const authStore = useAuthStore()
const { error: showError } = useToast()

// Turnstile integration
const { turnstileToken, error: turnstileError, effectiveSiteKey } = useTurnstile()

const form = reactive({
  username: '',
  password: '',
})

// Use computed for proper reactivity
const isLoading = computed(() => authStore.isLoading)
const error = computed(() => authStore.error)

const handleLogin = async () => {
  // Check if Turnstile token is required and present
  if (effectiveSiteKey.value && !turnstileToken.value) {
    showError('Please complete the security verification')
    return
  }

  try {
    // Start the login process
    await authStore.login({
      ...form,
      turnstileToken: turnstileToken.value || null,
    })

    // Small delay to ensure loading state is visible
    await new Promise((resolve) => setTimeout(resolve, 200))

    router.replace('/dashboard')
  } catch (err) {
    showError('Login failed: ' + (err.response?.data?.message || err.message))
  }
}
</script>
