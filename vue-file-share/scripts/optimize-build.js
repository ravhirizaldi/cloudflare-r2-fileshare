#!/usr/bin/env node

/**
 * Post-build optimization script
 * This script runs after the build to perform additional optimizations
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distPath = path.resolve(__dirname, '../dist')
const srcPath = path.resolve(__dirname, '../src')

console.log('🚀 Running post-build optimizations...')

/**
 * Inline critical CSS into HTML
 */
function inlineCriticalCSS() {
  const htmlPath = path.join(distPath, 'index.html')
  const criticalCSSPath = path.join(srcPath, 'assets/critical.css')

  if (!fs.existsSync(htmlPath)) {
    console.warn('⚠️  index.html not found, skipping critical CSS inlining')
    return
  }

  if (!fs.existsSync(criticalCSSPath)) {
    console.warn('⚠️  critical.css not found, skipping critical CSS inlining')
    return
  }

  let html = fs.readFileSync(htmlPath, 'utf8')
  const criticalCSS = fs.readFileSync(criticalCSSPath, 'utf8')

  // Minify critical CSS
  const minifiedCSS = criticalCSS
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/;\s*}/g, '}') // Remove unnecessary semicolons
    .trim()

  // Insert critical CSS into <head>
  const criticalStyleTag = `<style>${minifiedCSS}</style>`
  html = html.replace('</head>', `  ${criticalStyleTag}\n</head>`)

  fs.writeFileSync(htmlPath, html)
  console.log('✅ Inlined critical CSS into HTML')
}

/**
 * Add performance hints to HTML
 */
function addPerformanceHints() {
  const htmlPath = path.join(distPath, 'index.html')

  if (!fs.existsSync(htmlPath)) {
    console.warn('⚠️  index.html not found, skipping performance hints')
    return
  }

  let html = fs.readFileSync(htmlPath, 'utf8')

  // Find the main CSS and JS files
  const cssMatch = html.match(/href="([^"]*\.css)"/)
  const jsMatch = html.match(/src="([^"]*\.js)"/)

  const resourceHints = []

  if (cssMatch) {
    resourceHints.push(`<link rel="preload" href="${cssMatch[1]}" as="style">`)
  }

  if (jsMatch) {
    resourceHints.push(`<link rel="preload" href="${jsMatch[1]}" as="script">`)
  }

  // Add meta tags for better mobile performance
  resourceHints.push(
    '<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">',
    '<meta name="mobile-web-app-capable" content="yes">',
    '<meta name="apple-mobile-web-app-capable" content="yes">',
    '<meta name="apple-mobile-web-app-status-bar-style" content="default">',
  )

  if (resourceHints.length > 0) {
    const hintsHTML = `
  <!-- Performance optimizations -->
  ${resourceHints.join('\n  ')}
  `

    // Insert after existing meta tags
    html = html.replace(/(<meta[^>]*charset[^>]*>)/i, '$1' + hintsHTML)

    fs.writeFileSync(htmlPath, html)
    console.log('✅ Added performance hints to HTML')
  }
}

/**
 * Generate service worker for caching (simple version)
 */
function generateServiceWorker() {
  const swContent = `
// R2 File Share Service Worker v1.1
const CACHE_NAME = 'r2-fileshare-v1.1'
const STATIC_CACHE = 'r2-static-v1.1'

// Assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/assets/index.css',
  '/assets/index.js'
]

// Cache strategies
const CACHE_STRATEGIES = {
  // Cache first for static assets
  CACHE_FIRST: 'cache-first',
  // Network first for API calls
  NETWORK_FIRST: 'network-first',
  // Stale while revalidate for pages
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip API calls and non-GET requests
  if (url.pathname.startsWith('/api') || request.method !== 'GET') {
    return
  }
  
  // Cache strategy for static assets
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request).then((fetchResponse) => {
          const responseClone = fetchResponse.clone()
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseClone)
          })
          return fetchResponse
        })
      })
    )
    return
  }
  
  // Stale while revalidate for pages
  event.respondWith(
    caches.match(request).then((response) => {
      const fetchPromise = fetch(request).then((fetchResponse) => {
        const responseClone = fetchResponse.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone)
        })
        return fetchResponse
      })
      
      return response || fetchPromise
    })
  )
})
`

  const swPath = path.join(distPath, 'sw.js')
  fs.writeFileSync(swPath, swContent.trim())
  console.log('✅ Generated enhanced service worker')
}

/**
 * Main optimization function
 */
async function optimize() {
  try {
    inlineCriticalCSS()
    addPerformanceHints()
    generateServiceWorker()
    console.log('🎉 Build optimization completed!')
    console.log('📊 Optimization summary:')
    console.log('   • Critical CSS inlined for faster first paint')
    console.log('   • Performance hints added for better loading')
    console.log('   • Service worker generated for offline support')
  } catch (error) {
    console.error('❌ Optimization failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  optimize()
}

export { optimize }
