<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold text-gray-900">Admin Panel</h2>
      <div class="flex items-center space-x-4">
        <button
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          :disabled="loading"
          @click="refreshData"
        >
          {{ loading ? 'Loading...' : 'Refresh' }}
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Action Filter</label>
        <select
          v-model="filters.action"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          @change="applyFilters"
        >
          <option value="">All Actions</option>
          <option value="upload_file">File Uploads</option>
          <option value="download_file">Downloads</option>
          <option value="delete_file">File Deletions</option>
          <option value="login_user">User Logins</option>
          <option value="register_user">User Registrations</option>
          <option value="cleanup_expired_file">File Cleanup</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">User Filter</label>
        <input
          v-model="filters.user"
          type="text"
          placeholder="Username or 'system'"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          @input="debounceFilter"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Results per page</label>
        <select
          v-model="pagination.limit"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          @change="applyFilters"
        >
          <option :value="25">25</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
      </div>
    </div>

    <!-- Audit Trail Table -->
    <div v-if="loading" class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p class="text-gray-600 mt-2">Loading audit trail...</p>
    </div>

    <div v-else-if="error" class="text-center py-8">
      <p class="text-red-600">{{ error }}</p>
      <button
        class="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        @click="refreshData"
      >
        Try Again
      </button>
    </div>

    <div v-else>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Timestamp
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                User
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Action
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Resource
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                IP Address
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Details
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="event in auditEvents" :key="event.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatDate(event.timestamp) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="
                    event.userId === 'system'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  "
                >
                  {{ event.userId || 'Anonymous' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatAction(event.action) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div>
                  <div class="font-medium">{{ event.resourceType || 'N/A' }}</div>
                  <div class="text-xs text-gray-500 truncate max-w-xs">
                    {{ event.resourceId || 'N/A' }}
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ event.ipAddress || 'N/A' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="event.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                >
                  {{ event.success ? 'Success' : 'Failed' }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-900">
                <button
                  v-if="event.details || event.errorMessage"
                  class="text-blue-600 hover:text-blue-800 text-xs"
                  @click="showDetails(event)"
                >
                  View Details
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between mt-6">
        <div class="text-sm text-gray-700">
          Showing {{ (pagination.page - 1) * pagination.limit + 1 }} to
          {{ Math.min(pagination.page * pagination.limit, pagination.total) }} of
          {{ pagination.total }} results
        </div>
        <div class="flex items-center space-x-2">
          <button
            class="px-3 py-2 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50"
            :disabled="pagination.page <= 1"
            @click="changePage(pagination.page - 1)"
          >
            Previous
          </button>
          <span class="px-3 py-2 text-sm text-gray-700">
            Page {{ pagination.page }} of {{ pagination.totalPages }}
          </span>
          <button
            class="px-3 py-2 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50"
            :disabled="pagination.page >= pagination.totalPages"
            @click="changePage(pagination.page + 1)"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Details Modal -->
    <div
      v-if="showDetailsModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    >
      <div class="relative top-20 mx-auto p-5 border w-4/5 max-w-2xl shadow-lg rounded-md bg-white">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium text-gray-900">Event Details</h3>
          <button class="text-gray-400 hover:text-gray-600" @click="showDetailsModal = false">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div v-if="selectedEvent" class="space-y-4">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Timestamp:</strong>
              <p class="text-gray-600">{{ formatDate(selectedEvent.timestamp) }}</p>
            </div>
            <div>
              <strong>User:</strong>
              <p class="text-gray-600">{{ selectedEvent.userId || 'Anonymous' }}</p>
            </div>
            <div>
              <strong>Action:</strong>
              <p class="text-gray-600">{{ formatAction(selectedEvent.action) }}</p>
            </div>
            <div>
              <strong>Status:</strong>
              <p class="text-gray-600">{{ selectedEvent.success ? 'Success' : 'Failed' }}</p>
            </div>
            <div>
              <strong>IP Address:</strong>
              <p class="text-gray-600">{{ selectedEvent.ipAddress || 'N/A' }}</p>
            </div>
            <div>
              <strong>Resource:</strong>
              <p class="text-gray-600">
                {{ selectedEvent.resourceType }}:{{ selectedEvent.resourceId }}
              </p>
            </div>
          </div>

          <div v-if="selectedEvent.userAgent">
            <strong>User Agent:</strong>
            <p class="text-gray-600 text-sm break-all">{{ selectedEvent.userAgent }}</p>
          </div>

          <div v-if="selectedEvent.details">
            <strong>Details:</strong>
            <pre class="bg-gray-100 p-3 rounded text-sm overflow-auto">{{
              JSON.stringify(selectedEvent.details, null, 2)
            }}</pre>
          </div>

          <div v-if="selectedEvent.errorMessage">
            <strong>Error Message:</strong>
            <p class="text-red-600 text-sm">{{ selectedEvent.errorMessage }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from '../stores/auth'
import { useToast } from '../composables/useToast'

const auth = useAuth()
const { showToast } = useToast()

const loading = ref(false)
const error = ref(null)
const auditEvents = ref([])
const showDetailsModal = ref(false)
const selectedEvent = ref(null)

const filters = ref({
  action: '',
  user: '',
})

const pagination = ref({
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 0,
})

let filterTimeout = null

const refreshData = async () => {
  loading.value = true
  error.value = null

  try {
    const queryParams = []
    queryParams.push(`page=${pagination.value.page}`)
    queryParams.push(`limit=${pagination.value.limit}`)

    if (filters.value.action) queryParams.push(`action=${encodeURIComponent(filters.value.action)}`)
    if (filters.value.user) queryParams.push(`user=${encodeURIComponent(filters.value.user)}`)

    const queryString = queryParams.join('&')
    const url = `/api/admin/audit?${queryString}`

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch audit trail')
    }

    const data = await response.json()
    auditEvents.value = data.auditEvents
    pagination.value = { ...pagination.value, ...data.pagination }
  } catch (err) {
    error.value = err.message
    if (err.message.includes('403') || err.message.includes('Forbidden')) {
      showToast('Admin access required to view audit trail', 'error')
    }
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  pagination.value.page = 1
  refreshData()
}

const debounceFilter = () => {
  clearTimeout(filterTimeout)
  filterTimeout = setTimeout(() => {
    applyFilters()
  }, 500)
}

const changePage = (page) => {
  pagination.value.page = page
  refreshData()
}

const showDetails = (event) => {
  selectedEvent.value = event
  showDetailsModal.value = true
}

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString()
}

const formatAction = (action) => {
  const actionMap = {
    upload_file: 'File Upload',
    download_file: 'File Download',
    delete_file: 'File Delete',
    soft_delete_file: 'File Soft Delete',
    permanent_delete_file: 'File Permanent Delete',
    restore_file: 'File Restore',
    login_user: 'User Login',
    register_user: 'User Registration',
    view_file_stats: 'View File Stats',
    view_user_stats: 'View User Stats',
    view_audit_trail: 'View Audit Trail',
    cleanup_expired_file: 'Cleanup Expired File',
    cleanup_job: 'Cleanup Job',
  }
  return actionMap[action] || action.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

onMounted(() => {
  if (auth.user?.role !== 'admin') {
    error.value = 'Admin access required'
  } else {
    refreshData()
  }
})
</script>
