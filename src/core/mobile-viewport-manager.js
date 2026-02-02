/**
 * Mobile Viewport Manager
 * Handles virtual keyboard detection and viewport management
 * Based on UX design specifications for mobile keyboard avoidance
 */

export class MobileViewportManager {
  constructor() {
    this.visualViewport = window.visualViewport;
    this.originalHeight = window.innerHeight;
    this.originalWidth = window.innerWidth;
    this.keyboardState = {
      visible: false,
      height: 0,
      offsetTop: 0,
    };
    this.activeInput = null;
    this.eventListeners = new Map();

    this.initialize();
  }

  initialize() {
    // Temporarily disable viewport management to prevent layout jumps
    // TODO: Re-enable after fixing layout issues
    console.warn('Mobile viewport manager temporarily disabled to prevent layout jumps');
    return;
  }

  setupViewportListeners() {
    const viewportResizeHandler = this.handleViewportResize.bind(this);
    const viewportScrollHandler = this.handleViewportScroll.bind(this);

    this.visualViewport.addEventListener('resize', viewportResizeHandler);
    this.visualViewport.addEventListener('scroll', viewportScrollHandler);

    this.eventListeners.set('viewport-resize', {
      target: this.visualViewport,
      event: 'resize',
      handler: viewportResizeHandler,
    });

    this.eventListeners.set('viewport-scroll', {
      target: this.visualViewport,
      event: 'scroll',
      handler: viewportScrollHandler,
    });
  }

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
  }

  setupCSSCustomProperties() {
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

    const keyboardHeight = this.originalHeight - newHeight;
    const isKeyboardVisible = keyboardHeight > 150;

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

    // Trigger custom event
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

    // Auto-scroll focused element
    if (isKeyboardVisible && this.activeInput) {
      this.scrollFocusedElementIntoView();
    }
  };

  handleViewportScroll = () => {
    const offsetTop = this.visualViewport.offsetTop;
    document.documentElement.style.setProperty(
      '--visual-viewport-offset-top',
      `${offsetTop}px`
    );
  };

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

  scrollFocusedElementIntoView() {
    if (!this.activeInput) return;

    // Read all layout values before requesting animation frame to prevent layout thrashing
    const elementRect = this.activeInput.getBoundingClientRect();
    const viewportHeight = this.visualViewport.height;
    const keyboardHeight = this.keyboardState.height;
    const availableHeight = viewportHeight - keyboardHeight;
    const currentScrollY = window.scrollY;

    // Position element in upper portion of available space
    const targetTop = Math.min(elementRect.top, availableHeight * 0.3);
    const targetScrollY = currentScrollY + elementRect.top - targetTop;

    requestAnimationFrame(() => {
      window.scrollTo({
        top: targetScrollY,
        behavior: 'smooth',
      });
    });
  }

  isInputElement(element) {
    const inputTypes = ['input', 'textarea', 'select'];
    return (
      inputTypes.includes(element.tagName.toLowerCase()) ||
      element.contentEditable === 'true'
    );
  }

  initializeFallback() {
    // Fallback for browsers without Visual Viewport API
    const resizeHandler = () => {
      const currentHeight = window.innerHeight;
      const keyboardHeight = this.originalHeight - currentHeight;
      const isKeyboardVisible = keyboardHeight > 150;

      this.keyboardState = {
        visible: isKeyboardVisible,
        height: keyboardHeight,
        offsetTop: 0,
      };

      document.documentElement.style.setProperty(
        '--visual-viewport-height',
        `${currentHeight}px`
      );
      document.documentElement.style.setProperty(
        '--keyboard-height',
        `${keyboardHeight}px`
      );
      document.body.classList.toggle('keyboard-visible', isKeyboardVisible);
    };

    window.addEventListener('resize', resizeHandler);
    this.eventListeners.set('window-resize', {
      target: window,
      event: 'resize',
      handler: resizeHandler,
    });
  }

  destroy() {
    // Clean up all event listeners
    this.eventListeners.forEach(({ target, event, handler }) => {
      target.removeEventListener(event, handler);
    });
    this.eventListeners.clear();
  }
}

// Singleton instance
export const mobileViewportManager = new MobileViewportManager();
