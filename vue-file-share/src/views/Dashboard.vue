<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div class="flex items-center">
            <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
          </div>
          <nav class="flex items-center space-x-4">
            <span class="text-gray-600">Welcome, {{ user?.name }}</span>
            <button
              class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1"
              @click="handleLogout"
            >
              <ArrowRightOnRectangleIcon class="h-4 w-4" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-12 gap-8">
        <!-- Files List Section - Left Pane (8/12) -->
        <div class="col-span-8">
          <div class="bg-white rounded-lg shadow p-6 h-full">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-semibold text-gray-900">Your Files</h2>
              <button
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                @click="refreshFiles"
              >
                <ArrowPathIcon class="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
            <FilesList />
          </div>
        </div>

        <!-- Upload Section - Right Pane (4/12) -->
        <div class="col-span-4">
          <div class="bg-white rounded-lg shadow p-6 h-full">
            <h2 class="text-xl font-semibold text-gray-900 mb-6">Upload Files</h2>
            <FileUpload />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useFilesStore } from '../stores/files'
import { useToast } from '../composables/useToast'
import FileUpload from '../components/FileUpload.vue'
import FilesList from '../components/FilesList.vue'
import { ArrowRightOnRectangleIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const filesStore = useFilesStore()
const { success } = useToast()

const { user } = authStore

const handleLogout = () => {
  authStore.logout()
  success('Logged out successfully')
  router.push('/')
}

const refreshFiles = () => {
  filesStore.fetchFiles()
}
</script>
