module.exports = {
  extends: ['stylelint-config-standard'],
  rules: {
    // Enforce consistent custom property naming
    'custom-property-pattern': '^[a-z][a-z0-9]*(-[a-z0-9]+)*$',

    // Enforce consistent class naming (allow hyphens in responsive/state prefixes and fractions/decimal in values)
    'selector-class-pattern': [
      '^([a-z0-9-]+:)*[a-z0-9\\\\/\\._-]+$',
      {
        message: 'Selector should be kebab-case, BEM-style, or a utility-style class like "md:w-1/2" or "focus-visible:outline-none"'
      }
    ],

    // Disable descending specificity as it is common in utility-first approaches
    'no-descending-specificity': null,

    // Allow duplicate properties often used for cross-browser compatibility
    'declaration-block-no-duplicate-properties': [
      true,
      {
        ignoreProperties: ['appearance', 'backdrop-filter', 'background-clip', 'height', 'min-height', 'image-rendering']
      }
    ],

    // Allow vendor-specific and legacy media features/values
    'media-feature-name-no-unknown': [
      true,
      {
        ignoreMediaFeatureNames: ['min-device-pixel-ratio', 'prefers-contrast']
      }
    ],
    'media-feature-name-value-no-unknown': null,

    // Allow deprecated clip property for sr-only/visually-hidden (standard in most frameworks)
    'property-no-deprecated': [
      true,
      {
        ignoreProperties: ['clip']
      }
    ],

    // Allow camelCase for keyframes (e.g., modalSlideIn)
    'keyframes-name-pattern': null,

    // Allow hex colors as they are used in some specific UI components
    'color-no-hex': null,

    // Allow multiple declarations on one line for utility classes
    'declaration-block-single-line-max-declarations': null,

    // Increase precision for grid percentages (e.g., 33.333333%)
    'number-max-precision': 6,

    // Disable invalid media query check to allow variables in media queries (handled by PostCSS)
    'media-query-no-invalid': null,

    // Allow !important in specific cases (like CSS resets)
    'declaration-no-important': null,

    // Allow empty sources for placeholder files
    'no-empty-source': null,

    // Allow @import rules
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['import']
      }
    ],

    // Relax import notation requirements for CSS imports
    'import-notation': null,

    // Allow legacy color function notation for better browser support
    'color-function-notation': null,
    'hue-degree-notation': null,
    'alpha-value-notation': null,

    // Allow duplicate selectors in different contexts
    'no-duplicate-selectors': null,

    // Relax comment formatting
    'comment-empty-line-before': null,

    // Allow common ID patterns
    'selector-id-pattern': null,

    // Allow optimizeSpeed value
    'value-keyword-case': null
  }
};