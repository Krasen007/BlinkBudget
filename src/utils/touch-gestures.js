/**
 * Touch Gestures Utility
 *
 * Provides swipe gesture support for mobile navigation.
 * Optimized for one-handed operation and large tap targets.
 */

import { COLORS } from './constants.js';

export class TouchGestures {
  /**
   * Setup swipe gestures for month navigation
   */
  static setupSwipeNavigation(element, onSwipeLeft, onSwipeRight) {
    let startX = 0;
    let startY = 0;
    let isDragging = false;

    const handleTouchStart = e => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isDragging = true;
    };

    const handleTouchMove = e => {
      if (!isDragging) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = startX - currentX;
      const diffY = startY - currentY;

      // Prevent vertical scrolling from triggering horizontal swipe
      if (Math.abs(diffX) > Math.abs(diffY)) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = _e => {
      if (!isDragging) return;

      const endX = _e.changedTouches[0].clientX;
      const endY = _e.changedTouches[0].clientY;
      const diffX = startX - endX;
      const diffY = startY - endY;

      // Minimum swipe distance
      const minSwipeDistance = 50;

      // Check if it's a horizontal swipe
      if (
        Math.abs(diffX) > minSwipeDistance &&
        Math.abs(diffY) < minSwipeDistance
      ) {
        if (diffX > 0) {
          // Swipe left - next period
          onSwipeLeft();
        } else {
          // Swipe right - previous period
          onSwipeRight();
        }
      }

      isDragging = false;
    };

    element.addEventListener('touchstart', handleTouchStart, {
      passive: false,
    });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    // Return cleanup function
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }

  /**
   * Setup touch-friendly chart interactions
   */
  static setupChartTouchInteractions(chartElement, onTap) {
    let touchStartTime = 0;

    const handleTouchStart = _e => {
      touchStartTime = Date.now();
    };

    const handleTouchEnd = _e => {
      const touchDuration = Date.now() - touchStartTime;

      // Only register taps (quick touches)
      if (touchDuration < 300) {
        const rect = chartElement.getBoundingClientRect();
        const x = _e.changedTouches[0].clientX - rect.left;
        const y = _e.changedTouches[0].clientY - rect.top;

        onTap({ x, y });
      }
    };

    const handleTouchCancel = () => {
      // Reset touch state on cancel
      touchStartTime = 0;
    };

    chartElement.addEventListener('touchstart', handleTouchStart);
    chartElement.addEventListener('touchend', handleTouchEnd);
    chartElement.addEventListener('touchcancel', handleTouchCancel);

    return () => {
      chartElement.removeEventListener('touchstart', handleTouchStart);
      chartElement.removeEventListener('touchend', handleTouchEnd);
      chartElement.removeEventListener('touchcancel', handleTouchCancel);
    };
  }

