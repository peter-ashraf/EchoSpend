import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true, // Allow testing PWA in dev mode
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,ts,tsx}']
      },
      manifest: {
        name: 'EchoSpend',
        short_name: 'EchoSpend',
        description: 'Voice-First Personal Finance Tracker',
        theme_color: '#0B0D17',
        background_color: '#0B0D17',
        display: 'standalone',
        icons: [
          // Fallback minimal icons to prevent errors
          {
            src: 'https://via.placeholder.com/192x192.png?text=ES',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://via.placeholder.com/512x512.png?text=ES',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
