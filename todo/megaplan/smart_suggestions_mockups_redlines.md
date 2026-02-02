# Smart Suggestions - High-Fidelity Mockups & Redlines

**Date:** February 2, 2026  
**Designer:** UX/UI Designer  
**Deliverable:** Developer Implementation Specifications  
**Phase:** 2 Week 4 - Smart Suggestions UI

---

## Mockup 1: Smart Amount Input Component

### Visual Mockup

```
┌─────────────────────────────────────────────────────────────┐
│ 💰 Amount                                                   │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ $4.50                                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 💡 Smart Suggestions                                        │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│ │ $4.50   │ │ $12.00  │ │ $25.00  │ │ $50.00  │           │
│ │ ☕ Coffee│ │ 🍽️ Lunch│ │ ⛽ Gas   │ │ 🛒 Groceries│       │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                             │
│ ⭐ Most Likely: Coffee (85% confidence)                    │
└─────────────────────────────────────────────────────────────┘
```

### Detailed Redlines

#### Container & Layout
```css
.smart-amount-container {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: var(--spacing-lg);
}

.smart-amount-label {
  font-family: var(--font-heading);
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-main);
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}
```

#### Amount Input Field
```css
.smart-amount-input {
  width: 100%;
  height: 56px; /* var(--touch-target-standard) */
  background-color: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0 var(--spacing-lg);
  font-family: var(--font-body);
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-text-main);
  text-align: left;
  transition: all var(--transition-fast);
  box-sizing: border-box;
}

.smart-amount-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px hsla(var(--primary-hue), var(--primary-sat), var(--primary-light), 0.15);
  outline: none;
}

.smart-amount-input::placeholder {
  color: var(--color-text-muted);
  font-weight: 400;
}
```

#### Suggestion Chips Container
```css
.smart-suggestions-container {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background: hsla(var(--primary-hue), var(--primary-sat), var(--primary-light), 0.05);
  border-radius: var(--radius-md);
  border: 1px solid hsla(var(--primary-hue), var(--primary-sat), var(--primary-light), 0.2);
}

.suggestions-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}
```

#### Individual Suggestion Chip
```css
.suggestion-chip {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  min-height: 64px;
  padding: var(--spacing-sm);
  margin: 0 var(--spacing-xs);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.suggestion-chip:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px hsla(0, 0%, 0%, 0.15);
}

.suggestion-chip.selected {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.suggestion-amount {
  font-size: var(--font-size-base);
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
}

.suggestion-category {
  font-size: var(--font-size-xs);
  opacity: 0.8;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}
```

#### Confidence Indicator
```css
.confidence-indicator {
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: hsla(120, 70%, 50%, 0.1);
  border-left: 3px solid hsl(120, 70%, 50%);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.confidence-high {
  border-left-color: hsl(120, 70%, 50%); /* Green */
  background: hsla(120, 70%, 50%, 0.1);
}

.confidence-medium {
  border-left-color: hsl(45, 90%, 50%); /* Orange */
  background: hsla(45, 90%, 50%, 0.1);
}

.confidence-low {
  border-left-color: hsl(0, 70%, 50%); /* Red */
  background: hsla(0, 70%, 50%, 0.1);
}
```

### Responsive Behavior
```css
@media (width <= 480px) {
  .suggestion-chip {
    min-width: 70px;
    min-height: 56px;
    padding: var(--spacing-xs);
  }
  
  .suggestion-amount {
    font-size: var(--font-size-sm);
  }
  
  .suggestion-category {
    font-size: 10px;
  }
}

@media (width <= 380px) {
  .smart-suggestions-container {
    display: flex;
    overflow-x: auto;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm);
    scroll-snap-type: x mandatory;
  }
  
  .suggestion-chip {
    flex-shrink: 0;
    scroll-snap-align: start;
  }
}
```

---

## Mockup 2: Smart Category Selector

### Visual Mockup

