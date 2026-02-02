# Keyboard Avoidance Design - Mobile Experience

**Date:** February 2, 2026  
**Designer:** UX/UI Designer  
**Phase:** 2 Week 5 - Mobile Experience Design  
**Focus:** Virtual Keyboard Avoidance Behaviors & Input Optimization

---

## Keyboard Avoidance Strategy Overview

### Virtual Keyboard Challenges

#### Common Mobile Keyboard Issues

- **Input Obstruction:** Keyboard covers 40-60% of screen real estate
- **Context Loss:** Users lose sight of form context when keyboard appears
- **Navigation Difficulty:** Hard to navigate between fields with keyboard visible
- **Layout Disruption:** Fixed positioning elements interfere with keyboard
- **Performance Impact:** Layout thrashing during keyboard transitions

#### User Behavior Patterns

- **Single-Handed Use:** 85% of users operate phones with one hand
- **Thumb Typing:** Primary input method for most users
- **Quick Entry:** Users expect fast, uninterrupted input flow
- **Visual Feedback:** Need to see what they're typing and context

---

## Viewport Management System

### Visual Viewport API Integration

#### Viewport Detection & Management

```javascript
class MobileViewportManager {
  constructor() {
    this.visualViewport = window.visualViewport;
    this.originalHeight = window.innerHeight;
    this.originalWidth = window.innerWidth;
    this.keyboardState = {
      visible: false,
      height: 0,
      offsetTop: 0,
    };

    this.initializeViewportListeners();
    this.setupCSSCustomProperties();
  }

  initializeViewportListeners() {
    if (!this.visualViewport) {
      console.warn('Visual Viewport API not supported');
      return;
    }

    // Listen for viewport changes (keyboard show/hide, orientation)
    this.visualViewport.addEventListener('resize', this.handleViewportResize);
    this.visualViewport.addEventListener('scroll', this.handleViewportScroll);

    // Listen for window resize (orientation changes)
    window.addEventListener('resize', this.handleWindowResize);

    // Listen for input focus/blur events
    document.addEventListener('focusin', this.handleInputFocus);
    document.addEventListener('focusout', this.handleInputBlur);
  }

  setupCSSCustomProperties() {
    // Initialize CSS custom properties for viewport dimensions
    document.documentElement.style.setProperty(
      '--visual-viewport-height',
      `${this.originalHeight}px`
    );
    document.documentElement.style.setProperty(
      '--visual-viewport-width',
      `${this.originalWidth}px`
    );
    document.documentElement.style.setProperty(
      '--visual-viewport-offset-top',
      '0px'
    );
    document.documentElement.style.setProperty('--keyboard-height', '0px');
  }

  handleViewportResize = () => {
    const newHeight = this.visualViewport.height;
    const newWidth = this.visualViewport.width;
    const newOffsetTop = this.visualViewport.offsetTop;

    // Calculate keyboard height
    const keyboardHeight = this.originalHeight - newHeight;
    const isKeyboardVisible = keyboardHeight > 150; // Threshold for keyboard detection

    // Update keyboard state
    this.keyboardState = {
      visible: isKeyboardVisible,
      height: keyboardHeight,
      offsetTop: newOffsetTop,
    };

    // Update CSS custom properties
    document.documentElement.style.setProperty(
      '--visual-viewport-height',
      `${newHeight}px`
    );
    document.documentElement.style.setProperty(
      '--visual-viewport-width',
      `${newWidth}px`
    );
    document.documentElement.style.setProperty(
      '--visual-viewport-offset-top',
      `${newOffsetTop}px`
    );
    document.documentElement.style.setProperty(
      '--keyboard-height',
      `${keyboardHeight}px`
    );

    // Update body classes
    document.body.classList.toggle('keyboard-visible', isKeyboardVisible);
    document.body.classList.toggle('keyboard-hidden', !isKeyboardVisible);

    // Trigger custom event for components
    window.dispatchEvent(
      new CustomEvent('keyboardchange', {
        detail: {
          visible: isKeyboardVisible,
          height: keyboardHeight,
          offsetTop: newOffsetTop,
          viewportHeight: newHeight,
          viewportWidth: newWidth,
        },
      })
    );

    // Auto-scroll focused element into view
    if (isKeyboardVisible) {
      this.scrollFocusedElementIntoView();
    }
  };

  handleViewportScroll = () => {
    // Update offset top property
    const offsetTop = this.visualViewport.offsetTop;
    document.documentElement.style.setProperty(
      '--visual-viewport-offset-top',
      `${offsetTop}px`
    );
  };

  handleWindowResize = () => {
    // Update original dimensions for orientation changes
    this.originalHeight = window.innerHeight;
    this.originalWidth = window.innerWidth;

    // Recalculate keyboard state
    this.handleViewportResize();
  };

  handleInputFocus = e => {
    const target = e.target;
    if (this.isInput(target)) {
      // Add focused class to body
      document.body.classList.add('input-focused');
      document.body.classList.add(`input-${target.type}-focused`);

      // Store active input reference
      this.activeInput = target;

      // Immediate viewport check
      setTimeout(() => this.handleViewportResize(), 100);
    }
  };

  handleInputBlur = e => {
    const target = e.target;
    if (this.isInput(target)) {
      // Remove focused classes
      document.body.classList.remove('input-focused');
      document.body.classList.remove(`input-${target.type}-focused`);

      // Clear active input reference
      this.activeInput = null;

      // Delayed viewport check for keyboard dismissal
      setTimeout(() => this.handleViewportResize(), 300);
    }
  };

  isInput(element) {
    const inputTypes = ['input', 'textarea', 'select'];
    return (
      inputTypes.includes(element.tagName.toLowerCase()) ||
      element.contentEditable === 'true'
    );
  }

  scrollFocusedElementIntoView() {
    if (!this.activeInput) return;

    // Calculate optimal scroll position
    const elementRect = this.activeInput.getBoundingClientRect();
    const viewportHeight = this.visualViewport.height;
    const keyboardHeight = this.keyboardState.height;
    const availableHeight = viewportHeight - keyboardHeight;

    // Position element in upper portion of available space
    const targetTop = Math.min(elementRect.top, availableHeight * 0.3);

    // Smooth scroll to position
    window.scrollTo({
      top: window.scrollY + elementRect.top - targetTop,
      behavior: 'smooth',
    });
  }
}
```

