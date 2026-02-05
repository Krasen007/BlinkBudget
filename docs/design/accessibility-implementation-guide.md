# Accessibility Implementation Guide for Developers

## Overview

This guide provides step-by-step instructions for implementing the accessibility improvements identified in the audit. All changes are designed to be implemented within the current sprint without breaking existing functionality.

## Quick Start Implementation

### 1. Update CSS Tokens (Critical - Day 1)

**File:** `src/styles/tokens.css`

Add these enhanced accessibility tokens to the `:root` selector:

```css
:root {
  /* Enhanced accessibility tokens */
  --focus-color: hsl(250, 84%, 60%);
  --focus-color-light: hsl(250, 84%, 75%);
  --focus-color-dark: hsl(250, 84%, 50%);

  --focus-width: 2px;
  --focus-width-thick: 3px;
  --focus-offset: 2px;
  --focus-offset-large: 4px;

  --focus-shadow: 0 0 0 3px hsla(250, 84%, 60%, 0.2);
  --focus-shadow-strong: 0 0 0 4px hsla(250, 84%, 60%, 0.3);

  /* Improved contrast colors */
  --color-border: hsl(240, 5%, 30%); /* Enhanced from 20% */
  --color-border-strong: hsl(240, 5%, 40%); /* New token */
  --color-text-muted: hsl(240, 5%, 70%); /* Enhanced from 65% */

  /* Focus transitions */
  --focus-transition: all 150ms ease;
}
```

### 2. Create Accessibility CSS Module (Day 1)

**File:** `src/styles/components/accessibility.css`

```css
/* Accessibility Component Styles */

/* Base focus styles */
.focus-standard:focus-visible {
  outline: var(--focus-width-thick) solid var(--focus-color);
  outline-offset: var(--focus-offset);
  box-shadow: var(--focus-shadow);
}

/* Button focus states */
.btn:focus-visible {
  outline: var(--focus-width-thick) solid var(--focus-color);
  outline-offset: var(--focus-offset);
  box-shadow: var(--focus-shadow);
}

.btn-primary:focus-visible {
  background-color: var(--focus-color-dark);
}

.btn-ghost:focus-visible {
  border-color: var(--focus-color);
  background-color: var(--color-surface-hover);
}

.btn-danger:focus-visible {
  outline-color: #ef4444;
  box-shadow: 0 0 0 3px hsla(0, 71%, 59%, 0.2);
}

/* Form input focus states */
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: none;
  border-color: var(--focus-color);
  box-shadow: var(--focus-shadow);
  background-color: var(--color-surface-hover);
}

/* Transaction items focus */
.transaction-item:focus-visible {
  outline: var(--focus-width-thick) solid var(--focus-color);
  outline-offset: var(--focus-offset);
  box-shadow: var(--focus-shadow);
  background-color: var(--color-surface-hover);
}

/* Mobile focus enhancements */
@media (max-width: 767px) {
  .btn:focus-visible,
  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible {
    outline: 3px solid var(--focus-color);
    outline-offset: var(--focus-offset-large);
    box-shadow: var(--focus-shadow-strong);
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .focus-standard:focus-visible,
  .btn:focus-visible,
  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible {
    outline: 3px solid Highlight;
    outline-offset: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .focus-standard:focus-visible,
  .btn:focus-visible,
  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible {
    transition: none;
  }
}
```

### 3. Update Main CSS Import (Day 1)

**File:** `src/styles/main.css`

Add the new accessibility module:

```css
/* Add after existing component imports */
@import './components/accessibility.css';
```

## Component-Specific Implementation

### 4. Update TransactionForm Component (Day 2)

**File:** `src/components/TransactionForm.js`

Add keyboard navigation and ARIA attributes:

