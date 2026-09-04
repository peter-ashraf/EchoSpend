import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const getGitInfo = () => {
  let hash = 'dev';
  let count = '0';
  try {
    hash = execSync('git rev-parse --short HEAD').toString().trim();
    count = execSync('git rev-list --count HEAD').toString().trim();
  } catch {}
  return { hash, count };
};

const gitInfo = getGitInfo();
const buildTime = new Date().toISOString();
const appVersion = `1.3.${gitInfo.count}`;

// Write public/version.json before building so it is bundled and served statically
try {
  writeFileSync(
    './public/version.json',
    JSON.stringify(
      {
        version: appVersion,
        commit: gitInfo.hash,
        revision: gitInfo.count,
        buildTime: buildTime
      },
      null,
      2
    )
  );
} catch {}

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __BUILD_TIME__: JSON.stringify(buildTime),
    __GIT_HASH__: JSON.stringify(gitInfo.hash),
    __GIT_COUNT__: JSON.stringify(gitInfo.count),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false, // Disable in dev to prevent ERR_CONNECTION_REFUSED and caching conflicts with HMR
      },
      includeAssets: ['favicon.png', 'favicon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,ts,tsx,onnx}'],
        globIgnores: ['**/version.json'],
        maximumFileSizeToCacheInBytes: 100 * 1024 * 1024, // Allow up to 100MB for Whisper model
        runtimeCaching: [
          {
            urlPattern: /\/version\.json$/,
            handler: 'NetworkOnly',
          }
        ]
      },
      manifest: {
        name: 'EchoSpend - Voice Budget & Expense',
        short_name: 'EchoSpend',
        description: 'Effortless Voice-First Expense Tracking & Smart Budget Insights',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      }
    })
  ]
})