### CSS Viewport Adaptation System

#### Base Keyboard-Aware Styles

```css
/* Keyboard visibility states */
body {
  /* Default state - no keyboard */
  --keyboard-height: 0px;
  --visual-viewport-height: 100vh;
  --visual-viewport-offset-top: 0px;
  transition: height 0.3s ease;
}

body.keyboard-visible {
  /* Keyboard is visible */
  height: var(--visual-viewport-height);
  overflow: hidden;
}

body.keyboard-hidden {
  /* Keyboard is hidden */
  height: 100vh;
  overflow: auto;
}

/* Input-specific keyboard behaviors */
body.input-focused {
  /* General input focused state */
}

body.input-text-focused {
  /* Text input specific behaviors */
}

body.input-number-focused {
  /* Number input specific behaviors */
}

body.input-search-focused {
  /* Search input specific behaviors */
}
```

#### Layout Adaptation Classes

```css
/* Keyboard-aware containers */
.keyboard-aware-container {
  /* Container that adapts to keyboard */
  transition: all 0.3s ease;
  min-height: var(--visual-viewport-height);
}

body.keyboard-visible .keyboard-aware-container {
  /* Adjust container when keyboard visible */
  padding-bottom: var(--keyboard-height);
  max-height: var(--visual-viewport-height);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* Sticky elements with keyboard awareness */
.keyboard-aware-sticky {
  position: sticky;
  transition: all 0.3s ease;
}

body.keyboard-visible .keyboard-aware-sticky {
  /* Adjust sticky positioning when keyboard visible */
  top: var(--visual-viewport-offset-top);
  z-index: 10;
}

/* Full-screen overlays with keyboard awareness */
.keyboard-aware-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  transition: all 0.3s ease;
}

body.keyboard-visible .keyboard-aware-overlay {
  /* Adjust overlay for keyboard */
  height: var(--visual-viewport-height);
  bottom: var(--keyboard-height);
}
```