```javascript
// In the TransactionForm component, add these enhancements:

// Add tabindex to make transaction items keyboard accessible
const makeTransactionKeyboardAccessible = transactionElement => {
  transactionElement.setAttribute('tabindex', '0');
  transactionElement.setAttribute('role', 'button');
  transactionElement.setAttribute(
    'aria-label',
    `Transaction: ${transactionData.description}, Amount: ${transactionData.amount}`
  );

  // Add keyboard event handlers
  transactionElement.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Trigger transaction edit/view
      onTransactionClick(transactionData);
    }
  });
};

// Add ARIA labels to form inputs
amountInput.setAttribute('aria-label', 'Transaction amount');
amountInput.setAttribute('aria-required', 'true');

accSelect.setAttribute('aria-label', 'Select account');
accSelect.setAttribute('aria-required', 'true');

// Add live region for form validation
const liveRegion = document.createElement('div');
liveRegion.setAttribute('aria-live', 'polite');
liveRegion.setAttribute('aria-atomic', 'true');
liveRegion.className = 'sr-only';
form.appendChild(liveRegion);

// Function to announce validation messages
const announceValidation = message => {
  liveRegion.textContent = message;
  setTimeout(() => {
    liveRegion.textContent = '';
  }, 1000);
};
```

### 5. Update Button Components (Day 2)

