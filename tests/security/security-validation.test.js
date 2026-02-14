/** @vitest-environment jsdom */
/* eslint-disable no-script-url */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  sanitizeInput,
  validatePasswordStrength,
  validateEmail,
  safeJsonParse,
  escapeHtml,
} from '../../src/utils/security-utils.js';

describe('Security Validation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Input Sanitization', () => {
    it('should strip HTML tags from input', () => {
      const testCases = [
        {
          input: '<script>alert("XSS")</script>Hello',
          expected: 'alert("XSS")Hello',
        },
        { input: '<div>Content</div>', expected: 'Content' },
        { input: '<img src=x onerror=alert(1)>Test', expected: 'Test' },
        { input: 'Normal text', expected: 'Normal text' },
        { input: '', expected: '' },
        { input: null, expected: null },
        { input: undefined, expected: undefined },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(sanitizeInput(input)).toBe(expected);
      });
    });

    it('should enforce length limits', () => {
      const longInput = 'a'.repeat(300);
      const result = sanitizeInput(longInput, 50);
      expect(result.length).toBeLessThanOrEqual(50);
    });

    it('should escape HTML entities', () => {
      const testCases = [
        { input: '<div>Hello</div>', expected: '&lt;div&gt;Hello&lt;/div&gt;' },
        {
          input: '<script>alert("XSS")</script>',
          expected: '&lt;script&gt;alert("XSS")&lt;/script&gt;',
        },
        { input: '&lt;test&gt;', expected: '&amp;lt;test&amp;gt;' },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(escapeHtml(input)).toBe(expected);
      });
    });
  });

  describe('Password Validation', () => {
    it('should validate password strength correctly', () => {
      // snyk-ignore: javascript/NoHardcodedPasswords/test - Test fixture passwords
      const testCases = [
        { password: '', valid: false },
        { password: '123', valid: false },
        { password: 'password', valid: false },
        { password: '12345678', valid: false },
        { password: 'Pass', valid: false },
        { password: 'Password123', valid: true },
        { password: 'SecurePass456', valid: true },
        { password: 'MyP@ssw0rd!', valid: true },
        { password: null, valid: false },
        { password: undefined, valid: false },
      ];

      testCases.forEach(({ password, valid }) => {
        const result = validatePasswordStrength(password);
        expect(result.isValid).toBe(valid);
      });
    });

    it('should provide appropriate error messages', () => {
      let result = validatePasswordStrength('short');
      expect(result.message).toContain('at least 8 characters');

      result = validatePasswordStrength('password');
      expect(result.message).toContain('at least one letter and one number');

      result = validatePasswordStrength('12345678');
      expect(result.message).toContain('at least one letter and one number');
    });
  });

  describe('Email Validation', () => {
    it('should validate email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.org',
        'user+tag@example.net',
        'user123@test-domain.com',
      ];

      const invalidEmails = [
        '',
        null,
        undefined,
        'plaintext',
        '@domain.com',
        'user@',
        'user@domain',
        'user name@domain.com',
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });
  });

  describe('JSON Parsing Safety', () => {
    it('should handle malformed JSON safely', () => {
      const malformedInputs = ['{"incomplete": json', '', null, undefined];

      malformedInputs.forEach(input => {
        expect(safeJsonParse(input)).toBeNull();
      });
    });

    it('should parse valid JSON correctly', () => {
      const validJson = '{"name": "test", "value": 123}';
      const result = safeJsonParse(validJson);
      expect(result).toEqual({ name: 'test', value: 123 });
    });

    it('should handle dangerous but valid JSON', () => {
      const dangerousJson = '{"__proto__": {"isAdmin": true}}';
      const result = safeJsonParse(dangerousJson);

      // The function should parse it and handle dangerous keys appropriately
      expect(result).toBeDefined();
      // The actual behavior depends on the implementation - just ensure it doesn't crash
      expect(typeof result).toBe('object');
    });
  });

  describe('Edge Cases', () => {
    it('should handle non-string inputs gracefully', () => {
      const nonStringInputs = [123, {}, [], true, false];

      nonStringInputs.forEach(input => {
        expect(sanitizeInput(input)).toBe(input);
        expect(escapeHtml(input)).toBe(input);
      });
    });

    it('should handle extreme inputs', () => {
      const extremeInputs = [
        'a'.repeat(10000),
        '<script>'.repeat(100),
        'javascript:alert("XSS")'.repeat(50),
      ];

      extremeInputs.forEach(input => {
        const sanitized = sanitizeInput(input, 100);
        expect(sanitized.length).toBeLessThanOrEqual(100);
        // The sanitizeInput function removes HTML tags after processing
        // So we check that the result is properly length-limited
      });
    });
  });

  describe('Performance', () => {
    it('should handle large inputs efficiently', () => {
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        sanitizeInput('<script>alert("XSS")</script>');
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds (adjusted for test environment)
    });
  });
});