---

## Form Input Keyboard Behaviors

### Transaction Form Keyboard Optimization

#### Amount Input Keyboard Handling

```css
.smart-amount-input {
  /* Base amount input styling */
  height: 64px;
  font-size: 20px;
  font-weight: 600;
  text-align: center;
  padding: 0 16px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  color: var(--color-text-main);
  transition: all 0.3s ease;
}

/* Keyboard-aware amount input */
body.keyboard-visible .smart-amount-input {
  /* Make amount input prominent when keyboard visible */
  position: sticky;
  top: var(--visual-viewport-offset-top);
  z-index: 20;
  background: var(--color-surface);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  border-color: var(--color-primary);
  margin: 0 8px 16px 8px;
  border-radius: var(--radius-lg);
}

body.keyboard-visible .smart-amount-input:focus {
  /* Enhanced focus state with keyboard */
  box-shadow:
    0 0 0 3px
      hsla(var(--primary-hue), var(--primary-sat), var(--primary-light), 0.15),
    0 4px 20px rgba(0, 0, 0, 0.3);
}

/* Amount input container */
.smart-amount-container {
  transition: all 0.3s ease;
}

body.keyboard-visible .smart-amount-container {
  /* Container adjustments for keyboard */
  background: var(--color-surface);
  padding: 16px 8px;
  border-radius: var(--radius-lg);
  margin-bottom: 8px;
}
```

#### Category Selection Keyboard Adaptation

```css
.smart-category-selector {
  /* Base category selector */
  transition: all 0.3s ease;
}

body.keyboard-visible .smart-category-selector {
  /* Optimize category selector for keyboard */
  max-height: calc(var(--visual-viewport-height) * 0.4);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* Smart match container */
.smart-match-container {
  transition: all 0.3s ease;
}

body.keyboard-visible .smart-match-container {
  /* Keep smart match visible with keyboard */
  position: sticky;
  top: calc(var(--visual-viewport-offset-top) + 80px);
  z-index: 15;
  background: var(--color-surface);
  margin: 0 8px 8px 8px;
  border-radius: var(--radius-lg);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

/* Category grid with keyboard */
.category-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  transition: all 0.3s ease;
}

body.keyboard-visible .category-grid {
  /* Optimize grid for keyboard visibility */
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 8px;
}

/* Category cards with keyboard */
.category-card {
  min-height: 80px;
  transition: all 0.3s ease;
}

body.keyboard-visible .category-card {
  /* Smaller cards for keyboard space */
  min-height: 60px;
  padding: 8px;
}
```

#### Note Field Keyboard Optimization

```css
.smart-note-input {
  /* Base note input */
  min-height: 48px;
  max-height: 120px;
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-main);
  font-size: 16px;
  line-height: 1.4;
  resize: none;
  transition: all 0.3s ease;
}

body.keyboard-visible .smart-note-input {
  /* Expand note field for typing */
  min-height: 60px;
  max-height: 80px;
  font-size: 16px; /* Prevent zoom */
}

/* Note suggestions with keyboard */
.note-suggestions-container {
  transition: all 0.3s ease;
}

body.keyboard-visible .note-suggestions-container {
  /* Compact suggestions with keyboard */
  max-height: 120px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  margin-top: 4px;
}

/* Suggestion items with keyboard */
.suggestion-item {
  min-height: 44px;
  padding: 8px 12px;
  transition: all 0.3s ease;
}

body.keyboard-visible .suggestion-item {
  /* Compact suggestion items */
  min-height: 36px;
  padding: 6px 8px;
  font-size: 14px;
}
```

### Form Layout Keyboard Behaviors

#### Transaction Form Structure

```css
.transaction-form {
  /* Base form layout */
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  transition: all 0.3s ease;
}

body.keyboard-visible .transaction-form {
  /* Keyboard-aware form layout */
  gap: 12px;
  padding: 8px;
  min-height: var(--visual-viewport-height);
  max-height: var(--visual-viewport-height);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* Form sections */
.form-section {
  transition: all 0.3s ease;
}

body.keyboard-visible .form-section {
  /* Compact sections with keyboard */
  margin-bottom: 8px;
}

/* Form actions */
.form-actions {
  transition: all 0.3s ease;
}

body.keyboard-visible .form-actions {
  /* Keep actions accessible with keyboard */
  position: sticky;
  bottom: calc(var(--keyboard-height) + 8px);
  background: var(--color-surface);
  padding: 16px;
  border-top: 1px solid var(--color-border);
  z-index: 25;
}
```

