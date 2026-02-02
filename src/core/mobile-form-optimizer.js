/**
 * Mobile Form Optimizer
 * Optimizes input types and behaviors for mobile keyboards
 * Based on UX design specifications for mobile keyboard handling
 */

export class MobileFormOptimizer {
  constructor() {
    this.setupInputOptimization();
    this.setupKeyboardNavigation();
  }

  setupInputOptimization() {
    document.addEventListener('focusin', this.optimizeInput.bind(this));
  }

  optimizeInput(e) {
    const input = e.target;

    // Optimize based on input class or ID
    if (
      input.classList.contains('smart-amount-input') ||
      input.id.includes('amount')
    ) {
      this.optimizeAmountInput(input);
    } else if (
      input.classList.contains('smart-note-input') ||
      input.id.includes('note')
    ) {
      this.optimizeNoteInput(input);
    } else if (
      input.classList.contains('category-input') ||
      input.id.includes('category')
    ) {
      this.optimizeCategoryInput(input);
    }
  }

  optimizeAmountInput(input) {
    // Configure for numeric input
    input.inputMode = 'numeric';
    input.pattern = '[0-9]*';
    input.enterKeyHint = 'next';

    // Add decimal support for currency
    if (!input.step) {
      input.step = '0.01';
    }

    // Prevent zoom on iOS
    input.style.fontSize = '16px';
  }

  optimizeNoteInput(input) {
    // Configure for text input with auto-capitalize
    input.inputMode = 'text';
    input.autocomplete = 'off';
    input.autocorrect = 'on';
    input.autocapitalize = 'sentences';
    input.enterKeyHint = 'done';
    input.spellcheck = true;

    // Prevent zoom on iOS
    input.style.fontSize = '16px';
  }

  optimizeCategoryInput(input) {
    // Configure for category selection
    input.inputMode = 'text';
    input.autocomplete = 'off';
    input.autocorrect = 'off';
    input.autocapitalize = 'off';
    input.enterKeyHint = 'next';
    input.spellcheck = false;

    // Prevent zoom on iOS
    input.style.fontSize = '16px';
  }

  setupKeyboardNavigation() {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  handleKeyDown(e) {
    const input = e.target;

    // Handle Enter key navigation
    if (e.key === 'Enter') {
      e.preventDefault();
      this.navigateToNextField(input);
    }

    // Handle Tab key enhancement
    if (e.key === 'Tab') {
      setTimeout(() => {
        this.scrollFocusedElementIntoView();
      }, 50);
    }
  }

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

  scrollFocusedElementIntoView() {
    const focused = document.activeElement;
    if (focused && this.isInputElement(focused)) {
      requestAnimationFrame(() => {
        focused.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      });
    }
  }

  isInputElement(element) {
    return ['input', 'textarea', 'select'].includes(
      element.tagName.toLowerCase()
    );
  }
}

// Singleton instance
export const mobileFormOptimizer = new MobileFormOptimizer();
