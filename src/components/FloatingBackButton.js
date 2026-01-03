/**
 * FloatingBackButton Component
 * Provides a floating back button for mobile views that appears on scroll.
 */

import { COLORS, BREAKPOINTS } from '../utils/constants.js';
import { Router } from '../core/router.js';

/**
 * Create floating back button
 * @param {Object} options - Options for the button
 * @param {Function} options.onScrollToggle - Callback for when the button visibility status changes
 * @returns {Object} { element, cleanup }
 */
export const FloatingBackButton = (options = {}) => {
    const button = document.createElement('button');
    button.innerHTML = '←';
    button.className = 'floating-back-btn';
    button.title = 'Back to Dashboard';
    button.style.position = 'fixed';
    button.style.bottom = window.innerWidth < BREAKPOINTS.MOBILE ? '80px' : '20px';
    button.style.left = '20px';
    button.style.width = '48px';
    button.style.height = '48px';
    button.style.borderRadius = '50%';
    button.style.background = COLORS.PRIMARY;
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.fontSize = '1.5rem';
    button.style.cursor = 'pointer';
    button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    button.style.zIndex = '1000';
    button.style.display = 'none';
    button.style.transition = 'all 0.3s ease';
    button.style.opacity = '0';
    button.style.transform = 'scale(0.8)';

    button.addEventListener('click', () => Router.navigate('dashboard'));

    let isVisible = false;
    const toggleButton = () => {
        const shouldShow = window.scrollY > 100;

        if (shouldShow && !isVisible) {
            button.style.display = 'flex';
            button.style.alignItems = 'center';
            button.style.justifyContent = 'center';
            setTimeout(() => {
                button.style.opacity = '1';
                button.style.transform = 'scale(1)';
            }, 10);
            isVisible = true;
            if (options.onScrollToggle) options.onScrollToggle(true);
        } else if (!shouldShow && isVisible) {
            button.style.opacity = '0';
            button.style.transform = 'scale(0.8)';
            setTimeout(() => {
                button.style.display = 'none';
            }, 300);
            isVisible = false;
            if (options.onScrollToggle) options.onScrollToggle(false);
        }
    };

    window.addEventListener('scroll', toggleButton, { passive: true });

    return {
        element: button,
        cleanup: () => {
            window.removeEventListener('scroll', toggleButton);
        }
    };
};
