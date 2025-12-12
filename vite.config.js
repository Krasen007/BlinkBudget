import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
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