```
┌─────────────────────────────────────────────────────────────┐
│ 🏷️ Category                                                │
│                                                             │
│ ⭐ Smart Match                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ☕ Coffee                                               │ │
│ │ Based on: $4.50 amount, 8:30 AM time                   │ │
│ │ Confidence: 85%                                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 📊 All Categories                                          │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│ │ ☕      │ │ 🚗      │ │ 🏠      │ │ 🎬      │           │
│ │ Food &  │ │ Car     │ │ Home    │ │ Fun     │           │
│ │ Drink   │ │ Transport│ │ Bills   │ │ Entertainment│       │
│ │ (25%)   │ │ (15%)   │ │ (20%)   │ │ (10%)   │           │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│ │ 💰      │ │ 🎁      │ │ ⚕️      │ │ 📱      │           │
│ │ Salary  │ │ Gifts   │ │ Health  │ │ Other   │           │
│ │ Income  │ │ Personal│ │ Medical │ │ Misc    │           │
│ │ (5%)    │ │ (8%)    │ │ (7%)    │ │ (10%)   │           │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### Detailed Redlines

#### Smart Match Section
```css
.smart-match-container {
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, 
    hsla(var(--primary-hue), var(--primary-sat), var(--primary-light), 0.1) 0%,
    hsla(var(--primary-hue), var(--primary-sat), var(--primary-light), 0.05) 100%
  );
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-lg);
  position: relative;
  overflow: hidden;
}

.smart-match-container::before {
  content: '⭐';
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  font-size: var(--font-size-lg);
  opacity: 0.6;
}

.smart-match-category {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-text-main);
  margin-bottom: var(--spacing-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.smart-match-reasoning {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-xs);
  line-height: var(--line-height-normal);
}

.smart-match-confidence {
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--color-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}
```

#### Category Grid
```css
.category-grid-container {
  margin-bottom: var(--spacing-md);
}

.category-grid-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.category-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80px;
  padding: var(--spacing-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: center;
  position: relative;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.category-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px hsla(0, 0%, 0%, 0.15);
}

.category-card.selected {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.category-icon {
  font-size: var(--font-size-2xl);
  margin-bottom: var(--spacing-xs);
  line-height: 1;
}

.category-name {
  font-size: var(--font-size-xs);
  font-weight: 500;
  line-height: var(--line-height-tight);
  margin-bottom: var(--spacing-xs);
}

.category-frequency {
  font-size: 10px;
  opacity: 0.7;
  background: hsla(0, 0%, 0%, 0.1);
  padding: 2px 6px;
  border-radius: var(--radius-full);
}

.category-card.high-frequency {
  border-width: 2px;
  border-color: hsla(var(--primary-hue), var(--primary-sat), var(--primary-light), 0.3);
}

.category-card.medium-frequency {
  border-color: hsla(var(--primary-hue), var(--primary-sat), var(--primary-light), 0.2);
}

.category-card.low-frequency {
  opacity: 0.8;
}
```

### Responsive Grid Behavior
```css
@media (width <= 480px) {
  .category-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-xs);
  }
  
  .category-card {
    min-height: 70px;
    padding: var(--spacing-sm);
  }
  
  .category-icon {
    font-size: var(--font-size-xl);
  }
  
  .category-name {
    font-size: 10px;
  }
}

@media (width <= 380px) {
  .category-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .category-card {
    min-height: 60px;
  }
}
```

---

## Mockup 3: Smart Note Field

### Visual Mockup

```
┌─────────────────────────────────────────────────────────────┐
│ 📝 Note (Optional)                                         │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Starbucks coffee                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 💡 Suggestions for Coffee:                                 │
│ • Starbucks coffee                                         │
│ • Morning latte                                           │
│ • Coffee break                                            │
│ • Daily coffee                                            │
│                                                             │
│ 🏪 Recognized Merchant:                                   │
│ ⭐ Starbucks (Main Street location)                       │
│ 📍 Based on GPS + amount pattern                          │
└─────────────────────────────────────────────────────────────┘
```

### Detailed Redlines

#### Note Input Field
```css
.smart-note-container {
  margin-top: var(--spacing-lg);
}

