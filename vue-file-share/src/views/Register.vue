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
      class="col-span-12 lg:col-span-4 h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 grid place-items-center"
    >
      <div class="w-full max-w-sm space-y-5">
        <!-- Heading -->
        <div class="text-center">
          <h2 class="text-xl font-extrabold text-gray-900">Create Your Account</h2>
          <p class="mt-1 text-sm text-gray-600">
            Already registered?
            <router-link
              to="/login"
              class="font-medium text-blue-600 hover:text-blue-500 transition"
            >
              Sign in
            </router-link>
          </p>
        </div>

        <!-- Form -->
        <form class="space-y-3" @submit.prevent="handleRegister">
          <div>
            <label for="name" class="block text-xs font-medium text-gray-700">Full Name</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label for="username" class="block text-xs font-medium text-gray-700">Username</label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              required
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500"
              placeholder="johndoe"
            />
          </div>
          <div>
            <label for="password" class="block text-xs font-medium text-gray-700">Password</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500"
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
              required
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500"
              placeholder="••••••••"
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

          <!-- Errors -->
          <div v-if="error" class="text-red-600 text-xs text-center font-medium">
            {{ error }}
          </div>
          <div v-if="formError" class="text-red-600 text-xs text-center font-medium">
            {{ formError }}
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="isLoading || !isFormValid || (effectiveSiteKey && !turnstileToken)"
            class="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-md text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:ring-2 focus:ring-offset-1 focus:ring-purple-500 transition disabled:opacity-60"
          >
            <UserPlusIcon v-if="!isLoading" class="h-4 w-4" />
            {{ isLoading ? 'Creating account...' : 'Create Account' }}
          </button>
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
import VueTurnstile from 'vue-turnstile'

const router = useRouter()
const authStore = useAuthStore()
const { success, error: showError } = useToast()

// Turnstile integration
const { turnstileToken, error: turnstileError, effectiveSiteKey } = useTurnstile()

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

  // Check if Turnstile token is required and present
  if (effectiveSiteKey.value && !turnstileToken.value) {
    formError.value = 'Please complete the security verification'
    return
  }

  try {
    await authStore.register({
      name: form.name,
      username: form.username,
      password: form.password,
      turnstileToken: turnstileToken.value || null,
    })
    success('Account created successfully!')
    router.push('/dashboard')
  } catch (err) {
    showError('Registration failed: ' + (err.response?.data?.message || err.message))
  }
}
</script>
