module.exports = {
  extends: ['stylelint-config-standard'],
  rules: {
    // Enforce CSS custom properties for colors (no hardcoded hex values)
    'color-no-hex': true,
    
    // Enforce consistent custom property naming
    'custom-property-pattern': '^[a-z][a-z0-9]*(-[a-z0-9]+)*$',
    
    // Enforce consistent class naming (BEM-like)
    'selector-class-pattern': '^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$',
    
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