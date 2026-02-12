import { defineConfig } from 'vite';

import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';
import postcssImport from 'postcss-import';
import postcssCustomMedia from 'postcss-custom-media';
import autoprefixer from 'autoprefixer';
import purgecss from '@fullhuman/postcss-purgecss';
import cssnano from 'cssnano';

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
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
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.firebaseio\.com\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-api',
              networkTimeoutSeconds: 3,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
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
            purpose: 'any',
          },
          {
            src: 'favicon.png',
            sizes: '1024x1024',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Add Transaction',
            short_name: 'Add',
            description: 'Quickly add a new expense or income',
            url: '/#add-expense',
            icons: [{ src: 'favicon.png', sizes: '1024x1024' }],
          },
        ],
        screenshots: [
          {
            src: 'screenshot-desktop.png',
            sizes: '1264x705',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Desktop Dashboard',
          },
          {
            src: 'screenshot-mobile.png',
            sizes: '500x749',
            type: 'image/png',
            label: 'Mobile Dashboard',
          },
        ],
      },
    }),
  ],
  build: {
    outDir: 'dist',
    // Enable tree shaking and optimizations
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      mangle: {
        safari10: true,
      },
    },
    // CSS optimization settings
    cssCodeSplit: false, // Combine all CSS into single file for production
    rollupOptions: {
      output: {
        // Manual chunking for better optimization
        manualChunks: id => {
          // Firebase gets its own chunk (largest dependency)
          if (
            id.includes('node_modules/firebase') ||
            id.includes('node_modules/@firebase')
          ) {
            return 'firebase';
          }
          // Chart.js gets its own chunk for reports feature
          if (id.includes('node_modules/chart.js')) {
            return 'charts';
          }
          // Lazy load heavy views
          if (id.includes('ReportsView')) {
            return 'reports-view';
          }
          if (id.includes('FinancialPlanningView')) {
            return 'planning-view';
          }
          // Other vendor dependencies
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // Ensure CSS is properly chunked
        assetFileNames: assetInfo => {
          if (
            assetInfo.names &&
            assetInfo.names.original &&
            assetInfo.names.original.endsWith('.css')
          ) {
            return 'assets/style.[hash].css';
          }
          return 'assets/[name].[hash].[ext]';
        },
        // Optimize chunk loading
        chunkFileNames: 'assets/[name].[hash].js',
      },
      // Improve tree shaking
      treeshake: true,
    },
    // Enable source maps for debugging
    sourcemap: false, // Disable for production to reduce bundle size
  },
  resolve: {
    // Optimize module resolution
    alias: {
      // Prevent multiple versions of the same library
    },
    dedupe: ['firebase', 'chart.js'],
  },
  optimizeDeps: {
    // Optimize dependencies during build
    include: ['chart.js'],
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
    // PostCSS configuration moved from postcss.config.js
    postcss: {
      plugins: [
        postcssImport,
        postcssCustomMedia,
        autoprefixer({
          overrideBrowserslist: [
            '> 1%',
            'last 2 versions',
            'not dead',
            'not ie 11',
          ],
        }),
        ...(process.env.NODE_ENV === 'production'
          ? [
              purgecss({
                content: ['./index.html', './src/**/*.js', './src/**/*.html'],
                defaultExtractor: content =>
                  content.match(/[\w-/:]+(?<!:)/g) || [],
                safelist: [
                  /^(flex|grid|hidden|block|inline|absolute|relative|fixed)/,
                  /^(active|disabled|loading|error|success)/,
                  /^mobile-/,
                  /^(fade|slide|bounce)/,
                  /:hover/,
                  /:focus/,
                  /:active/,
                  /^(sm|md|lg|xl):/,
                ],
                variables: true,
              }),
              cssnano({
                preset: [
                  'default',
                  {
                    cssDeclarationSorter: false,
                    reduceIdents: false,
                    zindex: false,
                    mergeRules: false,
                  },
                ],
              }),
            ]
          : []),
      ],
    },
    // Enable CSS source maps in development
    devSourcemap: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    watch: false,
  },
});
