import { defineConfig } from 'vite';

import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';
import postcssImport from 'postcss-import';
import postcssNested from 'postcss-nested';
import postcssCustomMedia from 'postcss-custom-media';
import postcssPresetEnv from 'postcss-preset-env';
import postcssCalc from 'postcss-calc';
import postcssSorting from 'postcss-sorting';
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
        navigateFallbackAllowlist: [/^(?!\/__).*/],
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
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/npm\/chart\.js/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'chart-js',
              cacheableResponse: {
                statuses: [200],
              },
              expiration: {
                maxEntries: 5,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 365,
                maxEntries: 10,
              },
            },
          },
        ],
      },
      includeAssets: ['favicon.png', 'favicon.ico', 'offline.html'],
      manifest: false,
    }),
  ],
  build: {
    outDir: 'dist',
    minify: 'oxc',
    cssCodeSplit: true,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'firebase',
              test: /[\\/]node_modules[\\/](@?firebase)[\\/]/,
            },
            { name: 'charts', test: /[\\/]node_modules[\\/]chart\.js[\\/]/ },
            { name: 'vendor', test: /[\\/]node_modules[\\/]/ },
          ],
        },
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
        chunkFileNames: 'assets/[name].[hash].js',
      },
      treeshake: true,
    },
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
  },
  resolve: {
    alias: {},
    dedupe: ['firebase', 'chart.js'],
  },
  optimizeDeps: {
    include: ['chart.js'],
  },
  server: {
    port: 3000,
    host: true,
  },
  preview: {
    host: true,
    port: 4173,
  },
  css: {
    minify: 'lightningcss',
    postcss: {
      plugins: [
        postcssImport,
        postcssNested,
        postcssCustomMedia,
        postcssPresetEnv({
          stage: 3,
          features: {
            'nesting-rules': false,
            'custom-media-queries': false,
            'custom-properties': true,
            'color-function': true,
            clamp: true,
          },
        }),
        postcssCalc({ preserve: false }),
        postcssColorFunctionalNotation(),
        ...(process.env.NODE_ENV !== 'production'
          ? [
              postcssSorting({
                'properties-order': [
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
                'unspecified-properties-position': 'bottom',
              }),
            ]
          : []),
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
                  /^(flex|grid|hidden|block|inline|absolute|relative|fixed|sticky)/,
                  /^(active|disabled|loading|error|success|warning|info)/,
                  /^mobile-/,
                  /^(fade|slide|bounce|pulse|spin)/,
                  /:hover/,
                  /:focus/,
                  /:active/,
                  /^(sm|md|lg|xl):/,
                  /^(checked|invalid|valid)/,
                ],
                variables: true,
                keyframes: true,
                fontFace: true,
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
      map: process.env.NODE_ENV !== 'production' ? { inline: true } : false,
    },
    devSourcemap: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    watch: false,
    setupFiles: ['./tests/setup.js'],
  },
  include: ['tests/**/*.test.js'],
  exclude: ['tests/**/*.skip.test.js'],
  testTimeout: 10000,
  hookTimeout: 10000,
});