---

## Smart Suggestions Keyboard Integration

### Amount Suggestions Keyboard Behavior

#### Suggestion Display Adaptation

```css
.smart-suggestions-container {
  /* Base suggestions container */
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  transition: all 0.3s ease;
}

body.keyboard-visible .smart-suggestions-container {
  /* Compact suggestions with keyboard */
  gap: 4px;
  padding: 8px;
  max-height: 120px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* Amount suggestion chips */
.suggestion-chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scroll-snap-type: x mandatory;
  padding: 4px 0;
  transition: all 0.3s ease;
}

body.keyboard-visible .suggestion-chips {
  /* Horizontal scroll with keyboard */
  gap: 4px;
  max-height: 60px;
}

.suggestion-chip {
  flex-shrink: 0;
  scroll-snap-align: start;
  min-width: 70px;
  min-height: 44px;
  transition: all 0.3s ease;
}

body.keyboard-visible .suggestion-chip {
  /* Smaller chips with keyboard */
  min-width: 60px;
  min-height: 36px;
  padding: 6px 10px;
  font-size: 12px;
}
```

#### Confidence Indicator Keyboard Adaptation

```css
.confidence-indicator {
  /* Base confidence indicator */
  padding: 8px 12px;
  margin: 8px 0;
  border-radius: var(--radius-sm);
  transition: all 0.3s ease;
}

body.keyboard-visible .confidence-indicator {
  /* Compact indicator with keyboard */
  padding: 4px 8px;
  margin: 4px 0;
  font-size: 12px;
}
```

### Category Suggestions Keyboard Behavior

#### Smart Match Keyboard Positioning

```css
.smart-match-container {
  /* Base smart match */
  padding: 16px;
  border-radius: var(--radius-lg);
  background: linear-gradient(
    135deg,
    hsla(var(--primary-hue), var(--primary-sat), var(--primary-light), 0.1) 0%,
    hsla(var(--primary-hue), var(--primary-sat), var(--primary-light), 0.05)
      100%
  );
  border: 2px solid var(--color-primary);
  transition: all 0.3s ease;
}

body.keyboard-visible .smart-match-container {
  /* Sticky positioning with keyboard */
  position: sticky;
  top: calc(var(--visual-viewport-offset-top) + 100px);
  z-index: 15;
  padding: 12px;
  margin: 0 8px 8px 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}
```

---

## Navigation & Layout Keyboard Behaviors

#### Header Navigation Keyboard Adaptation

```css
.mobile-header {
  /* Base header */
  position: sticky;
  top: 0;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: 16px;
  z-index: 30;
  transition: all 0.3s ease;
}

body.keyboard-visible .mobile-header {
  /* Adjust header for keyboard */
  top: var(--visual-viewport-offset-top);
  padding: 12px 16px;
  min-height: 60px;
}

/* Header actions */
.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  transition: all 0.3s ease;
}

body.keyboard-visible .header-actions {
  /* Compact actions with keyboard */
  gap: 4px;
}
```

#### Bottom Navigation Keyboard Behavior

```css
.mobile-nav {
  /* Base bottom navigation */
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  padding: 8px 16px;
  padding-bottom: calc(8px + var(--safe-area-inset-bottom));
  z-index: 40;
  transition: all 0.3s ease;
}

body.keyboard-visible .mobile-nav {
  /* Hide or adjust navigation with keyboard */
  transform: translateY(100%);
  opacity: 0;
  pointer-events: none;
}

/* Alternative: show above keyboard */
body.keyboard-visible.mobile-nav-above-keyboard .mobile-nav {
  transform: translateY(calc(-1 * var(--keyboard-height)));
  opacity: 1;
  pointer-events: auto;
}
```

---

## Advanced Keyboard Features

