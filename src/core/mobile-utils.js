/**
 * Mobile Utilities - Consolidated mobile handling
 * Combines viewport management, keyboard detection, device detection,
 * and form optimization into a single focused module
 */

export class MobileUtils {
  constructor() {
    this.isInitialized = false;
    this.viewportHeight = window.innerHeight;
    this.visualViewportHeight =
      window.visualViewport?.height || window.innerHeight;
    this.responsiveCallbacks = [];
    this.eventListeners = new Map();

    // Viewport manager state
    this.visualViewport = window.visualViewport;
    this.originalHeight = window.innerHeight;
    this.originalWidth = window.innerWidth;
    this.keyboardState = {
      visible: false,
      height: 0,
      offsetTop: 0,
    };
    this.activeInput = null;

    this.init();
  }

  init() {
    if (this.isInitialized) return;

    this.setupViewportHandling();
    this.setupOrientationHandling();
    this.setupInputListeners();
    this.setupKeyboardNavigation();
    this.updateCSSCustomProperties();
    this.addMobileClasses();

    this.isInitialized = true;
  }

  /**
   * Setup viewport height handling for mobile keyboards
   */
  setupViewportHandling() {
    const updateViewportHeight = () => {
      this.viewportHeight = window.innerHeight;
      this.visualViewportHeight =
        window.visualViewport?.height || window.innerHeight;
      this.handleViewportResize();
      this.updateCSSCustomProperties();
      this.addMobileClasses();
      this.triggerResponsiveCallbacks();
    };

    // Handle visual viewport changes (keyboard appearance/disappearance)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportHeight);
      window.visualViewport.addEventListener(
        'scroll',
        this.handleViewportScroll.bind(this)
      );

      this.eventListeners.set('viewport-resize', {
        target: window.visualViewport,
        event: 'resize',
        handler: updateViewportHeight,
      });

      this.eventListeners.set('viewport-scroll', {
        target: window.visualViewport,
        event: 'scroll',
        handler: this.handleViewportScroll.bind(this),
      });
    }

    // Fallback for browsers without visual viewport support
    window.addEventListener('resize', updateViewportHeight);
    this.eventListeners.set('window-resize', {
      target: window,
      event: 'resize',
      handler: updateViewportHeight,
    });

