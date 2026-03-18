/**
 * Accessibility Service - WebApp.md Accessibility Enhancement
 * Provides comprehensive accessibility features and WCAG AA compliance
 */

export class AccessibilityService {
  constructor() {
    this.isInitialized = false;
    this.focusTrapStack = [];
    this.announcer = null;
    this.skipLinks = [];
    this.keyboardUsers = false;
    this.reducedMotion = false;
    this.highContrast = false;

    // Accessibility preferences
    this.preferences = {
      fontSize: 'normal', // small, normal, large
      highContrast: false,
      reducedMotion: false,
      screenReader: false,
      keyboardOnly: false,
    };

    this.init();
  }

  init() {
    if (this.isInitialized) return;

    this.isInitialized = true;
    console.log('[AccessibilityService] Initializing accessibility features');

    // Detect user preferences
    this.detectAccessibilityPreferences();

    // Setup announcer
    this.setupScreenReaderAnnouncer();

    // Setup skip links
    this.setupSkipLinks();

    // Setup focus management
    this.setupFocusManagement();

    // Setup keyboard navigation
    this.setupKeyboardNavigation();

    // Monitor preference changes
    this.setupPreferenceMonitoring();

    // Apply initial preferences
    this.applyAccessibilityPreferences();
  }

  detectAccessibilityPreferences() {
    // Detect reduced motion preference
    this.reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    // Detect high contrast preference
    this.highContrast = window.matchMedia('(prefers-contrast: high)').matches;

    // Detect screen reader usage
    this.preferences.screenReader = this.detectScreenReader();

    // Detect keyboard-only navigation
    this.detectKeyboardUsage();

    console.log('[AccessibilityService] Detected preferences:', {
      reducedMotion: this.reducedMotion,
      highContrast: this.highContrast,
      screenReader: this.preferences.screenReader,
      keyboardOnly: this.keyboardUsers,
    });
  }

  detectScreenReader() {
    // Common screen reader detection patterns
    const hasScreenReader = !!(
      window.speechSynthesis ||
      window.speechSynthesisUtterances ||
      window.chrome?.tts ||
      window.braille ||
      navigator.userAgent.includes('NVDA') ||
      navigator.userAgent.includes('JAWS') ||
      navigator.userAgent.includes('VoiceOver') ||
      navigator.userAgent.includes('ChromeVox')
    );

    return hasScreenReader;
  }

  detectKeyboardUsage() {
    // Detect if user is primarily using keyboard
    let keyboardInteractions = 0;
    let mouseInteractions = 0;

    const countInteraction = event => {
      if (event.type === 'keydown' || event.type === 'keyup') {
        keyboardInteractions++;
      } else if (
        event.type.startsWith('mouse') ||
        event.type.startsWith('touch')
      ) {
        mouseInteractions++;
      }

      // Determine primary input method after 10 interactions
      if (keyboardInteractions + mouseInteractions >= 10) {
        this.keyboardUsers = keyboardInteractions > mouseInteractions * 2;
        this.cleanupInteractionDetection();
      }
    };

    // Listen to interactions
    document.addEventListener('keydown', countInteraction);
    document.addEventListener('keyup', countInteraction);
    document.addEventListener('mousedown', countInteraction);
    document.addEventListener('touchstart', countInteraction);

    // Store cleanup function
    this.cleanupInteractionDetection = () => {
      document.removeEventListener('keydown', countInteraction);
      document.removeEventListener('keyup', countInteraction);
      document.removeEventListener('mousedown', countInteraction);
      document.removeEventListener('touchstart', countInteraction);
    };
  }

  setupScreenReaderAnnouncer() {
    // Create live region for screen reader announcements
    this.announcer = document.createElement('div');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.setAttribute('class', 'sr-only');
    this.announcer.setAttribute('data-announcer', 'true');

    document.body.appendChild(this.announcer);
  }

  setupSkipLinks() {
    // Create main skip links
    const skipLinks = [
      { href: '#main-content', text: 'Skip to main content' },
      { href: '#navigation', text: 'Skip to navigation' },
    ];

    skipLinks.forEach(linkConfig => {
      const skipLink = document.createElement('a');
      skipLink.href = linkConfig.href;
      skipLink.textContent = linkConfig.text;
      skipLink.className = 'skip-link';

      // Insert at beginning of body
      document.body.insertBefore(skipLink, document.body.firstChild);
      this.skipLinks.push(skipLink);
    });
  }

