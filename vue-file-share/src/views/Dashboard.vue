<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="sticky top-0 z-30 backdrop-blur-md bg-white/70 border-b border-gray-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <!-- Left side -->
          <div class="flex items-center space-x-3">
            <div class="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-md">
              <ChartBarIcon class="h-6 w-6 text-white" />
            </div>
            <h1 class="text-2xl font-extrabold text-gray-900 tracking-tight">Dashboard</h1>
          </div>

          <!-- Right side -->
          <nav class="flex items-center gap-4">
            <span class="text-gray-700 font-medium">
              Welcome, <span class="font-semibold">{{ user?.name }}</span>
            </span>
            <button
              class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-md hover:from-blue-700 hover:to-purple-700 transition"
              @click="handleLogout"
            >
              <ArrowRightOnRectangleIcon class="h-5 w-5" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- File Statistics - Full Width at Top -->
      <div class="mb-8">
        <FileStats ref="fileStatsRef" />
      </div>

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
            <FileManager :files="filesStore.files" @refresh="refreshFiles" />
          </div>
        </div>

        <!-- Upload Section - Right Pane (4/12) -->
        <div class="col-span-4 space-y-8">
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-6">Upload Files</h2>
            <FileUpload @file-uploaded="handleFileUploaded" />
          </div>

          <!-- Recent Activity Card -->
          <RecentActivity ref="recentActivityRef" />

          <!-- Admin Panel (only for admins) -->
          <AdminPanel v-if="user?.role === 'admin'" />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useFilesStore } from '../stores/files'
import FileUpload from '../components/FileUpload.vue'
import FileManager from '../components/FileManager.vue'
import FileStats from '../components/FileStats.vue'
import RecentActivity from '../components/RecentActivity.vue'
import AdminPanel from '../components/AdminPanel.vue'
import { ChartBarIcon, ArrowRightOnRectangleIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const filesStore = useFilesStore()

const { user } = authStore

// Create refs to access components
const fileStatsRef = ref(null)
const recentActivityRef = ref(null)

const handleLogout = () => {
  authStore.logout()
  router.push('/')
}

const refreshFiles = () => {
  filesStore.fetchFiles()
}

const refreshStats = () => {
  // Refresh the FileStats component if it has a refresh method
  if (fileStatsRef.value && typeof fileStatsRef.value.refreshStats === 'function') {
    fileStatsRef.value.refreshStats()
  }
}

const handleFileUploaded = () => {
  // When a file is uploaded, refresh files list, stats, and recent activity
  refreshFiles()
  refreshStats()
  if (recentActivityRef.value && typeof recentActivityRef.value.refreshActivity === 'function') {
    recentActivityRef.value.refreshActivity()
  }
  // Don't show toast here as FileUpload component already shows it
}

// Automatically load files when the component mounts
onMounted(() => {
  filesStore.fetchFiles()
})
</script>
