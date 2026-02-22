import { defineConfig } from 'vite';

import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';
import postcssImport from 'postcss-import';
import postcssNested from 'postcss-nested';
import postcssCustomMedia from 'postcss-custom-media';
import postcssPresetEnv from 'postcss-preset-env';
import postcssCalc from 'postcss-calc';
import postcssSorting from 'postcss-sorting';
import postcssLogicalProperties from 'postcss-logical-properties';
import postcssColorFunctionalNotation from 'postcss-color-functional-notation';
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
          // Cache all JavaScript modules for offline functionality
          {
            urlPattern: /^https:\/\/.*\.js$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'js-modules',
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
          // Cache local JavaScript modules (both /src/ dev and /assets/ prod paths)
          {
            urlPattern: /^\/(src|assets)\/.*\.js$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'local-js',
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
          // Cache CSS files (both /src/ dev and /assets/ prod paths)
          {
            urlPattern: /^\/(src|assets)\/.*\.css$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'local-css',
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
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
          // Cache reports and planning data for offline access
          {
            urlPattern: /^https:\/\/.*\/api\/(reports|planning).*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'reports-data',
              networkTimeoutSeconds: 3,
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
          // Cache Chart.js from CDN for offline chart rendering
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/npm\/chart\.js/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'chart-js',
              cacheableResponse: {
                statuses: [200], // Only cache successful responses
              },
              expiration: {
                maxEntries: 5,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
          // Cache Google Fonts stylesheets
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          // Cache the actual font files
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 365, // Cache for 1 year
                maxEntries: 10,
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
    cssCodeSplit: true, // Split CSS by chunk for better caching and parallel loading
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
          // Split out analytics and heavy services
          if (
            id.includes('analytics-engine') ||
            id.includes('AnalyticsInstance')
          ) {
            return 'analytics';
          }
          if (id.includes('tutorial') || id.includes('TutorialManager')) {
            return 'tutorial';
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
    // PostCSS configuration - plugins execute in order
    postcss: {
      plugins: [
        // 1. Import - resolve @import statements first
        postcssImport,
        // 2. Nested - unfold nested rules (like SCSS)
        postcssNested,
        // 3. Custom Media - transform custom media queries
        postcssCustomMedia,
        // 4. Preset Env - polyfill future CSS features (Stage 3 for stability)
        postcssPresetEnv({
          stage: 3,
          features: {
            'nesting-rules': false, // Using postcss-nested instead
            'custom-media-queries': false, // Using postcss-custom-media instead
            'custom-properties': true, // Better custom property support
            'color-function': true, // Modern color functions
            clamp: true, // CSS clamp() support
          },
        }),
        // 5. Calc - reduce calc() expressions where possible
        postcssCalc({
          preserve: false, // Replace calc() with computed values
        }),
        // 6. Logical Properties - enable logical positioning for internationalization
        postcssLogicalProperties(),
        // 7. Color Functional Notation - modern color syntax support
        postcssColorFunctionalNotation(),
        // 8. Sorting - consistent property ordering (development only for readability)
        ...(process.env.NODE_ENV !== 'production'
          ? [
            postcssSorting({
              'sort-order': [
                'position',
                'display',
                'box-sizing',
                'flex',
                'grid',
                'width',
                'height',
                'margin',
                'padding',
                'border',
                'background',
                'color',
                'font',
                'text',
                'transition',
                'transform',
                'animation',
                'other',
              ],
              'sort-order-separator': '\n',
              'unspecified-properties-position': 'bottom',
            }),
          ]
          : []),
        // 9. Autoprefixer - add vendor prefixes based on browserslist
        autoprefixer({
          overrideBrowserslist: [
            '> 1%',
            'last 2 versions',
            'not dead',
            'not ie 11',
          ],
        }),
        // Production-only plugins
        ...(process.env.NODE_ENV === 'production'
          ? [
            // 10. PurgeCSS - remove unused CSS selectors
            purgecss({
              content: ['./index.html', './src/**/*.js', './src/**/*.html'],
              defaultExtractor: content =>
                content.match(/[\w-/:]+(?<!:)/g) || [],
              safelist: [
                // Core layout classes
                /^(flex|grid|hidden|block|inline|absolute|relative|fixed|sticky)/,
                // State classes
                /^(active|disabled|loading|error|success|warning|info)/,
                // Mobile-specific classes
                /^mobile-/,
                // Animation classes
                /^(fade|slide|bounce|pulse|spin)/,
                // Pseudo-classes (keep minimal)
                /:hover/,
                /:focus/,
                /:active/,
                // Responsive prefixes
                /^(sm|md|lg|xl):/,
                // Form states
                /^(checked|invalid|valid)/,
              ],
              variables: true,
              // More aggressive purging - only keep explicitly used classes
              keyframes: true,
              fontFace: true,
            }),
            // 11. CSSNano - minify CSS
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
      // Source maps for development debugging
      map: process.env.NODE_ENV !== 'production' ? { inline: true } : false,
    },
    // Enable CSS source maps in development
    devSourcemap: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    watch: false,
  },
  // Split test files for better performance
  include: ['tests/**/*.test.js'],
  exclude: ['tests/**/*.skip.test.js'],
  // Increase timeout for complex tests
  testTimeout: 10000,
  hookTimeout: 10000,
},
);
