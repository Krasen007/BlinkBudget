# CSS Architecture Design Document

## Overview

This design document outlines the restructuring of BlinkBudget's CSS architecture from a single monolithic file into a modular, maintainable system. The current `src/style.css` file contains over 800 lines covering design tokens, base styles, components, mobile optimizations, and utilities. This refactoring will improve maintainability, enable better collaboration, and provide a foundation for future development while preserving all existing functionality and visual design.

The modular CSS architecture will follow industry best practices including the ITCSS (Inverted Triangle CSS) methodology, BEM naming conventions where appropriate, and a mobile-first approach that aligns with the existing mobile optimization work.

## Architecture

### File Structure Organization

The new CSS architecture will follow a hierarchical structure based on specificity and scope:

```
src/styles/
├── tokens/
│   ├── colors.css          # Color system and theme variables
│   ├── typography.css      # Font families, sizes, and text styles
│   ├── spacing.css         # Spacing scale and layout tokens
│   ├── breakpoints.css     # Responsive breakpoint definitions
│   └── index.css          # Imports all token files
├── base/
│   ├── reset.css          # CSS reset and normalize
│   ├── typography.css     # Base typography styles
│   └── index.css          # Imports all base files
├── components/
│   ├── buttons.css        # Button variants and states
│   ├── forms.css          # Form inputs and controls
│   ├── cards.css          # Card component styles
│   ├── dialogs.css        # Modal and dialog components
│   └── index.css          # Imports all component files
├── mobile/
│   ├── navigation.css     # Mobile navigation components
│   ├── modals.css         # Mobile-specific modal styles
│   ├── touch.css          # Touch interaction enhancements
│   ├── keyboard.css       # Virtual keyboard handling
│   └── index.css          # Imports all mobile files
├── utilities/
│   ├── layout.css         # Layout utilities (flexbox, grid)
│   ├── spacing.css        # Margin and padding utilities
│   ├── typography.css     # Text utilities
│   ├── accessibility.css  # A11y utilities
│   ├── responsive.css     # Responsive utilities
│   └── index.css          # Imports all utility files
└── main.css              # Main entry point importing all modules
```

### Import Hierarchy

The CSS modules will follow a clear dependency hierarchy:

1. **Tokens** - Design system variables (no dependencies)
2. **Base** - Foundational styles (depends on tokens)
3. **Components** - UI component styles (depends on tokens and base)
4. **Mobile** - Mobile-specific enhancements (depends on tokens, base, components)
5. **Utilities** - Helper classes (depends on tokens)

### Build Integration

The modular CSS will integrate with the existing Vite build system:

- **Development**: Individual CSS files loaded via `@import` for debugging
- **Production**: Combined and minified into a single CSS file
- **Hot Reloading**: Vite's built-in CSS hot reloading maintained
- **PostCSS Integration**: Added for vendor prefixes and optimization

## Components and Interfaces

### Design Token System

**Color System (`tokens/colors.css`)**

```css
:root {
  /* Base color palette */
  --color-primary-hue: 250;
  --color-primary-sat: 84%;
  --color-primary-light: 60%;

  /* Semantic color tokens */
  --color-primary: hsl(
    var(--color-primary-hue),
    var(--color-primary-sat),
    var(--color-primary-light)
  );
  --color-primary-dark: hsl(
    var(--color-primary-hue),
    var(--color-primary-sat),
    50%
  );
  --color-primary-light: hsl(
    var(--color-primary-hue),
    var(--color-primary-sat),
    75%
  );

  /* Surface colors */
  --color-background: hsl(240, 10%, 4%);
  --color-surface: hsl(240, 10%, 10%);
  --color-surface-hover: hsl(240, 10%, 15%);

  /* Text colors */
  --color-text-main: hsl(0, 0%, 100%);
  --color-text-muted: hsl(240, 5%, 65%);
  --color-border: hsl(240, 5%, 20%);
}
```

**Typography System (`tokens/typography.css`)**

