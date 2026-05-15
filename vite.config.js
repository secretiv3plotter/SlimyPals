import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const PROJECT_ROOT = fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), slimyPalsServiceWorker()],
})

function slimyPalsServiceWorker() {
  return {
    name: 'slimy-pals-service-worker',
    apply: 'build',
    closeBundle() {
      const outDir = resolve(PROJECT_ROOT, 'dist')
      const precacheUrls = Array.from(new Set([
        '/',
        '/index.html',
        ...listDistFiles(outDir)
          .filter((filePath) => !filePath.endsWith(`${sep}sw.js`))
          .map((filePath) => `/${relative(outDir, filePath).split(sep).join('/')}`),
      ]))

      writeFileSync(
        join(outDir, 'sw.js'),
        createServiceWorkerSource({
          cacheName: `slimy-pals-app-${Date.now()}`,
          precacheUrls,
        }),
      )
    },
  }
}

function listDistFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const filePath = join(directory, entry)
    const stats = statSync(filePath)

    return stats.isDirectory() ? listDistFiles(filePath) : filePath
  })
}

function createServiceWorkerSource({ cacheName, precacheUrls }) {
  return `const CACHE_NAME = ${JSON.stringify(cacheName)}
const PRECACHE_URLS = ${JSON.stringify(precacheUrls, null, 2)}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      ))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') {
    return
  }

  const url = new URL(request.url)
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request))
    return
  }

  event.respondWith(handleAssetRequest(request))
})

async function handleNavigationRequest(request) {
  const cache = await caches.open(CACHE_NAME)

  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put('/index.html', response.clone())
      cache.put('/', response.clone())
    }

    return response
  } catch {
    return (await cache.match('/index.html')) || cache.match('/')
  }
}

async function handleAssetRequest(request) {
  const cachedResponse = await caches.match(request)

  if (cachedResponse) {
    return cachedResponse
  }

  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME)
    cache.put(request, response.clone())
  }

  return response
}
`
}
