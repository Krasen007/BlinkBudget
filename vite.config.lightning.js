import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      targets: {
        chrome: 80,
        firefox: 78,
        safari: 14,
        edge: 80,
      },
      drafts: {
        customMedia: true,
      },
    },
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
      manifest: {
        name: 'BlinkBudget',
        short_name: 'BlinkBudget',
        description: 'Making expense tracking effortless, all in 3 moves.',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'favicon.png',
            sizes: '192x192',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  build: {
    target: 'es2020',
    cssMinify: 'lightningcss',
  },
});