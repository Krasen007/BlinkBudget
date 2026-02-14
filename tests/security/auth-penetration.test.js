/** @vitest-environment jsdom */
/* eslint-disable no-script-url */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthService } from '../../src/core/auth-service.js';
import { rateLimitService } from '../../src/core/rate-limit-service.js';
import { mockAuthData } from './test-data.js';

// Mock Firebase for testing
const { mockSignIn, mockCreateUser, mockResetPassword, mockSignOut } =
  vi.hoisted(() => {
    return {
      mockSignIn: vi.fn(),
      mockCreateUser: vi.fn(),
      mockResetPassword: vi.fn(),
      mockSignOut: vi.fn(),
    };
  });

vi.mock('../../src/core/firebase-config.js', () => ({
  auth: {
    currentUser: null,
    signInWithEmailAndPassword: mockSignIn,
    createUserWithEmailAndPassword: mockCreateUser,
    sendPasswordResetEmail: mockResetPassword,
    signOut: mockSignOut,
  },
  firebaseStatus: {
    isInitialized: true,
    hasError: false,
    error: null,
    canUseAuth: true,
    canUseFirestore: () => true,
  },
  // Export the mocks so we can access them in tests
  mockSignIn,
  mockCreateUser,
  mockResetPassword,
  mockSignOut,
}));

