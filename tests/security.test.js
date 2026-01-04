/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sanitizeInput,
  validatePasswordStrength,
  validateEmail,
} from '../src/utils/security-utils';
import { Router } from '../src/core/router';
import { StorageService } from '../src/core/storage';
import { AuthService } from '../src/core/auth-service';
import { validateLength } from '../src/utils/form-utils/validation';

describe('Security Utilities', () => {
  describe('sanitizeInput', () => {
    it('should strip HTML tags', () => {
      const input = '<script>alert(1)</script>Hello<b>World</b>';
      const expected = 'alert(1)HelloWorld';
      expect(sanitizeInput(input)).toBe(expected);
    });

    it('should enforce length limits', () => {
      const input = 'a'.repeat(300);
      expect(sanitizeInput(input, 50).length).toBe(50);
    });

    it('should handle non-string input', () => {
      expect(sanitizeInput(null)).toBe(null);
      expect(sanitizeInput(123)).toBe(123);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should reject short passwords', () => {
      expect(validatePasswordStrength('short').isValid).toBe(false);
    });

    it('should reject passwords without numbers', () => {
      expect(validatePasswordStrength('password').isValid).toBe(false);
    });

    it('should reject passwords without letters', () => {
      expect(validatePasswordStrength('12345678').isValid).toBe(false);
    });

    it('should accept valid passwords', () => {
      expect(validatePasswordStrength('password123').isValid).toBe(true);
    });
  });

  describe('validateEmail', () => {
    it('should reject empty or null email', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail(null)).toBe(false);
    });

    it('should reject invalid formats', () => {
      expect(validateEmail('test')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('test@google')).toBe(false);
      expect(validateEmail('@google.com')).toBe(false);
    });

    it('should accept valid formats', () => {
      expect(validateEmail('test@google.com')).toBe(true);
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true);
    });
  });
});

describe('Router Guard Integration', () => {
  beforeEach(() => {
    Router.beforeHook = null;
  });

  it('should respect the before hook', async () => {
    const handler = vi.fn();
    Router.on('protected', handler);

    Router.before(() => false); // Block everything

    window.location.hash = 'protected';
    await Router.handleRoute();

    expect(handler).not.toHaveBeenCalled();
  });

  it('should proceed if the before hook returns true', async () => {
    const handler = vi.fn();
    Router.on('public', handler);

    Router.before(() => true); // Allow everything

    window.location.hash = 'public';
    await Router.handleRoute();

    expect(handler).toHaveBeenCalled();
  });
});
describe('Advanced Security', () => {
  test('Transaction Ownership (IDOR Protection)', () => {
    // Setup mock user
    AuthService.user = { uid: 'user-1' };

    // Add transaction (StorageService now adds userId)
    const t1 = StorageService.add({ amount: 10, category: 'Food' });
    expect(t1.userId).toBe('user-1');

    // Can access own transaction
    expect(StorageService.get(t1.id)).toBeDefined();

    // Switch user
    AuthService.user = { uid: 'user-2' };

    // Cannot access other's transaction
    expect(StorageService.get(t1.id)).toBeUndefined();
  });

  test('Strict Length Validation', () => {
    expect(validateLength('short', 10, 'Test').valid).toBe(true);
    expect(validateLength('too long string', 5, 'Test').valid).toBe(false);
    expect(validateLength('too long string', 5, 'Test').error).toContain(
      'is too long'
    );
  });
});
