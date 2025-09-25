<template>
  <div class="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
    <!-- Header -->
    <header class="sticky top-0 z-30 backdrop-blur-md bg-white/70 border-b border-gray-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <h1 class="text-2xl font-extrabold text-gray-900 tracking-tight">
            <span class="text-blue-600">R2</span> File Share
          </h1>
          <nav class="flex items-center gap-3">
            <router-link
              to="/login"
              class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              Login
            </router-link>
            <router-link
              to="/register"
              class="px-4 py-2 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-md hover:from-blue-700 hover:to-purple-700 transition"
            >
              Sign Up
            </router-link>
          </nav>
        </div>
      </div>
    </header>

    <!-- Hero -->
    <main class="flex-1">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 class="text-4xl sm:text-6xl font-extrabold text-gray-900 leading-tight">
          Share Files
          <span class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >Securely</span
          >
        </h2>
        <p class="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
          Upload, share, and manage your files with ease. Get temporary links, expiration dates,
          download limits, and real-time stats — all wrapped in modern simplicity.
        </p>
        <div class="mt-10 flex justify-center gap-4">
          <router-link
            to="/register"
            class="px-8 py-3 text-lg font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg hover:scale-105 hover:from-blue-700 hover:to-purple-700 transform transition"
          >
            🚀 Get Started
          </router-link>
          <router-link
            to="/login"
            class="px-8 py-3 text-lg font-medium rounded-xl text-gray-700 bg-white shadow hover:bg-gray-100 hover:scale-105 transform transition"
          >
            Sign In
          </router-link>
        </div>
      </div>

      <!-- Features -->
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="p-6 rounded-2xl bg-white/70 backdrop-blur-md border border-gray-100 shadow-md hover:shadow-lg hover:-translate-y-1 transition"
          >
            <div
              class="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center mb-5"
            >
              <component :is="feature.icon" class="h-7 w-7 text-blue-600" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ feature.title }}</h3>
            <p class="text-gray-600 text-sm">{{ feature.desc }}</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ArrowUpTrayIcon, LockClosedIcon, ChartBarIcon } from '@heroicons/vue/24/outline'

const features = [
  {
    title: 'Easy Upload',
    desc: 'Drag and drop or click to select. Supports large files effortlessly.',
    icon: ArrowUpTrayIcon,
  },
  {
    title: 'Secure Sharing',
    desc: 'Files are protected with unique tokens, optional passwords, and expirations.',
    icon: LockClosedIcon,
  },
  {
    title: 'Track Downloads',
    desc: 'Monitor downloads and file activity in real-time dashboards.',
    icon: ChartBarIcon,
  },
]
</script>