    // Initial update
    updateViewportHeight();
  }

  /**
   * Setup orientation change handling with debouncing
   */
  setupOrientationHandling() {
    let orientationTimeout;

    const handleOrientationChange = () => {
      clearTimeout(orientationTimeout);
      orientationTimeout = setTimeout(() => {
        this.updateCSSCustomProperties();
        // Dispatch custom event for components to listen to
        window.dispatchEvent(
          new CustomEvent('mobile:orientationchange', {
            detail: {
              orientation: this.getOrientation(),
              viewportHeight: this.viewportHeight,
              visualViewportHeight: this.visualViewportHeight,
            },
          })
        );
      }, 100); // 100ms debounce
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    this.eventListeners.set('orientationchange', {
      target: window,
      event: 'orientationchange',
      handler: handleOrientationChange,
    });
  }

  /**
   * Setup input focus/blur listeners for keyboard detection
   */
  setupInputListeners() {
    const focusInHandler = this.handleInputFocus.bind(this);
    const focusOutHandler = this.handleInputBlur.bind(this);

    document.addEventListener('focusin', focusInHandler);
    document.addEventListener('focusout', focusOutHandler);

    this.eventListeners.set('focusin', {
      target: document,
      event: 'focusin',
      handler: focusInHandler,
    });

    this.eventListeners.set('focusout', {
      target: document,
      event: 'focusout',
      handler: focusOutHandler,
    });

    // Setup input optimization on focus
    document.addEventListener('focusin', this.optimizeInput.bind(this));
  }

  /**
   * Setup keyboard navigation (Enter/Tab handling)
   */
  setupKeyboardNavigation() {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.eventListeners.set('keydown', {
      target: document,
      event: 'keydown',
      handler: this.handleKeyDown.bind(this),
    });
  }

  /**
   * Handle viewport resize (keyboard appearance/disappearance)
   */
  handleViewportResize = () => {
    const newHeight = this.visualViewport?.height || window.innerHeight;
    const newOffsetTop = this.visualViewport?.offsetTop || 0;

    const keyboardHeight = this.originalHeight - newHeight;
    const clampedKeyboardHeight = Math.max(0, keyboardHeight);
    const isKeyboardVisible = clampedKeyboardHeight > 150;

    this.keyboardState = {
      visible: isKeyboardVisible,
      height: clampedKeyboardHeight,
      offsetTop: newOffsetTop,
    };

    // Update viewport heights
    this.viewportHeight = window.innerHeight;
    this.visualViewportHeight = newHeight;
  };

  /**
   * Handle viewport scroll
   */
  handleViewportScroll = () => {
    if (!this.visualViewport) return;
    const offsetTop = this.visualViewport.offsetTop;
    document.documentElement.style.setProperty(
      '--visual-viewport-offset-top',
      `${offsetTop}px`
    );
  };

  /**
   * Handle input focus
   */
  handleInputFocus = e => {
    const target = e.target;
    if (this.isInputElement(target)) {
      this.activeInput = target;
      document.body.classList.add('input-focused');
      document.body.classList.add(`input-${target.type}-focused`);

      // Delay viewport check for keyboard animation
      setTimeout(() => this.handleViewportResize(), 100);
    }
  };

  /**
   * Handle input blur
   */
  handleInputBlur = e => {
    const target = e.target;
    if (this.isInputElement(target)) {
      document.body.classList.remove('input-focused');
      document.body.classList.remove(`input-${target.type}-focused`);

      // Delay for keyboard dismissal animation
      setTimeout(() => {
        if (!this.activeInput || this.activeInput === target) {
          this.activeInput = null;
          this.handleViewportResize();
        }
      }, 300);
    }
  };

  /**
   * Handle keyboard navigation
   */
  handleKeyDown = e => {
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
  };

  /**
   * Optimize input based on type/ID
   */
  optimizeInput(e) {
    const input = e.target;

    // Optimize based on input class or ID
    if (input.id.includes('amount')) {
      this.optimizeAmountInput(input);
    } else if (input.id.includes('note')) {
      this.optimizeNoteInput(input);
    } else if (
      input.classList.contains('category-input') ||
      input.id.includes('category')
    ) {
      this.optimizeCategoryInput(input);
    }
  }

  /**
   * Optimize amount input for numeric entry
   */
  optimizeAmountInput(input) {
    input.inputMode = 'numeric';
    input.pattern = '[0-9]*';
    input.enterKeyHint = 'next';

    if (!input.step) {
      input.step = '0.01';
    }

    input.classList.add('prevent-ios-zoom');
  }

  /**
   * Optimize note input for text entry
   */
  optimizeNoteInput(input) {
    input.inputMode = 'text';
    input.autocomplete = 'off';
    input.autocorrect = 'on';
    input.autocapitalize = 'sentences';
    input.enterKeyHint = 'done';
    input.spellcheck = true;

    input.classList.add('prevent-ios-zoom');
  }

  /**
   * Optimize category input for selection
   */
  optimizeCategoryInput(input) {
    input.inputMode = 'text';
    input.autocomplete = 'off';
    input.autocorrect = 'off';
    input.autocapitalize = 'off';
    input.enterKeyHint = 'next';
    input.spellcheck = false;

    input.classList.add('prevent-ios-zoom');
  }

  /**
   * Navigate to next field in form
   */
  navigateToNextField(currentInput) {
    const form = currentInput.closest('form');
    if (!form) return;

    const focusableElements = form.querySelectorAll(
      'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])'
    );

    const currentIndex = Array.from(focusableElements).indexOf(currentInput);
    const nextIndex = (currentIndex + 1) % focusableElements.length;

    focusableElements[nextIndex].focus();

    setTimeout(() => {
      focusableElements[nextIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 100);
  }

  /**
   * Update CSS custom properties with current viewport values
   */
  updateCSSCustomProperties() {
    const root = document.documentElement;
    const viewportWidth = window.innerWidth;

    root.style.setProperty('--viewport-height', `${this.viewportHeight}px`);
    root.style.setProperty(
      '--visual-viewport-height',
      `${this.visualViewportHeight}px`
    );
    root.style.setProperty('--viewport-width', `${viewportWidth}px`);
    root.style.setProperty(
      '--visual-viewport-width',
      `${this.visualViewport?.width || viewportWidth}px`
    );
    root.style.setProperty('--visual-viewport-offset-top', '0px');
    root.style.setProperty('--keyboard-height', '0px');

    // Update keyboard-related properties
    if (this.keyboardState.visible) {
      root.style.setProperty(
        '--keyboard-height',
        `${this.keyboardState.height}px`
      );
      root.style.setProperty(
        '--visual-viewport-offset-top',
        `${this.keyboardState.offsetTop}px`
      );
    }
  }

  /**
   * Device and capability detection
   */
  isMobile() {
    return window.innerWidth < 768;
  }

  isTablet() {
    return window.innerWidth >= 768 && window.innerWidth < 1024;
  }

  isDesktop() {
    return window.innerWidth >= 1024;
  }

  getOrientation() {
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  }

  supportsTouch() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  supportsHaptic() {
    return false;
  }

  supportsPWA() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Haptic feedback utility
   */
  hapticFeedback(_pattern = [10]) {
    return;
  }

  /**
   * Prevent zoom on input focus (iOS)
   */
  preventInputZoom(inputElement) {
    if (!inputElement) return;

    const currentFontSize = window.getComputedStyle(inputElement).fontSize;
    const fontSize = parseFloat(currentFontSize);

    if (fontSize < 16) {
      inputElement.style.fontSize = '16px';
    }
  }

  /**
   * Scroll element into view above keyboard
   */
  scrollIntoViewAboveKeyboard(element, offset = 20) {
    if (!element || !this.isMobile()) return;

    const elementRect = element.getBoundingClientRect();
    const keyboardHeight = this.viewportHeight - this.visualViewportHeight;

    if (keyboardHeight > 0) {
      const targetY = elementRect.top - keyboardHeight - offset;

      if (targetY < 0) {
        window.scrollBy({
          top: targetY,
          behavior: 'smooth',
        });
      }
    }
  }

  /**
   * Scroll focused element into view
   */
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

  /**
   * Add mobile-specific CSS classes to body
   */
  addMobileClasses() {
    const body = document.body;

    body.classList.remove(
      'is-mobile',
      'is-tablet',
      'is-desktop',
      'supports-touch',
      'supports-haptic'
    );

    if (this.isMobile()) body.classList.add('is-mobile');
    if (this.isTablet()) body.classList.add('is-tablet');
    if (this.isDesktop()) body.classList.add('is-desktop');
    if (this.supportsTouch()) body.classList.add('supports-touch');
    if (this.supportsHaptic()) body.classList.add('supports-haptic');

    // Update keyboard visibility classes
    body.classList.toggle('keyboard-visible', this.keyboardState.visible);
    body.classList.toggle('keyboard-hidden', !this.keyboardState.visible);

    // Trigger keyboard change event
    window.dispatchEvent(
      new CustomEvent('keyboardchange', {
        detail: {
          visible: this.keyboardState.visible,
          height: this.keyboardState.height,
          offsetTop: this.keyboardState.offsetTop,
          viewportHeight: this.visualViewportHeight,
          viewportWidth: window.innerWidth,
        },
      })
    );
  }

  /**
   * Register a callback for responsive changes
   */
  onResponsiveChange(callback) {
    if (typeof callback === 'function') {
      this.responsiveCallbacks.push(callback);
      callback(this.isMobile());
    }
  }

  /**
   * Trigger all registered responsive callbacks
   */
  triggerResponsiveCallbacks() {
    this.responsiveCallbacks.forEach(cb => cb(this.isMobile()));
  }

  /**
   * Get safe area insets (for devices with notches)
   */
  getSafeAreaInsets() {
    const computedStyle = getComputedStyle(document.documentElement);

    return {
      top: computedStyle.getPropertyValue('--safe-area-inset-top') || '0px',
      right: computedStyle.getPropertyValue('--safe-area-inset-right') || '0px',
      bottom:
        computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0px',
      left: computedStyle.getPropertyValue('--safe-area-inset-left') || '0px',
    };
  }

  /**
   * Check if element is an input element
   */
  isInputElement(element) {
    const inputTypes = ['input', 'textarea', 'select'];
    return (
      inputTypes.includes(element.tagName.toLowerCase()) ||
      element.contentEditable === 'true'
    );
  }

  /**
   * Setup enhanced back button handling for mobile platforms
   */
  setupBackButtonHandling() {
    if (window.BackButton) {
      this._backButtonHandle = window.BackButton.addHandler(() => {
        let currentRoute = null;
        if (window.router?.currentRoute) {
          currentRoute =
            window.router.currentRoute.value?.name ||
            window.router.currentRoute.name;
        }

        if (!currentRoute) {
          return true;
        }

        if (currentRoute === 'dashboard') {
          return false;
        }
        return true;
      });
    }
  }

  /**
   * Cleanup method to remove event listeners
   */
  destroy() {
    // Clean up all event listeners
    this.eventListeners.forEach(({ target, event, handler }) => {
      target.removeEventListener(event, handler);
    });
    this.eventListeners.clear();

    // Remove back button handler
    if (this._backButtonHandle && window.BackButton) {
      if (typeof window.BackButton.removeHandler === 'function') {
        window.BackButton.removeHandler(this._backButtonHandle);
      } else if (typeof this._backButtonHandle === 'function') {
        this._backButtonHandle();
      }
      this._backButtonHandle = null;
    }
  }

  /**
   * Initialize mobile utilities when DOM is ready
   */
  static initialize() {
    if (window.mobileUtils) {
      window.mobileUtils.destroy();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        window.mobileUtils = new MobileUtils();
        window.mobileUtils.setupBackButtonHandling();
      });
    } else {
      window.mobileUtils = new MobileUtils();
      window.mobileUtils.setupBackButtonHandling();
    }
  }
}

// Auto-initialize when module is imported
MobileUtils.initialize();

export default MobileUtils;
