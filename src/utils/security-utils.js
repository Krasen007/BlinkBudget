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

  // 1. Strip HTML tags using DOMParser (safer than innerHTML)
  try {
    const parser = new window.DOMParser();
    const doc = parser.parseFromString(input, 'text/html');
    const sanitized = doc.documentElement.textContent || '';

    // 2. Enforce length limit
    if (sanitized.length > maxLength) {
      return sanitized.substring(0, maxLength);
    }

    return sanitized;
  } catch {
    // Fallback to simple regex if DOMParser fails
    const sanitized = input.replace(/<[^>]*>?/gm, '');
    if (sanitized.length > maxLength) {
      return sanitized.substring(0, maxLength);
    }
    return sanitized;
  }
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
 * Safely parses JSON while preventing prototype pollution.
 * @param {string} jsonString - The JSON string to parse.
 * @returns {any} The parsed object or null if parsing fails.
 */
export const safeJsonParse = jsonString => {
  if (typeof jsonString !== 'string') return null;

  try {
    const parsed = JSON.parse(jsonString);

    // Recursively sanitize the parsed object to prevent prototype pollution
    const sanitize = obj => {
      if (obj === null || typeof obj !== 'object') return obj;

      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }

      const sanitized = {};
      for (const key in obj) {
        // Skip dangerous prototype properties
        if (
          key === '__proto__' ||
          key === 'constructor' ||
          key === 'prototype'
        ) {
          continue;
        }
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    };

    return sanitize(parsed);
  } catch (error) {
    console.error('[Security] Failed to parse JSON:', error);
    return null;
  }
};

/**
 * Escapes HTML special characters to prevent XSS attacks.
 * @param {string} text - The text to escape.
 * @returns {string} The escaped HTML-safe string.
 */
export const escapeHtml = text => {
  if (typeof text !== 'string') return text;

  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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
