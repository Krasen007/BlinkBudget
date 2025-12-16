/**
 * Keyboard handling utilities
 * Manages keyboard-aware viewport adjustments for forms
 */

import { DIMENSIONS, TIMING } from '../constants.js';

/**
 * Setup keyboard-aware handling for a form
 * @param {HTMLFormElement} form - Form element
 * @param {Array<HTMLElement>} inputs - Array of input elements to monitor
 * @returns {Function} Cleanup function
 */
export const setupFormKeyboardHandling = (form, inputs = []) => {
    if (!window.mobileUtils || !window.mobileUtils.isMobile()) {
        return () => {}; // No-op cleanup for desktop
    }
    
    const handleInputFocus = (input) => {
        // Add class to body for keyboard-aware styling
        document.body.classList.add('keyboard-visible');
        
        // Adjust form positioning for keyboard
        form.style.paddingBottom = '20vh'; // Extra space for keyboard
        
        // Scroll the focused input into view with delay for keyboard animation
        setTimeout(() => {
            if (window.mobileUtils) {
                window.mobileUtils.scrollIntoViewAboveKeyboard(input, 80);
            }
        }, TIMING.KEYBOARD_DELAY);
    };
    
    const handleInputBlur = () => {
        // Check if any input still has focus before removing keyboard class
        setTimeout(() => {
            const hasActiveFocus = inputs.some(inp => document.activeElement === inp);
            if (!hasActiveFocus) {
                document.body.classList.remove('keyboard-visible');
                form.style.paddingBottom = '0';
            }
        }, TIMING.FOCUS_DELAY);
    };
    
    // Setup focus/blur handlers for each input
    inputs.forEach(input => {
        input.addEventListener('focus', () => handleInputFocus(input));
        input.addEventListener('blur', handleInputBlur);
    });
    
    // Handle visual viewport changes (keyboard show/hide)
    let viewportHandler = null;
    if (window.visualViewport) {
        viewportHandler = () => {
            const keyboardHeight = window.innerHeight - window.visualViewport.height;
            
            if (keyboardHeight > DIMENSIONS.KEYBOARD_THRESHOLD) {
                // Keyboard is visible
                document.body.classList.add('keyboard-visible');
                form.style.paddingBottom = `${keyboardHeight + 20}px`;
            } else {
                // Keyboard is hidden
                document.body.classList.remove('keyboard-visible');
                form.style.paddingBottom = '0';
            }
        };
        
        window.visualViewport.addEventListener('resize', viewportHandler);
    }
    
    // Return cleanup function
    return () => {
        inputs.forEach(input => {
            input.removeEventListener('focus', handleInputFocus);
            input.removeEventListener('blur', handleInputBlur);
        });
        
        if (viewportHandler && window.visualViewport) {
            window.visualViewport.removeEventListener('resize', viewportHandler);
        }
        
        document.body.classList.remove('keyboard-visible');
        form.style.paddingBottom = '0';
    };
};

