import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import { VitePWA } from 'vite-plugin-pwa'
import million from 'million/compiler'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), svgr(), million.vite({ auto: true }), VitePWA({
    registerType: 'autoUpdate',
    workbox: {
      clientsClaim: true,
      skipWaiting: true
    }
    // devOptions: {
    //   enabled: true
    // }
  })],
})