<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div class="flex items-center">
            <h1 class="text-2xl font-bold text-gray-900">R2 File Share</h1>
          </div>
          <nav class="flex items-center space-x-4">
            <router-link
              to="/login"
              class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Login
            </router-link>
            <router-link
              to="/register"
              class="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
            >
              Sign Up
            </router-link>
          </nav>
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <main>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="text-center">
          <h2 class="text-4xl font-bold text-gray-900 sm:text-6xl">
            Share Files
            <span class="text-blue-600">Securely</span>
          </h2>
          <p class="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            Upload, share, and manage your files with temporary download links.
            Perfect for sharing large files with expiration dates and download
            limits.
          </p>
          <div class="mt-8 flex justify-center space-x-4">
            <router-link
              to="/register"
              class="bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 rounded-lg text-lg font-medium"
            >
              Get Started
            </router-link>
            <router-link
              to="/login"
              class="bg-gray-100 text-gray-700 hover:bg-gray-200 px-8 py-3 rounded-lg text-lg font-medium"
            >
              Sign In
            </router-link>
          </div>
        </div>

        <!-- Features -->
        <div class="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="text-center">
            <div
              class="bg-blue-100 rounded-lg p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center"
            >
              <svg
                class="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">
              Easy Upload
            </h3>
            <p class="text-gray-600">
              Drag and drop files or click to select. Multiple files supported.
            </p>
          </div>

          <div class="text-center">
            <div
              class="bg-green-100 rounded-lg p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center"
            >
              <svg
                class="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">
              Secure Sharing
            </h3>
            <p class="text-gray-600">
              Files are protected with unique tokens and optional expiration
              dates.
            </p>
          </div>

          <div class="text-center">
            <div
              class="bg-purple-100 rounded-lg p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center"
            >
              <svg
                class="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">
              Track Downloads
            </h3>
            <p class="text-gray-600">
              Monitor download counts and file status in real-time.
            </p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
// Home page component
</script>
