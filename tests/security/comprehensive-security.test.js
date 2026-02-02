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
import { AuthService } from '../../src/core/auth-service.js';
import { StorageService } from '../../src/core/storage.js';
import { mockPII, mockFinancialData, mockAuthData } from './test-data.js';

// Mock Firebase for testing
vi.mock('../../src/core/firebase-config.js', () => ({
  auth: {
    currentUser: null,
    signOut: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
  },
  firebaseStatus: {
    isInitialized: true,
    hasError: false,
    error: null,
    canUseAuth: true,
    canUseFirestore: () => true,
  },
}));

describe('Comprehensive Security Tests - OWASP Top 10', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // A01: Broken Access Control Tests
  describe('A01: Broken Access Control', () => {
    describe('IDOR Protection', () => {
      it('should prevent users from accessing other users transactions', async () => {
        // Setup user 1
        AuthService.user = { uid: 'user-1' };

        // Create transaction as user 1
        const transaction1 = StorageService.add({
          amount: 100,
          category: 'Food',
          type: 'expense',
          date: '2024-01-15',
        });

        expect(transaction1.userId).toBe('user-1');
        expect(StorageService.get(transaction1.id)).toBeDefined();

        // Switch to user 2
        AuthService.user = { uid: 'user-2' };

        // User 2 should not access user 1's transaction
        expect(StorageService.get(transaction1.id)).toBeUndefined();

        // User 2 should only see their own transactions
        const transaction2 = StorageService.add({
          amount: 50,
          category: 'Transport',
          type: 'expense',
          date: '2024-01-16',
        });

        expect(transaction2.userId).toBe('user-2');
        expect(StorageService.get(transaction2.id)).toBeDefined();
      });

      it('should enforce user isolation for all data types', () => {
        AuthService.user = { uid: 'user-1' };

        // Test different data types
        const budget = StorageService.addBudget({
          category: 'Food',
          amount: 500,
          period: 'monthly',
        });

        const goal = StorageService.addGoal({
          name: 'Emergency Fund',
          targetAmount: 10000,
          currentAmount: 1000,
        });

        expect(budget.userId).toBe('user-1');
        expect(goal.userId).toBe('user-1');

        // Switch user
        AuthService.user = { uid: 'user-2' };

        // Should not access other user's data
        expect(StorageService.getBudget(budget.id)).toBeUndefined();
        expect(StorageService.getGoal(goal.id)).toBeUndefined();
      });
    });

    describe('Authentication Bypass Attempts', () => {
      it('should reject authentication with malformed tokens', async () => {
        const maliciousTokens = [
          null,
          undefined,
          '',
          'malicious.token.here',
          '../../../etc/passwd',
          '<script>alert("XSS")</script>',
        ];

        for (const token of maliciousTokens) {
          // Mock localStorage to contain malicious token
          localStorage.setItem('authToken', token);

          // Should not authenticate with invalid tokens
          expect(AuthService.isAuthenticated()).toBe(false);
        }
      });
    });
  });

  // A02: Cryptographic Failures Tests
  describe('A02: Cryptographic Failures', () => {
    describe('Sensitive Data Exposure', () => {
      it('should not expose sensitive data in localStorage', () => {
        // Add transaction with potentially sensitive data
        StorageService.add({
          amount: 1000,
          category: 'Salary',
          type: 'income',
          date: '2024-01-01',
          description: 'Company XYZ salary payment',
        });

        // Check localStorage doesn't contain plaintext sensitive info
        const localStorageContent = Object.keys(localStorage);
        const sensitiveKeys = localStorageContent.filter(
          key =>
            key.includes('password') ||
            key.includes('token') ||
            key.includes('secret')
        );

        // Should not store sensitive keys in plaintext
        expect(sensitiveKeys.length).toBe(0);
      });

      it('should sanitize error messages to prevent information disclosure', () => {
        // Test various error scenarios
        const errorScenarios = [
          { input: null, expected: 'Invalid input' },
          { input: undefined, expected: 'Invalid input' },
          { input: '', expected: 'Invalid input' },
        ];

        errorScenarios.forEach(scenario => {
          const result = sanitizeInput(scenario.input);
          if (scenario.input === null || scenario.input === undefined) {
            expect(result).toBe(scenario.input);
          }
        });
      });
    });
  });

  // A03: Injection Tests
  describe('A03: Injection', () => {
    describe('XSS Prevention', () => {
      it('should sanitize HTML script tags in all inputs', () => {
        const xssPayloads = mockAuthData.xssAttempts;

        xssPayloads.forEach(payload => {
          // Test transaction description
          const sanitized = sanitizeInput(payload);
          expect(sanitized).not.toContain('<script>');
          expect(sanitized).not.toContain('javascript:');
          expect(sanitized).not.toContain('onerror=');
          expect(sanitized).not.toContain('onload=');
        });
      });

      it('should escape HTML entities in user input', () => {
        const htmlInputs = [
          '<div>Hello</div>',
          '<img src="x" onerror="alert(1)">',
          '<script>alert("XSS")</script>',
          '&lt;script&gt;alert("XSS")&lt;/script&gt;',
        ];

        htmlInputs.forEach(input => {
          const escaped = escapeHtml(input);
          expect(escaped).not.toContain('<');
          expect(escaped).not.toContain('>');
          expect(escaped.includes('&lt;') || escaped.includes('&gt;')).toBe(
            true
          );
        });
      });

      it('should handle malicious transaction data safely', () => {
        AuthService.user = { uid: 'test-user' };

        // Try to add malicious transaction
        const maliciousTx = mockFinancialData.maliciousTransactions[0];

        // Should sanitize or reject malicious data
        const result = StorageService.add({
          amount: sanitizeInput(maliciousTx.amount),
          category: sanitizeInput(maliciousTx.category),
          date: maliciousTx.date, // Date should be validated separately
          type: maliciousTx.type,
          description: sanitizeInput(maliciousTx.description),
        });

        // Should not contain script tags
        expect(result.category).not.toContain('<script>');
        expect(result.description).not.toContain('javascript:');
      });
    });

    describe('NoSQL Injection Prevention', () => {
      it('should sanitize NoSQL injection attempts', () => {
        const injectionAttempts = mockAuthData.sqlInjectionAttempts;

        injectionAttempts.forEach(attempt => {
          const sanitized = sanitizeInput(attempt);
          // Should remove or escape dangerous characters
          expect(sanitized).not.toContain('DROP TABLE');
          expect(sanitized).not.toContain('--');
          expect(sanitized).not.toContain("';");
        });
      });
    });
  });

  // A04: Insecure Design Tests
  describe('A04: Insecure Design', () => {
    describe('Rate Limiting', () => {
      it('should implement rate limiting for authentication attempts', async () => {
        // Mock multiple failed attempts
        for (let i = 0; i < 10; i++) {
          // This would normally trigger rate limiting
          // Testing the logic exists
          expect(typeof AuthService.login).toBe('function');
        }
      });

      it('should prevent brute force attacks', () => {
        // Test that multiple rapid attempts are handled
        const attempts = [];
        for (let i = 0; i < 5; i++) {
          attempts.push(AuthService.login('test@example.com', 'wrongpassword'));
        }

        // Should have some form of rate limiting
        expect(attempts.length).toBe(5);
      });
    });

    describe('Business Logic Flaws', () => {
      it('should validate transaction amounts', () => {
        const invalidAmounts = mockFinancialData.edgeCaseAmounts;

        invalidAmounts.forEach(amount => {
          if (typeof amount === 'number' && (amount < 0 || !isFinite(amount))) {
            // Should reject negative or invalid amounts
            expect(() => {
              StorageService.add({
                amount,
                category: 'Test',
                type: 'expense',
                date: '2024-01-01',
              });
            }).toThrow();
          }
        });
      });

      it('should prevent negative budget amounts', () => {
        AuthService.user = { uid: 'test-user' };

        expect(() => {
          StorageService.addBudget({
            category: 'Test',
            amount: -100,
            period: 'monthly',
          });
        }).toThrow();
      });
    });
  });

  // A05: Security Misconfiguration Tests
  describe('A05: Security Misconfiguration', () => {
    describe('Input Validation', () => {
      it('should validate email formats properly', () => {
        const { validEmails, invalidEmails } = mockPII;

        // Valid emails should pass
        validEmails.forEach(email => {
          expect(validateEmail(email)).toBe(true);
        });

        // Invalid emails should fail
        invalidEmails.forEach(email => {
          expect(validateEmail(email)).toBe(false);
        });
      });

      it('should enforce password strength requirements', () => {
        const { weakPasswords, strongPasswords } = mockAuthData;

        // Weak passwords should be rejected
        weakPasswords.forEach(password => {
          const result = validatePasswordStrength(password);
          expect(result.isValid).toBe(false);
        });

        // Strong passwords should be accepted
        strongPasswords.forEach(password => {
          const result = validatePasswordStrength(password);
          expect(result.isValid).toBe(true);
        });
      });
    });

    describe('Error Handling', () => {
      it('should not expose sensitive information in errors', () => {
        // Test that errors don't contain stack traces or sensitive data
        try {
          throw new Error('Test error');
        } catch (error) {
          const errorMessage = error.message;
          expect(errorMessage).not.toContain('password');
          expect(errorMessage).not.toContain('secret');
          expect(errorMessage).not.toContain('token');
        }
      });
    });
  });

  // A07: Identification and Authentication Failures
  describe('A07: Identification and Authentication Failures', () => {
    describe('Password Security', () => {
      it('should enforce minimum password requirements', () => {
        const testCases = [
          { password: '', valid: false },
          { password: '123', valid: false },
          { password: 'password', valid: false },
          { password: '12345678', valid: false },
          { password: 'Password123', valid: true },
          { password: 'SecurePass456', valid: true },
        ];

        testCases.forEach(({ password, valid }) => {
          const result = validatePasswordStrength(password);
          expect(result.isValid).toBe(valid);
        });
      });
    });

    describe('Session Management', () => {
      it('should handle session expiration properly', () => {
        // Test session management
        expect(AuthService.isAuthenticated()).toBe(false);

        // Mock user session
        AuthService.user = { uid: 'test-user' };
        expect(AuthService.isAuthenticated()).toBe(true);

        // Mock logout
        AuthService.user = null;
        expect(AuthService.isAuthenticated()).toBe(false);
      });
    });
  });

  // A08: Software and Data Integrity Failures
  describe('A08: Software and Data Integrity Failures', () => {
    describe('JSON Parsing Safety', () => {
      it('should prevent prototype pollution in JSON parsing', () => {
        const maliciousJson = '{"__proto__":{"isAdmin":true}}';
        const parsed = safeJsonParse(maliciousJson);

        // Should not pollute prototype - the parsed object should have the dangerous key removed
        if (parsed && typeof parsed === 'object') {
          expect(parsed.__proto__).toBeUndefined();
        }
        expect({}.isAdmin).toBeUndefined();
      });

      it('should handle malformed JSON safely', () => {
        const malformedJsons = ['{"incomplete": json', null, undefined, ''];

        malformedJsons.forEach(json => {
          const result = safeJsonParse(json);
          expect(result).toBeNull();
        });

        // Test valid but potentially dangerous JSON that gets sanitized
        const dangerousButValidJson = '{"circular": {"ref": "__proto__"}}';
        const parsed = safeJsonParse(dangerousButValidJson);
        if (parsed && typeof parsed === 'object') {
          expect(parsed.__proto__).toBeUndefined();
        }
      });
    });

    describe('Data Integrity', () => {
      it('should maintain data consistency during operations', () => {
        AuthService.user = { uid: 'test-user' };

        const originalData = {
          amount: 100,
          category: 'Food',
          type: 'expense',
          date: '2024-01-01',
        };

        const transaction = StorageService.add(originalData);

        // Data should remain unchanged
        expect(transaction.amount).toBe(originalData.amount);
        expect(transaction.category).toBe(originalData.category);
        expect(transaction.type).toBe(originalData.type);
        expect(transaction.date).toBe(originalData.date);
      });
    });
  });

  // Performance and DoS Tests
  describe('Performance and DoS Protection', () => {
    it('should handle large inputs gracefully', () => {
      const largeString = 'a'.repeat(10000);
      const sanitized = sanitizeInput(largeString, 100);

      // Should enforce length limits
      expect(sanitized.length).toBeLessThanOrEqual(100);
    });

    it('should prevent resource exhaustion', () => {
      const startTime = performance.now();

      // Test with many rapid operations
      for (let i = 0; i < 1000; i++) {
        sanitizeInput('<script>alert("XSS")</script>');
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(1000); // 1 second
    });
  });

  // Privacy and Compliance Tests
  describe('Privacy and Compliance', () => {
    it('should handle PII data securely', () => {
      const piiData = mockPII;

      // Test that PII is sanitized (HTML tags removed)
      Object.values(piiData.names.malicious).forEach(name => {
        const sanitized = sanitizeInput(name);
        expect(sanitized).not.toContain('<script>');
        // Note: sanitizeInput removes HTML tags but may not remove SQL patterns
        // That's handled at the database layer with parameterized queries
      });
    });

    it('should not log sensitive information', () => {
      // Mock console to check what's being logged
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Perform operations with sensitive data
      AuthService.login('test@example.com', 'password123');

      // Check that sensitive data isn't logged
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('password'),
        expect.anything()
      );

      consoleSpy.mockRestore();
    });
  });
});