```css
:root {
  /* Font families */
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;
  --font-heading: 'Outfit', system-ui, -apple-system, sans-serif;

  /* Font size scale */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;

  /* Line heights */
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
}
```

**Spacing System (`tokens/spacing.css`)**

```css
:root {
  /* Spacing scale */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 0.75rem;
  --spacing-lg: 1rem;
  --spacing-xl: 1.5rem;
  --spacing-2xl: 2rem;
  --spacing-3xl: 3rem;
  --spacing-4xl: 4rem;

  /* Touch-friendly spacing */
  --touch-target-min: 44px;
  --touch-spacing-min: 8px;
  --thumb-reach-zone: 60vh;
}
```

### Component Architecture

**Button Component (`components/buttons.css`)**

```css
/* Base button styles */
.btn {
  /* Core button properties */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md) var(--spacing-xl);
  font-family: var(--font-body);
  font-weight: 600;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--transition-fast);

  /* Touch optimization */
  min-height: var(--touch-target-min);
  min-width: var(--touch-target-min);
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  user-select: none;
}

/* Button variants */
.btn--primary {
  /* Primary button styles */
}
.btn--ghost {
  /* Ghost button styles */
}
.btn--danger {
  /* Danger button styles */
}

/* Button states */
.btn:hover {
  /* Hover styles */
}
.btn:focus {
  /* Focus styles */
}
.btn:active {
  /* Active styles */
}
.btn:disabled {
  /* Disabled styles */
}

/* Mobile-specific button enhancements */
@media (max-width: 767px) {
  .btn {
    /* Mobile-specific adjustments */
  }
}
```

### Mobile Enhancement System

**Mobile Navigation (`mobile/navigation.css`)**

```css
/* Mobile navigation bar */
.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  display: none;
  z-index: 100;

  /* Safe area support */
  padding-bottom: calc(var(--spacing-sm) + var(--safe-area-inset-bottom));
}

@media (max-width: 767px) {
  .mobile-nav {
    display: flex;
  }
}
```

### Utility System

**Layout Utilities (`utilities/layout.css`)**

```css
/* Flexbox utilities */
.flex {
  display: flex;
}
.flex-col {
  flex-direction: column;
}
.items-center {
  align-items: center;
}
.justify-center {
  justify-content: center;
}

/* Grid utilities */
.grid {
  display: grid;
}
.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}
.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

/* Responsive variants */
@media (min-width: 768px) {
  .md\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
```

## Data Models

The CSS architecture does not introduce new data models but organizes existing design tokens and style definitions. The key data structures are:

**Design Token Categories**

- Colors: Primary, surface, text, and semantic color definitions
- Typography: Font families, sizes, weights, and line heights
- Spacing: Consistent spacing scale for margins, padding, and gaps
- Breakpoints: Responsive design breakpoint definitions
- Transitions: Animation and transition timing definitions

**Component Style Categories**

- Base Components: Buttons, forms, cards, dialogs
- Layout Components: Navigation, headers, footers
- Mobile Components: Touch interactions, mobile navigation, modals
- Utility Classes: Layout, spacing, typography, accessibility helpers

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Import Dependency Hierarchy

_For any_ CSS import structure, there should be no circular dependencies between modules
**Validates: Requirements 1.3**

### Property 2: Color Variable Usage

_For any_ CSS file except the color tokens file, hardcoded color values should not be used - only CSS custom properties
**Validates: Requirements 2.2**

### Property 3: Spacing Variable Consistency

_For any_ spacing declaration in component files, values should reference the centralized spacing scale variables
**Validates: Requirements 2.3**

### Property 4: Typography Variable Usage

_For any_ font-related declaration, values should reference centralized typography variables
**Validates: Requirements 2.4**

### Property 5: Design Token Propagation

_For any_ change to a design token variable, the change should automatically affect all components that reference it
**Validates: Requirements 2.5**

### Property 6: Mobile Naming Convention

_For any_ mobile-specific CSS class or variant, it should follow the established naming convention pattern
**Validates: Requirements 3.4**

