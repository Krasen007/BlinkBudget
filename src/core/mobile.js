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

    // Cache window dimensions to avoid forced reflows
    const viewportWidth = window.innerWidth;

    root.style.setProperty('--viewport-height', `${this.viewportHeight}px`);
    root.style.setProperty(
      '--visual-viewport-height',
      `${this.visualViewportHeight}px`
    );
    root.style.setProperty('--viewport-width', `${viewportWidth}px`);
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
    return false;
  }

  supportsPWA() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Haptic feedback utility
   */
  hapticFeedback(_pattern = [10]) {
    // Haptic feedback disabled
    return;
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
    // Cleanup existing instance if present
    if (window.mobileUtils) {
      window.mobileUtils.destroy();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        window.mobileUtils = new MobileUtils();
        // Setup back button handling after initialization
        window.mobileUtils.setupBackButtonHandling();
      });
    } else {
      window.mobileUtils = new MobileUtils();
      // Setup back button handling after initialization
      window.mobileUtils.setupBackButtonHandling();
    }
  }

  /**
   * Setup enhanced back button handling for mobile platforms
   */
  setupBackButtonHandling() {
    if (window.BackButton) {
      this._backButtonHandle = window.BackButton.addHandler(() => {
        // Get current route from router, handling both Vue Router 3 and 4
        let currentRoute = null;
        if (window.router?.currentRoute) {
          // Handle Vue Router 4 (Ref) vs Router 3 (plain object)
          currentRoute =
            window.router.currentRoute.value?.name ||
            window.router.currentRoute.name;
        }

        // If router is not initialized, don't trigger exit confirmation
        if (!currentRoute) {
          return true;
        }

        // Custom back button logic
        if (currentRoute === 'dashboard') {
          // Show exit confirmation
          return false;
        }
        return true;
      });
    }
  }

  /**
   * Cleanup method to remove back button handler
   */
  destroy() {
    if (this._backButtonHandle && window.BackButton) {
      // Remove back button handler if API supports it
      if (typeof window.BackButton.removeHandler === 'function') {
        window.BackButton.removeHandler(this._backButtonHandle);
      } else if (typeof this._backButtonHandle === 'function') {
        // Some APIs return handler function for removal
        this._backButtonHandle();
      }
      this._backButtonHandle = null;
    }
  }
}

// Auto-initialize when module is imported
MobileUtils.initialize();

export default MobileUtils;
