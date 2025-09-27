import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { createOptimizedAsyncComponent } from '../utils/asyncComponents'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: createOptimizedAsyncComponent(() => import('../views/Home.vue')),
  },
  {
    path: '/login',
    name: 'Login',
    component: createOptimizedAsyncComponent(() => import('../views/Login.vue')),
    meta: { requiresGuest: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: createOptimizedAsyncComponent(() => import('../views/Register.vue')),
    meta: { requiresGuest: true },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: createOptimizedAsyncComponent(() => import('../views/Dashboard.vue')),
    meta: { requiresAuth: true },
  },
  {
    path: '/r/:token',
    name: 'Download',
    component: createOptimizedAsyncComponent(() => import('../views/Download.vue')),
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