  /**
   * Add haptic feedback for mobile devices
   */
  static triggerHapticFeedback(type = 'light') {
    if ('vibrate' in navigator) {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(25);
          break;
        case 'heavy':
          navigator.vibrate(50);
          break;
        case 'success':
          navigator.vibrate([10, 50, 10]);
          break;
        case 'error':
          navigator.vibrate([100, 50, 100]);
          break;
      }
    }
  }

  /**
   * Create touch-friendly button with larger tap target
   */
  static createTouchButton(text, onClick, options = {}) {
    const button = document.createElement('button');
    button.textContent = text;

    // Default touch-friendly styles
    const defaultStyles = {
      minHeight: '44px', // iOS minimum tap target
      minWidth: '44px',
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '500',
      cursor: 'pointer',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      WebkitTouchCallout: 'none',
      ...options.styles,
    };

    Object.assign(button.style, defaultStyles);

    // Add touch feedback with a short-lived isTouch flag to avoid double haptics
    let isTouch = false;

    const touchStartHandler = () => {
      isTouch = true;
      button.style.transform = 'scale(0.95)';
      button.style.opacity = '0.8';
      this.triggerHapticFeedback('light');
    };

    const touchEndHandler = () => {
      // Restore visual state and clear touch flag
      button.style.transform = 'scale(1)';
      button.style.opacity = '1';
      isTouch = false;
      // Optionally trigger a stronger haptic on release if desired
      // this.triggerHapticFeedback('medium');
    };

    const touchCancelHandler = () => {
      // Reset visual state and clear flag on cancel
      button.style.transform = 'scale(1)';
      button.style.opacity = '1';
      isTouch = false;
    };

    button.addEventListener('touchstart', touchStartHandler);
    button.addEventListener('touchend', touchEndHandler);
    button.addEventListener('touchcancel', touchCancelHandler);

    button.addEventListener('click', _e => {
      // If click comes from a recent touch, treat it as the same interaction
      if (isTouch) {
        isTouch = false;
        onClick(_e);
        // Do NOT trigger medium haptic here (we already gave a light haptic on touchstart)
        return;
      }

      // Regular mouse/keyboard click
      onClick(_e);
      this.triggerHapticFeedback('medium');
    });

    return button;
  }

  /**
   * Optimize chart for mobile touch interactions
   */
  static optimizeChartForMobile(chartCanvas) {
    // Make chart larger for touch
    chartCanvas.style.minHeight = '300px';
    chartCanvas.style.touchAction = 'pan-y'; // Allow vertical scrolling but prevent horizontal

    // Named handlers so they can be removed by callers via the attached cleanup
    let startX = null;
    let startY = null;

    const handleTouchStart = e => {
      // Prevent default only for gestures that would conflict with native scrolling
      if (!e || !e.touches) return;

      if (e.touches.length > 1) {
        // Multi-touch (pinch/zoom) — prevent default to allow chart to handle it
        e.preventDefault();
        return;
      }

      // Track starting position for later horizontal-swipe detection in touchmove
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchMove = e => {
      if (!startX || !e || !e.touches || e.touches.length === 0) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = Math.abs(currentX - startX);
      const diffY = Math.abs(currentY - startY);

      // If horizontal movement predominates, prevent native horizontal scrolling
      if (diffX > diffY && diffX > 10) {
        e.preventDefault();
      }
    };

    chartCanvas.addEventListener('touchstart', handleTouchStart, {
      passive: false,
    });
    chartCanvas.addEventListener('touchmove', handleTouchMove, {
      passive: false,
    });

    const cleanup = () => {
      chartCanvas.removeEventListener('touchstart', handleTouchStart);
      chartCanvas.removeEventListener('touchmove', handleTouchMove);
    };

    // Attach cleanup for callers and return chartCanvas for backward compatibility
    chartCanvas._optimizeTouchCleanup = cleanup;
    return chartCanvas;
  }

  /**
   * Setup one-handed operation support
   */
  static setupOneHandedOperation(container) {
    // Add bottom navigation for easy thumb reach
    const navBar = document.createElement('div');
    navBar.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: ${COLORS.SURFACE};
      border-top: 1px solid ${COLORS.BORDER};
      padding: 8px 16px;
      display: flex;
      justify-content: space-around;
      z-index: 1000;
      transform: translateY(100%);
      transition: transform 0.3s ease;
    `;

    // Add safe area padding for notched phones
    navBar.style.paddingBottom = 'env(safe-area-inset-bottom, 8px)';

    // Show/hide navigation based on scroll
    let lastScrollY = 0;
    let ticking = false;

    const updateNavBar = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - hide nav
        navBar.style.transform = 'translateY(100%)';
      } else {
        // Scrolling up - show nav
        navBar.style.transform = 'translateY(0)';
      }

      lastScrollY = currentScrollY;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateNavBar);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll);

    container.appendChild(navBar);

    return {
      navBar,
      cleanup: () => {
        window.removeEventListener('scroll', onScroll);
        if (container.contains(navBar)) {
          container.removeChild(navBar);
        }
      },
    };
  }
}