### Intelligent Input Type Optimization

#### Input Type Selection Strategy

```javascript
class InputOptimizer {
  constructor() {
    this.setupInputOptimization();
  }

  setupInputOptimization() {
    // Optimize input types for mobile keyboards
    document.addEventListener('focusin', this.optimizeInputType);
  }

  optimizeInputType = e => {
    const input = e.target;

    // Amount inputs - use numeric keypad
    if (
      input.classList.contains('amount-input') ||
      input.id.includes('amount')
    ) {
      this.setupAmountInput(input);
    }

    // Category inputs - use text with suggestions
    if (
      input.classList.contains('category-input') ||
      input.id.includes('category')
    ) {
      this.setupCategoryInput(input);
    }

    // Note inputs - use text with auto-capitalize
    if (input.classList.contains('note-input') || input.id.includes('note')) {
      this.setupNoteInput(input);
    }
  };

  setupAmountInput(input) {
    // Configure for numeric input
    input.inputMode = 'numeric';
    input.pattern = '[0-9]*';
    input.enterKeyHint = 'next';

    // Add decimal support for currency
    if (!input.step) {
      input.step = '0.01';
    }
  }

  setupCategoryInput(input) {
    // Configure for category selection
    input.inputMode = 'text';
    input.autocomplete = 'off';
    input.autocorrect = 'off';
    input.autocapitalize = 'off';
    input.enterKeyHint = 'next';
    input.spellcheck = false;
  }

  setupNoteInput(input) {
    // Configure for note entry
    input.inputMode = 'text';
    input.autocomplete = 'off';
    input.autocorrect = 'on';
    input.autocapitalize = 'sentences';
    input.enterKeyHint = 'done';
    input.spellcheck = true;
  }
}
```

### Keyboard Navigation Enhancement

#### Smart Field Navigation

```javascript
class KeyboardNavigation {
  constructor() {
    this.formFields = [];
    this.currentIndex = -1;
    this.setupNavigation();
  }

  setupNavigation() {
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('focusin', this.updateCurrentIndex);
  }

  handleKeyDown = e => {
    const input = e.target;

    // Handle Enter key navigation
    if (e.key === 'Enter') {
      e.preventDefault();
      this.navigateToNextField(input);
    }

    // Handle Tab key enhancement
    if (e.key === 'Tab') {
      this.enhanceTabNavigation(e);
    }
  };

  navigateToNextField(currentInput) {
    const form = currentInput.closest('form');
    if (!form) return;

    const focusableElements = form.querySelectorAll(
      'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])'
    );

    const currentIndex = Array.from(focusableElements).indexOf(currentInput);
    const nextIndex = (currentIndex + 1) % focusableElements.length;

    // Focus next element
    focusableElements[nextIndex].focus();

    // Scroll into view if needed
    setTimeout(() => {
      focusableElements[nextIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 100);
  }

  enhanceTabNavigation(e) {
    // Add smooth scrolling to tab navigation
    setTimeout(() => {
      const focused = document.activeElement;
      if (focused && this.isInput(focused)) {
        focused.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }, 50);
  }

  updateCurrentIndex = e => {
    const input = e.target;
    if (this.isInput(input)) {
      const form = input.closest('form');
      if (form) {
        const focusableElements = form.querySelectorAll(
          'input:not([disabled]), textarea:not([disabled]), select:not([disabled])'
        );
        this.currentIndex = Array.from(focusableElements).indexOf(input);
      }
    }
  };

  isInput(element) {
    return ['input', 'textarea', 'select'].includes(
      element.tagName.toLowerCase()
    );
  }
}
```

---

## Performance Optimization

### Efficient Keyboard Event Handling

#### Debounced Viewport Updates

