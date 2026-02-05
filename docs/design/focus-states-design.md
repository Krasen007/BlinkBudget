# Focus States Design System - BlinkBudget

## Overview

This document provides comprehensive focus state designs for BlinkBudget, ensuring consistent, accessible, and visually appealing keyboard navigation throughout the application.

## Design Principles

1. **Consistency**: All interactive elements use the same focus language
2. **Accessibility**: Meet WCAG 2.1 AA contrast requirements (3:1 minimum)
3. **Clarity**: Focus states are immediately visible and unambiguous
4. **Brand Alignment**: Use BlinkBudget's color palette and design language
5. **Performance**: Lightweight CSS with minimal animation overhead

## Focus State Design System

### 1. Core Focus Tokens

```css
:root {
  /* Focus-specific colors */
  --focus-color: hsl(250, 84%, 60%); /* Primary blue */
  --focus-color-light: hsl(250, 84%, 75%); /* Lighter variant */
  --focus-color-dark: hsl(250, 84%, 50%); /* Darker variant */

  /* Focus dimensions */
  --focus-width: 2px;
  --focus-width-thick: 3px;
  --focus-offset: 2px;
  --focus-offset-large: 4px;

  /* Focus effects */
  --focus-shadow: 0 0 0 3px hsla(250, 84%, 60%, 0.2);
  --focus-shadow-strong: 0 0 0 4px hsla(250, 84%, 60%, 0.3);
  --focus-shadow-subtle: 0 0 0 2px hsla(250, 84%, 60%, 0.15);

  /* Focus transitions */
  --focus-transition: all 150ms ease;
  --focus-transition-fast: all 100ms ease;
}
```

### 2. Base Focus Classes

```css
/* Standard focus outline */
.focus-standard {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: var(--focus-offset);
}

/* Thick focus outline for better visibility */
.focus-strong {
  outline: var(--focus-width-thick) solid var(--focus-color);
  outline-offset: var(--focus-offset-large);
}

/* Focus with shadow effect */
.focus-shadow {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: var(--focus-offset);
  box-shadow: var(--focus-shadow);
}

/* Focus only for keyboard (not mouse) */
.focus-keyboard:focus-visible {
  outline: var(--focus-width-thick) solid var(--focus-color);
  outline-offset: var(--focus-offset);
  box-shadow: var(--focus-shadow);
}

/* Remove focus when not needed */
.focus-none:focus {
  outline: none;
  box-shadow: none;
}
```

## Component-Specific Focus States

### 1. Buttons Focus States

```css
/* Primary buttons */
.btn-primary:focus-visible {
  outline: var(--focus-width-thick) solid var(--focus-color);
  outline-offset: var(--focus-offset);
  box-shadow: var(--focus-shadow);
  background-color: var(--focus-color-dark);
}

/* Secondary/Ghost buttons */
.btn-ghost:focus-visible {
  outline: var(--focus-width-thick) solid var(--focus-color);
  outline-offset: var(--focus-offset);
  box-shadow: var(--focus-shadow);
  border-color: var(--focus-color);
  background-color: var(--color-surface-hover);
}

/* Danger buttons */
.btn-danger:focus-visible {
  outline: var(--focus-width-thick) solid #ef4444;
  outline-offset: var(--focus-offset);
  box-shadow: 0 0 0 3px hsla(0, 71%, 59%, 0.2);
}

/* Icon-only buttons */
.btn-icon:focus-visible {
  outline: var(--focus-width-thick) solid var(--focus-color);
  outline-offset: var(--focus-offset-large);
  box-shadow: var(--focus-shadow-strong);
}
```

### 2. Form Input Focus States

```css
/* Text inputs */
input[type='text'],
input[type='number'],
input[type='email'],
input[type='tel'],
textarea {
  transition: var(--focus-transition);
}

input:focus-visible,
textarea:focus-visible {
  outline: none;
  border-color: var(--focus-color);
  box-shadow: var(--focus-shadow);
  background-color: var(--color-surface-hover);
}

/* Select inputs */
select.input-select:focus-visible {
  outline: none;
  border-color: var(--focus-color);
  box-shadow: var(--focus-shadow);
  background-color: var(--color-surface-hover);
}

/* Date inputs */
input[type='date']:focus-visible {
  outline: none;
  border-color: var(--focus-color);
  box-shadow: var(--focus-shadow);
  background-color: var(--color-surface-hover);
}

/* Form validation focus states */
input:focus-visible:invalid {
  outline: var(--focus-width-thick) solid #ef4444;
  outline-offset: var(--focus-offset);
  box-shadow: 0 0 0 3px hsla(0, 71%, 59%, 0.2);
}

input:focus-visible:valid {
  outline: var(--focus-width-thick) solid #10b981;
  outline-offset: var(--focus-offset);
  box-shadow: 0 0 0 3px hsla(142, 76%, 36%, 0.2);
}
```