### Property 7: Component Style Completeness

_For any_ component CSS file, it should contain all related states, variants, and responsive behavior for that component
**Validates: Requirements 4.2**

### Property 8: Component Import Structure

_For any_ component import, the structure should match the established component hierarchy pattern
**Validates: Requirements 4.3**

### Property 9: Component Style Isolation

_For any_ component CSS file, selectors should not affect styles of other unrelated components
**Validates: Requirements 4.4**

### Property 10: Responsive Utility Variants

_For any_ utility class that needs responsive behavior, mobile-first variants should be available for different breakpoints
**Validates: Requirements 5.2**

### Property 11: Utility Naming Consistency

_For any_ utility class, the naming should follow consistent conventions across all utility types
**Validates: Requirements 5.4**

### Property 12: Vendor Prefix Addition

_For any_ CSS property that requires vendor prefixes, they should be automatically added during the build process
**Validates: Requirements 6.3**

## Error Handling

### CSS Architecture Error Scenarios

**Import Resolution Failures**

- Missing CSS files in import statements
- Circular dependency detection and prevention
- Invalid file paths in import hierarchy

**Design Token Inconsistencies**

- Undefined CSS custom properties referenced in components
- Hardcoded values used instead of design tokens
- Inconsistent token naming across files

**Build Process Failures**

- CSS compilation errors during development
- Minification failures in production builds
- PostCSS processing errors

**Component Style Conflicts**

- Overlapping CSS selectors between components
- Specificity conflicts in the cascade
- Mobile and desktop style conflicts

### Error Recovery Strategies

1. **Linting and Validation**: CSS linting rules to catch common errors
2. **Build-time Checks**: Validation of imports and token usage during build
3. **Fallback Values**: CSS custom properties with fallback values
4. **Development Warnings**: Clear error messages during development
5. **Hot Reload Recovery**: Graceful handling of CSS errors during hot reloading

### CSS Linting Rules

```javascript
// .stylelintrc.js
module.exports = {
  extends: ['stylelint-config-standard'],
  rules: {
    'custom-property-pattern': '^[a-z][a-z0-9]*(-[a-z0-9]+)*$',
    'selector-class-pattern':
      '^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$',
    'declaration-no-important': true,
    'color-no-hex': true, // Enforce CSS custom properties for colors
  },
};
```

## Testing Strategy

### Unit Testing Approach

**CSS Structure Validation**

- File existence tests for all required CSS modules
- Import structure validation tests
- Design token completeness tests

**Style Isolation Testing**

- Component selector specificity tests
- Cross-component style conflict detection
- Mobile/desktop style separation validation

### Property-Based Testing Approach

The CSS architecture will use property-based testing to verify:

**Token Usage Properties**

- All color references use CSS custom properties
- All spacing values reference the spacing scale
- All typography declarations use centralized variables

**Import Hierarchy Properties**

- No circular dependencies in the import graph
- Proper dependency order maintained
- All imports resolve to existing files

**Build Output Properties**

- Single CSS file generated in production
- All vendor prefixes added correctly
- Minification preserves functionality

### Testing Framework Integration

**CSS Testing Tools**

- **Stylelint**: CSS linting and style validation
- **PostCSS**: Build-time CSS processing and validation
- **Puppeteer**: Visual regression testing for critical components
- **Jest**: Unit tests for CSS structure and imports

**Property-Based Testing Library**

- **fast-check**: JavaScript property-based testing library for CSS validation
- Minimum 100 iterations per property test
- Custom generators for CSS selectors, values, and structures

**Test Configuration**

```javascript
// CSS property tests will be tagged with:
// **Feature: css-architecture, Property {number}: {property_text}**
```

### Continuous Integration

**Pre-commit Hooks**

- Stylelint validation on all CSS files
- Import dependency validation
- Design token usage verification

**Build Pipeline Validation**

- CSS compilation success verification
- Output file size monitoring
- Visual regression test execution
