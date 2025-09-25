<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-md w-full space-y-8">
      <!-- Icon / Logo -->
      <div class="flex justify-center">
        <div class="p-3 bg-gradient-to-r from-purple-500 to-blue-600 rounded-2xl shadow-lg">
          <UserPlusIcon class="h-8 w-8 text-white" />
        </div>
      </div>

      <!-- Heading -->
      <div class="text-center">
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900 tracking-tight">
          Create Your Account
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Already registered?
          <router-link to="/login" class="font-medium text-blue-600 hover:text-blue-500 transition">
            Sign in
          </router-link>
        </p>
      </div>

      <!-- Form Card -->
      <div
        class="bg-white/70 backdrop-blur-lg shadow-xl rounded-xl p-8 space-y-6 border border-gray-100"
      >
        <form class="space-y-5" @submit.prevent="handleRegister">
          <!-- Inputs -->
          <div class="space-y-4">
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                id="name"
                v-model="form.name"
                type="text"
                autocomplete="name"
                required
                class="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label for="username" class="block text-sm font-medium text-gray-700">Username</label>
              <input
                id="username"
                v-model="form.username"
                type="text"
                autocomplete="username"
                required
                class="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="johndoe"
              />
            </div>
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
              <input
                id="password"
                v-model="form.password"
                type="password"
                autocomplete="new-password"
                required
                class="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700"
                >Confirm Password</label
              >
              <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                type="password"
                autocomplete="new-password"
                required
                class="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <!-- Errors -->
          <div v-if="error" class="text-red-600 text-sm text-center font-medium">
            {{ error }}
          </div>
          <div v-if="formError" class="text-red-600 text-sm text-center font-medium">
            {{ formError }}
          </div>

          <!-- Submit -->
          <div>
            <button
              type="submit"
              :disabled="isLoading || !isFormValid"
              class="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition disabled:opacity-60"
            >
              <UserPlusIcon v-if="!isLoading" class="h-5 w-5" />
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
import { UserPlusIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const { success, error: showError } = useToast()

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

  try {
    await authStore.register({
      name: form.name,
      username: form.username,
      password: form.password,
    })
    success('Account created successfully!')
    router.push('/dashboard')
  } catch (err) {
    showError('Registration failed: ' + (err.response?.data?.message || err.message))
  }
}
</script>