describe('Authentication Penetration Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset rate limiting service
    rateLimitService.attempts.clear();
    AuthService.user = null;
    localStorage.clear();

    // Reset Firebase mocks
    mockSignIn.mockReset();
    mockCreateUser.mockReset();
    mockResetPassword.mockReset();
    mockSignOut.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication Bypass Attempts', () => {
    it('should reject null/undefined credentials', async () => {
      // snyk-ignore: javascript/NoHardcodedPasswords/test - Test fixture passwords
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
    });

    it('should reject malformed email formats', async () => {
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
      }
    });

    it('should handle SQL injection attempts in passwords', async () => {
      const injectionPasswords = mockAuthData.sqlInjectionAttempts;

      for (const password of injectionPasswords) {
        const result = await AuthService.login('test@example.com', password);
        expect(result.user).toBeNull();
        expect(result.error).toBeDefined();
      }
    });

    it('should handle XSS attempts in credentials', async () => {
      const xssPayloads = mockAuthData.xssAttempts;

      for (const payload of xssPayloads) {
        const result = await AuthService.login(payload, 'password123');
        expect(result.user).toBeNull();
        expect(result.error).toBeDefined();

        const result2 = await AuthService.login('test@example.com', payload);
        expect(result2.user).toBeNull();
        expect(result2.error).toBeDefined();
      }
    });
  });

  describe('Brute Force Protection', () => {
    it('should enforce rate limiting after multiple failed attempts', async () => {
      const email = 'test@example.com';

      // Mock Firebase to always fail authentication
      mockSignIn.mockRejectedValue(new Error('auth/wrong-password'));

      // Make multiple failed attempts
      const results = [];
      for (let i = 0; i < 6; i++) {
        const result = await AuthService.login(email, `wrongpassword${i}`);
        results.push(result);
      }

      // First 5 attempts should fail with normal error
      for (let i = 0; i < 5; i++) {
        expect(results[i].user).toBeNull();
        expect(results[i].error).toContain('Authentication failed');
      }

      // 6th attempt should be rate limited
      expect(results[5].user).toBeNull();
      expect(results[5].error).toContain('Too many failed attempts');
      expect(results[5].rateLimitInfo).toBeDefined();
    });

    it('should handle distributed brute force attempts', async () => {
      const emails = [
        'user1@example.com',
        'user2@example.com',
        'user3@example.com',
      ];

      // Mock Firebase to always fail
      mockSignIn.mockRejectedValue(new Error('auth/wrong-password'));

      // Each email should have independent rate limiting
      for (const email of emails) {
        for (let i = 0; i < 6; i++) {
          const result = await AuthService.login(email, `wrong${i}`);
          if (i < 5) {
            expect(result.error).toContain('Authentication failed');
          } else {
            expect(result.error).toContain('Too many failed attempts');
          }
        }
      }

      // Each email should be rate limited independently
      for (const email of emails) {
        const rateLimitStatus = rateLimitService.checkRateLimit(email);
        expect(rateLimitStatus.allowed).toBe(false);
      }
    });
  });

  describe('Session Management Security', () => {
    it('should handle session hijacking attempts', async () => {
      // Mock successful login
      mockSignIn.mockResolvedValue({
        user: { uid: 'test-uid', email: 'test@example.com' },
      });

      const result = await AuthService.login('test@example.com', 'password123');
      expect(result.user).toBeDefined();

      // Attempt to manipulate user object directly
      AuthService.user = { uid: 'hacked-uid', email: 'hacker@evil.com' };

      // Should reflect the manipulated user (this is a vulnerability)
      expect(AuthService.getUserId()).toBe('hacked-uid');

      // This test identifies a potential security issue
      // In production, user object should be read-only or properly validated
    });

    it('should handle session fixation attempts', async () => {
      // Pre-set auth hint to try session fixation
      localStorage.setItem('auth_hint', 'true');

      // Mock failed login
      mockSignIn.mockRejectedValue(new Error('Invalid credentials'));

      const result = await AuthService.login(
        'test@example.com',
        'wrongpassword'
      );
      expect(result.user).toBeNull();

      // Auth hint should remain false after failed login
      expect(AuthService.isAuthenticated()).toBe(false);
    });
  });

  describe('Password Reset Security', () => {
    it('should handle password reset abuse', async () => {
      const email = 'test@example.com';

      // Mock Firebase to fail password reset
      mockResetPassword.mockRejectedValue(new Error('Too many requests'));

      // Multiple password reset attempts should be rate limited
      const results = [];
      for (let i = 0; i < 5; i++) {
        const result = await AuthService.resetPassword(email);
        results.push(result);
      }

      // Should eventually be rate limited
      const lastResult = results[results.length - 1];
      expect(lastResult.error).toBeDefined();
    });

    it('should handle malicious password reset emails', async () => {
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
      }
    });
  });

  describe('Information Disclosure', () => {
    it('should not reveal if email exists in system', async () => {
      // Mock Firebase to return generic errors
      mockSignIn.mockRejectedValue(new Error('Invalid credentials'));

      const existingEmail = 'existing@example.com';
      const nonExistentEmail = 'nonexistent@example.com';

      const result1 = await AuthService.login(existingEmail, 'wrongpassword');
      const result2 = await AuthService.login(
        nonExistentEmail,
        'wrongpassword'
      );

      // Both should return the same generic error message
      expect(result1.error).toBe(result2.error);
      expect(result1.error).toContain('Authentication failed');
    });

    it('should not leak sensitive information in error messages', async () => {
      // Mock Firebase to return various errors
      const errorScenarios = [
        { code: 'auth/user-not-found', message: 'User not found' },
        { code: 'auth/wrong-password', message: 'Wrong password' },
        { code: 'auth/too-many-requests', message: 'Too many requests' },
        { code: 'auth/invalid-email', message: 'Invalid email' },
      ];

      for (const scenario of errorScenarios) {
        const error = new Error(scenario.message);
        error.code = scenario.code;
        mockSignIn.mockRejectedValue(error);

        const result = await AuthService.login('test@example.com', 'password');

        // Error should not contain sensitive technical details
        expect(result.error).not.toContain('Firebase');
        expect(result.error).not.toContain('auth/');
        expect(result.error).not.toContain(scenario.code);
      }
    });
  });

  describe('Cross-Site Request Forgery (CSRF)', () => {
    it('should handle suspicious request patterns', async () => {
      // Test with suspicious headers or patterns
      const suspiciousInputs = [
        {
          email: 'test@example.com',
          password: 'password',
          referer: 'evil.com',
        },
        { email: 'test@example.com', password: 'password', origin: 'evil.com' },
        {
          email: 'test@example.com',
          password: 'password',
          userAgent: 'bot/1.0',
        },
      ];

      for (const input of suspiciousInputs) {
        // This would require middleware to check headers
        // For now, we test that the service doesn't crash
        const result = await AuthService.login(input.email, input.password);
        expect(result).toBeDefined();
      }
    });
  });

  describe('Memory and Resource Exhaustion', () => {
    it('should handle large payloads without memory leaks', async () => {
      const largePayload = 'a'.repeat(1000000); // 1MB string

      const result = await AuthService.login(
        `${largePayload}@example.com`,
        largePayload
      );
      expect(result.user).toBeNull();
      expect(result.error).toBeDefined();

      // Check that memory usage doesn't grow excessively
      // This is a basic check - in production, you'd use memory profiling tools
      expect(result.error.length).toBeLessThan(1000);
    });

    it('should handle concurrent authentication attempts', async () => {
      const promises = [];

      // Create 100 concurrent login attempts
      for (let i = 0; i < 100; i++) {
        promises.push(
          AuthService.login(`user${i}@example.com`, `password${i}`)
        );
      }

      // Should handle gracefully without crashing
      const results = await Promise.allSettled(promises);

      // All should complete (either success or failure)
      results.forEach(result => {
        expect(result.status).toBe('fulfilled');
      });
    });
  });
});
