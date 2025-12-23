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
        skipWaiting: true
      },
      includeAssets: ['favicon.png', 'favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'BlinkBudget',
        short_name: 'BlinkBudget',
        description: 'Making expense tracking effortless, all in 3 clicks.',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
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
