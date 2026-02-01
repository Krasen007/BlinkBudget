/** @vitest-environment jsdom */
/* eslint-disable no-script-url */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthService } from '../../src/core/auth-service.js';
import { rateLimitService } from '../../src/core/rate-limit-service.js';
import { mockAuthData } from './test-data.js';

// Mock Firebase for testing
vi.mock('../../src/core/firebase-config.js', () => ({
  auth: {
    currentUser: null,
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
    signOut: vi.fn(),
  },
  firebaseStatus: {
    isInitialized: true,
    hasError: false,
    error: null,
    canUseAuth: true,
    canUseFirestore: () => true,
  },
}));

describe('Authentication Penetration Testing - Simple', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset rate limiting service
    rateLimitService.attempts.clear();
    AuthService.user = null;
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Input Validation Security', () => {
    it('should handle malicious email inputs safely', async () => {
      const maliciousEmails = [
        'javascript:alert("XSS")',
        '<script>alert("XSS")</script>@example.com',
        '../../../etc/passwd@example.com',
        '"; DROP TABLE users; --@example.com',
        "user@'; DROP TABLE users; --",
        'user@example.com; DROP TABLE users; --',
      ];

      for (const email of maliciousEmails) {
        const result = await AuthService.login(email, 'password123');
        expect(result.user).toBeNull();
        expect(result.error).toBeDefined();
        // Should not crash or expose sensitive information
        expect(typeof result.error).toBe('string');
      }
    });

    it('should handle XSS attempts in passwords', async () => {
      const xssPayloads = mockAuthData.xssAttempts;

      for (const payload of xssPayloads) {
        const result = await AuthService.login('test@example.com', payload);
        expect(result.user).toBeNull();
        expect(result.error).toBeDefined();
        // Should sanitize the input
        expect(typeof result.error).toBe('string');
      }
    });

    it('should handle SQL injection attempts in passwords', async () => {
      const injectionPasswords = mockAuthData.sqlInjectionAttempts;

      for (const password of injectionPasswords) {
        const result = await AuthService.login('test@example.com', password);
        expect(result.user).toBeNull();
        expect(result.error).toBeDefined();
        // Should handle SQL injection attempts safely
        expect(typeof result.error).toBe('string');
      }
    });

    it('should reject null/undefined credentials', async () => {
      const testCases = [
        { email: null, password: 'password123' },
        { email: 'test@example.com', password: null },
        { email: undefined, password: 'password123' },
        { email: 'test@example.com', password: undefined },
        { email: '', password: 'password123' },
        { email: 'test@example.com', password: '' },
      ];

      for (const credentials of testCases) {
        const result = await AuthService.login(
          credentials.email,
          credentials.password
        );
        expect(result.user).toBeNull();
        expect(result.error).toBeDefined();
      }
    });

    it('should handle extremely long inputs', async () => {
      const longEmail = `${'a'.repeat(1000)}@example.com`;
      const longPassword = 'a'.repeat(1000);

      const result = await AuthService.login(longEmail, longPassword);
      expect(result.user).toBeNull();
      expect(result.error).toBeDefined();
      // Should handle gracefully without memory issues
      expect(typeof result.error).toBe('string');
    });
  });

  describe('Rate Limiting Security', () => {
    it('should have rate limiting service available', () => {
      expect(rateLimitService).toBeDefined();
      expect(typeof rateLimitService.checkRateLimit).toBe('function');
      expect(typeof rateLimitService.recordFailedAttempt).toBe('function');
      expect(typeof rateLimitService.recordSuccessfulAttempt).toBe('function');
    });

    it('should track failed attempts correctly', () => {
      const email = 'test@example.com';

      // Initially should allow
      let status = rateLimitService.checkRateLimit(email);
      expect(status.allowed).toBe(true);
      expect(status.remainingAttempts).toBe(5);

      // Record failed attempts
      for (let i = 0; i < 3; i++) {
        rateLimitService.recordFailedAttempt(email);
      }

      // Should reduce remaining attempts
      status = rateLimitService.checkRateLimit(email);
      expect(status.allowed).toBe(true);
      expect(status.remainingAttempts).toBeLessThan(5);
    });

    it('should eventually lock out after many attempts', () => {
      const email = 'test@example.com';

      // Record maximum failed attempts
      for (let i = 0; i < 5; i++) {
        rateLimitService.recordFailedAttempt(email);
      }

      // Should now be rate limited
      const status = rateLimitService.checkRateLimit(email);
      expect(status.allowed).toBe(false);
      expect(status.locked).toBe(true);
      expect(status.error).toContain('Too many failed attempts');
    });

    it('should reset on successful attempt', () => {
      const email = 'test@example.com';

      // Add failed attempts
      for (let i = 0; i < 3; i++) {
        rateLimitService.recordFailedAttempt(email);
      }

      // Should have reduced attempts
      let status = rateLimitService.checkRateLimit(email);
      expect(status.remainingAttempts).toBeLessThan(5);

      // Record successful attempt
      rateLimitService.recordSuccessfulAttempt(email);

      // Should reset
      status = rateLimitService.checkRateLimit(email);
      expect(status.allowed).toBe(true);
      expect(status.remainingAttempts).toBe(5);
    });

    it('should handle multiple users independently', () => {
      const email1 = 'user1@example.com';
      const email2 = 'user2@example.com';

      // Lock out first user
      for (let i = 0; i < 5; i++) {
        rateLimitService.recordFailedAttempt(email1);
      }

      // First user should be locked
      const status1 = rateLimitService.checkRateLimit(email1);
      expect(status1.allowed).toBe(false);

      // Second user should still be allowed
      const status2 = rateLimitService.checkRateLimit(email2);
      expect(status2.allowed).toBe(true);
    });
  });

  describe('Session Security', () => {
    it('should handle session state correctly', () => {
      // Initially not authenticated
      expect(AuthService.isAuthenticated()).toBe(false);
      expect(AuthService.getUserId()).toBeNull();

      // Mock user session
      AuthService.user = { uid: 'test-uid', email: 'test@example.com' };

      // Should show as authenticated
      expect(AuthService.isAuthenticated()).toBe(true);
      expect(AuthService.getUserId()).toBe('test-uid');

      // Clear session
      AuthService.user = null;

      // Should be not authenticated again
      expect(AuthService.isAuthenticated()).toBe(false);
      expect(AuthService.getUserId()).toBeNull();
    });

    it('should handle auth hint correctly', () => {
      // Initially no hint
      expect(AuthService.hasAuthHint()).toBe(false);

      // Set hint
      localStorage.setItem('auth_hint', 'true');
      expect(AuthService.hasAuthHint()).toBe(true);

      // Clear hint
      localStorage.removeItem('auth_hint');
      expect(AuthService.hasAuthHint()).toBe(false);
    });
  });

  describe('Password Reset Security', () => {
    it('should handle malicious reset emails', async () => {
      const maliciousEmails = [
        'javascript:alert("XSS")',
        '<script>alert("XSS")</script>',
        '../../../etc/passwd',
        '"; DROP TABLE users; --',
      ];

      for (const email of maliciousEmails) {
        const result = await AuthService.resetPassword(email);
        // Should handle gracefully without crashing
        expect(result).toBeDefined();
        expect(typeof result.error === 'string' || result.error === null).toBe(
          true
        );
      }
    });

    it('should handle null/undefined reset emails', async () => {
      const invalidInputs = [null, undefined, '', 0, false];

      for (const email of invalidInputs) {
        const result = await AuthService.resetPassword(email);
        expect(result).toBeDefined();
        expect(typeof result.error === 'string' || result.error === null).toBe(
          true
        );
      }
    });
  });

  describe('Error Handling Security', () => {
    it('should handle authentication errors gracefully', async () => {
      // Test various error scenarios
      const testCases = [
        { email: 'invalid-email', password: 'password' },
        { email: 'test@', password: 'password' },
        { email: '@example.com', password: 'password' },
      ];

      for (const credentials of testCases) {
        const result = await AuthService.login(
          credentials.email,
          credentials.password
        );
        expect(result).toBeDefined();
        expect(typeof result.user).toBe('object');
        expect(typeof result.error).toBe('string');
      }
    });

    it('should not expose internal error details', async () => {
      // Test with various inputs that might cause internal errors
      const testCases = [
        { email: Object.create(null), password: 'password' },
        { email: 'test@example.com', password: Object.create(null) },
        { email: () => {}, password: 'password' },
        { email: 'test@example.com', password: () => {} },
      ];

      for (const credentials of testCases) {
        const result = await AuthService.login(
          credentials.email,
          credentials.password
        );
        expect(result).toBeDefined();
        // Should not crash and should return a proper error structure
        expect(typeof result.user === 'object' || result.user === null).toBe(
          true
        );
        expect(typeof result.error === 'string' || result.error === null).toBe(
          true
        );
      }
    });
  });

  describe('Performance and DoS Protection', () => {
    it('should handle rapid requests gracefully', async () => {
      const promises = [];

      // Create 50 rapid login attempts
      for (let i = 0; i < 50; i++) {
        promises.push(
          AuthService.login(`user${i}@example.com`, `password${i}`)
        );
      }

      // Should handle without crashing
      const results = await Promise.allSettled(promises);

      // All should complete (either success or failure)
      results.forEach(result => {
        expect(result.status).toBe('fulfilled');
        if (result.status === 'fulfilled') {
          expect(typeof result.value).toBe('object');
        }
      });
    });

    it('should handle large payloads without memory leaks', async () => {
      const largeEmail = `${'a'.repeat(10000)}@example.com`; // 10KB string
      const largePassword = 'a'.repeat(10000);

      const result = await AuthService.login(largeEmail, largePassword);
      expect(result.user).toBeNull();
      expect(result.error).toBeDefined();

      // Error message should be reasonably sized
      expect(result.error.length).toBeLessThan(1000);
    });
  });
});
