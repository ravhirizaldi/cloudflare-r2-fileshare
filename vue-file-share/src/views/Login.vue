<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-md w-full space-y-8">
      <!-- Logo or Icon -->
      <div class="flex justify-center">
        <div class="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
          <ArrowRightOnRectangleIcon class="h-8 w-8 text-white" />
        </div>
      </div>

      <!-- Heading -->
      <div class="text-center">
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900 tracking-tight">Welcome Back</h2>
        <p class="mt-2 text-sm text-gray-600">
          Don’t have an account?
          <router-link
            to="/register"
            class="font-medium text-blue-600 hover:text-blue-500 transition"
          >
            Create one
          </router-link>
        </p>
      </div>

      <!-- Form Card -->
      <div
        class="bg-white/70 backdrop-blur-lg shadow-xl rounded-xl p-8 space-y-6 border border-gray-100"
      >
        <form class="space-y-6" @submit.prevent="handleLogin">
          <!-- Inputs -->
          <div class="space-y-4">
            <div>
              <label for="username" class="block text-sm font-medium text-gray-700">Username</label>
              <input
                id="username"
                v-model="form.username"
                name="username"
                type="text"
                autocomplete="username"
                required
                class="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your username"
              />
            </div>
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
              <input
                id="password"
                v-model="form.password"
                name="password"
                type="password"
                autocomplete="current-password"
                required
                class="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <!-- Error -->
          <div v-if="error" class="text-red-600 text-sm text-center font-medium">
            {{ error }}
          </div>

          <!-- Submit -->
          <div>
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-60"
            >
              <ArrowRightOnRectangleIcon v-if="!isLoading" class="h-5 w-5" />
              {{ isLoading ? 'Signing in...' : 'Sign In' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useToast } from '../composables/useToast'
import { ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const { success, error: showError } = useToast()

const form = reactive({
  username: '',
  password: '',
})

const { isLoading, error } = authStore

const handleLogin = async () => {
  try {
    await authStore.login(form)
    success('Welcome back!')
    router.push('/dashboard')
  } catch (err) {
    showError('Login failed: ' + (err.response?.data?.message || err.message))
  }
}
</script>
