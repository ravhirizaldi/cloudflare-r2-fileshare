<template>
  <div
    class="rounded-2xl border border-gray-200 bg-white/70 backdrop-blur-md shadow-lg p-6 space-y-6"
  >
    <!-- Tab Navigation -->
    <div class="flex justify-between items-center">
      <div class="flex gap-2 p-1 rounded-xl bg-gray-100">
        <button
          class="px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition"
          :class="
            activeTab === 'activity'
              ? 'bg-white shadow text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          "
          @click="activeTab = 'activity'"
        >
          <span>Recent Activity</span>
          <span
            v-if="recentActivity.length > 0"
            class="px-2 py-0.5 text-xs rounded-full font-semibold"
            :class="
              activeTab === 'activity' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'
            "
          >
            {{ recentActivity.length }}
          </span>
        </button>

        <button
          class="px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition"
          :class="
            activeTab === 'expired'
              ? 'bg-white shadow text-purple-600'
              : 'text-gray-600 hover:text-gray-900'
          "
          @click="activeTab = 'expired'"
        >
          <span>Expired Files</span>
          <span
            v-if="expiredFiles.length > 0"
            class="px-2 py-0.5 text-xs rounded-full font-semibold"
            :class="
              activeTab === 'expired'
                ? 'bg-purple-100 text-purple-600'
                : 'bg-gray-200 text-gray-600'
            "
          >
            {{ expiredFiles.length }}
          </span>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-10">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-3 text-gray-600 text-sm">Loading data...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-10">
      <p class="text-red-600 font-medium">{{ error }}</p>
      <button
        class="mt-3 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg shadow hover:from-red-600 hover:to-pink-700 transition"
        @click="refreshActivity"
      >
        Try Again
      </button>
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Recent Activity -->
      <div v-if="activeTab === 'activity'" class="space-y-3 max-h-80 overflow-y-auto pr-1">
        <div v-if="recentActivity.length === 0" class="text-gray-500 text-center py-6 text-sm">
          No recent activity
        </div>
        <div
          v-for="activity in recentActivity.slice(0, 10)"
          v-else
          :key="activity.timestamp + activity.action"
          class="flex items-center justify-between p-4 rounded-xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition"
          :class="getActivityColor(activity.action)"
        >
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-gray-900 truncate">
              {{ formatAction(activity.action) }}
            </p>
            <p class="text-xs text-gray-500">
              {{ formatDate(activity.timestamp) }}
            </p>
          </div>
          <span
            class="px-2 py-0.5 text-xs rounded-full font-semibold"
            :class="activity.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
          >
            {{ activity.success ? 'Success' : 'Failed' }}
          </span>
        </div>
      </div>

      <!-- Recently Expired -->
      <div v-else-if="activeTab === 'expired'" class="space-y-3 max-h-80 overflow-y-auto pr-1">
        <div v-if="expiredFiles.length === 0" class="text-gray-500 text-center py-6 text-sm">
          No recently expired files
        </div>
        <div
          v-for="file in expiredFiles"
          v-else
          :key="file.filename + file.expiredAt"
          class="flex items-center justify-between p-4 rounded-xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition"
        >
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-gray-900 truncate">
              {{ file.filename }}
            </p>
            <p class="text-xs text-gray-500">Expired {{ formatDate(file.expiredAt) }}</p>
            <p class="text-xs text-gray-400">
              {{ file.totalDownloads }} downloads • {{ formatReason(file.reason) }}
            </p>
          </div>
          <span
            class="px-2 py-0.5 text-xs rounded-full font-semibold bg-purple-100 text-purple-700"
          >
            Expired
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from '../stores/auth'

const auth = useAuth()
const loading = ref(false)
const error = ref(null)
const recentActivity = ref([])
const expiredFiles = ref([])
const activeTab = ref('activity')

const refreshActivity = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await fetch('/api/user/stats', {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch data')
    }

    const data = await response.json()
    recentActivity.value = data.recentActivity || []
    expiredFiles.value = data.expiredFiles || []

    // If there are expired files but no recent activity, default to expired tab
    if (expiredFiles.value.length > 0 && recentActivity.value.length === 0) {
      activeTab.value = 'expired'
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString()
}

const formatAction = (action) => {
  const actionMap = {
    upload_file: 'File Uploaded',
    download_file: 'File Downloaded',
    delete_file: 'File Deleted',
    permanent_delete_file: 'File Permanently Deleted',
    soft_delete_file: 'File Deleted (Soft)',
    view_file_stats: 'Viewed File Stats',
    login_user: 'Logged In',
    register_user: 'Registered',
  }
  return actionMap[action] || action.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

const formatReason = (reason) => {
  const reasonMap = {
    time_expired: 'Time limit reached',
    download_limit_reached: 'Download limit reached',
    manual_deletion: 'Manually deleted',
  }
  return reasonMap[reason] || reason.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

const getActivityColor = (action) => {
  const colorMap = {
    upload_file: 'border-green-400',
    download_file: 'border-blue-400',
    delete_file: 'border-red-400',
    permanent_delete_file: 'border-red-500',
    soft_delete_file: 'border-red-300',
    login_user: 'border-purple-400',
    view_file_stats: 'border-yellow-400',
  }
  return colorMap[action] || 'border-gray-400'
}

onMounted(refreshActivity)

// Expose methods for parent component
defineExpose({
  refreshActivity,
})
</script>
