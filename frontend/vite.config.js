import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs' // <-- add this
import path from 'path'

function getHttpsConfig() {
  const keyPath  = process.env.VITE_HTTPS_KEY  || './139.84.201.140-key.pem'
  const certPath = process.env.VITE_HTTPS_CERT || './139.84.201.140.pem'
  try {
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      return {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      }
    }
  } catch (_) {}
  return false
}

const httpsCfg = getHttpsConfig()
const isHttps = !!httpsCfg

export default defineConfig({
  server: {
    host: true,                 // allow LAN access (phone)
    port: Number(process.env.VITE_PORT || 5173),
    https: isHttps ? httpsCfg : undefined,
    // (optional) helps HMR over HTTPS from another device
    hmr: isHttps
      ? {
          protocol: 'wss',
          host: process.env.VITE_HMR_HOST || '139.84.201.140',
          port: Number(process.env.VITE_HMR_PORT || 5173)
        }
      : undefined
  },

  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'icons/ios-180.png'],
      manifest: {
        name: 'Hackathon PWA',
        short_name: 'HackPWA',
        start_url: '/?source=pwa',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0f172a',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable any' }
        ],
        shortcuts: [
          { name: 'Home', url: '/', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] }
        ]
      },
      workbox: {
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ request }) => ['style', 'script', 'worker'].includes(request.destination),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'static-v1' }
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-v1',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-v1',
              networkTimeoutSeconds: 3,
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
      // ,devOptions: { enabled: true } // only if you want SW in dev
    })
  ]
})