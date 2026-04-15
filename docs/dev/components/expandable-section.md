# ExpandableSection Component

## Overview

The ExpandableSection component creates a collapsible section with a title and expandable content area. It supports state persistence via localStorage, smooth animations, and full accessibility compliance.

## Component Information

- File: src/components/ExpandableSection.js
- Feature: Progressive Disclosure Interface (Feature 3.5.2)

## Features

### Core Functionality

- Toggle expand/collapse with smooth CSS transitions
- State persistence in localStorage
- Custom icon support
- Programmatic expand/collapse

### Accessibility

- Semantic button element for toggle
- ARIA attributes (aria-expanded, aria-label)
- Keyboard support (Enter, Space, Tab)
- Focus styles for keyboard navigation
- Screen reader support

### Mobile Support

- Touch event handling
- Scale feedback on touch
- Minimum touch target sizes (44px minimum)

## Usage

### Basic Usage

```javascript
import { ExpandableSection } from '../components/ExpandableSection.js';

const section = ExpandableSection({
  title: 'Transaction Details',
  defaultExpanded: false,
});
```

### With Options

```javascript
const section = ExpandableSection({
  title: 'Advanced Options',
  storageKey: 'advanced-options-expanded',
  icon: 'Gear',
  defaultExpanded: true,
});
```

### With Content

```javascript
const content = document.createElement('div');
content.textContent = 'This is the expandable content';

const section = ExpandableSection({
  title: 'Settings',
  content: content,
  storageKey: 'settings-expanded',
});
```

## API

### Component Options

| Property        | Type        | Default  | Description                      |
| --------------- | ----------- | -------- | -------------------------------- |
| title           | string      | Required | Section title text               |
| content         | HTMLElement | null     | Initial content element          |
| defaultExpanded | boolean     | false    | Initial expanded state           |
| storageKey      | string      | null     | localStorage key for persistence |
| icon            | string      | null     | Icon to display before title     |

### Return Object

| Method              | Description                                                                      |
| ------------------- | -------------------------------------------------------------------------------- |
| expand()            | Expand the section                                                               |
| collapse()          | Collapse the section                                                             |
| toggleSection()     | Toggle expanded state                                                            |
| isExpanded()        | Returns boolean for quick truthy checks - whether section is currently expanded  |
| setContent(element) | Replace content                                                                  |
| getExpandedState()  | Returns current expanded state as boolean - same as isExpanded() for consistency |

### Properties

| Property  | Type        | Description               |
| --------- | ----------- | ------------------------- |
| container | HTMLElement | Main component container  |
| toggle    | HTMLElement | Toggle button element     |
| content   | HTMLElement | Content container element |

## Implementation Details

### CSS Classes

```css
.expandable-section          /* Main container */
.expandable-section-toggle   /* Toggle button */
.expandable-section-title    /* Title container */
.expandable-section-icon     /* Icon element */
.expandable-section-arrow    /* Arrow indicator */
.expandable-section-content  /* Content container */
```

### CSS Custom Properties Used

- `--spacing-md`, `--spacing-lg`
- `--color-surface`, `--color-border`, `--color-text-main`
- `--color-surface-hover`, `--focus-color`
- `--radius-lg`, `--font-size-base`, `--font-size-lg`, `--font-size-sm`
- `--transition-fast`, `--transition-normal`
- `--touch-target-min`, `--focus-shadow-strong`

### State Management

```javascript
// Initial state
let expanded = defaultExpanded;

// Load from localStorage if storageKey provided
if (storageKey) {
  const stored = localStorage.getItem(storageKey);
  if (stored !== null) {
    expanded = stored === 'true';
  }
}

// Save to localStorage on toggle
if (storageKey) {
  localStorage.setItem(storageKey, expanded.toString());
}
```

### Event Handling

```javascript
// Click events
toggle.addEventListener('click', toggleSection);

// Keyboard events
toggle.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    toggleSection();
  }
});

// Touch events for mobile feedback
toggle.addEventListener(
  'touchstart',
  () => {
    toggle.style.transform = 'scale(0.98)';
  },
  { passive: true }
);
```

## Accessibility Implementation

### ARIA Attributes

```javascript
toggle.setAttribute('aria-expanded', expanded.toString());
toggle.setAttribute(
  'aria-label',
  expanded ? `Collapse section: ${title}` : `Expand section: ${title}`
);
```

### Keyboard Navigation

- Tab: Navigate to toggle button
- Enter/Space: Toggle expanded state
- Focus: Visible focus styles with proper contrast

### Screen Reader Support

- Semantic button element
- Descriptive aria-label
- aria-expanded state indicator
- Arrow marked with aria-hidden="true"

## Performance Considerations

- CSS transitions for smooth animations
- Event listeners use passive mode where possible
- localStorage reads are synchronous but minimal
- Component returns object for efficient method access

## Error Handling

```javascript
// localStorage errors are caught and logged
try {
  const stored = localStorage.getItem(storageKey);
  if (stored !== null) {
    expanded = stored === 'true';
  }
} catch (error) {
  console.warn(`Failed to read localStorage key "${storageKey}":`, error);
  // Continue with default value
}
```

## Examples

### Expense Details Section

```javascript
const expenseContent = document.createElement('div');
expenseContent.innerHTML = `
  <p>Amount: $25.50</p>
  <p>Category: Food & Dining</p>
  <p>Date: 2026-04-07</p>
`;

const expenseSection = ExpandableSection({
  title: 'Expense Details',
  content: expenseContent,
  storageKey: 'expense-details-expanded',
  icon: 'Receipt',
});
```

### Settings Section

```javascript
const settingsSection = ExpandableSection({
  title: 'Application Settings',
  defaultExpanded: false,
  storageKey: 'app-settings-expanded',
});

// Later add content
const settingsContent = createSettingsForm();
settingsSection.setContent(settingsContent);
```

---

_Component Version: 1.0_
_Last Updated: April 7, 2026_
