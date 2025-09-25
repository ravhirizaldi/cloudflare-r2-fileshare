import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { withPerformanceTracking } from '../utils/performanceMonitor'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: withPerformanceTracking(() => import('../views/Home.vue'), 'Home'),
  },
  {
    path: '/login',
    name: 'Login',
    component: withPerformanceTracking(() => import('../views/Login.vue'), 'Login'),
    meta: { requiresGuest: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: withPerformanceTracking(() => import('../views/Register.vue'), 'Register'),
    meta: { requiresGuest: true },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: withPerformanceTracking(() => import('../views/Dashboard.vue'), 'Dashboard'),
    meta: { requiresAuth: true },
  },
  {
    path: '/r/:token',
    name: 'Download',
    component: withPerformanceTracking(() => import('../views/Download.vue'), 'Download'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation guards
router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  // Initialize auth from localStorage
  if (!authStore.user && !authStore.isAuthenticated) {
    authStore.initAuth()
  }

  // Check authentication requirements
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'Login' }
  }

  // Redirect authenticated users away from guest pages
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return { name: 'Dashboard' }
  }
})

export default router
