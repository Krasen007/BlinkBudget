import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  root: '.',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: 'offline.html',
        navigateFallbackAllowlist: [/^(?!\/__).*/], // Allow all except Firebase auth paths
      },
      includeAssets: ['favicon.png', 'favicon.ico', 'offline.html'],
      manifest: {
        id: '/',
        name: 'BlinkBudget',
        short_name: 'BlinkBudget',
        description: 'Making expense tracking effortless, all in 3 clicks.',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        categories: ['finance', 'productivity'],
        icons: [
          {
            src: 'favicon.png',
            sizes: '1024x1024',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'favicon.png',
            sizes: '1024x1024',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Add Transaction',
            short_name: 'Add',
            description: 'Quickly add a new expense or income',
            url: '/#add-expense',
            icons: [{ src: 'favicon.png', sizes: '1024x1024' }]
          }
        ],
        screenshots: [
          {
            src: 'screenshot-desktop.png',
            sizes: '1264x705',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Desktop Dashboard'
          },
          {
            src: 'screenshot-mobile.png',
            sizes: '500x749',
            type: 'image/png',
            label: 'Mobile Dashboard'
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
    // CSS optimization settings
    cssCodeSplit: false, // Combine all CSS into single file for production
    rollupOptions: {
      output: {
        // Manual chunking for better optimization
        manualChunks: (id) => {
          // Firebase gets its own chunk (largest dependency)
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
            return 'firebase';
          }
          // Chart.js gets its own chunk for reports feature
          if (id.includes('node_modules/chart.js')) {
            return 'charts';
          }
          // Other vendor dependencies
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // Ensure CSS is properly chunked
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'assets/style.[hash].css';
          }
          return 'assets/[name].[hash].[ext]';
        }
      }
    }
  },
  server: {
    port: 3000,
    host: true, // Open to local network and display URL
  },
  preview: {
    host: true, // Open to local network for preview
    port: 4173, // Default preview port
  },
  css: {
    // PostCSS configuration will be loaded from postcss.config.js
    postcss: {},
    // Enable CSS source maps in development
    devSourcemap: true
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
