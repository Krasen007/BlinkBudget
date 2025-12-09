// tests/main.test.js
import { describe, it, expect } from 'vitest';

describe('BlinkBudget Core', () => {
    it('should be able to run tests', () => {
        expect(true).toBe(true);
    });

    it('should be able to use DOM', () => {
        document.body.innerHTML = '<div id="app"></div>';
        const app = document.querySelector('#app');
        expect(app).toBeTruthy();
    });
});