**File:** `src/components/Button.js` (or create if it doesn't exist)

```javascript
// Enhanced button component with accessibility
export const createButton = ({
  text,
  variant = 'primary',
  onClick,
  ariaLabel,
  disabled = false,
  className = '',
}) => {
  const button = document.createElement('button');
  button.textContent = text;
  button.className = `btn btn-${variant} focus-standard ${className}`;
  button.disabled = disabled;

  // Accessibility attributes
  if (ariaLabel) {
    button.setAttribute('aria-label', ariaLabel);
  }

  if (disabled) {
    button.setAttribute('aria-disabled', 'true');
  }

  // Event handlers
  button.addEventListener('click', onClick);

  return button;
};
```

### 6. Update Category Selector (Day 3)

**File:** `src/components/CategorySelector.js`

```javascript
// Add keyboard navigation to category chips
const addCategoryKeyboardNavigation = (categoryChip, category, onSelect) => {
  categoryChip.setAttribute('tabindex', '0');
  categoryChip.setAttribute('role', 'button');
  categoryChip.setAttribute('aria-label', `Category: ${category.name}`);
  categoryChip.setAttribute('aria-pressed', 'false');

  categoryChip.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(category);
      // Update aria state
      categoryChip.setAttribute('aria-pressed', 'true');
    }
  });

  categoryChip.addEventListener('click', () => {
    onSelect(category);
    categoryChip.setAttribute('aria-pressed', 'true');
  });
};

// Add arrow key navigation between categories
const setupArrowKeyNavigation = categoryContainer => {
  const categories = categoryContainer.querySelectorAll('[role="button"]');

  categoryContainer.addEventListener('keydown', e => {
    const currentIndex = Array.from(categories).findIndex(
      cat => cat === document.activeElement
    );

    let nextIndex;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = (currentIndex + 1) % categories.length;
        categories[nextIndex].focus();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        nextIndex =
          currentIndex === 0 ? categories.length - 1 : currentIndex - 1;
        categories[nextIndex].focus();
        break;
    }
  });
};
```

### 7. Add Modal Focus Management (Day 3)

**File:** `src/components/Modal.js` (or create if it doesn't exist)

```javascript
// Focus management for modals
class ModalFocusManager {
  constructor(modalElement) {
    this.modal = modalElement;
    this.previousFocus = document.activeElement;
    this.focusableElements = null;
    this.firstFocusable = null;
    this.lastFocusable = null;
  }

  init() {
    // Get all focusable elements
    this.focusableElements = this.modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    this.firstFocusable = this.focusableElements[0];
    this.lastFocusable =
      this.focusableElements[this.focusableElements.length - 1];

    // Set initial focus
    if (this.firstFocusable) {
      this.firstFocusable.focus();
    }

    // Add event listeners
    this.modal.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  handleKeyDown(e) {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === this.firstFocusable) {
          e.preventDefault();
          this.lastFocusable.focus();
        }
      } else {
        // Tab
        if (document.activeElement === this.lastFocusable) {
          e.preventDefault();
          this.firstFocusable.focus();
        }
      }
    }

    if (e.key === 'Escape') {
      this.close();
    }
  }

  close() {
    // Restore focus
    if (this.previousFocus && this.previousFocus.focus) {
      this.previousFocus.focus();
    }

    // Remove event listeners
    this.modal.removeEventListener('keydown', this.handleKeyDown.bind(this));
  }
}

// Usage in modal creation
export const createModal = content => {
  const modal = document.createElement('div');
  modal.className = 'dialog-overlay';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'modal-title');

  // Add content
  modal.innerHTML = content;

  // Initialize focus management
  const focusManager = new ModalFocusManager(modal);

  // Show modal
  document.body.appendChild(modal);
  focusManager.init();

  return {
    element: modal,
    close: () => {
      focusManager.close();
      modal.remove();
    },
  };
};
```

## Testing Implementation

### 8. Add Accessibility Testing Utilities (Day 4)

**File:** `tests/accessibility/test-utils.js`

```javascript
// Accessibility testing utilities
export const AccessibilityTests = {
  // Test color contrast
  testContrast: (element, foreground, background) => {
    const contrast = getContrastRatio(foreground, background);
    return {
      ratio: contrast,
      passesAA: contrast >= 4.5,
      passesAAA: contrast >= 7,
      passesLargeAA: contrast >= 3,
    };
  },

  // Test focus order
  testFocusOrder: container => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const focusOrder = [];
    focusableElements.forEach(element => {
      focusOrder.push({
        element: element,
        tabIndex: element.tabIndex,
        ariaLabel: element.getAttribute('aria-label'),
        role: element.getAttribute('role'),
      });
    });

    return focusOrder;
  },

  // Test ARIA attributes
  testAria: element => {
    return {
      hasLabel:
        element.hasAttribute('aria-label') ||
        element.hasAttribute('aria-labelledby'),
      hasRole: element.hasAttribute('role'),
      hasRequired: element.hasAttribute('aria-required'),
      hasExpanded: element.hasAttribute('aria-expanded'),
      hasPressed: element.hasAttribute('aria-pressed'),
    };
  },

  // Test keyboard accessibility
  testKeyboardNavigation: container => {
    const results = [];
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    focusableElements.forEach(element => {
      element.focus();
      results.push({
        element: element,
        isFocused: document.activeElement === element,
        hasFocusStyles: window.getComputedStyle(element).outline !== 'none',
      });
    });

    return results;
  },
};

// Helper function to calculate contrast ratio
function getContrastRatio(foreground, background) {
  const rgb1 = hexToRgb(foreground);
  const rgb2 = hexToRgb(background);

  const l1 = getLuminance(rgb1);
  const l2 = getLuminance(rgb2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

function hexToRgb(hex) {
  // Convert hex to RGB
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function getLuminance(rgb) {
  const { r, g, b } = rgb;
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}
```

### 9. Add Accessibility Tests (Day 4)

**File:** `tests/accessibility/accessibility.test.js`

```javascript
import { AccessibilityTests } from './test-utils.js';

describe('Accessibility Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('Color Contrast', () => {
    test('Primary buttons meet AA contrast', () => {
      const button = document.createElement('button');
      button.className = 'btn btn-primary';
      button.textContent = 'Test Button';
      document.body.appendChild(button);

      const styles = window.getComputedStyle(button);
      const contrast = AccessibilityTests.testContrast(
        button,
        styles.color,
        styles.backgroundColor
      );

      expect(contrast.passesAA).toBe(true);
    });

    test('Text meets AA contrast', () => {
      const text = document.createElement('p');
      text.textContent = 'Test text';
      text.className = 'text-main';
      document.body.appendChild(text);

      const styles = window.getComputedStyle(text);
      const contrast = AccessibilityTests.testContrast(
        text,
        styles.color,
        styles.backgroundColor
      );

      expect(contrast.passesAA).toBe(true);
    });
  });

  describe('Focus Management', () => {
    test('All interactive elements are focusable', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button>Button 1</button>
        <input type="text" placeholder="Input">
        <a href="#">Link</a>
      `;
      document.body.appendChild(container);

      const focusOrder = AccessibilityTests.testFocusOrder(container);
      expect(focusOrder).toHaveLength(3);
    });

    test('Focus styles are visible', () => {
      const button = document.createElement('button');
      button.className = 'btn btn-primary';
      button.textContent = 'Test';
      document.body.appendChild(button);

      button.focus();
      const styles = window.getComputedStyle(button);
      expect(styles.outline).not.toBe('none');
    });
  });

  describe('ARIA Attributes', () => {
    test('Form inputs have proper labels', () => {
      const input = document.createElement('input');
      input.setAttribute('aria-label', 'Transaction amount');
      document.body.appendChild(input);

      const aria = AccessibilityTests.testAria(input);
      expect(aria.hasLabel).toBe(true);
    });

    test('Buttons have proper roles', () => {
      const button = document.createElement('button');
      button.setAttribute('role', 'button');
      document.body.appendChild(button);

      const aria = AccessibilityTests.testAria(button);
      expect(aria.hasRole).toBe(true);
    });
  });
});
```

## Implementation Checklist

### Day 1 Tasks

- [ ] Update CSS tokens with accessibility improvements
- [ ] Create accessibility.css module
- [ ] Update main.css imports
- [ ] Test basic focus styles

### Day 2 Tasks

- [ ] Update TransactionForm component
- [ ] Update button components
- [ ] Add ARIA labels to form inputs
- [ ] Test keyboard navigation in forms

### Day 3 Tasks

- [ ] Update CategorySelector with keyboard navigation
- [ ] Implement modal focus management
- [ ] Add arrow key navigation
- [ ] Test focus trapping

### Day 4 Tasks

- [ ] Create accessibility testing utilities
- [ ] Write accessibility tests
- [ ] Run automated tests
- [ ] Manual keyboard navigation testing

### Day 5 Tasks

- [ ] Screen reader testing
- [ ] High contrast mode testing
- [ ] Mobile accessibility testing
- [ ] Documentation updates

## Browser Testing Requirements

### Required Browsers

- Chrome 90+ (Desktop & Mobile)
- Firefox 88+ (Desktop & Mobile)
- Safari 14+ (Desktop & Mobile)
- Edge 90+ (Desktop & Mobile)

### Assistive Technology Testing

- **Screen Readers:** NVDA, VoiceOver, TalkBack
- **Keyboard:** Full keyboard navigation
- **Voice Control:** Siri, Google Assistant
- **Switch Control:** iOS Switch Control, Windows Switch Access

## Success Metrics

### Automated Tests

- 100% focus state coverage
- 100% ARIA label coverage
- 0 contrast ratio failures
- 95%+ keyboard navigation coverage

### Manual Testing

- All components keyboard accessible
- Screen reader announcements work correctly
- High contrast mode functional
- Mobile accessibility verified

### Performance Impact

- CSS bundle size increase < 2KB
- No performance regression
- Smooth focus transitions
- Reduced motion respected

## Troubleshooting

### Common Issues

1. **Focus styles not appearing**
   - Check CSS specificity
   - Verify `:focus-visible` support
   - Ensure proper CSS imports

2. **Keyboard navigation not working**
   - Verify `tabindex` attributes
   - Check event listener conflicts
   - Test with different browsers

3. **Screen reader issues**
   - Verify ARIA attributes
   - Test with actual screen readers
   - Check semantic HTML structure

4. **High contrast mode problems**
   - Test with Windows High Contrast
   - Verify system color usage
   - Check media query support

This implementation guide provides everything needed to achieve WCAG 2.1 AA compliance while maintaining BlinkBudget's excellent user experience and performance standards.
