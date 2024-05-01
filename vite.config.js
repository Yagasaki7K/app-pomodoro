import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import { VitePWA } from 'vite-plugin-pwa'
import million from 'million/compiler'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), svgr(), million.vite({ auto: true }),
  VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      name: 'Appomodoro',
      short_name: 'Pomodoro',
      description: 'An intuitive timer built with React, following the Pomodoro technique',
      theme_color: '#1c1b22',
      icons: [
        {
          src: 'favicon.svg',
          sizes: '192x192',
          type: 'image/svg'
        },
        {
          src: 'favicon.svg',
          sizes: '512x512',
          type: 'image/svg'
        }
      ]
    },
    workbox: {
      clientsClaim: true,
      skipWaiting: true
    }
    // devOptions: {
    //   enabled: true
    // }
  })],
})