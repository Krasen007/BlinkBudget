/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sanitizeInput, validatePasswordStrength } from '../src/utils/security-utils';
import { Router } from '../src/core/router';

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