### 3. Interactive Component Focus States

```css
/* Transaction items */
.transaction-item:focus-visible {
  outline: var(--focus-width-thick) solid var(--focus-color);
  outline-offset: var(--focus-offset);
  box-shadow: var(--focus-shadow);
  background-color: var(--color-surface-hover);
  transform: translateY(-1px);
}

/* Category chips */
.category-chip:focus-visible {
  outline: var(--focus-width-thick) solid var(--focus-color);
  outline-offset: var(--focus-offset);
  box-shadow: var(--focus-shadow);
  background-color: var(--color-surface-hover);
}

/* Navigation items */
.nav-item:focus-visible {
  outline: var(--focus-width-thick) solid var(--focus-color);
  outline-offset: var(--focus-offset);
  box-shadow: var(--focus-shadow);
  background-color: var(--color-surface-hover);
}

/* Dashboard cards */
.dashboard-card:focus-visible {
  outline: var(--focus-width-thick) solid var(--focus-color);
  outline-offset: var(--focus-offset);
  box-shadow: var(--focus-shadow-strong);
  transform: translateY(-2px);
}

/* Settings options */
.settings-option:focus-visible {
  outline: var(--focus-width-thick) solid var(--focus-color);
  outline-offset: var(--focus-offset);
  box-shadow: var(--focus-shadow);
  background-color: var(--color-surface-hover);
}
```

### 4. Modal and Dialog Focus States

```css
/* Modal focus trap */
.dialog-card:focus-visible {
  outline: var(--focus-width-thick) solid var(--focus-color);
  outline-offset: var(--focus-offset);
  box-shadow: var(--focus-shadow-strong);
}

/* Modal close button */
.dialog-close:focus-visible {
  outline: var(--focus-width-thick) solid var(--focus-color);
  outline-offset: var(--focus-offset-large);
  box-shadow: var(--focus-shadow-strong);
  background-color: var(--color-surface-hover);
}

/* Dialog overlay focus indicator */
.dialog-overlay:focus-within {
  box-shadow: inset 0 0 0 4px var(--focus-color);
}
```

## Mobile-Specific Focus States

### Mobile Optimizations

```css
/* Enhanced mobile focus for touch devices */
@media (max-width: 767px) {
  /* Thicker focus outlines for mobile */
  .focus-mobile:focus-visible {
    outline: var(--focus-width-thick) solid var(--focus-color);
    outline-offset: var(--focus-offset-large);
    box-shadow: var(--focus-shadow-strong);
  }

  /* Mobile button focus */
  .btn:focus-visible {
    outline: 3px solid var(--focus-color);
    outline-offset: 3px;
    box-shadow: var(--focus-shadow-strong);
  }

  /* Mobile input focus */
  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible {
    outline: 3px solid var(--focus-color);
    outline-offset: 2px;
    box-shadow: var(--focus-shadow-strong);
  }
}
```

### High Contrast Mode Support

```css
/* Windows High Contrast Mode */
@media (prefers-contrast: high) {
  :root {
    --focus-color: Highlight;
    --focus-width: 3px;
    --focus-offset: 2px;
  }

  .focus-standard,
  .focus-strong,
  .focus-shadow {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
  }
}
```

## Advanced Focus Techniques

### 1. Focus Indicators with Animation

```css
/* Animated focus ring */
.focus-animated:focus-visible {
  position: relative;
  outline: none;
}

.focus-animated:focus-visible::before {
  content: '';
  position: absolute;
  inset: -4px;
  border: 2px solid var(--focus-color);
  border-radius: inherit;
  animation: focus-ring-pulse 1.5s ease-in-out infinite;
}

@keyframes focus-ring-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.02);
  }
}
```

### 2. Focus Within States

```css
/* Focus within containers */
.form-group:focus-within {
  outline: 1px solid var(--focus-color-light);
  outline-offset: 2px;
  border-radius: var(--radius-md);
}

.search-container:focus-within {
  box-shadow: var(--focus-shadow);
  border-color: var(--focus-color);
}
```

### 3. Skip Links Enhancement

```css
/* Enhanced skip links */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--focus-color);
  color: white;
  padding: var(--spacing-sm) var(--spacing-md);
  text-decoration: none;
  border-radius: var(--radius-md);
  z-index: 1000;
  font-weight: 600;
  transition: top var(--focus-transition);
  outline: 2px solid white;
  outline-offset: 2px;
}

.skip-link:focus {
  top: 6px;
  outline: 3px solid var(--focus-color-light);
  outline-offset: 2px;
  box-shadow: var(--focus-shadow);
}
```

