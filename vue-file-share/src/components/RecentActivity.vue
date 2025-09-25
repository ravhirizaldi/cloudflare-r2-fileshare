<template>
  <div class="bg-white rounded-lg shadow p-6">
    <!-- Tab Navigation -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          class="px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center space-x-1"
          :class="
            activeTab === 'activity'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          "
          @click="activeTab = 'activity'"
        >
          <span>Recent Activity</span>
          <span
            v-if="recentActivity.length > 0"
            class="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs font-medium"
            :class="
              activeTab === 'activity' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'
            "
          >
            {{ recentActivity.length }}
          </span>
        </button>
        <button
          class="px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center space-x-1"
          :class="
            activeTab === 'expired'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          "
          @click="activeTab = 'expired'"
        >
          <span>Recently Expired</span>
          <span
            v-if="expiredFiles.length > 0"
            class="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs font-medium"
            :class="
              activeTab === 'expired' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'
            "
          >
            {{ expiredFiles.length }}
          </span>
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-8">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
      <p class="text-gray-600 mt-2 text-sm">Loading data...</p>
    </div>

    <div v-else-if="error" class="text-center py-8">
      <p class="text-red-600">{{ error }}</p>
      <button
        class="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        @click="refreshActivity"
      >
        Try Again
      </button>
    </div>

    <div v-else>
      <!-- Recent Activity Tab -->
      <div
        v-if="activeTab === 'activity'"
        class="bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto"
      >
        <div v-if="recentActivity.length === 0" class="text-gray-600 text-center py-4">
          No recent activity
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="activity in recentActivity.slice(0, 10)"
            :key="activity.timestamp + activity.action"
            class="flex items-center justify-between py-2 px-3 bg-white rounded border-l-4"
            :class="getActivityColor(activity.action)"
          >
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900 truncate">
                {{ formatAction(activity.action) }}
              </p>
              <p class="text-xs text-gray-600">
                {{ formatDate(activity.timestamp) }}
              </p>
            </div>
            <div class="flex items-center">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="
                  activity.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                "
              >
                {{ activity.success ? 'Success' : 'Failed' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recently Expired Tab -->
      <div
        v-else-if="activeTab === 'expired'"
        class="bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto"
      >
        <div v-if="expiredFiles.length === 0" class="text-gray-600 text-center py-4">
          No recently expired files
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="file in expiredFiles"
            :key="file.filename + file.expiredAt"
            class="flex items-center justify-between py-2 px-3 bg-white rounded border-l-4 border-orange-400"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">
                {{ file.filename }}
              </p>
              <p class="text-xs text-gray-600">Expired {{ formatDate(file.expiredAt) }}</p>
              <p class="text-xs text-gray-500">
                {{ file.totalDownloads }} downloads • {{ formatReason(file.reason) }}
              </p>
            </div>
            <div class="flex items-center">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
              >
                Expired
              </span>
            </div>
          </div>
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
