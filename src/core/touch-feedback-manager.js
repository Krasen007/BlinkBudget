/**
 * Touch Feedback Manager
 * Provides haptic and visual feedback for touch interactions
 * Based on UX design specifications for mobile touch targets
 */

export class TouchFeedbackManager {
  constructor() {
    this.touchActiveElements = new Set();
    this.hapticSupported = 'vibrate' in navigator;
    this.setupTouchListeners();
  }

  setupTouchListeners() {
    document.addEventListener('touchstart', this.handleTouchStart, {
      passive: true,
    });
    document.addEventListener('touchend', this.handleTouchEnd, {
      passive: true,
    });
    document.addEventListener('touchcancel', this.handleTouchCancel, {
      passive: true,
    });
  }

  handleTouchStart = e => {
    const touchTarget = e.target.closest('.touch-target');
    if (touchTarget) {
      touchTarget.classList.add('touch-active');
      this.touchActiveElements.add(touchTarget);

      // Trigger haptic feedback
      this.triggerHaptic('light');
    }
  };

  handleTouchEnd = e => {
    const touchTarget = e.target.closest('.touch-target');
    if (touchTarget) {
      // Delay visual feedback removal for better UX
      setTimeout(() => {
        touchTarget.classList.remove('touch-active');
        this.touchActiveElements.delete(touchTarget);
      }, 150);

      // Success haptic feedback
      this.triggerHaptic('medium');
    }
  };

  handleTouchCancel = _e => {
    // Remove all active touch states
    this.touchActiveElements.forEach(element => {
      element.classList.remove('touch-active');
    });
    this.touchActiveElements.clear();
  };

  triggerHaptic(type) {
    if (!this.hapticSupported) return;

    const patterns = {
      light: 10,
      medium: 20,
      heavy: [30, 10, 30],
      success: [10, 50, 10],
      error: [50, 30, 50, 30, 50],
    };

    const pattern = patterns[type] || patterns.medium;
    navigator.vibrate(pattern);
  }

  // Public methods for programmatic feedback
  triggerSuccess() {
    this.triggerHaptic('success');
  }

  triggerError() {
    this.triggerHaptic('error');
  }
}

// Singleton instance
export const touchFeedbackManager = new TouchFeedbackManager();
