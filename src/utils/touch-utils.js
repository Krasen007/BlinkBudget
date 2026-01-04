/**
 * Touch event utilities
 * Provides standardized touch event handlers to reduce duplication
 */

import { HAPTIC_PATTERNS } from './constants.js';

/**
 * Add touch feedback to an element
 * @param {HTMLElement} element - Element to add touch feedback to
 * @param {Object} options - Configuration options
 */
export const addTouchFeedback = (element, options = {}) => {
    const {
        hapticPattern = HAPTIC_PATTERNS.LIGHT,
        scale = 0.98,
        backgroundColor = 'var(--color-surface-hover)',
        transform = `scale(${scale})`,
        passive = true
    } = options;
    
    const originalBackground = element.style.backgroundColor;
    const originalTransform = element.style.transform;
    
    element.addEventListener('touchstart', () => {
        element.style.backgroundColor = backgroundColor;
        element.style.transform = transform;
        
        if (window.mobileUtils?.supportsHaptic() && hapticPattern) {
            window.mobileUtils.hapticFeedback(hapticPattern);
        }
    }, { passive });
    
    element.addEventListener('touchend', () => {
        element.style.backgroundColor = originalBackground || 'transparent';
        element.style.transform = originalTransform || 'scale(1)';
    }, { passive });
    
    element.addEventListener('touchcancel', () => {
        element.style.backgroundColor = originalBackground || 'transparent';
        element.style.transform = originalTransform || 'scale(1)';
    }, { passive });
};

/**
 * Add touch feedback with class toggle (for CSS-based feedback)
 * @param {HTMLElement} element - Element to add touch feedback to
 * @param {Object} options - Configuration options
 */
export const addTouchFeedbackClass = (element, options = {}) => {
    const {
        className = 'touch-active',
        hapticPattern = HAPTIC_PATTERNS.LIGHT,
        passive = true
    } = options;
    
    element.addEventListener('touchstart', () => {
        element.classList.add(className);
        
        if (window.mobileUtils?.supportsHaptic() && hapticPattern) {
            window.mobileUtils.hapticFeedback(hapticPattern);
        }
    }, { passive });
    
    element.addEventListener('touchend', () => {
        element.classList.remove(className);
    }, { passive });
    
    element.addEventListener('touchcancel', () => {
        element.classList.remove(className);
    }, { passive });
};

/**
 * Add hover effects for desktop (complement to touch feedback)
 * @param {HTMLElement} element - Element to add hover effects to
 * @param {Object} options - Configuration options
 */
export const addHoverEffects = (element, options = {}) => {
    const {
        hoverBackground = 'var(--color-surface-hover)',
        hoverBorder = 'var(--color-border)',
        hoverColor = null,
        originalBackground = null,
        originalBorder = null,
        originalColor = null
    } = options;
    
    const bg = originalBackground || element.style.backgroundColor;
    const border = originalBorder || element.style.border;
    const color = originalColor || element.style.color;
    
    element.addEventListener('mouseenter', () => {
        if (hoverBackground) element.style.backgroundColor = hoverBackground;
        if (hoverBorder) element.style.border = hoverBorder;
        if (hoverColor) element.style.color = hoverColor;
    });
    
    element.addEventListener('mouseleave', () => {
        if (bg) element.style.backgroundColor = bg;
        if (border) element.style.border = border;
        if (color) element.style.color = color;
    });
};

/**
 * Debounce function for resize/orientation events
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

/**
 * Throttle function for scroll/resize events
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit) => {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

