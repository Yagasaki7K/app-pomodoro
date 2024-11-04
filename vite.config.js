import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import { VitePWA } from 'vite-plugin-pwa'
import million from 'million/compiler'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr(),
    million.vite({ auto: true }),
    VitePWA({
      registerType: 'prompt', // Use 'prompt' to manually update the Service Worker for easier testing
      injectRegister: 'auto', // Automatically injects the SW registration into HTML
      manifest: {
        name: 'Appomodoro',
        short_name: 'Pomodoro',
        description: 'An intuitive timer built with React, following the Pomodoro technique',
        theme_color: '#c6a0f6',
        icons: [
          {
            src: 'https://raw.githubusercontent.com/Yagasaki7K/app-pomodoro/main/favicon.svg',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://raw.githubusercontent.com/Yagasaki7K/app-pomodoro/main/favicon.svg',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|mp3)$/, // Cache images and mp3 files
            handler: 'CacheFirst',
            options: {
              cacheName: 'asset-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              }
            }
          },
          {
            urlPattern: /^https:\/\/appomodoro\.vercel\.app\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'runtime-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              }
            }
          }
        ]
      },
      includeAssets: ['favicon-192x192.png', 'favicon-512x512.png', 'songs/rain.mp3', 'songs/alarm.mp3'] // Ensure sound files are cached
    })
  ]
})