```javascript
class PerformanceOptimizer {
  constructor() {
    this.debounceTimers = new Map();
    this.setupPerformanceOptimizations();
  }

  setupPerformanceOptimizations() {
    // Debounce viewport updates
    window.addEventListener('keyboardchange', this.debounceViewportUpdate);

    // Throttle scroll events
    window.addEventListener('scroll', this.throttleScroll);

    // Optimize layout recalculations
    this.optimizeLayoutRecalculations();
  }

  debounceViewportUpdate = e => {
    const key = 'viewport-update';
    clearTimeout(this.debounceTimers.get(key));

    this.debounceTimers.set(
      key,
      setTimeout(() => {
        this.handleViewportChange(e.detail);
        this.debounceTimers.delete(key);
      }, 16)
    ); // ~60fps
  };

  throttleScroll = e => {
    const key = 'scroll-update';
    if (!this.debounceTimers.get(key)) {
      this.debounceTimers.set(
        key,
        setTimeout(() => {
          this.handleScrollUpdate();
          this.debounceTimers.delete(key);
        }, 16)
      );
    }
  };

  optimizeLayoutRecalculations() {
    // Use requestAnimationFrame for layout changes
    const originalOffsetHeight = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'offsetHeight'
    );

    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      get() {
        // Force layout only when necessary
        return originalOffsetHeight.get.call(this);
      },
    });
  }

  handleViewportChange(detail) {
    // Efficient viewport change handling
    requestAnimationFrame(() => {
      this.updateLayoutForViewport(detail);
    });
  }

  handleScrollUpdate() {
    // Efficient scroll handling
    requestAnimationFrame(() => {
      this.updateScrollPosition();
    });
  }
}
```

### Memory Management

#### Cleanup and Resource Management

```javascript
class KeyboardManager {
  constructor() {
    this.eventListeners = new Map();
    this.observers = new Map();
    this.timers = new Set();
    this.initialize();
  }

  initialize() {
    this.setupEventListeners();
    this.setupObservers();
  }

  setupEventListeners() {
    // Track all event listeners for cleanup
    const events = [
      { target: window, event: 'resize', handler: this.handleResize },
      { target: document, event: 'focusin', handler: this.handleFocusIn },
      { target: document, event: 'focusout', handler: this.handleFocusOut },
      {
        target: window.visualViewport,
        event: 'resize',
        handler: this.handleViewportResize,
      },
    ];

    events.forEach(({ target, event, handler }) => {
      target.addEventListener(event, handler);
      this.eventListeners.set(`${event}-${target.constructor.name}`, {
        target,
        event,
        handler,
      });
    });
  }

  setupObservers() {
    // Set up intersection observers for performance
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    };

    const intersectionObserver = new IntersectionObserver(
      this.handleIntersection,
      observerOptions
    );

    this.observers.set('intersection', intersectionObserver);
  }

  cleanup() {
    // Clean up event listeners
    this.eventListeners.forEach(({ target, event, handler }) => {
      target.removeEventListener(event, handler);
    });
    this.eventListeners.clear();

    // Clean up observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();

    // Clean up timers
    this.timers.forEach(timerId => clearTimeout(timerId));
    this.timers.clear();
  }

  addTimer(timerId) {
    this.timers.add(timerId);
  }

  removeTimer(timerId) {
    this.timers.delete(timerId);
  }
}
```

---

## Testing & Validation

### Keyboard Behavior Testing

#### Viewport Testing Checklist

- [ ] Keyboard height detection works accurately
- [ ] Visual viewport updates correctly
- [ ] CSS custom properties update in real-time
- [ ] Body classes toggle appropriately
- [ ] Custom events fire correctly

#### Form Testing Checklist

- [ ] Input fields remain visible with keyboard
- [ ] Form layout adapts smoothly
- [ ] Smart suggestions position correctly
- [ ] Category selection works with keyboard
- [ ] Note field expands appropriately

#### Navigation Testing Checklist

- [ ] Header positioning adjusts correctly
- [ ] Bottom navigation behaves appropriately
- [ ] Scroll behavior works smoothly
- [ ] Focus management works correctly
- [ ] Tab navigation is enhanced

#### Performance Testing Checklist

- [ ] Layout thrashing is minimized
- [ ] Event handling is efficient
- [ ] Memory usage remains stable
- [ ] Animation performance is smooth
- [ ] Response time is under 100ms

---

This comprehensive keyboard avoidance design ensures BlinkBudget provides an exceptional mobile typing experience with intelligent viewport management, smooth transitions, and optimized form interactions that work seamlessly with virtual keyboards.
