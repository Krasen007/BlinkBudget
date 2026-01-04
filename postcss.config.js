export default {
  plugins: {
    // Import resolution for @import statements
    'postcss-import': {},

    // Support for custom media queries (e.g., @custom-media --md (min-width: 768px))
    'postcss-custom-media': {},

    // Autoprefixer for vendor prefixes
    autoprefixer: {
      overrideBrowserslist: [
        '> 1%',
        'last 2 versions',
        'not dead',
        'not ie 11',
      ],
    },

    // CSS purging for production builds (removes unused styles)
    ...(process.env.NODE_ENV === 'production'
      ? {
          '@fullhuman/postcss-purgecss': {
            content: ['./index.html', './src/**/*.js', './src/**/*.html'],
            defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
            // Safelist important classes that might be added dynamically
            safelist: [
              // Keep utility classes that might be added via JavaScript
              /^(flex|grid|hidden|block|inline|absolute|relative|fixed)/,
              // Keep state classes
              /^(active|disabled|loading|error|success)/,
              // Keep mobile navigation classes
              /^mobile-/,
              // Keep animation classes
              /^(fade|slide|bounce)/,
              // Keep focus and hover states
              /:hover/,
              /:focus/,
              /:active/,
              // Keep responsive variants
              /^(sm|md|lg|xl):/,
            ],
            // Don't remove CSS custom properties
            variables: true,
          },
        }
      : {}),

    // CSS optimization and minification for production
    ...(process.env.NODE_ENV === 'production'
      ? {
          cssnano: {
            preset: [
              'default',
              {
                // Preserve CSS custom properties
                cssDeclarationSorter: false,
                // Don't remove unused CSS custom properties
                reduceIdents: false,
                // Preserve z-index values
                zindex: false,
                // Don't merge rules that might break cascade
                mergeRules: false,
              },
            ],
          },
        }
      : {}),
  },
};