.smart-note-label {
  font-family: var(--font-heading);
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-main);
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.smart-note-input {
  width: 100%;
  min-height: 48px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  font-family: var(--font-body);
  font-size: var(--font-size-base);
  color: var(--color-text-main);
  transition: all var(--transition-fast);
  resize: vertical;
  box-sizing: border-box;
}

.smart-note-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px hsla(var(--primary-hue), var(--primary-sat), var(--primary-light), 0.15);
  outline: none;
}

.smart-note-input::placeholder {
  color: var(--color-text-muted);
  font-style: italic;
}
```

#### Suggestion List
```css
.note-suggestions-container {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background: hsla(var(--primary-hue), var(--primary-sat), var(--primary-light), 0.05);
  border-radius: var(--radius-md);
  border: 1px solid hsla(var(--primary-hue), var(--primary-sat), var(--primary-light), 0.2);
}

.suggestion-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.suggestion-item {
  padding: var(--spacing-sm) var(--spacing-md);
  margin-bottom: var(--spacing-xs);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);
  color: var(--color-text-main);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.suggestion-item:hover {
  border-color: var(--color-primary);
  background: hsla(var(--primary-hue), var(--primary-sat), var(--primary-light), 0.1);
}

.suggestion-item:last-child {
  margin-bottom: 0;
}

.suggestion-item::before {
  content: '•';
  color: var(--color-primary);
  font-weight: bold;
}
```

#### Merchant Recognition
```css
.merchant-recognition-container {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background: linear-gradient(135deg, 
    hsla(45, 90%, 50%, 0.1) 0%,
    hsla(45, 90%, 50%, 0.05) 100%
  );
  border-left: 3px solid hsl(45, 90%, 50%);
  border-radius: var(--radius-sm);
}

.merchant-name {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-main);
  margin-bottom: var(--spacing-xs);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.merchant-details {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}
```

---

## Implementation Notes for Developers

### JavaScript Integration Points

#### Smart Amount Input
```javascript
// Integration with existing TransactionForm
const smartAmountInput = SmartAmountInput({
  onAmountChange: (amount) => {
    // Trigger category suggestions
    updateCategorySuggestions(amount);
    // Update note suggestions
    updateNoteSuggestions(getSelectedCategory(), amount);
  },
  onSuggestionSelect: (suggestion) => {
    // Auto-fill amount and category
    setAmount(suggestion.amount);
    setCategory(suggestion.category);
    // Focus next field
    categorySelector.focus();
  }
});
```

#### Smart Category Selector
```javascript
const smartCategorySelector = SmartCategorySelector({
  onCategorySelect: (category) => {
    // Update note suggestions based on category
    updateNoteSuggestions(category, getAmount());
    // Record selection for learning
    recordUserSelection('category', category);
  },
  onSmartMatchAccept: (category) => {
    // Track smart match acceptance
    recordSmartMatchAcceptance(category, confidence);
  }
});
```

#### Smart Note Field
```javascript
const smartNoteField = SmartNoteField({
  onNoteChange: (note) => {
    // Auto-complete suggestions
    showNoteSuggestions(note);
  },
  onSuggestionSelect: (suggestion) => {
    setNote(suggestion);
    hideSuggestions();
  },
  onMerchantRecognized: (merchant) => {
    // Highlight recognized merchant
    showMerchantInfo(merchant);
  }
});
```

### CSS Integration Requirements

#### Import Order
```css
/* 1. Existing tokens */
@import './tokens.css';

/* 2. Smart suggestions styles */
@import './components/smart-suggestions.css';

