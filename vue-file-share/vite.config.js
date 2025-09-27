import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// Vite 7 default target: "baseline-widely-available"
export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '')

  return {
    // Use absolute base path for production to ensure assets load correctly from any route
    base: mode === 'production' ? '/' : './',
    plugins: [
      vue(),
      tailwindcss(),
      // HTML environment variable replacement
      {
        name: 'html-transform',
        transformIndexHtml(html) {
          return html.replace(/%VITE_APP_TITLE%/g, env.VITE_APP_TITLE || 'R2 File Share')
        },
      },
    ],
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'https://file-gateway.it-dev-635.workers.dev',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          secure: true,
          // Optimize proxy performance
          timeout: 30000,
          proxyTimeout: 30000,
          // Enable connection keep-alive for better performance
          agent: false,
        },
      },
      // Enable HTTP/2 for better performance in development
      https: false,
      // Optimize dev server
      hmr: {
        overlay: false, // Disable error overlay for better performance
      },
    },
    build: {
      // Enable code splitting for better performance
      rollupOptions: {
        output: {
          // More granular manual chunk splitting
          manualChunks: {
            // Core Vue ecosystem
            'vue-vendor': ['vue', 'vue-router', 'pinia'],
            // UI and utilities
            'ui-vendor': ['vue-toastification', '@heroicons/vue'],
            // HTTP client
            'http-vendor': ['axios'],
            // Large libraries
            'three-vendor': ['three'],
            // Date picker (only if used)
            'date-vendor': ['@vuepic/vue-datepicker'],
          },
        },
        // External dependencies that shouldn't be bundled
        external: [],
      },
      // Optimize minification for production
      minify: 'terser',
      terserOptions: { compress: { drop_console: true, drop_debugger: true } },

      // Reduce chunk size limit warnings
      chunkSizeWarningLimit: 800,
      // Ensure assets are properly referenced
      assetsDir: 'assets',
      // Generate manifest for better asset handling
      manifest: mode === 'production',
      // Enable source maps in development only
      sourcemap: mode !== 'production' ? 'inline' : false,
      // Target modern browsers for smaller bundles
      target: 'es2020',
      // CSS code splitting
      cssCodeSplit: true,
    },
    // Enable dependency pre-bundling optimizations
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'pinia',
        'axios',
        'vue-toastification',
        '@heroicons/vue/24/outline',
        '@heroicons/vue/24/solid',
      ],
      // Exclude heavy dependencies that should be loaded dynamically
      exclude: ['three', '@vuepic/vue-datepicker'],
    },
    // Define environment variables for build-time access
    define: {
      __API_BASE_URL__: JSON.stringify(env.VITE_API_BASE_URL),
      __APP_TITLE__: JSON.stringify(env.VITE_APP_TITLE || 'R2 File Share'),
    },
  }
})
