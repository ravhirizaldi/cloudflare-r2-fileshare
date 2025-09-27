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
        },
      },
    },
    build: {
      // Enable code splitting for better performance
      rollupOptions: {
        output: {
          // Manual chunk splitting for vendor libraries
          manualChunks: {
            vendor: ['vue', 'vue-router', 'pinia'],
            utils: ['axios'],
          },
        },
      },
      // Enable minification and compression
      minify: 'esbuild',
      // Reduce chunk size limit warnings
      chunkSizeWarningLimit: 1000,
      // Ensure assets are properly referenced
      assetsDir: 'assets',
      // Generate manifest for better asset handling
      manifest: false,
    },
    // Enable dependency pre-bundling optimizations
    optimizeDeps: {
      include: ['vue', 'vue-router', 'pinia'],
    },
    // Define environment variables for build-time access
    define: {
      __API_BASE_URL__: JSON.stringify(env.VITE_API_BASE_URL),
      __APP_TITLE__: JSON.stringify(env.VITE_APP_TITLE || 'R2 File Share'),
    },
  }
})
