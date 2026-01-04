/**
 * Mobile utilities for responsive design and touch optimization
 * Handles viewport management, device detection, and mobile-specific features
 */

export class MobileUtils {
  constructor() {
    this.isInitialized = false;
    this.viewportHeight = window.innerHeight;
    this.visualViewportHeight =
      window.visualViewport?.height || window.innerHeight;
    this.responsiveCallbacks = [];
    this.init();
  }

  init() {
    if (this.isInitialized) return;

    this.setupViewportHandling();
    this.setupOrientationHandling();
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
      this.updateCSSCustomProperties();
      this.addMobileClasses();
      this.triggerResponsiveCallbacks();
    };

    // Handle visual viewport changes (keyboard appearance/disappearance)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportHeight);
    }

    // Fallback for browsers without visual viewport support
    window.addEventListener('resize', updateViewportHeight);

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
  }

  /**
   * Update CSS custom properties with current viewport values
   */
  updateCSSCustomProperties() {
    const root = document.documentElement;

    root.style.setProperty('--viewport-height', `${this.viewportHeight}px`);
    root.style.setProperty(
      '--visual-viewport-height',
      `${this.visualViewportHeight}px`
    );
    root.style.setProperty('--viewport-width', `${window.innerWidth}px`);
  }

  /**
   * Device and capability detection
   */
  isMobile() {
    // Import at top of file would cause circular dependency, so we inline the constant
    return window.innerWidth < 768; // BREAKPOINTS.MOBILE
  }

  isTablet() {
    return window.innerWidth >= 768 && window.innerWidth < 1024; // BREAKPOINTS.MOBILE to BREAKPOINTS.TABLET
  }

  isDesktop() {
    return window.innerWidth >= 1024; // BREAKPOINTS.DESKTOP
  }

  getOrientation() {
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  }

  supportsTouch() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  supportsHaptic() {
    return 'vibrate' in navigator;
  }

  supportsPWA() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Haptic feedback utility
   */
  hapticFeedback(pattern = [10]) {
    if (this.supportsHaptic()) {
      navigator.vibrate(pattern);
    }
  }

  /**
   * Prevent zoom on input focus (iOS)
   */
  preventInputZoom(inputElement) {
    if (!inputElement) return;

    const currentFontSize = window.getComputedStyle(inputElement).fontSize;
    const fontSize = parseFloat(currentFontSize);

    // iOS requires 16px+ to prevent zoom
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
   * Add mobile-specific CSS classes to body
   */
  addMobileClasses() {
    const body = document.body;

    // Remove existing mobile classes
    body.classList.remove(
      'is-mobile',
      'is-tablet',
      'is-desktop',
      'supports-touch',
      'supports-haptic'
    );

    // Add current state classes
    if (this.isMobile()) body.classList.add('is-mobile');
    if (this.isTablet()) body.classList.add('is-tablet');
    if (this.isDesktop()) body.classList.add('is-desktop');
    if (this.supportsTouch()) body.classList.add('supports-touch');
    if (this.supportsHaptic()) body.classList.add('supports-haptic');
  }

  /**
   * Register a callback for responsive changes
   */
  onResponsiveChange(callback) {
    if (typeof callback === 'function') {
      this.responsiveCallbacks.push(callback);
      // Run once immediately
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
   * Initialize mobile utilities when DOM is ready
   */
  static initialize() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        window.mobileUtils = new MobileUtils();
      });
    } else {
      window.mobileUtils = new MobileUtils();
    }
  }
}

// Auto-initialize when module is imported
MobileUtils.initialize();

export default MobileUtils;