/* 3. Existing component styles */
@import './components/ui.css';
@import './components/forms-dialogs.css';
```

#### Custom Properties for Smart Suggestions
```css
:root {
  /* Smart suggestions specific tokens */
  --smart-suggestion-bg: hsla(var(--primary-hue), var(--primary-sat), var(--primary-light), 0.05);
  --smart-suggestion-border: hsla(var(--primary-hue), var(--primary-sat), var(--primary-light), 0.2);
  --smart-match-gradient-start: hsla(var(--primary-hue), var(--primary-sat), var(--primary-light), 0.1);
  --smart-match-gradient-end: hsla(var(--primary-hue), var(--primary-sat), var(--primary-light), 0.05);
  --confidence-high: hsl(120, 70%, 50%);
  --confidence-medium: hsl(45, 90%, 50%);
  --confidence-low: hsl(0, 70%, 50%);
  --merchant-recognition-bg: hsla(45, 90%, 50%, 0.1);
}
```

### Performance Considerations

#### Lazy Loading Implementation
```javascript
class SmartSuggestionsLoader {
  constructor() {
    this.loaded = false;
    this.suggestionData = null;
  }
  
  async loadSuggestions() {
    if (!this.loaded) {
      this.suggestionData = await import('./analytics/suggestion-data.js');
      this.loaded = true;
    }
    return this.suggestionData;
  }
  
  async getSuggestions(type, context) {
    await this.loadSuggestions();
    return this.suggestionData.getSuggestions(type, context);
  }
}
```

#### Debounced Input Handling
```javascript
const debounceInput = (callback, delay = 300) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(...args), delay);
  };
};

// Usage in amount input
amountInput.addEventListener('input', debounceInput((e) => {
  updateSuggestions(e.target.value);
}));
```

### Accessibility Implementation

#### ARIA Labels Structure
```javascript
const createAccessibleSuggestionChip = (suggestion) => {
  const chip = document.createElement('button');
  chip.setAttribute('role', 'option');
  chip.setAttribute('aria-selected', 'false');
  chip.setAttribute('aria-label', `${suggestion.amount} dollars, ${suggestion.category}`);
  chip.setAttribute('aria-describedby', `suggestion-${suggestion.id}-desc`);
  
  const desc = document.createElement('div');
  desc.id = `suggestion-${suggestion.id}-desc`;
  desc.textContent = `Confidence: ${suggestion.confidence}%, based on ${suggestion.reason}`;
  desc.className = 'sr-only'; // Screen reader only
  
  return { chip, desc };
};
```

#### Keyboard Navigation
```javascript
const setupKeyboardNavigation = (container) => {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  container.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      focusNext(focusableElements);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      focusPrevious(focusableElements);
    }
  });
};
```

---

## Testing Checklist for Developers

### Visual Testing
- [ ] All suggestion chips render correctly on mobile (320px+)
- [ ] Smart match highlighting is prominent but not distracting
- [ ] Confidence indicators use appropriate colors
- [ ] Category grid adapts properly to screen size
- [ ] Focus states are visible and accessible

### Functional Testing
- [ ] Suggestions appear within 100ms of field focus
- [ ] Selecting suggestion auto-fills related fields
- [ ] User can easily override all suggestions
- [ ] Keyboard navigation works through all suggestions
- [ ] Touch interactions work on mobile devices

### Performance Testing
- [ ] Memory usage remains < 10MB additional
- [ ] Suggestions don't block UI thread
- [ ] Lazy loading works for suggestion data
- [ ] Debounced input prevents excessive calls
- [ ] Cache invalidation works properly

### Accessibility Testing
- [ ] Screen reader announces all suggestions
- [ ] All interactive elements have proper ARIA labels
- [ ] Keyboard navigation covers all suggestions
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus management works correctly

---

These detailed redlines provide everything needed to implement the Smart Suggestions UI while maintaining the existing design system and accessibility standards. The components are designed to integrate seamlessly with the current TransactionForm architecture.