  setupFocusManagement() {
    // Add focus styles if they don't exist
    if (!document.querySelector('#accessibility-focus-styles')) {
      const style = document.createElement('style');
      style.id = 'accessibility-focus-styles';
      style.textContent = `
        /* Enhanced focus styles for better visibility */
        :focus-visible {
          outline: 3px solid var(--focus-color) !important;
          outline-offset: 2px !important;
          box-shadow: 0 0 0 3px var(--focus-color) !important;
        }
        
        /* High contrast focus */
        @media (prefers-contrast: high) {
          :focus-visible {
            outline: 4px solid #000000 !important;
            background-color: #FFFF00 !important;
            color: #000000 !important;
          }
        }
        
        /* Skip link focus */
        .skip-link:focus {
          top: 6px;
          left: 6px;
        }
      `;
      document.head.appendChild(style);
    }
  }

  setupKeyboardNavigation() {
    // Enhanced keyboard navigation
    document.addEventListener('keydown', e => {
      // Tab navigation enhancement
      if (e.key === 'Tab') {
        this.handleTabNavigation(e);
      }

      // Escape key handling
      if (e.key === 'Escape') {
        this.handleEscapeKey(e);
      }

      // Arrow key navigation for custom components
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        this.handleArrowNavigation(e);
      }
    });
  }

  handleTabNavigation(event) {
    // Get all focusable elements
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const currentIndex = Array.from(focusableElements).indexOf(
      document.activeElement
    );

    // Handle tab wrapping
    if (event.shiftKey) {
      // Shift + Tab (backward)
      if (currentIndex <= 0) {
        focusableElements[focusableElements.length - 1]?.focus();
      } else {
        focusableElements[currentIndex - 1]?.focus();
      }
    } else {
      // Tab (forward)
      if (currentIndex >= focusableElements.length - 1) {
        focusableElements[0]?.focus();
      } else {
        focusableElements[currentIndex + 1]?.focus();
      }
    }
  }

  handleEscapeKey(event) {
    // Close modals, dropdowns, etc.
    const activeModal = document.querySelector('.modal-overlay.active');
    if (activeModal) {
      event.preventDefault();
      activeModal.classList.remove('active');
      this.announceToScreenReader('Modal closed');
    }

    // Emit escape event for components to handle
    document.dispatchEvent(
      new CustomEvent('accessibility-escape', {
        detail: { originalEvent: event },
      })
    );
  }

  handleArrowNavigation(event) {
    // Let components handle arrow navigation
    document.dispatchEvent(
      new CustomEvent('accessibility-arrow', {
        detail: {
          direction: event.key.replace('Arrow', '').toLowerCase(),
          originalEvent: event,
        },
      })
    );
  }

  setupPreferenceMonitoring() {
    // Monitor preference changes
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    motionQuery.addEventListener('change', e => {
      this.reducedMotion = e.matches;
      this.preferences.reducedMotion = e.matches;
      this.applyAccessibilityPreferences();
      this.announceToScreenReader('Reduced motion preference changed');
    });

    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    contrastQuery.addEventListener('change', e => {
      this.highContrast = e.matches;
      this.preferences.highContrast = e.matches;
      this.applyAccessibilityPreferences();
      this.announceToScreenReader('High contrast preference changed');
    });
  }

  applyAccessibilityPreferences() {
    const root = document.documentElement;

    // Apply reduced motion
    if (this.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Apply high contrast
    if (this.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Apply font size
    root.classList.remove('font-small', 'font-normal', 'font-large');
    root.classList.add(`font-${this.preferences.fontSize}`);
  }

  // Focus trap management for modals
  trapFocus(element) {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const trapHandler = e => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    element.addEventListener('keydown', trapHandler);
    this.focusTrapStack.push({ element, handler: trapHandler });

    // Focus first element
    setTimeout(() => firstElement?.focus(), 100);
  }

  removeFocusTrap(element) {
    const trapIndex = this.focusTrapStack.findIndex(
      trap => trap.element === element
    );
    if (trapIndex !== -1) {
      const trap = this.focusTrapStack[trapIndex];
      element.removeEventListener('keydown', trap.handler);
      this.focusTrapStack.splice(trapIndex, 1);
    }
  }

  // Screen reader announcements
  announceToScreenReader(message, priority = 'polite') {
    if (!this.announcer) return;

    // Clear previous announcement
    this.announcer.textContent = '';

    // Set new message
    setTimeout(() => {
      this.announcer.textContent = message;
      this.announcer.setAttribute('aria-live', priority);
    }, 100);

    // Clear after announcement
    setTimeout(() => {
      this.announcer.textContent = '';
    }, 3000);
  }

  announcePageChange(pageTitle) {
    this.announceToScreenReader(`Navigated to ${pageTitle}`, 'assertive');
  }

  announceError(message) {
    this.announceToScreenReader(`Error: ${message}`, 'assertive');
  }

  announceStatus(message) {
    this.announceToScreenReader(message, 'polite');
  }

  // Accessibility testing helpers
  testColorContrast(foreground, background) {
    // Simple contrast ratio calculation
    const getLuminance = color => {
      const rgb = this.hexToRgb(color);
      const [r, g, b] = rgb.map(val => {
        val = val / 255;
        return val <= 0.03928
          ? val / 12.92
          : Math.pow((val + 0.055) / 1.055, 2.4);
      });
      return r * 0.2126 + g * 0.7152 + b * 0.0722;
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
        ]
      : [0, 0, 0];
  }

  // Check if contrast meets WCAG AA standards
  meetsWCAG_AA(foreground, background) {
    const ratio = this.testColorContrast(foreground, background);
    return ratio >= 4.5; // WCAG AA requirement
  }

  meetsWCAG_AAA(foreground, background) {
    const ratio = this.testColorContrast(foreground, background);
    return ratio >= 7; // WCAG AAA requirement
  }

  // Accessibility preferences API
  setFontSize(size) {
    if (['small', 'normal', 'large'].includes(size)) {
      this.preferences.fontSize = size;
      this.applyAccessibilityPreferences();
      this.announceToScreenReader(`Font size set to ${size}`);
    }
  }

  toggleHighContrast() {
    this.preferences.highContrast = !this.preferences.highContrast;
    this.applyAccessibilityPreferences();
    this.announceToScreenReader(
      `High contrast ${this.preferences.highContrast ? 'enabled' : 'disabled'}`
    );
  }

  toggleReducedMotion() {
    this.preferences.reducedMotion = !this.preferences.reducedMotion;
    this.applyAccessibilityPreferences();
    this.announceToScreenReader(
      `Reduced motion ${this.preferences.reducedMotion ? 'enabled' : 'disabled'}`
    );
  }

  // Get accessibility report
  getAccessibilityReport() {
    return {
      preferences: { ...this.preferences },
      detected: {
        screenReader: this.preferences.screenReader,
        keyboardOnly: this.keyboardUsers,
        reducedMotion: this.reducedMotion,
        highContrast: this.highContrast,
      },
      features: {
        skipLinks: this.skipLinks.length,
        focusTraps: this.focusTrapStack.length,
        announcer: !!this.announcer,
      },
      recommendations: this.generateRecommendations(),
    };
  }

  generateRecommendations() {
    const recommendations = [];

    // Check for common accessibility issues
    const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
    if (imagesWithoutAlt.length > 0) {
      recommendations.push({
        type: 'images',
        severity: 'high',
        message: `${imagesWithoutAlt.length} images missing alt text`,
        elements: imagesWithoutAlt.length,
      });
    }

    const headingsWithoutStructure = document.querySelectorAll(
      'h1, h2, h3, h4, h5, h6'
    );
    if (headingsWithoutStructure.length === 0) {
      recommendations.push({
        type: 'structure',
        severity: 'medium',
        message: 'No heading structure found',
        elements: 0,
      });
    }

    const inputsWithoutLabels = document.querySelectorAll(
      'input:not([aria-label]):not([aria-labelledby])'
    );
    const unlabeledInputs = Array.from(inputsWithoutLabels).filter(input => {
      return !input.closest('label') && input.type !== 'hidden';
    });

    if (unlabeledInputs.length > 0) {
      recommendations.push({
        type: 'forms',
        severity: 'high',
        message: `${unlabeledInputs.length} inputs without proper labels`,
        elements: unlabeledInputs.length,
      });
    }

    return recommendations;
  }

  // Cleanup
  destroy() {
    // Remove skip links
    this.skipLinks.forEach(link => link.remove());
    this.skipLinks = [];

    // Remove announcer
    if (this.announcer) {
      this.announcer.remove();
      this.announcer = null;
    }

    // Clear focus traps
    this.focusTrapStack = [];

    // Remove event listeners
    if (this.cleanupInteractionDetection) {
      this.cleanupInteractionDetection();
    }

    this.isInitialized = false;
  }
}

// Global accessibility service instance
export const accessibilityService = new AccessibilityService();

// Auto-initialize
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      accessibilityService.init();
    });
  } else {
    accessibilityService.init();
  }
}