## Focus State Testing Guide

### Visual Testing Checklist

- [ ] All focus states meet 3:1 contrast ratio
- [ ] Focus indicators are at least 2px thick
- [ ] Focus states are consistent across similar components
- [ ] Focus states don't obscure content
- [ ] Focus states work in high contrast mode
- [ ] Focus states respect reduced motion preferences

### Keyboard Navigation Testing

- [ ] Tab order follows logical reading order
- [ ] All interactive elements receive focus
- [ ] Focus moves predictably with arrow keys
- [ ] Escape key works as expected
- [ ] Enter/Space activate focused elements
- [ ] Focus trapping works in modals

### Screen Reader Testing

- [ ] Focus changes are announced
- [ ] Focus indicators don't interfere with screen readers
- [ ] Focus management works with voice commands
- [ ] Skip links work with screen readers

## Implementation Guidelines

### 1. Adding Focus States to New Components

```css
/* Template for new component focus states */
.new-component {
  /* Base styles */
  transition: var(--focus-transition);
}

.new-component:focus-visible {
  outline: var(--focus-width-thick) solid var(--focus-color);
  outline-offset: var(--focus-offset);
  box-shadow: var(--focus-shadow);
}

/* Mobile-specific adjustments */
@media (max-width: 767px) {
  .new-component:focus-visible {
    outline: 3px solid var(--focus-color);
    outline-offset: var(--focus-offset-large);
    box-shadow: var(--focus-shadow-strong);
  }
}
```

### 2. JavaScript Focus Management

```javascript
// Focus management utilities
class FocusManager {
  // Trap focus within container
  static trapFocus(container) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    container.addEventListener('keydown', e => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            lastFocusable.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            firstFocusable.focus();
            e.preventDefault();
          }
        }
      }
    });
  }

  // Restore focus to previous element
  static restoreFocus(previousElement) {
    if (previousElement && previousElement.focus) {
      previousElement.focus();
    }
  }
}
```

### 3. CSS Custom Properties for Dynamic Focus

```css
/* Dynamic focus colors for different states */
:root {
  --focus-default: hsl(250, 84%, 60%);
  --focus-success: hsl(142, 76%, 36%);
  --focus-warning: hsl(38, 92%, 50%);
  --focus-error: hsl(0, 71%, 59%);
  --focus-info: hsl(199, 89%, 48%);
}

/* Apply dynamic focus colors */
.focus-success:focus-visible {
  outline-color: var(--focus-success);
  box-shadow: 0 0 0 3px hsla(142, 76%, 36%, 0.2);
}

.focus-warning:focus-visible {
  outline-color: var(--focus-warning);
  box-shadow: 0 0 0 3px hsla(38, 92%, 50%, 0.2);
}

.focus-error:focus-visible {
  outline-color: var(--focus-error);
  box-shadow: 0 0 0 3px hsla(0, 71%, 59%, 0.2);
}
```

## Performance Considerations

### Optimized Focus Transitions

```css
/* Hardware-accelerated focus transitions */
.focus-optimized {
  will-change: outline-color, box-shadow, transform;
  transform: translateZ(0); /* Force hardware acceleration */
}

.focus-optimized:focus-visible {
  outline-color: var(--focus-color);
  box-shadow: var(--focus-shadow);
  transition:
    outline-color 150ms ease,
    box-shadow 150ms ease;
}
```

### Reduced Motion Support

```css
/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  .focus-animated:focus-visible::before {
    animation: none;
  }

  .focus-optimized:focus-visible {
    transition: none;
  }
}
```

## Browser Compatibility

### Focus Support Matrix

| Browser      | :focus-visible | :focus-within | Custom Properties | Notes        |
| ------------ | -------------- | ------------- | ----------------- | ------------ |
| Chrome 86+   | ✅             | ✅            | ✅                | Full support |
| Firefox 85+  | ✅             | ✅            | ✅                | Full support |
| Safari 15.4+ | ✅             | ✅            | ✅                | Full support |
| Edge 86+     | ✅             | ✅            | ✅                | Full support |

### Fallback for Older Browsers

```css
/* Fallback for browsers without :focus-visible */
@supports not (: focus-visible) {
  .btn:focus {
    outline: var(--focus-width-thick) solid var(--focus-color);
    outline-offset: var(--focus-offset);
    box-shadow: var(--focus-shadow);
  }
}
```

This comprehensive focus state design system ensures BlinkBudget provides excellent keyboard navigation and accessibility while maintaining visual consistency with the brand design language.
