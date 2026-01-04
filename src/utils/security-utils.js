/**
 * Security utilities for BlinkBudget
 */

/**
 * Sanitizes input by stripping HTML tags and script elements.
 * @param {string} input - The raw string input.
 * @param {number} maxLength - Maximum allowed length.
 * @returns {string} The sanitized string.
 */
export const sanitizeInput = (input, maxLength = 255) => {
  if (typeof input !== 'string') return input;

  // 1. Strip HTML tags
  const div = document.createElement('div');
  div.innerHTML = input;
  let sanitized = div.textContent || div.innerText || '';

  // 2. Enforce length limit
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
};

/**
 * Validates password strength.
 * Requirements: Min 8 characters, at least one letter and one number.
 * @param {string} password
 * @returns {{isValid: boolean, message: string}}
 */
export const validatePasswordStrength = password => {
  if (!password || password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long.',
    };
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasLetter || !hasNumber) {
    return {
      isValid: false,
      message: 'Password must contain at least one letter and one number.',
    };
  }

  return { isValid: true, message: '' };
};
/**
 * Validates email format.
 * @param {string} email
 * @returns {boolean}
 */
export const validateEmail = email => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
